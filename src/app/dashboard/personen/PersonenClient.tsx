"use client";
import React, { useState, useRef, useEffect } from "react";

const C = { accent:"#0099cc", white:"#ffffff", border:"#cccccc", bg:"#f0f0f0", sidebar:"#2d2d2d" };
const ROLLEN = ["BENUTZER","LIEFERANT","BAUHERR","PLANER","UNTERNEHMER","KONTAKT"];
const ROLLEN_COLORS: Record<string,string> = { BENUTZER:"#6b7280",LIEFERANT:"#f59e0b",BAUHERR:"#8b5cf6",PLANER:"#0099cc",UNTERNEHMER:"#22c55e",KONTAKT:"#ef4444" };
const CH_PLZ: Record<string,string> = {
  "5000":"Aarau","5200":"Brugg","5242":"Lupfig","5400":"Baden","5430":"Wettingen","5600":"Lenzburg",
  "6300":"Zug","6340":"Baar","8000":"Zürich","8001":"Zürich","8002":"Zürich","8003":"Zürich",
  "8004":"Zürich","8005":"Zürich","8050":"Zürich","8052":"Zürich","8057":"Zürich",
  "8100":"Regensdorf","8200":"Schaffhausen","8300":"Winterthur","8400":"Winterthur",
  "8500":"Frauenfeld","8600":"Dübendorf","8700":"Küsnacht ZH","8800":"Thalwil",
  "8900":"Uster","8952":"Schlieren","8953":"Dietikon","9000":"St. Gallen","9001":"St. Gallen",
  "3000":"Bern","3001":"Bern","4000":"Basel","4051":"Basel","6000":"Luzern","6002":"Luzern",
  "1000":"Lausanne","1200":"Genève","5210":"Windisch","5722":"Gränichen","5734":"Reinach AG",
};

function F({ name,dv="",ph="",type="text",ti }: { name:string;dv?:string;ph?:string;type?:string;ti?:number }) {
  return <input name={name} type={type} defaultValue={dv} placeholder={ph} tabIndex={ti}
    style={{ width:"100%", padding:"4px 8px", border:"1px solid #ccc", borderRadius:2, fontSize:12, background:"#fff", boxSizing:"border-box" as const, outline:"none" }}
    onFocus={e=>(e.target as HTMLInputElement).style.border="1px solid #0099cc"}
    onBlur={e=>(e.target as HTMLInputElement).style.border="1px solid #ccc"} />;
}

function PlzField({ dPlz,dOrt,ortRef }: { dPlz:string;dOrt:string;ortRef:React.RefObject<HTMLInputElement> }) {
  const [sugg,setSugg] = useState<{plz:string;ort:string}[]>([]);
  const [show,setShow] = useState(false);
  return (
    <div style={{ display:"flex", gap:6, position:"relative" }}>
      <div style={{ width:90, position:"relative" }}>
        <input name="plz" type="text" defaultValue={dPlz} placeholder="PLZ"
          onChange={e=>{ const v=e.target.value; const m=Object.entries(CH_PLZ).filter(([p])=>p.startsWith(v)).slice(0,6).map(([p,o])=>({plz:p,ort:o})); setSugg(m); setShow(m.length>0&&v.length>=2); if(CH_PLZ[v]&&ortRef.current) ortRef.current.value=CH_PLZ[v]; }}
          onBlur={()=>setTimeout(()=>setShow(false),150)}
          onFocus={e=>(e.target as HTMLInputElement).style.border="1px solid #0099cc"}
          style={{ width:"100%", padding:"4px 8px", border:"1px solid #ccc", borderRadius:2, fontSize:12, outline:"none", boxSizing:"border-box" as const }} />
        {show && <div style={{ position:"absolute", top:"100%", left:0, zIndex:100, background:"#fff", border:"1px solid #ccc", borderRadius:2, boxShadow:"0 4px 12px #0003", minWidth:220 }}>
          {sugg.map(s=><div key={s.plz}
            onMouseDown={e=>{e.preventDefault();const inp=e.currentTarget.closest("div")?.previousElementSibling as HTMLInputElement;if(inp)inp.value=s.plz;if(ortRef.current)ortRef.current.value=s.ort;setShow(false);}}
            style={{ padding:"5px 10px", cursor:"pointer", fontSize:12, borderBottom:"1px solid #f0f0f0" }}
            onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background="#e8f4ff"}
            onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background="#fff"}><strong>{s.plz}</strong> {s.ort}</div>)}
        </div>}
      </div>
      <input ref={ortRef} name="ort" type="text" defaultValue={dOrt} placeholder="Ort"
        onFocus={e=>(e.target as HTMLInputElement).style.border="1px solid #0099cc"}
        onBlur={e=>(e.target as HTMLInputElement).style.border="1px solid #ccc"}
        style={{ flex:1, padding:"4px 8px", border:"1px solid #ccc", borderRadius:2, fontSize:12, outline:"none", boxSizing:"border-box" as const }} />
    </div>
  );
}

