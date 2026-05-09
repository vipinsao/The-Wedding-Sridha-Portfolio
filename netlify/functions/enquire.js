/* POST /api/enquire — public contact-form receiver
   ───────────────────────────────────────────────────────────────────
   Receives a JSON body with the contact-form fields, formats it as a
   nicely-styled Markdown message, and sends it to a Telegram chat via
   the Bot API. No login required (this is a PUBLIC endpoint).

   Required env vars (set in Netlify → Site configuration → Env vars):
     TELEGRAM_BOT_TOKEN  — from @BotFather when you create the bot
     TELEGRAM_CHAT_ID    — your numeric chat ID (start a DM with the
                           bot, then visit https://api.telegram.org/
                           bot<TOKEN>/getUpdates and copy chat.id)

   Anti-spam:
     • Honeypot field "_hp" — bots auto-fill every input; if filled
       we silently pretend success and never call Telegram.
     • Soft per-IP rate limit — 10 enquiries / minute / instance.
     • Field length caps so a megabyte payload can't be relayed. */

const RATE_WINDOW_MS = 60_000;
const RATE_MAX_PER_WINDOW = 10;
const seen = new Map();

function rateLimit(ip) {
  const now = Date.now();
  /* Sweep stale entries so the Map doesn't grow unboundedly. */
  for (const [k, t] of seen) if (now - t.at > RATE_WINDOW_MS) seen.delete(k);
  const entry = seen.get(ip);
  if (!entry || now - entry.at > RATE_WINDOW_MS) {
    seen.set(ip, { count: 1, at: now });
    return true;
  }
  if (entry.count >= RATE_MAX_PER_WINDOW) return false;
  entry.count += 1;
  return true;
}

/* Telegram MarkdownV2 reserves a long list of punctuation; escape
   anything that could be interpreted as formatting. */
function escMd(s) {
  return String(s == null ? "" : s)
    .replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, (c) => "\\" + c);
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export default async function handler(req) {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "access-control-allow-origin":  "*",
        "access-control-allow-methods": "POST, OPTIONS",
        "access-control-allow-headers": "content-type",
      },
    });
  }
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const ip = req.headers.get("x-nf-client-connection-ip") ||
             req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
             "0.0.0.0";
  if (!rateLimit(ip)) return json({ error: "too many requests, try again in a minute" }, 429);

  let body;
  try { body = await req.json(); }
  catch { return json({ error: "invalid json" }, 400); }

  /* Honeypot — bots fill every field including hidden ones. We pretend
     success so they don't retry, and never touch Telegram. */
  if (body._hp) return json({ ok: true, dropped: "honeypot" }, 200);

  const name    = String(body.name    || "").trim();
  const email   = String(body.email   || "").trim();
  const message = String(body.message || "").trim();
  if (!name || !email || !message) return json({ error: "name, email, and message are required" }, 400);
  if (!/.+@.+\..+/.test(email))    return json({ error: "please check your email address" }, 400);
  if (name.length    > 200)        return json({ error: "name too long" },    400);
  if (email.length   > 200)        return json({ error: "email too long" },   400);
  if (message.length > 5000)       return json({ error: "message too long" }, 400);

  const phone     = (String(body.phone || "").trim()) || "—";
  const venue     = (String(body.venue || "").trim()) || "—";
  const referral  = (String(body.referral || "").trim()) || "—";
  const dateStart = String(body.weddingDateStart || "").trim();
  const dateEnd   = String(body.weddingDateEnd   || "").trim();
  let dateLine = "—";
  if (dateStart && dateEnd && dateStart !== dateEnd) dateLine = `${dateStart} → ${dateEnd}`;
  else if (dateStart || dateEnd)                     dateLine = dateStart || dateEnd;

  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    return json({
      error: "Telegram is not configured on the server.",
      detail: "Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in Netlify env vars."
    }, 500);
  }

  const text =
    `*🎉 New wedding enquiry*\n\n` +
    `*Name:* ${escMd(name)}\n` +
    `*Email:* ${escMd(email)}\n` +
    `*Phone:* ${escMd(phone)}\n` +
    `*Wedding:* ${escMd(dateLine)}\n` +
    `*Venue:* ${escMd(venue)}\n` +
    `*Heard via:* ${escMd(referral)}\n\n` +
    `*Message:*\n${escMd(message)}`;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "MarkdownV2",
        disable_web_page_preview: true,
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return json({
        error: "Telegram rejected the message",
        status: res.status,
        detail: detail.slice(0, 300),
      }, 502);
    }
    return json({ ok: true }, 200);
  } catch (err) {
    return json({ error: "couldn't reach Telegram", detail: String(err).slice(0, 200) }, 502);
  }
}
