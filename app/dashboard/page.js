"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import {
  listMembers, addMember, addNote, addMemberProduct, addProductTransaction, getMyCooperativeId, getMyProfile,
  inviteMemberToPortal,
} from "../../lib/members";
import { sendMemberEmails } from "../../lib/email";

const INK = "#1F2E28", BASE = "#EFEBE0", TEAL = "#2F6F5E", GOLD = "#B8862B", BRICK = "#A13D2C";
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
const TRANSACTION_TYPES_BY_PRODUCT = {
  savings: ["deposit", "withdrawal", "interest", "adjustment"],
  investment: ["deposit", "withdrawal", "interest", "adjustment"],
  equity: ["deposit", "withdrawal", "adjustment"],
  loan: ["disbursement", "repayment", "interest", "fee", "adjustment"],
};
const TRANSACTION_DIRECTION = {
  deposit: "credit", withdrawal: "debit", disbursement: "credit",
  repayment: "debit", interest: "credit", fee: "credit",
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

function Modal({ onClose, width = 360, children }) {
  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "#fff", padding: 24, borderRadius: 8, width, fontFamily: "system-ui", maxHeight: "85vh", overflowY: "auto", position: "relative" }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute", top: 12, right: 12, width: 28, height: 28, borderRadius: "50%",
            border: "1px solid #D9D3C2", background: "#fff", color: "#5B5744", cursor: "pointer",
            fontSize: 15, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
}

const cancelBtnStyle = { background: "none", border: "1px solid #D9D3C2", borderRadius: 4, padding: "8px 14px", cursor: "pointer", color: INK };

