"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { Button, Input, SiteFooter } from "../../components/ui";

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-4">
      <form onSubmit={sendLink} className="bg-white p-6 sm:p-8 rounded-md w-full max-w-sm border border-line-strong">
        <h1 className="text-xl mb-1">Cooperative CRM</h1>
        {sent ? (
          <p className="text-sm text-ink-soft mt-3">Check your email for a sign-in link.</p>
        ) : (
          <>
            <p className="text-sm text-ink-soft mt-2 mb-4">Sign in with your work email — we&rsquo;ll send a magic link.</p>
            <div className="mb-3">
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@cooperative.org"
              />
            </div>
            <div className="mb-3">
              <Input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full name (new members only)"
              />
            </div>
            <div className="mb-4">
              <Input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="Invite code (new cooperatives only)"
              />
            </div>
            <Button type="submit" className="w-full">Send sign-in link</Button>
            {error && <p className="text-rust text-xs mt-2">{error}</p>}
          </>
        )}
      </form>
    </div>
  );
}
