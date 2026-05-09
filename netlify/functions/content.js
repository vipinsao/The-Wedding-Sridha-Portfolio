/* GET  /api/content   — public, returns the current portfolio JSON.
   PUT  /api/content   — admin-only, replaces the JSON.
   ───────────────────────────────────────────────────────────────────
   Content lives in Netlify Blobs under store "content", key "current".
   On first request before anything has been seeded, we 404 with a
   helpful hint pointing at npm run seed. */

import { getStore } from "@netlify/blobs";
import { requireAuth } from "./_auth.js";

const STORE_NAME = "content";
const KEY        = "current";
const HISTORY_KEEP = 20;

export default async function handler(req) {
  const store = getStore({ name: STORE_NAME, consistency: "strong" });

  if (req.method === "GET") {
    const data = await store.get(KEY, { type: "json" });
    if (!data) {
      return json({
        error: "not seeded",
        hint:  "Run `npm run seed` once to import the existing data.js into Netlify Blobs."
      }, 404);
    }
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "cache-control": "no-store",
      },
    });
  }

  if (req.method === "PUT") {
    const blocked = requireAuth(req);
    if (blocked) return blocked;

    let payload;
    try { payload = await req.json(); }
    catch { return json({ error: "invalid json body" }, 400); }

    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return json({ error: "expected an object" }, 400);
    }

    /* Snapshot current value into a history key before overwriting,
       so a misclick or bad import is recoverable. */
    try {
      const prev = await store.get(KEY, { type: "json" });
      if (prev) {
        const stamp = new Date().toISOString().replace(/[:.]/g, "-");
        await store.setJSON(`history/${stamp}.json`, prev);
        await pruneHistory(store);
      }
    } catch (e) {
      console.error("history snapshot failed (non-fatal)", e);
    }

    await store.setJSON(KEY, payload);
    return json({ ok: true, savedAt: new Date().toISOString() }, 200);
  }

  return new Response("method not allowed", { status: 405 });
}

async function pruneHistory(store) {
  try {
    const list = await store.list({ prefix: "history/" });
    const keys = (list.blobs || []).map((b) => b.key).sort();
    const excess = keys.length - HISTORY_KEEP;
    if (excess > 0) {
      for (const key of keys.slice(0, excess)) {
        await store.delete(key);
      }
    }
  } catch (e) {
    console.error("prune history failed", e);
  }
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" },
  });
}