export default function Dashboard() {
  const [members, setMembers] = useState([]);
  const [cooperativeId, setCooperativeId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [showProductForm, setShowProductForm] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [txTarget, setTxTarget] = useState(null);
  const [expandedProductId, setExpandedProductId] = useState(null);
  const [invitingId, setInvitingId] = useState(null);
  const [inviteResult, setInviteResult] = useState(null);

  async function handleInviteToPortal(memberId) {
    setInvitingId(memberId);
    setInviteResult(null);
    try {
      const result = await inviteMemberToPortal(memberId);
      setInviteResult({ memberId, ...result });
    } catch (e) {
      console.error("Failed to create portal invite:", e);
      alert("Could not generate a portal invite code. Check the browser console for details.");
    } finally {
      setInvitingId(null);
    }
  }

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }
      const profile = await getMyProfile();
      if (profile?.role === "member") { window.location.href = "/portal"; return; }
      const coopId = await getMyCooperativeId();
      setCooperativeId(coopId);
      const data = await listMembers();
      setMembers(data);
      setLoading(false);
    })();
  }, []);

  async function refresh() {
    setMembers(await listMembers());
  }

  const enriched = useMemo(() => members.map((m) => ({ ...m, status: computeStatus(m) })), [members]);
  const filtered = enriched.filter(
    (m) => (m.name.toLowerCase().includes(query.toLowerCase()) || m.member_no.toLowerCase().includes(query.toLowerCase())) &&
      (filter === "All" || m.status === filter)
  );
  const selected = enriched.find((m) => m.id === selectedId) || null;

  async function handleAddMember(form) {
    try {
      const newMember = await addMember(cooperativeId, {
        name: form.name, phone: form.phone, email: form.email,
        join_date: form.joinDate || null, dues: Number(form.dues) || 0,
        last_payment: form.lastPayment || null, renewal_date: form.renewalDate || null,
      });
      setMembers((prev) => [...prev, { ...newMember, member_notes: [], member_products: [] }]);
      setShowForm(false);
    } catch (e) {
      console.error("Failed to add member:", e);
      alert("Could not save this member. Check the browser console for details.");
    }
  }

  async function handleAddNote() {
    if (!noteDraft.trim() || !selected) return;
    try {
      const newNote = await addNote(selected.id, cooperativeId, noteDraft);
      setMembers((prev) =>
        prev.map((m) =>
          m.id === selected.id ? { ...m, member_notes: [newNote, ...(m.member_notes || [])] } : m
        )
      );
      setNoteDraft("");
    } catch (e) {
      console.error("Failed to add note:", e);
      alert("Could not save this note. Check the browser console for details.");
    }
  }

  async function handleAddProduct(form) {
    if (!selected) return;
    try {
      await addMemberProduct(cooperativeId, selected.id, form);
      setShowProductForm(false);
      await refresh();
    } catch (e) {
      console.error("Failed to add product:", e);
      alert("Could not save this product. Check the browser console for details.");
    }
  }

  async function handleAddTransaction(form) {
    if (!txTarget) return;
    try {
      const direction = form.transactionType === "adjustment" ? form.direction : TRANSACTION_DIRECTION[form.transactionType];
      await addProductTransaction(cooperativeId, txTarget.productId, {
        transactionType: form.transactionType,
        direction,
        amount: form.amount,
        transactionDate: form.transactionDate,
        description: form.description,
      });
      setTxTarget(null);
      await refresh();
    } catch (e) {
      console.error("Failed to record transaction:", e);
      alert("Could not record this transaction. Check the browser console for details.");
    }
  }

  async function handleSendEmail({ subject, body, recipients }) {
    try {
      const result = await sendMemberEmails({ cooperativeId, subject, body, recipients });
      setShowEmailForm(false);
      alert(`Email sent to ${result.sent} member(s)${result.failed ? `, ${result.failed} failed` : ""}.`);
    } catch (e) {
      console.error("Failed to send email:", e);
      alert("Could not send this email. Check the browser console for details.");
    }
  }

  if (loading) return <div style={{ padding: 40, fontFamily: "system-ui" }}>Loading…</div>;

  return (
    <div style={{ background: BASE, minHeight: "100vh", color: INK, fontFamily: "Georgia, serif" }}>
      <header style={{ borderBottom: "1px solid #D9D3C2", padding: "20px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0, fontSize: 26 }}>Member Ledger</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontFamily: "system-ui", fontSize: 13 }}>
          <span>{enriched.length} members · {enriched.filter((m) => m.status === "Overdue").length} overdue</span>
          <button
            onClick={() => setShowEmailForm(true)}
            style={{ background: INK, color: "#fff", border: "none", borderRadius: 4, padding: "8px 14px", cursor: "pointer", fontSize: 13 }}
          >
            Send Email
          </button>
        </div>
      </header>
      <div style={{ display: "flex" }}>
        <aside style={{ width: 320, borderRight: "1px solid #D9D3C2", padding: 20 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 10, fontFamily: "system-ui" }}>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search…"
              style={{ flex: 1, padding: 8, border: "1px solid #D9D3C2", borderRadius: 4 }} />
            <button onClick={() => setShowForm(true)} style={{ background: TEAL, color: "#fff", border: "none", borderRadius: 4, padding: "0 14px", cursor: "pointer" }}>+</button>
          </div>
          <div style={{ display: "flex", gap: 6, marginBottom: 12, fontFamily: "system-ui" }}>
            {["All", "Active", "Overdue", "Lapsed"].map((f) => (
              <button key={f} onClick={() => setFilter(f)} style={{
                fontSize: 12, padding: "4px 10px", borderRadius: 999, cursor: "pointer",
                border: `1px solid ${filter === f ? INK : "#D9D3C2"}`,
                background: filter === f ? INK : "transparent", color: filter === f ? "#fff" : INK,
              }}>{f}</button>
            ))}
          </div>
          {filtered.map((m) => {
            const s = STATUS_STYLE[m.status];
            return (
              <button key={m.id} onClick={() => setSelectedId(m.id)} style={{
                display: "block", width: "100%", textAlign: "left", marginBottom: 8, padding: 10,
                border: `1px solid ${selectedId === m.id ? "#E4DFD2" : "transparent"}`, borderRadius: 6,
                background: selectedId === m.id ? "#fff" : "transparent", cursor: "pointer",
              }}>
                <div>{m.name}</div>
                <div style={{ fontFamily: "system-ui", fontSize: 11, color: "#8A8372", display: "flex", justifyContent: "space-between" }}>
                  <span>{m.member_no}</span>
                  <span style={{ background: s.bg, color: s.fg, padding: "1px 6px", borderRadius: 3, fontWeight: 700 }}>{m.status}</span>
                </div>
              </button>
            );
          })}
        </aside>
        <main style={{ flex: 1, padding: 32 }}>
          {!selected && <div style={{ color: "#8A8372", fontFamily: "system-ui" }}>Select a member, or add one.</div>}
          {selected && (
            <div style={{ maxWidth: 640 }}>
              <div style={{ background: "#fff", border: "1px solid #D9D3C2", borderRadius: 8, padding: 24, position: "relative" }}>
  <button
    onClick={() => setSelectedId(null)}
    aria-label="Close"
    style={{
      position: "absolute", top: 16, right: 16, width: 28, height: 28, borderRadius: "50%",
      border: "1px solid #D9D3C2", background: "#fff", color: "#5B5744", cursor: "pointer",
      fontSize: 15, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center",
    }}
  >
    ×
  </button>
  <div style={{ fontFamily: "system-ui", fontSize: 11, color: GOLD, fontWeight: 700 }}>{selected.member_no}</div>
  <h2 style={{ marginTop: 4, paddingRight: 32 }}>{selected.name}</h2>
                <div style={{ fontFamily: "system-ui", fontSize: 13, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>Phone<br /><strong>{selected.phone || "–"}</strong></div>
                  <div>Email<br /><strong>{selected.email || "–"}</strong></div>
                  <div>Renewal due<br /><strong>{fmtDate(selected.renewal_date)}</strong></div>
                  <div>Dues<br /><strong>{fmtNaira(selected.dues)}</strong></div>
                </div>
                <div style={{ fontFamily: "system-ui", fontSize: 12, color: "#8A8372", marginTop: 16, borderTop: "1px dashed #D9D3C2", paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>{selected.qbo_linked ? `Linked to QuickBooks: ${selected.qbo_account_ref}` : "Not yet linked to QuickBooks."}</span>
                  <button
                    onClick={() => handleInviteToPortal(selected.id)}
                    disabled={invitingId === selected.id}
                    style={{ fontSize: 12, background: "none", border: "1px solid #D9D3C2", borderRadius: 4, padding: "4px 10px", cursor: "pointer", color: INK }}
                  >
                    {invitingId === selected.id ? "Generating…" : "Invite to portal"}
                  </button>
                </div>
                {inviteResult && inviteResult.memberId === selected.id && (
                  <div style={{ fontSize: 12, background: "#F3ECD9", border: "1px solid #E3D9B8", borderRadius: 4, padding: "8px 10px", marginTop: 8 }}>
                    Portal code: <strong style={{ letterSpacing: 1 }}>{inviteResult.code}</strong>
                    {inviteResult.emailSent ? " — emailed to the member." : " — no email on file, share this code directly."}
                  </div>
                )}

                <div style={{ marginTop: 20, fontFamily: "system-ui" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ fontSize: 13, textTransform: "uppercase", color: "#8A8372", margin: 0 }}>Products</h3>
                    <button
                      onClick={() => setShowProductForm(true)}
                      style={{ fontSize: 12, background: "none", border: "1px solid #D9D3C2", borderRadius: 4, padding: "3px 10px", cursor: "pointer" }}
                    >
                      + Add Product
                    </button>
                  </div>
                  {(selected.member_products || []).length === 0 && (
                    <div style={{ fontSize: 12, color: "#8A8372", marginTop: 8 }}>No products yet.</div>
                  )}
                  {(selected.member_products || [])
                    .slice()
                    .sort((a, b) => new Date(b.opened_date) - new Date(a.opened_date))
                    .map((p) => {
                      const s = PRODUCT_STYLE[p.product_type] || { bg: "#EFEBE0", fg: INK };
                      const isExpanded = expandedProductId === p.id;
                      const txs = (p.product_transactions || []).slice().sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date));
                      return (
                        <div key={p.id} style={{ borderBottom: "1px solid #EFEBE0", padding: "10px 0" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ cursor: "pointer" }} onClick={() => setExpandedProductId(isExpanded ? null : p.id)}>
                              <span style={{ background: s.bg, color: s.fg, padding: "2px 7px", borderRadius: 3, fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginRight: 8 }}>
                                {PRODUCT_LABELS[p.product_type] || p.product_type}
                              </span>
                              <span style={{ color: "#8A8372", fontSize: 11 }}>{p.status}</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{ fontWeight: 700, fontSize: 14 }}>{fmtNaira(p.balance)}</div>
                              <button
                                onClick={() => setTxTarget({ productId: p.id, productType: p.product_type })}
                                style={{ fontSize: 11, background: "none", border: "1px solid #D9D3C2", borderRadius: 4, padding: "2px 8px", cursor: "pointer" }}
                              >
                                + Transaction
                              </button>
                            </div>
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

                <div style={{ marginTop: 20, fontFamily: "system-ui" }}>
                  <h3 style={{ fontSize: 13, textTransform: "uppercase", color: "#8A8372" }}>Notes</h3>
                  <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                    <input value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
                      placeholder="Log an update…" style={{ flex: 1, padding: 8, border: "1px solid #D9D3C2", borderRadius: 4 }} />
                    <button onClick={handleAddNote} style={{ background: INK, color: "#fff", border: "none", borderRadius: 4, padding: "0 14px", cursor: "pointer" }}>Add</button>
                  </div>
                  {(selected.member_notes || []).sort((a, b) => new Date(b.note_date) - new Date(a.note_date)).map((n) => (
                    <div key={n.id} style={{ fontSize: 14, marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: GOLD, marginRight: 10 }}>{fmtDate(n.note_date)}</span>{n.text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
      {showForm && <MemberForm onCancel={() => setShowForm(false)} onSave={handleAddMember} />}
      {showProductForm && <ProductForm onCancel={() => setShowProductForm(false)} onSave={handleAddProduct} />}
      {txTarget && (
        <TransactionForm
          productType={txTarget.productType}
          onCancel={() => setTxTarget(null)}
          onSave={handleAddTransaction}
        />
      )}
      {showEmailForm && (
        <EmailForm
          members={filtered.filter((m) => m.email)}
          onCancel={() => setShowEmailForm(false)}
          onSend={handleSendEmail}
        />
      )}
    </div>
  );
}

function MemberForm({ onCancel, onSave }) {
  const [form, setForm] = useState({ name: "", phone: "", email: "", joinDate: "", dues: "", lastPayment: "", renewalDate: "" });
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  function handleSave() {
    if (!form.name.trim()) {
      setError("Please enter a name before saving.");
      return;
    }
    onSave(form);
  }

  return (
    <Modal onClose={onCancel}>
      <h3 style={{ marginTop: 0, paddingRight: 24 }}>New member</h3>
      {["name", "phone", "email"].map((k) => (
        <input key={k} placeholder={k} value={form[k]} onChange={set(k)} style={{ width: "100%", padding: 8, marginBottom: 8, border: "1px solid #D9D3C2", borderRadius: 4 }} />
      ))}
      <label style={{ fontSize: 12 }}>Join date<input type="date" value={form.joinDate} onChange={set("joinDate")} style={{ width: "100%", padding: 8, marginBottom: 8, border: "1px solid #D9D3C2", borderRadius: 4 }} /></label>
      <label style={{ fontSize: 12 }}>Dues (₦)<input type="number" value={form.dues} onChange={set("dues")} style={{ width: "100%", padding: 8, marginBottom: 8, border: "1px solid #D9D3C2", borderRadius: 4 }} /></label>
      <label style={{ fontSize: 12 }}>Renewal due<input type="date" value={form.renewalDate} onChange={set("renewalDate")} style={{ width: "100%", padding: 8, marginBottom: 8, border: "1px solid #D9D3C2", borderRadius: 4 }} /></label>
      {error && <div style={{ color: BRICK, fontSize: 12, marginBottom: 8 }}>{error}</div>}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
        <button onClick={onCancel} style={cancelBtnStyle}>Cancel</button>
        <button onClick={handleSave} style={{ background: TEAL, color: "#fff", border: "none", borderRadius: 4, padding: "8px 14px", cursor: "pointer" }}>Save</button>
      </div>
    </Modal>
  );
}

function ProductForm({ onCancel, onSave }) {
  const [form, setForm] = useState({
    productType: "savings", status: "active", openingAmount: "", principal: "",
    interestRate: "", openedDate: "", maturityDate: "",
  });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  return (
    <Modal onClose={onCancel}>
      <h3 style={{ marginTop: 0, paddingRight: 24 }}>Add product</h3>
      <label style={{ fontSize: 12 }}>Product type</label>
      <select value={form.productType} onChange={set("productType")} style={{ width: "100%", padding: 8, marginBottom: 8, marginTop: 4, border: "1px solid #D9D3C2", borderRadius: 4 }}>
        <option value="savings">Savings</option>
        <option value="loan">Loan</option>
        <option value="investment">Investment</option>
        <option value="equity">Equity</option>
      </select>
      <label style={{ fontSize: 12 }}>
        {form.productType === "loan" ? "Amount disbursed (₦, optional)" : "Opening deposit (₦, optional)"}
        <input type="number" value={form.openingAmount} onChange={set("openingAmount")} style={{ width: "100%", padding: 8, marginBottom: 8, border: "1px solid #D9D3C2", borderRadius: 4 }} />
      </label>
      {form.productType === "loan" && (
        <label style={{ fontSize: 12 }}>Principal (₦)<input type="number" value={form.principal} onChange={set("principal")} style={{ width: "100%", padding: 8, marginBottom: 8, border: "1px solid #D9D3C2", borderRadius: 4 }} /></label>
      )}
      <label style={{ fontSize: 12 }}>Interest rate (%)<input type="number" value={form.interestRate} onChange={set("interestRate")} style={{ width: "100%", padding: 8, marginBottom: 8, border: "1px solid #D9D3C2", borderRadius: 4 }} /></label>
      <label style={{ fontSize: 12 }}>Opened date<input type="date" value={form.openedDate} onChange={set("openedDate")} style={{ width: "100%", padding: 8, marginBottom: 8, border: "1px solid #D9D3C2", borderRadius: 4 }} /></label>
      {form.productType === "investment" && (
        <label style={{ fontSize: 12 }}>Maturity date<input type="date" value={form.maturityDate} onChange={set("maturityDate")} style={{ width: "100%", padding: 8, marginBottom: 8, border: "1px solid #D9D3C2", borderRadius: 4 }} /></label>
      )}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
        <button onClick={onCancel} style={cancelBtnStyle}>Cancel</button>
        <button onClick={() => onSave(form)} style={{ background: TEAL, color: "#fff", border: "none", borderRadius: 4, padding: "8px 14px", cursor: "pointer" }}>Save</button>
      </div>
    </Modal>
  );
}

function TransactionForm({ productType, onCancel, onSave }) {
  const options = TRANSACTION_TYPES_BY_PRODUCT[productType] || ["deposit", "withdrawal", "adjustment"];
  const [form, setForm] = useState({
    transactionType: options[0], direction: "credit", amount: "",
    transactionDate: new Date().toISOString().slice(0, 10), description: "",
  });
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  function handleSave() {
    if (!form.amount || Number(form.amount) <= 0) {
      setError("Please enter an amount greater than zero.");
      return;
    }
    onSave(form);
  }

  return (
    <Modal onClose={onCancel}>
      <h3 style={{ marginTop: 0, paddingRight: 24 }}>Record transaction</h3>
      <label style={{ fontSize: 12 }}>Type</label>
      <select value={form.transactionType} onChange={set("transactionType")} style={{ width: "100%", padding: 8, marginBottom: 8, marginTop: 4, border: "1px solid #D9D3C2", borderRadius: 4 }}>
        {options.map((o) => <option key={o} value={o}>{TRANSACTION_LABELS[o]}</option>)}
      </select>
      {form.transactionType === "adjustment" && (
        <label style={{ fontSize: 12 }}>Direction
          <select value={form.direction} onChange={set("direction")} style={{ width: "100%", padding: 8, marginBottom: 8, marginTop: 4, border: "1px solid #D9D3C2", borderRadius: 4 }}>
            <option value="credit">Increase balance</option>
            <option value="debit">Decrease balance</option>
          </select>
        </label>
      )}
      <label style={{ fontSize: 12 }}>Amount (₦)<input type="number" value={form.amount} onChange={set("amount")} style={{ width: "100%", padding: 8, marginBottom: 8, border: "1px solid #D9D3C2", borderRadius: 4 }} /></label>
      <label style={{ fontSize: 12 }}>Date<input type="date" value={form.transactionDate} onChange={set("transactionDate")} style={{ width: "100%", padding: 8, marginBottom: 8, border: "1px solid #D9D3C2", borderRadius: 4 }} /></label>
      <label style={{ fontSize: 12 }}>Description (optional)<input value={form.description} onChange={set("description")} style={{ width: "100%", padding: 8, marginBottom: 8, border: "1px solid #D9D3C2", borderRadius: 4 }} /></label>
      {error && <div style={{ color: BRICK, fontSize: 12, marginBottom: 8 }}>{error}</div>}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
        <button onClick={onCancel} style={cancelBtnStyle}>Cancel</button>
        <button onClick={handleSave} style={{ background: TEAL, color: "#fff", border: "none", borderRadius: 4, padding: "8px 14px", cursor: "pointer" }}>Save</button>
      </div>
    </Modal>
  );
}

function EmailForm({ members, onCancel, onSend }) {
  const [selected, setSelected] = useState(() => new Set(members.map((m) => m.id)));
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function handleSend() {
    if (!subject.trim() || !body.trim() || selected.size === 0) return;
    setSending(true);
    try {
      await onSend({
        subject,
        body,
        recipients: members.filter((m) => selected.has(m.id)).map((m) => ({ id: m.id, email: m.email })),
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal onClose={onCancel} width={440}>
      <h3 style={{ marginTop: 0, paddingRight: 24 }}>Send email</h3>
      <input
        placeholder="Subject"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        style={{ width: "100%", padding: 8, marginBottom: 8, border: "1px solid #D9D3C2", borderRadius: 4 }}
      />
      <textarea
        placeholder="Message"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={6}
        style={{ width: "100%", padding: 8, marginBottom: 12, border: "1px solid #D9D3C2", borderRadius: 4, fontFamily: "system-ui" }}
      />
      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
        Recipients ({selected.size} of {members.length})
      </div>
      <div style={{ border: "1px solid #D9D3C2", borderRadius: 4, maxHeight: 160, overflowY: "auto", marginBottom: 12 }}>
        {members.length === 0 && (
          <div style={{ padding: 10, fontSize: 12, color: "#8A8372" }}>No members with an email address match the current filter.</div>
        )}
        {members.map((m) => (
          <label key={m.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", fontSize: 13, borderBottom: "1px solid #EFEBE0" }}>
            <input type="checkbox" checked={selected.has(m.id)} onChange={() => toggle(m.id)} />
            {m.name} <span style={{ color: "#8A8372" }}>({m.email})</span>
          </label>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
       <button onClick={onCancel} style={cancelBtnStyle}>Cancel</button>
        <button
          onClick={handleSend}
          disabled={sending}
          style={{ background: TEAL, color: "#fff", border: "none", borderRadius: 4, padding: "8px 14px", cursor: sending ? "default" : "pointer", opacity: sending ? 0.7 : 1 }}
        >
          {sending ? "Sending…" : "Send"}
        </button>
      </div>
    </Modal>
  );
}
