import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire, Module } from "node:module";
import { dirname, resolve } from "node:path";
import ts from "typescript";
import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";
import { gzipSync } from "node:zlib";

const modules = new Map();
const overrides = new Map();
function load(relative) {
  const filename = resolve(relative);
  if (modules.has(filename)) return modules.get(filename).exports;
  const compiled = new Module(filename);
  modules.set(filename, compiled);
  const require = createRequire(filename);
  compiled.require = (name) => {
    if (overrides.has(name)) return overrides.get(name);
    if (name === "server-only") return {};
    if (name.startsWith("@/")) return load(`${name.slice(2)}.ts`);
    if (name.startsWith("./")) return load(resolve(dirname(filename), `${name}.ts`));
    return require(name);
  };
  compiled._compile(ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText, filename);
  return compiled.exports;
}

const { validateUrl, isPublicAddress, safeFetch } = load("lib/news/safe-fetch.ts");
const { parseArticle, sanitizeArticle, extractArticle, publicWebUrl } = load("lib/news/extract.ts");
for (const url of ["file:///etc/passwd", "ftp://reuters.com", "http://localhost", "http://127.1", "http://2130706433", "http://169.254.169.254", "http://10.0.0.1", "http://[::1]", "http://[::ffff:127.0.0.1]", "http://[fc00::1]", "http://[fe80::1]", "https://user:pass@reuters.com", "https://service.internal", "https://reuters.com:1234"]) assert.throws(() => validateUrl(url), url);
for (const ip of ["127.0.0.1", "10.0.0.1", "172.16.1.1", "192.168.1.1", "100.64.0.1", "0.0.0.0", "169.254.1.1", "224.0.0.1", "::1", "::ffff:192.168.1.1", "2001:db8::1", "fc00::1", "fe80::1"]) assert.equal(isPublicAddress(ip), false, ip);
assert.equal(isPublicAddress("8.8.8.8"), true);
assert.equal(publicWebUrl(null, "https://www.cnbc.com/story"), undefined);
await assert.rejects(safeFetch("https://reuters.com.attacker.example/story", AbortSignal.timeout(1000)));
console.log("PASS unsafe URLs, IP encodings/ranges and unsupported hosts rejected");

const paragraph = "Investors assessed quarterly earnings as companies reported stronger revenue and improved operating margins. Analysts discussed economic growth, employment and interest rates, while market participants weighed the outlook for the next quarter. ";
const html = `<html><head><title>Markets assess quarterly earnings</title><meta name="description" content="A market update"><meta property="og:image" content="/photo.jpg"></head><body><nav>Navigation</nav><article><h1>Markets assess quarterly earnings</h1>${Array.from({ length: 8 }, () => `<p>${paragraph.repeat(2)}</p>`).join("")}<script>throw new Error('executed')</script><p><a href="javascript:alert(1)" onclick="alert(2)">Read more</a></p></article><footer>Footer widget</footer></body></html>`;
const parsed = parseArticle(html, "https://www.cnbc.com/story");
assert.equal(parsed.status, "extracted");
assert.equal(parsed.imageUrl, "https://www.cnbc.com/photo.jpg");
assert.doesNotMatch(parsed.contentHtml, /<script|onclick|javascript:|Footer widget|Navigation/);
assert.doesNotMatch(sanitizeArticle('<svg onload="alert(1)"><script>alert(1)</script></svg><iframe src="https://x.com"></iframe><p style="color:red">Safe <a href="https://example.com">link</a><img src=x onerror=alert(1)></p>'), /<svg|<script|<iframe|<img|onerror|onload|style=/);
assert.equal(parseArticle(html.replace('</head>', '<script type="application/ld+json">{"isAccessibleForFree":false}</script></head>'), "https://www.ft.com/content/example").reason, "restricted");
assert.equal(parseArticle(html.replace('</head>', '<meta name="robots" content="nosnippet"></head>'), "https://www.cnbc.com/story").reason, "restricted");
assert.equal(parseArticle("<title>Just a moment</title><p>Verify you are human</p>", "https://www.reuters.com/story").reason, "restricted");
assert.equal(parseArticle("<article><p>Too short</p></article>", "https://www.cnbc.com/story").status, "fallback");
console.log("PASS readable HTML, sanitization, metadata, restrictions and short-content fallback");

// The same promise is shared and failures are cached as well as successes.
const extractModule = load("lib/news/extract.ts");
let calls = 0;
extractModule.extractArticle = async (url) => { calls++; await new Promise((resolve) => setTimeout(resolve, 10)); return { originalUrl: url, resolved: true, status: "fallback", reason: "unavailable" }; };
const { cachedArticle } = load("lib/news/article.ts");
await Promise.all(Array.from({ length: 5 }, () => cachedArticle("https://www.cnbc.com/cache-test")));
await cachedArticle("https://www.cnbc.com/cache-test");
assert.equal(calls, 1);
extractModule.extractArticle = extractArticle;
console.log("PASS concurrent deduplication and negative cache");

