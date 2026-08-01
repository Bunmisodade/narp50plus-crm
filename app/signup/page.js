"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button, Input, Select, Label, SiteFooter } from "../../components/ui";
const PLAN_LABELS = {
  starter: { name: "Starter", price: "₦10,000/mo" },
  growth: { name: "Growth", price: "₦15,000/mo" },
  enterprise: { name: "Enterprise", price: "₦25,000/mo" },
};

function SignupForm() {
  const searchParams = useSearchParams();
  const initialPlan = searchParams.get("plan") || "growth";

  const [plan, setPlan] = useState(initialPlan);
  const [cooperativeName, setCooperativeName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function startCheckout(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cooperativeName, adminName, email, plan }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      window.location.href = data.authorization_url;
    } catch (err) {
      setError("Could not reach the payment provider. Please try again.");
      setLoading(false);
    }
  }

  return (
   <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-4">
      <form onSubmit={startCheckout} className="bg-white p-6 sm:p-8 rounded-md w-full max-w-md border border-line-strong">
        <h1 className="text-xl mt-0 mb-1">Start your cooperative</h1>
        <p className="text-sm text-ink-soft mb-4">
          Set up your cooperative on the {PLAN_LABELS[plan]?.name} plan — {PLAN_LABELS[plan]?.price}.
        </p>

        <div className="mb-3">
          <Label>Plan</Label>
          <Select value={plan} onChange={(e) => setPlan(e.target.value)}>
            <option value="starter">Starter — ₦10,000/mo</option>
            <option value="growth">Growth — ₦15,000/mo</option>
            <option value="enterprise">Enterprise — ₦25,000/mo</option>
          </Select>
        </div>

        <div className="mb-3">
          <Input
            type="text"
            required
            value={cooperativeName}
            onChange={(e) => setCooperativeName(e.target.value)}
            placeholder="Cooperative name"
          />
        </div>
        <div className="mb-3">
          <Input
            type="text"
            required
            value={adminName}
            onChange={(e) => setAdminName(e.target.value)}
            placeholder="Your full name"
          />
        </div>
        <div className="mb-4">
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@cooperative.org"
          />
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Redirecting to payment…" : "Continue to payment"}
        </Button>
        {error && <p className="text-rust text-xs mt-2.5">{error}</p>}
     </form>
      <SiteFooter />
    </div>
  );
}

export default function Signup() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}
