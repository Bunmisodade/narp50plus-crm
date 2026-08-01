import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

export async function POST(req) {
  const { cooperativeId, subject, body, recipients } = await req.json();

  if (!cooperativeId || !subject?.trim() || !body?.trim() || !Array.isArray(recipients) || recipients.length === 0) {
    return NextResponse.json({ error: "Missing subject, body, or recipients." }, { status: 400 });
  }

  const { data: campaign, error: campaignError } = await supabaseAdmin
    .from("email_campaigns")
    .insert({
      cooperative_id: cooperativeId,
      subject,
      body,
      recipient_count: recipients.length,
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

  const results = await Promise.all(
    recipients.map(async (r) => {
      if (!r.email) return { member_id: r.id || null, email: r.email || "", status: "failed" };
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
        return { member_id: r.id || null, email: r.email, status: res.ok ? "sent" : "failed" };
      } catch (e) {
        return { member_id: r.id || null, email: r.email, status: "failed" };
      }
    })
  );

  await supabaseAdmin.from("email_campaign_recipients").insert(
    results.map((r) => ({
      campaign_id: campaign.id,
      member_id: r.member_id,
      email: r.email,
      status: r.status,
    }))
  );

  const failed = results.filter((r) => r.status === "failed").length;

  return NextResponse.json({ sent: results.length - failed, failed });
}
