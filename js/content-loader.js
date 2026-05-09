/* The Wedding Sridha — runtime data loader
   ───────────────────────────────────────────────────────────────────
   Replaces the old static <script src="js/data.js"> include. We:
     1. Read a cached copy from localStorage (so first paint is instant
        on repeat visits, even before the network responds).
     2. Fetch /api/content in parallel.
     3. When the network response arrives, update the cache; if the
        content actually changed, soft-reload so the page re-renders.

   The page must reference this as:
       <script src="js/content-loader.js" data-then="js/main.js" defer></script>
   The "data-then" script is appended only after window.SRIDHA_DATA is set,
   so main.js / admin.js can rely on the global being populated. */

(function () {
  "use strict";

  var CACHE_KEY = "sridha:content-cache:v1";
  var SCRIPT    = document.currentScript;
  var THEN      = SCRIPT && SCRIPT.getAttribute("data-then");
  var MODE      = (SCRIPT && SCRIPT.getAttribute("data-mode")) || "site";  // "site" | "admin"

  function loadCached() {
    try {
      var raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (_) { return null; }
  }

  function saveCache(data) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); }
    catch (_) { /* quota — fine, just won't have a cache next time */ }
  }

  function appendThen() {
    if (!THEN) return;
    var s = document.createElement("script");
    s.src = THEN;
    s.defer = true;
    document.head.appendChild(s);
  }

  function loadStaticFallback() {
    /* Loaded only if /api/content has nothing AND there's no cache —
       the original js/data.js stays in the repo as a deploy-day safety
       net so the site is never blank. */
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = "js/data.js";
      s.onload = function () { resolve(window.SRIDHA_DATA || null); };
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function showFatal(message) {
    var el = document.createElement("div");
    el.style.cssText =
      "position:fixed;inset:0;display:flex;align-items:center;justify-content:center;" +
      "background:#F5F0E8;color:#3a2a1f;font:16px/1.5 system-ui,sans-serif;padding:24px;text-align:center;z-index:99999;";
    el.innerHTML =
      "<div style=\"max-width:480px\">" +
      "<div style=\"font-family:Georgia,serif;font-style:italic;font-size:28px;margin-bottom:12px;\">" +
      "The site is being set up.</div>" +
      "<div>" + message + "</div></div>";
    document.body.appendChild(el);
  }

  /* ── 1. Hand off cached data immediately if we have it ───────── */
  var cached = loadCached();
  if (cached) {
    window.SRIDHA_DATA = cached;
    appendThen();
  }

  /* ── 2. Fetch fresh data in the background ───────────────────── */
  fetch("/api/content", {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
  })
    .then(function (res) {
      if (res.status === 404) {
        return res.json().then(function (info) { throw Object.assign(new Error("not seeded"), { info: info }); });
      }
      if (!res.ok) throw new Error("content " + res.status);
      return res.json();
    })
    .then(function (data) {
      saveCache(data);
      var changed = JSON.stringify(data) !== JSON.stringify(cached);
      if (!cached) {
        /* First load on this device — boot now. */
        window.SRIDHA_DATA = data;
        appendThen();
      } else if (changed && MODE === "site" && window.self === window.top) {
        /* The page already booted from cache. Refresh once so the
           public site picks up the latest published edit. We use a
           query param to dodge browser bf-cache. We DON'T auto-reload
           when embedded in an iframe (the admin preview), because that
           races with the parent's just-written cache + pending PUT —
           the parent will reload us when needed. */
        var u = new URL(window.location.href);
        u.searchParams.set("_v", String(Date.now()));
        window.location.replace(u.toString());
      } else {
        /* Admin mode (or unchanged): replace the global so a manual
           reload of the editor sees the latest, but don't auto-reload. */
        window.SRIDHA_DATA = data;
        if (MODE === "admin") {
          window.dispatchEvent(new CustomEvent("sridha:remote-content", { detail: data }));
        }
      }
    })
    .catch(function (err) {
      console.warn("[content-loader]", err);
      if (cached) return;   // already booted from cache, no need to fall back
      /* No cache and no API content yet — fall back to the bundled
         data.js so first deployment isn't a blank page. */
      loadStaticFallback().then(function (data) {
        if (!data) {
          showFatal(
            "Run <code>npm run seed</code> once to publish the initial content."
          );
          return;
        }
        window.SRIDHA_DATA = data;
        appendThen();
      }).catch(function () {
        showFatal("Couldn't reach the content service. Refresh in a moment.");
      });
    });
})();
