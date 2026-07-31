import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

// Node runtime required for the `crypto` HMAC verification below.
export const runtime = "nodejs";

// Mirrors PLAN_CONFIG in /api/paystack/initialize (kept separate since that
// file also carries Paystack plan codes we don't need here).
const MEMBER_LIMIT_BY_PLAN = { starter: 100, growth: 300, enterprise: null };

function slugify(name) {
  const base = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return base || "cooperative";
}

function generateInviteCode() {
  return crypto.randomBytes(4).toString("hex").toUpperCase(); // e.g. "B4C1A9F2"
}

async function sendWelcomeEmail({ email, adminName, cooperativeName, inviteCode }) {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Cooperative CRM <onboarding@mail.corporatebundles.com>",
        to: email,
        subject: `Welcome to Cooperative CRM, ${cooperativeName}`,
        html: `<p>Hi ${adminName || "there"},</p>
<p>Payment received — <strong>${cooperativeName}</strong> is set up on Cooperative CRM.</p>
<p>Sign in at <a href="${process.env.NEXT_PUBLIC_APP_URL}/login">${process.env.NEXT_PUBLIC_APP_URL}/login</a>
using this email address and the invite code below (it's single-use):</p>
<p style="font-size:22px;font-weight:bold;letter-spacing:2px;">${inviteCode}</p>
<p>You'll receive a magic sign-in link by email right after.</p>`,
      }),
    });
    if (!res.ok) console.error("Resend welcome email failed:", await res.text());
  } catch (e) {
    console.error("Welcome email threw:", e);
  }
}

// Creates the cooperative + a single-use invite code, then emails the admin.
// Runs on charge.success, where our own `metadata` (set in /api/paystack/initialize)
// is guaranteed to be present.
async function provisionCooperative(data) {
  const { cooperative_name: cooperativeName, admin_name: adminName, plan } = data.metadata || {};
  const email = data.customer?.email;
  const customerCode = data.customer?.customer_code;

  if (!cooperativeName || !email || !plan) {
    console.error("charge.success missing expected metadata; skipping provisioning.", data.reference);
    return;
  }

  // Idempotent: a retry or duplicate delivery shouldn't create a second cooperative.
  const { data: existing } = await supabaseAdmin
    .from("cooperatives")
    .select("id")
    .eq("paystack_customer_code", customerCode)
    .maybeSingle();
  if (existing) return;

  let slug = slugify(cooperativeName);
  const { data: slugClash } = await supabaseAdmin.from("cooperatives").select("id").eq("slug", slug).maybeSingle();
  if (slugClash) slug = `${slug}-${Date.now().toString(36)}`;

  const { data: coop, error: coopError } = await supabaseAdmin
    .from("cooperatives")
    .insert({
      name: cooperativeName,
      slug,
      plan,
      subscription_status: "active",
      member_limit: MEMBER_LIMIT_BY_PLAN[plan] ?? null,
      paystack_customer_code: customerCode,
    })
    .select()
    .single();

  if (coopError) {
    console.error("Failed to create cooperative:", coopError);
    return;
  }

  const inviteCode = generateInviteCode();
  const { error: inviteError } = await supabaseAdmin.from("invite_codes").insert({
    cooperative_id: coop.id,
    code: inviteCode,
    role: "admin",
    max_uses: 1,
  });

  if (inviteError) {
    console.error("Failed to create invite code:", inviteError);
    return;
  }

  await sendWelcomeEmail({ email, adminName, cooperativeName, inviteCode });
}

// subscription.create can arrive within milliseconds of charge.success — sometimes
// before provisionCooperative has finished inserting the cooperative row. Retry
// a few times with a short delay rather than silently updating zero rows.
async function attachSubscription(data, attempt = 1) {
  const customerCode = data.customer?.customer_code;
  if (!customerCode) return;

  const { data: updated, error } = await supabaseAdmin
    .from("cooperatives")
    .update({
      paystack_subscription_code: data.subscription_code || null,
      current_period_end: data.next_payment_date || null,
    })
    .eq("paystack_customer_code", customerCode)
    .select("id");

  if (error) {
    console.error("Failed to attach subscription:", error);
    return;
  }

  if ((!updated || updated.length === 0) && attempt < 5) {
    await new Promise((r) => setTimeout(r, 1000));
    return attachSubscription(data, attempt + 1);
  }

  if (!updated || updated.length === 0) {
    console.error("attachSubscription: no matching cooperative found after retries for customer", customerCode);
  }
}

async function markSubscriptionStatus(data, status) {
  const customerCode = data.customer?.customer_code;
  if (!customerCode) return;
  await supabaseAdmin.from("cooperatives").update({ subscription_status: status }).eq("paystack_customer_code", customerCode);
}

export async function POST(req) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature");

  const expected = crypto.createHmac("sha512", process.env.PAYSTACK_SECRET_KEY).update(rawBody).digest("hex");

  if (!signature || signature !== expected) {
    console.error("Paystack webhook: signature mismatch — rejecting.");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventId = `${event.event}:${event.data?.id ?? event.data?.reference ?? crypto.randomUUID()}`;

  // Log every event first — doubles as an audit trail and an idempotency guard
  // (paystack_event_id is unique, so retried deliveries fail here and we stop).
  const { error: logError } = await supabaseAdmin.from("paystack_events").insert({
    paystack_event_id: eventId,
    event_type: event.event,
    reference: event.data?.reference || null,
    payload: event,
  });

  if (logError) {
    if (logError.code === "23505") {
      return NextResponse.json({ received: true, duplicate: true });
    }
    console.error("Failed to log Paystack event (continuing anyway):", logError);
  }

  try {
    switch (event.event) {
      case "charge.success":
        await provisionCooperative(event.data);
        break;
      case "subscription.create":
        await attachSubscription(event.data);
        break;
      case "invoice.payment_failed":
        await markSubscriptionStatus(event.data, "past_due");
        break;
      case "subscription.not_renew":
      case "subscription.disable":
        await markSubscriptionStatus(event.data, "canceled");
        break;
      default:
        // Logged above; no action needed for other event types.
        break;
    }
  } catch (e) {
    console.error(`Error handling Paystack event "${event.event}":`, e);
    // Still return 200 — we've logged the raw event, so it's not lost, and
    // returning an error here would just cause Paystack to retry indefinitely.
  }

  return NextResponse.json({ received: true });
}
