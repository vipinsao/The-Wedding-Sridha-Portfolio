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

  function renderStoriesIntro() {
    const root = $('[data-render="storiesIntro"]');
    if (!root) return;
    const s = DATA.storiesIntro || {};
    root.innerHTML = `
      <div class="section__head section__head--center">
        <p class="eyebrow reveal">${escapeHtml(s.eyebrow || "The Work")}</p>
        <h2 class="stories-intro__title reveal" data-delay="1">${escapeHtml(s.title || "")}</h2>
        <p class="stories-intro__body reveal" data-delay="2">${escapeHtml(s.body || "")}</p>
      </div>
    `;
  }

  function renderStories() {
    const root = $("#storiesList");
    if (!root) return;
    const sections = DATA.sections || [];
    root.innerHTML = sections.map((s, idx) => {
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
      return `
        <section class="story" id="story-${escapeHtml(s.id || idx)}" aria-labelledby="story-title-${idx}">
          <div class="story__head">
            <div class="story__title-block">
              <p class="section__num reveal"><span>${number} · The ${escapeHtml(s.title || "")}</span></p>
              <h3 class="section__title reveal" id="story-title-${idx}" data-delay="1">${escapeHtml(s.title || "")}</h3>
              <p class="section__sub reveal" data-delay="1">${escapeHtml(s.subtitle || "")}</p>
              <p class="section__desc reveal" data-delay="2" style="margin-top:14px;">${escapeHtml(s.description || "")}</p>
            </div>
            <span class="story__count reveal" data-delay="1">${photoCount} ${photoCount === 1 ? "frame" : "frames"}</span>
          </div>
          <div class="gallery" data-gallery="${escapeHtml(s.id)}">
            ${photos}
          </div>
        </section>
      `;
    }).join("");
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
    const ig = (c.instagram || "").replace(/^@/, "");
    root.innerHTML = `
      <div class="contact__inner">
        <div class="contact__left">
          <p class="eyebrow reveal">${escapeHtml(c.eyebrow || "Bookings & Enquiries")}</p>
          <h2 class="contact__title reveal" data-delay="1">${escapeHtml(c.headline || "Let's tell yours.")}</h2>
          <p class="contact__lede reveal" data-delay="2">${escapeHtml(c.body || "")}</p>
          <div class="contact__directs reveal" data-delay="3">
            ${c.email     ? `<div class="contact__direct"><span class="lbl">Email</span><span class="val"><a href="mailto:${escapeHtml(c.email)}">${escapeHtml(c.email)}</a></span></div>` : ""}
            ${c.phone     ? `<div class="contact__direct"><span class="lbl">Phone</span><span class="val"><a href="tel:${escapeHtml(c.phone.replace(/\s+/g, ""))}">${escapeHtml(c.phone)}</a></span></div>` : ""}
            ${c.instagram ? `<div class="contact__direct"><span class="lbl">Instagram</span><span class="val"><a href="https://instagram.com/${escapeHtml(ig)}" target="_blank" rel="noopener">${escapeHtml(c.instagram)}</a></span></div>` : ""}
            ${c.location  ? `<div class="contact__direct"><span class="lbl">Studio</span><span class="val">${escapeHtml(c.location)}</span></div>` : ""}
          </div>
        </div>

        <form class="form reveal" data-delay="2" id="contactForm" novalidate>
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
          <div class="form__actions">
            <p class="form__note">We reply to every enquiry within 48 hours. All conversations are confidential.</p>
            <button class="form__submit" type="submit" id="formSubmit">
              <span id="submitText">Send Enquiry</span>
              <span class="arrow"></span>
            </button>
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

  function renderFooter() {
    const root = $("#footer");
    if (!root) return;
    const c = DATA.contact || {};
    const ig = (c.instagram || "").replace(/^@/, "");
    const year = new Date().getFullYear();
    root.innerHTML = `
      <div class="footer__brand">the wedding <b>Sridha</b></div>
      <div>${escapeHtml(c.location || "")}</div>
      <div>
        ${ig ? `<a href="https://instagram.com/${escapeHtml(ig)}" target="_blank" rel="noopener">Instagram</a> &nbsp;·&nbsp;` : ""}
        © ${year} ${escapeHtml((DATA.brand && DATA.brand.name) || "The Wedding Sridha")}
      </div>
    `;
  }

  function renderAll() {
    renderHero();
    renderAbout();
    renderStoriesIntro();
    renderStories();
    renderTestimonials();
    renderPress();
    renderFaq();
    renderContact();
    renderFooter();
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

  /* ── 11. Contact form (Formspree → mailto fallback) ───────────────── */
  function setupContactForm() {
    const form = $("#contactForm");
    if (!form) return;
    const submitBtn = $("#formSubmit");
    const submitTxt = $("#submitText");
    const successTitle = $("#successTitle");
    const successMsg = $("#successMsg");
    const c = DATA.contact || {};
    const action = (c.formAction || "").trim();

    function showError(msg) {
      submitTxt.textContent = msg;
      submitBtn.style.background = "#7A2520";
      submitBtn.style.borderColor = "#7A2520";
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

      /* If a real Formspree (or compatible POST) endpoint is configured, use it */
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
          } else {
            const data = await res.json().catch(() => ({}));
            showError(data?.errors?.[0]?.message || "Send failed — please email us instead");
          }
        } catch (_) {
          showError("Network error — please try again");
        }
        return;
      }

      /* Fallback: open the user's email client with a prefilled message */
      const to = c.email || "";
      if (!to) { showError("No email configured"); return; }
      const subject = `Wedding enquiry · ${name}`;
      const dateStart = (fd.get("weddingDateStart") || "").toString();
      const dateEnd   = (fd.get("weddingDateEnd")   || "").toString();
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

  /* ── 12b. Auto-swap — the BIG featured card trades with a small card ──
     Every 3s, the featured (big 2×2) card swaps images with one of the
     small cards, via a 2-second smooth crossfade. The grid never shows
     duplicate images — each tick is a position-trade between two cells.
     Over time every photo cycles through the big position.

     Keeps running even while the user is looking at the section (no hover
     pause). Only stops when the tab is in the background. */
  function setupAutoSwap() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    (DATA.sections || []).forEach((section, sIdx) => {
      const story = $(`#story-${section.id || sIdx}`);
      if (!story) return;
      const cards = $$(".card", story);
      if (cards.length < 2) return;

      const preload = (img, src, cb) => {
        const sameSrc = img.src && (img.src === src || img.src.endsWith(src.split("/").pop().split("?")[0]));
        if (sameSrc && img.complete && img.naturalWidth > 0) { cb(); return; }
        img.onload  = () => { img.onload = null; img.onerror = null; cb(); };
        img.onerror = () => { img.onload = null; img.onerror = null; cb(); };
        img.src = src;
      };

      const swapPair = (cardA, cardB) => {
        const aFront = cardA.querySelector(".card__img:not(.is-back)");
        const aBack  = cardA.querySelector(".card__img.is-back");
        const bFront = cardB.querySelector(".card__img:not(.is-back)");
        const bBack  = cardB.querySelector(".card__img.is-back");
        if (!aFront || !aBack || !bFront || !bBack) return;

        const aSrc = aFront.currentSrc || aFront.src;
        const bSrc = bFront.currentSrc || bFront.src;
        if (!aSrc || !bSrc || aSrc === bSrc) return;

        let ready = 0;
        const goTime = () => {
          if (++ready < 2) return;
          /* Both backs preloaded — flip simultaneously, both cards cross-
             fade together over the 2s CSS opacity transition. */
          aFront.classList.add("is-back");    aBack.classList.remove("is-back");
          bFront.classList.add("is-back");    bBack.classList.remove("is-back");
          cardA.dataset.src = bSrc;           /* keep lightbox accurate */
          cardB.dataset.src = aSrc;
        };
        preload(aBack, bSrc, goTime);
        preload(bBack, aSrc, goTime);
      };

      /* The big card is always cards[0] (CSS rule .gallery .card:first-child).
         We cycle through the small cards in shuffled order so every small
         cell gets a fair turn at being swapped with the big one — and then
         we re-shuffle so the rotation never looks mechanical. */
      const buildOrder = () => {
        const o = [];
        for (let i = 1; i < cards.length; i++) o.push(i);
        for (let i = o.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [o[i], o[j]] = [o[j], o[i]];
        }
        return o;
      };
      let order = buildOrder();
      let cursor = 0;

      function tick() {
        if (document.hidden) return;
        const big = cards[0];
        if (!big) return;
        if (cursor >= order.length) { order = buildOrder(); cursor = 0; }
        const small = cards[order[cursor++]];
        if (!small) return;
        swapPair(big, small);
      }

      /* Stagger sections so they don't all swap on the same beat. */
      const initialDelay = 1800 + Math.random() * 2400;
      setTimeout(() => {
        tick();
        setInterval(tick, 3000);
      }, initialDelay);
    });
  }

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
        lenis.scrollTo(target, { offset: -140, duration: 1.4 });
      } else {
        const top = target.getBoundingClientRect().top + window.scrollY - 140;
        window.scrollTo({ top, behavior: "smooth" });
      }
    });
  }

  /* ── 14. Boot ─────────────────────────────────────────────────────── */
  function boot() {
    applyFonts();
    applyBrand();
    renderAll();
    setupCursor();
    setupTopbar();
    setupReveals();
    setupGalleries();
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
