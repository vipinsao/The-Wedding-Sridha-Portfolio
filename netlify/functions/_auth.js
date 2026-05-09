/* Shared auth helper for admin endpoints.
   ───────────────────────────────────────────────────────────────────
   We use a stateless cookie: an HMAC-signed payload "<expiry>.<sig>"
   where <sig> = HMAC-SHA256(<expiry>, ADMIN_SECRET). Any function that
   needs to gate writes calls requireAuth(req); it returns null on success
   or a Response (401) the function should return as-is.
   ─────────────────────────────────────────────────────────────────── */

import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME  = "sridha_admin";
const SESSION_DAYS = 7;

function getSecret() {
  const s = process.env.ADMIN_SECRET;
  if (!s || s.length < 16) {
    throw new Error("ADMIN_SECRET is not set (need a random string ≥ 16 chars)");
  }
  return s;
}

function sign(value, secret) {
  return createHmac("sha256", secret).update(value).digest("hex");
}

export function makeSessionCookie() {
  const expiry = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = String(expiry);
  const sig = sign(payload, getSecret());
  const value = `${payload}.${sig}`;
  const maxAge = SESSION_DAYS * 24 * 60 * 60;
  return `${COOKIE_NAME}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}

function readCookie(req, name) {
  const header = req.headers.get("cookie") || "";
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return rest.join("=");
  }
  return null;
}

export function isAuthed(req) {
  const raw = readCookie(req, COOKIE_NAME);
  if (!raw) return false;
  const dot = raw.lastIndexOf(".");
  if (dot < 0) return false;
  const payload = raw.slice(0, dot);
  const provided = raw.slice(dot + 1);
  let secret;
  try { secret = getSecret(); } catch { return false; }
  const expected = sign(payload, secret);
  if (provided.length !== expected.length) return false;
  let ok;
  try {
    ok = timingSafeEqual(Buffer.from(provided, "hex"), Buffer.from(expected, "hex"));
  } catch { return false; }
  if (!ok) return false;
  const expiry = Number(payload);
  if (!Number.isFinite(expiry) || expiry < Date.now()) return false;
  return true;
}

export function requireAuth(req) {
  if (isAuthed(req)) return null;
  return new Response(JSON.stringify({ error: "unauthorized" }), {
    status: 401,
    headers: { "content-type": "application/json" },
  });
}

export function checkPassword(input) {
  const expected = process.env.ADMIN_PASSWORD || "";
  if (!expected) return false;
  const a = Buffer.from(String(input), "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  try { return timingSafeEqual(a, b); } catch { return false; }
}
