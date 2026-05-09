/* POST /api/upload  (multipart/form-data, field name "file")
   ───────────────────────────────────────────────────────────────────
   Stores the uploaded image in the "images" Blobs store under a
   content-hash filename and returns { url } pointing to /api/images/<key>. */

import { getStore } from "@netlify/blobs";
import { createHash } from "node:crypto";
import { requireAuth } from "./_auth.js";

const MAX_BYTES = 12 * 1024 * 1024;   // 12 MB per image
const ALLOWED   = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "image/svg+xml"]);

export default async function handler(req) {
  if (req.method !== "POST") return new Response("method not allowed", { status: 405 });

  const blocked = requireAuth(req);
  if (blocked) return blocked;

  const contentType = req.headers.get("content-type") || "";
  if (!contentType.startsWith("multipart/form-data")) {
    return json({ error: "expected multipart/form-data" }, 400);
  }

  let form;
  try { form = await req.formData(); }
  catch { return json({ error: "could not parse form" }, 400); }

  const file = form.get("file");
  if (!file || typeof file === "string") {
    return json({ error: "missing 'file' field" }, 400);
  }

  const mime = file.type || "application/octet-stream";
  if (!ALLOWED.has(mime)) {
    return json({ error: "unsupported type", mime }, 415);
  }

  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length > MAX_BYTES) {
    return json({ error: "file too large", limit: MAX_BYTES, got: buf.length }, 413);
  }
  if (buf.length === 0) {
    return json({ error: "empty file" }, 400);
  }

  const hash = createHash("sha256").update(buf).digest("hex").slice(0, 16);
  const ext  = extFor(mime);
  const key  = `${hash}${ext}`;

  const store = getStore({ name: "images", consistency: "strong" });
  await store.set(key, buf, { metadata: { mime, size: buf.length, originalName: file.name || "" } });

  return json({
    ok: true,
    url: `/api/images/${key}`,
    key,
    mime,
    size: buf.length,
  }, 200);
}

function extFor(mime) {
  switch (mime) {
    case "image/jpeg":    return ".jpg";
    case "image/png":     return ".png";
    case "image/webp":    return ".webp";
    case "image/gif":     return ".gif";
    case "image/avif":    return ".avif";
    case "image/svg+xml": return ".svg";
    default:              return "";
  }
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" },
  });
}
