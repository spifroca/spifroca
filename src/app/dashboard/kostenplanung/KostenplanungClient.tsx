"use client";
import { useState, useEffect, useCallback } from "react";

const C = {
  topbar:  "#1a1a1a",
  sidebar: "#2d2d2d",
  accent:  "#0099cc",
  bg:      "#f0f0f0",
  white:   "#ffffff",
  border:  "#cccccc",
  rowA:    "#ffffff",
  rowB:    "#f7f7f7",
};

const SUBMODULE = ["Machbarkeit", "Grobkostenschätzung", "Kostenschätzung eBKP-H", "Kostenvoranschlag BKP", "Baukosten Kontrolle"];

const fmt = (v: number) =>
  v === 0 ? "–" : new Intl.NumberFormat("de-CH", { style: "currency", currency: "CHF", maximumFractionDigits: 0 }).format(v);
const fmtN = (v: number) =>
  v === 0 ? "–" : new Intl.NumberFormat("de-CH", { maximumFractionDigits: 2 }).format(v);

const EMPTY: any = {
  grundstueckM2: 0, grundstueckPreisM2: 0, grundstueckNebenkosten: 2,
  vorbereitungProzent: 3,
  untergrundM3: 0, untergrundPreisM3: 0,
  hochbauM3: 0, hochbauPreisM3: 0,
  innenausbauBetrag: 0,
  umgebungM2: 0, umgebungPreisM2: 0,
  baunebenkostenProzent: 8,
  bgfM2: 0, bri: 0,
  mwstSatz: 8.1,
  notizen: "",
};

function calc(d: any) {
  const grundstueck   = (d.grundstueckM2 || 0) * (d.grundstueckPreisM2 || 0);
  const grundNebenk   = grundstueck * ((d.grundstueckNebenkosten || 0) / 100);
  const pos00         = grundstueck + grundNebenk;

  const sumOhneVorb   = pos00;
  const pos01         = sumOhneVorb * ((d.vorbereitungProzent || 0) / 100);

  const untergrund    = (d.untergrundM3 || 0) * (d.untergrundPreisM3 || 0);
  const hochbau       = (d.hochbauM3 || 0) * (d.hochbauPreisM3 || 0);
  const pos02         = untergrund + hochbau;

  const pos03         = d.innenausbauBetrag || 0;
  const pos04         = (d.umgebungM2 || 0) * (d.umgebungPreisM2 || 0);

  const sum0004       = pos00 + pos01 + pos02 + pos03 + pos04;
  const pos05         = sum0004 * ((d.baunebenkostenProzent || 0) / 100);

  const total         = sum0004 + pos05;
  const mwstBetrag    = (d.mwstSatz || 0) > 0 ? total * ((d.mwstSatz || 0) / 100) : 0;
  const totalMwst     = total + mwstBetrag;

  const bgf           = d.bgfM2 || 0;
  const bri           = d.bri || 0;
  const chfM2         = bgf > 0 ? totalMwst / bgf : 0;
  const chfM3         = bri > 0 ? totalMwst / bri : 0;

  return { grundstueck, grundNebenk, pos00, pos01, untergrund, hochbau, pos02, pos03, pos04, sum0004, pos05, total, mwstBetrag, totalMwst, chfM2, chfM3 };
}

interface Props { projekte: any[]; }