const SUB_PAGES = ["Übersicht","Persönliche Daten","Kommunikation","Adressen","Rollen","Dokumente","Notizen"];

interface Props { personen: any[]; firmen: any[]; }

export function PersonenClient({ personen: initial, firmen }: Props) {
  const [personen, setPersonen]   = useState(initial);
  const [selected, setSelected]   = useState<any>(null);
  const [subPage, setSubPage]     = useState("Übersicht");
  const [showForm, setShowForm]   = useState(false);
  const [editP, setEditP]         = useState<any>(null);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");
  const [formKey, setFormKey]     = useState(0);
  const [filter, setFilter]       = useState("");
  const [typFilter, setTypFilter] = useState("ALLE");
  const formRef  = useRef<HTMLFormElement>(null);
  const ortRef   = useRef<HTMLInputElement>(null);
  const [rollen, setRollen]       = useState<string[]>([]);
  const [typ, setTyp]             = useState<"PRIVATPERSON"|"FIRMA">("PRIVATPERSON");

  const openNew = () => {
    setEditP(null); setError(""); setRollen([]); setTyp("PRIVATPERSON");
    setFormKey(k=>k+1); setShowForm(true); setSelected(null);
  };
  const openEdit = (p:any) => {
    setEditP(p); setError(""); setRollen(p.rollen||[]); setTyp(p.typ||"PRIVATPERSON");
    setFormKey(k=>k+1); setShowForm(true);
  };

  const handleSave = async () => {
    if (!formRef.current) return;
    const fd = new FormData(formRef.current);
    const get = (k:string) => (fd.get(k) as string||"").trim();
    setSaving(true); setError("");
    try {
      const payload = {
        typ, rollen,
        name:      get("name"),
        vorname:   get("vorname"),
        firmaName: get("firmaName"),
        funktion:  get("funktion"),
        email:     get("email"),
        telefon:   get("telefon"),
        mobile:    get("mobile"),
        webseite:  get("webseite"),
        strasse:   get("strasse"),
        plz:       get("plz"),
        ort:       ortRef.current?.value || get("ort") || "",
        land:      get("land")||"CH",
        iban:      get("iban"),
        notizen:   get("notizen"),
        arbeitgeberId: get("arbeitgeberId")||null,
        aktiv:     true,
      };
      const url    = editP ? `/api/personen/${editP.id}` : "/api/personen";
      const method = editP ? "PUT" : "POST";
      const res    = await fetch(url,{method,headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      if (res.ok) {
        const saved = await res.json();
        if (editP) { setPersonen(ps=>ps.map(p=>p.id===saved.id?saved:p)); setSelected(saved); }
        else { setPersonen(ps=>[saved,...ps]); setSelected(saved); }
        setShowForm(false);
      } else {
        const e = await res.json().catch(()=>({}));
        setError(e.error||"Fehler beim Speichern.");
      }
    } catch { setError("Netzwerkfehler."); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id:string) => {
    if (!confirm("Person wirklich löschen?")) return;
    await fetch(`/api/personen/${id}`,{method:"DELETE"});
    setPersonen(ps=>ps.filter(p=>p.id!==id));
    if (selected?.id===id) setSelected(null);
  };

  const filtered = personen.filter(p=>{
    if (typFilter==="PRIVATPERSON" && p.typ!=="PRIVATPERSON") return false;
    if (typFilter==="FIRMA" && p.typ!=="FIRMA") return false;
    if (!filter) return true;
    const q = filter.toLowerCase();
    return [p.name,p.vorname,p.firmaName,p.email,p.ort,p.funktion].some(v=>v?.toLowerCase().includes(q));
  });

  const FRow = ({label,children}:{label:string;children:React.ReactNode}) => (
    <tr style={{ borderBottom:"1px solid #eee" }}>
      <td style={{ padding:"6px 12px", width:180, background:"#f4f4f4", fontSize:12, color:"#444", fontWeight:500, verticalAlign:"middle", whiteSpace:"nowrap" }}>{label}</td>
      <td style={{ padding:"4px 8px", background:"#fff" }}>{children}</td>
    </tr>
  );

  const renderDetail = () => {
    if (!selected) return (
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", color:"#bbb", flexDirection:"column", gap:8 }}>
        <div style={{ fontSize:32 }}>👤</div>
        <div style={{ fontSize:13 }}>Person aus der Liste wählen</div>
      </div>
    );
    const name = selected.typ==="FIRMA" ? selected.firmaName||selected.name : `${selected.vorname||""} ${selected.name}`.trim();
    return (
      <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
        {/* Sub-Sidebar */}
        <div style={{ width:170, background:C.sidebar, flexShrink:0, display:"flex", flexDirection:"column" }}>
          <div style={{ padding:"12px 10px", borderBottom:"1px solid #444" }}>
            <div style={{ fontSize:10, color:"#888", marginBottom:2 }}>{selected.typ==="FIRMA"?"Firma":"Person"}</div>
            <div style={{ fontSize:12, fontWeight:700, color:"#fff", lineHeight:1.3 }}>{name}</div>
            {selected.funktion && <div style={{ fontSize:10, color:"#aaa", marginTop:2 }}>{selected.funktion}</div>}
          </div>
          <nav style={{ flex:1, overflowY:"auto", paddingTop:4 }}>
            {SUB_PAGES.map(sp=>(
              <button key={sp} onClick={()=>setSubPage(sp)}
                style={{ display:"block", width:"100%", textAlign:"left", padding:"7px 12px", border:"none", background:subPage===sp?C.accent:"transparent", color:subPage===sp?"#fff":"#aaa", fontSize:11, fontWeight:subPage===sp?700:400, cursor:"pointer", borderLeft:subPage===sp?"3px solid #66ccee":"3px solid transparent" }}>
                {sp}
              </button>
            ))}
          </nav>
          <button onClick={()=>setSelected(null)} style={{ padding:"8px 10px", background:"none", border:"none", borderTop:"1px solid #444", color:"#888", fontSize:11, cursor:"pointer", textAlign:"left" }}>◀ Zurück zur Liste</button>
        </div>
        {/* Detail-Content */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
          <div style={{ background:C.accent, color:"#fff", padding:"7px 14px", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
            <span style={{ fontWeight:700, fontSize:13 }}>{name} · {subPage}</span>
            <div style={{ display:"flex", gap:6 }}>
              <button onClick={()=>openEdit(selected)} style={{ padding:"3px 10px", background:"rgba(255,255,255,0.2)", border:"none", color:"#fff", borderRadius:2, fontSize:11, cursor:"pointer" }}>✏ Bearbeiten</button>
              <button onClick={()=>handleDelete(selected.id)} style={{ padding:"3px 10px", background:"#c0392b", border:"none", color:"#fff", borderRadius:2, fontSize:11, cursor:"pointer" }}>Löschen</button>
            </div>
          </div>
          <div style={{ flex:1, overflowY:"auto", padding:14 }}>
            {subPage==="Übersicht" && (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                {[["Typ",selected.typ==="FIRMA"?"Firma":"Privatperson"],["Name",name],["Funktion",selected.funktion||"–"],["Email",selected.email||"–"],["Telefon",selected.telefon||"–"],["Ort",`${selected.plz||""} ${selected.ort||""}`.trim()||"–"]].map(([l,v])=>(
                  <div key={l} style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:3, padding:"8px 12px" }}>
                    <div style={{ fontSize:10, color:"#aaa", marginBottom:2 }}>{l}</div>
                    <div style={{ fontSize:12, color:"#333", fontWeight:500 }}>{v}</div>
                  </div>
                ))}
              </div>
            )}
            {subPage==="Persönliche Daten" && (
              <table style={{ width:"100%", borderCollapse:"collapse", background:"#fff", border:`1px solid ${C.border}`, borderRadius:3 }}>
                <tbody>
                  {[["Typ",selected.typ==="FIRMA"?"Firma":"Privatperson"],["Name",selected.name],["Vorname",selected.vorname||"–"],["Firmenname",selected.firmaName||"–"],["Funktion",selected.funktion||"–"]].map(([l,v])=>(
                    <tr key={l} style={{ borderBottom:"1px solid #eee" }}>
                      <td style={{ padding:"6px 12px", width:160, background:"#f4f4f4", fontSize:12, fontWeight:500, color:"#555" }}>{l}</td>
                      <td style={{ padding:"6px 12px", fontSize:12 }}>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {subPage==="Kommunikation" && (
              <table style={{ width:"100%", borderCollapse:"collapse", background:"#fff", border:`1px solid ${C.border}`, borderRadius:3 }}>
                <tbody>
                  {[["Telefon",selected.telefon||"–"],["Mobile",selected.mobile||"–"],["Email",selected.email||"–"],["Webseite",selected.webseite||"–"]].map(([l,v])=>(
                    <tr key={l} style={{ borderBottom:"1px solid #eee" }}>
                      <td style={{ padding:"6px 12px", width:160, background:"#f4f4f4", fontSize:12, fontWeight:500, color:"#555" }}>{l}</td>
                      <td style={{ padding:"6px 12px", fontSize:12 }}>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {subPage==="Adressen" && (
              <table style={{ width:"100%", borderCollapse:"collapse", background:"#fff", border:`1px solid ${C.border}`, borderRadius:3 }}>
                <tbody>
                  {[["Strasse",selected.strasse||"–"],["PLZ",selected.plz||"–"],["Ort",selected.ort||"–"],["Land",selected.land||"–"]].map(([l,v])=>(
                    <tr key={l} style={{ borderBottom:"1px solid #eee" }}>
                      <td style={{ padding:"6px 12px", width:160, background:"#f4f4f4", fontSize:12, fontWeight:500, color:"#555" }}>{l}</td>
                      <td style={{ padding:"6px 12px", fontSize:12 }}>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {subPage==="Rollen" && (
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {(selected.rollen||[]).length===0 && <span style={{ color:"#aaa", fontSize:12 }}>Keine Rollen zugewiesen</span>}
                {(selected.rollen||[]).map((r:string)=>(
                  <span key={r} style={{ padding:"4px 12px", background:(ROLLEN_COLORS[r]||"#666")+"22", color:ROLLEN_COLORS[r]||"#666", borderRadius:3, fontSize:12, fontWeight:600 }}>{r}</span>
                ))}
              </div>
            )}
            {subPage==="Notizen" && <div style={{ fontSize:12, color:"#555", whiteSpace:"pre-wrap" }}>{selected.notizen||"Keine Notizen"}</div>}
            {(subPage==="Dokumente") && <div style={{ color:"#aaa", fontSize:12, textAlign:"center", padding:40 }}>📄 Wird in einem nächsten Schritt implementiert.</div>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", overflow:"hidden", fontFamily:"Arial, Helvetica, sans-serif" }}>

      {/* ── Header ── */}
      <div style={{ background:C.white, borderBottom:`1px solid ${C.border}`, padding:"8px 14px", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ fontSize:15, fontWeight:800, color:"#333" }}>Kontakte</span>
          <span style={{ fontSize:11, color:"#aaa" }}>{personen.length} Einträge</span>
          {["ALLE","PRIVATPERSON","FIRMA"].map(t=>(
            <button key={t} onClick={()=>setTypFilter(t)}
              style={{ padding:"3px 10px", border:`1px solid ${typFilter===t?C.accent:"#ddd"}`, borderRadius:2, background:typFilter===t?C.accent:"#fff", color:typFilter===t?"#fff":"#666", fontSize:11, cursor:"pointer", fontWeight:typFilter===t?700:400 }}>
              {t==="ALLE"?"Alle":t==="PRIVATPERSON"?"Personen":"Firmen"}
            </button>
          ))}
          <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Suche..."
            style={{ padding:"3px 8px", border:"1px solid #ddd", borderRadius:2, fontSize:12, width:180, outline:"none" }} />
        </div>
        <button onClick={openNew} style={{ padding:"5px 14px", background:C.accent, color:"#fff", border:"none", borderRadius:3, fontSize:12, fontWeight:700, cursor:"pointer" }}>+ Neue Person</button>
      </div>

      {/* ── Body ── */}
      <div style={{ flex:1, display:"flex", overflow:"hidden" }}>

        {/* Liste */}
        <div style={{ width:selected&&!showForm?280:showForm?260:"100%", flexShrink:0, display:"flex", flexDirection:"column", borderRight:`1px solid ${C.border}`, overflow:"hidden", background:"#fff" }}>
          <div style={{ flex:1, overflowY:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ background:"#e8e8e8", borderBottom:"2px solid #ccc" }}>
                  <th style={{ padding:"6px 10px", textAlign:"left", fontSize:11, color:"#555", fontWeight:700 }}>Name / Firma</th>
                  {!selected&&!showForm && <>
                    <th style={{ padding:"6px 10px", textAlign:"left", fontSize:11, color:"#555", fontWeight:700 }}>Funktion</th>
                    <th style={{ padding:"6px 10px", textAlign:"left", fontSize:11, color:"#555", fontWeight:700 }}>Ort</th>
                    <th style={{ padding:"6px 10px", textAlign:"left", fontSize:11, color:"#555", fontWeight:700 }}>Email</th>
                  </>}
                  <th style={{ padding:"6px 8px", width:50 }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p,i)=>{
                  const isSel = selected?.id===p.id;
                  const name  = p.typ==="FIRMA"?p.firmaName||p.name:`${p.vorname||""} ${p.name}`.trim();
                  return (
                    <tr key={p.id} onClick={()=>{setSelected(p);setSubPage("Übersicht");setShowForm(false);}}
                      style={{ borderBottom:"1px solid #f0f0f0", cursor:"pointer", background:isSel?"#e8f4ff":i%2===0?"#fff":"#fafafa", borderLeft:isSel?`3px solid ${C.accent}`:"3px solid transparent" }}
                      onMouseEnter={e=>{if(!isSel)(e.currentTarget as HTMLElement).style.background="#f5f5f5";}}
                      onMouseLeave={e=>{if(!isSel)(e.currentTarget as HTMLElement).style.background=i%2===0?"#fff":"#fafafa";}}>
                      <td style={{ padding:"7px 10px" }}>
                        <div style={{ fontSize:12, fontWeight:600, color:"#222" }}>{name}</div>
                        <div style={{ fontSize:10, color:"#aaa" }}>{p.typ==="FIRMA"?"🏢 Firma":"👤 Person"}</div>
                      </td>
                      {!selected&&!showForm && <>
                        <td style={{ padding:"7px 10px", fontSize:12, color:"#666" }}>{p.funktion||"–"}</td>
                        <td style={{ padding:"7px 10px", fontSize:12, color:"#666" }}>{p.ort||"–"}</td>
                        <td style={{ padding:"7px 10px", fontSize:12, color:"#666" }}>{p.email||"–"}</td>
                      </>}
                      <td style={{ padding:"4px 8px" }} onClick={e=>e.stopPropagation()}>
                        <div style={{ display:"flex", gap:3 }}>
                          <button onClick={()=>openEdit(p)} style={{ padding:"2px 6px", fontSize:10, background:"#f0f0f0", border:"1px solid #ddd", borderRadius:2, cursor:"pointer" }}>✏</button>
                          <button onClick={()=>handleDelete(p.id)} style={{ padding:"2px 6px", fontSize:10, background:"#fee2e2", border:"1px solid #fca5a5", borderRadius:2, cursor:"pointer", color:"#c0392b" }}>✕</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail oder Formular */}
        {!showForm && renderDetail()}

        {showForm && (
          <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", background:C.bg }}>
            <div style={{ background:C.accent, color:"#fff", padding:"7px 14px", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
              <span style={{ fontWeight:700, fontSize:13 }}>{editP?"Person bearbeiten":"Person erfassen"}</span>
              <button onClick={()=>setShowForm(false)} style={{ background:"none", border:"none", color:"#fff", fontSize:18, cursor:"pointer" }}>×</button>
            </div>
            <div style={{ flex:1, overflowY:"auto", padding:14 }}>
              <form key={formKey} ref={formRef} onSubmit={e=>e.preventDefault()}
                style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:3, overflow:"hidden" }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <tbody>
                    <FRow label="Typ">
                      <div style={{ display:"flex", gap:6 }}>
                        {(["PRIVATPERSON","FIRMA"] as const).map(t=>(
                          <button type="button" key={t} onClick={()=>setTyp(t)}
                            style={{ padding:"4px 14px", border:`1px solid ${typ===t?C.accent:"#ccc"}`, borderRadius:2, background:typ===t?C.accent:"#fff", color:typ===t?"#fff":"#555", fontSize:12, cursor:"pointer", fontWeight:typ===t?700:400 }}>
                            {t==="PRIVATPERSON"?"Privatperson":"Firma"}
                          </button>
                        ))}
                      </div>
                    </FRow>
                    <FRow label="Name *"><F name="name" dv={editP?.name||""} ph="Nachname / Firmenname" ti={1}/></FRow>
                    {typ==="PRIVATPERSON" && <FRow label="Vorname"><F name="vorname" dv={editP?.vorname||""} ph="Vorname" ti={2}/></FRow>}
                    {typ==="FIRMA" && <FRow label="Firmenname"><F name="firmaName" dv={editP?.firmaName||""} ph="Firma AG" ti={2}/></FRow>}
                    <FRow label="Funktion / Rolle"><F name="funktion" dv={editP?.funktion||""} ph="z.B. Projektleiterin" ti={3}/></FRow>
                    {typ==="PRIVATPERSON" && (
                      <FRow label="Arbeitgeber">
                        <div style={{ position:"relative", width:"100%" }}>
                          <select name="arbeitgeberId" defaultValue={editP?.arbeitgeberId||""}
                            onFocus={e=>(e.target as HTMLSelectElement).style.border="1px solid #0099cc"}
                            onBlur={e=>(e.target as HTMLSelectElement).style.border="1px solid #ccc"}
                            style={{ width:"100%", padding:"4px 8px", paddingRight:28, border:"1px solid #ccc", borderRadius:2, fontSize:12, background:"#fff", appearance:"none", WebkitAppearance:"none", outline:"none" }}>
                            <option value="">— Auswählen —</option>
                            {firmen.map((f:any)=><option key={f.id} value={f.id}>{f.firmaName||f.name}</option>)}
                          </select>
                          <span onMouseDown={e=>{e.preventDefault();const s=e.currentTarget.previousElementSibling as HTMLSelectElement;s?.focus();s?.showPicker?.();}}
                            style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", pointerEvents:"all", cursor:"pointer", fontSize:10, color:"#555", userSelect:"none" }}>▼</span>
                        </div>
                      </FRow>
                    )}
                    <FRow label="Rollen">
                      <div style={{ display:"flex", gap:6, flexWrap:"wrap", padding:"4px 0" }}>
                        {ROLLEN.map(r=>(
                          <button type="button" key={r} onClick={()=>setRollen(rs=>rs.includes(r)?rs.filter(x=>x!==r):[...rs,r])}
                            style={{ padding:"3px 10px", border:`1px solid ${rollen.includes(r)?(ROLLEN_COLORS[r]||C.accent):"#ddd"}`, borderRadius:2, background:rollen.includes(r)?(ROLLEN_COLORS[r]||C.accent)+"22":"#fff", color:rollen.includes(r)?ROLLEN_COLORS[r]||C.accent:"#888", fontSize:11, cursor:"pointer", fontWeight:rollen.includes(r)?700:400 }}>
                            {r}
                          </button>
                        ))}
                      </div>
                    </FRow>
                    <FRow label="Email"><F name="email" type="email" dv={editP?.email||""} ph="name@firma.ch" ti={4}/></FRow>
                    <FRow label="Telefon"><F name="telefon" dv={editP?.telefon||""} ph="+41 56 xxx xx xx" ti={5}/></FRow>
                    <FRow label="Mobile"><F name="mobile" dv={editP?.mobile||""} ph="+41 79 xxx xx xx" ti={6}/></FRow>
                    <FRow label="Webseite"><F name="webseite" dv={editP?.webseite||""} ph="www.firma.ch" ti={7}/></FRow>
                    <FRow label="Strasse"><F name="strasse" dv={editP?.strasse||""} ti={8}/></FRow>
                    <FRow label="PLZ / Ort"><PlzField dPlz={editP?.plz||""} dOrt={editP?.ort||""} ortRef={ortRef}/></FRow>
                    <FRow label="Land">
                      <div style={{ position:"relative", width:"100%" }}>
                        <select name="land" defaultValue={editP?.land||"CH"}
                          onFocus={e=>(e.target as HTMLSelectElement).style.border="1px solid #0099cc"}
                          onBlur={e=>(e.target as HTMLSelectElement).style.border="1px solid #ccc"}
                          style={{ width:"100%", padding:"4px 8px", paddingRight:28, border:"1px solid #ccc", borderRadius:2, fontSize:12, background:"#fff", appearance:"none", WebkitAppearance:"none", outline:"none" }}>
                          {[["CH","Schweiz"],["DE","Deutschland"],["AT","Österreich"],["IT","Italien"],["FR","Frankreich"]].map(([v,l])=><option key={v} value={v}>{v} — {l}</option>)}
                        </select>
                        <span onMouseDown={e=>{e.preventDefault();const s=e.currentTarget.previousElementSibling as HTMLSelectElement;s?.focus();s?.showPicker?.();}}
                          style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", pointerEvents:"all", cursor:"pointer", fontSize:10, color:"#555", userSelect:"none" }}>▼</span>
                      </div>
                    </FRow>
                    <FRow label="IBAN"><F name="iban" dv={editP?.iban||""} ph="CH00 0000 0000 0000 0000 0" ti={9}/></FRow>
                    <FRow label="Notizen">
                      <textarea name="notizen" defaultValue={editP?.notizen||""} rows={3}
                        style={{ width:"100%", padding:"4px 8px", border:"1px solid #ccc", borderRadius:2, fontSize:12, fontFamily:"inherit", resize:"vertical", boxSizing:"border-box" as const, outline:"none" }}
                        onFocus={e=>(e.target as HTMLTextAreaElement).style.border="1px solid #0099cc"}
                        onBlur={e=>(e.target as HTMLTextAreaElement).style.border="1px solid #ccc"}/>
                    </FRow>
                  </tbody>
                </table>
              </form>
            </div>
            <div style={{ padding:"10px 14px", borderTop:`1px solid ${C.border}`, background:"#fff", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
              <span style={{ fontSize:12, color:"#c0392b", fontWeight:600 }}>{error?`⚠ ${error}`:""}</span>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={()=>setShowForm(false)} style={{ padding:"5px 14px", border:`1px solid ${C.border}`, borderRadius:3, background:"#fff", cursor:"pointer", fontSize:12 }}>Abbrechen</button>
                <button onClick={handleSave} disabled={saving}
                  style={{ padding:"6px 22px", background:saving?"#999":C.accent, color:"#fff", border:"none", borderRadius:3, fontWeight:700, fontSize:13, cursor:saving?"not-allowed":"pointer" }}>
                  {saving?"Wird gespeichert...":"Speichern"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
