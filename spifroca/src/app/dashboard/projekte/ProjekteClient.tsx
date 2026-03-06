"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useProjekt } from "@/lib/projektContext";

const C = { accent: "#0099cc", white: "#ffffff", border: "#cccccc", bg: "#f0f0f0" };

const STATUS_LABEL: Record<string, string> = {
  VORPROJEKT: "Vorprojekt", PLANUNG: "Planung", IN_AUSFUEHRUNG: "In Ausführung",
  ABGESCHLOSSEN: "Abgeschlossen", SISTIERT: "Sistiert",
};
const STATUS_COLOR: Record<string, string> = {
  VORPROJEKT: "#8b5cf6", PLANUNG: "#0099cc", IN_AUSFUEHRUNG: "#22c55e",
  ABGESCHLOSSEN: "#6b7280", SISTIERT: "#f59e0b",
};

const KANTONE = ["AG","AI","AR","BE","BL","BS","FR","GE","GL","GR","JU","LU","NE","NW","OW","SG","SH","SO","SZ","TG","TI","UR","VD","VS","ZG","ZH"];

const CH_PLZ: Record<string, string> = {
  "1000":"Lausanne","1003":"Lausanne","1200":"Genève","1201":"Genève","1700":"Fribourg",
  "1800":"Vevey","1820":"Montreux","1950":"Sion","2000":"Neuchâtel","2500":"Biel/Bienne",
  "3000":"Bern","3001":"Bern","3004":"Bern","3005":"Bern","3006":"Bern","3007":"Bern",
  "3008":"Bern","3010":"Bern","3011":"Bern","3012":"Bern","3600":"Thun","3900":"Brig","3920":"Zermatt",
  "4000":"Basel","4001":"Basel","4051":"Basel","4052":"Basel","4053":"Basel","4054":"Basel",
  "4055":"Basel","4056":"Basel","4057":"Basel","4058":"Basel","4100":"Muttenz",
  "4102":"Binningen","4103":"Bottmingen","4104":"Oberwil BL","4500":"Solothurn",
  "4600":"Olten","4800":"Zofingen","4900":"Langenthal",
  "5000":"Aarau","5001":"Aarau","5004":"Aarau","5200":"Brugg","5210":"Windisch",
  "5242":"Lupfig","5400":"Baden","5401":"Baden","5402":"Baden","5405":"Dättwil AG",
  "5408":"Ennetbaden","5430":"Wettingen","5600":"Lenzburg","5630":"Muri AG",
  "5722":"Gränichen","5734":"Reinach AG",
  "6000":"Luzern","6002":"Luzern","6003":"Luzern","6004":"Luzern","6005":"Luzern",
  "6010":"Kriens","6020":"Emmenbrücke","6300":"Zug","6301":"Zug","6302":"Zug",
  "6330":"Cham","6340":"Baar","6341":"Baar","6343":"Rotkreuz","6370":"Stans",
  "6460":"Altdorf UR","6600":"Locarno","6900":"Lugano","6901":"Lugano",
  "7000":"Chur","7001":"Chur","7270":"Davos","7500":"St. Moritz",
  "8000":"Zürich","8001":"Zürich","8002":"Zürich","8003":"Zürich","8004":"Zürich",
  "8005":"Zürich","8006":"Zürich","8007":"Zürich","8008":"Zürich","8032":"Zürich",
  "8037":"Zürich","8038":"Zürich","8040":"Zürich","8044":"Zürich","8045":"Zürich",
  "8046":"Zürich","8047":"Zürich","8048":"Zürich","8049":"Zürich","8050":"Zürich",
  "8051":"Zürich","8052":"Zürich","8053":"Zürich","8055":"Zürich","8057":"Zürich",
  "8100":"Regensdorf","8105":"Watt","8107":"Buchs ZH","8200":"Schaffhausen",
  "8280":"Kreuzlingen","8300":"Winterthur","8301":"Winterthur","8302":"Winterthur",
  "8303":"Bassersdorf","8304":"Wallisellen","8305":"Dietlikon","8400":"Winterthur",
  "8401":"Winterthur","8404":"Winterthur","8500":"Frauenfeld","8570":"Weinfelden",
  "8580":"Amriswil","8600":"Dübendorf","8603":"Schwerzenbach","8604":"Volketswil",
  "8700":"Küsnacht ZH","8702":"Zollikon","8703":"Erlenbach ZH","8800":"Thalwil",
  "8810":"Horgen","8820":"Wädenswil","8832":"Wollerau","8840":"Einsiedeln",
  "8900":"Uster","8901":"Uster","8902":"Uster","8952":"Schlieren","8953":"Dietikon",
  "8954":"Geroldswil","8956":"Killwangen","8957":"Spreitenbach",
  "9000":"St. Gallen","9001":"St. Gallen","9004":"St. Gallen","9008":"St. Gallen",
  "9010":"St. Gallen","9100":"Herisau","9200":"Gossau SG","9300":"Wittenbach",
  "9400":"Rorschach","9470":"Buchs SG","9500":"Wil SG","9630":"Wattwil",
};

