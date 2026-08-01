"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { getMyProfile } from "../../lib/members";
import { Button, Card, Badge } from "../../components/ui";

const PRODUCT_LABELS = { savings: "Savings", loan: "Loan", investment: "Investment", equity: "Equity" };
const PRODUCT_TONE = { savings: "forest", loan: "rust", investment: "brass", equity: "purple" };
const STATUS_TONE = { Active: "forest", Overdue: "rust", Lapsed: "neutral" };
const TRANSACTION_LABELS = {
  deposit: "Deposit", withdrawal: "Withdrawal", disbursement: "Disbursement",
  repayment: "Repayment", interest: "Interest", fee: "Fee", adjustment: "Adjustment",
};

function computeStatus(m) {
  if (!m.renewal_date) return "Active";
  const daysPast = (new Date() - new Date(m.renewal_date)) / 86400000;
  if (daysPast <= 0) return "Active";
  if (daysPast <= 60) return "Overdue";
  return "Lapsed";
}

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "–");
const fmtNaira = (n) => (n == null ? "–" : "₦" + Number(n).toLocaleString("en-NG"));

export default function Portal() {
  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState(null);
  const [error, setError] = useState("");
  const [expandedProductId, setExpandedProductId] = useState(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }

      const profile = await getMyProfile();
      if (profile?.role !== "member") { window.location.href = "/dashboard"; return; }
      if (!profile?.member_id) {
        setError("Your account isn't linked to a member record yet. Contact your cooperative admin.");
        setLoading(false);
        return;
      }

      const { data, error: memberError } = await supabase
        .from("members")
        .select("*, member_products(*, product_transactions(*))")
        .eq("id", profile.member_id)
        .single();

      if (memberError) {
        setError("Could not load your member record.");
        setLoading(false);
        return;
      }

      setMember(data);
      setLoading(false);
    })();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (loading) {
    return <div className="min-h-screen bg-paper font-sans" />;
  }

  return (
    <div className="min-h-screen bg-paper font-sans">
      <div className="flex justify-between items-center px-4 sm:px-8 py-5">
        <h1 className="text-xl m-0 font-serif">My Account</h1>
        <Button variant="ghost" onClick={handleLogout} className="!py-1.5">Sign out</Button>
      </div>

      <div className="px-4 sm:px-8 pb-8 max-w-2xl">
        {error && (
          <Card className="p-6 text-ink-soft">{error}</Card>
        )}

        {member && (
          <Card className="p-5 sm:p-6">
            <div className="text-[11px] text-brass font-bold">{member.member_no}</div>
            <h2 className="mt-1 mb-3">{member.name}</h2>
            <Badge tone={STATUS_TONE[computeStatus(member)]}>{computeStatus(member)}</Badge>

            <div className="text-sm grid grid-cols-2 gap-3 mt-4">
              <div>Phone<br /><strong>{member.phone || "–"}</strong></div>
              <div>Email<br /><strong className="break-all">{member.email || "–"}</strong></div>
              <div>Renewal due<br /><strong>{fmtDate(member.renewal_date)}</strong></div>
              <div>Dues<br /><strong>{fmtNaira(member.dues)}</strong></div>
            </div>

            <div className="mt-6">
              <h3 className="text-xs uppercase text-ink-soft tracking-wide mb-2">Products</h3>
              {(member.member_products || []).length === 0 && (
                <div className="text-xs text-ink-soft">No products on record yet.</div>
              )}
              {(member.member_products || [])
                .slice()
                .sort((a, b) => new Date(b.opened_date) - new Date(a.opened_date))
                .map((p) => {
                  const isExpanded = expandedProductId === p.id;
                  const txs = (p.product_transactions || []).slice().sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date));
                  return (
                    <div key={p.id} className="border-b border-paper py-2.5">
                      <div
                        className="flex flex-wrap justify-between items-center gap-2 cursor-pointer"
                        onClick={() => setExpandedProductId(isExpanded ? null : p.id)}
                      >
                        <div>
                          <Badge tone={PRODUCT_TONE[p.product_type]} className="mr-2">
                            {PRODUCT_LABELS[p.product_type] || p.product_type}
                          </Badge>
                          <span className="text-ink-soft text-[11px]">{p.status}</span>
                        </div>
                        <div className="font-bold text-sm">{fmtNaira(p.balance)}</div>
                      </div>
                      {isExpanded && (
                        <div className="mt-2 pl-1">
                          {txs.length === 0 && <div className="text-xs text-ink-soft">No transactions yet.</div>}
                          {txs.map((t) => (
                            <div key={t.id} className="flex flex-wrap justify-between gap-1 text-xs py-1 text-ink-soft">
                              <span>{fmtDate(t.transaction_date)} · {TRANSACTION_LABELS[t.transaction_type] || t.transaction_type}{t.description ? ` — ${t.description}` : ""}</span>
                              <span className={`font-bold ${t.direction === "credit" ? "text-forest" : "text-rust"}`}>
                                {t.direction === "credit" ? "+" : "−"}{fmtNaira(t.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
