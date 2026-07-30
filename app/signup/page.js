"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

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
    <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif", background: "#EFEBE0" }}>
      <form onSubmit={startCheckout} style={{ background: "#fff", padding: 32, borderRadius: 8, width: 380, border: "1px solid #D9D3C2" }}>
        <h1 style={{ fontSize: 20, marginTop: 0 }}>Start your cooperative</h1>
        <p style={{ fontSize: 13, color: "#666" }}>
          Set up your cooperative on the {PLAN_LABELS[plan]?.name} plan — {PLAN_LABELS[plan]?.price}.
        </p>

        <label style={{ fontSize: 12, color: "#666" }}>Plan</label>
        <select
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
          style={{ width: "100%", padding: 10, marginBottom: 12, marginTop: 4, border: "1px solid #D9D3C2", borderRadius: 4 }}
        >
          <option value="starter">Starter — ₦10,000/mo</option>
          <option value="growth">Growth — ₦15,000/mo</option>
          <option value="enterprise">Enterprise — ₦25,000/mo</option>
        </select>

        <input
          type="text"
          required
          value={cooperativeName}
          onChange={(e) => setCooperativeName(e.target.value)}
          placeholder="Cooperative name"
          style={{ width: "100%", padding: 10, marginBottom: 12, border: "1px solid #D9D3C2", borderRadius: 4 }}
        />
        <input
          type="text"
          required
          value={adminName}
          onChange={(e) => setAdminName(e.target.value)}
          placeholder="Your full name"
          style={{ width: "100%", padding: 10, marginBottom: 12, border: "1px solid #D9D3C2", borderRadius: 4 }}
        />
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@cooperative.org"
          style={{ width: "100%", padding: 10, marginBottom: 16, border: "1px solid #D9D3C2", borderRadius: 4 }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{ width: "100%", padding: 10, background: "#2F6F5E", color: "#fff", border: "none", borderRadius: 4, cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "Redirecting to payment…" : "Continue to payment"}
        </button>
        {error && <p style={{ color: "#A13D2C", fontSize: 12, marginTop: 10 }}>{error}</p>}
      </form>
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
