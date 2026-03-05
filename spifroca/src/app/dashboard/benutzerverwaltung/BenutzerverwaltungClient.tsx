"use client";
import { useState } from "react";

const RN = {
  navy:      "#1C2B3A",
  navyDark:  "#111d28",
  navyLight: "#243447",
  gold:      "#C8A96E",
  bg:        "#F5F4F2",
};

const ROLLEN = ["ADMINISTRATOR", "PROJEKTLEITER", "CONTROLLING", "EXTERNER_PLANER", "BETRACHTER"];
const ROLLEN_LABEL: Record<string, string> = {
  ADMINISTRATOR:   "Administrator",
  PROJEKTLEITER:   "Projektleiter",
  CONTROLLING:     "Controlling",
  EXTERNER_PLANER: "Externer Planer",
  BETRACHTER:      "Betrachter",
};
const ROLLEN_COLOR: Record<string, string> = {
  ADMINISTRATOR:   "#C8A96E",
  PROJEKTLEITER:   "#3b82f6",
  CONTROLLING:     "#8b5cf6",
  EXTERNER_PLANER: "#f59e0b",
  BETRACHTER:      "#6b7280",
};

const EMPTY_FORM = { name: "", email: "", passwort: "", rolle: "BETRACHTER", aktiv: true, personId: "" };

