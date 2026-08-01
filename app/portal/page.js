"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { getMyProfile } from "../../lib/members";

const INK = "#1F2E28", TEAL = "#2F6F5E", GOLD = "#B8862B", BRICK = "#A13D2C";
const STATUS_STYLE = {
  Active: { bg: "#EAF2EE", fg: TEAL },
  Overdue: { bg: "#FBEFE9", fg: BRICK },
  Lapsed: { bg: "#F0EDE6", fg: "#6B6558" },
};
const PRODUCT_LABELS = { savings: "Savings", loan: "Loan", investment: "Investment", equity: "Equity" };
const PRODUCT_STYLE = {
  savings: { bg: "#EAF2EE", fg: TEAL },
  loan: { bg: "#FBEFE9", fg: BRICK },
  investment: { bg: "#F3ECD9", fg: GOLD },
  equity: { bg: "#EDEAF2", fg: "#5B4E8A" },
};
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
    return <div style={{ minHeight: "100vh", background: "#EFEBE0", fontFamily: "system-ui" }} />;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#EFEBE0", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 32px" }}>
        <h1 style={{ fontSize: 22, margin: 0, fontFamily: "Georgia, serif" }}>My Account</h1>
        <button
          onClick={handleLogout}
          style={{ fontSize: 13, background: "none", border: "1px solid #D9D3C2", borderRadius: 4, padding: "6px 14px", cursor: "pointer" }}
        >
          Sign out
        </button>
      </div>

      <div style={{ padding: "0 32px 32px", maxWidth: 640 }}>
        {error && (
          <div style={{ background: "#fff", border: "1px solid #D9D3C2", borderRadius: 8, padding: 24, color: "#8A8372" }}>
            {error}
          </div>
        )}

        {member && (
          <div style={{ background: "#fff", border: "1px solid #D9D3C2", borderRadius: 8, padding: 24 }}>
            <div style={{ fontSize: 11, color: GOLD, fontWeight: 700 }}>{member.member_no}</div>
            <h2 style={{ marginTop: 4, marginBottom: 12 }}>{member.name}</h2>
            <span style={{
              background: STATUS_STYLE[computeStatus(member)].bg, color: STATUS_STYLE[computeStatus(member)].fg,
              padding: "2px 9px", borderRadius: 3, fontSize: 11, fontWeight: 700, textTransform: "uppercase",
            }}>
              {computeStatus(member)}
            </span>

            <div style={{ fontSize: 13, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
              <div>Phone<br /><strong>{member.phone || "–"}</strong></div>
              <div>Email<br /><strong>{member.email || "–"}</strong></div>
              <div>Renewal due<br /><strong>{fmtDate(member.renewal_date)}</strong></div>
              <div>Dues<br /><strong>{fmtNaira(member.dues)}</strong></div>
            </div>

            <div style={{ marginTop: 24 }}>
              <h3 style={{ fontSize: 13, textTransform: "uppercase", color: "#8A8372", margin: "0 0 8px" }}>Products</h3>
              {(member.member_products || []).length === 0 && (
                <div style={{ fontSize: 12, color: "#8A8372" }}>No products on record yet.</div>
              )}
              {(member.member_products || [])
                .slice()
                .sort((a, b) => new Date(b.opened_date) - new Date(a.opened_date))
                .map((p) => {
                  const s = PRODUCT_STYLE[p.product_type] || { bg: "#EFEBE0", fg: INK };
                  const isExpanded = expandedProductId === p.id;
                  const txs = (p.product_transactions || []).slice().sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date));
                  return (
                    <div key={p.id} style={{ borderBottom: "1px solid #EFEBE0", padding: "10px 0" }}>
                      <div
                        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                        onClick={() => setExpandedProductId(isExpanded ? null : p.id)}
                      >
                        <div>
                          <span style={{ background: s.bg, color: s.fg, padding: "2px 7px", borderRadius: 3, fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginRight: 8 }}>
                            {PRODUCT_LABELS[p.product_type] || p.product_type}
                          </span>
                          <span style={{ color: "#8A8372", fontSize: 11 }}>{p.status}</span>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{fmtNaira(p.balance)}</div>
                      </div>
                      {isExpanded && (
                        <div style={{ marginTop: 8, paddingLeft: 4 }}>
                          {txs.length === 0 && <div style={{ fontSize: 12, color: "#8A8372" }}>No transactions yet.</div>}
                          {txs.map((t) => (
                            <div key={t.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", color: "#5B5744" }}>
                              <span>{fmtDate(t.transaction_date)} · {TRANSACTION_LABELS[t.transaction_type] || t.transaction_type}{t.description ? ` — ${t.description}` : ""}</span>
                              <span style={{ fontWeight: 700, color: t.direction === "credit" ? TEAL : BRICK }}>
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
          </div>
        )}
      </div>
    </div>
  );
}
