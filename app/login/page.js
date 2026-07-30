"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function Login() {
  const [email, setEmail] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [fullName, setFullName] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function sendLink(e) {
    e.preventDefault();
    setError("");

    const metadata = {};
    if (inviteCode.trim()) metadata.invite_code = inviteCode.trim();
    if (fullName.trim()) metadata.full_name = fullName.trim();

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        ...(Object.keys(metadata).length > 0 ? { data: metadata } : {}),
      },
    });
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif", background: "#EFEBE0" }}>
      <form onSubmit={sendLink} style={{ background: "#fff", padding: 32, borderRadius: 8, width: 340, border: "1px solid #D9D3C2" }}>
        <h1 style={{ fontSize: 20, marginTop: 0 }}>Cooperative CRM</h1>
        {sent ? (
          <p>Check your email for a sign-in link.</p>
        ) : (
          <>
            <p style={{ fontSize: 13, color: "#666" }}>Sign in with your work email — we'll send a magic link.</p>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@cooperative.org"
              style={{ width: "100%", padding: 10, marginBottom: 12, border: "1px solid #D9D3C2", borderRadius: 4 }}
            />
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full name (new members only)"
              style={{ width: "100%", padding: 10, marginBottom: 12, border: "1px solid #D9D3C2", borderRadius: 4 }}
            />
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="Invite code (new cooperatives only)"
              style={{ width: "100%", padding: 10, marginBottom: 12, border: "1px solid #D9D3C2", borderRadius: 4 }}
            />
            <button type="submit" style={{ width: "100%", padding: 10, background: "#2F6F5E", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}>
              Send sign-in link
            </button>
            {error && <p style={{ color: "#A13D2C", fontSize: 12 }}>{error}</p>}
          </>
        )}
      </form>
    </div>
  );
}
