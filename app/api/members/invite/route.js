import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { sendSms } from "../../../../lib/termii";

export const runtime = "nodejs";

function generateInviteCode() {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

export async function POST(req) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("cooperative_id, role")
    .eq("id", user.id)
    .single();
  if (profileError || !profile || profile.role === "member") {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const { memberId } = await req.json();
  if (!memberId) return NextResponse.json({ error: "Missing memberId." }, { status: 400 });

 const { data: member, error: memberError } = await supabaseAdmin
    .from("members")
    .select("id, name, email, phone, cooperative_id, cooperatives(name)")
    .eq("id", memberId)
    .single();

  if (memberError || !member) return NextResponse.json({ error: "Member not found." }, { status: 404 });
  if (member.cooperative_id !== profile.cooperative_id) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const cooperativeName = (member.cooperatives?.name || "Cooperative CRM").replace(/[<>"]/g, "").trim();

  const code = generateInviteCode();
  const { error: inviteError } = await supabaseAdmin.from("invite_codes").insert({
    cooperative_id: member.cooperative_id,
    code,
    role: "member",
    member_id: member.id,
    max_uses: 1,
  });

  if (inviteError) {
    console.error("Failed to create member invite code:", inviteError);
    return NextResponse.json({ error: "Could not create invite code." }, { status: 500 });
  }

  let emailSent = false;
  if (member.email) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `${cooperativeName} <onboarding@mail.corporatebundles.com>`,
          to: member.email,
          subject: `Your ${cooperativeName} member portal access`,
          html: `<p>Hi ${member.name},</p>
<p>You can now view your savings, loans, and transaction history with ${cooperativeName} online.</p>
<p>Go to <a href="${process.env.NEXT_PUBLIC_APP_URL}/login">${process.env.NEXT_PUBLIC_APP_URL}/login</a>,
enter this email address, and use the code below (it's single-use):</p>
<p style="font-size:22px;font-weight:bold;letter-spacing:2px;">${code}</p>
<p>You'll get a sign-in link by email right after.</p>`,
        }),
      });
      emailSent = res.ok;
      if (!res.ok) console.error("Resend member invite email failed:", await res.text());
    } catch (e) {
      console.error("Member invite email threw:", e);
    }
  }

  let smsSent = false;
  if (member.phone) {
    const outcome = await sendSms(
      member.phone,
      `${cooperativeName}: You now have member portal access. Go to ${process.env.NEXT_PUBLIC_APP_URL}/login, enter your email, and use this one-time code: ${code}`
    );
    smsSent = outcome.ok;
  }

  return NextResponse.json({ code, emailSent, smsSent });
}
