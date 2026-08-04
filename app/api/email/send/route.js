import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { sendSms, sendWhatsApp } from "../../../../lib/termii";

export async function POST(req) {
  const { cooperativeId, subject, body, recipients, channels } = await req.json();
  const selectedChannels = Array.isArray(channels) && channels.length > 0 ? channels : ["email"];

  if (!cooperativeId || !body?.trim() || !Array.isArray(recipients) || recipients.length === 0) {
    return NextResponse.json({ error: "Missing message, or recipients." }, { status: 400 });
  }
  if (selectedChannels.includes("email") && !subject?.trim()) {
    return NextResponse.json({ error: "Subject is required when sending by email." }, { status: 400 });
  }

  const { data: campaign, error: campaignError } = await supabaseAdmin
    .from("email_campaigns")
    .insert({
      cooperative_id: cooperativeId,
      subject: subject || null,
      body,
      recipient_count: recipients.length,
      channel: selectedChannels.join(","),
    })
    .select()
    .single();

  if (campaignError) {
    console.error("Failed to log campaign:", campaignError);
    return NextResponse.json({ error: "Could not log this campaign." }, { status: 500 });
  }

  const { data: cooperative } = await supabaseAdmin
    .from("cooperatives")
    .select("name")
    .eq("id", cooperativeId)
    .single();
  const senderName = (cooperative?.name || "Cooperative CRM").replace(/[<>"]/g, "").trim();

  const recipientRows = [];
  const results = { email: { sent: 0, failed: 0 }, sms: { sent: 0, failed: 0 }, whatsapp: { sent: 0, failed: 0 } };

  await Promise.all(
    recipients.map(async (r) => {
      if (selectedChannels.includes("email")) {
        if (!r.email) {
          results.email.failed++;
        } else {
          try {
            const res = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: `${senderName} <onboarding@mail.corporatebundles.com>`,
                to: r.email,
                subject,
                html: body,
              }),
            });
            const ok = res.ok;
            results.email[ok ? "sent" : "failed"]++;
            recipientRows.push({ campaign_id: campaign.id, member_id: r.id || null, channel: "email", email: r.email, status: ok ? "sent" : "failed" });
          } catch {
            results.email.failed++;
            recipientRows.push({ campaign_id: campaign.id, member_id: r.id || null, channel: "email", email: r.email, status: "failed" });
          }
        }
      }

      if (selectedChannels.includes("sms")) {
        if (!r.phone) {
          results.sms.failed++;
        } else {
          const outcome = await sendSms(r.phone, body);
          results.sms[outcome.ok ? "sent" : "failed"]++;
          recipientRows.push({ campaign_id: campaign.id, member_id: r.id || null, channel: "sms", phone: r.phone, status: outcome.ok ? "sent" : "failed" });
        }
      }

      if (selectedChannels.includes("whatsapp")) {
        if (!r.phone) {
          results.whatsapp.failed++;
        } else {
          const outcome = await sendWhatsApp(r.phone, body);
          results.whatsapp[outcome.ok ? "sent" : "failed"]++;
          recipientRows.push({ campaign_id: campaign.id, member_id: r.id || null, channel: "whatsapp", phone: r.phone, status: outcome.ok ? "sent" : "failed" });
        }
      }
    })
  );

  if (recipientRows.length > 0) {
    await supabaseAdmin.from("email_campaign_recipients").insert(recipientRows);
  }

  return NextResponse.json({ results });
}
