# Deploying to Netlify

The site is now backed by Netlify Functions + Netlify Blobs:

| Endpoint        | What it does                                        |
| --------------- | --------------------------------------------------- |
| `GET  /api/content` | Public — returns the current portfolio JSON.    |
| `PUT  /api/content` | Admin — replaces the JSON. Requires login cookie. |
| `POST /api/login`   | Sets the admin session cookie.                  |
| `POST /api/logout`  | Clears the admin session cookie.                |
| `POST /api/upload`  | Admin — accepts an image file, returns a URL.   |
| `GET  /api/images/<key>` | Public — streams an uploaded image.        |

## First-time setup

1. **Push this repo to GitHub**, then create a new Netlify site from the repo.
2. **Set two env vars** in *Site settings → Environment variables*:
   - `ADMIN_PASSWORD` — the password your editors will type into `admin.html`.
   - `ADMIN_SECRET` — any random string, ≥ 32 chars. Used to sign session cookies.
   Generate one locally with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
3. **Deploy** the site. Netlify will install dependencies and bundle the functions automatically.
4. **Seed the initial content**. Either:
   - Visit `https://yoursite.netlify.app/` once — `js/content-loader.js` falls back to the bundled `js/data.js` so the public site immediately works. Then open `admin.html`, log in, make any tiny edit (it triggers a full PUT) — that publishes the current content to Blobs.
   - …or run `npm run seed` locally with the Netlify CLI configured (`netlify link` first, so the Blobs client knows which site to write to).

## Day-to-day

- Open `admin.html`, log in, edit. Saves are debounced and pushed to `/api/content` automatically — visitors see new content within seconds (their content-loader cache revalidates on the next page view).
- Click **Upload** next to any image URL field to upload a file directly. The button appears beside every photo URL, brand logo, etc.
- **Export data.js** still works as a backup download.
- **Reset** now means "discard local edits and reload the published version from the server."

## Versioning / recovery

Every PUT writes a snapshot of the previous content to `history/<timestamp>.json` in the same Blobs store before overwriting `current`. The 20 most recent snapshots are kept. (No UI for browsing them yet — restore via the Netlify CLI: `netlify blobs:get content history/<timestamp>.json`.)

## Local development

```bash
npm install
netlify dev          # serves the site + functions on http://localhost:8888
```

Set `ADMIN_PASSWORD` / `ADMIN_SECRET` in a `.env` file (gitignored) so login works locally.
