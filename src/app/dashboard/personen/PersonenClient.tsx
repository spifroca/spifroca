"use client";
import { useState, useMemo } from "react";

const C = {
  topbar:  "#1a1a1a",
  sidebar: "#2d2d2d",
  accent:  "#0099cc",
  bg:      "#f0f0f0",
  white:   "#ffffff",
  border:  "#cccccc",
  rowA:    "#ffffff",
  rowB:    "#f7f7f7",
  label:   "#555555",
  text:    "#222222",
};

const ROLLEN_LABEL: Record<string, string> = {
  BENUTZER: "Benutzer", LIEFERANT: "Lieferant", BAUHERR: "Bauherr",
  PLANER: "Planer", UNTERNEHMER: "Unternehmer", KONTAKT: "Kontakt",
};
const ROLLEN_COLOR: Record<string, string> = {
  BENUTZER: "#0099cc", LIEFERANT: "#f59e0b", BAUHERR: "#c0392b",
  PLANER: "#8b5cf6", UNTERNEHMER: "#22c55e", KONTAKT: "#6b7280",
};
const ALLE_ROLLEN = ["BENUTZER", "LIEFERANT", "BAUHERR", "PLANER", "UNTERNEHMER", "KONTAKT"];
const SPRACHEN = ["DE", "FR", "IT", "EN"];