// ── Stabiles Input: kein Fokus-Verlust, nur blur/enter → parent ───────────────
function Field({ name, placeholder = "", type = "text", defaultVal = ""}: {
  name: string; placeholder?: string; type?: string; defaultVal?: string;
}) {
  return (
    <input
      name={name}
      type={type}
      defaultValue={defaultVal}
      placeholder={placeholder}
      style={{
        width: "100%", padding: "4px 8px", border: "1px solid #ccc", borderRadius: 2,
        fontSize: 12, background: "#fff", boxSizing: "border-box" as const, outline: "none"
      }}
      onFocus={e => (e.target as HTMLInputElement).style.border = "1px solid #0099cc"}
      onBlur={e => (e.target as HTMLInputElement).style.border = "1px solid #ccc"}
    />
  );
}

// ── PLZ mit Autocomplete ──────────────────────────────────────────────────────
function PlzOrtField({ defaultPlz, defaultOrt, onOrtSuggested }: {
  defaultPlz: string; defaultOrt: string; onOrtSuggested: (ort: string) => void;
}) {
  const [sugg, setSugg] = useState<{plz:string;ort:string}[]>([]);
  const [show, setShow] = useState(false);
  const plzRef = useRef<HTMLInputElement>(null);
  const ortRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.length >= 2) {
      const matches = Object.entries(CH_PLZ).filter(([p]) => p.startsWith(val)).slice(0, 6).map(([p,o]) => ({plz:p,ort:o}));
      setSugg(matches); setShow(matches.length > 0);
      if (CH_PLZ[val]) { onOrtSuggested(CH_PLZ[val]); if (ortRef.current) ortRef.current.value = CH_PLZ[val]; }
    } else { setShow(false); }
  };

  const selectSug = (item: {plz:string;ort:string}) => {
    if (plzRef.current) plzRef.current.value = item.plz;
    if (ortRef.current) ortRef.current.value = item.ort;
    onOrtSuggested(item.ort);
    setShow(false);
  };

  return (
    <div style={{ display:"flex", gap:6, position:"relative" }}>
      <div style={{ width:90, position:"relative" }}>
        <input ref={plzRef} name="plz" type="text" defaultValue={defaultPlz} placeholder="PLZ"
          onChange={handleChange}
          onBlur={() => setTimeout(() => setShow(false), 150)}
          onFocus={e => (e.target as HTMLInputElement).style.border = "1px solid #0099cc"}
          style={{ width:"100%", padding:"4px 8px", border:"1px solid #ccc", borderRadius:2, fontSize:12, outline:"none", boxSizing:"border-box" as const }}
        />
        {show && (
          <div style={{ position:"absolute", top:"100%", left:0, zIndex:100, background:"#fff", border:"1px solid #ccc", borderRadius:2, boxShadow:"0 4px 12px #00000033", minWidth:220 }}>
            {sugg.map(s => (
              <div key={s.plz} onMouseDown={e => { e.preventDefault(); selectSug(s); }}
                style={{ padding:"5px 10px", cursor:"pointer", fontSize:12, borderBottom:"1px solid #f0f0f0" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background="#e8f4ff"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background="#fff"}>
                <strong>{s.plz}</strong> {s.ort}
              </div>
            ))}
          </div>
        )}
      </div>
      <input ref={ortRef} name="ort" type="text" defaultValue={defaultOrt} placeholder="Ort"
        onFocus={e => (e.target as HTMLInputElement).style.border = "1px solid #0099cc"}
        onBlur={e => (e.target as HTMLInputElement).style.border = "1px solid #ccc"}
        style={{ flex:1, padding:"4px 8px", border:"1px solid #ccc", borderRadius:2, fontSize:12, outline:"none", boxSizing:"border-box" as const }}
      />
    </div>
  );
}


