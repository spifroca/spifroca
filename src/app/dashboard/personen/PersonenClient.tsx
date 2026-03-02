"use client";
import { useState, useMemo } from "react";

const ROLLEN_LABEL: Record<string, string> = {
  BENUTZER:     "Benutzer",
  LIEFERANT:    "Lieferant",
  BAUHERR:      "Bauherr",
  PLANER:       "Planer",
  UNTERNEHMER:  "Unternehmer",
  KONTAKT:      "Kontakt",
};

const ROLLEN_COLOR: Record<string, string> = {
  BENUTZER:    "#3b82f6",
  LIEFERANT:   "#f59e0b",
  BAUHERR:     "#c0392b",
  PLANER:      "#8b5cf6",
  UNTERNEHMER: "#22c55e",
  KONTAKT:     "#6b7280",
};

const SPRACHEN = ["DE", "FR", "IT", "EN"];
const ALLE_ROLLEN = ["BENUTZER", "LIEFERANT", "BAUHERR", "PLANER", "UNTERNEHMER", "KONTAKT"];

const EMPTY_FORM = {
  typ: "PRIVATPERSON", rollen: [] as string[], name: "", vorname: "",
  email: "", telefon: "", telefonMobil: "", webseite: "", sprache: "DE",
  strasse: "", plz: "", ort: "", land: "CH",
  funktion: "", abteilung: "",
  geschaeftsStrasse: "", geschaeftsPlz: "", geschaeftsOrt: "",
  firmaName: "", uid: "", iban: "",
  geburtsdatum: "", notizen: "", arbeitgeberId: "",
};

