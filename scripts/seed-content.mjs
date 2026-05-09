/* scripts/seed-content.mjs
   ───────────────────────────────────────────────────────────────────
   Reads the current js/data.js (SRIDHA_DATA) and uploads its contents
   into Netlify Blobs as the initial /api/content payload. Run once
   after the first deploy:

       npm run seed

   Requires NETLIFY_AUTH_TOKEN and NETLIFY_SITE_ID in env (or run via
   `netlify dev` / `netlify env:exec` so the Blobs client picks the
   site context up automatically). */

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { getStore } from "@netlify/blobs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

async function loadDataJs() {
  const path = resolve(ROOT, "js/data.js");
  const text = await readFile(path, "utf8");
  /* The file is `window.SRIDHA_DATA = { ... };`. Extract the object. */
  const m = text.match(/SRIDHA_DATA\s*=\s*({[\s\S]*})\s*;\s*$/);
  if (!m) throw new Error("Couldn't find SRIDHA_DATA assignment in js/data.js");
  /* eslint-disable-next-line no-new-func */
  return new Function("return " + m[1])();
}

async function main() {
  const data = await loadDataJs();
  if (!data || typeof data !== "object") throw new Error("data.js parsed to non-object");

  const store = getStore({ name: "content", consistency: "strong" });

  const existing = await store.get("current", { type: "json" }).catch(() => null);
  if (existing) {
    const force = process.argv.includes("--force");
    if (!force) {
      console.error(
        "Refusing to overwrite existing content in Blobs.\n" +
        "Pass --force to replace it (a snapshot will be saved to history/)."
      );
      process.exit(2);
    }
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    await store.setJSON(`history/${stamp}.json`, existing);
    console.log(`Snapshotted previous content → history/${stamp}.json`);
  }

  await store.setJSON("current", data);
  console.log("Seeded content store with %d top-level keys.", Object.keys(data).length);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