const EMPTY: any = {
  nummer: "", name: "", plz: "", ort: "", kanton: "", land: "CH", sprache: "deutsch",
  projektstart: "", uebergabe: "", eigentümerId: "", gruppe: "", beschreibung: "",
  budgetGesamt: "", status: "VORPROJEKT", projektleiterId: ""
};

interface Props { projekte: any[]; personen: any[]; session: any; }

export function ProjekteClient({ projekte: initial, personen, session }: Props) {
  const [projekte, setProjekte] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [editProjekt, setEdit] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formKey, setFormKey] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const [ortValue, setOrtValue] = useState("");
  const { aktuellesProjekt, setAktuellesProjekt } = useProjekt();

  const [selects, setSelects] = useState({
    kanton: "", land: "CH", sprache: "deutsch", status: "VORPROJEKT",
    eigentümerId: "", projektleiterId: ""
  });
  const setSel = (k: string, v: string) => setSelects(s => ({ ...s, [k]: v }));

  const openNew = () => {
    setEdit(null); setError("");
    setSelects({ kanton: "", land: "CH", sprache: "deutsch", status: "VORPROJEKT", eigentümerId: "", projektleiterId: "" });
    setOrtValue(""); setFormKey(k => k + 1); setShowForm(true);
  };

  const openEdit = (p: any) => {
    setEdit(p); setError("");
    setSelects({
      kanton: p.kanton || "", land: p.land || "CH", sprache: p.sprache || "deutsch",
      status: p.status || "VORPROJEKT", eigentümerId: p.eigentümerId || "", projektleiterId: p.projektleiterId || ""
    });
    setOrtValue(p.ort || ""); setFormKey(k => k + 1); setShowForm(true);
  };

  const readForm = () => {
    if (!formRef.current) return null;
    const fd = new FormData(formRef.current);
    return {
      nummer: (fd.get("nummer") as string || "").trim(),
      name: (fd.get("name") as string || "").trim(),
      plz: (fd.get("plz") as string || "").trim(),
      ort: (fd.get("ort") as string || ortValue).trim(),
      gruppe: (fd.get("gruppe") as string || "").trim(),
      beschreibung: (fd.get("beschreibung") as string || "").trim(),
      budgetGesamt: fd.get("budgetGesamt") as string || "",
      projektstart: fd.get("projektstart") as string || "",
      uebergabe: fd.get("uebergabe") as string || "",
      ...selects,
    };
  };

  const handleSave = async () => {
    const data = readForm();
    if (!data) return;
    if (!data.nummer) { setError("Bitte Projektnummer eingeben."); return; }
    if (!data.name) { setError("Bitte Projektbezeichnung eingeben."); return; }
    setSaving(true); setError("");
    try {
      const payload = {
        ...data,
        verwaltungsbeginn: data.projektstart || null,
        verwaltungsende: data.uebergabe || null,
        budgetGesamt: data.budgetGesamt ? parseFloat(data.budgetGesamt) : null,
        projektleiterId: data.projektleiterId || null,
        eigentümerId: data.eigentümerId || null,
      };
      const url = editProjekt ? `/api/projekte/${editProjekt.id}` : "/api/projekte";
      const method = editProjekt ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) {
        const saved = await res.json();
        if (editProjekt) {
          setProjekte(ps => ps.map(p => p.id === saved.id ? saved : p));
          if (aktuellesProjekt?.id === saved.id) setAktuellesProjekt(saved);
        } else {
          setProjekte(ps => [saved, ...ps]);
          setAktuellesProjekt(saved);
        }
        setShowForm(false);
      } else {
        const err = await res.json().catch(() => ({}));
        setError(err.error || "Fehler beim Speichern.");
      }
    } catch { setError("Netzwerkfehler."); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Projekt wirklich löschen?")) return;
    const res = await fetch(`/api/projekte/${id}`, { method: "DELETE" });
    if (res.ok) {
      setProjekte(ps => ps.filter(p => p.id !== id));
      if (aktuellesProjekt?.id === id) setAktuellesProjekt(projekte.find(p => p.id !== id) || null);
    }
  };

  const FRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <tr style={{ borderBottom: "1px solid #e8e8e8" }}>
      <td style={{ padding: "6px 12px", width: 200, background: "#f0f0f0", fontSize: 12, color: "#444", fontWeight: 500, verticalAlign: "middle", whiteSpace: "nowrap" }}>{label}</td>
      <td style={{ padding: "4px 8px", background: C.white }}>{children}</td>
    </tr>
  );

  const Sel = ({ k, opts }: { k: string; opts: {v:string;l:string}[] }) => (
    <select
      value={(selects as any)[k]}
      onChange={e => setSel(k, e.target.value)}
      style={{ width: "100%", padding: "4px 8px", border: "1px solid #ccc", borderRadius: 2, fontSize: 12, background: C.white }}
    >
      {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  );

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden", fontFamily: "Arial, Helvetica, sans-serif" }}>
      {/* ── Liste ── */}
      <div style={{ width: showForm ? 300 : "100%", flexShrink: 0, display: "flex", flexDirection: "column", borderRight: `1px solid ${C.border}`, background: C.white, overflow: "hidden" }}>
        <div style={{ borderBottom: `1px solid ${C.border}`, padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ background: C.accent, color: C.white, padding: "4px 12px", fontSize: 12, fontWeight: 700, borderRadius: 2 }}>Projekte</div>
            <span style={{ color: "#999", fontSize: 11 }}>{projekte.length} Projekte</span>
          </div>
          <button onClick={openNew} style={{ padding: "4px 12px", background: C.accent, color: C.white, border: "none", borderRadius: 3, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>+ Neues Projekt</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {projekte.map((p, i) => {
            const isActive = aktuellesProjekt?.id === p.id;
            const isEditing = editProjekt?.id === p.id && showForm;
            return (
              <div key={p.id} style={{ padding: "10px 14px", borderBottom: "1px solid #f0f0f0", cursor: "pointer", background: isEditing ? "#e8f4ff" : isActive ? "#f0fdf4" : i%2===0 ? C.white : "#fafafa", borderLeft: isActive ? "3px solid #22c55e" : isEditing ? `3px solid ${C.accent}` : "3px solid transparent" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1, minWidth: 0 }} onClick={() => setAktuellesProjekt(p)}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 2 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: C.accent }}>{p.nummer}</span>
                      <span style={{ fontSize: 10, background: (STATUS_COLOR[p.status]||"#666")+"22", color: STATUS_COLOR[p.status]||"#666", padding: "1px 6px", borderRadius: 2, fontWeight: 600 }}>{STATUS_LABEL[p.status]||p.status}</span>
                      {isActive && <span style={{ fontSize: 10, background: "#dcfce7", color: "#16a34a", padding: "1px 6px", borderRadius: 2, fontWeight: 700 }}>● Aktiv</span>}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#222", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                    {p.ort && <div style={{ fontSize: 11, color: "#888", marginTop: 1 }}>{p.plz} {p.ort}</div>}
                  </div>
                  <div style={{ display: "flex", gap: 4, marginLeft: 8, flexShrink: 0 }}>
                    <button onClick={() => openEdit(p)} style={{ padding: "2px 8px", fontSize: 10, background: "#f0f0f0", border: "1px solid #ddd", borderRadius: 2, cursor: "pointer", color: "#555" }}>✏</button>
                    <button onClick={() => handleDelete(p.id)} style={{ padding: "2px 8px", fontSize: 10, background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 2, cursor: "pointer", color: "#c0392b" }}>✕</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Formular ── */}
      {showForm && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: C.bg }}>
          <div style={{ background: C.accent, color: C.white, padding: "7px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
            <span style={{ fontWeight: 700, fontSize: 13 }}>{editProjekt ? `Projekt bearbeiten — ${editProjekt.nummer}` : "Projekt erfassen"}</span>
            <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", color: C.white, fontSize: 18, cursor: "pointer" }}>×</button>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
            <form key={formKey} ref={formRef} onSubmit={e => e.preventDefault()} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 3, overflow: "hidden", maxWidth: 580 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  {/* ✅ Tab-Reihenfolge: 1→2→3(PLZ)→4(Ort)→5(Kanton)→6(Land)→7(Sprache)→8→9→10→11→12→13→14→15 */}
                  <FRow label="Nummer *"><Field name="nummer" defaultVal={editProjekt?.nummer||""} placeholder="z.B. 2025-001" /></FRow>
                  <FRow label="Bezeichnung *"><Field name="name" defaultVal={editProjekt?.name||""} placeholder="Projektname" /></FRow>
                  <FRow label="PLZ / Ort">
                    <PlzOrtField defaultPlz={editProjekt?.plz||""} defaultOrt={editProjekt?.ort||""} onOrtSuggested={setOrtValue} />
                  </FRow>
                  <FRow label="Kanton">
                    <Sel k="kanton" opts={[{v:"",l:"— Kanton —"},...KANTONE.map(k=>({v:k,l:k}))]} />
                  </FRow>
                  <FRow label="Land">
                    <Sel k="land" opts={[{v:"CH",l:"CH — Schweiz"},{v:"DE",l:"DE — Deutschland"},{v:"AT",l:"AT — Österreich"},{v:"FR",l:"FR — Frankreich"},{v:"IT",l:"IT — Italien"}]} />
                  </FRow>
                  <FRow label="Sprache">
                    <Sel k="sprache" opts={["deutsch","français","italiano","english"].map(s=>({v:s,l:s}))} />
                  </FRow>
                  <FRow label="Projektstart"><Field name="projektstart" type="date" defaultVal={editProjekt?.verwaltungsbeginn?.substring(0,10)||""} /></FRow>
                  <FRow label="Übergabe"><Field name="uebergabe" type="date" defaultVal={editProjekt?.verwaltungsende?.substring(0,10)||""} /></FRow>
                  <FRow label="Eigentümer / Bauherr">
                    <Sel k="eigentümerId" opts={[{v:"",l:"— Auswählen —"},...personen.map((p:any)=>({v:p.id,l:p.typ==="FIRMA"?p.firmaName||p.name:`${p.vorname||""} ${p.name}`.trim()}))]} />
                  </FRow>
                  <FRow label="Status">
                    <Sel k="status" opts={Object.entries(STATUS_LABEL).map(([v,l])=>({v,l}))} />
                  </FRow>
                  <FRow label="Gruppe / Kategorie"><Field name="gruppe" defaultVal={editProjekt?.gruppe||""} placeholder="z.B. Wohnbau, Gewerbe" /></FRow>
                  <FRow label="Budget gesamt (CHF)"><Field name="budgetGesamt" type="number" defaultVal={editProjekt?.budgetGesamt||""} placeholder="0" /></FRow>
                  <FRow label="Projektleiter">
                    <Sel k="projektleiterId" opts={[{v:"",l:"— Auswählen —"},...personen.filter((p:any)=>p.typ==="PRIVATPERSON").map((p:any)=>({v:p.id,l:`${p.vorname||""} ${p.name}`.trim()}))} />
                  </FRow>
                  <FRow label="Beschreibung">
                    <textarea
                      name="beschreibung"
                      defaultValue={editProjekt?.beschreibung||""}
                      rows={3}
                      style={{ width: "100%", padding: "4px 8px", border: "1px solid #ccc", borderRadius: 2, fontSize: 12, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" as const, outline: "none" }}
                      onFocus={e => (e.target as HTMLTextAreaElement).style.border = "1px solid #0099cc"}
                      onBlur={e => (e.target as HTMLTextAreaElement).style.border = "1px solid #ccc"}
                    />
                  </FRow>
                </tbody>
              </table>
            </form>
          </div>
          {/* Footer */}
          <div style={{ padding: "10px 16px", borderTop: `1px solid ${C.border}`, background: C.white, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
            <div>{error && <span style={{ fontSize: 12, color: "#c0392b", fontWeight: 600 }}>⚠ {error}</span>}</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShowForm(false)} style={{ padding: "5px 14px", border: `1px solid ${C.border}`, borderRadius: 3, background: C.white, cursor: "pointer", fontSize: 12 }}>Abbrechen</button>
              <button onClick={handleSave} disabled={saving} style={{ padding: "6px 24px", background: saving ? "#999" : C.accent, color: C.white, border: "none", borderRadius: 3, fontWeight: 700, fontSize: 13, cursor: saving ? "not-allowed" : "pointer" }}>
                {saving ? "Wird gespeichert..." : "Speichern"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
