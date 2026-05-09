/* GET /api/images/<key>
   Streams an uploaded image from the "images" Blobs store. Long-cached
   because keys are content-hashed and never overwritten. */

import { getStore } from "@netlify/blobs";

export default async function handler(req) {
  const url = new URL(req.url);
  const m = url.pathname.match(/\/api\/images\/(.+)$/) || url.pathname.match(/\/images\/(.+)$/);
  if (!m) return new Response("not found", { status: 404 });

  const key = decodeURIComponent(m[1]);
  if (!/^[A-Za-z0-9._-]+$/.test(key)) {
    return new Response("bad key", { status: 400 });
  }

  const store = getStore({ name: "images" });
  const result = await store.getWithMetadata(key, { type: "stream" });
  if (!result || !result.data) return new Response("not found", { status: 404 });

  const meta = result.metadata || {};
  const mime = meta.mime || guessMimeFromKey(key);

  return new Response(result.data, {
    status: 200,
    headers: {
      "content-type": mime,
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}

function guessMimeFromKey(key) {
  const ext = key.slice(key.lastIndexOf(".")).toLowerCase();
  return ({
    ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
    ".png": "image/png", ".webp": "image/webp",
    ".gif": "image/gif", ".avif": "image/avif",
    ".svg": "image/svg+xml",
  })[ext] || "application/octet-stream";
}