export function BenutzerverwaltungClient({ benutzer: initial, personen: initialPersonen }: { benutzer: any[]; personen: any[] }) {
  const [benutzer, setBenutzer] = useState(initial);
  const [personen, setPersonen] = useState(initialPersonen);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser]   = useState<any>(null);
  const [form, setForm]           = useState<any>(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");
  const [selected, setSelected]   = useState<any>(null);

  const openNew = () => {
    setEditUser(null);
    setForm(EMPTY_FORM);
    setError("");
    setShowModal(true);
  };

  const openEdit = (u: any) => {
    setEditUser(u);
    setForm({ name: u.name, email: u.email, passwort: "", rolle: u.rolle, aktiv: u.aktiv, personId: u.personId || "" });
    setError("");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.email) { setError("Name und E-Mail sind Pflichtfelder"); return; }
    if (!editUser && !form.passwort) { setError("Passwort ist Pflichtfeld"); return; }
    setSaving(true); setError("");
    try {
      const url    = editUser ? `/api/benutzer/${editUser.id}` : "/api/benutzer";
      const method = editUser ? "PUT" : "POST";
      const res    = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Fehler beim Speichern"); return; }
      if (editUser) {
        setBenutzer(bs => bs.map(b => b.id === data.id ? data : b));
        setSelected(data);
      } else {
        setBenutzer(bs => [...bs, data]);
      }
      // Aktualisiere Personen-Liste (verknüpfte Person entfernen)
      if (form.personId) setPersonen(ps => ps.filter(p => p.id !== form.personId));
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAktiv = async (u: any) => {
    const res = await fetch(`/api/benutzer/${u.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...u, passwort: "", aktiv: !u.aktiv }),
    });
    if (res.ok) {
      const data = await res.json();
      setBenutzer(bs => bs.map(b => b.id === data.id ? data : b));
      if (selected?.id === data.id) setSelected(data);
    }
  };

  const F = (label: string, key: string, type = "text") => (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: "#888", textTransform: "uppercase", display: "block", marginBottom: 4 }}>{label}</label>
      <input type={type} value={form[key] || ""} onChange={e => setForm((f: any) => ({ ...f, [key]: e.target.value }))}
        style={{ width: "100%", padding: "8px 10px", border: "1px solid #e0e0e0", borderRadius: 6, fontSize: 13 }} />
    </div>
  );

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden", fontFamily: "Segoe UI, sans-serif" }}>

      {/* ── Hauptbereich ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ padding: "12px 16px", background: "#fff", borderBottom: "1px solid #ddd", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: RN.navy }}>Benutzerverwaltung</h1>
            <div style={{ fontSize: 11, color: "#999" }}>{benutzer.length} Benutzer</div>
          </div>
          <button onClick={openNew} style={{ background: RN.navy, color: RN.gold, border: "none", borderRadius: 5, padding: "7px 16px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
            + Neuer Benutzer
          </button>
        </div>

        {/* Tabelle */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead style={{ position: "sticky", top: 0 }}>
              <tr style={{ background: "#e8e8e8", borderBottom: "2px solid #ccc" }}>
                {["Name", "E-Mail", "Rolle", "Kontakt verknüpft", "Status", "Letzter Login", ""].map(h => (
                  <th key={h} style={{ padding: "7px 10px", textAlign: "left", fontWeight: 600, color: "#555", fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {benutzer.map((u, i) => (
                <tr key={u.id}
                  onClick={() => setSelected(u)}
                  style={{ background: selected?.id === u.id ? "#f0f4ff" : i % 2 === 0 ? "#fff" : "#f9f9f9", borderBottom: "1px solid #eee", cursor: "pointer" }}>
                  <td style={{ padding: "8px 10px", fontWeight: 600, color: RN.navy }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: RN.gold + "33", border: `1px solid ${RN.gold}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: RN.navy, flexShrink: 0 }}>
                        {u.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                      </div>
                      {u.name}
                    </div>
                  </td>
                  <td style={{ padding: "8px 10px", color: "#555" }}>{u.email}</td>
                  <td style={{ padding: "8px 10px" }}>
                    <span style={{ background: (ROLLEN_COLOR[u.rolle] || "#666") + "22", color: ROLLEN_COLOR[u.rolle] || "#666", padding: "2px 8px", borderRadius: 3, fontSize: 11, fontWeight: 600 }}>
                      {ROLLEN_LABEL[u.rolle]}
                    </span>
                  </td>
                  <td style={{ padding: "8px 10px" }}>
                    {u.person ? (
                      <span style={{ color: "#16a34a", fontSize: 11 }}>✅ {u.person.vorname} {u.person.name}</span>
                    ) : (
                      <span style={{ color: "#999", fontSize: 11 }}>— nicht verknüpft</span>
                    )}
                  </td>
                  <td style={{ padding: "8px 10px" }}>
                    <span style={{ background: u.aktiv ? "#dcfce7" : "#fee2e2", color: u.aktiv ? "#16a34a" : "#dc2626", padding: "2px 8px", borderRadius: 3, fontSize: 11, fontWeight: 600 }}>
                      {u.aktiv ? "Aktiv" : "Inaktiv"}
                    </span>
                  </td>
                  <td style={{ padding: "8px 10px", color: "#999", fontSize: 11 }}>
                    {u.letzterLogin ? new Date(u.letzterLogin).toLocaleString("de-CH") : "–"}
                  </td>
                  <td style={{ padding: "8px 10px" }}>
                    <button onClick={e => { e.stopPropagation(); openEdit(u); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14 }}>✏️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Detailansicht ── */}
      {selected && (
        <div style={{ width: 280, background: "#fff", borderLeft: "1px solid #ddd", overflowY: "auto", flexShrink: 0 }}>
          <div style={{ padding: "12px 14px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: RN.navy }}>Details</span>
            <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#999" }}>×</button>
          </div>

          <div style={{ padding: "16px 14px" }}>
            {/* Avatar */}
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: RN.gold + "22", border: `2px solid ${RN.gold}`, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: RN.navy, marginBottom: 8 }}>
                {selected.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, color: RN.navy }}>{selected.name}</div>
              <div style={{ fontSize: 12, color: ROLLEN_COLOR[selected.rolle] || "#666", fontWeight: 600 }}>{ROLLEN_LABEL[selected.rolle]}</div>
            </div>

            {[
              { icon: "📧", label: selected.email },
              { icon: "📅", label: `Erstellt: ${new Date(selected.createdAt).toLocaleDateString("de-CH")}` },
              { icon: "🔒", label: `2FA: ${selected.mfaAktiv ? "Aktiviert" : "Deaktiviert"}` },
              { icon: "🏢", label: selected.mandant },
            ].map((x, i) => (
              <div key={i} style={{ display: "flex", gap: 8, padding: "5px 0", borderBottom: "1px solid #f5f5f5", fontSize: 12 }}>
                <span>{x.icon}</span><span style={{ color: "#555" }}>{x.label}</span>
              </div>
            ))}

            {selected.person && (
              <div style={{ marginTop: 12, padding: "8px 10px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#16a34a", marginBottom: 4 }}>VERKNÜPFTER KONTAKT</div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>👤 {selected.person.vorname} {selected.person.name}</div>
                {selected.person.email && <div style={{ fontSize: 11, color: "#666" }}>{selected.person.email}</div>}
              </div>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button onClick={() => openEdit(selected)} style={{ flex: 1, padding: "7px", background: RN.navy, color: RN.gold, border: "none", borderRadius: 5, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                ✏️ Bearbeiten
              </button>
              <button onClick={() => handleToggleAktiv(selected)}
                style={{ padding: "7px 10px", background: selected.aktiv ? "#fee2e2" : "#dcfce7", color: selected.aktiv ? "#dc2626" : "#16a34a", border: "none", borderRadius: 5, fontSize: 12, cursor: "pointer" }}>
                {selected.aktiv ? "Deaktivieren" : "Aktivieren"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal ── */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "#00000055", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 12, width: 520, maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px #00000044" }}>

            <div style={{ padding: "14px 20px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center", background: RN.navy }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: RN.gold }}>{editUser ? "Benutzer bearbeiten" : "Neuer Benutzer"}</span>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>×</button>
            </div>

            <div style={{ padding: "16px 20px", overflowY: "auto", flex: 1 }}>
              {error && <div style={{ background: "#fee2e2", color: "#dc2626", padding: "8px 12px", borderRadius: 6, marginBottom: 12, fontSize: 13 }}>{error}</div>}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {F("Name *", "name")}
                {F("E-Mail *", "email", "email")}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {F(editUser ? "Neues Passwort (leer = unverändert)" : "Passwort *", "passwort", "password")}
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#888", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Rolle</label>
                  <select value={form.rolle} onChange={e => setForm((f: any) => ({ ...f, rolle: e.target.value }))}
                    style={{ width: "100%", padding: "8px 10px", border: "1px solid #e0e0e0", borderRadius: 6, fontSize: 13, background: "#fff" }}>
                    {ROLLEN.map(r => <option key={r} value={r}>{ROLLEN_LABEL[r]}</option>)}
                  </select>
                </div>
              </div>

              {/* Kontakt verknüpfen */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#888", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Kontakt verknüpfen</label>
                <select value={form.personId} onChange={e => setForm((f: any) => ({ ...f, personId: e.target.value }))}
                  style={{ width: "100%", padding: "8px 10px", border: "1px solid #e0e0e0", borderRadius: 6, fontSize: 13, background: "#fff" }}>
                  <option value="">— Kein Kontakt —</option>
                  {editUser?.person && (
                    <option value={editUser.person.id}>✅ {editUser.person.vorname} {editUser.person.name} (aktuell)</option>
                  )}
                  {personen.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.typ === "FIRMA" ? `🏢 ${p.firmaName || p.name}` : `👤 ${p.vorname || ""} ${p.name}`}
                    </option>
                  ))}
                </select>
                <div style={{ fontSize: 11, color: "#999", marginTop: 4 }}>Nur Kontakte ohne Benutzer-Verknüpfung werden angezeigt</div>
              </div>

              {/* Aktiv */}
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input type="checkbox" checked={form.aktiv} onChange={e => setForm((f: any) => ({ ...f, aktiv: e.target.checked }))} />
                <span style={{ fontSize: 13 }}>Benutzer aktiv</span>
              </label>
            </div>

            <div style={{ padding: "12px 20px", borderTop: "1px solid #eee", display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={() => setShowModal(false)} style={{ padding: "8px 16px", border: "1px solid #ddd", borderRadius: 6, background: "#fff", cursor: "pointer", fontSize: 13 }}>
                Abbrechen
              </button>
              <button onClick={handleSave} disabled={saving}
                style={{ padding: "8px 20px", background: saving ? "#999" : RN.navy, color: RN.gold, border: "none", borderRadius: 6, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                {saving ? "Speichern..." : editUser ? "Speichern" : "Erstellen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
