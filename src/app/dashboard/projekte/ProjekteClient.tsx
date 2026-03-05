"use client";
import { useState } from "react";
import { useProjekt } from "@/lib/projektContext";

const C = { accent: "#0099cc", white: "#ffffff", border: "#cccccc", bg: "#f0f0f0", sidebar: "#2d2d2d" };

const STATUS_LABEL: Record<string, string> = {
  VORPROJEKT: "Vorprojekt", PLANUNG: "Planung", IN_AUSFUEHRUNG: "In Ausführung",
  ABGESCHLOSSEN: "Abgeschlossen", SISTIERT: "Sistiert",
};
const STATUS_COLOR: Record<string, string> = {
  VORPROJEKT: "#8b5cf6", PLANUNG: "#0099cc", IN_AUSFUEHRUNG: "#22c55e",
  ABGESCHLOSSEN: "#6b7280", SISTIERT: "#f59e0b",
};
const KANTONE = ["AG","AI","AR","BE","BL","BS","FR","GE","GL","GR","JU","LU","NE","NW","OW","SG","SH","SO","SZ","TG","TI","UR","VD","VS","ZG","ZH"];
const SPRACHEN = ["deutsch","français","italiano","english"];

const EMPTY_FORM: any = {
  nummer: "", name: "", plz: "", ort: "", kanton: "", land: "CH", sprache: "deutsch",
  verwaltungsbeginn: "", verwaltungsende: "",
  eigentümerId: "", meldungenDritte: false,
  gruppe: "", beschreibung: "", budgetGesamt: "",
  status: "VORPROJEKT", projektleiterId: "",
};

interface Props { projekte: any[]; personen: any[]; session: any; }

