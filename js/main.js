/* The Wedding Sridha — portfolio engine
   ───────────────────────────────────────────────────────────────────── */

(function () {
  "use strict";

  /* ── 1. Resolve data (defaults + localStorage overrides) ──────────── */
  const STORAGE_KEY = "sridha:overrides";
  function deepMerge(base, over) {
    if (Array.isArray(base) || Array.isArray(over)) return over !== undefined ? over : base;
    if (base && typeof base === "object" && over && typeof over === "object") {
      const out = { ...base };
      for (const k of Object.keys(over)) out[k] = deepMerge(base[k], over[k]);
      return out;
    }
    return over !== undefined ? over : base;
  }
  function loadData() {
    const defaults = window.SRIDHA_DATA || {};
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaults;
      return deepMerge(defaults, JSON.parse(raw));
    } catch (_) { return defaults; }
  }
  const DATA = loadData();

  /* ── 2. Tiny utilities ────────────────────────────────────────────── */
  const $  = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  const escapeHtml = (s) =>
    String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));

  /* Normalize image URLs the client may paste into admin.html.
     Google Drive "share" links (…/file/d/{id}/view, open?id=, uc?id=)
     return an HTML preview page, not raw bytes — they will not render
     in <img> or background-image. We rewrite them to the direct
     googleusercontent endpoint, which streams the file.
     Also handles Dropbox share links (?dl=0 → ?raw=1). Anything else
     is returned unchanged. */
  function normalizeImageUrl(u) {
    if (!u || typeof u !== "string") return u;
    if (u.startsWith("data:") || u.startsWith("blob:")) return u;
    /* Google Drive */
    let m = u.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]{10,})/);
    if (m) return `https://lh3.googleusercontent.com/d/${m[1]}=w2400`;
    m = u.match(/drive\.google\.com\/(?:open|uc)\?(?:[^#]*&)?id=([a-zA-Z0-9_-]{10,})/);
    if (m) return `https://lh3.googleusercontent.com/d/${m[1]}=w2400`;
    /* Dropbox: rewrite preview pages to raw download */
    if (/dropbox\.com\/.+\?.*dl=0/.test(u)) return u.replace(/(\?|&)dl=0/, "$1raw=1");
    if (/dropbox\.com\/.+/.test(u) && !/[?&](raw|dl)=1/.test(u)) {
      return u + (u.includes("?") ? "&raw=1" : "?raw=1");
    }
    return u;
  }

  /* ── 3. Apply chosen fonts (injects font CSS, sets CSS variables) ──
     Two kinds of font URLs are supported:
       1) A CSS URL (Google Fonts, Adobe Fonts, etc.) — injected via <link>
       2) A font FILE URL or base64 data URI (DaFont .ttf/.otf, an uploaded
          file, your own self-hosted .woff2) — registered via @font-face. */
  function applyFonts() {
    const fonts = DATA.fonts || {};
    /* Remove anything we previously injected (so reruns don't pile up) */
    document.querySelectorAll("link[data-injected-font], style[data-injected-font]").forEach((n) => n.remove());
    const root = document.documentElement;
    const fallback = {
      display: '"Cormorant Garamond", "Times New Roman", Georgia, serif',
      serif:   '"Cormorant Garamond", "Times New Roman", Georgia, serif',
      sans:    '"Helvetica Neue", Arial, sans-serif'
    };

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

    ["display", "serif", "sans"].forEach((slot) => {
      const f = fonts[slot] || {};
      if (f.url) {
        if (isFontFileUrl(f.url)) {
          /* Font file or data URI — register via @font-face */
          const style = document.createElement("style");
          style.setAttribute("data-injected-font", slot);
          const family = (f.family || "Custom Font").replace(/"/g, "");
          style.textContent =
            `@font-face { font-family: "${family}"; ` +
            `src: url("${f.url}") format("${fontFormat(f.url)}"); ` +
            `font-display: swap; }`;
          document.head.appendChild(style);
        } else {
          /* CSS URL — Google Fonts, Adobe, anywhere */
          const link = document.createElement("link");
          link.rel = "stylesheet";
          link.href = f.url;
          link.setAttribute("data-injected-font", slot);
          document.head.appendChild(link);
        }
      }
      if (f.family) {
        root.style.setProperty(`--f-${slot}`, `"${f.family}", ${fallback[slot]}`);
      }
    });
  }

  /* ── 3a. Theme colors ──────────────────────────────────────────────
     The admin lets the user pick two colors — a light "background" and a
     dark "accent / leaf". From those two we derive every surface and ink
     shade in the design system, then write them to CSS variables on
     :root so the existing stylesheet recolors instantly. */
  function hexToRgb(hex) {
    const m = /^#?([a-f0-9]{2})([a-f0-9]{2})([a-f0-9]{2})$/i.exec(String(hex || "").trim());
    return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : null;
  }
  function rgbToHex(r, g, b) {
    return "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
  }
  /* mix(a, b, t):   t=0 → a, t=1 → b — straight RGB linear interpolation */
  function mixColor(a, b, t) {
    const A = hexToRgb(a), B = hexToRgb(b);
    if (!A || !B) return a;
    return rgbToHex(A.r + (B.r - A.r) * t, A.g + (B.g - A.g) * t, A.b + (B.b - A.b) * t);
  }
  function relativeLuminance(hex) {
    const c = hexToRgb(hex);
    if (!c) return 0;
    const norm = [c.r, c.g, c.b]
      .map((v) => v / 255)
      .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
    return 0.2126 * norm[0] + 0.7152 * norm[1] + 0.0722 * norm[2];
  }

  function applyTheme() {
    const t = DATA.theme;
    if (!t || !t.bg || !t.ink) return;       /* CSS defaults stand */
    const bg = t.bg, ink = t.ink;
    const inkRgb = hexToRgb(ink);
    if (!hexToRgb(bg) || !inkRgb) return;
    const root = document.documentElement;
    /* Surfaces — pure bg, then progressively tinted toward the accent. */
    root.style.setProperty("--bg",       bg);
    root.style.setProperty("--bg-alt",   mixColor(bg, ink, 0.08));
    root.style.setProperty("--bg-deep",  mixColor(bg, ink, 0.16));
    /* Inks — accent itself, then progressively faded toward bg for text
       hierarchy (body, mute). */
    root.style.setProperty("--ink",      ink);
    root.style.setProperty("--ink-soft", mixColor(ink, bg, 0.20));
    root.style.setProperty("--ink-mute", mixColor(ink, bg, 0.45));
    /* Primary CTA / hover accent — same family as ink. */
    root.style.setProperty("--maroon",    ink);
    root.style.setProperty("--maroon-dk", mixColor(ink, "#000000", 0.20));
    /* CTA-text — chosen for contrast against the accent. Dark accents
       get white text; light accents (e.g. champagne accent on a dark
       palette) get near-black text. WCAG-style luminance threshold. */
    const ctaText = relativeLuminance(ink) > 0.55 ? "#1A1410" : "#FFFFFF";
    root.style.setProperty("--cta-text", ctaText);
    /* Rules & form fields — translucent ink, opacities preserved. */
    root.style.setProperty("--rule",      `rgba(${inkRgb.r}, ${inkRgb.g}, ${inkRgb.b}, 0.14)`);
    root.style.setProperty("--rule-soft", `rgba(${inkRgb.r}, ${inkRgb.g}, ${inkRgb.b}, 0.07)`);
    root.style.setProperty("--field",     `rgba(${inkRgb.r}, ${inkRgb.g}, ${inkRgb.b}, 0.18)`);
    /* Mobile address-bar tint matches the page bg. */
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", bg);
  }

  /* ── 3b. Brand mark in topbar + loader + title ────────────────────── */
  function applyBrand() {
    const brand = (DATA.brand || {});
    const name  = (brand.name || "The Wedding Sridha").trim();

    const brandEl = $("#brand");
    if (brandEl) {
      if (brand.logo) {
        /* Logo uploaded → render as <img>, hides the text wordmark. */
        brandEl.classList.add("topbar__brand--has-logo");
        brandEl.innerHTML = `<img src="${escapeHtml(normalizeImageUrl(brand.logo))}" alt="${escapeHtml(name)}" class="topbar__logo">`;
      } else {
        /* No logo → fall back to the styled text wordmark. */
        brandEl.classList.remove("topbar__brand--has-logo");
        const parts = name.split(/\s+/);
        const last  = parts.pop();
        const head  = parts.join(" ").toLowerCase();
        brandEl.innerHTML = `<span>${escapeHtml(head)}</span> <b>${escapeHtml(last)}</b>`;
      }
    }

    const loaderMark = $("#loaderMark");
    if (loaderMark && brand.mark) loaderMark.textContent = brand.mark;

    const loaderName = $("#loaderName");
    if (loaderName) loaderName.textContent = name;

    document.title = `${name} — Indian Wedding Photography`;
  }

  /* ── 4. Renderers ─────────────────────────────────────────────────── */

  function renderHero() {
    const root = $('[data-render="hero"]');
    if (!root) return;
    const h = DATA.hero || {};
    const brand = DATA.brand || {};
    const name = (brand.name || "The Wedding Sridha").trim();
    const parts = name.split(/\s+/);
    const last = parts.pop();
    const head = parts.join(" ");
    const heroPhoto = normalizeImageUrl(h.photo);
    const bg = heroPhoto ? `style="background-image:url('${escapeHtml(heroPhoto)}')"` : "";

    root.innerHTML = `
      <div class="hero__bg" ${bg}></div>
      <div class="hero__inner">
        <p class="eyebrow eyebrow--light hero__eyebrow reveal">${escapeHtml(h.eyebrow || "")}</p>
        <h1 class="hero__mark reveal" data-delay="1" id="heroMark">
          ${head ? `<span class="hero__mark-pre">${escapeHtml(head)}</span>` : ""}
          <span class="hero__mark-name">${escapeHtml(last)}</span>
        </h1>
        <div class="hero__rule reveal" data-delay="2"></div>
        <p class="hero__title reveal" data-delay="2">${escapeHtml(h.title || "")}</p>
        <p class="hero__body reveal" data-delay="3">${escapeHtml(h.body || "")}</p>
        <div class="hero__actions reveal" data-delay="4">
          ${h.ctaText ? `<a class="btn-primary" href="${escapeHtml(h.ctaHref || "#contact")}">${escapeHtml(h.ctaText)} <span class="arrow"></span></a>` : ""}
          <a class="btn-link" href="#stories">View the work</a>
        </div>
      </div>
      <div class="hero__cue" aria-hidden="true"><span>Scroll</span></div>
    `;
  }

  function renderAbout() {
    const root = $('[data-render="about"]');
    if (!root) return;
    const a = DATA.about || {};
    const aboutPhoto = normalizeImageUrl(a.photo);
    const photo = aboutPhoto
      ? `<div class="about__photo"><img src="${escapeHtml(aboutPhoto)}" alt="${escapeHtml(a.title || "Behind the lens")}" loading="lazy" decoding="async" onerror="this.style.opacity=0"></div>`
      : `<div class="about__photo"></div>`;
    root.innerHTML = `
      <div class="about__inner">
        ${photo}
        <div class="about__text">
          <p class="eyebrow reveal">${escapeHtml(a.eyebrow || "Behind the Lens")}</p>
          <h2 class="about__title reveal" data-delay="1">${escapeHtml(a.title || "")}</h2>
          <p class="about__body reveal" data-delay="2">${escapeHtml(a.body || "")}</p>
          ${a.signature ? `<p class="about__sig reveal" data-delay="3">${escapeHtml(a.signature)}</p>` : ""}
        </div>
      </div>
    `;
  }

  /* Populate the "Stories ▾" dropdown in the topnav with one link per
     section in DATA.sections. Kept dynamic so admin edits reflect here
     automatically without HTML changes. */
  function renderStoriesDropdown() {
    const ul = $("#storiesDropdown");
    if (!ul) return;
    const sections = DATA.sections || [];
    if (sections.length === 0) { ul.innerHTML = ""; return; }
    ul.innerHTML = sections.map((s, idx) => {
      const id    = escapeHtml(s.id || `section-${idx}`);
      const title = escapeHtml(s.title || s.id || "Untitled");
      const num   = escapeHtml(s.number || String(idx + 1).padStart(2, "0"));
      return `<li role="none">
        <a role="menuitem" href="#story-${id}">
          <span class="topnav__dropdown-num">${num}</span>
          <span class="topnav__dropdown-title">${title}</span>
        </a>
      </li>`;
    }).join("");
  }

  /* Wire dropdown open/close behaviour. Hover-on-desktop is handled
     by CSS; we only need JS for click/touch toggling. */
  function setupDropdown() {
    const groups = $$(".topnav__group[data-dropdown]");
    groups.forEach((g) => {
      const trigger = g.querySelector(".topnav__trigger");
      if (!trigger) return;
      trigger.addEventListener("click", (e) => {
        /* Only intercept on touch / narrow viewports — desktop hover
           still works without click. */
        if (!window.matchMedia("(pointer: coarse), (max-width: 900px)").matches) return;
        e.preventDefault();
        const open = g.classList.toggle("is-open");
        trigger.setAttribute("aria-expanded", open ? "true" : "false");
      });
    });
    /* Close any open dropdown on outside click. */
    document.addEventListener("click", (e) => {
      groups.forEach((g) => {
        if (!g.contains(e.target)) {
          g.classList.remove("is-open");
          const tr = g.querySelector(".topnav__trigger");
          if (tr) tr.setAttribute("aria-expanded", "false");
        }
      });
    });
  }

  /* Stories — single parent section with a tab bar and one panel per
     ritual. Click a tab → that ritual's gallery shows, others hide.
     Each panel keeps the same "story header + photo grid" layout it
     had as a standalone section, so nothing about the photo cards
     themselves changes. The Stories ▾ topnav dropdown's links to
     #story-{id} also activate the right tab via setupTabs(). */
  function renderStories() {
    const root = $('[data-render="stories"]');
    if (!root) return;
    const intro = DATA.storiesIntro || {};
    const sections = DATA.sections || [];

    if (sections.length === 0) {
      root.innerHTML = `
        <div class="section__head section__head--center">
          <p class="eyebrow reveal">${escapeHtml(intro.eyebrow || "The Work")}</p>
          <h2 class="stories-intro__title reveal" data-delay="1">${escapeHtml(intro.title || "")}</h2>
          <p class="stories-intro__body reveal" data-delay="2">${escapeHtml(intro.body || "")}</p>
        </div>`;
      return;
    }

    const tabs = sections.map((s, idx) => {
      const id = escapeHtml(s.id || `section-${idx}`);
      const num = escapeHtml(s.number || String(idx + 1).padStart(2, "0"));
      const title = escapeHtml(s.title || s.id || "");
      return `
        <button class="stories__tab" role="tab"
                data-tab="${id}" aria-controls="story-${id}"
                aria-selected="${idx === 0 ? "true" : "false"}"
                tabindex="${idx === 0 ? "0" : "-1"}">
          <span class="stories__tab-num">${num}</span>
          <span class="stories__tab-title">${title}</span>
        </button>`;
    }).join("");

    const panels = sections.map((s, idx) => {
      const number = escapeHtml(s.number || String(idx + 1).padStart(2, "0"));
      const photos = (s.photos || []).map((p, i) => {
        const focus = escapeHtml(p.focus || "center");
        const fallback = `${escapeHtml(s.title || s.id)} · ${String(i + 1).padStart(2, "0")}`;
        const src = normalizeImageUrl(p.src || "");
        return `
          <figure class="card reveal" data-focus="${focus}" data-fallback="${fallback}"
                  data-section="${escapeHtml(s.id || "")}" data-index="${i}"
                  data-src="${escapeHtml(src)}"
                  data-caption="${escapeHtml(p.caption || "")}"
                  oncontextmenu="return false">
            <span class="card__index">${escapeHtml(s.title || "")} · ${String(i + 1).padStart(2, "0")}</span>
            <img class="card__img" loading="lazy" decoding="async" fetchpriority="low"
                 src="${escapeHtml(src)}"
                 alt="${escapeHtml(p.alt || s.title || "")}"
                 onerror="this.closest('.card').classList.add('is-broken')">
            <img class="card__img is-back" loading="lazy" decoding="async" fetchpriority="low"
                 alt="" aria-hidden="true">
            ${p.caption ? `<figcaption class="card__caption">${escapeHtml(p.caption)}</figcaption>` : ""}
          </figure>`;
      }).join("");
      const photoCount = (s.photos || []).length;
      const id = escapeHtml(s.id || `section-${idx}`);
      return `
        <article class="stories__panel${idx === 0 ? " is-active" : ""}"
                 id="story-${id}" role="tabpanel"
                 aria-labelledby="story-tab-${id}"
                 ${idx === 0 ? "" : "hidden"}>
          <div class="story__head">
            <div class="story__title-block">
              <p class="section__num reveal"><span>${number} · The ${escapeHtml(s.title || "")}</span></p>
              <h3 class="section__title reveal" data-delay="1">${escapeHtml(s.title || "")}</h3>
              <p class="section__sub reveal" data-delay="1">${escapeHtml(s.subtitle || "")}</p>
              <p class="section__desc reveal" data-delay="2" style="margin-top:14px;">${escapeHtml(s.description || "")}</p>
            </div>
            <span class="story__count reveal" data-delay="1">${photoCount} ${photoCount === 1 ? "frame" : "frames"}</span>
          </div>
          <div class="gallery" data-gallery="${escapeHtml(s.id)}">${photos}</div>
        </article>`;
    }).join("");

    root.innerHTML = `
      <div class="stories__intro section__head section__head--center">
        <p class="eyebrow reveal">${escapeHtml(intro.eyebrow || "The Work")}</p>
        <h2 class="stories-intro__title reveal" data-delay="1">${escapeHtml(intro.title || "")}</h2>
        <p class="stories-intro__body reveal" data-delay="2">${escapeHtml(intro.body || "")}</p>
      </div>
      <div class="stories__tabs" role="tablist" aria-label="Story sections">${tabs}</div>
      <div class="stories__panels">${panels}</div>
    `;
  }

  function renderTestimonials() {
    const root = $('[data-render="testimonials"]');
    if (!root) return;
    const t = DATA.testimonials || { items: [] };
    const items = (t.items || []).map((it, i) => `
      <article class="testimonial reveal" data-delay="${Math.min(i, 4)}">
        <div class="testimonial__mark">"</div>
        <p class="testimonial__quote">${escapeHtml(it.quote || "")}</p>
        <div class="testimonial__name">${escapeHtml(it.name || "")}</div>
        ${it.location ? `<div class="testimonial__loc">${escapeHtml(it.location)}</div>` : ""}
      </article>
    `).join("");
    root.innerHTML = `
      <div class="testimonials__inner">
        <div class="section__head section__head--center">
          <p class="eyebrow reveal">${escapeHtml(t.eyebrow || "Words from Couples")}</p>
          <h2 class="section__title reveal" data-delay="1">${escapeHtml(t.title || "")}</h2>
        </div>
        <div class="testimonials__grid">${items}</div>
      </div>
    `;
  }

  function renderPress() {
    const root = $('[data-render="press"]');
    if (!root) return;
    const p = DATA.press || { items: [] };
    const items = (p.items || []).map((name) =>
      `<span class="press__item">${escapeHtml(name)}</span>`
    ).join("");
    root.innerHTML = `
      <div class="press__inner">
        <div class="press__label">${escapeHtml(p.eyebrow || "Featured In")}</div>
        <div class="press__list">${items}</div>
      </div>
    `;
  }

  function renderFaq() {
    const root = $('[data-render="faq"]');
    if (!root) return;
    const f = DATA.faq || { items: [] };
    const items = (f.items || []).map((it, i) => `
      <div class="faq__item" data-faq-item>
        <button class="faq__head" type="button" aria-expanded="false" aria-controls="faq-body-${i}">
          <span>${escapeHtml(it.q || "")}</span>
          <span class="faq__plus" aria-hidden="true"></span>
        </button>
        <div class="faq__body" id="faq-body-${i}">
          <div><p class="faq__answer">${escapeHtml(it.a || "")}</p></div>
        </div>
      </div>
    `).join("");
    root.innerHTML = `
      <div class="faq__inner">
        <div class="section__head section__head--center">
          <p class="eyebrow reveal">${escapeHtml(f.eyebrow || "Frequently Asked")}</p>
          <h2 class="section__title reveal" data-delay="1">${escapeHtml(f.title || "")}</h2>
        </div>
        <div class="faq__list">${items}</div>
      </div>
    `;
  }

  function renderContact() {
    const root = $('[data-render="contact"]');
    if (!root) return;
    const c = DATA.contact || {};
    root.innerHTML = `
      <div class="contact__inner contact__inner--centered">
        <div class="section__head section__head--center" style="margin-bottom: 36px;">
          <p class="eyebrow reveal">${escapeHtml(c.eyebrow || "Bookings & Enquiries")}</p>
        </div>

        <form class="form reveal" data-delay="1" id="contactForm" novalidate>
          <div class="form__row">
            <div class="form__field">
              <label class="form__label" for="f-name">Your name <span class="req">*</span></label>
              <input class="form__input" id="f-name" name="name" type="text" required autocomplete="name" placeholder="Aanya Kapoor">
            </div>
            <div class="form__field">
              <label class="form__label" for="f-email">Email <span class="req">*</span></label>
              <input class="form__input" id="f-email" name="email" type="email" required autocomplete="email" placeholder="you@example.com">
            </div>
          </div>
          <div class="form__row">
            <div class="form__field">
              <label class="form__label" for="f-phone">Phone</label>
              <input class="form__input" id="f-phone" name="phone" type="tel" autocomplete="tel" placeholder="+91 ...">
            </div>
            <div class="form__field">
              <label class="form__label" for="f-venue">Venue / city</label>
              <input class="form__input" id="f-venue" name="venue" type="text" placeholder="Udaipur, India">
            </div>
          </div>
          <div class="form__row form__row--dates">
            <div class="form__field">
              <label class="form__label" for="f-date-start">Wedding starts <span class="form__hint">(first event)</span></label>
              <input class="form__input" id="f-date-start" name="weddingDateStart" type="date">
            </div>
            <div class="form__field">
              <label class="form__label" for="f-date-end">Wedding ends <span class="form__hint">(last event &mdash; same day if single)</span></label>
              <input class="form__input" id="f-date-end" name="weddingDateEnd" type="date">
            </div>
          </div>
          <div class="form__field">
            <label class="form__label" for="f-message">Tell us about your wedding <span class="req">*</span></label>
            <textarea class="form__textarea" id="f-message" name="message" required rows="4" placeholder="Number of events, the kind of photographs you love, anything you're dreaming of…"></textarea>
          </div>
          <div class="form__field">
            <label class="form__label" for="f-referral">How did you hear about us</label>
            <input class="form__input" id="f-referral" name="referral" type="text" placeholder="Instagram, a friend, a publication…">
          </div>
          <!-- Honeypot field — invisible to humans, irresistible to bots.
               If this is filled when the form is submitted, the server
               silently drops the request as spam. -->
          <div class="form__honeypot" aria-hidden="true">
            <label>Website (leave blank)
              <input type="text" name="_hp" tabindex="-1" autocomplete="off">
            </label>
          </div>

          <div class="form__actions">
            <p class="form__note">We reply to every enquiry within 48 hours. All conversations are confidential.</p>
            <div class="form__btns">
              <button class="form__submit" type="submit" id="formSubmit">
                <span id="submitText">Send Enquiry</span>
                <span class="arrow"></span>
              </button>
              ${c.whatsapp ? `
                <button type="button" class="btn-whatsapp" id="whatsappBtn" aria-label="Chat on WhatsApp">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0 0 20.464 3.488"/></svg>
                  <span>Chat on WhatsApp</span>
                </button>
              ` : ""}
            </div>
          </div>

          <div class="form__success" role="status" aria-live="polite">
            <div class="form__success-icon">✓</div>
            <div class="form__success-title" id="successTitle">Sent.</div>
            <p class="form__success-msg" id="successMsg">${escapeHtml(c.successMessage || "Thank you. We'll be in touch within 48 hours.")}</p>
          </div>
        </form>
      </div>
    `;
  }

  /* Inline-SVG social glyphs. Sized via the CSS .footer__social rule
     (24×24 default; scales with currentColor). */
  const SOCIAL_ICONS = {
    instagram: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.16c3.2 0 3.58.012 4.85.07 1.17.054 1.8.249 2.23.413a3.72 3.72 0 0 1 1.38.896c.42.42.68.819.896 1.38.164.43.36 1.06.413 2.23.058 1.27.07 1.65.07 4.85s-.012 3.58-.07 4.85c-.054 1.17-.249 1.8-.413 2.23a3.72 3.72 0 0 1-.896 1.38c-.42.42-.819.68-1.38.896-.43.164-1.06.36-2.23.413-1.27.058-1.65.07-4.85.07s-3.58-.012-4.85-.07c-1.17-.054-1.8-.249-2.23-.413a3.72 3.72 0 0 1-1.38-.896 3.72 3.72 0 0 1-.896-1.38c-.164-.43-.36-1.06-.413-2.23C2.172 15.58 2.16 15.2 2.16 12s.012-3.58.07-4.85c.054-1.17.249-1.8.413-2.23a3.72 3.72 0 0 1 .896-1.38 3.72 3.72 0 0 1 1.38-.896c.43-.164 1.06-.36 2.23-.413C8.42 2.172 8.8 2.16 12 2.16zm0-2.16C8.74 0 8.33.014 7.05.072 5.78.13 4.9.32 4.14.62a5.91 5.91 0 0 0-2.13 1.39A5.91 5.91 0 0 0 .62 4.14C.32 4.9.13 5.78.072 7.05.014 8.33 0 8.74 0 12s.014 3.67.072 4.95c.058 1.27.248 2.15.548 2.91.31.79.726 1.46 1.39 2.13a5.91 5.91 0 0 0 2.13 1.39c.76.3 1.64.49 2.91.548C8.33 23.986 8.74 24 12 24s3.67-.014 4.95-.072c1.27-.058 2.15-.248 2.91-.548a5.91 5.91 0 0 0 2.13-1.39 5.91 5.91 0 0 0 1.39-2.13c.3-.76.49-1.64.548-2.91.058-1.28.072-1.69.072-4.95s-.014-3.67-.072-4.95c-.058-1.27-.248-2.15-.548-2.91a5.91 5.91 0 0 0-1.39-2.13A5.91 5.91 0 0 0 19.86.62C19.1.32 18.22.13 16.95.072 15.67.014 15.26 0 12 0zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32zm0 10.16A4 4 0 1 1 12 8a4 4 0 0 1 0 8zm6.41-11.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z"/></svg>`,
    youtube:   `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23.5 6.2a3.02 3.02 0 0 0-2.13-2.13C19.46 3.5 12 3.5 12 3.5s-7.46 0-9.37.57A3.02 3.02 0 0 0 .5 6.2C0 8.13 0 12 0 12s0 3.87.5 5.8a3.02 3.02 0 0 0 2.13 2.13C4.54 20.5 12 20.5 12 20.5s7.46 0 9.37-.57a3.02 3.02 0 0 0 2.13-2.13C24 15.87 24 12 24 12s0-3.87-.5-5.8zM9.6 15.6V8.4l6.24 3.6-6.24 3.6z"/></svg>`,
    facebook:  `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M24 12c0-6.63-5.37-12-12-12S0 5.37 0 12c0 5.99 4.39 10.96 10.13 11.85V15.47H7.08V12h3.05V9.36c0-3.01 1.79-4.67 4.53-4.67 1.31 0 2.69.23 2.69.23v2.96h-1.51c-1.49 0-1.96.93-1.96 1.88V12h3.33l-.53 3.47h-2.8v8.38C19.61 22.96 24 17.99 24 12z"/></svg>`,
    /* X (formerly Twitter) — current bird-less wordmark glyph. */
    x:         `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.65l-5.21-6.832L4.99 21.75H1.68l7.73-8.835L1.254 2.25h6.817l4.71 6.231 5.463-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/></svg>`,
    /* Telegram — paper plane. */
    telegram:  `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/></svg>`,
    /* Email — envelope. */
    email:     `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6zm-2 0l-8 5-8-5h16zm0 12H4V8l8 5 8-5v10z"/></svg>`,
  };

  /* Normalize a stored social handle/URL into a real link. Accepts:
       - full URL ("https://instagram.com/foo")
       - @handle ("@foo")
       - bare username ("foo")
       - email address (for the email icon — auto-prefixed with mailto:) */
  function socialUrl(platform, value) {
    if (!value) return "";
    const v = String(value).trim();
    if (!v) return "";
    if (platform === "email") {
      if (/^mailto:/i.test(v)) return v;
      if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) return `mailto:${v}`;
      return "";
    }
    if (/^https?:\/\//i.test(v)) return v;
    const handle = v.replace(/^@/, "").replace(/\/$/, "");
    if (platform === "instagram") return `https://instagram.com/${handle}`;
    if (platform === "youtube")   return `https://youtube.com/${/^@/.test(v) ? v : "@" + handle}`;
    if (platform === "facebook")  return `https://facebook.com/${handle}`;
    if (platform === "x" || platform === "twitter") return `https://x.com/${handle}`;
    if (platform === "telegram")  return `https://t.me/${handle}`;
    return v;
  }

  function renderFooter() {
    const root = $("#footer");
    if (!root) return;
    const c = DATA.contact || {};
    const year = new Date().getFullYear();
    const brandName = (DATA.brand && DATA.brand.name) || "The Wedding Sridha";

    /* Six supported platforms — admin can fill any subset. Empty fields
       silently drop their icon. Order: visual social first (IG, FB,
       X, YouTube), then conversational (Telegram), then email last. */
    const platforms = [
      { key: "instagram", label: "Instagram", url: socialUrl("instagram", c.instagram) },
      { key: "facebook",  label: "Facebook",  url: socialUrl("facebook",  c.facebook)  },
      { key: "x",         label: "X",         url: socialUrl("x",         c.x || c.twitter) },
      { key: "youtube",   label: "YouTube",   url: socialUrl("youtube",   c.youtube)   },
      { key: "telegram",  label: "Telegram",  url: socialUrl("telegram",  c.telegram)  },
      { key: "email",     label: "Email",     url: socialUrl("email",     c.email)     },
    ];
    const icons = platforms
      .filter((p) => p.url)
      .map((p) =>
        `<a class="footer__social" href="${escapeHtml(p.url)}" ${p.key === "email" ? "" : `target="_blank" rel="noopener"`} aria-label="${escapeHtml(p.label)}">${SOCIAL_ICONS[p.key]}</a>`
      ).join("");

    root.innerHTML = `
      <div class="footer__socials">${icons}</div>
      <div class="footer__copyright">${escapeHtml(brandName)} <span>©</span> ${year}</div>
    `;
  }

  function renderAll() {
    renderHero();
    renderAbout();
    renderStories();
    renderStoriesDropdown();   /* topnav links — depends on DATA.sections */
    renderTestimonials();
    renderContact();
    renderFooter();
    /* renderPress() and renderFaq() removed from the page — the data
       and admin cards remain so they can be re-enabled later. */
  }

  /* ── 5. Loader ────────────────────────────────────────────────────── */
  function hideLoader() {
    const loader = $("#loader");
    if (!loader) return;
    setTimeout(() => loader.classList.add("is-done"), 1200);
  }

  /* ── 6. Custom cursor (desktop only, JS-gated) ────────────────────── */
  function setupCursor() {
    if (window.matchMedia("(max-width: 900px), (pointer: coarse)").matches) return;
    const cursor = $("#cursor");
    if (!cursor) return;
    document.body.classList.add("has-cursor");

    let x = innerWidth / 2, y = innerHeight / 2;
    let cx = x, cy = y;
    document.addEventListener("mousemove", (e) => { x = e.clientX; y = e.clientY; });
    function loop() {
      cx += (x - cx) * 0.22;
      cy += (y - cy) * 0.22;
      cursor.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
      requestAnimationFrame(loop);
    }
    loop();

    const interactiveSel = ".card, a, button, .topbar__brand, .form__input, .form__textarea, .gallery, .faq__head";
    document.addEventListener("mouseover", (e) => {
      if (e.target.closest(interactiveSel)) cursor.classList.add("is-hover");
      if (e.target.closest(".gallery") && !e.target.closest(".card")) cursor.classList.add("is-drag");
    });
    document.addEventListener("mouseout", (e) => {
      if (e.target.closest(interactiveSel)) cursor.classList.remove("is-hover");
      if (e.target.closest(".gallery")) cursor.classList.remove("is-drag");
    });
  }

  /* ── 7. Reveals (IntersectionObserver) ────────────────────────────── */
  function setupReveals() {
    const els = $$(".reveal");
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add("is-in");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    els.forEach((el) => io.observe(el));
  }

  /* ── 8. Topbar scroll behaviour (light over hero, scrolled elsewhere) ── */
  function setupTopbar() {
    const bar = $("#topbar");
    const hero = $("#hero");
    if (!bar) return;
    let lastScrolled, lastLight, ticking = false;
    function compute() {
      ticking = false;
      const scrolled = window.scrollY > 8;
      const light = hero ? (hero.getBoundingClientRect().bottom > 80) : false;
      /* Only touch the DOM when the boolean actually flips — avoids
         per-frame style invalidation while scrolling. */
      if (scrolled !== lastScrolled) { bar.classList.toggle("is-scrolled", scrolled); lastScrolled = scrolled; }
      if (light !== lastLight)       { bar.classList.toggle("is-light",   light);    lastLight = light; }
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(compute);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    compute();
  }

  /* ── 9. Galleries are now CSS Grid — no JS scroll handling needed. ── */
  function setupGalleries() { /* intentionally empty (grid layout handles itself) */ }

  /* ── 9b. Stories tabs ─────────────────────────────────────────────────
     Click a tab → activate its panel, hide others. Also runs when the
     URL hash changes (e.g. user clicks a Stories ▾ dropdown link to
     #story-haldi) so the right panel is shown after the smooth scroll
     lands. */
  function activateStoryTab(tabId) {
    if (!tabId) return false;
    const tabs   = $$(".stories__tab");
    const panels = $$(".stories__panel");
    let matched = false;
    tabs.forEach((tab) => {
      const on = tab.dataset.tab === tabId;
      tab.setAttribute("aria-selected", on ? "true" : "false");
      tab.setAttribute("tabindex", on ? "0" : "-1");
      tab.classList.toggle("is-active", on);
      if (on) matched = true;
    });
    panels.forEach((panel) => {
      const on = panel.id === `story-${tabId}`;
      panel.classList.toggle("is-active", on);
      if (on) {
        panel.removeAttribute("hidden");
        /* Reveals don't re-fire on already-observed elements, so once a
           panel was hidden when IO ran, its cards never gain `is-in`
           and stay invisible. Force them visible on tab activation. */
        $$(".reveal", panel).forEach((el) => el.classList.add("is-in"));
      } else {
        panel.setAttribute("hidden", "");
      }
    });
    return matched;
  }

  function setupTabs() {
    /* Click handler — delegated so it survives re-renders. Covers both
       the in-section pill tabs AND the topnav Stories ▾ dropdown links
       (which use href="#story-{id}"). The smooth-scroll handler still
       preventDefaults the link, but we don't depend on hashchange — we
       activate the tab synchronously here. */
    document.addEventListener("click", (e) => {
      /* In-section tab pill */
      const tab = e.target.closest(".stories__tab");
      if (tab) {
        e.preventDefault();
        const id = tab.dataset.tab;
        activateStoryTab(id);
        try { history.replaceState(null, "", `#story-${id}`); } catch (_) {}
        return;
      }
      /* Dropdown link / any anchor with href="#story-XXX" */
      const link = e.target.closest('a[href^="#story-"]');
      if (link) {
        const m = /^#story-([a-zA-Z0-9_-]+)$/.exec(link.getAttribute("href") || "");
        if (m) activateStoryTab(m[1]);
        /* Don't preventDefault — smooth-scroll handler will scroll us
           to the Stories section. */
      }
    });

    /* If the page loaded with #story-{id} in the URL, activate that
       tab. (We also listen on hashchange as a belt-and-braces.) */
    function syncFromHash() {
      const m = /^#story-([a-zA-Z0-9_-]+)$/.exec(location.hash);
      if (m) activateStoryTab(m[1]);
    }
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);

    /* Keyboard navigation — left/right arrows on tabs cycle through. */
    document.addEventListener("keydown", (e) => {
      if (!document.activeElement?.classList?.contains("stories__tab")) return;
      const tabs = $$(".stories__tab");
      const idx = tabs.indexOf(document.activeElement);
      if (idx < 0) return;
      let next = idx;
      if (e.key === "ArrowRight") next = (idx + 1) % tabs.length;
      else if (e.key === "ArrowLeft") next = (idx - 1 + tabs.length) % tabs.length;
      else return;
      e.preventDefault();
      tabs[next].focus();
      tabs[next].click();
    });
  }

  /* ── 10. FAQ accordion ────────────────────────────────────────────── */
  function setupFaq() {
    $$(".faq__item").forEach((item) => {
      const head = item.querySelector(".faq__head");
      head.addEventListener("click", () => {
        const open = item.classList.toggle("is-open");
        head.setAttribute("aria-expanded", open ? "true" : "false");
      });
    });
  }

  /* ── 11. Contact form (/api/enquire → Formspree → mailto fallback) ─ */
  function setupContactForm() {
    const form = $("#contactForm");
    if (!form) return;
    const submitBtn = $("#formSubmit");
    const submitTxt = $("#submitText");
    const successTitle = $("#successTitle");
    const successMsg = $("#successMsg");
    const c = DATA.contact || {};
    const action = (c.formAction || "").trim();

    /* WhatsApp button — opens wa.me with current form values prefilled.
       Build the message at click-time so any fields the visitor has
       already typed are included. The visitor still has to press Send
       in WhatsApp itself. */
    const waBtn = $("#whatsappBtn");
    if (waBtn) {
      waBtn.addEventListener("click", () => {
        const phone = (c.whatsapp || "").replace(/\D/g, "");
        if (!phone) return;
        const fd = new FormData(form);
        const name    = (fd.get("name")    || "").toString().trim();
        const email   = (fd.get("email")   || "").toString().trim();
        const venue   = (fd.get("venue")   || "").toString().trim();
        const phoneIn = (fd.get("phone")   || "").toString().trim();
        const message = (fd.get("message") || "").toString().trim();
        const dateStart = (fd.get("weddingDateStart") || "").toString();
        const dateEnd   = (fd.get("weddingDateEnd")   || "").toString();
        let dateLine = "";
        if (dateStart && dateEnd && dateStart !== dateEnd) dateLine = `${dateStart} → ${dateEnd}`;
        else if (dateStart || dateEnd)                     dateLine = dateStart || dateEnd;

        let lines = [`Hi! I'd like to enquire about wedding photography.`];
        if (name)     lines.push("", `Name: ${name}`);
        if (email)    lines.push(`Email: ${email}`);
        if (phoneIn)  lines.push(`Phone: ${phoneIn}`);
        if (dateLine) lines.push(`Wedding: ${dateLine}`);
        if (venue)    lines.push(`Venue: ${venue}`);
        if (message)  lines.push("", message);
        const text = lines.join("\n");
        const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
        window.open(url, "_blank", "noopener");
      });
    }

    function showError(msg) {
      submitTxt.textContent = msg;
      /* Fixed red so the error reads regardless of the user's theme
         (the brand accent could itself be a green/blue/etc.). */
      submitBtn.style.background = "#A8362F";
      submitBtn.style.borderColor = "#A8362F";
      setTimeout(() => {
        submitTxt.textContent = "Send Enquiry";
        submitBtn.style.background = "";
        submitBtn.style.borderColor = "";
        submitBtn.disabled = false;
      }, 3500);
    }
    function showSuccess() {
      form.classList.add("is-sent");
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      /* Light validation */
      const fd = new FormData(form);
      const name = (fd.get("name") || "").toString().trim();
      const email = (fd.get("email") || "").toString().trim();
      const message = (fd.get("message") || "").toString().trim();
      if (!name || !email || !message) {
        showError("Please fill the required fields");
        return;
      }
      if (!/.+@.+\..+/.test(email)) {
        showError("Please check your email");
        return;
      }

      submitBtn.disabled = true;
      submitTxt.textContent = "Sending…";

      const dateStart = (fd.get("weddingDateStart") || "").toString();
      const dateEnd   = (fd.get("weddingDateEnd")   || "").toString();

      /* Step 1: try /api/enquire (Telegram bridge). This is the
         preferred path on the deployed site — instant delivery to the
         photographer's Telegram, no Formspree needed. */
      try {
        const res = await fetch("/api/enquire", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            name, email, message,
            phone:   fd.get("phone")    || "",
            venue:   fd.get("venue")    || "",
            referral: fd.get("referral") || "",
            weddingDateStart: dateStart,
            weddingDateEnd:   dateEnd,
            _hp: fd.get("_hp") || "",   /* honeypot passthrough */
          }),
        });
        if (res.ok) {
          successTitle.textContent = "Sent.";
          showSuccess();
          return;
        }
        /* Server-side validation failure (4xx) — show the message; don't
           silently fall back, so the user can correct the input. */
        if (res.status >= 400 && res.status < 500) {
          const info = await res.json().catch(() => ({}));
          showError(info.error || "Couldn't send — please check your details");
          return;
        }
        /* 500/502: server misconfigured (e.g. TELEGRAM_*not set) or
           Telegram unreachable. Fall through to other transports. */
      } catch (_) {
        /* Network error or /api/enquire doesn't exist (e.g. previewing
           on a host without Netlify Functions). Fall through. */
      }

      /* Step 2: if a Formspree (or compatible) endpoint is configured,
         use it. Backwards compat for users who set this in admin. */
      if (action && /^https?:\/\//.test(action)) {
        try {
          const res = await fetch(action, {
            method: "POST",
            body: fd,
            headers: { Accept: "application/json" }
          });
          if (res.ok) {
            successTitle.textContent = "Sent.";
            showSuccess();
            return;
          }
          const data = await res.json().catch(() => ({}));
          showError(data?.errors?.[0]?.message || "Send failed — please email us instead");
          return;
        } catch (_) { /* fall through to mailto */ }
      }

      /* Step 3: open the user's email client with a prefilled message. */
      const to = c.email || "";
      if (!to) { showError("Couldn't reach the server. Please email us directly."); return; }
      const subject = `Wedding enquiry · ${name}`;
      let dateLine = "—";
      if (dateStart && dateEnd && dateStart !== dateEnd) dateLine = `${dateStart} → ${dateEnd}`;
      else if (dateStart || dateEnd)                     dateLine = dateStart || dateEnd;
      const lines = [
        `Name:      ${name}`,
        `Email:     ${email}`,
        `Phone:     ${fd.get("phone") || "—"}`,
        `Wedding:   ${dateLine}`,
        `Venue:     ${fd.get("venue") || "—"}`,
        `Heard via: ${fd.get("referral") || "—"}`,
        ``,
        `${message}`
      ].join("\n");
      window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines)}`;
      successTitle.textContent = "Email opened.";
      successMsg.textContent = "Your email client should be open with your enquiry. Hit send and we'll see it shortly.";
      showSuccess();
    });
  }

  /* ── 12. Lightbox (scoped per section) ────────────────────────────── */
  function setupLightbox() {
    const lb = $("#lightbox");
    const img = $("#lbImg");
    const cap = $("#lbCaption");
    const counter = $("#lbCounter");
    const closeBtn = $("#lbClose");
    const prevBtn = $("#lbPrev");
    const nextBtn = $("#lbNext");
    if (!lb || !img) return;

    let scope = [];
    let idx = 0;

    function open(card) {
      const sectionId = card.dataset.section;
      scope = $$(`.card[data-section="${sectionId}"][data-src]`);
      idx = scope.indexOf(card);
      paint();
      lb.classList.add("is-open");
      document.body.style.overflow = "hidden";
    }
    function paint() {
      const c = scope[idx];
      if (!c) return;
      img.src = c.dataset.src;
      img.alt = c.querySelector("img")?.alt || "";
      cap.textContent = c.dataset.caption || "";
      counter.textContent = `${String(idx + 1).padStart(2, "0")} / ${String(scope.length).padStart(2, "0")}`;
    }
    function close() {
      lb.classList.remove("is-open");
      img.src = "";
      document.body.style.overflow = "";
    }
    function step(delta) {
      idx = (idx + delta + scope.length) % scope.length;
      paint();
    }

    document.addEventListener("click", (e) => {
      const card = e.target.closest(".card[data-src]");
      if (!card) return;
      if (card.dataset.src) open(card);
    });
    closeBtn?.addEventListener("click", close);
    prevBtn?.addEventListener("click", () => step(-1));
    nextBtn?.addEventListener("click", () => step(1));
    lb.addEventListener("click", (e) => {
      if (e.target === lb || e.target === img) close();
    });
    document.addEventListener("keydown", (e) => {
      if (!lb.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    });
  }

  /* ── 12b. Auto-swap — removed.
     The original 4-col grid had every card at 4:5 aspect, so swapping
     images between cells was visually seamless. With the new Pinterest
     masonry, each photo holds its natural aspect, so swapping would
     reflow the column on every tick. The boot() call to setupAutoSwap
     is a no-op now. */
  function setupAutoSwap() { /* intentionally no-op */ }

  /* ── 13. Lenis smooth scroll ──────────────────────────────────────── */
  function setupSmoothScroll() {
    /* Touch devices use the OS's native momentum — that's already buttery
       and Lenis on touch usually feels worse, not better. */
    if (window.matchMedia("(pointer: coarse)").matches) {
      setupHashLinks(null);
      return;
    }
    if (!window.Lenis) { setupHashLinks(null); return; }

    const lenis = new window.Lenis({
      lerp: 0.085,                /* lerp 0.08–0.1 = silky-smooth without sluggish feel */
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
      syncTouch: false,
      easing: (t) => 1 - Math.pow(1 - t, 3)   /* easeOutCubic for scrollTo */
    });

    /* Single tight RAF loop — no setTimeout, no double-RAF. */
    function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);

    /* Expose for debugging / external use */
    window.__lenis = lenis;

    setupHashLinks(lenis);
  }

  /* Smooth anchor jumps that respect the fixed topbar */
  function setupHashLinks(lenis) {
    document.addEventListener("click", (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute("href");
      if (!id || id.length <= 1) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) {
        /* 1.0s — faster than the previous 1.4s, still smooth and
           controlled. Dropdown jumps now feel snappier. */
        lenis.scrollTo(target, { offset: -140, duration: 1.0 });
      } else {
        const top = target.getBoundingClientRect().top + window.scrollY - 140;
        window.scrollTo({ top, behavior: "smooth" });
      }
    });
  }

  /* ── 14. Boot ─────────────────────────────────────────────────────── */
  function boot() {
    applyTheme();
    applyFonts();
    applyBrand();
    renderAll();
    setupCursor();
    setupTopbar();
    setupDropdown();
    setupReveals();
    setupGalleries();
    setupTabs();
    setupFaq();
    setupContactForm();
    setupLightbox();
    setupAutoSwap();
    setupSmoothScroll();
    hideLoader();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
