"use client";
import { useState, useMemo } from "react";
import Link from "next/link";

const STATUS_LABEL: Record<string, string> = {
  AKQUISITION:    "Akquisition",
  OFFERTE:        "Offerte",
  IN_VORBEREITUNG:"In Vorbereitung",
  IN_AUSFUEHRUNG: "In Ausführung",
  IN_ABRECHNUNG:  "In Abrechnung",
  GARANTIE_2J:    "2-jährige Garantie",
  GARANTIE_5J:    "5-jährige Garantie",
  ABGESCHLOSSEN:  "Abgeschlossen",
};

const STATUS_STYLE: Record<string, { bg:string; color:string }> = {
  AKQUISITION:     { bg:"#6b728020", color:"#9ca3af" },
  OFFERTE:         { bg:"#3b82f620", color:"#60a5fa" },
  IN_VORBEREITUNG: { bg:"#f59e0b20", color:"#fbbf24" },
  IN_AUSFUEHRUNG:  { bg:"#22c55e20", color:"#4ade80" },
  IN_ABRECHNUNG:   { bg:"#8b5cf620", color:"#a78bfa" },
  GARANTIE_2J:     { bg:"#ef444420", color:"#f87171" },
  GARANTIE_5J:     { bg:"#ef444420", color:"#f87171" },
  ABGESCHLOSSEN:   { bg:"#6b728020", color:"#9ca3af" },
};

const fmt = (n: number | null) => n ? new Intl.NumberFormat("de-CH", { style:"currency", currency:"CHF", maximumFractionDigits:0 }).format(n) : "–";
const pct = (v: number | null, t: number | null) => t && t > 0 ? Math.min(100, Math.round((v||0) / t * 100)) : 0;