export function ProjekteClient({ projekte: initial, personen, session }: Props) {
  const [projekte, setProjekte]   = useState(initial);
  const [showForm, setShowForm]   = useState(false);
  const [editProjekt, setEdit]    = useState<any>(null);
  const [form, setForm]           = useState<any>(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const { aktuellesProjekt, setAktuellesProjekt } = useProjekt();

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const openNew  = () => { setEdit(null); setForm(EMPTY_FORM); setShowForm(true); };
  const openEdit = (p: any) => {
    setEdit(p);
    setForm({
      ...EMPTY_FORM, ...p,
      verwaltungsbeginn: p.verwaltungsbeginn ? p.verwaltungsbeginn.substring(0, 10) : "",
      verwaltungsende:   p.verwaltungsende   ? p.verwaltungsende.substring(0, 10)   : "",
      budgetGesamt: p.budgetGesamt || "",
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.nummer || !form.name) return;
    setSaving(true);
    try {
      const url    = editProjekt ? `/api/projekte/${editProjekt.id}` : "/api/projekte";
      const method = editProjekt ? "PUT" : "POST";
      const res    = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (res.ok) {
        const saved = await res.json();
        if (editProjekt) setProjekte(ps => ps.map(p => p.id === saved.id ? saved : p));
        else { setProjekte(ps => [saved, ...ps]); setAktuellesProjekt(saved); }
        setShowForm(false);
      }
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Projekt wirklich löschen?")) return;
    await fetch(`/api/projekte/${id}`, { method: "DELETE" });
    setProjekte(ps => ps.filter(p => p.id !== id));
    if (aktuellesProjekt?.id === id) setAktuellesProjekt(projekte.find(p => p.id !== id) || null);
  };

  // ── Formular-Zeile ─────────────────────────────────────────────────────────
  const FRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <tr style={{ borderBottom: "1px solid #e8e8e8" }}>
      <td style={{ padding: "6px 12px", width: 220, background: "#f0f0f0", fontSize: 12, color: "#444", fontWeight: 500, verticalAlign: "middle" }}>{label}</td>
      <td style={{ padding: "4px 8px", background: C.white }}>{children}</td>
    </tr>
  );

  const Input = ({ k, type = "text", placeholder = "" }: { k: string; type?: string; placeholder?: string }) => (
    <input type={type} value={form[k] || ""} onChange={e => set(k, e.target.value)} placeholder={placeholder}
      style={{ width: "100%", padding: "4px 8px", border: "1px solid #ccc", borderRadius: 2, fontSize: 12, background: C.white, boxSizing: "border-box" }}
      onFocus={e => (e.target as HTMLInputElement).style.border = "1px solid #0099cc"}
      onBlur={e => (e.target as HTMLInputElement).style.border = "1px solid #ccc"} />
  );

  const Select = ({ k, opts }: { k: string; opts: { v: string; l: string }[] }) => (
    <select value={form[k] || ""} onChange={e => set(k, e.target.value)}
      style={{ width: "100%", padding: "4px 8px", border: "1px solid #ccc", borderRadius: 2, fontSize: 12, background: C.white }}>
      <option value="">— Auswählen —</option>
      {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  );

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden", fontFamily: "Arial, Helvetica, sans-serif" }}>

      {/* ── Linke Projektliste ── */}
      <div style={{ width: showForm ? 320 : "100%", flexShrink: 0, display: "flex", flexDirection: "column", borderRight: `1px solid ${C.border}`, background: C.white, overflow: "hidden", transition: "width 0.15s" }}>

        {/* Header */}
        <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ background: C.accent, color: C.white, padding: "4px 12px", fontSize: 12, fontWeight: 700, borderRadius: 2 }}>Projekte</div>
            <span style={{ color: "#999", fontSize: 11 }}>{projekte.length} Projekte</span>
          </div>
          <button onClick={openNew}
            style={{ padding: "4px 12px", background: C.accent, color: C.white, border: "none", borderRadius: 3, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            + Neues Projekt
          </button>
        </div>

        {/* Liste */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {projekte.map((p, i) => {
            const isActive  = aktuellesProjekt?.id === p.id;
            const isEditing = editProjekt?.id === p.id && showForm;
            return (
              <div key={p.id}
                style={{ padding: "10px 14px", borderBottom: `1px solid #f0f0f0`, cursor: "pointer", background: isEditing ? "#e8f4ff" : isActive ? "#f0fdf4" : i % 2 === 0 ? C.white : "#fafafa", borderLeft: isActive ? `3px solid #22c55e` : isEditing ? `3px solid ${C.accent}` : "3px solid transparent" }}
                onMouseEnter={e => { if (!isActive && !isEditing) (e.currentTarget as HTMLElement).style.background = "#f5f5f5"; }}
                onMouseLeave={e => { if (!isActive && !isEditing) (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? C.white : "#fafafa"; }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1, minWidth: 0 }} onClick={() => setAktuellesProjekt(p)}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 2 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: C.accent }}>{p.nummer}</span>
                      <span style={{ fontSize: 10, background: (STATUS_COLOR[p.status] || "#666") + "22", color: STATUS_COLOR[p.status] || "#666", padding: "1px 6px", borderRadius: 2, fontWeight: 600 }}>
                        {STATUS_LABEL[p.status] || p.status}
                      </span>
                      {isActive && <span style={{ fontSize: 10, background: "#dcfce7", color: "#16a34a", padding: "1px 6px", borderRadius: 2, fontWeight: 700 }}>● Aktiv</span>}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#222", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                    {p.ort && <div style={{ fontSize: 11, color: "#888", marginTop: 1 }}>{p.plz} {p.ort}</div>}
                  </div>
                  <div style={{ display: "flex", gap: 4, marginLeft: 8, flexShrink: 0 }}>
                    <button onClick={() => openEdit(p)}
                      style={{ padding: "2px 8px", fontSize: 10, background: "#f0f0f0", border: "1px solid #ddd", borderRadius: 2, cursor: "pointer", color: "#555" }}>
                      ✏
                    </button>
                    <button onClick={() => handleDelete(p.id)}
                      style={{ padding: "2px 8px", fontSize: 10, background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 2, cursor: "pointer", color: "#c0392b" }}>
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Rechts: Projekt erfassen / bearbeiten ── */}
      {showForm && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: C.bg }}>

          {/* Header (Immopac-style) */}
          <div style={{ background: C.accent, color: C.white, padding: "7px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
            <span style={{ fontWeight: 700, fontSize: 13 }}>{editProjekt ? `Projekt bearbeiten — ${editProjekt.nummer}` : "Projekt erfassen"}</span>
            <button onClick={() => setShowForm(false)}
              style={{ background: "none", border: "none", color: C.white, fontSize: 18, cursor: "pointer", lineHeight: 1 }}>×</button>
          </div>

          {/* Formular */}
          <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 3, overflow: "hidden", maxWidth: 620 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <FRow label="Nummer *"><Input k="nummer" placeholder="z.B. 2025-001" /></FRow>
                  <FRow label="Bezeichnung *"><Input k="name" placeholder="Projektname" /></FRow>
                  <FRow label="PLZ"><Input k="plz" /></FRow>
                  <FRow label="Ort"><Input k="ort" /></FRow>
                  <FRow label="Kanton">
                    <select value={form.kanton || ""} onChange={e => set("kanton", e.target.value)}
                      style={{ width: "100%", padding: "4px 8px", border: "1px solid #ccc", borderRadius: 2, fontSize: 12, background: C.white }}>
                      <option value="">Code oder Bezeichnung</option>
                      {KANTONE.map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </FRow>
                  <FRow label="Land">
                    <select value={form.land || ""} onChange={e => set("land", e.target.value)}
                      style={{ width: "100%", padding: "4px 8px", border: "1px solid #ccc", borderRadius: 2, fontSize: 12, background: C.white }}>
                      <option value="CH">CH — Schweiz</option>
                      <option value="DE">DE — Deutschland</option>
                      <option value="AT">AT — Österreich</option>
                      <option value="FR">FR — Frankreich</option>
                      <option value="IT">IT — Italien</option>
                    </select>
                  </FRow>
                  <FRow label="Sprache">
                    <select value={form.sprache || "deutsch"} onChange={e => set("sprache", e.target.value)}
                      style={{ width: "100%", padding: "4px 8px", border: "1px solid #ccc", borderRadius: 2, fontSize: 12, background: C.white }}>
                      {SPRACHEN.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </FRow>
                  <FRow label="Verwaltungsbeginn"><Input k="verwaltungsbeginn" type="date" /></FRow>
                  <FRow label="Verwaltungsende"><Input k="verwaltungsende" type="date" /></FRow>
                  <FRow label="Eigentümer / Bauherr">
                    <select value={form.eigentümerId || ""} onChange={e => set("eigentümerId", e.target.value)}
                      style={{ width: "100%", padding: "4px 8px", border: "1px solid #ccc", borderRadius: 2, fontSize: 12, background: C.white }}>
                      <option value="">Referenz oder Name</option>
                      {personen.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.typ === "FIRMA" ? p.firmaName || p.name : `${p.vorname || ""} ${p.name}`.trim()}
                        </option>
                      ))}
                    </select>
                  </FRow>
                  <FRow label="Status">
                    <Select k="status" opts={Object.entries(STATUS_LABEL).map(([v, l]) => ({ v, l }))} />
                  </FRow>
                  <FRow label="Gruppe / Kategorie"><Input k="gruppe" placeholder="z.B. Wohnbau, Gewerbe" /></FRow>
                  <FRow label="Budget gesamt (CHF)"><Input k="budgetGesamt" type="number" placeholder="0" /></FRow>
                  <FRow label="Projektleiter">
                    <select value={form.projektleiterId || ""} onChange={e => set("projektleiterId", e.target.value)}
                      style={{ width: "100%", padding: "4px 8px", border: "1px solid #ccc", borderRadius: 2, fontSize: 12, background: C.white }}>
                      <option value="">— Auswählen —</option>
                      {personen.filter(p => p.typ === "PRIVATPERSON").map(p => (
                        <option key={p.id} value={p.id}>{p.vorname || ""} {p.name}</option>
                      ))}
                    </select>
                  </FRow>
                  <FRow label="Meldungen an Dritte">
                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
                      <button type="button" onClick={() => set("meldungenDritte", !form.meldungenDritte)}
                        style={{ width: 44, height: 22, borderRadius: 11, border: "none", cursor: "pointer", background: form.meldungenDritte ? "#22c55e" : "#ccc", position: "relative", transition: "background 0.2s" }}>
                        <span style={{ position: "absolute", top: 2, left: form.meldungenDritte ? 22 : 2, width: 18, height: 18, borderRadius: "50%", background: C.white, transition: "left 0.2s" }} />
                      </button>
                      <span style={{ fontSize: 12, color: "#666" }}>{form.meldungenDritte ? "Ja" : "Nein"}</span>
                    </div>
                  </FRow>
                  <FRow label="Beschreibung">
                    <textarea value={form.beschreibung || ""} onChange={e => set("beschreibung", e.target.value)} rows={3}
                      style={{ width: "100%", padding: "4px 8px", border: "1px solid #ccc", borderRadius: 2, fontSize: 12, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
                  </FRow>
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer mit Speichern (Immopac-style: unten rechts) */}
          <div style={{ padding: "10px 16px", borderTop: `1px solid ${C.border}`, background: C.white, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
            <button onClick={() => setShowForm(false)}
              style={{ padding: "5px 14px", border: `1px solid ${C.border}`, borderRadius: 3, background: C.white, cursor: "pointer", fontSize: 12 }}>
              Abbrechen
            </button>
            <button onClick={handleSave} disabled={saving || !form.nummer || !form.name}
              style={{ padding: "6px 20px", background: saving ? "#999" : C.accent, color: C.white, border: "none", borderRadius: 3, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              {saving ? "Wird gespeichert..." : "Speichern"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
