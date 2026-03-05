"use client";
import React, { useState, useEffect, useRef } from "react";
import { useProjekt } from "@/lib/projektContext";

const C = {
  accent:  "#0099cc",
  bg:      "#f0f0f0",
  white:   "#ffffff",
  border:  "#cccccc",
};

const SUBMODULE = ["Machbarkeit", "Grobkostenschätzung", "Kostenschätzung eBKP-H", "Kostenvoranschlag BKP", "Baukosten Kontrolle"];
const INPUT_W = 110; // Einheitliche Eingabebreite

const fmt = (v: number) =>
  v === 0 ? "–" : new Intl.NumberFormat("de-CH", { style: "currency", currency: "CHF", maximumFractionDigits: 0 }).format(v);
const fmtN = (v: number) =>
  v === 0 ? "–" : new Intl.NumberFormat("de-CH", { maximumFractionDigits: 2 }).format(v);

const EMPTY: any = {
  grundstueckM2: "", grundstueckPreisM2: "", grundstueckNebenkosten: 2,
  vorbereitungProzent: 3,
  untergrundM3: "", untergrundPreisM3: "",
  hochbauM3: "", hochbauPreisM3: "",
  innenausbauM2: "", innenausbauPreisM2: "",
  umgebungM2: "", umgebungPreisM2: "",
  baunebenkostenProzent: 8,
  bgfM2: "", bri: "",
  mwstSatz: 8.1,
  notizen: "",
};

function calc(d: any) {
  const n = (v: any) => parseFloat(v) || 0;
  const grundstueck   = n(d.grundstueckM2) * n(d.grundstueckPreisM2);
  const grundNebenk   = grundstueck * (n(d.grundstueckNebenkosten) / 100);
  const pos00         = grundstueck + grundNebenk;
  const pos01         = pos00 * (n(d.vorbereitungProzent) / 100);
  const untergrund    = n(d.untergrundM3) * n(d.untergrundPreisM3);
  const hochbau       = n(d.hochbauM3) * n(d.hochbauPreisM3);
  const pos02         = untergrund + hochbau;
  const pos03         = n(d.innenausbauM2) * n(d.innenausbauPreisM2);
  const pos04         = n(d.umgebungM2) * n(d.umgebungPreisM2);
  const sum0004       = pos00 + pos01 + pos02 + pos03 + pos04;
  const pos05         = sum0004 * (n(d.baunebenkostenProzent) / 100);
  const total         = sum0004 + pos05;
  const mwstBetrag    = n(d.mwstSatz) > 0 ? total * (n(d.mwstSatz) / 100) : 0;
  const totalMwst     = total + mwstBetrag;
  const bgf           = n(d.bgfM2);
  const bri           = n(d.bri);
  const chfM2         = bgf > 0 ? totalMwst / bgf : 0;
  const chfM3         = bri > 0 ? totalMwst / bri : 0;
  return { grundstueck, grundNebenk, pos00, pos01, untergrund, hochbau, pos02, pos03, pos04, sum0004, pos05, total, mwstBetrag, totalMwst, chfM2, chfM3 };
}

// ── NumInput: lokaler State + Tab-Navigation ─────────────────────────────────
function NumInput({ value, onChange, unit, tabIndex }: { value: any; onChange: (v: string) => void; unit?: string; tabIndex?: number }) {
  const [local, setLocal] = React.useState(value ?? "");
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Externe Wertänderung (z.B. IFC-Import) nur übernehmen wenn nicht fokussiert
  React.useEffect(() => {
    if (document.activeElement !== inputRef.current) {
      setLocal(value ?? "");
    }
  }, [value]);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <input
        ref={inputRef}
        type="number"
        value={local}
        onChange={e => setLocal(e.target.value)}
        onBlur={e => onChange(e.target.value)}
        placeholder="0"
        tabIndex={tabIndex}
        style={{ width: 110, padding: "4px 8px", border: "1px solid #bbb", borderRadius: 2, fontSize: 12, textAlign: "right", background: "#fffef5", outline: "none" }}
        onFocus={e => (e.target as HTMLInputElement).style.border = "1px solid #0099cc"}
        onBlurCapture={e => (e.target as HTMLInputElement).style.border = "1px solid #bbb"}
      />
      {unit && <span style={{ fontSize: 11, color: "#888", whiteSpace: "nowrap" }}>{unit}</span>}
    </div>
  );
}

