/* The Wedding Sridha — default content.
   This file is the source of truth for both index.html and admin.html.
   Edit it directly, OR use admin.html and click "Export data.js" to overwrite. */

window.SRIDHA_DATA = {

  brand: {
    name: "The Wedding Sridha",
    mark: "TWS",
    tagline: "Heirloom photography for Indian weddings"
  },

  hero: {
    eyebrow: "Indian Wedding Photography · Est. 2024",
    title: "A wedding remembered in light, gold and silk.",
    body: "Editorial, unhurried, deeply personal. Documenting the rituals and the in-between moments — from the first haldi smudge to the last reception toast.",
    ctaText: "Begin a Conversation",
    ctaHref: "#contact",
    photo: "https://images.unsplash.com/photo-1583077874340-79db6564672e?w=2200&q=85&auto=format&fit=crop"
  },

  about: {
    eyebrow: "Behind the Lens",
    title: "Hello, I'm Sridha.",
    body: "I photograph Indian weddings as I'd want my own remembered — slowly, attentively, in a way that honours the rituals without flattening them. Eight years, more than ninety weddings, and a quiet conviction that the best frames find themselves when no one is performing for the camera.",
    signature: "— S.",
    photo: "https://images.unsplash.com/photo-1517363898874-737b62a7db91?w=1400&q=85&auto=format&fit=crop"
  },

  storiesIntro: {
    eyebrow: "The Work",
    title: "Seven small worlds, one wedding.",
    body: "Every Indian wedding contains many weddings inside it. Here is a season's worth of mornings and midnights, told the way I prefer to tell them — close, warm, and largely unposed."
  },

  /* Photo IDs below are drawn from a curated pool of Indian-wedding-themed
     Unsplash images. The same image may reuse across sections with a different
     focus crop (top / center / bottom) — this is intentional placeholder
     content. Replace with Sridha's actual photographs via admin.html for
     production. */
  sections: [
    {
      id: "haldi", number: "01", title: "Haldi", subtitle: "The Golden Blessing",
      description: "Turmeric on warm skin, marigold light, the first soft laughter of the morning.",
      photos: [
        { src: "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=900&q=80&auto=format&fit=crop", alt: "Bride during the haldi ceremony",   caption: "Morning of light",    focus: "center" },
        { src: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=900&q=80&auto=format&fit=crop", alt: "Marigold petals scattered",         caption: "Marigold rain",       focus: "top" },
        { src: "https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=900&q=80&auto=format&fit=crop", alt: "Family blessings",                  caption: "First blessings",     focus: "center" },
        { src: "https://images.unsplash.com/photo-1583521214690-73421a1829a9?w=900&q=80&auto=format&fit=crop", alt: "Hands during the ceremony",         caption: "Touch of turmeric",   focus: "bottom" },
        { src: "https://images.unsplash.com/photo-1583077874340-79db6564672e?w=900&q=80&auto=format&fit=crop", alt: "Bride in traditional attire",       caption: "A quiet pause",       focus: "center" },
        { src: "https://images.unsplash.com/photo-1604578762246-41134e37f9cc?w=900&q=80&auto=format&fit=crop", alt: "Bride with friends",                caption: "Friends gathered",    focus: "center" },
        { src: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=900&q=80&auto=format&fit=crop", alt: "Sunlit bride portrait",             caption: "Sunlit",              focus: "top" },
        { src: "https://images.unsplash.com/photo-1604017011826-d3b4c23f8914?w=900&q=80&auto=format&fit=crop", alt: "Detail of stained hands",           caption: "Aunt's gift",         focus: "center" },
        { src: "https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=900&q=80&auto=format&fit=crop", alt: "Joined family hands",               caption: "Hands held",          focus: "center" },
        { src: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=900&q=80&auto=format&fit=crop", alt: "Celebration moment",                caption: "Joy spreads",         focus: "center" }
      ]
    },
    {
      id: "mehendi", number: "02", title: "Mehendi", subtitle: "Henna & Whispered Wishes",
      description: "Slow afternoons, intricate vines drawn in henna, secrets traded between sisters.",
      photos: [
        { src: "https://images.unsplash.com/photo-1583939411023-14783179e581?w=900&q=80&auto=format&fit=crop", alt: "Mehendi on hands",                  caption: "First lines",         focus: "center" },
        { src: "https://images.unsplash.com/photo-1604017011826-d3b4c23f8914?w=900&q=80&auto=format&fit=crop", alt: "Mehendi pattern detail",            caption: "Vines & verses",      focus: "center" },
        { src: "https://images.unsplash.com/photo-1604578762246-41134e37f9cc?w=900&q=80&auto=format&fit=crop", alt: "Bride and sisters",                 caption: "Sisterhood",          focus: "center" },
        { src: "https://images.unsplash.com/photo-1597211833712-5e41faa202ea?w=900&q=80&auto=format&fit=crop", alt: "Stained hands after the artist",    caption: "After the artist",    focus: "bottom" },
        { src: "https://images.unsplash.com/photo-1583077874340-79db6564672e?w=900&q=80&auto=format&fit=crop", alt: "Bride waiting",                     caption: "Waiting",             focus: "center" },
        { src: "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=900&q=80&auto=format&fit=crop", alt: "Bride at rest",                     caption: "Quiet hours",         focus: "top" },
        { src: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=900&q=80&auto=format&fit=crop", alt: "Marigold florals",                  caption: "Florals nearby",      focus: "center" },
        { src: "https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=900&q=80&auto=format&fit=crop", alt: "Family around the bride",           caption: "Whispers",            focus: "top" },
        { src: "https://images.unsplash.com/photo-1583521214690-73421a1829a9?w=900&q=80&auto=format&fit=crop", alt: "Hands at rest",                     caption: "Rest",                focus: "bottom" },
        { src: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=900&q=80&auto=format&fit=crop", alt: "Bride in soft afternoon light",     caption: "Bride at dusk",       focus: "center" }
      ]
    },
    {
      id: "sangeet", number: "03", title: "Sangeet", subtitle: "Rhythm of the Night",
      description: "Stage lights, bare feet on polished floors, the family choreography no one quite remembers but everyone joins.",
      photos: [
        { src: "https://images.unsplash.com/photo-1593118247619-e2d6f056869e?w=900&q=80&auto=format&fit=crop", alt: "Dance under stage lights",          caption: "First beat",          focus: "center" },
        { src: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=900&q=80&auto=format&fit=crop", alt: "Family clapping",                   caption: "Hands lifted",        focus: "center" },
        { src: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=900&q=80&auto=format&fit=crop", alt: "Quiet moment between songs",        caption: "Centre stage",        focus: "center" },
        { src: "https://images.unsplash.com/photo-1502635385003-ee1e6a1a742d?w=900&q=80&auto=format&fit=crop", alt: "Brass band performing",             caption: "After the bow",       focus: "top" },
        { src: "https://images.unsplash.com/photo-1542327897-d73f4005b533?w=900&q=80&auto=format&fit=crop",   alt: "Cousins dancing together",          caption: "Between songs",       focus: "center" },
        { src: "https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=900&q=80&auto=format&fit=crop", alt: "Family on stage",                   caption: "On stage",            focus: "center" },
        { src: "https://images.unsplash.com/photo-1583077874340-79db6564672e?w=900&q=80&auto=format&fit=crop", alt: "Bride at sangeet",                  caption: "Cheers",              focus: "top" },
        { src: "https://images.unsplash.com/photo-1606490194859-07c18c9f0968?w=900&q=80&auto=format&fit=crop", alt: "Groom celebrating",                 caption: "Lights",              focus: "top" },
        { src: "https://images.unsplash.com/photo-1604578762246-41134e37f9cc?w=900&q=80&auto=format&fit=crop", alt: "Couple together at sangeet",        caption: "Together",            focus: "center" },
        { src: "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=900&q=80&auto=format&fit=crop", alt: "A quiet aside",                     caption: "An aside",            focus: "center" }
      ]
    },
    {
      id: "baraat", number: "04", title: "Baraat", subtitle: "Arrival of the Heart",
      description: "Brass bands, slow horses, a groom held aloft on the shoulders of his cousins. The street belongs to them.",
      photos: [
        { src: "https://images.unsplash.com/photo-1535930749574-1399327ce78f?w=900&q=80&auto=format&fit=crop", alt: "Groom on horseback",                caption: "On horseback",        focus: "center" },
        { src: "https://images.unsplash.com/photo-1502635385003-ee1e6a1a742d?w=900&q=80&auto=format&fit=crop", alt: "Brass band leading the procession", caption: "Brass & dust",        focus: "center" },
        { src: "https://images.unsplash.com/photo-1542327897-d73f4005b533?w=900&q=80&auto=format&fit=crop",   alt: "Cousins dancing in the procession", caption: "Cousins, in flight",  focus: "center" },
        { src: "https://images.unsplash.com/photo-1606490194859-07c18c9f0968?w=900&q=80&auto=format&fit=crop", alt: "Groom in sehra",                    caption: "Behind the sehra",    focus: "top" },
        { src: "https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=900&q=80&auto=format&fit=crop", alt: "Father watching the procession",    caption: "Father, watching",    focus: "center" },
        { src: "https://images.unsplash.com/photo-1535930749574-1399327ce78f?w=900&q=80&auto=format&fit=crop", alt: "Procession down the street",        caption: "Down the street",     focus: "top" },
        { src: "https://images.unsplash.com/photo-1502635385003-ee1e6a1a742d?w=900&q=80&auto=format&fit=crop", alt: "Welcoming crowd",                   caption: "Welcome",             focus: "bottom" },
        { src: "https://images.unsplash.com/photo-1606490194859-07c18c9f0968?w=900&q=80&auto=format&fit=crop", alt: "Nazar moment",                      caption: "Nazar",               focus: "center" },
        { src: "https://images.unsplash.com/photo-1542327897-d73f4005b533?w=900&q=80&auto=format&fit=crop",   alt: "Procession detail",                 caption: "Detail",              focus: "top" },
        { src: "https://images.unsplash.com/photo-1593118247619-e2d6f056869e?w=900&q=80&auto=format&fit=crop", alt: "After the arrival",                 caption: "After",               focus: "center" }
      ]
    },
    {
      id: "wedding", number: "05", title: "Pheras", subtitle: "Seven Sacred Vows",
      description: "Fire and Sanskrit, a knot tied in cloth, seven steps that change two surnames forever.",
      photos: [
        { src: "https://images.unsplash.com/photo-1622308644420-b20142dc993c?w=900&q=80&auto=format&fit=crop", alt: "Sacred fire at the mandap",          caption: "The agni",            focus: "center" },
        { src: "https://images.unsplash.com/photo-1542144612-1b3641ec3459?w=900&q=80&auto=format&fit=crop",   alt: "Pheras around the fire",             caption: "Around the flame",    focus: "center" },
        { src: "https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=900&q=80&auto=format&fit=crop", alt: "Hands tied in cloth",                caption: "Gathbandhan",         focus: "center" },
        { src: "https://images.unsplash.com/photo-1583521214690-73421a1829a9?w=900&q=80&auto=format&fit=crop", alt: "Sindoor moment",                     caption: "Sindoor",             focus: "bottom" },
        { src: "https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=900&q=80&auto=format&fit=crop", alt: "Family blessings",                   caption: "Blessings",           focus: "center" },
        { src: "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=900&q=80&auto=format&fit=crop", alt: "Mandap detail",                      caption: "Mandap",              focus: "top" },
        { src: "https://images.unsplash.com/photo-1583077874340-79db6564672e?w=900&q=80&auto=format&fit=crop", alt: "Bride at the mandap",                caption: "Varmala",             focus: "center" },
        { src: "https://images.unsplash.com/photo-1606490194859-07c18c9f0968?w=900&q=80&auto=format&fit=crop", alt: "Groom at the ceremony",              caption: "Aarti",               focus: "center" },
        { src: "https://images.unsplash.com/photo-1604578762246-41134e37f9cc?w=900&q=80&auto=format&fit=crop", alt: "Garland exchange",                   caption: "Garlands",            focus: "center" },
        { src: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=900&q=80&auto=format&fit=crop", alt: "Ceremonial florals",                 caption: "Light",               focus: "center" }
      ]
    },
    {
      id: "reception", number: "06", title: "Reception", subtitle: "A Toast to Forever",
      description: "Long aisles of marigold, a stage of velvet, a first dance that everyone pretends not to watch.",
      photos: [
        { src: "https://images.unsplash.com/photo-1583077874340-79db6564672e?w=900&q=80&auto=format&fit=crop", alt: "Bride at the reception entry",       caption: "The arrival",         focus: "center" },
        { src: "https://images.unsplash.com/photo-1606490194859-07c18c9f0968?w=900&q=80&auto=format&fit=crop", alt: "Groom in formal attire",             caption: "First slice",         focus: "center" },
        { src: "https://images.unsplash.com/photo-1604578762246-41134e37f9cc?w=900&q=80&auto=format&fit=crop", alt: "Couple together",                    caption: "First dance",         focus: "center" },
        { src: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=900&q=80&auto=format&fit=crop", alt: "Friends raising a glass",            caption: "A toast",             focus: "center" },
        { src: "https://images.unsplash.com/photo-1593118247619-e2d6f056869e?w=900&q=80&auto=format&fit=crop", alt: "Reception lights",                   caption: "Chandeliers",         focus: "top" },
        { src: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=900&q=80&auto=format&fit=crop", alt: "Floral decor",                       caption: "Florals",             focus: "center" },
        { src: "https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=900&q=80&auto=format&fit=crop", alt: "Family at the reception",            caption: "Family",              focus: "center" },
        { src: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=900&q=80&auto=format&fit=crop", alt: "Reception scene",                    caption: "Soirée",              focus: "center" },
        { src: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=900&q=80&auto=format&fit=crop", alt: "Bride in quiet portrait",            caption: "Quiet moment",        focus: "center" },
        { src: "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=900&q=80&auto=format&fit=crop", alt: "Closing celebration",                caption: "Last toast",          focus: "center" }
      ]
    },
    {
      id: "portraits", number: "07", title: "Couple Portraits", subtitle: "Just Them, Just Light",
      description: "Away from the crowd. A doorway, a balcony, ten quiet minutes that become the framed print on the wall.",
      photos: [
        { src: "https://images.unsplash.com/photo-1583077874340-79db6564672e?w=900&q=80&auto=format&fit=crop", alt: "Bride by the window",                caption: "Window light",        focus: "center" },
        { src: "https://images.unsplash.com/photo-1606490194859-07c18c9f0968?w=900&q=80&auto=format&fit=crop", alt: "Groom portrait",                     caption: "A quiet frame",       focus: "center" },
        { src: "https://images.unsplash.com/photo-1604578762246-41134e37f9cc?w=900&q=80&auto=format&fit=crop", alt: "Bride in soft light",                caption: "Soft light",          focus: "center" },
        { src: "https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=900&q=80&auto=format&fit=crop", alt: "Held hands",                         caption: "Held",                focus: "center" },
        { src: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=900&q=80&auto=format&fit=crop", alt: "Bride portrait",                     caption: "Bride",               focus: "center" },
        { src: "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=900&q=80&auto=format&fit=crop", alt: "Couple looking together",            caption: "Together",            focus: "top" },
        { src: "https://images.unsplash.com/photo-1583521214690-73421a1829a9?w=900&q=80&auto=format&fit=crop", alt: "Walking, hands joined",              caption: "Walking",             focus: "bottom" },
        { src: "https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=900&q=80&auto=format&fit=crop", alt: "Tender moment",                      caption: "Tender",              focus: "center" },
        { src: "https://images.unsplash.com/photo-1604017011826-d3b4c23f8914?w=900&q=80&auto=format&fit=crop", alt: "Editorial detail",                   caption: "Editorial",           focus: "center" },
        { src: "https://images.unsplash.com/photo-1597211833712-5e41faa202ea?w=900&q=80&auto=format&fit=crop", alt: "Last light, hands and henna",        caption: "Last light",          focus: "center" }
      ]
    }
  ],

  testimonials: {
    eyebrow: "Words from Couples",
    title: "What our couples say",
    items: [
      { quote: "Sridha didn't just photograph our wedding — she preserved it. Three years on, our album still feels like a film we lived inside. Every aunt has asked for her number.", name: "Aanya & Rohan",  location: "Udaipur · 2024" },
      { quote: "We had a hundred relatives, two cities, four ceremonies and one tiny request: please make it look like us. She did exactly that. The portraits feel like paintings.", name: "Meher & Devansh", location: "Jaipur · 2025" },
      { quote: "Calm presence, sharp eye, zero fuss. She caught my mother crying during the bidaai in a way I will treasure for the rest of my life.",                              name: "Tanisha & Karan",  location: "Goa · 2025" }
    ]
  },

  press: {
    eyebrow: "Featured In",
    items: [
      "WeddingSutra", "Brides Today", "Vogue Wedding",
      "The Wedding Brigade", "Condé Nast Traveller", "Harper's Bazaar"
    ]
  },

  faq: {
    eyebrow: "Frequently Asked",
    title: "Before you write to us",
    items: [
      { q: "Do you travel for weddings outside India?", a: "Yes — we shoot internationally and have photographed weddings across the UK, UAE, Italy and Bali. Travel and stay are arranged by us, billed at cost." },
      { q: "How far in advance should we book?",         a: "For peak season (Nov–Feb) we recommend reaching out 6–9 months ahead. For other dates, 3–4 months is usually comfortable." },
      { q: "What does a typical engagement look like?",  a: "A 30-minute call, a written proposal within a week, a small contract, and a 30% retainer to hold the dates. We'll plan the shoot list together a month before the wedding." },
      { q: "When will we receive our photos?",           a: "A curated set of 80–100 highlights within 10 days. The full edited collection (typically 600–900 images) within 6–8 weeks." },
      { q: "Do you offer albums and prints?",            a: "Yes. Hand-bound, fine-art-paper albums and archival giclée prints are available — we'll show you samples at the planning meeting." }
    ]
  },

  contact: {
    eyebrow: "Bookings & Enquiries",
    headline: "Let's tell yours.",
    body: "Tell us about your wedding — the dates, the city, anything you're dreaming of. We reply to every enquiry within 48 hours.",
    email: "hello@theweddingsridha.com",
    phone: "+91 00000 00000",
    instagram: "@theweddingsridha",
    location: "Based in India · Travels worldwide",
    /* Set this to your Formspree (https://formspree.io) endpoint to receive
       enquiries by email. Leave empty to fall back to a mailto: handoff. */
    formAction: "",
    successMessage: "Thank you. Your enquiry is on its way — we'll be in touch within 48 hours.",
    footerLine: "© The Wedding Sridha — heirloom photography"
  },

  /* ── Typography ─────────────────────────────────────────────────────
     Three font slots, each loaded via a CSS URL at runtime.
     Change them in admin.html → "Typography" — pick from the curated
     dropdown, or choose "Custom font…" and paste any web-font CSS URL. */
  fonts: {
    display: { family: "Italiana",          url: "https://fonts.googleapis.com/css2?family=Italiana&display=swap" },
    serif:   { family: "Cormorant Garamond", url: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&display=swap" },
    sans:    { family: "Manrope",           url: "https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600&display=swap" }
  },

  meta: {
    adminPassword: "sridha2024"
  }
};
