import { clearSessionCookie } from "./_auth.js";

export default async function handler(req) {
  if (req.method !== "POST") return new Response("method not allowed", { status: 405 });
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "set-cookie": clearSessionCookie(),
    },
  });
}
