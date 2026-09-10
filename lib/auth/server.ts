import "server-only";
import { createHash, randomBytes, randomUUID, scrypt, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getDatabase, transaction } from "@/lib/db";
import type { PoolClient } from "pg";

const COOKIE_NAME = "finpilot_session";
const SESSION_SECONDS = 60 * 60 * 24 * 30;
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export class AuthError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

// Keep validation and error responses consistent across all four endpoints.
export function authHandler(handler: (request: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    try {
      return await handler(request);
    } catch (error) {
      if (error instanceof AuthError) return json({ error: error.message }, error.status);
      console.error("Auth request failed.");
      return json({ error: "Authentication service unavailable." }, 503);
    }
  };
}

async function credentials(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new AuthError("Invalid JSON body.", 400);
  }
  if (!body || typeof body !== "object" || !("email" in body) || !("password" in body)) {
    throw new AuthError("Email and password are required.", 400);
  }
  if (typeof body.email !== "string" || typeof body.password !== "string") {
    throw new AuthError("Email and password must be strings.", 400);
  }
  const email = body.email.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AuthError("Enter a valid email address.", 400);
  }
  if (body.password.length < 8 || body.password.length > 1024) {
    throw new AuthError("Password must be between 8 and 1024 characters.", 400);
  }
  return { email, password: body.password };
}

function deriveKey(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, { N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 }, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
}

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const key = await deriveKey(password, salt);
  return `scrypt$131072$8$1$${salt}$${key.toString("hex")}`;
}

async function verifyPassword(password: string, stored: string) {
  const [algorithm, n, r, p, salt, hash] = stored.split("$");
  if (algorithm !== "scrypt" || n !== "131072" || r !== "8" || p !== "1" ||
      !/^[a-f0-9]{32}$/.test(salt ?? "") || !/^[a-f0-9]{128}$/.test(hash ?? "")) return false;
  const key = await deriveKey(password, salt);
  return timingSafeEqual(key, Buffer.from(hash, "hex"));
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function requestTokenHash(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  return token && /^[a-f0-9]{64}$/.test(token) ? hashToken(token) : null;
}

type User = { id: string; email: string; created_at: Date };

async function sessionResponse(user: User, status = 200, database: Pick<PoolClient, "query"> = getDatabase()) {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_SECONDS * 1000);
  await database.query(
    "INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)",
    [hashToken(token), user.id, expires],
  );
  const response = json({ user }, status);
  response.cookies.set(COOKIE_NAME, token, { ...cookieOptions, expires, maxAge: SESSION_SECONDS });
  return response;
}

export async function register(request: NextRequest) {
  const { email, password } = await credentials(request);
  const passwordHash = await hashPassword(password);
  return transaction(async (client) => {
    const { rows } = await client.query<User>(
      `INSERT INTO users (id, email, password_hash) VALUES ($1, $2, $3)
       ON CONFLICT (email) DO NOTHING RETURNING id, email, created_at`,
      [randomUUID(), email, passwordHash],
    );
    if (!rows[0]) throw new AuthError("An account with this email already exists.", 409);
    await client.query("INSERT INTO portfolios (user_id) VALUES ($1)", [rows[0].id]);
    return sessionResponse(rows[0], 201, client);
  });
}

export async function login(request: NextRequest) {
  const { email, password } = await credentials(request);
  const { rows } = await getDatabase().query<User & { password_hash: string }>(
    "SELECT id, email, created_at, password_hash FROM users WHERE email = $1", [email],
  );
  const user = rows[0];
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    throw new AuthError("Invalid email or password.", 401);
  }
  return sessionResponse({ id: user.id, email: user.email, created_at: user.created_at });
}

export async function logout(request: NextRequest) {
  const tokenHash = requestTokenHash(request);
  if (tokenHash) await getDatabase().query("DELETE FROM sessions WHERE token_hash = $1", [tokenHash]);
  const response = json({ success: true });
  response.cookies.set(COOKIE_NAME, "", { ...cookieOptions, expires: new Date(0), maxAge: 0 });
  return response;
}

export async function requireUser(request: NextRequest) {
  const tokenHash = requestTokenHash(request);
  if (!tokenHash) throw new AuthError("Not authenticated.", 401);
  const { rows } = await getDatabase().query<User>(
    `SELECT u.id, u.email, u.created_at FROM users u
     JOIN sessions s ON s.user_id = u.id
     WHERE s.token_hash = $1 AND s.expires_at > NOW()`, [tokenHash],
  );
  if (!rows[0]) throw new AuthError("Not authenticated.", 401);
  return rows[0];
}

export async function me(request: NextRequest) {
  return json({ user: await requireUser(request) });
}
