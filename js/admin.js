/* The Wedding Sridha — admin editor
   ───────────────────────────────────────────────────────────────────── */

(function () {
  "use strict";

  /* ── Storage keys ──────────────────────────────────────────────────
     STORAGE_KEY  — local draft of unsynced edits (only used if a server
                    save failed; cleared after a successful PUT).
     SESSION_KEY  — flips to "1" after a successful login round-trip;
                    the actual auth is the HTTP-only cookie set by
                    /api/login, this is just a UX hint. */
  const STORAGE_KEY = "sridha:draft";
  const SESSION_KEY = "sridha:admin-ok";

  const $  = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  const DEFAULTS = window.SRIDHA_DATA || {};
  function loadState() {
    /* Start from server-provided data (window.SRIDHA_DATA is set by
       js/content-loader.js before this script runs). If a draft exists
       — meaning a previous save couldn't reach the server — layer it
       on top so we don't lose unsynced edits. */
    const base = JSON.parse(JSON.stringify(DEFAULTS));
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return base;
      return Object.assign(base, JSON.parse(raw));
    } catch (_) { return base; }
  }
  let state = loadState();

  /* ── Tiny utilities ────────────────────────────────────────────────── */
  const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  const escapeHtml = (s) =>
    String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  const escapeAttr = escapeHtml;

  /* ── Password gate ───────────────────────────────────────────────────
     POSTs the password to /api/login. The server checks against the
     ADMIN_PASSWORD env var and (on success) sets an HTTP-only signed
     cookie that gates every PUT/upload call. We can't read the cookie
     from JS, so we mirror the success state in sessionStorage just to
     decide whether to show the modal on reload. */
  function setupLogin() {
    const modal = $("#loginModal");
    if (sessionStorage.getItem(SESSION_KEY) === "1") { modal.classList.add("is-hidden"); return; }
    const form = $("#loginForm"), pwd = $("#loginPwd"), err = $("#loginErr"), btn = form.querySelector("button[type='submit']");
    pwd.focus();
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      err.textContent = " ";
      btn.disabled = true;
      try {
        const res = await fetch("/api/login", {
          method: "POST",
          credentials: "same-origin",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ password: pwd.value }),
        });
        if (res.ok) {
          sessionStorage.setItem(SESSION_KEY, "1");
          modal.classList.add("is-hidden");
        } else if (res.status === 401) {
          err.textContent = "That password didn't match. Try again.";
          pwd.value = ""; pwd.focus();
        } else if (res.status === 500) {
          const info = await res.json().catch(() => ({}));
          err.textContent = info.detail || "Server isn't configured. Set ADMIN_PASSWORD and ADMIN_SECRET on Netlify.";
        } else {
          err.textContent = "Login failed (" + res.status + "). Try again in a moment.";
        }
      } catch (_) {
        err.textContent = "Couldn't reach the server. Are you online?";
      } finally {
        btn.disabled = false;
      }
    });
  }

  /* ── Save + preview reload ─────────────────────────────────────────── */
  function setPillState(label, mode) {
    /* mode: "saving" | "saved" | "error" | "offline" */
    const pill = $("#savedPill");
    if (!pill) return;
    pill.textContent = label;
    pill.classList.toggle("is-on",      mode === "saved");
    pill.classList.toggle("is-saving",  mode === "saving");
    pill.classList.toggle("is-error",   mode === "error" || mode === "offline");
    if (mode === "saved") {
      clearTimeout(setPillState._t);
      setPillState._t = setTimeout(() => pill.classList.remove("is-on"), 1400);
    }
  }

  const reloadPreview = debounce(() => {
    const f = $("#previewFrame");
    if (!f) return;
    f.src = "index.html?t=" + Date.now();
  }, 450);

  /* Server sync. Debounce ~600ms so a flurry of keystrokes is one PUT.
     If the network is down (or the cookie expired), keep the draft in
     localStorage so the next save retries without losing edits. */
  let syncInFlight  = false;
  let syncQueued    = false;
  let lastSyncedJSON = "";

  async function syncNow() {
    if (syncInFlight) { syncQueued = true; return; }
    syncInFlight = true;
    setPillState("Saving…", "saving");
    const snapshot = JSON.stringify(state);
    try {
      const res = await fetch("/api/content", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: snapshot,
      });
      if (res.status === 401) {
        sessionStorage.removeItem(SESSION_KEY);
        setPillState("Session expired", "error");
        $("#loginModal").classList.remove("is-hidden");
        $("#loginPwd").focus();
        return;
      }
      if (!res.ok) {
        setPillState("Save failed (" + res.status + ")", "error");
        return;
      }
      lastSyncedJSON = snapshot;
      try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
      setPillState("Saved", "saved");
    } catch (_) {
      /* Offline — stash a draft so we don't lose work. */
      try { localStorage.setItem(STORAGE_KEY, snapshot); } catch (_) {}
      setPillState("Offline (draft saved)", "offline");
    } finally {
      syncInFlight = false;
      if (syncQueued) { syncQueued = false; syncNow(); }
    }
  }

  const syncDebounced = debounce(syncNow, 600);

  function persist() {
    /* Always keep a draft locally (the debounced sync may not run if
       the user closes the tab in the next 600ms). */
    const json = JSON.stringify(state);
    try { localStorage.setItem(STORAGE_KEY, json); } catch (_) {}
    /* Also write the content-loader's cache key so the iframe preview
       reflects unsaved edits even when /api/content is offline (e.g.
       local Python server, no Netlify Functions). The server PUT below
       is still the source of truth in production. */
    try { localStorage.setItem("sridha:content-cache:v1", json); } catch (_) {}
    reloadPreview();
    syncDebounced();
  }

  /* Back-compat alias for older call sites that just want a "Saved" flash. */
  function flashSaved() { setPillState("Saved", "saved"); }

  /* Best-effort flush on tab close so quick edits don't vanish. */
  window.addEventListener("beforeunload", () => {
    if (JSON.stringify(state) === lastSyncedJSON) return;
    try {
      const blob = new Blob([JSON.stringify(state)], { type: "application/json" });
      navigator.sendBeacon && navigator.sendBeacon("/api/content", blob);
    } catch (_) {}
  });

  /* ── Field helpers ─────────────────────────────────────────────────── */
  function field(label, key, value, opts) {
    opts = opts || {};
    const cls = opts.type === "textarea" ? "textarea" : (opts.type === "select" ? "select" : "input");
    const v = escapeAttr(value || "");
    if (opts.type === "textarea") {
      return `
        <div class="field">
          <label class="field__label">${escapeHtml(label)}</label>
          <textarea class="textarea" data-bind="${escapeAttr(key)}" rows="${opts.rows || 3}"
                    placeholder="${escapeAttr(opts.placeholder || "")}">${escapeHtml(value || "")}</textarea>
        </div>`;
    }
    return `
      <div class="field">
        <label class="field__label">${escapeHtml(label)}</label>
        <input class="input" data-bind="${escapeAttr(key)}" type="${opts.type || "text"}" value="${v}"
               placeholder="${escapeAttr(opts.placeholder || "")}">
      </div>`;
  }
  function row(...fields) { return `<div class="field__row">${fields.join("")}</div>`; }

  function block(key, num, title, bodyHtml, openByDefault) {
    return `
      <div class="card-block${openByDefault ? " is-open" : ""}" data-block="${key}">
        <div class="card-block__head">
          <div class="card-block__title"><span class="num">${num}</span> ${escapeHtml(title)}</div>
          <span class="card-block__chev">▸</span>
        </div>
        <div class="card-block__body">${bodyHtml}</div>
      </div>`;
  }

  /* Generic photo row (for sections).
     Upload-first UX: a big thumbnail + "Upload image" button is the
     primary control. The raw URL input is hidden by default and only
     shown if the user clicks "Paste URL instead" — for the rare case
     of an external Pexels/Unsplash link. */
  function photoRow(sIdx, pIdx, photo) {
    const src = escapeAttr(photo.src || "");
    const thumbStyle = src ? `background-image:url('${src}')` : "";
    const hasPhoto = !!src;
    return `
      <div class="photo-row" data-list-row="sections.${sIdx}.photos.${pIdx}">
        <div class="photo-row__upload">
          <div class="photo-row__thumb${hasPhoto ? "" : " is-empty"}" style="${thumbStyle}">
            ${hasPhoto ? "" : `<span class="photo-row__thumb-icon">📷</span>`}
          </div>
          <button type="button" class="btn--upload-big" data-upload-target="sections.${sIdx}.photos.${pIdx}.src">
            ${hasPhoto ? "↻ Replace image" : "↑ Upload image"}
          </button>
        </div>
        <div class="photo-row__fields">
          <input class="input" type="text" placeholder="Alt text (describe the photo)"
                 data-bind="sections.${sIdx}.photos.${pIdx}.alt" value="${escapeAttr(photo.alt || "")}">
          <input class="input" type="text" placeholder="Caption (optional)"
                 data-bind="sections.${sIdx}.photos.${pIdx}.caption" value="${escapeAttr(photo.caption || "")}">
          <details class="photo-row__url-toggle">
            <summary>Paste URL instead</summary>
            <input class="input src" type="url" placeholder="https://… or images/foo.jpg"
                   data-bind="sections.${sIdx}.photos.${pIdx}.src" value="${src}">
          </details>
        </div>
        <div class="photo-row__ctrls">
          <button data-act="up" title="Move up">↑</button>
          <button data-act="down" title="Move down">↓</button>
          <button data-act="remove" title="Remove">×</button>
        </div>
      </div>`;
  }

  /* Build a single big upload control for a one-off image field
     (hero.photo, about.photo). Returns HTML containing a thumbnail,
     upload button, and a collapsed URL input fallback. */
  function imageUploadField(label, bindKey, currentValue, hint) {
    const src = escapeAttr(currentValue || "");
    const has = !!src;
    return `
      <div class="image-field">
        <label class="field__label">${escapeHtml(label)}</label>
        ${hint ? `<p class="field__hint">${escapeHtml(hint)}</p>` : ""}
        <div class="image-field__inner">
          <div class="image-field__thumb${has ? "" : " is-empty"}" style="${has ? `background-image:url('${src}')` : ""}">
            ${has ? "" : `<span class="image-field__icon">📷</span>`}
          </div>
          <div class="image-field__actions">
            <button type="button" class="btn--upload-big" data-upload-target="${escapeAttr(bindKey)}">
              ${has ? "↻ Replace image" : "↑ Upload image"}
            </button>
            <details class="image-field__url-toggle">
              <summary>Paste URL instead</summary>
              <input class="input" type="url" placeholder="https://… or images/foo.jpg"
                     data-bind="${escapeAttr(bindKey)}" value="${src}">
            </details>
          </div>
        </div>
      </div>`;
  }

  /* Generic list-of-objects row (testimonials, faq) */
  function listObjectRow(path, idx, item, fields) {
    const fieldsHtml = fields.map(f => {
      const tag = f.type === "textarea" ? "textarea" : "input";
      const cls = f.type === "textarea" ? "textarea" : "input";
      const fullPath = `${path}.${idx}.${f.key}`;
      if (tag === "textarea") {
        return `
          <div class="field" style="margin-bottom:8px;">
            <label class="field__label">${escapeHtml(f.label)}</label>
            <textarea class="${cls}" data-bind="${fullPath}" rows="${f.rows || 3}"
                      placeholder="${escapeAttr(f.placeholder || "")}">${escapeHtml(item[f.key] || "")}</textarea>
          </div>`;
      }
      return `
        <div class="field" style="margin-bottom:8px;">
          <label class="field__label">${escapeHtml(f.label)}</label>
          <input class="${cls}" data-bind="${fullPath}" type="text"
                 placeholder="${escapeAttr(f.placeholder || "")}"
                 value="${escapeAttr(item[f.key] || "")}">
        </div>`;
    }).join("");
    return `
      <div class="list-item" data-list-row="${path}.${idx}">
        <div class="list-item__head">
          <span class="list-item__num">${String(idx + 1).padStart(2, "0")}</span>
          <div class="list-item__ctrls">
            <button data-act="up" title="Move up">↑</button>
            <button data-act="down" title="Move down">↓</button>
            <button data-act="remove" title="Remove">×</button>
          </div>
        </div>
        <div class="list-item__body">${fieldsHtml}</div>
      </div>`;
  }

  /* Generic list-of-strings row (press) */
  function listStringRow(path, idx, value) {
    return `
      <div class="string-row" data-list-row="${path}.${idx}">
        <input class="input" type="text" data-bind="${path}.${idx}" value="${escapeAttr(value)}"
               placeholder="Publication name">
        <div class="photo-row__ctrls" style="flex-direction:row;">
          <button data-act="up" title="Move up">↑</button>
          <button data-act="down" title="Move down">↓</button>
          <button data-act="remove" title="Remove">×</button>
        </div>
      </div>`;
  }

  /* ── Section renderers ─────────────────────────────────────────────── */
  function renderBrand() {
    const b = state.brand || (state.brand = {});
    return block("brand", "Brand", "Identity", `
      ${field("Brand name", "brand.name", b.name)}
      ${row(
        field("Mark (loader initials)", "brand.mark", b.mark),
        field("Tagline (used in meta only)", "brand.tagline", b.tagline)
      )}
    `, true);
  }

  /* Dedicated Logo card — visible at the top of the form so it's impossible
     to miss. When set, the logo replaces the text wordmark in the live site's
     top-left corner. */
  function renderLogo() {
    const b = state.brand || (state.brand = {});
    const hasLogo  = !!b.logo;
    const isData   = hasLogo && /^data:/.test(b.logo);
    const sizeKB   = isData ? Math.round(b.logo.length * 0.75 / 1024) : 0;
    const logoMeta = isData ? `${sizeKB} KB embedded` : (hasLogo ? "custom URL" : "");

    return block("logo", "Logo", "Site logo", `
      <p class="form__hint" style="margin-bottom:14px;">Upload your logo to replace the text wordmark in the top-left of your client-facing site. Embedded right into your data.js — no extra hosting needed.</p>

      ${hasLogo ? `
        <div class="logo-preview">
          <div class="logo-preview__viewports">
            <div class="logo-preview__viewport logo-preview__viewport--light">
              <img src="${escapeAttr(b.logo)}" alt="Logo on light background">
              <span class="logo-preview__viewport-label">on cream / scrolled</span>
            </div>
            <div class="logo-preview__viewport logo-preview__viewport--dark">
              <img src="${escapeAttr(b.logo)}" alt="Logo on dark background">
              <span class="logo-preview__viewport-label">over hero photo</span>
            </div>
          </div>
          <div class="logo-preview__meta">
            <span class="logo-preview__name">${escapeHtml(b.name || "Logo")}</span>
            <span class="logo-preview__size">${logoMeta}</span>
            <button type="button" class="font-uploaded__remove" data-act="logo-clear">Remove</button>
          </div>
        </div>
      ` : `
        <div class="logo-empty">No logo uploaded — the brand name shows as text in the top-left of the live site.</div>
      `}
      <label class="font-upload">
        <span class="font-upload__btn">${hasLogo ? "↑ Replace logo" : "↑ Upload logo (PNG, SVG or JPG)"}</span>
        <input type="file" accept="image/png,image/svg+xml,image/jpeg,image/webp" data-logo-upload>
      </label>
      <div class="font-custom__hint" style="margin-top:8px;">
        Best at <strong>2× display size</strong> (e.g. 400 px wide for a 200 px logo). Transparent PNG or SVG looks cleanest. Dark logos auto-invert to white over the dark hero photo.
      </div>
    `, true);
  }

  /* Live-update the preview swatch + hex labels in the Theme card without
     re-rendering the whole form (which would lose color-picker focus). */
  function updateThemePreviewSwatch() {
    const t = state.theme || {};
    const bg = t.bg || "#D8E8E0";
    const ink = t.ink || "#2A4F44";
    const preview = $("[data-theme-preview]");
    if (preview) {
      preview.style.background = bg;
      preview.style.color = ink;
      preview.style.borderColor = ink;
      const eyebrow = preview.querySelector(".theme-preview__eyebrow");
      if (eyebrow) eyebrow.style.color = ink;
      const btn = preview.querySelector(".theme-preview__btn");
      if (btn) { btn.style.background = ink; btn.style.color = bg; }
    }
    const bgHex = $('[data-theme-hex="bg"]');
    if (bgHex) bgHex.textContent = bg.toUpperCase();
    const inkHex = $('[data-theme-hex="ink"]');
    if (inkHex) inkHex.textContent = ink.toUpperCase();
  }

  /* Theme colors — two pickers (light bg + dark accent) + presets.
     Both values live in state.theme.{bg,ink}; if absent, the site uses
     its baked-in CSS defaults. */
  function renderTheme() {
    const t = state.theme || {};
    const bg  = t.bg  || "#D8E8E0";
    const ink = t.ink || "#2A4F44";
    /* Six curated palettes the user can one-click apply, then tweak. */
    const presets = [
      { name: "Sage & Forest",     bg: "#D8E8E0", ink: "#2A4F44" },
      { name: "Cream & Maroon",    bg: "#F5F0E8", ink: "#A8362F" },
      { name: "Linen & Espresso",  bg: "#F2EAE3", ink: "#3E2723" },
      { name: "Sand & Navy",       bg: "#E8DDD0", ink: "#1A2E45" },
      { name: "Bone & Rust",       bg: "#EFE6DC", ink: "#7C3F00" },
      { name: "Stone & Olive",     bg: "#EAE6DC", ink: "#4F5239" }
    ];
    const presetButtons = presets.map((p) => `
      <button type="button" class="theme-preset" data-theme-preset='${escapeAttr(JSON.stringify({bg:p.bg, ink:p.ink}))}'
              style="background:${p.bg};color:${p.ink};border-color:${p.ink};">
        <span class="theme-preset__dot" style="background:${p.ink};border-color:${p.ink};"></span>
        ${escapeHtml(p.name)}
      </button>`).join("");

    return block("theme", "Color", "Theme colors", `
      <p class="form__hint" style="margin-bottom:16px;">
        Pick two colors — a light <b>background</b> and a dark <b>accent</b>. Every surface, text shade,
        button, and link recolors live across the whole site.
      </p>

      <div class="theme-pickers">
        <label class="theme-picker">
          <span class="theme-picker__label">Background <span class="theme-picker__sub">(light)</span></span>
          <span class="theme-picker__row">
            <input type="color" data-theme-input="bg" value="${escapeAttr(bg)}">
            <span class="theme-picker__hex" data-theme-hex="bg">${escapeHtml(bg.toUpperCase())}</span>
          </span>
        </label>
        <label class="theme-picker">
          <span class="theme-picker__label">Accent / leaf <span class="theme-picker__sub">(dark)</span></span>
          <span class="theme-picker__row">
            <input type="color" data-theme-input="ink" value="${escapeAttr(ink)}">
            <span class="theme-picker__hex" data-theme-hex="ink">${escapeHtml(ink.toUpperCase())}</span>
          </span>
        </label>
      </div>

      <div class="theme-preview" data-theme-preview style="background:${escapeAttr(bg)};color:${escapeAttr(ink)};border-color:${escapeAttr(ink)};">
        <span class="theme-preview__eyebrow" style="color:${escapeAttr(ink)};">Eyebrow text</span>
        <span class="theme-preview__title">Sample headline</span>
        <span class="theme-preview__btn" style="background:${escapeAttr(ink)};color:${escapeAttr(bg)};">Begin a Conversation</span>
      </div>

      <label class="field__label" style="margin-top:18px;">Quick presets</label>
      <div class="theme-presets">${presetButtons}</div>

      <div class="theme-actions">
        <button type="button" class="btn btn--ghost" data-theme-reset>Reset to default</button>
      </div>
    `);
  }

  function renderFonts() {
    const fonts = state.fonts || (state.fonts = {});
    const slotInfo = {
      display: { label: "Display",   desc: "hero wordmark, loader, biggest moments" },
      serif:   { label: "Serif",     desc: "section titles, italic accents, captions" },
      sans:    { label: "Sans",      desc: "body, UI, labels, buttons" }
    };
    const slots = ["display", "serif", "sans"];
    const catalog = window.SRIDHA_FONTS || { display: [], serif: [], sans: [] };

    const previewLine = {
      display: "Sridha · The Wedding",
      serif:   "Aanya & Rohan · Udaipur",
      sans:    "Bookings open for the season"
    };

    const body = slots.map((slot) => {
      const current  = fonts[slot] || {};
      const opts     = catalog[slot] || [];
      const matchIdx = opts.findIndex((f) => (f.family || "").toLowerCase() === (current.family || "").toLowerCase());
      const isUploaded = !!(current.url && /^data:/.test(current.url));
      const isCustomUrl = !!(current.url && /^https?:\/\//.test(current.url) && matchIdx === -1);
      const sizeKB = isUploaded ? Math.round(current.url.length * 0.75 / 1024) : 0;

      const options = opts.map((f, i) =>
        `<option value="${i}" data-family="${escapeAttr(f.family)}" data-url="${escapeAttr(f.url)}"
                 ${(matchIdx === i && !isUploaded && !isCustomUrl) ? " selected" : ""}>${escapeHtml(f.family)}</option>`
      ).join("");

      /* The whole UI: a label, ONE control (dropdown OR uploaded badge),
         an always-visible upload button, and a live preview. That's it. */
      return `
        <div class="font-slot" data-font-slot-row="${slot}">
          <div class="font-slot__label">
            <strong>${escapeHtml(slotInfo[slot].label)}</strong>
            <span class="font-slot__desc">${escapeHtml(slotInfo[slot].desc)}</span>
          </div>

          ${(isUploaded || isCustomUrl) ? `
            <div class="font-uploaded">
              <span class="font-uploaded__check">✓</span>
              <span class="font-uploaded__text">
                ${escapeHtml(current.family || "Custom font")}
                ${isUploaded ? ` · ${sizeKB} KB embedded` : " · custom URL"}
              </span>
              <button type="button" class="font-uploaded__remove" data-act="font-clear" data-slot="${slot}">Remove</button>
            </div>
          ` : `
            <select class="select font-select" data-font-slot="${slot}">${options}</select>
          `}

          <label class="font-upload">
            <span class="font-upload__btn">${(isUploaded || isCustomUrl) ? "↑ Replace with another file" : "↑ Or upload your own (.ttf / .otf / .woff)"}</span>
            <input type="file" accept=".ttf,.otf,.woff,.woff2,font/*,application/octet-stream" data-font-upload="${slot}">
          </label>

          <div class="font-preview" data-font-preview="${slot}"
               style="font-family: '${escapeAttr(current.family || "")}', ${slot === "sans" ? "sans-serif" : "serif"};">
            ${escapeHtml(previewLine[slot])}
          </div>
        </div>`;
    }).join("");

    /* Inject the catalog font URLs once so the preview text actually renders
       in those fonts in the admin sidebar. */
    setTimeout(injectCatalogFontsForPreview, 0);

    return block("fonts", "Type", "Typography", body);
  }

  /* For the admin's preview text only — load every catalog font URL so the
     dropdown options and previews render in their actual face. Idempotent. */
  function injectCatalogFontsForPreview() {
    if (injectCatalogFontsForPreview._done) return;
    const cat = window.SRIDHA_FONTS || {};
    const urls = new Set();
    ["display", "serif", "sans"].forEach((s) => (cat[s] || []).forEach((f) => f.url && urls.add(f.url)));
    urls.forEach((u) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = u;
      link.setAttribute("data-admin-font-preview", "1");
      document.head.appendChild(link);
    });
    injectCatalogFontsForPreview._done = true;
  }

  /* Detect what kind of font URL this is */
  function isFontFileUrl(u) {
    if (!u) return false;
    if (/^data:(font|application\/(x-)?font|application\/vnd\.ms-fontobject)/i.test(u)) return true;
    return /\.(ttf|otf|woff2?|eot)(\?|#|$)/i.test(u);
  }
  function fontFormat(u) {
    if (/\.woff2|font\/woff2/i.test(u)) return "woff2";
    if (/\.woff(\?|#|$)|font\/woff(?!2)/i.test(u)) return "woff";
    if (/\.otf|font\/otf|font\/opentype/i.test(u)) return "opentype";
    if (/\.eot|vnd\.ms-fontobject/i.test(u)) return "embedded-opentype";
    return "truetype";
  }

  /* Inject the user's currently-chosen fonts into the admin page so the
     previews and form text render in those faces. Called on boot and after
     any font change. */
  function injectActiveFontsForPreview() {
    const fonts = state.fonts || {};
    ["display", "serif", "sans"].forEach((slot) => {
      const f = fonts[slot] || {};
      document.head.querySelectorAll(`[data-admin-runtime-font="${slot}"]`).forEach((n) => n.remove());
      if (!f.url) return;
      if (isFontFileUrl(f.url)) {
        const style = document.createElement("style");
        style.setAttribute("data-admin-runtime-font", slot);
        const family = (f.family || "Custom").replace(/"/g, "");
        style.textContent =
          `@font-face { font-family: "${family}"; ` +
          `src: url("${f.url}") format("${fontFormat(f.url)}"); ` +
          `font-display: swap; }`;
        document.head.appendChild(style);
      } else if (/^https?:\/\//.test(f.url)) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = f.url;
        link.setAttribute("data-admin-runtime-font", slot);
        document.head.appendChild(link);
      }
    });
  }

  function renderHero() {
    const h = state.hero || (state.hero = {});
    return block("hero", "Hero", "Opening panel", `
      ${imageUploadField("Hero photo (full-bleed background)", "hero.photo", h.photo,
        "The big photo behind your title — landscape works best.")}
      ${field("Eyebrow (small caps above wordmark)", "hero.eyebrow", h.eyebrow)}
      ${field("Headline / tagline", "hero.title", h.title, { type: "textarea", rows: 2 })}
      ${field("Body line", "hero.body", h.body, { type: "textarea", rows: 2 })}
      ${row(
        field("CTA button text", "hero.ctaText", h.ctaText),
        field("CTA link target", "hero.ctaHref", h.ctaHref, { placeholder: "#contact" })
      )}
    `);
  }

  function renderAbout() {
    const a = state.about || (state.about = {});
    return block("about", "About", "Behind the lens", `
      ${imageUploadField("Portrait / signature photo", "about.photo", a.photo,
        "Your photo for the About section — portrait orientation looks best.")}
      ${field("Eyebrow", "about.eyebrow", a.eyebrow)}
      ${field("Title (e.g. Hello, I'm Sridha.)", "about.title", a.title)}
      ${field("Body — your bio in 3–4 sentences", "about.body", a.body, { type: "textarea", rows: 5 })}
      ${field("Signature line (e.g. — S.)", "about.signature", a.signature)}
    `);
  }

  function renderStoriesIntro() {
    const s = state.storiesIntro || (state.storiesIntro = {});
    return block("storiesIntro", "Lead", "Stories intro", `
      ${field("Eyebrow", "storiesIntro.eyebrow", s.eyebrow)}
      ${field("Title", "storiesIntro.title", s.title)}
      ${field("Body", "storiesIntro.body", s.body, { type: "textarea", rows: 3 })}
    `);
  }

  function renderSection(s, idx) {
    const photoRows = (s.photos || []).map((p, i) => photoRow(idx, i, p)).join("");
    const num = escapeHtml(s.number || String(idx + 1).padStart(2, "0"));
    const title = escapeHtml(s.title || "Untitled section");
    const last = (state.sections || []).length - 1;
    return `
      <div class="card-block" data-block="section" data-sidx="${idx}">
        <div class="card-block__head">
          <div class="card-block__title">
            <span class="num">${num}</span>
            ${title}
          </div>
          <div class="card-block__head-actions">
            <button class="head-btn" type="button" data-act="section-up"     data-sidx="${idx}" title="Move section up"     ${idx === 0 ? "disabled" : ""}>↑</button>
            <button class="head-btn" type="button" data-act="section-down"   data-sidx="${idx}" title="Move section down"   ${idx === last ? "disabled" : ""}>↓</button>
            <button class="head-btn head-btn--danger" type="button" data-act="section-remove" data-sidx="${idx}" title="Remove section">×</button>
            <span class="card-block__chev">▸</span>
          </div>
        </div>
        <div class="card-block__body">
          ${row(
            field("Number", `sections.${idx}.number`, s.number),
            field("Title", `sections.${idx}.title`, s.title)
          )}
          ${field("Subtitle", `sections.${idx}.subtitle`, s.subtitle)}
          ${field("Description", `sections.${idx}.description`, s.description, { type: "textarea", rows: 2 })}
          <label class="field__label" style="margin-top:14px;">Photos <span style="color:var(--ink-mute);text-transform:none;letter-spacing:0;font-style:italic;">(10–15 recommended — show off the section)</span></label>
          <div class="photos" data-photos="${idx}">${photoRows}</div>
          <div class="add-row" data-act="add-photo" data-sidx="${idx}">+ Add one photo</div>

          <details class="bulk">
            <summary>+ Bulk add many photos (paste URLs)</summary>
            <textarea class="bulk__area" data-bulk-target="${idx}" rows="5"
                      placeholder="Paste image URLs, one per line:
https://images.unsplash.com/photo-...
https://your-cdn.com/wedding-001.jpg
images/haldi/02.jpg"></textarea>
            <div class="bulk__row">
              <span class="bulk__hint">One URL per line. Leading/trailing spaces are trimmed.</span>
              <button class="btn btn--primary" type="button" data-act="bulk-add" data-sidx="${idx}">Add all</button>
            </div>
          </details>
        </div>
      </div>`;
  }

  /* Meet-the-photographers admin block. Pattern matches testimonials/faq:
     a list of objects with reordering + delete + add. Each member has a
     photo (with the upload-first UI), plus name/role/bio. */
  function renderTeam() {
    const t = state.team || (state.team = { members: [] });
    if (!Array.isArray(t.members)) t.members = [];
    const last = t.members.length - 1;
    const memberRows = t.members.map((m, i) => {
      const photo = escapeAttr(m.photo || "");
      const has   = !!photo;
      const thumbStyle = has ? `background-image:url('${photo}')` : "";
      return `
        <div class="list-item team-member-row" data-list-row="team.members.${i}">
          <div class="list-item__head">
            <span class="list-item__num">${String(i + 1).padStart(2, "0")}</span>
            <div class="list-item__ctrls">
              <button data-act="up"     title="Move up"    ${i === 0    ? "disabled" : ""}>↑</button>
              <button data-act="down"   title="Move down"  ${i === last ? "disabled" : ""}>↓</button>
              <button data-act="remove" title="Remove">×</button>
            </div>
          </div>
          <div class="list-item__body">
            <div class="image-field" style="margin-bottom:14px;">
              <label class="field__label">Photo</label>
              <div class="image-field__inner">
                <div class="image-field__thumb${has ? "" : " is-empty"}" style="${thumbStyle}">
                  ${has ? "" : `<span class="image-field__icon">📷</span>`}
                </div>
                <div class="image-field__actions">
                  <button type="button" class="btn--upload-big" data-upload-target="team.members.${i}.photo">
                    ${has ? "↻ Replace photo" : "↑ Upload photo"}
                  </button>
                  <details class="image-field__url-toggle">
                    <summary>Paste URL instead</summary>
                    <input class="input" type="url" placeholder="https://… or images/foo.jpg"
                           data-bind="team.members.${i}.photo" value="${photo}">
                  </details>
                </div>
              </div>
            </div>
            <div class="field" style="margin-bottom:8px;">
              <label class="field__label">Name</label>
              <input class="input" type="text" data-bind="team.members.${i}.name"
                     placeholder="Takeshwar Dewangan" value="${escapeAttr(m.name || "")}">
            </div>
            <div class="field" style="margin-bottom:8px;">
              <label class="field__label">Role</label>
              <input class="input" type="text" data-bind="team.members.${i}.role"
                     placeholder="Lead Photographer" value="${escapeAttr(m.role || "")}">
            </div>
            <div class="field" style="margin-bottom:8px;">
              <label class="field__label">Bio</label>
              <textarea class="textarea" data-bind="team.members.${i}.bio" rows="3"
                        placeholder="A few sentences about this photographer.">${escapeHtml(m.bio || "")}</textarea>
            </div>
          </div>
        </div>`;
    }).join("");
    return block("team", "Team", "Meet the photographers", `
      ${field("Eyebrow", "team.eyebrow", t.eyebrow, { placeholder: "Meet the team" })}
      ${field("Section title", "team.title", t.title, { placeholder: "The photographers behind the lens" })}
      ${field("Lede / intro paragraph", "team.body", t.body, { type: "textarea", rows: 2,
        placeholder: "A small, devoted team that travels together…" })}
      <label class="field__label" style="margin-top:14px;">Photographers</label>
      <p class="form__hint" style="margin-bottom:8px;">Add as many people as you like. Each appears as a card on the live site.</p>
      <div class="list" data-list="team.members">${memberRows}</div>
      <div class="add-row" data-act="add-list" data-list-path="team.members"
           data-template='{"photo":"","name":"","role":"","bio":""}'>+ Add photographer</div>
    `);
  }

  function renderTestimonials() {
    const t = state.testimonials || (state.testimonials = { items: [] });
    const items = (t.items || []).map((it, i) => listObjectRow("testimonials.items", i, it, [
      { key: "quote",    label: "Quote",    type: "textarea", rows: 3, placeholder: "Their words about working with you…" },
      { key: "name",     label: "Couple",   placeholder: "Aanya & Rohan" },
      { key: "location", label: "Location & year", placeholder: "Udaipur · 2024" }
    ])).join("");
    return block("testimonials", "Words", "Testimonials", `
      ${field("Eyebrow", "testimonials.eyebrow", t.eyebrow)}
      ${field("Section title", "testimonials.title", t.title)}
      <label class="field__label" style="margin-top:14px;">Couples & quotes</label>
      <div class="list" data-list="testimonials.items">${items}</div>
      <div class="add-row" data-act="add-list" data-list-path="testimonials.items"
           data-template='{"quote":"","name":"","location":""}'>+ Add testimonial</div>
    `);
  }

  function renderPress() {
    const p = state.press || (state.press = { items: [] });
    const items = (p.items || []).map((it, i) => listStringRow("press.items", i, it)).join("");
    return block("press", "Press", "Featured in", `
      ${field("Section label", "press.eyebrow", p.eyebrow)}
      <label class="field__label" style="margin-top:10px;">Publications</label>
      <div class="list" data-list="press.items">${items}</div>
      <div class="add-row" data-act="add-list" data-list-path="press.items"
           data-template='""'>+ Add publication</div>
    `);
  }

  function renderFaq() {
    const f = state.faq || (state.faq = { items: [] });
    const items = (f.items || []).map((it, i) => listObjectRow("faq.items", i, it, [
      { key: "q", label: "Question", placeholder: "Do you travel for weddings?" },
      { key: "a", label: "Answer",   type: "textarea", rows: 3, placeholder: "Yes — we shoot internationally…" }
    ])).join("");
    return block("faq", "FAQ", "Frequently asked", `
      ${field("Eyebrow", "faq.eyebrow", f.eyebrow)}
      ${field("Section title", "faq.title", f.title)}
      <label class="field__label" style="margin-top:14px;">Questions & answers</label>
      <div class="list" data-list="faq.items">${items}</div>
      <div class="add-row" data-act="add-list" data-list-path="faq.items"
           data-template='{"q":"","a":""}'>+ Add question</div>
    `);
  }

  function renderContact() {
    const c = state.contact || (state.contact = {});
    return block("contact", "Form", "Contact & enquiries", `
      ${field("Eyebrow", "contact.eyebrow", c.eyebrow)}
      ${field("Headline (large italic)", "contact.headline", c.headline)}
      ${field("Lede", "contact.body", c.body, { type: "textarea", rows: 2 })}
      ${row(
        field("Email", "contact.email", c.email),
        field("Phone", "contact.phone", c.phone)
      )}
      ${row(
        field("Instagram (@handle or full URL)", "contact.instagram", c.instagram, { placeholder: "@theweddingsridha" }),
        field("Studio location", "contact.location", c.location)
      )}
      ${row(
        field("YouTube (URL or @handle)", "contact.youtube", c.youtube, { placeholder: "@yourchannel" }),
        field("Facebook (URL or page name)", "contact.facebook", c.facebook, { placeholder: "yourpage" })
      )}
      ${row(
        field("X / Twitter (URL or handle)", "contact.x", c.x || c.twitter, { placeholder: "@SridhaWeds" }),
        field("Telegram (URL or @handle)", "contact.telegram", c.telegram, { placeholder: "@yourname" })
      )}
      ${field("WhatsApp number (country code + digits, no spaces)", "contact.whatsapp", c.whatsapp, {
        placeholder: "919876543210"
      })}
      ${field("Form endpoint URL (advanced — Formspree / Web3Forms)", "contact.formAction", c.formAction, {
        placeholder: "Leave blank — Telegram (/api/enquire) handles it"
      })}
      ${field("Success message (after enquiry sent)", "contact.successMessage", c.successMessage, { type: "textarea", rows: 2 })}
      ${field("Footer line", "contact.footerLine", c.footerLine)}
      <div class="info" style="margin-top:14px;">
        <div class="info__title">How enquiries reach you</div>
        <div class="info__body">
          The contact form tries three transports in order:
          <ol style="margin:8px 0 0 18px; padding:0;">
            <li><b>Telegram (recommended).</b> Set <code>TELEGRAM_BOT_TOKEN</code> and <code>TELEGRAM_CHAT_ID</code> in your Netlify environment variables. Every enquiry is delivered to your Telegram instantly. Free, unlimited, no setup beyond the bot.</li>
            <li><b>Formspree</b> (optional). If you fill the endpoint URL above, the form will POST there as a backup.</li>
            <li><b>Mailto fallback.</b> If none of the above work (e.g. previewing locally), the form opens the visitor's email client.</li>
          </ol>
          <p style="margin:10px 0 0;">The <b>WhatsApp button</b> appears on the live site whenever a WhatsApp number is set above. It opens WhatsApp with the visitor's enquiry pre-filled — they just press Send.</p>
        </div>
      </div>
    `);
  }

  function renderSecurity() {
    const m = state.meta || (state.meta = {});
    return block("security", "Sec", "Admin password", `
      ${field("Admin password (used to access this editor)", "meta.adminPassword", m.adminPassword)}
      <div class="info" style="margin-top:14px;">
        <div class="info__body">
          After changing it, click <b>Export data.js</b> to make the new password permanent for future sessions.
        </div>
      </div>
    `);
  }

  function renderForm() {
    const body = $("#formBody");
    const sections = (state.sections || []).map(renderSection).join("");
    const count = (state.sections || []).length;
    const addSectionRow = `
      <div class="add-row add-row--prominent" data-act="add-section">
        + Add a new section
      </div>`;
    body.innerHTML = [
      renderBrand(),
      renderLogo(),
      renderTheme(),
      renderFonts(),
      renderHero(),
      renderAbout(),
      renderStoriesIntro(),
      `<div class="card-block__divider">Stories (${count} ${count === 1 ? "section" : "sections"})</div>`,
      sections,
      addSectionRow,
      renderTestimonials(),
      renderPress(),
      renderFaq(),
      renderContact(),
      renderSecurity()
    ].join("");
  }

  /* ── Get/set by dotted path ────────────────────────────────────────── */
  function setPath(obj, path, value) {
    const parts = path.split(".");
    let cur = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      const k = parts[i];
      const idx = /^\d+$/.test(k) ? Number(k) : k;
      if (cur[idx] == null) cur[idx] = /^\d+$/.test(parts[i + 1]) ? [] : {};
      cur = cur[idx];
    }
    const last = parts[parts.length - 1];
    cur[/^\d+$/.test(last) ? Number(last) : last] = value;
  }
  function getPath(obj, path) {
    const parts = path.split(".");
    let cur = obj;
    for (const p of parts) {
      if (cur == null) return undefined;
      cur = cur[/^\d+$/.test(p) ? Number(p) : p];
    }
    return cur;
  }

  /* ── Wire form events ──────────────────────────────────────────────── */
  function wireForm() {
    const form = $("#form");

    /* Inputs (live save) */
    form.addEventListener("input", (e) => {
      const el = e.target;

      /* Theme color pickers — light bg + dark accent. State stored at
         state.theme.{bg,ink}; main.js reads it on next render and writes
         CSS variables on :root, recoloring the whole site. */
      const themeKey = el.getAttribute && el.getAttribute("data-theme-input");
      if (themeKey) {
        if (!state.theme) state.theme = {};
        state.theme[themeKey] = el.value;
        updateThemePreviewSwatch();
        persist();
        return;
      }

      const bind = el.getAttribute && el.getAttribute("data-bind");
      if (!bind) return;
      setPath(state, bind, el.value);

      /* Photo thumbnail live update — covers both the section photo rows
         (sections.*.photos.*.src) and the dedicated hero/about image
         fields (hero.photo / about.photo). */
      if (isImageBind(bind)) {
        const container = el.closest(".photo-row, .image-field");
        const thumb = container && container.querySelector(".photo-row__thumb, .image-field__thumb");
        if (thumb) {
          thumb.style.backgroundImage = el.value ? `url('${el.value}')` : "";
          thumb.classList.toggle("is-empty", !el.value);
          thumb.classList.remove("is-broken");
          const icon = thumb.querySelector(".photo-row__thumb-icon, .image-field__icon");
          if (el.value && icon) icon.remove();
        }
      }

      /* Custom font: typing a family name auto-guesses a Google Fonts URL
         when the URL field is still empty. Updates the preview live. */
      const fontFamilyMatch = /^fonts\.(display|serif|sans)\.family$/.exec(bind);
      if (fontFamilyMatch) {
        const slot = fontFamilyMatch[1];
        const urlPath = `fonts.${slot}.url`;
        const currentUrl = getPath(state, urlPath) || "";
        if (!currentUrl && el.value && window.SRIDHA_FONT_GUESS_URL) {
          const guessed = window.SRIDHA_FONT_GUESS_URL(el.value);
          setPath(state, urlPath, guessed);
          const urlInput = form.querySelector(`[data-bind="${urlPath}"]`);
          if (urlInput) urlInput.value = guessed;
        }
        const preview = form.querySelector(`[data-font-preview="${slot}"]`);
        if (preview) preview.style.fontFamily = `'${el.value}', ${slot === "sans" ? "sans-serif" : "serif"}`;
      }
      const fontUrlMatch = /^fonts\.(display|serif|sans)\.url$/.exec(bind);
      if (fontUrlMatch) {
        /* Pasted URL — could be a Google Fonts CSS URL or a direct font
           file URL (DaFont, your own server). Inject the right tag so the
           preview renders. */
        const slot = fontUrlMatch[1];
        if (el.value && /^https?:\/\//.test(el.value)) {
          document.head.querySelectorAll(`[data-admin-runtime-font="${slot}"]`).forEach((n) => n.remove());
          if (isFontFileUrl(el.value)) {
            const family = (getPath(state, `fonts.${slot}.family`) || "Custom").replace(/"/g, "");
            const style = document.createElement("style");
            style.setAttribute("data-admin-runtime-font", slot);
            style.textContent =
              `@font-face { font-family: "${family}"; ` +
              `src: url("${el.value}") format("${fontFormat(el.value)}"); ` +
              `font-display: swap; }`;
            document.head.appendChild(style);
          } else {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = el.value;
            link.setAttribute("data-admin-runtime-font", slot);
            document.head.appendChild(link);
          }
        }
      }
      /* Section title in card head */
      if (/^sections\.\d+\.title$/.test(bind)) {
        const sIdx = Number(bind.split(".")[1]);
        const block = form.querySelector(`.card-block[data-block="section"][data-sidx="${sIdx}"] .card-block__title`);
        if (block) {
          const num = block.querySelector(".num");
          block.innerHTML = "";
          if (num) block.appendChild(num);
          block.append(document.createTextNode(" " + (el.value || "Untitled section")));
        }
      }
      persist();
    });

    /* Logo UPLOAD — embed as a data URI in state.brand.logo. */
    form.addEventListener("change", (e) => {
      const lgInput = e.target.matches("[data-logo-upload]") ? e.target : null;
      if (!lgInput || !lgInput.files || !lgInput.files[0]) return;
      const file = lgInput.files[0];
      if (file.size > 2 * 1024 * 1024) {
        alert("Logo file is over 2 MB. Please use a smaller image (try compressing it or exporting at lower resolution).");
        lgInput.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUri = String(ev.target.result || "");
        if (!dataUri) return;
        setPath(state, "brand.logo", dataUri);
        const open = $$(".card-block.is-open").map((b) => b.dataset.block + (b.dataset.sidx !== undefined ? ":" + b.dataset.sidx : ""));
        renderForm();
        open.forEach((key) => {
          const [block, sidx] = key.split(":");
          const sel = sidx !== undefined
            ? `.card-block[data-block="${block}"][data-sidx="${sidx}"]`
            : `.card-block[data-block="${block}"]`;
          const el = $(sel);
          if (el) el.classList.add("is-open");
        });
        persist();
        lgInput.value = "";
      };
      reader.onerror = () => { alert("Couldn't read that image. Try a different file."); lgInput.value = ""; };
      reader.readAsDataURL(file);
    });

    /* Font file UPLOAD — accept a .ttf/.otf/.woff(2) from the user's disk,
       embed it as a base64 data URI in state.fonts.<slot>.url. Works with
       DaFont (download → unzip → upload), or any font file you have. */
    form.addEventListener("change", (e) => {
      const upInput = e.target.matches("[data-font-upload]") ? e.target : null;
      if (!upInput || !upInput.files || !upInput.files[0]) return;
      const slot = upInput.dataset.fontUpload;
      const file = upInput.files[0];
      /* Cap at 5 MB so localStorage doesn't choke. Most display fonts are
         well under 200 KB; webfonts under 100 KB. */
      if (file.size > 5 * 1024 * 1024) {
        alert("That font file is over 5 MB. Please use a smaller file or host it externally and paste the URL.");
        upInput.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        let dataUri = String(ev.target.result || "");
        if (!dataUri) return;

        /* CRITICAL FIX: FileReader produces a data URI prefixed with the
           browser's guess at the file's MIME type. For .ttf/.otf this is
           often `application/octet-stream` (because the OS doesn't know),
           which our font detector doesn't recognize → @font-face never
           gets registered → font silently doesn't apply.

           Force the MIME prefix to a real font type based on the file
           extension, so the data URI is unambiguously a font. */
        const ext = (file.name.split(".").pop() || "").toLowerCase();
        const mimeMap = {
          ttf:   "font/ttf",
          otf:   "font/otf",
          woff:  "font/woff",
          woff2: "font/woff2",
          eot:   "application/vnd.ms-fontobject"
        };
        const targetMime = mimeMap[ext] || "font/ttf";
        dataUri = dataUri.replace(/^data:[^;,]*/, "data:" + targetMime);

        /* Auto-fill family name from filename so the user doesn't have to
           type it. Strips extension, weight words, separators. */
        let family = getPath(state, `fonts.${slot}.family`) || "";
        const cataloged = ((window.SRIDHA_FONTS || {})[slot] || []).some(
          (c) => (c.family || "").toLowerCase() === family.toLowerCase()
        );
        /* Always re-derive family from the file name for an upload, unless
           the user has typed a *custom* (non-catalog) family already. */
        if (!family || cataloged) {
          family = file.name
            .replace(/\.[^.]+$/, "")
            .replace(/[-_]+/g, " ")
            .replace(/\b(regular|bold|italic|light|medium|thin|black|extrabold|semibold|book)\b/gi, "")
            .replace(/\s+/g, " ").trim()
            .replace(/\b\w/g, (c) => c.toUpperCase()) || "Custom Font";
          setPath(state, `fonts.${slot}.family`, family);
        }
        setPath(state, `fonts.${slot}.url`, dataUri);

        injectActiveFontsForPreview();
        /* Re-render the form so the slot's UI flips to "uploaded" state */
        const openBlocks = $$(".card-block.is-open").map((b) => b.dataset.block + (b.dataset.sidx !== undefined ? ":" + b.dataset.sidx : ""));
        renderForm();
        openBlocks.forEach((key) => {
          const [block, sidx] = key.split(":");
          const sel2 = sidx !== undefined
            ? `.card-block[data-block="${block}"][data-sidx="${sidx}"]`
            : `.card-block[data-block="${block}"]`;
          const el2 = $(sel2);
          if (el2) el2.classList.add("is-open");
        });
        persist();
        upInput.value = "";
      };
      reader.onerror = () => {
        alert("Couldn't read that font file. Try a different one.");
        upInput.value = "";
      };
      reader.readAsDataURL(file);
    });

    /* Font dropdown change — picks a catalog font, sets family + URL. */
    form.addEventListener("change", (e) => {
      const sel = e.target.closest(".font-select");
      if (!sel) return;
      const slot   = sel.dataset.fontSlot;
      const opt    = sel.options[sel.selectedIndex];
      const family = opt.dataset.family || "";
      const url    = opt.dataset.url || "";
      setPath(state, `fonts.${slot}.family`, family);
      setPath(state, `fonts.${slot}.url`,    url);
      const preview = form.querySelector(`[data-font-preview="${slot}"]`);
      if (preview) preview.style.fontFamily = `'${family}', ${slot === "sans" ? "sans-serif" : "serif"}`;
      injectActiveFontsForPreview();
      persist();
    });

    /* Click handler — section management + collapse/expand + list controls.
       Order matters: handle BUTTON clicks before the head toggle, so clicking
       ↑↓× inside a section header doesn't also expand/collapse the card. */
    form.addEventListener("click", (e) => {
      /* Theme preset — apply both colors at once */
      const presetBtn = e.target.closest("[data-theme-preset]");
      if (presetBtn) {
        try {
          const preset = JSON.parse(presetBtn.getAttribute("data-theme-preset"));
          if (preset && preset.bg && preset.ink) {
            state.theme = { bg: preset.bg, ink: preset.ink };
            const open = $$(".card-block.is-open").map((b) => b.dataset.block);
            renderForm();
            open.forEach((k) => { const el = $(`.card-block[data-block="${k}"]`); if (el) el.classList.add("is-open"); });
            persist();
          }
        } catch (_) {}
        return;
      }
      /* Theme reset — drop the override, fall back to baked-in CSS defaults */
      const resetThemeBtn = e.target.closest("[data-theme-reset]");
      if (resetThemeBtn) {
        delete state.theme;
        const open = $$(".card-block.is-open").map((b) => b.dataset.block);
        renderForm();
        open.forEach((k) => { const el = $(`.card-block[data-block="${k}"]`); if (el) el.classList.add("is-open"); });
        persist();
        return;
      }

      /* Move section up */
      const upBtn = e.target.closest("[data-act='section-up']");
      if (upBtn) {
        const idx = Number(upBtn.dataset.sidx);
        if (idx > 0) {
          [state.sections[idx - 1], state.sections[idx]] = [state.sections[idx], state.sections[idx - 1]];
          renderForm();
          persist();
        }
        return;
      }
      /* Move section down */
      const dnBtn = e.target.closest("[data-act='section-down']");
      if (dnBtn) {
        const idx = Number(dnBtn.dataset.sidx);
        if (idx < state.sections.length - 1) {
          [state.sections[idx], state.sections[idx + 1]] = [state.sections[idx + 1], state.sections[idx]];
          renderForm();
          persist();
        }
        return;
      }
      /* Remove section (with confirm) */
      const rmBtn = e.target.closest("[data-act='section-remove']");
      if (rmBtn) {
        const idx = Number(rmBtn.dataset.sidx);
        const title = (state.sections[idx] && state.sections[idx].title) || "this section";
        if (confirm(`Remove "${title}" and all its photos? This cannot be undone.`)) {
          state.sections.splice(idx, 1);
          renderForm();
          persist();
        }
        return;
      }
      /* Clear the uploaded logo — site falls back to text wordmark */
      const logoClear = e.target.closest("[data-act='logo-clear']");
      if (logoClear) {
        if (!confirm("Remove the logo? The site will fall back to showing your brand name as text.")) return;
        setPath(state, "brand.logo", "");
        const open = $$(".card-block.is-open").map((b) => b.dataset.block + (b.dataset.sidx !== undefined ? ":" + b.dataset.sidx : ""));
        renderForm();
        open.forEach((key) => {
          const [block, sidx] = key.split(":");
          const sel = sidx !== undefined
            ? `.card-block[data-block="${block}"][data-sidx="${sidx}"]`
            : `.card-block[data-block="${block}"]`;
          const el = $(sel);
          if (el) el.classList.add("is-open");
        });
        persist();
        return;
      }

      /* Clear an uploaded font file — empties fonts.<slot>.url so the slot
         falls back to its family default (or no font). */
      const fontClear = e.target.closest("[data-act='font-clear']");
      if (fontClear) {
        const slot = fontClear.dataset.slot;
        if (slot) {
          setPath(state, `fonts.${slot}.url`, "");
          document.head.querySelectorAll(`[data-admin-runtime-font="${slot}"]`).forEach((n) => n.remove());
          const openBlocks = $$(".card-block.is-open").map((b) => b.dataset.block + (b.dataset.sidx !== undefined ? ":" + b.dataset.sidx : ""));
          renderForm();
          openBlocks.forEach((key) => {
            const [block, sidx] = key.split(":");
            const sel = sidx !== undefined
              ? `.card-block[data-block="${block}"][data-sidx="${sidx}"]`
              : `.card-block[data-block="${block}"]`;
            const el = $(sel);
            if (el) el.classList.add("is-open");
          });
          persist();
        }
        return;
      }

      /* Add new section */
      const addSection = e.target.closest("[data-act='add-section']");
      if (addSection) {
        if (!state.sections) state.sections = [];
        const highest = state.sections.reduce((m, s) => Math.max(m, parseInt(s.number || 0, 10) || 0), 0);
        const nextNum = String(highest + 1).padStart(2, "0");
        state.sections.push({
          id:          "section-" + Date.now(),
          number:      nextNum,
          title:       "New Section",
          subtitle:    "Add a subtitle",
          description: "Describe what this part of the wedding is about, in one or two warm sentences.",
          photos:      []
        });
        renderForm();
        persist();
        /* Open the new section automatically and scroll it into view */
        const newIdx = state.sections.length - 1;
        const newBlock = $(`.card-block[data-block="section"][data-sidx="${newIdx}"]`);
        if (newBlock) {
          newBlock.classList.add("is-open");
          newBlock.scrollIntoView({ behavior: "smooth", block: "center" });
          const titleInput = newBlock.querySelector(`[data-bind="sections.${newIdx}.title"]`);
          if (titleInput) { titleInput.focus(); titleInput.select(); }
        }
        return;
      }

      /* Collapse/expand (must come AFTER the section buttons) */
      const head = e.target.closest(".card-block__head");
      if (head) {
        head.parentElement.classList.toggle("is-open");
        return;
      }

      /* Photo row controls */
      const ctrlBtn = e.target.closest(".photo-row__ctrls button, .list-item__ctrls button, .string-row .photo-row__ctrls button");
      if (ctrlBtn) {
        const rowEl = ctrlBtn.closest("[data-list-row]");
        if (!rowEl) return;
        const path = rowEl.dataset.listRow;
        const parts = path.split(".");
        const idx = Number(parts.pop());
        const listPath = parts.join(".");
        const list = getPath(state, listPath);
        if (!Array.isArray(list)) return;
        const act = ctrlBtn.dataset.act;

        if (act === "remove") {
          list.splice(idx, 1);
        } else if (act === "up" && idx > 0) {
          [list[idx - 1], list[idx]] = [list[idx], list[idx - 1]];
        } else if (act === "down" && idx < list.length - 1) {
          [list[idx], list[idx + 1]] = [list[idx + 1], list[idx]];
        }
        rerenderList(listPath);
        persist();
        return;
      }

      /* Add photo */
      const addPhoto = e.target.closest("[data-act='add-photo']");
      if (addPhoto) {
        const sIdx = Number(addPhoto.dataset.sidx);
        const list = state.sections[sIdx].photos || (state.sections[sIdx].photos = []);
        list.push({ src: "", alt: "", caption: "", focus: "center" });
        rerenderList(`sections.${sIdx}.photos`);
        persist();
        return;
      }

      /* Bulk add photos — paste many URLs at once */
      const bulkAdd = e.target.closest("[data-act='bulk-add']");
      if (bulkAdd) {
        const sIdx = Number(bulkAdd.dataset.sidx);
        const ta = form.querySelector(`[data-bulk-target="${sIdx}"]`);
        if (!ta) return;
        const urls = ta.value.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
        if (!urls.length) {
          ta.focus();
          return;
        }
        const list = state.sections[sIdx].photos || (state.sections[sIdx].photos = []);
        urls.forEach((u) => list.push({ src: u, alt: "", caption: "", focus: "center" }));
        ta.value = "";
        /* Close the <details> after a successful add for tidier UX */
        const det = ta.closest("details");
        if (det) det.open = false;
        rerenderList(`sections.${sIdx}.photos`);
        persist();
        return;
      }

      /* Add list item */
      const addList = e.target.closest("[data-act='add-list']");
      if (addList) {
        const path = addList.dataset.listPath;
        const tplRaw = addList.dataset.template;
        let tpl;
        try { tpl = JSON.parse(tplRaw); } catch { tpl = ""; }
        const list = getPath(state, path);
        if (!Array.isArray(list)) return;
        list.push(tpl);
        rerenderList(path);
        persist();
        return;
      }
    });
  }

  /* Re-render any list (photos / list-objects / list-strings) */
  function rerenderList(listPath) {
    const list = getPath(state, listPath);
    if (!Array.isArray(list)) return;

    /* Photos */
    if (/^sections\.\d+\.photos$/.test(listPath)) {
      const sIdx = Number(listPath.split(".")[1]);
      const wrap = $(`[data-photos="${sIdx}"]`);
      if (!wrap) return;
      wrap.innerHTML = list.map((p, i) => photoRow(sIdx, i, p)).join("");
      return;
    }

    /* Generic list (testimonials.items, faq.items, press.items) */
    const wrap = $(`[data-list="${listPath}"]`);
    if (!wrap) return;
    if (listPath === "testimonials.items") {
      wrap.innerHTML = list.map((it, i) => listObjectRow(listPath, i, it, [
        { key: "quote", label: "Quote", type: "textarea", rows: 3 },
        { key: "name", label: "Couple" },
        { key: "location", label: "Location & year" }
      ])).join("");
    } else if (listPath === "faq.items") {
      wrap.innerHTML = list.map((it, i) => listObjectRow(listPath, i, it, [
        { key: "q", label: "Question" },
        { key: "a", label: "Answer", type: "textarea", rows: 3 }
      ])).join("");
    } else if (listPath === "press.items") {
      wrap.innerHTML = list.map((it, i) => listStringRow(listPath, i, it)).join("");
    }
  }

  /* ── Toolbar actions ───────────────────────────────────────────────── */
  function wireToolbar() {
    /* Export */
    $("#exportBtn").addEventListener("click", () => {
      const header = "/* The Wedding Sridha — exported " + new Date().toISOString() + " */\n";
      const body = "window.SRIDHA_DATA = " + JSON.stringify(state, null, 2) + ";\n";
      const blob = new Blob([header + body], { type: "application/javascript" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "data.js";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    });

    /* Import */
    $("#importFile").addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const text = String(reader.result);
          let data;
          if (file.name.endsWith(".json")) {
            data = JSON.parse(text);
          } else {
            const m = text.match(/SRIDHA_DATA\s*=\s*({[\s\S]*?});?\s*$/);
            if (!m) throw new Error("Couldn't find SRIDHA_DATA assignment in this file.");
            data = (new Function("return " + m[1]))();
          }
          if (!data || typeof data !== "object") throw new Error("File is empty or invalid.");
          state = data;
          renderForm();
          reloadPreview();
          /* Push to server immediately — import is an explicit "publish". */
          syncNow();
        } catch (err) {
          alert("Import failed: " + err.message);
        } finally {
          e.target.value = "";
        }
      };
      reader.readAsText(file);
    });

    /* Reset — discards local draft and reloads the published content
       from the server. (Use the Export button first if you want a
       backup before discarding.) */
    $("#resetBtn").addEventListener("click", async () => {
      if (!confirm("Discard your local edits and reload the latest published content from the server?")) return;
      try {
        localStorage.removeItem(STORAGE_KEY);
        const res = await fetch("/api/content", { credentials: "same-origin", cache: "no-store" });
        if (res.ok) {
          state = await res.json();
        } else {
          state = JSON.parse(JSON.stringify(DEFAULTS));
        }
        renderForm();
        reloadPreview();
        setPillState("Reloaded from server", "saved");
      } catch (_) {
        alert("Couldn't reach the server. Reset cancelled.");
      }
    });
  }

  /* ── Image upload buttons ───────────────────────────────────────────
     Walk every URL-style input that maps to an image field and inject
     an "Upload" button next to it. Clicking opens a file picker, posts
     the file to /api/upload, and on success writes the returned URL
     into the input + dispatches "input" so the existing data-bind
     plumbing fires. */
  const IMAGE_BIND_PATTERNS = [
    /\.src$/,                    // photo rows (sections.*.photos.*.src)
    /\.photo$/,                  // hero.photo, about.photo
    /^brand\.logo$/,             // brand logo
    /\.image$/,                  // misc generic image fields
    /\.cover$/,                  // covers (e.g. testimonials.*.cover)
    /\.poster$/,
  ];
  function isImageBind(b) {
    if (!b) return false;
    return IMAGE_BIND_PATTERNS.some((re) => re.test(b));
  }

  function injectUploadButtons() {
    $$('input[type="url"][data-bind], input[type="text"][data-bind]').forEach((inp) => {
      const bind = inp.getAttribute("data-bind");
      if (!isImageBind(bind)) return;
      if (inp.dataset.uploadWired === "1") return;
      inp.dataset.uploadWired = "1";

      /* If the photo row already rendered a primary upload button for
         this bind (the new upload-first UI), don't add a second one. */
      if (document.querySelector(`.btn--upload-big[data-upload-target="${CSS.escape(bind)}"]`)) return;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn btn--ghost btn--upload";
      btn.dataset.uploadTarget = bind;
      btn.title = "Upload an image file";
      btn.style.cssText = "margin-left:6px;flex:0 0 auto;";
      btn.textContent = "Upload";

      /* Try to put it directly after the input. If the input is inside
         a flex row (.photo-row__fields), the button sits inline. */
      if (inp.parentNode) inp.parentNode.insertBefore(btn, inp.nextSibling);
    });
  }

  /* Netlify's synchronous functions cap request bodies at 6 MB, and an
     over-limit POST returns a non-JSON edge response — so we always
     downscale large images client-side before uploading. A 1920px JPEG
     at q=0.85 puts almost every phone photo well under 1 MB. */
  const UPLOAD_MAX_BYTES = 5 * 1024 * 1024;   // hard ceiling for the POST body
  const RESIZE_TRIGGER   = 600 * 1024;         // images over ~600 KB get re-encoded
  const RESIZE_MAX_EDGE  = 1920;
  const RESIZE_QUALITY   = 0.85;

  /* If the image is large or not JPEG/PNG/WebP, run it through a canvas
     to downscale + JPEG-encode. Returns a Blob (preferred for FormData)
     plus a safe filename. SVGs are left alone; animated GIFs we leave
     too since canvas would freeze them on the first frame. */
  async function prepareImageForUpload(file) {
    const mime = file.type || "";
    const ext  = (file.name.split(".").pop() || "").toLowerCase();
    const isSvg = mime === "image/svg+xml" || ext === "svg";
    const isGif = mime === "image/gif" || ext === "gif";

    if (isSvg) return { blob: file, name: file.name || "upload.svg" };
    if (isGif && file.size < UPLOAD_MAX_BYTES) return { blob: file, name: file.name || "upload.gif" };

    /* Small enough already and a supported mime: skip the re-encode. */
    const acceptedAsIs = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
    if (file.size < RESIZE_TRIGGER && acceptedAsIs.has(mime)) {
      return { blob: file, name: file.name || "upload" };
    }

    try {
      const blob = await resizeFileToJpegBlob(file, RESIZE_MAX_EDGE, RESIZE_QUALITY);
      const base = (file.name || "upload").replace(/\.[^.]+$/, "");
      return { blob, name: base + ".jpg" };
    } catch (e) {
      /* Canvas resize failed — fall back to the original file IF it fits
         under the body limit; otherwise propagate so the user gets a
         clear message instead of a hanging upload. */
      if (file.size <= UPLOAD_MAX_BYTES) return { blob: file, name: file.name || "upload" };
      throw new Error("Could not compress this image. Please pick a smaller file.");
    }
  }

  function resizeFileToJpegBlob(file, maxLong, quality) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const longEdge = Math.max(img.naturalWidth, img.naturalHeight);
        const ratio = longEdge > maxLong ? maxLong / longEdge : 1;
        const w = Math.max(1, Math.round(img.naturalWidth  * ratio));
        const h = Math.max(1, Math.round(img.naturalHeight * ratio));
        const c = document.createElement("canvas");
        c.width = w; c.height = h;
        const ctx = c.getContext("2d");
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, w, h);
        c.toBlob((blob) => {
          URL.revokeObjectURL(url);
          if (!blob) return reject(new Error("canvas.toBlob returned null"));
          resolve(blob);
        }, "image/jpeg", quality);
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("could not decode image")); };
      img.src = url;
    });
  }

  async function uploadImageFile(file, onStage) {
    if (!file) throw new Error("No file selected.");
    /* Some mobile browsers report an empty `file.type` for camera shots —
       trust the extension in that case rather than rejecting outright. */
    const mime = file.type || "";
    const extOk = /\.(jpe?g|png|webp|gif|avif|svg|heic|heif)$/i.test(file.name || "");
    if (mime && !/^image\//.test(mime)) {
      throw new Error("That doesn't look like an image. Pick a JPG, PNG, WebP, GIF, or SVG.");
    }
    if (!mime && !extOk) {
      throw new Error("Couldn't tell what kind of file that is. Try a JPG or PNG.");
    }
    if (file.size > 30 * 1024 * 1024) {
      throw new Error("Image is over 30 MB — please pick a smaller file.");
    }

    if (onStage) onStage("Preparing…");
    const { blob, name } = await prepareImageForUpload(file);

    if (blob.size > UPLOAD_MAX_BYTES) {
      /* Resize couldn't get it under the server's accepted body size.
         Fall back to embedding so the user is never blocked. */
      return await embedAsDataUri(blob);
    }

    const fd = new FormData();
    fd.append("file", blob, name);

    if (onStage) onStage("Uploading…");
    const ctrl = new AbortController();
    const killer = setTimeout(() => ctrl.abort(), 60_000);
    let res;
    try {
      res = await fetch("/api/upload", {
        method: "POST",
        credentials: "same-origin",
        body: fd,
        signal: ctrl.signal,
      });
    } catch (err) {
      clearTimeout(killer);
      if (err && err.name === "AbortError") {
        throw new Error("Upload timed out. Try again on a stronger connection.");
      }
      /* Network error — typically a local static server with no
         Functions runtime. Embed as a data URI so the workflow works. */
      console.warn("[upload] network error, embedding as data URI", err);
      return await embedAsDataUri(blob);
    }
    clearTimeout(killer);

    if (res.status === 401) {
      sessionStorage.removeItem(SESSION_KEY);
      $("#loginModal").classList.remove("is-hidden");
      $("#loginPwd").focus();
      throw new Error("Your editor session expired. Please log in again.");
    }
    if (res.status === 404) {
      /* /api/upload doesn't exist on this host — embed locally. */
      return await embedAsDataUri(blob);
    }
    if (!res.ok) {
      const detail = await readErrorDetail(res);
      console.error("[upload] failed", res.status, detail);
      if (res.status === 413) {
        throw new Error("Server rejected the image as too large. Try a smaller photo.");
      }
      throw new Error(detail || ("Upload failed (HTTP " + res.status + ")."));
    }

    let payload;
    try { payload = await res.json(); }
    catch (e) { throw new Error("Server returned an unreadable response. Try again."); }
    if (!payload || !payload.url) throw new Error("Server didn't return an image URL.");
    return payload;
  }

  /* Pull the most useful error message out of a non-OK response —
     prefers JSON {error}, falls back to plain text, then to a generic
     message. Truncates so we never alert a 400 KB HTML page. */
  async function readErrorDetail(res) {
    const ct = (res.headers.get("content-type") || "").toLowerCase();
    try {
      if (ct.includes("application/json")) {
        const j = await res.json();
        return j && (j.error || j.message) ? String(j.error || j.message) : "";
      }
      const txt = await res.text();
      const clean = txt.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      return clean.slice(0, 200);
    } catch (_) { return ""; }
  }

  /* Local / no-server fallback: client-side resize + JPEG re-encode,
     then embed as a data URI. Used when /api/upload is unreachable
     or the resized payload still exceeds the server's body limit. */
  async function embedAsDataUri(fileOrBlob) {
    const dataUri = await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = (e) => resolve(String(e.target.result || ""));
      r.onerror = reject;
      r.readAsDataURL(fileOrBlob);
    });
    if (/^data:image\/svg/.test(dataUri) || fileOrBlob.size < 220 * 1024) {
      return { ok: true, url: dataUri, embedded: true };
    }
    try {
      const resized = await resizeDataUri(dataUri, 1800, 0.82);
      return { ok: true, url: resized, embedded: true };
    } catch (_) {
      return { ok: true, url: dataUri, embedded: true };
    }
  }
  function resizeDataUri(dataUri, maxLong, quality) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const longEdge = Math.max(img.naturalWidth, img.naturalHeight);
        const ratio = longEdge > maxLong ? maxLong / longEdge : 1;
        const w = Math.round(img.naturalWidth  * ratio);
        const h = Math.round(img.naturalHeight * ratio);
        const c = document.createElement("canvas");
        c.width = w; c.height = h;
        const ctx = c.getContext("2d");
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, w, h);
        try { resolve(c.toDataURL("image/jpeg", quality)); }
        catch (e) { reject(e); }
      };
      img.onerror = reject;
      img.src = dataUri;
    });
  }

  /* ── Crop step ──────────────────────────────────────────────────────
     Between file-pick and upload we open Cropper.js in a modal so the
     editor can frame the photo. Smart aspect default per bind:
       hero.photo        → 16:9
       about.photo       → 3:4
       team.members.*    → 1:1
       *.cover / *.poster→ 16:9
       everything else   → free
     User can switch ratio in the modal, "Use original" to skip, or
     Cancel to abort the upload entirely. Returns Promise<File|null>:
       File   = cropped (or original, if Skip)
       null   = cancelled
     Falls through (resolves with the original file) when Cropper.js
     isn't loaded yet, or for SVG / animated-GIF where cropping makes
     no sense. */
  function defaultAspectFor(bind) {
    if (!bind) return NaN;
    if (/^hero\.photo$/.test(bind))                   return 16/9;
    if (/^about\.photo$/.test(bind))                  return 3/4;
    if (/^team\.members\.\d+\.photo$/.test(bind))     return 1;
    if (/\.cover$|\.poster$/.test(bind))              return 16/9;
    return NaN;
  }
  function shouldSkipCrop(file) {
    const mime = file.type || "";
    const name = (file.name || "").toLowerCase();
    if (mime === "image/svg+xml" || name.endsWith(".svg")) return true;
    if (mime === "image/gif"     || name.endsWith(".gif")) return true;
    return false;
  }

  function cropImageInteractively(file, bind) {
    return new Promise((resolve) => {
      const modal = $("#cropModal");
      /* Cropper.js not available (CDN blocked, or script still loading
         on a cold start) or format we shouldn't crop — just pass through. */
      if (!modal || typeof window.Cropper !== "function" || shouldSkipCrop(file)) {
        return resolve(file);
      }

      const img       = $("#cropImage");
      const chips     = $$(".crop-chip", modal);
      const applyBtn  = $("#cropApply");
      const skipBtn   = $("#cropSkip");
      const cancelBtn = $("#cropCancel");
      const closeBtn  = $("#cropClose");
      const rotL  = $("#cropRotateL");
      const rotR  = $("#cropRotateR");
      const zIn   = $("#cropZoomIn");
      const zOut  = $("#cropZoomOut");
      const reset = $("#cropReset");

      const url = URL.createObjectURL(file);
      img.src = url;

      let cropper = null;
      let settled = false;
      let activeRatio = defaultAspectFor(bind);

      const ratioEq = (a, b) => {
        if (Number.isNaN(a) && Number.isNaN(b)) return true;
        if (Number.isNaN(a) || Number.isNaN(b)) return false;
        return Math.abs(a - b) < 0.01;
      };
      function paintActiveChip() {
        chips.forEach((c) => {
          const v = c.dataset.ratio;
          const r = v === "free" ? NaN : Number(v);
          c.classList.toggle("is-active", ratioEq(r, activeRatio));
        });
      }

      function finish(result) {
        if (settled) return;
        settled = true;
        try { if (cropper) cropper.destroy(); } catch (_) {}
        try { URL.revokeObjectURL(url); } catch (_) {}
        modal.classList.add("is-hidden");
        document.body.style.overflow = "";
        document.removeEventListener("keydown", onKey);
        modal.removeEventListener("click", onOverlay);
        applyBtn.removeEventListener("click", onApply);
        skipBtn.removeEventListener("click", onSkip);
        cancelBtn.removeEventListener("click", onCancel);
        closeBtn.removeEventListener("click", onCancel);
        chips.forEach((c) => c.removeEventListener("click", onChip));
        rotL.removeEventListener("click", onRotL);
        rotR.removeEventListener("click", onRotR);
        zIn.removeEventListener("click", onZIn);
        zOut.removeEventListener("click", onZOut);
        reset.removeEventListener("click", onReset);
        resolve(result);
      }

      function onKey(e) {
        if (e.key === "Escape") finish(null);
        else if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onApply(); }
      }
      function onOverlay(e) { if (e.target === modal) finish(null); }
      function onCancel()   { finish(null); }
      function onSkip()     { finish(file); }
      function onApply() {
        if (!cropper) return finish(file);
        const canvas = cropper.getCroppedCanvas({
          maxWidth: 1920,
          maxHeight: 1920,
          imageSmoothingEnabled: true,
          imageSmoothingQuality: "high",
          fillColor: "#ffffff",
        });
        if (!canvas) return finish(file);
        canvas.toBlob((blob) => {
          if (!blob) return finish(file);
          const base = (file.name || "upload").replace(/\.[^.]+$/, "");
          const named = new File([blob], base + ".jpg", { type: "image/jpeg", lastModified: Date.now() });
          finish(named);
        }, "image/jpeg", 0.9);
      }
      function onChip(e) {
        const v = e.currentTarget.dataset.ratio;
        activeRatio = v === "free" ? NaN : Number(v);
        if (cropper) cropper.setAspectRatio(Number.isNaN(activeRatio) ? NaN : activeRatio);
        paintActiveChip();
      }
      function onRotL()  { if (cropper) cropper.rotate(-90); }
      function onRotR()  { if (cropper) cropper.rotate(90); }
      function onZIn()   { if (cropper) cropper.zoom(0.1); }
      function onZOut()  { if (cropper) cropper.zoom(-0.1); }
      function onReset() { if (cropper) cropper.reset(); }

      function initCropper() {
        try {
          cropper = new window.Cropper(img, {
            viewMode: 1,
            dragMode: "move",
            aspectRatio: activeRatio,
            autoCropArea: 0.95,
            background: false,
            movable: true,
            zoomable: true,
            scalable: false,
            rotatable: true,
            cropBoxResizable: true,
            cropBoxMovable: true,
            responsive: true,
            checkCrossOrigin: false,
            checkOrientation: true,
            toggleDragModeOnDblclick: false,
          });
        } catch (err) {
          console.error("[crop] cropper init failed, falling back to original", err);
          finish(file);
        }
        paintActiveChip();
      }

      document.addEventListener("keydown", onKey);
      modal.addEventListener("click", onOverlay);
      applyBtn.addEventListener("click", onApply);
      skipBtn.addEventListener("click", onSkip);
      cancelBtn.addEventListener("click", onCancel);
      closeBtn.addEventListener("click", onCancel);
      chips.forEach((c) => c.addEventListener("click", onChip));
      rotL.addEventListener("click", onRotL);
      rotR.addEventListener("click", onRotR);
      zIn.addEventListener("click", onZIn);
      zOut.addEventListener("click", onZOut);
      reset.addEventListener("click", onReset);

      modal.classList.remove("is-hidden");
      document.body.style.overflow = "hidden";

      if (img.complete && img.naturalWidth) {
        initCropper();
      } else {
        img.addEventListener("load", initCropper, { once: true });
        img.addEventListener("error", () => finish(file), { once: true });
      }
    });
  }

  function wireUploadButtons() {
    /* One delegated handler — covers both the auto-injected small button
       (.btn--upload) and the upload-first photo-row primary button
       (.btn--upload-big). */
    document.body.addEventListener("click", async (e) => {
      const btn = e.target.closest(".btn--upload, .btn--upload-big");
      if (!btn) return;
      e.preventDefault();
      const bind = btn.dataset.uploadTarget;
      const target = $(`[data-bind="${bind.replace(/"/g, '\\"')}"]`);
      if (!target) {
        console.warn("[upload] no target input for bind", bind);
        return;
      }
      const picker = document.createElement("input");
      picker.type = "file";
      picker.accept = "image/*";
      /* iOS Safari silently no-ops .click() on display:none file inputs —
         keep it in the layout/a11y tree but visually invisible. We do NOT
         set pointer-events:none, because some mobile WebViews suppress
         the change event when the input is pointer-disabled. */
      picker.style.cssText = "position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0;";
      document.body.appendChild(picker);
      const cleanupPicker = () => { try { picker.remove(); } catch (_) {} };

      picker.addEventListener("change", async () => {
        const picked = picker.files && picker.files[0];
        cleanupPicker();
        if (!picked) return;
        const old = btn.textContent;
        btn.disabled = true;
        const setStage = (s) => { btn.textContent = s; };

        let file = picked;
        try {
          setStage("Opening crop…");
          const cropped = await cropImageInteractively(picked, bind);
          if (!cropped) {
            /* User cancelled the crop modal — abort the upload cleanly. */
            btn.textContent = old;
            btn.disabled = false;
            return;
          }
          file = cropped;
        } catch (err) {
          console.warn("[crop] step failed, using original", err);
          file = picked;
        }

        setStage("Uploading…");
        try {
          const out = await uploadImageFile(file, setStage);
          if (!out || !out.url) throw new Error("Upload returned no URL.");
          target.value = out.url;
          target.dispatchEvent(new Event("input", { bubbles: true }));

          /* Refresh the photo-row / image-field thumbnail and clear its
             empty-state placeholder so the new image shows immediately. */
          const row = btn.closest(".photo-row, .image-field");
          if (row) {
            const thumb = row.querySelector(".photo-row__thumb, .image-field__thumb");
            if (thumb) {
              thumb.style.backgroundImage = `url('${out.url}')`;
              thumb.classList.remove("is-empty", "is-broken");
              const icon = thumb.querySelector(".photo-row__thumb-icon, .image-field__icon");
              if (icon) icon.remove();
            }
          }

          btn.textContent = "Uploaded ✓";
          /* After the brief confirmation, settle into "Replace image"
             since this slot now has a photo. */
          const isPrimary = btn.classList.contains("btn--upload-big");
          setTimeout(() => {
            btn.textContent = isPrimary ? "↻ Replace image" : (old || "Upload");
            btn.disabled = false;
          }, 1200);
        } catch (err) {
          console.error("[upload] error", err);
          alert(err && err.message ? err.message : "Upload failed. Check the console for details.");
          btn.textContent = old;
          btn.disabled = false;
        }
      });

      /* Some mobile browsers never fire change if the user backs out — we
         GC the picker after a generous delay so we don't leak nodes. */
      setTimeout(() => { if (picker.isConnected && !(picker.files && picker.files[0])) cleanupPicker(); }, 5 * 60 * 1000);

      picker.click();
    });

    /* Whenever the form re-renders, re-decorate URL inputs. */
    const form = $("#form");
    if (form) {
      const observer = new MutationObserver(() => injectUploadButtons());
      observer.observe(form, { childList: true, subtree: true });
    }
  }

  /* When the content-loader's background fetch lands a fresher copy
     than what we booted from cache, swap state in — but only if the
     user has no unsynced local draft, so we never silently clobber
     edits in flight. */
  window.addEventListener("sridha:remote-content", (e) => {
    if (syncInFlight || syncQueued) return;
    const draft = (() => { try { return localStorage.getItem(STORAGE_KEY); } catch (_) { return null; } })();
    if (draft) return;
    const fresh = e.detail;
    if (!fresh || JSON.stringify(fresh) === JSON.stringify(state)) return;
    state = fresh;
    lastSyncedJSON = JSON.stringify(state);
    /* Preserve open card-blocks across the re-render. */
    const openKeys = $$(".card-block.is-open").map((b) => b.dataset.block + (b.dataset.sidx !== undefined ? ":" + b.dataset.sidx : ""));
    renderForm();
    openKeys.forEach((key) => {
      const [block, sidx] = key.split(":");
      const sel = sidx !== undefined
        ? `.card-block[data-block="${block}"][data-sidx="${sidx}"]`
        : `.card-block[data-block="${block}"]`;
      const el = $(sel);
      if (el) el.classList.add("is-open");
    });
    setPillState("Synced from server", "saved");
  });

  /* ── Boot ──────────────────────────────────────────────────────────── */
  function boot() {
    setupLogin();
    renderForm();
    injectActiveFontsForPreview();
    wireForm();
    wireToolbar();
    injectUploadButtons();
    wireUploadButtons();
    /* Mark current state as already-synced if it matches the bundle —
       prevents a spurious "Saved" pill on first load with no edits. */
    lastSyncedJSON = JSON.stringify(state);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