// Controlled transport tests exercise the same redirect/size/DNS logic without
// weakening the production allowlist or connecting to private test servers.
let dnsAddresses = [{ address: "8.8.8.8", family: 4 }];
let networkCalls = 0;
let scenario = { status: 200, headers: { "content-type": "text/html" }, body: "<p>OK</p>" };
overrides.set("node:dns/promises", { lookup: async () => dnsAddresses });
overrides.set("node:https", { request: (_url, options, callback) => {
  networkCalls++;
  assert.equal(options.family, 4);
  options.lookup("ignored", {}, (error, address) => { assert.equal(error, null); assert.equal(address, "8.8.8.8"); });
  const request = new EventEmitter();
  request.end = () => queueMicrotask(() => {
    const response = new PassThrough();
    response.statusCode = scenario.status;
    response.headers = scenario.headers;
    callback(response);
    response.end(scenario.body);
  });
  return request;
} });
modules.delete(resolve("lib/news/safe-fetch.ts"));
const controlledFetch = load("lib/news/safe-fetch.ts").safeFetch;
assert.equal((await controlledFetch("https://www.cnbc.com/story", AbortSignal.timeout(1000))).html, "<p>OK</p>");
dnsAddresses = [{ address: "127.0.0.1", family: 4 }];
await assert.rejects(controlledFetch("https://www.cnbc.com/story", AbortSignal.timeout(1000)), /Unsafe DNS/);
assert.equal(networkCalls, 1);
dnsAddresses = [{ address: "8.8.8.8", family: 4 }, { address: "10.0.0.1", family: 4 }];
await assert.rejects(controlledFetch("https://www.cnbc.com/story", AbortSignal.timeout(1000)), /Unsafe DNS/);
dnsAddresses = [{ address: "8.8.8.8", family: 4 }];
scenario = { status: 302, headers: { location: "http://169.254.169.254/latest/meta-data" }, body: "" };
await assert.rejects(controlledFetch("https://www.cnbc.com/story", AbortSignal.timeout(1000)), /Unsafe URL/);
scenario.headers.location = "https://www.cnbc.com/loop";
const beforeLoop = networkCalls;
await assert.rejects(controlledFetch("https://www.cnbc.com/story", AbortSignal.timeout(1000)), /Too many redirects/);
assert.equal(networkCalls - beforeLoop, 6);
scenario = { status: 200, headers: { "content-type": "text/html" }, body: "x".repeat(1025) };
await assert.rejects(controlledFetch("https://www.cnbc.com/story", AbortSignal.timeout(1000), 1024), /too large/);
scenario = { status: 200, headers: { "content-type": "text/html", "content-encoding": "gzip" }, body: gzipSync("x".repeat(5000)) };
await assert.rejects(controlledFetch("https://www.cnbc.com/story", AbortSignal.timeout(1000), 1024), /too large/);
const abort = new AbortController();
abort.abort();
await assert.rejects(controlledFetch("https://www.cnbc.com/story", abort.signal));
overrides.clear();
modules.delete(resolve("lib/news/safe-fetch.ts"));
console.log("PASS pinned DNS, mixed private DNS, redirect SSRF/limit, wire/decompression caps and cancellation");

if (process.argv.includes("--live")) {
  const { getNews } = load("lib/news/feed.ts");
  const feed = await getNews();
  assert.ok(feed.length > 0);
  assert.ok(feed.every((item, i) => !i || Date.parse(feed[i - 1].publishedAt) >= Date.parse(item.publishedAt)));
  console.log(`PASS live Google News feed: ${feed.length} items, newest first`);
  const sources = new Set();
  const sample = feed.filter((item) => {
    if (sources.has(item.source)) return false;
    sources.add(item.source);
    return true;
  }).slice(0, 4);
  for (const item of sample) {
    const result = await extractArticle(item.originalUrl);
    console.log(JSON.stringify({ source: item.source, title: item.title, discoveryUrl: item.originalUrl, ...result, contentHtml: result.contentHtml ? `${result.contentHtml.length} characters` : undefined }));
  }
  for (const url of process.argv.filter((arg) => arg.startsWith("https://"))) {
    const result = await extractArticle(url);
    console.log(JSON.stringify({ testedUrl: url, ...result, contentHtml: result.contentHtml ? `${result.contentHtml.length} characters` : undefined }));
  }
}