export function PersonenClient({ personen: initial }: { personen: any[] }) {
  const [personen, setPersonen]   = useState(initial);
  const [search, setSearch]       = useState("");
  const [rolleFilter, setRolle]   = useState<string[]>([]);
  const [typFilter, setTyp]       = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editPerson, setEdit]     = useState<any>(null);
  const [form, setForm]           = useState<any>(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [detail, setDetail]       = useState<any>(null);

  const firmen = personen.filter(p => p.typ === "FIRMA");

  const filtered = useMemo(() => {
    let list = [...personen];
    if (search) list = list.filter(p =>
      `${p.name} ${p.vorname} ${p.firmaName} ${p.email}`.toLowerCase().includes(search.toLowerCase())
    );
    if (rolleFilter.length) list = list.filter(p => p.rollen.some((r: string) => rolleFilter.includes(r)));
    if (typFilter.length)   list = list.filter(p => typFilter.includes(p.typ));
    return list;
  }, [personen, search, rolleFilter, typFilter]);

  const openNew = () => {
    setEdit(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (p: any) => {
    setEdit(p);
    setForm({
      ...EMPTY_FORM, ...p,
      geburtsdatum: p.geburtsdatum ? p.geburtsdatum.substring(0, 10) : "",
      arbeitgeberId: p.arbeitgeberId || "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url    = editPerson ? `/api/personen/${editPerson.id}` : "/api/personen";
      const method = editPerson ? "PUT" : "POST";
      const res    = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const saved = await res.json();
        if (editPerson) setPersonen(ps => ps.map(p => p.id === saved.id ? saved : p));
        else            setPersonen(ps => [...ps, saved]);
        setShowModal(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Person wirklich löschen?")) return;
    await fetch(`/api/personen/${id}`, { method: "DELETE" });
    setPersonen(ps => ps.filter(p => p.id !== id));
    setDetail(null);
  };

  const F = (label: string, key: string, type = "text", opts?: any) => (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 4 }}>{label}</label>
      {type === "textarea" ? (
        <textarea value={form[key] || ""} onChange={e => setForm((f: any) => ({ ...f, [key]: e.target.value }))} rows={3}
          style={{ width: "100%", padding: "8px 10px", border: "1px solid #e0e0e0", borderRadius: 6, fontSize: 13, fontFamily: "inherit", resize: "vertical" }} />
      ) : type === "select" ? (
        <select value={form[key] || ""} onChange={e => setForm((f: any) => ({ ...f, [key]: e.target.value }))}
          style={{ width: "100%", padding: "8px 10px", border: "1px solid #e0e0e0", borderRadius: 6, fontSize: 13, background: "#fff" }}>
          <option value="">— Auswählen —</option>
          {opts?.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input type={type} value={form[key] || ""} onChange={e => setForm((f: any) => ({ ...f, [key]: e.target.value }))}
          style={{ width: "100%", padding: "8px 10px", border: "1px solid #e0e0e0", borderRadius: 6, fontSize: 13 }} />
      )}
    </div>
  );

  const Section = ({ title }: { title: string }) => (
    <div style={{ fontSize: 11, fontWeight: 700, color: "#c0392b", textTransform: "uppercase", letterSpacing: "0.8px", borderBottom: "2px solid #c0392b", paddingBottom: 4, marginBottom: 12, marginTop: 20 }}>{title}</div>
  );

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden", fontFamily: "Segoe UI, sans-serif" }}>

      {/* ── Hauptbereich ────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ padding: "12px 16px", background: "#fff", borderBottom: "1px solid #ddd", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: "#333" }}>Personenverwaltung</h1>
            <div style={{ fontSize: 11, color: "#999" }}>{filtered.length} von {personen.length} Personen</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Suchen..." style={{ padding: "5px 10px", border: "1px solid #ccc", borderRadius: 4, fontSize: 12, width: 220 }} />
            <button onClick={openNew} style={{ background: "#c0392b", color: "#fff", border: "none", borderRadius: 5, padding: "6px 14px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
              + Neue Person
            </button>
          </div>
        </div>

        {/* Tabelle */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead style={{ position: "sticky", top: 0, zIndex: 2 }}>
              <tr style={{ background: "#e8e8e8", borderBottom: "2px solid #ccc" }}>
                {["Typ", "Name", "Funktion", "Rollen", "E-Mail", "Telefon", "Ort", ""].map(h => (
                  <th key={h} style={{ padding: "7px 10px", textAlign: "left", fontWeight: 600, color: "#555", fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={p.id}
                  onClick={() => setDetail(p)}
                  style={{ background: detail?.id === p.id ? "#fce8e8" : i % 2 === 0 ? "#fff" : "#f9f9f9", borderBottom: "1px solid #eee", cursor: "pointer" }}
                  onMouseEnter={e => { if (detail?.id !== p.id) (e.currentTarget as HTMLElement).style.background = "#fff3f3"; }}
                  onMouseLeave={e => { if (detail?.id !== p.id) (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? "#fff" : "#f9f9f9"; }}
                >
                  <td style={{ padding: "7px 10px" }}>
                    <span style={{ background: p.typ === "FIRMA" ? "#3b82f620" : "#22c55e20", color: p.typ === "FIRMA" ? "#3b82f6" : "#16a34a", padding: "1px 7px", borderRadius: 3, fontSize: 11, fontWeight: 600 }}>
                      {p.typ === "FIRMA" ? "🏢 Firma" : "👤 Person"}
                    </span>
                  </td>
                  <td style={{ padding: "7px 10px", fontWeight: 600 }}>
                    {p.typ === "FIRMA" ? p.firmaName || p.name : `${p.name}${p.vorname ? ", " + p.vorname : ""}`}
                    {p.arbeitgeber && <div style={{ fontSize: 10, color: "#999" }}>{p.arbeitgeber.firmaName || p.arbeitgeber.name}</div>}
                  </td>
                  <td style={{ padding: "7px 10px", color: "#666" }}>{p.funktion || "–"}</td>
                  <td style={{ padding: "7px 10px" }}>
                    <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                      {p.rollen.map((r: string) => (
                        <span key={r} style={{ background: (ROLLEN_COLOR[r] || "#666") + "22", color: ROLLEN_COLOR[r] || "#666", padding: "1px 6px", borderRadius: 3, fontSize: 10, fontWeight: 600 }}>
                          {ROLLEN_LABEL[r]}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: "7px 10px", color: "#555" }}>{p.email || "–"}</td>
                  <td style={{ padding: "7px 10px", color: "#666" }}>{p.telefon || p.telefonMobil || "–"}</td>
                  <td style={{ padding: "7px 10px", color: "#666" }}>{p.ort || p.geschaeftsOrt || "–"}</td>
                  <td style={{ padding: "7px 10px", textAlign: "center" }}>
                    <button onClick={e => { e.stopPropagation(); openEdit(p); }} style={{ background: "none", border: "none", color: "#c0392b", cursor: "pointer", fontSize: 14 }}>✏️</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} style={{ padding: 40, textAlign: "center", color: "#999" }}>Keine Personen gefunden</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Rechte Sidebar: Filter ───────────────────────────────────────────── */}
      {!detail && (
        <div style={{ width: 180, background: "#f8f8f8", borderLeft: "1px solid #ddd", padding: 10, overflowY: "auto", flexShrink: 0, fontSize: 12 }}>
          <div style={{ fontSize: 10, color: "#999", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>Filter</div>
          <div style={{ fontWeight: 700, color: "#555", marginBottom: 4 }}>▸ Typ</div>
          {[["PRIVATPERSON", "👤 Privatperson"], ["FIRMA", "🏢 Firma"]].map(([val, label]) => (
            <label key={val} style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 0", cursor: "pointer" }}>
              <input type="checkbox" checked={typFilter.includes(val)} onChange={e => setTyp(s => e.target.checked ? [...s, val] : s.filter(x => x !== val))} />
              <span>{label}</span>
            </label>
          ))}
          <div style={{ fontWeight: 700, color: "#555", margin: "12px 0 4px" }}>▸ Rolle</div>
          {ALLE_ROLLEN.map(r => (
            <label key={r} style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 0", cursor: "pointer" }}>
              <input type="checkbox" checked={rolleFilter.includes(r)} onChange={e => setRolle(s => e.target.checked ? [...s, r] : s.filter(x => x !== r))} />
              <span style={{ color: ROLLEN_COLOR[r] }}>{ROLLEN_LABEL[r]}</span>
            </label>
          ))}
          {(rolleFilter.length > 0 || typFilter.length > 0) && (
            <button onClick={() => { setRolle([]); setTyp([]); }} style={{ marginTop: 12, width: "100%", padding: 5, background: "#c0392b22", color: "#c0392b", border: "1px solid #c0392b44", borderRadius: 4, cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
              Zurücksetzen
            </button>
          )}
        </div>
      )}

      {/* ── Detailansicht ────────────────────────────────────────────────────── */}
      {detail && (
        <div style={{ width: 300, background: "#fff", borderLeft: "1px solid #ddd", overflowY: "auto", flexShrink: 0 }}>
          <div style={{ padding: "12px 14px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 700, fontSize: 13 }}>Details</span>
            <button onClick={() => setDetail(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#999" }}>×</button>
          </div>

          {/* Avatar */}
          <div style={{ padding: "16px 14px", textAlign: "center", borderBottom: "1px solid #eee" }}>
            <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#c0392b22", border: "2px solid #c0392b44", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 8 }}>
              {detail.typ === "FIRMA" ? "🏢" : "👤"}
            </div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>
              {detail.typ === "FIRMA" ? detail.firmaName || detail.name : `${detail.vorname || ""} ${detail.name}`}
            </div>
            {detail.funktion && <div style={{ fontSize: 12, color: "#999" }}>{detail.funktion}</div>}
            {detail.arbeitgeber && <div style={{ fontSize: 11, color: "#c0392b" }}>{detail.arbeitgeber.firmaName || detail.arbeitgeber.name}</div>}
            <div style={{ display: "flex", gap: 4, justifyContent: "center", marginTop: 8, flexWrap: "wrap" }}>
              {detail.rollen.map((r: string) => (
                <span key={r} style={{ background: (ROLLEN_COLOR[r] || "#666") + "22", color: ROLLEN_COLOR[r] || "#666", padding: "2px 8px", borderRadius: 3, fontSize: 10, fontWeight: 600 }}>
                  {ROLLEN_LABEL[r]}
                </span>
              ))}
            </div>
          </div>

          {/* Info-Zeilen */}
          <div style={{ padding: "10px 14px" }}>
            {[
              { icon: "📧", label: detail.email },
              { icon: "📞", label: detail.telefon },
              { icon: "📱", label: detail.telefonMobil },
              { icon: "🌐", label: detail.webseite },
              { icon: "🏠", label: [detail.strasse, detail.plz, detail.ort].filter(Boolean).join(", ") },
              { icon: "🏢", label: [detail.geschaeftsStrasse, detail.geschaeftsPlz, detail.geschaeftsOrt].filter(Boolean).join(", ") },
              { icon: "🎂", label: detail.geburtsdatum ? new Date(detail.geburtsdatum).toLocaleDateString("de-CH") : null },
              { icon: "🏦", label: detail.iban },
              { icon: "🔢", label: detail.uid ? `UID: ${detail.uid}` : null },
              { icon: "💬", label: detail.sprache ? `Sprache: ${detail.sprache}` : null },
            ].filter(x => x.label).map((x, i) => (
              <div key={i} style={{ display: "flex", gap: 8, padding: "5px 0", borderBottom: "1px solid #f5f5f5", fontSize: 12 }}>
                <span>{x.icon}</span>
                <span style={{ color: "#555" }}>{x.label}</span>
              </div>
            ))}

            {detail.projekte?.length > 0 && (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#c0392b", marginTop: 12, marginBottom: 6 }}>PROJEKTE</div>
                {detail.projekte.map((pp: any) => (
                  <div key={pp.id} style={{ fontSize: 11, padding: "3px 0", color: "#555" }}>
                    <span style={{ color: "#c0392b", fontWeight: 700 }}>{pp.projekt.nummer}</span> {pp.projekt.name}
                    {pp.funktion && <span style={{ color: "#999" }}> · {pp.funktion}</span>}
                  </div>
                ))}
              </>
            )}

            {detail.mitarbeiter?.length > 0 && (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#c0392b", marginTop: 12, marginBottom: 6 }}>MITARBEITER ({detail.mitarbeiter.length})</div>
                {detail.mitarbeiter.map((m: any) => (
                  <div key={m.id} style={{ fontSize: 11, padding: "3px 0", color: "#555" }}>👤 {m.vorname} {m.name}</div>
                ))}
              </>
            )}

            {detail.notizen && (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#c0392b", marginTop: 12, marginBottom: 6 }}>NOTIZEN</div>
                <div style={{ fontSize: 12, color: "#555", whiteSpace: "pre-wrap" }}>{detail.notizen}</div>
              </>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button onClick={() => openEdit(detail)} style={{ flex: 1, padding: "7px", background: "#c0392b", color: "#fff", border: "none", borderRadius: 5, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                ✏️ Bearbeiten
              </button>
              <button onClick={() => handleDelete(detail.id)} style={{ padding: "7px 10px", background: "#fee2e2", color: "#c0392b", border: "1px solid #c0392b44", borderRadius: 5, fontSize: 12, cursor: "pointer" }}>
                🗑️
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Neue/Bearbeiten ────────────────────────────────────────────── */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "#00000055", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 12, width: 640, maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px #00000044" }}>

            {/* Modal Header */}
            <div style={{ padding: "14px 20px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>{editPerson ? "Person bearbeiten" : "Neue Person erfassen"}</span>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#999" }}>×</button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "16px 20px", overflowY: "auto", flex: 1 }}>

              <Section title="Grunddaten" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#888", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Typ</label>
                  <select value={form.typ} onChange={e => setForm((f: any) => ({ ...f, typ: e.target.value }))}
                    style={{ width: "100%", padding: "8px 10px", border: "1px solid #e0e0e0", borderRadius: 6, fontSize: 13, background: "#fff" }}>
                    <option value="PRIVATPERSON">👤 Privatperson</option>
                    <option value="FIRMA">🏢 Firma</option>
                  </select>
                </div>
                {F("Sprache", "sprache", "select", SPRACHEN.map(s => ({ value: s, label: s })))}
              </div>

              {form.typ === "FIRMA" ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {F("Firmenname *", "firmaName")}
                  {F("Name (intern)", "name")}
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {F("Name *", "name")}
                  {F("Vorname", "vorname")}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {F("Funktion / Titel", "funktion")}
                {F("Abteilung", "abteilung")}
              </div>

              {form.typ === "PRIVATPERSON" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {F("Geburtsdatum", "geburtsdatum", "date")}
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#888", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Arbeitgeber</label>
                    <select value={form.arbeitgeberId} onChange={e => setForm((f: any) => ({ ...f, arbeitgeberId: e.target.value }))}
                      style={{ width: "100%", padding: "8px 10px", border: "1px solid #e0e0e0", borderRadius: 6, fontSize: 13, background: "#fff" }}>
                      <option value="">— Kein Arbeitgeber —</option>
                      {firmen.map(f => <option key={f.id} value={f.id}>{f.firmaName || f.name}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {/* Rollen */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#888", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Rollen (mehrere möglich)</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {ALLE_ROLLEN.map(r => {
                    const active = form.rollen.includes(r);
                    return (
                      <button key={r} type="button"
                        onClick={() => setForm((f: any) => ({ ...f, rollen: active ? f.rollen.filter((x: string) => x !== r) : [...f.rollen, r] }))}
                        style={{ padding: "4px 12px", borderRadius: 20, border: `2px solid ${ROLLEN_COLOR[r]}`, background: active ? ROLLEN_COLOR[r] : "transparent", color: active ? "#fff" : ROLLEN_COLOR[r], fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
                        {ROLLEN_LABEL[r]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Section title="Kontakt" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {F("E-Mail", "email", "email")}
                {F("Telefon", "telefon", "tel")}
                {F("Mobile", "telefonMobil", "tel")}
                {F("Webseite", "webseite", "url")}
              </div>

              <Section title="Privatadresse" />
              {F("Strasse", "strasse")}
              <div style={{ display: "grid", gridTemplateColumns: "100px 1fr 1fr", gap: 12 }}>
                {F("PLZ", "plz")}
                {F("Ort", "ort")}
                {F("Land", "land")}
              </div>

              <Section title="Geschäftsadresse" />
              {F("Strasse", "geschaeftsStrasse")}
              <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 12 }}>
                {F("PLZ", "geschaeftsPlz")}
                {F("Ort", "geschaeftsOrt")}
              </div>

              <Section title="Finanzen & Steuer" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {F("IBAN", "iban")}
                {F("UID / MwSt-Nummer", "uid")}
              </div>

              <Section title="Notizen" />
              {F("Notizen / Bemerkungen", "notizen", "textarea")}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: "12px 20px", borderTop: "1px solid #eee", display: "flex", justifyContent: "flex-end", gap: 8, flexShrink: 0 }}>
              <button onClick={() => setShowModal(false)} style={{ padding: "8px 16px", border: "1px solid #ddd", borderRadius: 6, background: "#fff", cursor: "pointer", fontSize: 13 }}>
                Abbrechen
              </button>
              <button onClick={handleSave} disabled={saving || !form.name}
                style={{ padding: "8px 20px", background: saving ? "#999" : "#c0392b", color: "#fff", border: "none", borderRadius: 6, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                {saving ? "Speichern..." : editPerson ? "Speichern" : "Erstellen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
