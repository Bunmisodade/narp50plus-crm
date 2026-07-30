import { NextResponse } from "next/server";

// Amounts are in kobo (₦1 = 100 kobo). memberLimit null = unlimited.
const PLAN_CONFIG = {
  starter: { amount: 1000000, memberLimit: 100, planCode: process.env.PAYSTACK_PLAN_STARTER },
  growth: { amount: 1500000, memberLimit: 300, planCode: process.env.PAYSTACK_PLAN_GROWTH },
  enterprise: { amount: 2500000, memberLimit: null, planCode: process.env.PAYSTACK_PLAN_ENTERPRISE },
};

export async function POST(req) {
  const { cooperativeName, adminName, email, plan } = await req.json();

  const config = PLAN_CONFIG[plan];
  if (!config) {
    return NextResponse.json({ error: "Invalid plan selected." }, { status: 400 });
  }
  if (!cooperativeName?.trim() || !adminName?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "Please fill in all fields." }, { status: 400 });
  }

  const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      amount: config.amount,
      plan: config.planCode,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/signup/success`,
      metadata: {
        cooperative_name: cooperativeName.trim(),
        admin_name: adminName.trim(),
        plan,
      },
    }),
  });

  const data = await paystackRes.json();

  if (!data.status) {
    return NextResponse.json(
      { error: data.message || "Could not start payment. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ authorization_url: data.data.authorization_url });
}
