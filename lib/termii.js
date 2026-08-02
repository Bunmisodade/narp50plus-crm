// Server-only. Wraps Termii's SMS + WhatsApp APIs.
//
// IMPORTANT: this is written from general knowledge of Termii's API shape at
// the time of writing, not a live-verified integration. Before relying on
// this in production, confirm the endpoint paths and request bodies below
// against Termii's current API documentation (https://developer.termii.com)
// once you have a live API key — the SMS endpoint is Termii's long-standing,
// well-documented one and is unlikely to have changed; the WhatsApp endpoint
// is the piece most likely to need adjusting, since WhatsApp Business
// messaging APIs (template approval, session windows) evolve more often.

const TERMII_BASE_URL = "https://api.ng.termii.com/api";

// Normalizes a Nigerian phone number to the international format Termii
// expects (234XXXXXXXXXX, no leading + or 0).
function normalizePhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.startsWith("234")) return digits;
  if (digits.startsWith("0")) return "234" + digits.slice(1);
  return digits;
}

export async function sendSms(to, message) {
  const phone = normalizePhone(to);
  if (!phone) return { ok: false, error: "No valid phone number" };

  try {
    const res = await fetch(`${TERMII_BASE_URL}/sms/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: process.env.TERMII_API_KEY,
        to: phone,
        from: process.env.TERMII_SENDER_ID,
        sms: message,
        type: "plain",
        channel: "generic",
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("Termii SMS failed:", data);
      return { ok: false, error: data };
    }
    return { ok: true, data };
  } catch (e) {
    console.error("Termii SMS threw:", e);
    return { ok: false, error: String(e) };
  }
}

export async function sendWhatsApp(to, message) {
  const phone = normalizePhone(to);
  if (!phone) return { ok: false, error: "No valid phone number" };

  try {
    const res = await fetch(`${TERMII_BASE_URL}/send/whatsapp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: process.env.TERMII_API_KEY,
        to: phone,
        from: process.env.TERMII_SENDER_ID,
        sms: message,
        type: "plain",
        channel: "whatsapp",
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("Termii WhatsApp failed:", data);
      return { ok: false, error: data };
    }
    return { ok: true, data };
  } catch (e) {
    console.error("Termii WhatsApp threw:", e);
    return { ok: false, error: String(e) };
  }
}
