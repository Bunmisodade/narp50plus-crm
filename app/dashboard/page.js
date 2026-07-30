"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { listMembers, addMember, addNote, getMyCooperativeId } from "../../lib/members";

const INK = "#1F2E28", BASE = "#EFEBE0", TEAL = "#2F6F5E", GOLD = "#B8862B", BRICK = "#A13D2C";
const STATUS_STYLE = {
  Active: { bg: "#EAF2EE", fg: TEAL },
  Overdue: { bg: "#FBEFE9", fg: BRICK },
  Lapsed: { bg: "#F0EDE6", fg: "#6B6558" },
};

function computeStatus(m) {
  if (!m.renewal_date) return "Active";
  const daysPast = (new Date() - new Date(m.renewal_date)) / 86400000;
  if (daysPast <= 0) return "Active";
  if (daysPast <= 60) return "Overdue";
  return "Lapsed";
}
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—");
const fmtNaira = (n) => (n == null ? "—" : "₦" + Number(n).toLocaleString("en-NG"));

export default function Dashboard() {
  const [members, setMembers] = useState([]);
  const [cooperativeId, setCooperativeId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }
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
      setMembers((prev) => [...prev, { ...newMember, member_notes: [] }]);
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

  if (loading) return <div style={{ padding: 40, fontFamily: "system-ui" }}>Loading…</div>;

  return (
    <div style={{ background: BASE, minHeight: "100vh", color: INK, fontFamily: "Georgia, serif" }}>
      <header style={{ borderBottom: "1px solid #D9D3C2", padding: "20px 28px", display: "flex", justifyContent: "space-between" }}>
        <h1 style={{ margin: 0, fontSize: 26 }}>Member Ledger</h1>
        <div style={{ fontFamily: "system-ui", fontSize: 13 }}>
          {enriched.length} members · {enriched.filter((m) => m.status === "Overdue").length} overdue
        </div>
      </header>
      <div style={{ display: "flex" }}>
        <aside style={{ width: 320, borderRight: "1px solid #D9D3C2", padding: 20 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 10, fontFamily: "system-ui" }}>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search…"
              style={{ flex: 1, padding: 8, border: "1px solid #D9D3C2", borderRadius: 4 }} />
            <button onClick={() => setShowForm(true)} style={{ background: TEAL, color: "#fff", border: "none", borderRadius: 4, padding: "0 12px", cursor: "pointer" }}>+</button>
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
                border: `1px solid ${selectedId === m.id ? INK : "#E4DFD2"}`, borderRadius: 6,
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
              <div style={{ background: "#fff", border: "1px solid #D9D3C2", borderRadius: 8, padding: 24 }}>
                <div style={{ fontFamily: "system-ui", fontSize: 11, color: GOLD, fontWeight: 700 }}>{selected.member_no}</div>
                <h2 style={{ marginTop: 4 }}>{selected.name}</h2>
                <div style={{ fontFamily: "system-ui", fontSize: 13, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>Phone<br /><strong>{selected.phone || "—"}</strong></div>
                  <div>Email<br /><strong>{selected.email || "—"}</strong></div>
                  <div>Renewal due<br /><strong>{fmtDate(selected.renewal_date)}</strong></div>
                  <div>Dues<br /><strong>{fmtNaira(selected.dues)}</strong></div>
                </div>
                <div style={{ fontFamily: "system-ui", fontSize: 12, color: "#8A8372", marginTop: 16, borderTop: "1px dashed #D9D3C2", paddingTop: 12 }}>
                  {selected.qbo_linked ? `Linked to QuickBooks: ${selected.qbo_account_ref}` : "Not yet linked to QuickBooks."}
                </div>
              </div>
              <div style={{ marginTop: 20, fontFamily: "system-ui" }}>
                <h3 style={{ fontSize: 13, textTransform: "uppercase", color: "#8A8372" }}>Notes</h3>
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  <input value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
                    placeholder="Log an update…" style={{ flex: 1, padding: 8, border: "1px solid #D9D3C2", borderRadius: 4 }} />
                  <button onClick={handleAddNote} style={{ background: INK, color: "#fff", border: "none", borderRadius: 4, padding: "0 14px", cursor: "pointer" }}>Log</button>
                </div>
                {(selected.member_notes || []).sort((a, b) => new Date(b.note_date) - new Date(a.note_date)).map((n) => (
                  <div key={n.id} style={{ fontSize: 14, marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: GOLD, marginRight: 10 }}>{fmtDate(n.note_date)}</span>{n.text}
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
      {showForm && <MemberForm onCancel={() => setShowForm(false)} onSave={handleAddMember} />}
    </div>
  );
}

function MemberForm({ onCancel, onSave }) {
  const [form, setForm] = useState({ name: "", phone: "", email: "", joinDate: "", dues: "", lastPayment: "", renewalDate: "" });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", padding: 24, borderRadius: 8, width: 360, fontFamily: "system-ui" }}>
        <h3>New member</h3>
        {["name", "phone", "email"].map((k) => (
          <input key={k} placeholder={k} value={form[k]} onChange={set(k)} style={{ width: "100%", padding: 8, marginBottom: 8, border: "1px solid #ccc", borderRadius: 4 }} />
        ))}
        <label style={{ fontSize: 12 }}>Join date<input type="date" value={form.joinDate} onChange={set("joinDate")} style={{ width: "100%", padding: 8, marginBottom: 8, border: "1px solid #ccc", borderRadius: 4 }} /></label>
        <label style={{ fontSize: 12 }}>Dues (₦)<input type="number" value={form.dues} onChange={set("dues")} style={{ width: "100%", padding: 8, marginBottom: 8, border: "1px solid #ccc", borderRadius: 4 }} /></label>
        <label style={{ fontSize: 12 }}>Renewal due<input type="date" value={form.renewalDate} onChange={set("renewalDate")} style={{ width: "100%", padding: 8, marginBottom: 8, border: "1px solid #ccc", borderRadius: 4 }} /></label>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
          <button onClick={onCancel}>Cancel</button>
          <button onClick={() => form.name && onSave(form)} style={{ background: TEAL, color: "#fff", border: "none", borderRadius: 4, padding: "6px 12px" }}>Save</button>
        </div>
      </div>
    </div>
  );
}