interface Props { projekte: any[]; }

export function KostenplanungClient({ projekte }: Props) {
  const [sub, setSub] = useState("Machbarkeit");
  const { aktuellesProjekt } = useProjekt();
  const projektId = aktuellesProjekt?.id || projekte[0]?.id || "";
  const [data, setData]           = useState<any>(EMPTY);
  const [saved, setSaved]         = useState(false);
  const [saving, setSaving]       = useState(false);
  const [loading, setLoading]     = useState(false);
  const [showIfc, setShowIfc]     = useState(false);
  const [ifcLoading, setIfcLoading] = useState(false);
  const [ifcResult, setIfcResult] = useState<any>(null);
  const fileRef                   = useRef<HTMLInputElement>(null);

  const projekt = projekte.find(p => p.id === projektId) || aktuellesProjekt;
  const r       = calc(data);

  useEffect(() => {
    if (!projektId) return;
    setLoading(true);
    fetch(`/api/machbarkeit?projektId=${projektId}`)
      .then(res => res.json())
      .then(d => setData(d ? { ...EMPTY, ...d } : { ...EMPTY }))
      .finally(() => setLoading(false));
  }, [projektId]);

  const set = (key: string, val: any) => { setSaved(false); setData((d: any) => ({ ...d, [key]: val })); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: any = { ...data, projektId };
      // Leere Strings → null für Datenbank
      for (const k of Object.keys(payload)) {
        if (payload[k] === "") payload[k] = null;
      }
      await fetch("/api/machbarkeit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setSaved(true);
    } finally { setSaving(false); }
  };

  // ── IFC Parsing ────────────────────────────────────────────────────────────
  const handleIfcUpload = async (file: File) => {
    setIfcLoading(true);
    setIfcResult(null);
    try {
      const buffer = await file.arrayBuffer();
      const bytes  = new Uint8Array(buffer);
      const text   = new TextDecoder().decode(bytes);

      // IFC Text-Parser: Extrahiert Flächen und Volumen aus IFC-Datei
      const result = parseIfcSimple(text);
      setIfcResult(result);
    } catch (e) {
      setIfcResult({ error: "Fehler beim Lesen der IFC-Datei" });
    } finally {
      setIfcLoading(false);
    }
  };

  const parseIfcSimple = (text: string) => {
    // Extrahiere IFCQUANTITYLENGTH, IFCQUANTITYAREA, IFCQUANTITYVOLUME
    const areas:   number[] = [];
    const volumes: number[] = [];
    const lengths: number[] = [];

    // IfcQuantityArea - GrossFloorArea, NetFloorArea etc.
    const areaRegex = /IFCQUANTITYAREA\('[^']*(?:GROSS|NET|FLOOR|AREA|FLÄCHE)[^']*',\$,[^,]*,[^,]*,([\d.]+)/gi;
    let m;
    while ((m = areaRegex.exec(text)) !== null) areas.push(parseFloat(m[1]));

    // IfcQuantityVolume
    const volRegex = /IFCQUANTITYVOLUME\('[^']*(?:GROSS|NET|VOLUME|VOLUMEN)[^']*',\$,[^,]*,[^,]*,([\d.]+)/gi;
    while ((m = volRegex.exec(text)) !== null) volumes.push(parseFloat(m[1]));

    // Alle numerischen Quantities sammeln als Fallback
    const allAreaRegex = /IFCQUANTITYAREA\('[^']*',\$,[^,]*,[^,]*,([\d.]+)/gi;
    const allAreas: number[] = [];
    while ((m = allAreaRegex.exec(text)) !== null) allAreas.push(parseFloat(m[1]));

    const allVolRegex = /IFCQUANTITYVOLUME\('[^']*',\$,[^,]*,[^,]*,([\d.]+)/gi;
    const allVols: number[] = [];
    while ((m = allVolRegex.exec(text)) !== null) allVols.push(parseFloat(m[1]));

    // Geschosse zählen
    const storeys = (text.match(/IFCBUILDINGSTOREY\(/gi) || []).length;

    // Spaces zählen
    const spaces  = (text.match(/IFCSPACE\(/gi) || []).length;

    // Projekt-Infos extrahieren
    const projMatch = text.match(/IFCPROJECT\('[^']*','[^']*','([^']*)',/i);
    const projName  = projMatch ? projMatch[1] : "Unbekannt";

    const totalArea = areas.length > 0
      ? areas.reduce((a, b) => a + b, 0)
      : allAreas.length > 0 ? allAreas.reduce((a, b) => a + b, 0) : 0;

    const totalVol = volumes.length > 0
      ? volumes.reduce((a, b) => a + b, 0)
      : allVols.length > 0 ? allVols.reduce((a, b) => a + b, 0) : 0;

    return {
      projektName: projName,
      geschosse:   storeys,
      raeume:      spaces,
      bgfM2:       Math.round(totalArea * 10) / 10,
      bri:         Math.round(totalVol * 10) / 10,
      rawAreas:    allAreas.slice(0, 10),
      rawVols:     allVols.slice(0, 10),
    };
  };

  const applyIfcData = () => {
    if (!ifcResult) return;
    setData((d: any) => ({
      ...d,
      bgfM2: ifcResult.bgfM2 > 0 ? ifcResult.bgfM2 : d.bgfM2,
      bri:   ifcResult.bri   > 0 ? ifcResult.bri   : d.bri,
    }));
    setSaved(false);
    setShowIfc(false);
  };

  // ── Export ─────────────────────────────────────────────────────────────────
  const handleExportPDF = () => {
    const win = window.open("", "_blank");
    if (!win) return;
    const rows = [
      ["00", "Grundstück", fmt(r.pos00)],
      ["", "  Grundstücksfläche", `${data.grundstueckM2 || 0} m² × CHF ${data.grundstueckPreisM2 || 0}/m²`],
      ["", "  Nebenkosten Kauf", `${data.grundstueckNebenkosten || 0}%`],
      ["01", "Vorbereitungsarbeiten", fmt(r.pos01)],
      ["02", "Gebäude", fmt(r.pos02)],
      ["02.1", "  Untergrund/UG", `${data.untergrundM3 || 0} m³ × CHF ${data.untergrundPreisM3 || 0}/m³`],
      ["02.2", "  Hochbau/OG", `${data.hochbauM3 || 0} m³ × CHF ${data.hochbauPreisM3 || 0}/m³`],
      ["03", "Innenausbau", fmt(r.pos03)],
      ["04", "Umgebung", fmt(r.pos04)],
      ["", "Zwischensumme 00–04", fmt(r.sum0004)],
      ["05", "Baunebenkosten", fmt(r.pos05)],
      ["", "Total exkl. MwSt", fmt(r.total)],
      ["", `MwSt ${data.mwstSatz || 0}%`, fmt(r.mwstBetrag)],
      ["", "TOTAL INKL. MWST", fmt(r.totalMwst)],
    ];
    win.document.write(`
      <html><head><title>Machbarkeit ${projekt?.nummer}</title>
      <style>
        body { font-family: Arial; font-size: 12px; margin: 30px; }
        h1 { color: #0099cc; font-size: 16px; border-bottom: 2px solid #0099cc; padding-bottom: 6px; }
        h2 { font-size: 13px; color: #555; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th { background: #0099cc; color: white; padding: 6px 10px; text-align: left; font-size: 11px; }
        td { padding: 5px 10px; border-bottom: 1px solid #eee; font-size: 11px; }
        .total { background: #0099cc; color: white; font-weight: bold; }
        .subtotal { background: #e8f4ff; font-weight: bold; color: #0099cc; }
        .right { text-align: right; }
        .kenn { margin-top: 20px; }
        @media print { button { display: none; } }
      </style></head><body>
      <h1>Machbarkeit</h1>
      <h2>${projekt?.nummer} · ${projekt?.name}</h2>
      <p style="color:#888;font-size:11px;">Erstellt: ${new Date().toLocaleDateString("de-CH")}</p>
      <table>
        <thead><tr><th width="50">Pos.</th><th>Bezeichnung</th><th class="right" width="160">Betrag CHF</th></tr></thead>
        <tbody>
        ${rows.map(([pos, label, val]) => {
          const isTotalRow = label === "TOTAL INKL. MWST";
          const isSubtotal = label.startsWith("Zwischensumme") || label.startsWith("Total exkl");
          return `<tr class="${isTotalRow ? "total" : isSubtotal ? "subtotal" : ""}">
            <td>${pos}</td><td>${label}</td><td class="right">${val}</td>
          </tr>`;
        }).join("")}
        </tbody>
      </table>
      ${(r.chfM2 > 0 || r.chfM3 > 0) ? `
      <div class="kenn">
        <h2>Kennzahlen</h2>
        <table>
          <tr><td>BGF</td><td class="right">${data.bgfM2 || "–"} m²</td></tr>
          <tr><td>BRI</td><td class="right">${data.bri || "–"} m³</td></tr>
          ${r.chfM2 > 0 ? `<tr><td>CHF/m² BGF</td><td class="right">${fmtN(r.chfM2)} CHF</td></tr>` : ""}
          ${r.chfM3 > 0 ? `<tr><td>CHF/m³ BRI</td><td class="right">${fmtN(r.chfM3)} CHF</td></tr>` : ""}
        </table>
      </div>` : ""}
      ${data.notizen ? `<div class="kenn"><h2>Notizen</h2><p>${data.notizen}</p></div>` : ""}
      <br><button onclick="window.print()">Drucken / Als PDF speichern</button>
      </body></html>
    `);
    win.document.close();
  };

  const handleExportCSV = () => {
    const rows = [
      ["Pos", "Bezeichnung", "Wert", "Betrag CHF"],
      ["00", "Grundstück", "", r.pos00],
      ["", "Grundstücksfläche m²", data.grundstueckM2 || 0, ""],
      ["", "Grundstückspreis CHF/m²", data.grundstueckPreisM2 || 0, ""],
      ["", "Nebenkosten Kauf %", data.grundstueckNebenkosten || 0, r.grundNebenk],
      ["01", "Vorbereitungsarbeiten %", data.vorbereitungProzent || 0, r.pos01],
      ["02", "Gebäude", "", r.pos02],
      ["02.1", "Untergrund m³", data.untergrundM3 || 0, r.untergrund],
      ["02.2", "Hochbau m³", data.hochbauM3 || 0, r.hochbau],
      ["03", "Innenausbau", data.innenausbauM2 || 0, r.pos03],
      ["04", "Umgebung m²", data.umgebungM2 || 0, r.pos04],
      ["", "Zwischensumme 00-04", "", r.sum0004],
      ["05", "Baunebenkosten %", data.baunebenkostenProzent || 0, r.pos05],
      ["", "Total exkl. MwSt", "", r.total],
      ["", `MwSt ${data.mwstSatz || 0}%`, "", r.mwstBetrag],
      ["", "TOTAL INKL. MWST", "", r.totalMwst],
      ["", "", "", ""],
      ["", "BGF m²", data.bgfM2 || "", ""],
      ["", "BRI m³", data.bri || "", ""],
      ["", "CHF/m² BGF", r.chfM2 > 0 ? r.chfM2.toFixed(2) : "", ""],
      ["", "CHF/m³ BRI", r.chfM3 > 0 ? r.chfM3.toFixed(2) : "", ""],
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `Machbarkeit_${projekt?.nummer || "export"}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };



  const R = ({ val, highlight = false }: { val: number; highlight?: boolean }) => (
    <div style={{ textAlign: "right", fontWeight: highlight ? 700 : 500, fontSize: highlight ? 13 : 12, color: highlight ? C.accent : "#333", padding: "4px 6px", background: highlight ? "#e8f4ff" : "transparent", borderRadius: 2, minWidth: 140 }}>
      {fmt(val)}
    </div>
  );

  const Row = ({ pos, label, children, result, indent = false }: any) => (
    <tr style={{ borderBottom: "1px solid #ebebeb" }}>
      <td style={{ padding: "7px 10px", width: 44, color: "#888", fontSize: 12, fontWeight: 600 }}>{pos}</td>
      <td style={{ padding: "7px 10px", fontSize: 12, color: "#333", paddingLeft: indent ? 26 : 10 }}>{label}</td>
      <td style={{ padding: "7px 10px" }}>{children}</td>
      <td style={{ padding: "7px 14px", textAlign: "right" }}><R val={result} /></td>
    </tr>
  );

  const SubRow = ({ pos, label, result, bg = "#f4f4f4" }: any) => (
    <tr style={{ background: bg, borderBottom: "1px solid #ddd" }}>
      <td style={{ padding: "6px 10px", fontSize: 12, fontWeight: 700, color: "#444" }}>{pos}</td>
      <td colSpan={2} style={{ padding: "6px 10px", fontSize: 12, fontWeight: 700, color: "#333" }}>{label}</td>
      <td style={{ padding: "6px 14px", textAlign: "right", fontWeight: 700, fontSize: 12, color: "#333" }}>{fmt(result)}</td>
    </tr>
  );

  const SepLine = ({ label, val, color = C.accent }: any) => (
    <tr style={{ background: color + "18", borderTop: `2px solid ${color}44`, borderBottom: "1px solid #ccc" }}>
      <td colSpan={3} style={{ padding: "7px 10px", fontWeight: 700, fontSize: 12, color }}>{label}</td>
      <td style={{ padding: "7px 14px", textAlign: "right", fontWeight: 700, fontSize: 12, color }}>{fmt(val)}</td>
    </tr>
  );

  const renderMachbarkeit = () => (
    <div style={{ display: "flex", gap: 14, padding: 14, alignItems: "flex-start" }}>

      {/* ── Eingabetabelle ── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 3, overflow: "hidden" }}>
          <div style={{ background: C.accent, color: C.white, padding: "7px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 700, fontSize: 13 }}>Machbarkeit — {projekt?.nummer} {projekt?.name}</span>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 11, opacity: 0.85 }}>MwSt:</span>
              <select value={data.mwstSatz} onChange={e => set("mwstSatz", e.target.value)}
                style={{ fontSize: 11, padding: "2px 6px", borderRadius: 2, border: "none", background: "rgba(255,255,255,0.2)", color: C.white, cursor: "pointer" }}>
                <option value={8.1}>8.1% (Normal)</option>
                <option value={3.8}>3.8% (Hotel)</option>
                <option value={0}>Befreit (0%)</option>
              </select>
            </div>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#e8e8e8", borderBottom: "2px solid #ccc" }}>
                <th style={{ padding: "6px 10px", width: 44, textAlign: "left", fontSize: 11, color: "#555" }}>Pos.</th>
                <th style={{ padding: "6px 10px", textAlign: "left", fontSize: 11, color: "#555" }}>Bezeichnung</th>
                <th style={{ padding: "6px 10px", textAlign: "left", fontSize: 11, color: "#555" }}>Eingabe</th>
                <th style={{ padding: "6px 14px", textAlign: "right", fontSize: 11, color: "#555", width: 155 }}>Betrag CHF</th>
              </tr>
            </thead>
            <tbody>

              {/* 00 Grundstück */}
              <SubRow pos="00" label="Grundstück" result={r.pos00} />
              <Row pos="" label="Grundstücksfläche" indent result={r.grundstueck}>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <NumInput value={data["grundstueckM2"]} onChange={v => set("grundstueckM2", v)} unit="m²" tabIndex={1} />
                  <span style={{ color: "#ccc", fontSize: 14 }}>×</span>
                  <NumInput value={data["grundstueckPreisM2"]} onChange={v => set("grundstueckPreisM2", v)} unit="CHF/m²" tabIndex={2} />
                </div>
              </Row>
              <Row pos="" label="Nebenkosten Kauf" indent result={r.grundNebenk}>
                <NumInput value={data["grundstueckNebenkosten"]} onChange={v => set("grundstueckNebenkosten", v)} unit="%" tabIndex={3} />
              </Row>

              {/* 01 Vorbereitungsarbeiten */}
              <SubRow pos="01" label="Vorbereitungsarbeiten" result={r.pos01} />
              <Row pos="" label="Anteil von Pos. 00" indent result={r.pos01}>
                <NumInput value={data["vorbereitungProzent"]} onChange={v => set("vorbereitungProzent", v)} unit="% von Pos. 00" tabIndex={4} />
              </Row>

              {/* 02 Gebäude */}
              <SubRow pos="02" label="Gebäude" result={r.pos02} />
              <Row pos="02.1" label="Untergrund / UG" indent result={r.untergrund}>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <NumInput value={data["untergrundM3"]} onChange={v => set("untergrundM3", v)} unit="m³" tabIndex={5} />
                  <span style={{ color: "#ccc", fontSize: 14 }}>×</span>
                  <NumInput value={data["untergrundPreisM3"]} onChange={v => set("untergrundPreisM3", v)} unit="CHF/m³" tabIndex={6} />
                </div>
              </Row>
              <Row pos="02.2" label="Hochbau / OG" indent result={r.hochbau}>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <NumInput value={data["hochbauM3"]} onChange={v => set("hochbauM3", v)} unit="m³" tabIndex={7} />
                  <span style={{ color: "#ccc", fontSize: 14 }}>×</span>
                  <NumInput value={data["hochbauPreisM3"]} onChange={v => set("hochbauPreisM3", v)} unit="CHF/m³" tabIndex={8} />
                </div>
              </Row>

              {/* 03 Innenausbau */}
              <SubRow pos="03" label="Innenausbau" result={r.pos03} />
              <Row pos="" label="Innenausbaufläche" indent result={r.pos03}>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <NumInput value={data["innenausbauM2"]} onChange={v => set("innenausbauM2", v)} unit="m²" tabIndex={9} />
                  <span style={{ color: "#ccc", fontSize: 14 }}>×</span>
                  <NumInput value={data["innenausbauPreisM2"]} onChange={v => set("innenausbauPreisM2", v)} unit="CHF/m²" tabIndex={10} />
                </div>
              </Row>

              {/* 04 Umgebung */}
              <SubRow pos="04" label="Umgebung" result={r.pos04} />
              <Row pos="" label="Umgebungsfläche" indent result={r.pos04}>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <NumInput value={data["umgebungM2"]} onChange={v => set("umgebungM2", v)} unit="m²" tabIndex={11} />
                  <span style={{ color: "#ccc", fontSize: 14 }}>×</span>
                  <NumInput value={data["umgebungPreisM2"]} onChange={v => set("umgebungPreisM2", v)} unit="CHF/m²" tabIndex={12} />
                </div>
              </Row>

              {/* Zwischensumme */}
              <SepLine label="Zwischensumme 00 – 04" val={r.sum0004} />

              {/* 05 Baunebenkosten */}
              <SubRow pos="05" label="Baunebenkosten" result={r.pos05} />
              <Row pos="" label="Anteil von Summe 00–04" indent result={r.pos05}>
                <NumInput value={data["baunebenkostenProzent"]} onChange={v => set("baunebenkostenProzent", v)} unit="% von 00–04" tabIndex={13} />
              </Row>

              {/* Total exkl. MwSt */}
              <tr style={{ background: "#e0e0e0", borderTop: "2px solid #bbb" }}>
                <td colSpan={3} style={{ padding: "8px 10px", fontWeight: 700, fontSize: 13, color: "#222" }}>Total exkl. MwSt</td>
                <td style={{ padding: "8px 14px", textAlign: "right", fontWeight: 700, fontSize: 13 }}>{fmt(r.total)}</td>
              </tr>
              {parseFloat(data.mwstSatz) > 0 && (
                <tr style={{ borderBottom: "1px solid #e0e0e0" }}>
                  <td colSpan={3} style={{ padding: "6px 10px", fontSize: 12, color: "#666" }}>MwSt {data.mwstSatz}%</td>
                  <td style={{ padding: "6px 14px", textAlign: "right", fontSize: 12, color: "#666" }}>{fmt(r.mwstBetrag)}</td>
                </tr>
              )}
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
          <textarea value={data.notizen || ""} onChange={e => set("notizen", e.target.value)}
            rows={3} placeholder="Anmerkungen zur Machbarkeit..."
            style={{ width: "100%", padding: "8px 10px", border: "none", fontSize: 12, fontFamily: "inherit", resize: "vertical", outline: "none", boxSizing: "border-box" }} />
        </div>
      </div>

      {/* ── Rechte Spalte ── */}
      <div style={{ width: 230, flexShrink: 0, display: "flex", flexDirection: "column", gap: 10 }}>

        {/* Kennzahlen Eingabe */}
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 3, overflow: "hidden" }}>
          <div style={{ background: "#555", color: C.white, padding: "6px 10px", fontSize: 11, fontWeight: 700 }}>KENNZAHLEN EINGABE</div>
          <div style={{ padding: "10px" }}>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: "#666", marginBottom: 3 }}>Bruttogeschossfläche BGF</div>
              <NumInput value={data["bgfM2"]} onChange={v => set("bgfM2", v)} unit="m²" tabIndex={14} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#666", marginBottom: 3 }}>Bruttorauminhalt BRI</div>
              <NumInput value={data["bri"]} onChange={v => set("bri", v)} unit="m³" tabIndex={15} />
            </div>
          </div>
          {/* IFC-Import Knopf */}
          <div style={{ padding: "0 10px 10px" }}>
            <button onClick={() => setShowIfc(true)}
              style={{ width: "100%", padding: "7px", background: "#1a5f7a", color: C.white, border: "none", borderRadius: 3, fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
              <span>📐</span> Aus IFC-Datei ermitteln
            </button>
          </div>
        </div>

        {/* Kennzahlen Auswertung */}
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 3, overflow: "hidden" }}>
          <div style={{ background: C.accent, color: C.white, padding: "6px 10px", fontSize: 11, fontWeight: 700 }}>KENNZAHLEN</div>
          {[
            { label: "Total exkl. MwSt", val: fmt(r.total), bold: false },
            { label: "MwSt Betrag",       val: fmt(r.mwstBetrag), bold: false },
            { label: "Total inkl. MwSt",  val: fmt(r.totalMwst), bold: true },
            null,
            { label: "CHF / m² BGF",      val: r.chfM2 > 0 ? fmtN(r.chfM2) + " CHF" : "–", bold: false },
            { label: "CHF / m³ BRI",      val: r.chfM3 > 0 ? fmtN(r.chfM3) + " CHF" : "–", bold: false },
          ].map((row, i) =>
            !row ? <div key={i} style={{ borderTop: "1px solid #eee" }} /> : (
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
            { pos: "00", label: "Grundstück",    val: r.pos00 },
            { pos: "01", label: "Vorbereitung",  val: r.pos01 },
            { pos: "02", label: "Gebäude",       val: r.pos02 },
            { pos: "03", label: "Innenausbau",   val: r.pos03 },
            { pos: "04", label: "Umgebung",      val: r.pos04 },
            { pos: "05", label: "Baunebenk.",    val: r.pos05 },
          ].map(row => {
            const pct = r.total > 0 ? (row.val / r.total) * 100 : 0;
            return (
              <div key={row.pos} style={{ padding: "5px 10px", borderBottom: "1px solid #f0f0f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 11, color: "#555" }}><strong>{row.pos}</strong> {row.label}</span>
                  <span style={{ fontSize: 11, color: "#888" }}>{pct.toFixed(1)}%</span>
                </div>
                <div style={{ height: 5, background: "#e8e8e8", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", background: C.accent, borderRadius: 3 }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Export & Speichern */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={handleExportPDF}
              style={{ flex: 1, padding: "7px", background: "#c0392b", color: C.white, border: "none", borderRadius: 3, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
              📄 PDF
            </button>
            <button onClick={handleExportCSV}
              style={{ flex: 1, padding: "7px", background: "#27ae60", color: C.white, border: "none", borderRadius: 3, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
              📊 Excel/CSV
            </button>
          </div>
          <button onClick={handleSave} disabled={saving}
            style={{ padding: "9px", background: saved ? "#22c55e" : C.accent, color: C.white, border: "none", borderRadius: 3, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            {saving ? "Wird gespeichert..." : saved ? "✓ Gespeichert" : "Speichern"}
          </button>
        </div>
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

        {/* Header */}
        <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: "8px 12px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <div style={{ background: C.accent, color: C.white, padding: "4px 12px", fontSize: 12, fontWeight: 700, borderRadius: 2 }}>Kostenplanung</div>
          {projekt && <span style={{ fontSize: 12, color: "#555", fontWeight: 600 }}>{projekt.nummer} · {projekt.name}</span>}
          {!projekt && <span style={{ fontSize: 12, color: "#999", fontStyle: "italic" }}>Kein Projekt gewählt — bitte links ein Projekt auswählen</span>}
          {loading && <span style={{ fontSize: 11, color: "#999" }}>Lädt...</span>}
        </div>

        {/* Sub-Navigation */}
        <div style={{ background: "#e8e8e8", borderBottom: `1px solid ${C.border}`, display: "flex", flexShrink: 0 }}>
          {SUBMODULE.map(s => (
            <button key={s} onClick={() => setSub(s)}
              style={{ padding: "8px 16px", border: "none", cursor: "pointer", fontSize: 12, background: sub === s ? C.white : "transparent", color: sub === s ? C.accent : "#555", fontWeight: sub === s ? 700 : 400, borderBottom: sub === s ? `2px solid ${C.accent}` : "2px solid transparent", borderRight: "1px solid #d0d0d0" }}>
              {s}
            </button>
          ))}
        </div>

        {/* Inhalt */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {sub === "Machbarkeit"            && renderMachbarkeit()}
          {sub === "Grobkostenschätzung"    && renderPlaceholder("Grobkostenschätzung")}
          {sub === "Kostenschätzung eBKP-H" && renderPlaceholder("Kostenschätzung eBKP-H")}
          {sub === "Kostenvoranschlag BKP"  && renderPlaceholder("Kostenvoranschlag BKP")}
          {sub === "Baukosten Kontrolle"    && renderPlaceholder("Baukosten Kontrolle")}
        </div>
      </div>

      {/* ── IFC Upload Modal ─────────────────────────────────────────────────── */}
      {showIfc && (
        <div style={{ position: "fixed", inset: 0, background: "#00000066", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: C.white, width: 520, borderRadius: 4, overflow: "hidden", boxShadow: "0 8px 40px #00000055" }}>
            <div style={{ background: "#1a5f7a", color: C.white, padding: "9px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 700, fontSize: 13 }}>📐 Volumen & Fläche aus IFC ermitteln</span>
              <button onClick={() => { setShowIfc(false); setIfcResult(null); }} style={{ background: "none", border: "none", color: C.white, fontSize: 18, cursor: "pointer" }}>×</button>
            </div>

            <div style={{ padding: 20 }}>
              <p style={{ fontSize: 12, color: "#555", marginBottom: 16 }}>
                Lade eine IFC-Datei hoch (z.B. Export aus ArchiCAD, Revit, Allplan).<br />
                BGF und BRI werden automatisch aus den Gebäudemengen extrahiert.
              </p>

              {/* Upload Area */}
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); (e.currentTarget as HTMLElement).style.background = "#e8f4ff"; }}
                onDragLeave={e => { (e.currentTarget as HTMLElement).style.background = "#f8f8f8"; }}
                onDrop={e => {
                  e.preventDefault();
                  (e.currentTarget as HTMLElement).style.background = "#f8f8f8";
                  const file = e.dataTransfer.files[0];
                  if (file) handleIfcUpload(file);
                }}
                style={{ border: "2px dashed #bbb", borderRadius: 4, padding: "30px 20px", textAlign: "center", cursor: "pointer", background: "#f8f8f8", marginBottom: 16 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#555" }}>IFC-Datei hier ablegen oder klicken</div>
                <div style={{ fontSize: 11, color: "#999", marginTop: 4 }}>Unterstützte Formate: .ifc</div>
                <input ref={fileRef} type="file" accept=".ifc" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) handleIfcUpload(f); }} />
              </div>

              {ifcLoading && (
                <div style={{ textAlign: "center", padding: 20, color: C.accent, fontSize: 13 }}>⏳ IFC-Datei wird analysiert...</div>
              )}

              {ifcResult?.error && (
                <div style={{ background: "#fee2e2", color: "#c0392b", padding: "10px 12px", borderRadius: 4, fontSize: 12 }}>{ifcResult.error}</div>
              )}

              {ifcResult && !ifcResult.error && (
                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 4, padding: "12px 14px" }}>
                  <div style={{ fontWeight: 700, color: "#16a34a", fontSize: 12, marginBottom: 10 }}>✅ IFC-Datei erfolgreich analysiert</div>
                  {[
                    { label: "Projekt", val: ifcResult.projektName },
                    { label: "Geschosse", val: ifcResult.geschosse + " Stk." },
                    { label: "Räume / Spaces", val: ifcResult.raeume + " Stk." },
                    { label: "BGF (ermittelt)", val: ifcResult.bgfM2 > 0 ? `${ifcResult.bgfM2} m²` : "nicht gefunden" },
                    { label: "BRI (ermittelt)", val: ifcResult.bri > 0 ? `${ifcResult.bri} m³` : "nicht gefunden" },
                  ].map((row, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #dcfce7", fontSize: 12 }}>
                      <span style={{ color: "#555" }}>{row.label}</span>
                      <span style={{ fontWeight: 600, color: "#222" }}>{row.val}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                    <button onClick={applyIfcData}
                      style={{ flex: 1, padding: "8px", background: C.accent, color: C.white, border: "none", borderRadius: 3, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                      Werte übernehmen
                    </button>
                    <button onClick={() => setIfcResult(null)}
                      style={{ padding: "8px 14px", background: "#f0f0f0", color: "#555", border: "1px solid #ccc", borderRadius: 3, fontSize: 12, cursor: "pointer" }}>
                      Abbrechen
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