export function ProjekteClient({ projekte }: { projekte: any[] }) {
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatus]   = useState<string[]>([]);
  const [gruppeFilter, setGruppe]   = useState<string[]>([]);
  const [sortBy, setSortBy]         = useState<string>("nummer");
  const [sortDir, setSortDir]       = useState<"asc"|"desc">("asc");
  const [selected, setSelected]     = useState<string|null>(null);

  const gruppen = [...new Set(projekte.map(p => p.gruppe).filter(Boolean))].sort();

  const filtered = useMemo(() => {
    let list = [...projekte];
    if (search) list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.nummer.includes(search));
    if (statusFilter.length) list = list.filter(p => statusFilter.includes(p.status));
    if (gruppeFilter.length) list = list.filter(p => gruppeFilter.includes(p.gruppe));
    list.sort((a, b) => {
      const av = a[sortBy] ?? ""; const bv = b[sortBy] ?? "";
      return sortDir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
    return list;
  }, [projekte, search, statusFilter, gruppeFilter, sortBy, sortDir]);

  const toggleSort = (col: string) => {
    if (sortBy === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("asc"); }
  };
  const Th = ({ col, label }: { col: string; label: string }) => (
    <th onClick={() => toggleSort(col)} style={{ padding:"6px 10px", textAlign:"left", fontWeight:600, color:"#555", borderRight:"1px solid #ddd", cursor:"pointer", whiteSpace:"nowrap", userSelect:"none", background:"#e8e8e8", fontSize:12 }}>
      {label} {sortBy===col ? (sortDir==="asc"?"↑":"↓") : ""}
    </th>
  );

  return (
    <div style={{ display:"flex", height:"100%", overflow:"hidden" }}>
      {/* Main area */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        {/* Header */}
        <div style={{ padding:"12px 16px", background:"#fff", borderBottom:"1px solid #ddd", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          <div>
            <h1 style={{ fontSize:16, fontWeight:700, color:"#333" }}>Projekte</h1>
            <div style={{ fontSize:11, color:"#999" }}>{filtered.length} von {projekte.length} Projekten</div>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Suchen..." style={{ padding:"5px 10px", border:"1px solid #ccc", borderRadius:4, fontSize:12, width:200 }} />
            <Link href="/dashboard/projekte/neu">
              <button style={{ background:"#c0392b", color:"#fff", border:"none", borderRadius:5, padding:"6px 14px", fontWeight:700, fontSize:12, cursor:"pointer" }}>+ Neues Projekt</button>
            </Link>
          </div>
        </div>

        {/* Table */}
        <div style={{ flex:1, overflowY:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
            <thead style={{ position:"sticky", top:0, zIndex:2 }}>
              <tr style={{ borderBottom:"2px solid #ccc" }}>
                <Th col="nummer"        label="Nummer" />
                <Th col="name"          label="Name" />
                <Th col="status"        label="Status" />
                <Th col="gruppe"        label="Gruppe" />
                <th style={{ padding:"6px 10px", fontWeight:600, color:"#555", background:"#e8e8e8", fontSize:12 }}>Projektleiter</th>
                <th style={{ padding:"6px 10px", fontWeight:600, color:"#555", background:"#e8e8e8", fontSize:12 }}>Budget</th>
                <th style={{ padding:"6px 10px", fontWeight:600, color:"#555", background:"#e8e8e8", fontSize:12, width:120 }}>Fortschritt</th>
                <th style={{ padding:"6px 10px", background:"#e8e8e8", width:60 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => {
                const sc   = STATUS_STYLE[p.status] || { bg:"#f5f5f5", color:"#666" };
                const prog = pct(p.budgetVerbraucht, p.budgetTotal);
                const isSel = p.id === selected;
                return (
                  <tr key={p.id} onClick={() => setSelected(p.id)}
                    style={{ background: isSel ? "#fce8e8" : i%2===0?"#fff":"#f9f9f9", borderBottom:"1px solid #eee", cursor:"pointer" }}
                    onMouseEnter={e => { if(!isSel)(e.currentTarget as HTMLElement).style.background="#fff3f3"; }}
                    onMouseLeave={e => { if(!isSel)(e.currentTarget as HTMLElement).style.background=i%2===0?"#fff":"#f9f9f9"; }}
                  >
                    <td style={{ padding:"7px 10px", fontWeight:700, color:"#c0392b", whiteSpace:"nowrap" }}>{p.nummer}</td>
                    <td style={{ padding:"7px 10px", maxWidth:280, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.name}</td>
                    <td style={{ padding:"7px 10px", whiteSpace:"nowrap" }}>
                      <span style={{ background:sc.bg, color:sc.color, padding:"2px 8px", borderRadius:3, fontSize:11, fontWeight:600 }}>
                        {STATUS_LABEL[p.status] || p.status}
                      </span>
                    </td>
                    <td style={{ padding:"7px 10px", color:"#666" }}>{p.gruppe}</td>
                    <td style={{ padding:"7px 10px", color:"#666" }}>{p.projektleiter?.name || "–"}</td>
                    <td style={{ padding:"7px 10px", color:"#555", whiteSpace:"nowrap" }}>{fmt(p.budgetTotal)}</td>
                    <td style={{ padding:"7px 10px" }}>
                      {p.budgetTotal ? (
                        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                          <div style={{ flex:1, height:5, background:"#e0e0e0", borderRadius:3 }}>
                            <div style={{ width:`${prog}%`, height:"100%", background: prog>90?"#ef4444":prog>70?"#f59e0b":"#22c55e", borderRadius:3 }} />
                          </div>
                          <span style={{ fontSize:10, color:"#888", minWidth:28 }}>{prog}%</span>
                        </div>
                      ) : "–"}
                    </td>
                    <td style={{ padding:"7px 10px", textAlign:"center" }}>
                      <Link href={`/dashboard/projekte/${p.id}`} onClick={e => e.stopPropagation()}>
                        <span style={{ color:"#c0392b", fontSize:12, fontWeight:600, cursor:"pointer" }}>→</span>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right Filter Sidebar */}
      <div style={{ width:190, background:"#f8f8f8", borderLeft:"1px solid #ddd", padding:10, overflowY:"auto", flexShrink:0, fontSize:12 }}>
        <div style={{ fontSize:10, color:"#999", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:8 }}>Filter</div>

        <div style={{ fontWeight:700, color:"#555", marginBottom:4 }}>▸ Status</div>
        {Object.entries(STATUS_LABEL).map(([key, label]) => (
          <label key={key} style={{ display:"flex", alignItems:"center", gap:4, padding:"2px 0", cursor:"pointer" }}>
            <input type="checkbox" checked={statusFilter.includes(key)} onChange={e => setStatus(s => e.target.checked ? [...s, key] : s.filter(x => x !== key))} />
            <span>{label}</span>
          </label>
        ))}

        <div style={{ fontWeight:700, color:"#555", margin:"12px 0 4px" }}>▸ Gruppe</div>
        {gruppen.map(g => (
          <label key={g} style={{ display:"flex", alignItems:"center", gap:4, padding:"2px 0", cursor:"pointer" }}>
            <input type="checkbox" checked={gruppeFilter.includes(g)} onChange={e => setGruppe(s => e.target.checked ? [...s, g] : s.filter(x => x !== g))} />
            <span>{g}</span>
          </label>
        ))}

        {(statusFilter.length > 0 || gruppeFilter.length > 0) && (
          <button onClick={() => { setStatus([]); setGruppe([]); }} style={{ marginTop:12, width:"100%", padding:"5px", background:"#c0392b22", color:"#c0392b", border:"1px solid #c0392b44", borderRadius:4, cursor:"pointer", fontSize:11, fontWeight:600 }}>
            Filter zurücksetzen
          </button>
        )}
      </div>
    </div>
  );
}
