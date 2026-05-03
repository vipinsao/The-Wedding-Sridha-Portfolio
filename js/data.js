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
    photo: "https://images.pexels.com/photos/30171219/pexels-photo-30171219.jpeg?auto=compress&cs=tinysrgb&w=2400"
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

  /* Photos sourced from Pexels — curated specifically for each ritual section
     (haldi photos in Haldi, mehndi hands in Mehendi, baraat processions in
     Baraat, mandap & ritual scenes in Pheras, etc.). All images are free for
     commercial use under the Pexels License. Replace with Sridha's actual
     photographs via admin.html for production. */
  sections: [
    {
      id: "haldi", number: "01", title: "Haldi", subtitle: "The Golden Blessing",
      description: "Turmeric on warm skin, marigold light, the first soft laughter of the morning.",
      photos: [
        { src: "https://images.pexels.com/photos/30672338/pexels-photo-30672338.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Bride during haldi as friends apply turmeric", caption: "Touch of turmeric",   focus: "center" },
        { src: "https://images.pexels.com/photos/30706029/pexels-photo-30706029.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Indian bridesmaids in yellow at haldi",        caption: "Marigold morning",    focus: "center" },
        { src: "https://images.pexels.com/photos/35508972/pexels-photo-35508972.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Haldi ceremony with marigold decor",           caption: "First blessings",     focus: "center" },
        { src: "https://images.pexels.com/photos/33786314/pexels-photo-33786314.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Bride with henna-decorated hands at haldi",    caption: "Hands of family",     focus: "center" },
        { src: "https://images.pexels.com/photos/30706025/pexels-photo-30706025.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Women in yellow celebrating haldi",            caption: "Joy spreads",         focus: "center" },
        { src: "https://images.pexels.com/photos/30672290/pexels-photo-30672290.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Bride in yellow with decorative umbrella",     caption: "A quiet pause",       focus: "center" },
        { src: "https://images.pexels.com/photos/17493647/pexels-photo-17493647.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Smiling bride in traditional haldi attire",    caption: "Sunlit",              focus: "top" },
        { src: "https://images.pexels.com/photos/33051754/pexels-photo-33051754.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Bride in yellow saree at haldi in Kolkata",    caption: "Bride in yellow",     focus: "center" },
        { src: "https://images.pexels.com/photos/32428340/pexels-photo-32428340.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Indian wedding haldi ceremony with family",    caption: "Friends gathered",    focus: "center" },
        { src: "https://images.pexels.com/photos/30706028/pexels-photo-30706028.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Colourful haldi ceremony in Varanasi",         caption: "Morning of light",    focus: "center" }
      ]
    },
    {
      id: "mehendi", number: "02", title: "Mehendi", subtitle: "Henna & Whispered Wishes",
      description: "Slow afternoons, intricate vines drawn in henna, secrets traded between sisters.",
      photos: [
        { src: "https://images.pexels.com/photos/28496968/pexels-photo-28496968.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Bride's hands with intricate floral mehndi",   caption: "Vines & verses",      focus: "center" },
        { src: "https://images.pexels.com/photos/35555354/pexels-photo-35555354.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Indian bride with mehndi and floral jewelry",  caption: "First lines",         focus: "center" },
        { src: "https://images.pexels.com/photos/30931271/pexels-photo-30931271.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Intricate mehndi design close-up",             caption: "Up close",            focus: "center" },
        { src: "https://images.pexels.com/photos/32029488/pexels-photo-32029488.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Henna patterns on bridal hands",               caption: "After the artist",    focus: "center" },
        { src: "https://images.pexels.com/photos/36354615/pexels-photo-36354615.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Artist applying henna to bride's arm",         caption: "The artist's hand",   focus: "center" },
        { src: "https://images.pexels.com/photos/36581308/pexels-photo-36581308.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Mehndi on bride's hands with yellow ribbons",  caption: "Ribbons & rest",      focus: "bottom" },
        { src: "https://images.pexels.com/photos/30840087/pexels-photo-30840087.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Bride with mehndi in Gujarat",                 caption: "Sisterhood",          focus: "center" },
        { src: "https://images.pexels.com/photos/18016523/pexels-photo-18016523.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Detailed bridal henna on hands",               caption: "Detail",              focus: "center" },
        { src: "https://images.pexels.com/photos/4711086/pexels-photo-4711086.jpeg?auto=compress&cs=tinysrgb&w=900",   alt: "Henna art on Indian bride's hands",            caption: "Whispers",            focus: "bottom" },
        { src: "https://images.pexels.com/photos/16155926/pexels-photo-16155926.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Close-up of hands during a wedding",           caption: "Hands at rest",       focus: "center" }
      ]
    },
    {
      id: "sangeet", number: "03", title: "Sangeet", subtitle: "Rhythm of the Night",
      description: "Stage lights, bare feet on polished floors, the family choreography no one quite remembers but everyone joins.",
      photos: [
        { src: "https://images.pexels.com/photos/35328204/pexels-photo-35328204.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Colourful Indian wedding dance celebration",   caption: "First beat",          focus: "center" },
        { src: "https://images.pexels.com/photos/33885310/pexels-photo-33885310.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Joyful guests dancing outdoors",               caption: "Hands lifted",        focus: "center" },
        { src: "https://images.pexels.com/photos/33343605/pexels-photo-33343605.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Bride in pink lehenga dancing in Agra",        caption: "Centre stage",        focus: "center" },
        { src: "https://images.pexels.com/photos/33194311/pexels-photo-33194311.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Indian wedding ceremony under night lights",   caption: "Lights",              focus: "center" },
        { src: "https://images.pexels.com/photos/33885311/pexels-photo-33885311.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Colourful outdoor Indian wedding crowd",       caption: "Together",            focus: "center" },
        { src: "https://images.pexels.com/photos/20058047/pexels-photo-20058047.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Joyful Indian wedding celebration",            caption: "Cheers",              focus: "center" },
        { src: "https://images.pexels.com/photos/32107250/pexels-photo-32107250.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Couple in traditional attire at night",        caption: "Between songs",       focus: "center" },
        { src: "https://images.pexels.com/photos/33427272/pexels-photo-33427272.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Night fireworks during the celebration",       caption: "After the bow",       focus: "top" },
        { src: "https://images.pexels.com/photos/30664564/pexels-photo-30664564.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Vibrant Indian procession with drummers",      caption: "On stage",            focus: "center" },
        { src: "https://images.pexels.com/photos/30184708/pexels-photo-30184708.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Traditional Indian wedding procession",        caption: "An aside",            focus: "center" }
      ]
    },
    {
      id: "baraat", number: "04", title: "Baraat", subtitle: "Arrival of the Heart",
      description: "Brass bands, slow horses, a groom held aloft on the shoulders of his cousins. The street belongs to them.",
      photos: [
        { src: "https://images.pexels.com/photos/8286046/pexels-photo-8286046.jpeg?auto=compress&cs=tinysrgb&w=900",   alt: "Indian groom on a decorated horse",            caption: "On horseback",        focus: "center" },
        { src: "https://images.pexels.com/photos/30664564/pexels-photo-30664564.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Vibrant Indian procession with drummers",      caption: "Brass & dust",        focus: "center" },
        { src: "https://images.pexels.com/photos/30184708/pexels-photo-30184708.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Traditional procession with the groom",        caption: "Down the street",     focus: "center" },
        { src: "https://images.pexels.com/photos/36818415/pexels-photo-36818415.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Groom on a decorated wedding horse",           caption: "Behind the sehra",    focus: "top" },
        { src: "https://images.pexels.com/photos/24334592/pexels-photo-24334592.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Men in white on a horse-drawn cart",           caption: "Cousins, in flight",  focus: "center" },
        { src: "https://images.pexels.com/photos/8155771/pexels-photo-8155771.jpeg?auto=compress&cs=tinysrgb&w=900",   alt: "Groom in white turban under a red umbrella",   caption: "Father, watching",    focus: "center" },
        { src: "https://images.pexels.com/photos/16227214/pexels-photo-16227214.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Colourful decorations on procession horses",   caption: "Welcome",             focus: "center" },
        { src: "https://images.pexels.com/photos/34795117/pexels-photo-34795117.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Colourful traditional parade in ornate attire", caption: "Detail",              focus: "center" },
        { src: "https://images.pexels.com/photos/11091402/pexels-photo-11091402.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Man in turban looking afar at the procession", caption: "Nazar",               focus: "top" },
        { src: "https://images.pexels.com/photos/10597442/pexels-photo-10597442.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Decorated horse at an Indian wedding",         caption: "After",               focus: "center" }
      ]
    },
    {
      id: "wedding", number: "05", title: "Pheras", subtitle: "Seven Sacred Vows",
      description: "Fire and Sanskrit, a knot tied in cloth, seven steps that change two surnames forever.",
      photos: [
        { src: "https://images.pexels.com/photos/30184678/pexels-photo-30184678.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Couple performing rituals under red and gold", caption: "Around the flame",    focus: "center" },
        { src: "https://images.pexels.com/photos/33417236/pexels-photo-33417236.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Ornate mandap setup at an outdoor fort",       caption: "Mandap",              focus: "top" },
        { src: "https://images.pexels.com/photos/34079355/pexels-photo-34079355.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Luxurious floral mandap with chandeliers",     caption: "The agni",            focus: "center" },
        { src: "https://images.pexels.com/photos/30184621/pexels-photo-30184621.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Outdoor wedding ceremony with floral mandap",  caption: "Garlands",            focus: "center" },
        { src: "https://images.pexels.com/photos/36814776/pexels-photo-36814776.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Bride and groom performing rituals",           caption: "Gathbandhan",         focus: "center" },
        { src: "https://images.pexels.com/photos/14395559/pexels-photo-14395559.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Indian wedding stage with garlands",           caption: "Varmala",             focus: "center" },
        { src: "https://images.pexels.com/photos/32153629/pexels-photo-32153629.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Couple in traditional attire in Jaipur",       caption: "Sindoor",             focus: "center" },
        { src: "https://images.pexels.com/photos/12432503/pexels-photo-12432503.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Floral decor on Indian wedding stage",         caption: "Aarti",               focus: "center" },
        { src: "https://images.pexels.com/photos/35008110/pexels-photo-35008110.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Joyful ceremony moment",                       caption: "Blessings",           focus: "center" },
        { src: "https://images.pexels.com/photos/32483916/pexels-photo-32483916.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Traditional Indian ceremony in colourful attire", caption: "Light",            focus: "center" }
      ]
    },
    {
      id: "reception", number: "06", title: "Reception", subtitle: "A Toast to Forever",
      description: "Long aisles of marigold, a stage of velvet, a first dance that everyone pretends not to watch.",
      photos: [
        { src: "https://images.pexels.com/photos/36098386/pexels-photo-36098386.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Couple in red and white at the reception",     caption: "The arrival",         focus: "center" },
        { src: "https://images.pexels.com/photos/36098369/pexels-photo-36098369.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Couple in red attire outdoors",                caption: "First dance",         focus: "center" },
        { src: "https://images.pexels.com/photos/17657612/pexels-photo-17657612.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Newlyweds embracing at outdoor reception",     caption: "A toast",             focus: "center" },
        { src: "https://images.pexels.com/photos/33427272/pexels-photo-33427272.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Couple celebrating at night with fireworks",   caption: "Chandeliers",         focus: "center" },
        { src: "https://images.pexels.com/photos/32107250/pexels-photo-32107250.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Couple in traditional attire at night",        caption: "Soirée",              focus: "center" },
        { src: "https://images.pexels.com/photos/33885311/pexels-photo-33885311.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Colourful outdoor wedding celebration",        caption: "Family",              focus: "center" },
        { src: "https://images.pexels.com/photos/8621982/pexels-photo-8621982.jpeg?auto=compress&cs=tinysrgb&w=900",   alt: "Couple embracing in traditional attire",       caption: "The two of us",       focus: "center" },
        { src: "https://images.pexels.com/photos/6023737/pexels-photo-6023737.jpeg?auto=compress&cs=tinysrgb&w=900",   alt: "Bride and groom sharing a tender moment",      caption: "Tender moment",       focus: "center" },
        { src: "https://images.pexels.com/photos/36836727/pexels-photo-36836727.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Couple in traditional attire at the ceremony", caption: "Florals",             focus: "center" },
        { src: "https://images.pexels.com/photos/30707334/pexels-photo-30707334.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Couple sharing an intimate embrace",           caption: "Last toast",          focus: "center" }
      ]
    },
    {
      id: "portraits", number: "07", title: "Couple Portraits", subtitle: "Just Them, Just Light",
      description: "Away from the crowd. A doorway, a balcony, ten quiet minutes that become the framed print on the wall.",
      photos: [
        { src: "https://images.pexels.com/photos/36098363/pexels-photo-36098363.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Traditional Indian couple posed outdoors",     caption: "A quiet frame",       focus: "center" },
        { src: "https://images.pexels.com/photos/19733687/pexels-photo-19733687.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Indian wedding couple in Surat",               caption: "Window light",        focus: "center" },
        { src: "https://images.pexels.com/photos/18628263/pexels-photo-18628263.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Hands of a traditional wedding couple",        caption: "Held",                focus: "bottom" },
        { src: "https://images.pexels.com/photos/19230329/pexels-photo-19230329.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Young couple at an Indian wedding",            caption: "Together",            focus: "center" },
        { src: "https://images.pexels.com/photos/20513771/pexels-photo-20513771.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Hindu bride and groom in traditional clothing", caption: "Soft light",          focus: "center" },
        { src: "https://images.pexels.com/photos/6544197/pexels-photo-6544197.jpeg?auto=compress&cs=tinysrgb&w=900",   alt: "Indian couple in ornate traditional clothing", caption: "Smiles",              focus: "center" },
        { src: "https://images.pexels.com/photos/9778787/pexels-photo-9778787.jpeg?auto=compress&cs=tinysrgb&w=900",   alt: "Groom kissing his bride's hand",               caption: "Tender",              focus: "center" },
        { src: "https://images.pexels.com/photos/12968722/pexels-photo-12968722.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Couple exchanging vows in traditional dress",  caption: "The vow",             focus: "center" },
        { src: "https://images.pexels.com/photos/36098378/pexels-photo-36098378.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Couple in traditional Indian attire",          caption: "Editorial",           focus: "center" },
        { src: "https://images.pexels.com/photos/30171219/pexels-photo-30171219.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Traditional Indian wedding ceremony portrait", caption: "Last light",          focus: "center" }
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
