/* The Wedding Sridha — curated font catalog
   ─────────────────────────────────────────────────────────────────────
   Used by both index.html (to render the picker preview if needed)
   and admin.html (the font editor dropdowns).

   Three "slots" map to the CSS custom properties:
     display → --f-display    (hero wordmark, loader mark, biggest moments)
     serif   → --f-serif      (section titles, italic accents, captions)
     sans    → --f-sans       (body, UI, labels, buttons)

   Each entry has { family, url }. The url is loaded as a <link rel="stylesheet">
   at runtime; the family is set on the matching CSS variable.

   To add your own font:
     1) Pick "Custom font…" in the admin font editor for the slot you want.
     2) Paste your Google Fonts URL (or any web-font CSS URL) and the exact
        font-family name.
   The change applies live and is included in your next data.js export.
*/

window.SRIDHA_FONTS = {

  display: [
    { family: "Italiana",          url: "https://fonts.googleapis.com/css2?family=Italiana&display=swap" },
    { family: "Playfair Display",  url: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap" },
    { family: "Cormorant Garamond", url: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&display=swap" },
    { family: "Cormorant Infant",  url: "https://fonts.googleapis.com/css2?family=Cormorant+Infant:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&display=swap" },
    { family: "Marcellus",         url: "https://fonts.googleapis.com/css2?family=Marcellus&display=swap" },
    { family: "Bodoni Moda",       url: "https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,wght@0,400;0,500;0,700;1,400&display=swap" },
    { family: "DM Serif Display",  url: "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&display=swap" },
    { family: "Forum",             url: "https://fonts.googleapis.com/css2?family=Forum&display=swap" },
    { family: "Tenor Sans",        url: "https://fonts.googleapis.com/css2?family=Tenor+Sans&display=swap" },
    { family: "Cinzel",            url: "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600&display=swap" }
  ],

  serif: [
    { family: "Cormorant Garamond", url: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&display=swap" },
    { family: "Playfair Display",   url: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&display=swap" },
    { family: "EB Garamond",        url: "https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap" },
    { family: "Lora",               url: "https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;1,400&display=swap" },
    { family: "Crimson Pro",        url: "https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,300;0,400;0,500;1,400&display=swap" },
    { family: "Libre Baskerville",  url: "https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap" },
    { family: "Spectral",           url: "https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,300;0,400;0,500;1,400&display=swap" },
    { family: "DM Serif Text",      url: "https://fonts.googleapis.com/css2?family=DM+Serif+Text:ital@0;1&display=swap" },
    { family: "Cardo",              url: "https://fonts.googleapis.com/css2?family=Cardo:ital,wght@0,400;0,700;1,400&display=swap" },
    { family: "Old Standard TT",    url: "https://fonts.googleapis.com/css2?family=Old+Standard+TT:ital,wght@0,400;0,700;1,400&display=swap" }
  ],

  sans: [
    { family: "Manrope",     url: "https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600&display=swap" },
    { family: "Inter",       url: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap" },
    { family: "Montserrat",  url: "https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600&display=swap" },
    { family: "Jost",        url: "https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;600&display=swap" },
    { family: "Outfit",      url: "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600&display=swap" },
    { family: "Karla",       url: "https://fonts.googleapis.com/css2?family=Karla:wght@300;400;500;600&display=swap" },
    { family: "Work Sans",   url: "https://fonts.googleapis.com/css2?family=Work+Sans:wght@300;400;500;600&display=swap" },
    { family: "DM Sans",     url: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap" },
    { family: "Raleway",     url: "https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;500;600&display=swap" },
    { family: "Lato",        url: "https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&display=swap" }
  ]
};

/* Helper: build a Google Fonts URL from a family name (best-effort).
   Used by the admin "Custom font…" branch when the user only types the
   family name and forgets the URL. */
window.SRIDHA_FONT_GUESS_URL = function (family) {
  if (!family) return "";
  const f = String(family).trim().replace(/\s+/g, "+");
  return `https://fonts.googleapis.com/css2?family=${f}:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&display=swap`;
};
