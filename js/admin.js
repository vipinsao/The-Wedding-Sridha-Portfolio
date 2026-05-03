/* The Wedding Sridha — admin editor
   ───────────────────────────────────────────────────────────────────── */

(function () {
  "use strict";

  const STORAGE_KEY = "sridha:overrides";
  const SESSION_KEY = "sridha:admin-ok";

  const $  = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  const DEFAULTS = window.SRIDHA_DATA || {};
  function loadState() {
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

  /* ── Password gate ─────────────────────────────────────────────────── */
  function setupLogin() {
    const modal = $("#loginModal");
    if (sessionStorage.getItem(SESSION_KEY) === "1") { modal.classList.add("is-hidden"); return; }
    const form = $("#loginForm"), pwd = $("#loginPwd"), err = $("#loginErr");
    pwd.focus();
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const expected = (state.meta && state.meta.adminPassword) || "sridha2024";
      if (pwd.value === expected) {
        sessionStorage.setItem(SESSION_KEY, "1");
        modal.classList.add("is-hidden");
      } else {
        err.textContent = "That password didn't match. Try again.";
        pwd.value = ""; pwd.focus();
      }
    });
  }

  /* ── Save + preview reload ─────────────────────────────────────────── */
  const flashSaved = () => {
    const pill = $("#savedPill");
    pill.classList.add("is-on");
    clearTimeout(flashSaved._t);
    flashSaved._t = setTimeout(() => pill.classList.remove("is-on"), 1400);
  };

  const reloadPreview = debounce(() => {
    const f = $("#previewFrame");
    if (!f) return;
    f.src = "index.html?t=" + Date.now();
  }, 450);

  const persist = debounce(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      flashSaved(); reloadPreview();
    } catch (e) {
      console.error("Persist failed", e);
      alert("Couldn't save — your browser storage may be full.");
    }
  }, 320);

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

  /* Generic photo row (for sections) */
  function photoRow(sIdx, pIdx, photo) {
    const src = escapeAttr(photo.src || "");
    const thumbStyle = src ? `background-image:url('${src}')` : "";
    return `
      <div class="photo-row" data-list-row="sections.${sIdx}.photos.${pIdx}">
        <div class="photo-row__thumb" style="${thumbStyle}"></div>
        <div class="photo-row__fields">
          <input class="input src" type="url" placeholder="Image URL (https://… or images/foo.jpg)"
                 data-bind="sections.${sIdx}.photos.${pIdx}.src" value="${src}">
          <input class="input" type="text" placeholder="Alt text"
                 data-bind="sections.${sIdx}.photos.${pIdx}.alt" value="${escapeAttr(photo.alt || "")}">
          <input class="input" type="text" placeholder="Caption (optional)"
                 data-bind="sections.${sIdx}.photos.${pIdx}.caption" value="${escapeAttr(photo.caption || "")}">
        </div>
        <div class="photo-row__ctrls">
          <button data-act="up" title="Move up">↑</button>
          <button data-act="down" title="Move down">↓</button>
          <button data-act="remove" title="Remove">×</button>
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
      ${field("Hero photo URL (full-bleed background)", "hero.photo", h.photo, { placeholder: "https://… or images/hero.jpg" })}
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
      ${field("Portrait / signature photo URL", "about.photo", a.photo, { placeholder: "https://… or images/about.jpg" })}
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
        field("Instagram (@handle)", "contact.instagram", c.instagram),
        field("Studio location", "contact.location", c.location)
      )}
      ${field("Form endpoint URL (Formspree / Web3Forms)", "contact.formAction", c.formAction, {
        placeholder: "https://formspree.io/f/XXXXXXX"
      })}
      ${field("Success message (after enquiry sent)", "contact.successMessage", c.successMessage, { type: "textarea", rows: 2 })}
      ${field("Footer line", "contact.footerLine", c.footerLine)}
      <div class="info" style="margin-top:14px;">
        <div class="info__title">Receiving enquiries</div>
        <div class="info__body">
          The contact form sends to <b>your inbox</b> in two ways:
          <ol style="margin:8px 0 0 18px; padding:0;">
            <li><b>Best:</b> sign up free at <a href="https://formspree.io" target="_blank" rel="noopener">formspree.io</a>, paste your endpoint URL into the field above. Enquiries will be emailed to you instantly.</li>
            <li><b>Fallback:</b> leave the endpoint blank — the form will open the visitor's email client with their enquiry pre-written, addressed to your email above.</li>
          </ol>
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
      const bind = el.getAttribute && el.getAttribute("data-bind");
      if (!bind) return;
      setPath(state, bind, el.value);

      /* Photo thumbnail live update */
      if (bind.endsWith(".src")) {
        const row = el.closest(".photo-row");
        const thumb = row && row.querySelector(".photo-row__thumb");
        if (thumb) {
          thumb.style.backgroundImage = el.value ? `url('${el.value}')` : "";
          thumb.classList.remove("is-broken");
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
          localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
          renderForm();
          reloadPreview();
          flashSaved();
        } catch (err) {
          alert("Import failed: " + err.message);
        } finally {
          e.target.value = "";
        }
      };
      reader.readAsText(file);
    });

    /* Reset */
    $("#resetBtn").addEventListener("click", () => {
      if (!confirm("Reset all edits and restore the defaults from data.js? This cannot be undone.")) return;
      localStorage.removeItem(STORAGE_KEY);
      state = JSON.parse(JSON.stringify(DEFAULTS));
      renderForm();
      reloadPreview();
      flashSaved();
    });
  }

  /* ── Boot ──────────────────────────────────────────────────────────── */
  function boot() {
    setupLogin();
    renderForm();
    injectActiveFontsForPreview();
    wireForm();
    wireToolbar();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