const SUB_NAV = [
  "Übersicht", "Persönliche Daten", "Kommunikation", "Adressen",
  "Finanzielle Angaben", "Zahlungsverbindungen", "Rollen & Zuordnung",
  "Projekte", "Dokumente", "Notizen",
];

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
  const [selected, setSelected]   = useState<any>(null);
  const [subPage, setSubPage]     = useState("Übersicht");
  const [showModal, setShowModal] = useState(false);
  const [editPerson, setEdit]     = useState<any>(null);
  const [form, setForm]           = useState<any>(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [rolleFilter, setRolle]   = useState<string[]>([]);
  const [typFilter, setTyp]       = useState<string[]>([]);

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

  const openNew = () => { setEdit(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (p: any) => {
    setEdit(p);
    setForm({ ...EMPTY_FORM, ...p, geburtsdatum: p.geburtsdatum ? p.geburtsdatum.substring(0, 10) : "", arbeitgeberId: p.arbeitgeberId || "" });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = editPerson ? `/api/personen/${editPerson.id}` : "/api/personen";
      const res = await fetch(url, { method: editPerson ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (res.ok) {
        const saved = await res.json();
        if (editPerson) { setPersonen(ps => ps.map(p => p.id === saved.id ? saved : p)); setSelected(saved); }
        else setPersonen(ps => [...ps, saved]);
        setShowModal(false);
      }
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Person wirklich löschen?")) return;
    await fetch(`/api/personen/${id}`, { method: "DELETE" });
    setPersonen(ps => ps.filter(p => p.id !== id));
    setSelected(null);
  };

  const Row = ({ label, value }: { label: string; value?: string | null }) =>
    value ? (
      <tr>
        <td style={{ padding: "6px 12px", width: 180, color: C.label, fontWeight: 400, fontSize: 12, verticalAlign: "top" }}>{label}</td>
        <td style={{ padding: "6px 12px", color: C.text, fontSize: 12 }}>{value}</td>
      </tr>
    ) : null;

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ background: C.accent, color: C.white, padding: "5px 12px", fontSize: 12, fontWeight: 600 }}>{title}</div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          {children}
        </tbody>
      </table>
    </div>
  );

  const renderSubPage = (p: any) => {
    switch (subPage) {
      case "Übersicht":
        return (
          <div>
            <Section title="Aktuelle Adresse">
              <Row label="" value={p.typ === "FIRMA" ? p.firmaName : `${p.vorname || ""} ${p.name}`.trim()} />
              <Row label="" value={p.strasse} />
              <Row label="" value={p.plz && p.ort ? `${p.plz} ${p.ort}` : p.ort} />
            </Section>
            {(p.geschaeftsStrasse || p.geschaeftsOrt) && (
              <Section title="Geschäftsadresse">
                <Row label="" value={p.geschaeftsStrasse} />
                <Row label="" value={p.geschaeftsPlz && p.geschaeftsOrt ? `${p.geschaeftsPlz} ${p.geschaeftsOrt}` : p.geschaeftsOrt} />
              </Section>
            )}
            <Section title="Kommunikation">
              {p.telefon && <Row label="" value={`${p.telefon} (Geschäft)`} />}
              {p.telefonMobil && <Row label="" value={`${p.telefonMobil} (Mobile)`} />}
              {p.email && <Row label="" value={`${p.email} (E-Mail)`} />}
              {p.webseite && <Row label="" value={`${p.webseite} (Webseite)`} />}
            </Section>
            <Section title="Rollen">
              <tr><td colSpan={2} style={{ padding: "8px 12px" }}>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {p.rollen.map((r: string) => (
                    <span key={r} style={{ background: (ROLLEN_COLOR[r] || "#666") + "22", color: ROLLEN_COLOR[r] || "#666", padding: "2px 10px", borderRadius: 3, fontSize: 11, fontWeight: 600, border: `1px solid ${ROLLEN_COLOR[r]}44` }}>
                      {ROLLEN_LABEL[r]}
                    </span>
                  ))}
                </div>
              </td></tr>
            </Section>
            {(p.uid || p.iban) && (
              <Section title="Finanzen">
                <Row label="UID / MwSt" value={p.uid} />
                <Row label="IBAN" value={p.iban} />
              </Section>
            )}
          </div>
        );
      case "Persönliche Daten":
        return (
          <Section title="Persönliche Daten">
            <Row label="Typ" value={p.typ === "FIRMA" ? "Firma" : "Privatperson"} />
            <Row label="Name" value={p.name} />
            <Row label="Vorname" value={p.vorname} />
            <Row label="Firmenname" value={p.firmaName} />
            <Row label="Funktion" value={p.funktion} />
            <Row label="Abteilung" value={p.abteilung} />
            <Row label="Geburtsdatum" value={p.geburtsdatum ? new Date(p.geburtsdatum).toLocaleDateString("de-CH") : null} />
            <Row label="Sprache" value={p.sprache} />
            <Row label="Arbeitgeber" value={p.arbeitgeber ? (p.arbeitgeber.firmaName || p.arbeitgeber.name) : null} />
          </Section>
        );
      case "Kommunikation":
        return (
          <Section title="Kommunikation">
            <Row label="Telefon Geschäft" value={p.telefon} />
            <Row label="Mobile" value={p.telefonMobil} />
            <Row label="E-Mail Geschäft" value={p.email} />
            <Row label="Webseite" value={p.webseite} />
            <Row label="Korrespondenzsprache" value={p.sprache} />
          </Section>
        );
      case "Adressen":
        return (
          <div>
            <Section title="Privatadresse">
              <Row label="Strasse" value={p.strasse} />
              <Row label="PLZ" value={p.plz} />
              <Row label="Ort" value={p.ort} />
              <Row label="Land" value={p.land} />
            </Section>
            <Section title="Geschäftsadresse">
              <Row label="Strasse" value={p.geschaeftsStrasse} />
              <Row label="PLZ" value={p.geschaeftsPlz} />
              <Row label="Ort" value={p.geschaeftsOrt} />
            </Section>
          </div>
        );
      case "Finanzielle Angaben":
        return (
          <Section title="Finanzielle Angaben">
            <Row label="UID / MwSt-Nummer" value={p.uid} />
            <Row label="IBAN" value={p.iban} />
          </Section>
        );
      case "Zahlungsverbindungen":
        return (
          <Section title="Zahlungsverbindungen">
            <Row label="IBAN" value={p.iban || "— Keine IBAN hinterlegt"} />
          </Section>
        );
      case "Rollen & Zuordnung":
        return (
          <Section title="Rollen">
            <tr><td colSpan={2} style={{ padding: "10px 12px" }}>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {p.rollen.length > 0 ? p.rollen.map((r: string) => (
                  <span key={r} style={{ background: (ROLLEN_COLOR[r] || "#666") + "22", color: ROLLEN_COLOR[r] || "#666", padding: "4px 14px", borderRadius: 3, fontSize: 12, fontWeight: 600, border: `1px solid ${ROLLEN_COLOR[r]}44` }}>
                    {ROLLEN_LABEL[r]}
                  </span>
                )) : <span style={{ color: "#999", fontSize: 12 }}>Keine Rollen zugewiesen</span>}
              </div>
            </td></tr>
          </Section>
        );
      case "Projekte":
        return (
          <Section title="Verknüpfte Projekte">
            {p.projekte?.length > 0 ? p.projekte.map((pp: any) => (
              <tr key={pp.id}>
                <td style={{ padding: "6px 12px", color: C.accent, fontWeight: 700, fontSize: 12, width: 120 }}>{pp.projekt.nummer}</td>
                <td style={{ padding: "6px 12px", fontSize: 12 }}>{pp.projekt.name} {pp.funktion && <span style={{ color: "#999" }}>· {pp.funktion}</span>}</td>
              </tr>
            )) : <tr><td colSpan={2} style={{ padding: "10px 12px", color: "#999", fontSize: 12 }}>Keine Projekte verknüpft</td></tr>}
          </Section>
        );
      case "Notizen":
        return (
          <Section title="Notizen">
            <tr><td colSpan={2} style={{ padding: "10px 12px", fontSize: 12, color: p.notizen ? C.text : "#999", whiteSpace: "pre-wrap" }}>
              {p.notizen || "Keine Notizen vorhanden"}
            </td></tr>
          </Section>
        );
      default:
        return <div style={{ padding: 20, color: "#999", fontSize: 12 }}>Dieser Bereich ist noch nicht implementiert.</div>;
    }
  };

  const F = (label: string, key: string, type = "text", opts?: any) => (
    <div style={{ marginBottom: 10 }}>
      <label style={{ fontSize: 11, color: "#666", display: "block", marginBottom: 3 }}>{label}</label>
      {type === "textarea" ? (
        <textarea value={form[key] || ""} onChange={e => setForm((f: any) => ({ ...f, [key]: e.target.value }))} rows={3}
          style={{ width: "100%", padding: "5px 8px", border: "1px solid #ccc", borderRadius: 3, fontSize: 12, fontFamily: "inherit", resize: "vertical" }} />
      ) : type === "select" ? (
        <select value={form[key] || ""} onChange={e => setForm((f: any) => ({ ...f, [key]: e.target.value }))}
          style={{ width: "100%", padding: "5px 8px", border: "1px solid #ccc", borderRadius: 3, fontSize: 12, background: "#fff" }}>
          <option value="">— Auswählen —</option>
          {opts?.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input type={type} value={form[key] || ""} onChange={e => setForm((f: any) => ({ ...f, [key]: e.target.value }))}
          style={{ width: "100%", padding: "5px 8px", border: "1px solid #ccc", borderRadius: 3, fontSize: 12 }} />
      )}
    </div>
  );

  const SectionLabel = ({ t }: { t: string }) => (
    <div style={{ background: C.accent, color: C.white, padding: "4px 10px", fontSize: 11, fontWeight: 700, margin: "14px 0 8px", borderRadius: 2 }}>{t}</div>
  );

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden", fontFamily: "Arial, Helvetica, sans-serif", fontSize: 12 }}>

      {selected ? (
        /* ── Detailansicht mit Sub-Nav ─────────────────────────────────────── */
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

          {/* Sub-Sidebar */}
          <div style={{ width: 180, background: C.sidebar, flexShrink: 0, overflowY: "auto", display: "flex", flexDirection: "column" }}>
            {/* Person-Header in Sub-Sidebar */}
            <div style={{ padding: "10px 12px", borderBottom: "1px solid #444", background: "#222" }}>
              <div style={{ fontSize: 10, color: "#888", marginBottom: 2 }}>
                {selected.typ === "FIRMA" ? "Firma" : "Privatperson"} · {selected.id.slice(-6).toUpperCase()}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.white, lineHeight: 1.3 }}>
                {selected.typ === "FIRMA" ? selected.firmaName || selected.name : `${selected.vorname || ""} ${selected.name}`.trim()}
              </div>
              {selected.funktion && <div style={{ fontSize: 10, color: "#aaa", marginTop: 2 }}>{selected.funktion}</div>}
            </div>

            {/* Sub-Nav Items */}
            <nav style={{ flex: 1 }}>
              {SUB_NAV.map(item => (
                <button key={item} onClick={() => setSubPage(item)}
                  style={{
                    display: "block", width: "100%", textAlign: "left",
                    padding: "7px 14px", fontSize: 12, border: "none", cursor: "pointer",
                    background: subPage === item ? C.accent : "transparent",
                    color: subPage === item ? C.white : "#aaa",
                    borderLeft: subPage === item ? "3px solid #66ccee" : "3px solid transparent",
                    fontWeight: subPage === item ? 600 : 400,
                  }}>
                  {item}
                </button>
              ))}
            </nav>

            {/* Zurück-Button */}
            <div style={{ padding: "10px 12px", borderTop: "1px solid #444" }}>
              <button onClick={() => setSelected(null)}
                style={{ width: "100%", padding: "5px 8px", background: "#444", color: "#ccc", border: "none", borderRadius: 3, fontSize: 11, cursor: "pointer" }}>
                ◀ Zurück zur Liste
              </button>
            </div>
          </div>

          {/* Sub-Content */}
          <div style={{ flex: 1, overflow: "auto", background: C.bg }}>

            {/* Sub-Header (Immopac-style blauer Balken) */}
            <div style={{ background: C.accent, color: C.white, padding: "6px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 700, fontSize: 13 }}>
                {selected.typ === "FIRMA" ? selected.firmaName || selected.name : `${selected.vorname || ""} ${selected.name}`.trim()}
                <span style={{ fontWeight: 400, marginLeft: 10, fontSize: 11, opacity: 0.8 }}>{subPage}</span>
              </span>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => openEdit(selected)}
                  style={{ padding: "3px 10px", background: "rgba(255,255,255,0.2)", color: C.white, border: "1px solid rgba(255,255,255,0.4)", borderRadius: 3, fontSize: 11, cursor: "pointer" }}>
                  Bearbeiten
                </button>
                <button onClick={() => handleDelete(selected.id)}
                  style={{ padding: "3px 10px", background: "rgba(255,0,0,0.3)", color: C.white, border: "1px solid rgba(255,0,0,0.4)", borderRadius: 3, fontSize: 11, cursor: "pointer" }}>
                  Löschen
                </button>
              </div>
            </div>

            {/* Sub-Page Content */}
            <div style={{ padding: 14 }}>
              {renderSubPage(selected)}
            </div>
          </div>
        </div>

      ) : (
        /* ── Listenansicht ─────────────────────────────────────────────────── */
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Toolbar */}
          <div style={{ background: C.white, padding: "8px 12px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ background: C.accent, color: C.white, padding: "4px 12px", fontSize: 12, fontWeight: 700, borderRadius: 2 }}>Kontakte</div>
              <span style={{ color: "#999", fontSize: 11 }}>{filtered.length} Einträge</span>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Suchen (F1)..."
                style={{ padding: "4px 10px", border: `1px solid ${C.border}`, borderRadius: 3, fontSize: 12, width: 240 }} />
              <select value={typFilter[0] || ""} onChange={e => setTyp(e.target.value ? [e.target.value] : [])}
                style={{ padding: "4px 8px", border: `1px solid ${C.border}`, borderRadius: 3, fontSize: 12, background: "#fff" }}>
                <option value="">Alle Typen</option>
                <option value="PRIVATPERSON">Privatperson</option>
                <option value="FIRMA">Firma</option>
              </select>
              <button onClick={openNew}
                style={{ padding: "4px 12px", background: C.accent, color: C.white, border: "none", borderRadius: 3, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                + Neu
              </button>
            </div>
          </div>

          {/* Tabelle */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead style={{ position: "sticky", top: 0, zIndex: 2 }}>
                <tr style={{ background: "#e0e0e0", borderBottom: "2px solid #bbb" }}>
                  {["Typ", "Name / Firma", "Funktion", "Ort", "Telefon", "E-Mail", "Rollen"].map(h => (
                    <th key={h} style={{ padding: "6px 10px", textAlign: "left", fontWeight: 700, color: "#444", fontSize: 11, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr key={p.id} onClick={() => { setSelected(p); setSubPage("Übersicht"); }}
                    style={{ background: i % 2 === 0 ? C.rowA : C.rowB, borderBottom: `1px solid #e8e8e8`, cursor: "pointer" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#e8f4ff"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? C.rowA : C.rowB}>
                    <td style={{ padding: "5px 10px" }}>
                      <span style={{ fontSize: 10, background: p.typ === "FIRMA" ? "#dbeafe" : "#dcfce7", color: p.typ === "FIRMA" ? "#1d4ed8" : "#166534", padding: "1px 6px", borderRadius: 2, fontWeight: 600 }}>
                        {p.typ === "FIRMA" ? "Firma" : "Person"}
                      </span>
                    </td>
                    <td style={{ padding: "5px 10px", fontWeight: 600 }}>
                      {p.typ === "FIRMA" ? p.firmaName || p.name : `${p.name}${p.vorname ? ", " + p.vorname : ""}`}
                      {p.arbeitgeber && <span style={{ color: "#999", fontWeight: 400 }}> · {p.arbeitgeber.firmaName || p.arbeitgeber.name}</span>}
                    </td>
                    <td style={{ padding: "5px 10px", color: "#555" }}>{p.funktion || "–"}</td>
                    <td style={{ padding: "5px 10px", color: "#555" }}>{p.ort || p.geschaeftsOrt || "–"}</td>
                    <td style={{ padding: "5px 10px", color: "#555" }}>{p.telefon || p.telefonMobil || "–"}</td>
                    <td style={{ padding: "5px 10px", color: "#555" }}>{p.email || "–"}</td>
                    <td style={{ padding: "5px 10px" }}>
                      <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                        {p.rollen.slice(0, 2).map((r: string) => (
                          <span key={r} style={{ background: (ROLLEN_COLOR[r] || "#666") + "22", color: ROLLEN_COLOR[r] || "#666", padding: "1px 5px", borderRadius: 2, fontSize: 10, fontWeight: 600 }}>
                            {ROLLEN_LABEL[r]}
                          </span>
                        ))}
                        {p.rollen.length > 2 && <span style={{ color: "#999", fontSize: 10 }}>+{p.rollen.length - 2}</span>}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} style={{ padding: 30, textAlign: "center", color: "#999" }}>Keine Einträge gefunden</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Modal ── */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "#00000066", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: C.white, width: 620, maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 8px 40px #00000055", borderRadius: 4 }}>
            <div style={{ background: C.accent, color: C.white, padding: "8px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 700, fontSize: 13 }}>{editPerson ? "Person bearbeiten" : "Neue Person erfassen"}</span>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", color: C.white, fontSize: 18, cursor: "pointer" }}>×</button>
            </div>

            <div style={{ padding: "14px 16px", overflowY: "auto", flex: 1 }}>
              <SectionLabel t="Grunddaten" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: "#666", display: "block", marginBottom: 3 }}>Typ</label>
                  <select value={form.typ} onChange={e => setForm((f: any) => ({ ...f, typ: e.target.value }))}
                    style={{ width: "100%", padding: "5px 8px", border: "1px solid #ccc", borderRadius: 3, fontSize: 12, background: "#fff" }}>
                    <option value="PRIVATPERSON">Privatperson</option>
                    <option value="FIRMA">Firma</option>
                  </select>
                </div>
                {F("Sprache", "sprache", "select", SPRACHEN.map(s => ({ value: s, label: s })))}
              </div>
              {form.typ === "FIRMA" ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {F("Firmenname *", "firmaName")}
                  {F("Kürzel / intern", "name")}
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {F("Name *", "name")}
                  {F("Vorname", "vorname")}
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {F("Funktion", "funktion")}
                {F("Abteilung", "abteilung")}
              </div>
              {form.typ === "PRIVATPERSON" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {F("Geburtsdatum", "geburtsdatum", "date")}
                  <div>
                    <label style={{ fontSize: 11, color: "#666", display: "block", marginBottom: 3 }}>Arbeitgeber</label>
                    <select value={form.arbeitgeberId} onChange={e => setForm((f: any) => ({ ...f, arbeitgeberId: e.target.value }))}
                      style={{ width: "100%", padding: "5px 8px", border: "1px solid #ccc", borderRadius: 3, fontSize: 12, background: "#fff" }}>
                      <option value="">— Kein Arbeitgeber —</option>
                      {firmen.map(f => <option key={f.id} value={f.id}>{f.firmaName || f.name}</option>)}
                    </select>
                  </div>
                </div>
              )}

              <SectionLabel t="Rollen" />
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                {ALLE_ROLLEN.map(r => {
                  const active = form.rollen.includes(r);
                  return (
                    <button key={r} type="button"
                      onClick={() => setForm((f: any) => ({ ...f, rollen: active ? f.rollen.filter((x: string) => x !== r) : [...f.rollen, r] }))}
                      style={{ padding: "3px 10px", borderRadius: 3, border: `1px solid ${ROLLEN_COLOR[r]}`, background: active ? ROLLEN_COLOR[r] : "transparent", color: active ? "#fff" : ROLLEN_COLOR[r], fontWeight: 600, fontSize: 11, cursor: "pointer" }}>
                      {ROLLEN_LABEL[r]}
                    </button>
                  );
                })}
              </div>

              <SectionLabel t="Kontakt" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {F("E-Mail", "email", "email")}
                {F("Telefon Geschäft", "telefon", "tel")}
                {F("Mobile", "telefonMobil", "tel")}
                {F("Webseite", "webseite", "url")}
              </div>

              <SectionLabel t="Privatadresse" />
              {F("Strasse", "strasse")}
              <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 80px", gap: 10 }}>
                {F("PLZ", "plz")} {F("Ort", "ort")} {F("Land", "land")}
              </div>

              <SectionLabel t="Geschäftsadresse" />
              {F("Strasse", "geschaeftsStrasse")}
              <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: 10 }}>
                {F("PLZ", "geschaeftsPlz")} {F("Ort", "geschaeftsOrt")}
              </div>

              <SectionLabel t="Finanzen" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {F("IBAN", "iban")}
                {F("UID / MwSt-Nr.", "uid")}
              </div>

              <SectionLabel t="Notizen" />
              {F("Notizen", "notizen", "textarea")}
            </div>

            <div style={{ padding: "10px 16px", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "flex-end", gap: 8, background: "#f8f8f8" }}>
              <button onClick={() => setShowModal(false)} style={{ padding: "5px 14px", border: `1px solid ${C.border}`, borderRadius: 3, background: C.white, cursor: "pointer", fontSize: 12 }}>Abbrechen</button>
              <button onClick={handleSave} disabled={saving || !form.name}
                style={{ padding: "5px 16px", background: saving ? "#999" : C.accent, color: C.white, border: "none", borderRadius: 3, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                {saving ? "Speichern..." : editPerson ? "Speichern" : "Erstellen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
