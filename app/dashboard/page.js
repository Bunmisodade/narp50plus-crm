"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import {
  listMembers, addMember, addNote, addMemberProduct, addProductTransaction, getMyCooperativeId, getMyProfile,
  inviteMemberToPortal, closeMemberProduct,
} from "../../lib/members";
import { sendMemberEmails } from "../../lib/email";
import { Button, Input, Select, TextArea, Label, Card, Badge, Modal } from "../../components/ui";

const PRODUCT_LABELS = { savings: "Savings", loan: "Loan", investment: "Investment", equity: "Equity" };
const PRODUCT_TONE = { savings: "forest", loan: "rust", investment: "brass", equity: "purple" };
const STATUS_TONE = { Active: "forest", Overdue: "rust", Lapsed: "neutral" };
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

  async function handleCloseProduct(productId, balance) {
    const warning = balance && Number(balance) !== 0
      ? `This product still has a balance of ${fmtNaira(balance)}. Close it anyway?`
      : "Close this product? Its transaction history will be kept, but no further transactions can be recorded against it.";
    if (!window.confirm(warning)) return;
    try {
      await closeMemberProduct(productId);
      await refresh();
    } catch (e) {
      console.error("Failed to close product:", e);
      alert("Could not close this product. Check the browser console for details.");
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

  if (loading) return <div className="p-10 font-sans text-ink-soft">Loading…</div>;

  return (
    <div className="bg-paper min-h-screen text-ink">
      <header className="border-b border-line-strong px-4 sm:px-7 py-4 flex flex-wrap justify-between items-center gap-3">
        <h1 className="text-2xl m-0">Member Ledger</h1>
        <div className="flex items-center gap-4 font-sans text-sm">
          <span className="text-ink-soft hidden sm:inline">
            {enriched.length} members · {enriched.filter((m) => m.status === "Overdue").length} overdue
          </span>
          <Button onClick={() => setShowEmailForm(true)}>Send Email</Button>
        </div>
      </header>

      <div className="flex flex-col md:flex-row">
        <aside className="w-full md:w-80 md:border-r border-line-strong p-4 md:p-5">
          <div className="flex gap-2 mb-3 font-sans">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search…" />
            <Button onClick={() => setShowForm(true)} className="px-4">+</Button>
          </div>
          <div className="flex gap-1.5 mb-3 font-sans flex-wrap">
            {["All", "Active", "Overdue", "Lapsed"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs px-2.5 py-1 rounded-full border transition ${
                  filter === f ? "bg-ink text-white border-ink" : "border-line-strong text-ink"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="max-h-64 md:max-h-none overflow-y-auto md:overflow-visible">
            {filtered.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedId(m.id)}
                className={`block w-full text-left mb-2 p-2.5 rounded-md border transition ${
                  selectedId === m.id ? "bg-white border-line" : "border-transparent hover:bg-white/60"
                }`}
              >
                <div>{m.name}</div>
                <div className="font-sans text-[11px] text-ink-soft flex justify-between items-center mt-0.5">
                  <span>{m.member_no}</span>
                  <Badge tone={STATUS_TONE[m.status]}>{m.status}</Badge>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <main className="flex-1 p-4 sm:p-8">
          {!selected && <div className="text-ink-soft font-sans">Select a member, or add one.</div>}
          {selected && (
            <div className="max-w-2xl">
              <Card className="p-5 sm:p-6 relative">
                <button
                  onClick={() => setSelectedId(null)}
                  aria-label="Close"
                  className="absolute top-4 right-4 w-7 h-7 rounded-full border border-line-strong bg-white text-ink-soft flex items-center justify-center text-base leading-none hover:border-forest hover:text-forest-dark transition"
                >
                  ×
                </button>
                <div className="font-sans text-[11px] text-brass font-bold">{selected.member_no}</div>
                <h2 className="mt-1 pr-8">{selected.name}</h2>

                <div className="font-sans text-sm grid grid-cols-2 gap-3 mt-4">
                  <div>Phone<br /><strong>{selected.phone || "–"}</strong></div>
                  <div>Email<br /><strong className="break-all">{selected.email || "–"}</strong></div>
                  <div>Renewal due<br /><strong>{fmtDate(selected.renewal_date)}</strong></div>
                  <div>Dues<br /><strong>{fmtNaira(selected.dues)}</strong></div>
                </div>

                <div className="font-sans text-xs text-ink-soft mt-4 border-t border-dashed border-line-strong pt-3 flex flex-wrap justify-between items-center gap-2">
                  <span>{selected.qbo_linked ? `Linked to QuickBooks: ${selected.qbo_account_ref}` : "Not yet linked to QuickBooks."}</span>
                  <Button
                    variant="ghost"
                    onClick={() => handleInviteToPortal(selected.id)}
                    disabled={invitingId === selected.id}
                    className="!py-1 !px-2.5 text-xs"
                  >
                    {invitingId === selected.id ? "Generating…" : "Invite to portal"}
                  </Button>
                </div>
                {inviteResult && inviteResult.memberId === selected.id && (
                  <div className="text-xs bg-brass-tint border border-brass/30 rounded-card px-2.5 py-2 mt-2">
                    Portal code: <strong className="tracking-wide">{inviteResult.code}</strong>
                    {inviteResult.emailSent ? " — emailed to the member." : " — no email on file, share this code directly."}
                  </div>
                )}

                <div className="mt-5 font-sans">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs uppercase text-ink-soft m-0 tracking-wide">Products</h3>
                    <Button variant="ghost" onClick={() => setShowProductForm(true)} className="!py-1 !px-2.5 text-xs">
                      + Add Product
                    </Button>
                  </div>
                  {(selected.member_products || []).length === 0 && (
                    <div className="text-xs text-ink-soft mt-2">No products yet.</div>
                  )}
                  {(selected.member_products || [])
                    .slice()
                    .sort((a, b) => new Date(b.opened_date) - new Date(a.opened_date))
                    .map((p) => {
                      const isExpanded = expandedProductId === p.id;
                      const txs = (p.product_transactions || []).slice().sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date));
                      return (
                        <div key={p.id} className="border-b border-paper py-2.5">
                          <div className={`flex flex-wrap justify-between items-center gap-2 ${p.status !== "active" ? "opacity-60" : ""}`}>
                            <div className="cursor-pointer" onClick={() => setExpandedProductId(isExpanded ? null : p.id)}>
                              <Badge tone={PRODUCT_TONE[p.product_type]} className="mr-2">
                                {PRODUCT_LABELS[p.product_type] || p.product_type}
                              </Badge>
                              <span className="text-ink-soft text-[11px]">{p.status}</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                              <div className="font-bold text-sm">{fmtNaira(p.balance)}</div>
                              {p.status === "active" && (
                                <>
                                  <Button
                                    variant="ghost"
                                    onClick={() => setTxTarget({ productId: p.id, productType: p.product_type })}
                                    className="!py-1 !px-2 text-xs"
                                  >
                                    + Transaction
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    onClick={() => handleCloseProduct(p.id, p.balance)}
                                    className="!py-1 !px-2 text-xs"
                                  >
                                    Close
                                  </Button>
                                </>
                              )}
                            </div>
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

                <div className="mt-5 font-sans">
                  <h3 className="text-xs uppercase text-ink-soft tracking-wide">Notes</h3>
                  <div className="flex gap-2 mb-3">
                    <Input
                      value={noteDraft}
                      onChange={(e) => setNoteDraft(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
                      placeholder="Log an update…"
                    />
                    <Button onClick={handleAddNote}>Add</Button>
                  </div>
                  {(selected.member_notes || []).sort((a, b) => new Date(b.note_date) - new Date(a.note_date)).map((n) => (
                    <div key={n.id} className="text-sm mb-1.5">
                      <span className="text-[11px] text-brass mr-2.5">{fmtDate(n.note_date)}</span>{n.text}
                    </div>
                  ))}
                </div>
              </Card>
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
      <h3 className="mt-0 pr-6">New member</h3>
      <div className="space-y-2">
        {["name", "phone", "email"].map((k) => (
          <Input key={k} placeholder={k} value={form[k]} onChange={set(k)} />
        ))}
        <div><Label>Join date</Label><Input type="date" value={form.joinDate} onChange={set("joinDate")} /></div>
        <div><Label>Dues (₦)</Label><Input type="number" value={form.dues} onChange={set("dues")} /></div>
        <div><Label>Renewal due</Label><Input type="date" value={form.renewalDate} onChange={set("renewalDate")} /></div>
      </div>
      {error && <div className="text-rust text-xs mt-2">{error}</div>}
      <div className="flex gap-2 justify-end mt-4">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSave}>Save</Button>
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
      <h3 className="mt-0 pr-6">Add product</h3>
      <div className="space-y-2">
        <div>
          <Label>Product type</Label>
          <Select value={form.productType} onChange={set("productType")}>
            <option value="savings">Savings</option>
            <option value="loan">Loan</option>
            <option value="investment">Investment</option>
            <option value="equity">Equity</option>
          </Select>
        </div>
        <div>
          <Label>{form.productType === "loan" ? "Amount disbursed (₦, optional)" : "Opening deposit (₦, optional)"}</Label>
          <Input type="number" value={form.openingAmount} onChange={set("openingAmount")} />
        </div>
        {form.productType === "loan" && (
          <div><Label>Principal (₦)</Label><Input type="number" value={form.principal} onChange={set("principal")} /></div>
        )}
        <div><Label>Interest rate (%)</Label><Input type="number" value={form.interestRate} onChange={set("interestRate")} /></div>
        <div><Label>Opened date</Label><Input type="date" value={form.openedDate} onChange={set("openedDate")} /></div>
        {form.productType === "investment" && (
          <div><Label>Maturity date</Label><Input type="date" value={form.maturityDate} onChange={set("maturityDate")} /></div>
        )}
      </div>
      <div className="flex gap-2 justify-end mt-4">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave(form)}>Save</Button>
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
      <h3 className="mt-0 pr-6">Record transaction</h3>
      <div className="space-y-2">
        <div>
          <Label>Type</Label>
          <Select value={form.transactionType} onChange={set("transactionType")}>
            {options.map((o) => <option key={o} value={o}>{TRANSACTION_LABELS[o]}</option>)}
          </Select>
        </div>
        {form.transactionType === "adjustment" && (
          <div>
            <Label>Direction</Label>
            <Select value={form.direction} onChange={set("direction")}>
              <option value="credit">Increase balance</option>
              <option value="debit">Decrease balance</option>
            </Select>
          </div>
        )}
        <div><Label>Amount (₦)</Label><Input type="number" value={form.amount} onChange={set("amount")} /></div>
        <div><Label>Date</Label><Input type="date" value={form.transactionDate} onChange={set("transactionDate")} /></div>
        <div><Label>Description (optional)</Label><Input value={form.description} onChange={set("description")} /></div>
      </div>
      {error && <div className="text-rust text-xs mt-2">{error}</div>}
      <div className="flex gap-2 justify-end mt-4">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSave}>Save</Button>
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
    <Modal onClose={onCancel} widthClass="max-w-md">
      <h3 className="mt-0 pr-6">Send email</h3>
      <Input placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} className="mb-2" />
      <TextArea placeholder="Message" value={body} onChange={(e) => setBody(e.target.value)} rows={6} className="mb-3" />
      <div className="text-xs font-bold mb-1.5">
        Recipients ({selected.size} of {members.length})
      </div>
      <div className="border border-line-strong rounded-card max-h-40 overflow-y-auto mb-3">
        {members.length === 0 && (
          <div className="p-2.5 text-xs text-ink-soft">No members with an email address match the current filter.</div>
        )}
        {members.map((m) => (
          <label key={m.id} className="flex items-center gap-2 px-2 py-1.5 text-sm border-b border-paper last:border-b-0">
            <input type="checkbox" checked={selected.has(m.id)} onChange={() => toggle(m.id)} />
            {m.name} <span className="text-ink-soft">({m.email})</span>
          </label>
        ))}
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSend} disabled={sending}>{sending ? "Sending…" : "Send"}</Button>
      </div>
    </Modal>
  );
}
