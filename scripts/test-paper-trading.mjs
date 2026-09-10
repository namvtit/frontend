// Run with the usual database environment variables against a local PostgreSQL
// role allowed to CREATE DATABASE. A temporary database is created and removed.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire, Module } from "node:module";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";
import nextEnv from "@next/env";
import pg from "pg";
import ts from "typescript";
import { databaseConfig } from "../lib/db/config.mjs";

nextEnv.loadEnvConfig(process.cwd(), true);
const originalDatabase = process.env.POSTGRES_DB;
const database = `finpilot_test_${randomUUID().replaceAll("-", "")}`;
const admin = new pg.Client(databaseConfig());
const originalFetch = globalThis.fetch;
const modules = new Map();

// Compile only the server modules for Node; no test framework or production
// quote override is needed. Route handlers still use real PostgreSQL sessions.
function load(relative) {
  const filename = resolve(relative);
  if (modules.has(filename)) return modules.get(filename).exports;
  const compiled = new Module(filename);
  modules.set(filename, compiled);
  const require = createRequire(filename);
  compiled.require = (name) => {
    if (name === "server-only") return {};
    if (name === "./config.mjs") return { databaseConfig };
    if (name.startsWith("@/")) {
      const path = name.slice(2);
      return load(path === "lib/db" ? `${path}/index.ts` : `${path}.ts`);
    }
    if (name === "./quote") return load("lib/trading/quote.ts");
    return require(name);
  };
  compiled._compile(ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText, filename);
  return compiled.exports;
}

