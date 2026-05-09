import { checkPassword, makeSessionCookie } from "./_auth.js";

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response("method not allowed", { status: 405 });
  }
  let body;
  try { body = await req.json(); }
  catch { return json({ error: "bad request" }, 400); }

  const password = (body && body.password) || "";

  if (!process.env.ADMIN_PASSWORD || !process.env.ADMIN_SECRET) {
    return json({ error: "server not configured", detail: "ADMIN_PASSWORD and ADMIN_SECRET must be set" }, 500);
  }

  if (!checkPassword(password)) {
    return json({ error: "wrong password" }, 401);
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "set-cookie": makeSessionCookie(),
    },
  });
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" },
  });
}