export function KostenplanungClient({ projekte }: Props) {
  const [sub, setSub]               = useState("Machbarkeit");
  const [projektId, setProjektId]   = useState(projekte[0]?.id || "");
  const [data, setData]             = useState<any>(EMPTY);
  const [saved, setSaved]           = useState(false);
  const [saving, setSaving]         = useState(false);
  const [loading, setLoading]       = useState(false);

  const projekt = projekte.find(p => p.id === projektId);
  const r       = calc(data);

  // Daten laden wenn Projekt wechselt
  useEffect(() => {
    if (!projektId) return;
    setLoading(true);
    fetch(`/api/machbarkeit?projektId=${projektId}`)
      .then(res => res.json())
      .then(d => { setData(d ? { ...EMPTY, ...d } : { ...EMPTY }); })
      .finally(() => setLoading(false));
  }, [projektId]);

  const set = (key: string, val: any) => {
    setSaved(false);
    setData((d: any) => ({ ...d, [key]: val === "" ? 0 : Number(val) }));
  };
  const setStr = (key: string, val: string) => { setSaved(false); setData((d: any) => ({ ...d, [key]: val })); };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/machbarkeit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, projektId }),
      });
      setSaved(true);
    } finally { setSaving(false); }
  };

  // Eingabefeld
  const N = ({ k, unit, width = 120, dec = 0 }: { k: string; unit?: string; width?: number; dec?: number }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <input
        type="number"
        value={data[k] === 0 ? "" : data[k]}
        onChange={e => set(k, e.target.value)}
        placeholder="0"
        style={{ width, padding: "4px 6px", border: "1px solid #ccc", borderRadius: 2, fontSize: 12, textAlign: "right", background: "#fffef0" }}
      />
      {unit && <span style={{ fontSize: 11, color: "#888", whiteSpace: "nowrap" }}>{unit}</span>}
    </div>
  );

  // Ergebnisfeld (read-only)
  const R = ({ val, highlight = false }: { val: number; highlight?: boolean }) => (
    <div style={{
      textAlign: "right", fontWeight: highlight ? 700 : 500,
      fontSize: highlight ? 13 : 12,
      color: highlight ? C.accent : "#333",
      padding: "4px 6px", background: highlight ? "#e8f4ff" : "transparent",
      borderRadius: 2, minWidth: 120,
    }}>
      {fmt(val)}
    </div>
  );

  // Tabellenzeile
  const Row = ({ pos, label, children, result, highlight = false, indent = false }: any) => (
    <tr style={{ borderBottom: "1px solid #ebebeb" }}>
      <td style={{ padding: "7px 10px", width: 40, color: "#888", fontSize: 12, fontWeight: 600 }}>{pos}</td>
      <td style={{ padding: "7px 10px", fontSize: 12, color: "#333", paddingLeft: indent ? 28 : 10 }}>{label}</td>
      <td style={{ padding: "7px 10px" }}>{children}</td>
      <td style={{ padding: "7px 14px", textAlign: "right" }}><R val={result} highlight={highlight} /></td>
    </tr>
  );

  // Subtitel-Zeile
  const Sub = ({ pos, label, result, bg = "#f0f0f0" }: any) => (
    <tr style={{ background: bg, borderBottom: "1px solid #ddd" }}>
      <td style={{ padding: "6px 10px", fontSize: 12, fontWeight: 700, color: "#444" }}>{pos}</td>
      <td colSpan={2} style={{ padding: "6px 10px", fontSize: 12, fontWeight: 700, color: "#333" }}>{label}</td>
      <td style={{ padding: "6px 14px", textAlign: "right", fontWeight: 700, fontSize: 12, color: "#333" }}>{fmt(result)}</td>
    </tr>
  );

  const renderMachbarkeit = () => (
    <div style={{ display: "flex", gap: 14, padding: 14, alignItems: "flex-start" }}>

      {/* ── Linke Spalte: Eingabetabelle ── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 3, overflow: "hidden" }}>

          {/* Tabellenkopf */}
          <div style={{ background: C.accent, color: C.white, padding: "7px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 700, fontSize: 13 }}>Machbarkeit — {projekt?.nummer} {projekt?.name}</span>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 11, opacity: 0.8 }}>MwSt:</span>
              <select value={data.mwstSatz} onChange={e => set("mwstSatz", e.target.value)}
                style={{ fontSize: 11, padding: "2px 6px", borderRadius: 2, border: "none", background: "rgba(255,255,255,0.2)", color: C.white }}>
                <option value={8.1}>8.1% (Normal)</option>
                <option value={3.8}>3.8% (Hotel)</option>
                <option value={0}>Befreit</option>
              </select>
            </div>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#e8e8e8", borderBottom: "2px solid #ccc" }}>
                <th style={{ padding: "6px 10px", width: 40, textAlign: "left", fontSize: 11, color: "#555" }}>Pos.</th>
                <th style={{ padding: "6px 10px", textAlign: "left", fontSize: 11, color: "#555" }}>Bezeichnung</th>
                <th style={{ padding: "6px 10px", textAlign: "left", fontSize: 11, color: "#555" }}>Eingabe</th>
                <th style={{ padding: "6px 14px", textAlign: "right", fontSize: 11, color: "#555", width: 160 }}>Betrag CHF</th>
              </tr>
            </thead>
            <tbody>

              {/* 00 Grundstück */}
              <Sub pos="00" label="Grundstück" result={r.pos00} bg="#f5f5f5" />
              <Row pos="" label="Grundstücksfläche" indent result={r.grundstueck}>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <N k="grundstueckM2" unit="m²" width={90} />
                  <span style={{ color: "#bbb" }}>×</span>
                  <N k="grundstueckPreisM2" unit="CHF/m²" width={90} />
                </div>
              </Row>
              <Row pos="" label="Nebenkosten Kauf" indent result={r.grundNebenk}>
                <N k="grundstueckNebenkosten" unit="%" width={80} />
              </Row>

              {/* 01 Vorbereitungsarbeiten */}
              <Sub pos="01" label="Vorbereitungsarbeiten" result={r.pos01} bg="#f5f5f5" />
              <Row pos="" label="Anteil von Pos. 00" indent result={r.pos01}>
                <N k="vorbereitungProzent" unit="%" width={80} />
              </Row>

              {/* 02 Gebäude */}
              <Sub pos="02" label="Gebäude" result={r.pos02} bg="#f5f5f5" />
              <Row pos="02.1" label="Untergrund / UG" indent result={r.untergrund}>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <N k="untergrundM3" unit="m³" width={90} />
                  <span style={{ color: "#bbb" }}>×</span>
                  <N k="untergrundPreisM3" unit="CHF/m³" width={90} />
                </div>
              </Row>
              <Row pos="02.2" label="Hochbau / OG" indent result={r.hochbau}>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <N k="hochbauM3" unit="m³" width={90} />
                  <span style={{ color: "#bbb" }}>×</span>
                  <N k="hochbauPreisM3" unit="CHF/m³" width={90} />
                </div>
              </Row>

              {/* 03 Innenausbau */}
              <Sub pos="03" label="Innenausbau" result={r.pos03} bg="#f5f5f5" />
              <Row pos="" label="Pauschalbetrag" indent result={r.pos03}>
                <N k="innenausbauBetrag" unit="CHF" width={120} />
              </Row>

              {/* 04 Umgebung */}
              <Sub pos="04" label="Umgebung" result={r.pos04} bg="#f5f5f5" />
              <Row pos="" label="Umgebungsfläche" indent result={r.pos04}>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <N k="umgebungM2" unit="m²" width={90} />
                  <span style={{ color: "#bbb" }}>×</span>
                  <N k="umgebungPreisM2" unit="CHF/m²" width={90} />
                </div>
              </Row>

              {/* Zwischensumme 00–04 */}
              <tr style={{ background: "#e8f4ff", borderTop: "2px solid #0099cc33", borderBottom: "1px solid #ccc" }}>
                <td colSpan={3} style={{ padding: "7px 10px", fontWeight: 700, fontSize: 12, color: C.accent }}>Zwischensumme 00–04</td>
                <td style={{ padding: "7px 14px", textAlign: "right", fontWeight: 700, fontSize: 12, color: C.accent }}>{fmt(r.sum0004)}</td>
              </tr>

              {/* 05 Baunebenkosten */}
              <Sub pos="05" label="Baunebenkosten" result={r.pos05} bg="#f5f5f5" />
              <Row pos="" label="Anteil von Summe 00–04" indent result={r.pos05}>
                <N k="baunebenkostenProzent" unit="%" width={80} />
              </Row>

              {/* Total exkl. MwSt */}
              <tr style={{ background: "#e0e0e0", borderTop: "2px solid #bbb" }}>
                <td colSpan={3} style={{ padding: "8px 10px", fontWeight: 700, fontSize: 13, color: "#222" }}>Total exkl. MwSt</td>
                <td style={{ padding: "8px 14px", textAlign: "right", fontWeight: 700, fontSize: 13 }}>{fmt(r.total)}</td>
              </tr>

              {/* MwSt */}
              {data.mwstSatz > 0 && (
                <tr style={{ borderBottom: "1px solid #e0e0e0" }}>
                  <td colSpan={3} style={{ padding: "6px 10px", fontSize: 12, color: "#666" }}>MwSt {data.mwstSatz}%</td>
                  <td style={{ padding: "6px 14px", textAlign: "right", fontSize: 12, color: "#666" }}>{fmt(r.mwstBetrag)}</td>
                </tr>
              )}

              {/* Total inkl. MwSt */}
              <tr style={{ background: C.accent }}>
                <td colSpan={3} style={{ padding: "9px 10px", fontWeight: 700, fontSize: 14, color: C.white }}>Total inkl. MwSt</td>
                <td style={{ padding: "9px 14px", textAlign: "right", fontWeight: 700, fontSize: 14, color: C.white }}>{fmt(r.totalMwst)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Notizen */}
        <div style={{ marginTop: 10, background: C.white, border: `1px solid ${C.border}`, borderRadius: 3, overflow: "hidden" }}>
          <div style={{ background: "#e0e0e0", padding: "5px 10px", fontSize: 11, fontWeight: 700, color: "#555" }}>NOTIZEN</div>
          <textarea value={data.notizen || ""} onChange={e => setStr("notizen", e.target.value)}
            rows={3} placeholder="Anmerkungen zur Machbarkeit..."
            style={{ width: "100%", padding: "8px 10px", border: "none", fontSize: 12, fontFamily: "inherit", resize: "vertical", outline: "none", boxSizing: "border-box" }} />
        </div>
      </div>

      {/* ── Rechte Spalte: Kennzahlen ── */}
      <div style={{ width: 240, flexShrink: 0, display: "flex", flexDirection: "column", gap: 10 }}>

        {/* Kennzahlen Eingabe */}
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 3, overflow: "hidden" }}>
          <div style={{ background: "#555", color: C.white, padding: "6px 10px", fontSize: 11, fontWeight: 700 }}>KENNZAHLEN EINGABE</div>
          <div style={{ padding: "10px" }}>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: "#666", marginBottom: 3 }}>Bruttogeschossfläche BGF</div>
              <N k="bgfM2" unit="m²" width={120} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#666", marginBottom: 3 }}>Bruttorauminhalt BRI</div>
              <N k="bri" unit="m³" width={120} />
            </div>
          </div>
        </div>

        {/* Kennzahlen Auswertung */}
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 3, overflow: "hidden" }}>
          <div style={{ background: C.accent, color: C.white, padding: "6px 10px", fontSize: 11, fontWeight: 700 }}>KENNZAHLEN</div>
          {[
            { label: "Total exkl. MwSt",  val: fmt(r.total),    bold: false },
            { label: "MwSt Betrag",        val: fmt(r.mwstBetrag), bold: false },
            { label: "Total inkl. MwSt",   val: fmt(r.totalMwst), bold: true },
            { label: "–", val: "", bold: false },
            { label: "CHF/m² BGF",         val: r.chfM2 > 0 ? fmtN(r.chfM2) + " CHF" : "–", bold: false },
            { label: "CHF/m³ BRI",         val: r.chfM3 > 0 ? fmtN(r.chfM3) + " CHF" : "–", bold: false },
          ].map((row, i) =>
            row.label === "–" ? (
              <div key={i} style={{ borderTop: "1px solid #eee", margin: "0" }} />
            ) : (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "7px 10px", borderBottom: "1px solid #f0f0f0", background: row.bold ? "#e8f4ff" : "transparent" }}>
                <span style={{ fontSize: 11, color: "#666" }}>{row.label}</span>
                <span style={{ fontSize: 12, fontWeight: row.bold ? 700 : 500, color: row.bold ? C.accent : "#333" }}>{row.val}</span>
              </div>
            )
          )}
        </div>

        {/* Kostenverteilung */}
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 3, overflow: "hidden" }}>
          <div style={{ background: "#555", color: C.white, padding: "6px 10px", fontSize: 11, fontWeight: 700 }}>KOSTENVERTEILUNG</div>
          {[
            { pos: "00", label: "Grundstück",           val: r.pos00 },
            { pos: "01", label: "Vorbereitung",          val: r.pos01 },
            { pos: "02", label: "Gebäude",               val: r.pos02 },
            { pos: "03", label: "Innenausbau",           val: r.pos03 },
            { pos: "04", label: "Umgebung",              val: r.pos04 },
            { pos: "05", label: "Baunebenkosten",        val: r.pos05 },
          ].map(row => {
            const pct = r.total > 0 ? (row.val / r.total) * 100 : 0;
            return (
              <div key={row.pos} style={{ padding: "5px 10px", borderBottom: "1px solid #f0f0f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 11, color: "#555" }}><strong>{row.pos}</strong> {row.label}</span>
                  <span style={{ fontSize: 11, color: "#888" }}>{pct.toFixed(1)}%</span>
                </div>
                <div style={{ height: 6, background: "#e8e8e8", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", background: C.accent, borderRadius: 3 }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Speichern */}
        <button onClick={handleSave} disabled={saving}
          style={{ padding: "10px", background: saved ? "#22c55e" : C.accent, color: C.white, border: "none", borderRadius: 3, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          {saving ? "Wird gespeichert..." : saved ? "✓ Gespeichert" : "Speichern"}
        </button>
      </div>
    </div>
  );

  const renderPlaceholder = (name: string) => (
    <div style={{ padding: 40, textAlign: "center" }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>🚧</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: "#555", marginBottom: 6 }}>{name}</div>
      <div style={{ fontSize: 12, color: "#999" }}>Dieses Modul wird in einem nächsten Schritt implementiert.</div>
    </div>
  );

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden", fontFamily: "Arial, Helvetica, sans-serif" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* ── Header ── */}
        <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: "8px 12px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <div style={{ background: C.accent, color: C.white, padding: "4px 12px", fontSize: 12, fontWeight: 700, borderRadius: 2 }}>Kostenplanung</div>
          <select value={projektId} onChange={e => setProjektId(e.target.value)}
            style={{ padding: "4px 8px", border: `1px solid ${C.border}`, borderRadius: 2, fontSize: 12, background: "#fff", minWidth: 280 }}>
            {projekte.map(p => (
              <option key={p.id} value={p.id}>{p.nummer} · {p.name}</option>
            ))}
          </select>
          {loading && <span style={{ fontSize: 11, color: "#999" }}>Lädt...</span>}
        </div>

        {/* ── Sub-Navigation ── */}
        <div style={{ background: "#e8e8e8", borderBottom: `1px solid ${C.border}`, display: "flex", flexShrink: 0 }}>
          {SUBMODULE.map(s => (
            <button key={s} onClick={() => setSub(s)}
              style={{
                padding: "8px 16px", border: "none", cursor: "pointer", fontSize: 12,
                background: sub === s ? C.white : "transparent",
                color: sub === s ? C.accent : "#555",
                fontWeight: sub === s ? 700 : 400,
                borderBottom: sub === s ? `2px solid ${C.accent}` : "2px solid transparent",
                borderRight: "1px solid #d0d0d0",
              }}>
              {s}
            </button>
          ))}
        </div>

        {/* ── Inhalt ── */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {sub === "Machbarkeit"           && renderMachbarkeit()}
          {sub === "Grobkostenschätzung"   && renderPlaceholder("Grobkostenschätzung")}
          {sub === "Kostenschätzung eBKP-H"&& renderPlaceholder("Kostenschätzung eBKP-H")}
          {sub === "Kostenvoranschlag BKP" && renderPlaceholder("Kostenvoranschlag BKP")}
          {sub === "Baukosten Kontrolle"   && renderPlaceholder("Baukosten Kontrolle")}
        </div>
      </div>
    </div>
  );
}