let db;
try {
  await admin.connect();
  await admin.query(`CREATE DATABASE ${database}`);
  process.env.POSTGRES_DB = database;
  const migrate = () => execFileSync(process.execPath, ["scripts/migrate.mjs"], { env: process.env, stdio: "pipe" });
  migrate();
  migrate();
  db = load("lib/db/index.ts").getDatabase();
  assert.equal((await db.query("SELECT count(*) FROM schema_migrations")).rows[0].count, "2");
  console.log("PASS migrations apply and rerun safely");

  const { NextRequest } = createRequire(import.meta.url)("next/server");
  const auth = load("lib/auth/server.ts");
  const portfolio = load("app/api/portfolio/route.ts");
  const trades = load("app/api/trades/route.ts");
  const request = (path, method = "GET", cookie = "", body) => new NextRequest(`http://localhost${path}`, {
    method, headers: { cookie, "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const register = (email) => auth.authHandler(auth.register)(request("/api/auth/register", "POST", "", {
    email, password: "paper-trading-test-password",
  }));
  const cookieOf = (response) => response.headers.get("set-cookie").split(";")[0];
  const account = await register("trader@example.test");
  assert.equal(account.status, 201);
  const cookie = cookieOf(account);
  const userId = (await account.json()).user.id;
  const other = await register("other@example.test");
  const otherCookie = cookieOf(other);
  const snapshot = async (session = cookie) => (await (await portfolio.GET(request("/api/portfolio", "GET", session))).json()).portfolio;
  const history = async (session = cookie) => (await (await trades.GET(request("/api/trades", "GET", session))).json()).trades;
  assert.equal(Number((await snapshot()).cash), 100000);
  assert.deepEqual((await snapshot()).positions, []);
  assert.equal((await register("trader@example.test")).status, 409);

  await db.query(`CREATE FUNCTION fail_session() RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN RAISE EXCEPTION 'forced session failure'; END $$;
    CREATE TRIGGER fail_session BEFORE INSERT ON sessions FOR EACH ROW EXECUTE FUNCTION fail_session()`);
  assert.equal((await register("rollback@example.test")).status, 503);
  assert.equal((await db.query("SELECT count(*) FROM users WHERE email = 'rollback@example.test'")).rows[0].count, "0");
  await db.query("DROP TRIGGER fail_session ON sessions; DROP FUNCTION fail_session()");
  console.log("PASS registration, starting cash, duplicate account, atomic session failure");

  let quotePrice = 100;
  let quoteCalls = 0;
  let quoteMode = "valid";
  globalThis.fetch = async (url, options) => {
    assert.match(String(url), /^https:\/\/query1.finance.yahoo.com\/v8\/finance\/chart\//);
    assert.equal(options.cache, "no-store");
    quoteCalls++;
    if (quoteMode === "offline") throw new Error("Offline");
    return Response.json({ chart: { result: [{ meta: {
      symbol: quoteMode === "symbol" ? "MSFT" : decodeURIComponent(new URL(url).pathname.split("/").at(-1)),
      currency: quoteMode === "currency" ? "EUR" : "USD", instrumentType: "EQUITY",
      regularMarketPrice: quoteMode === "price" ? 0 : quotePrice,
    } }] } });
  };
  const trade = (side, quantity, session = cookie, extra = {}) => trades.POST(request("/api/trades", "POST", session, {
    symbol: "AAPL", side, quantity, ...extra,
  }));
  for (const [route, method, path] of [[portfolio.GET, "GET", "/api/portfolio"], [trades.GET, "GET", "/api/trades"], [trades.POST, "POST", "/api/trades"]]) {
    assert.equal((await route(request(path, method))).status, 401);
    assert.equal((await route(request(path, method, `finpilot_session=${"a".repeat(64)}`))).status, 401);
  }
  assert.equal(quoteCalls, 0);
  assert.equal((await trade("BUY", 2, cookie, { price: 1, user_id: "ignored" })).status, 201);
  assert.equal(quoteCalls, 1);
  quotePrice = 200;
  assert.equal((await trade("BUY", 2)).status, 201);
  assert.equal(Number((await snapshot()).positions[0].average_cost), 150);
  const beforeFailure = await snapshot();
  assert.equal((await trade("BUY", 1000)).status, 409);
  assert.equal((await trade("SELL", 5)).status, 409);
  assert.deepEqual(await snapshot(), beforeFailure);
  assert.equal((await history()).length, 2);
  assert.equal((await trade("SELL", 1)).status, 201);
  assert.equal(Number((await snapshot()).positions[0].average_cost), 150);
  assert.equal((await trade("SELL", 3)).status, 201);
  assert.deepEqual((await snapshot()).positions, []);
  assert.equal(Number((await snapshot()).cash), 100200);
  assert.equal(Number((await snapshot(otherCookie)).cash), 100000);
  assert.deepEqual(await history(otherCookie), []);
  assert.equal((await trade("SELL", 1, otherCookie)).status, 409);
  console.log("PASS authenticated BUY/SELL, weighted cost, insufficient funds/shares, full exit, ownership");

  for (const quantity of [0, -1, "1", 0.0000001, 1000000001]) assert.equal((await trade("BUY", quantity)).status, 400);
  assert.equal((await trade("HOLD", 1)).status, 400);
  assert.equal((await trade("BUY", 1, cookie, { symbol: "../bad" })).status, 400);
  assert.equal((await trades.POST(new NextRequest("http://localhost/api/trades", {
    method: "POST", headers: { cookie }, body: "{",
  }))).status, 400);
  for (quoteMode of ["offline", "symbol", "currency", "price"]) assert.equal((await trade("BUY", 1)).status, 503);
  quoteMode = "valid";
  assert.equal(Number((await snapshot()).cash), 100200);
  console.log("PASS invalid input and unavailable/invalid quotes leave balances unchanged");

  await db.query(`CREATE FUNCTION fail_trade() RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN RAISE EXCEPTION 'forced history failure'; END $$;
    CREATE TRIGGER fail_trade BEFORE INSERT ON trades FOR EACH ROW EXECUTE FUNCTION fail_trade()`);
  const beforeRollback = await snapshot();
  assert.equal((await trade("BUY", 1)).status, 503);
  assert.deepEqual(await snapshot(), beforeRollback);
  assert.equal((await history()).length, 4);
  await db.query("DROP TRIGGER fail_trade ON trades; DROP FUNCTION fail_trade()");
  quotePrice = 100;
  const purchases = await Promise.all(Array.from({ length: 12 }, () => trade("BUY", 100)));
  assert.equal(purchases.filter((r) => r.status === 201).length, 10);
  assert.equal(purchases.filter((r) => r.status === 409).length, 2);
  assert.equal(Number((await snapshot()).cash), 200);
  assert.equal(Number((await snapshot()).positions[0].quantity), 1000);
  const sales = await Promise.all(Array.from({ length: 12 }, () => trade("SELL", 100)));
  assert.equal(sales.filter((r) => r.status === 201).length, 10);
  assert.equal(sales.filter((r) => r.status === 409).length, 2);
  assert.equal(Number((await snapshot()).cash), 100200);
  assert.deepEqual((await snapshot()).positions, []);
  assert.equal((await history()).length, 24);
  assert.equal((await trade("BUY", 0.000001)).status, 201);
  assert.equal((await trade("SELL", 0.000001)).status, 201);
  assert.equal(Number((await snapshot()).cash), 100200);
  await db.query("UPDATE sessions SET expires_at = NOW() - interval '1 second' WHERE user_id = $1", [userId]);
  assert.equal((await portfolio.GET(request("/api/portfolio", "GET", cookie))).status, 401);
  console.log("PASS failed writes roll back; concurrent BUY/SELL preserve cash, positions, history; fractional quantities; expired sessions");
} finally {
  globalThis.fetch = originalFetch;
  if (db) await db.end();
  process.env.POSTGRES_DB = originalDatabase;
  await admin.query(`DROP DATABASE IF EXISTS ${database} WITH (FORCE)`);
  await admin.end();
}
