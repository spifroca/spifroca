import { prisma } from "@/lib/prisma";

const W_LABEL: Record<string, string> = { NIEDRIG:"Niedrig", MITTEL:"Mittel", HOCH:"Hoch" };
const A_LABEL: Record<string, string> = { GERING:"Gering", ERHEBLICH:"Erheblich", KRITISCH:"Kritisch" };
const W_COLOR: Record<string, string> = { NIEDRIG:"#22c55e", MITTEL:"#f59e0b", HOCH:"#ef4444" };
const A_COLOR: Record<string, string> = { GERING:"#22c55e", ERHEBLICH:"#f59e0b", KRITISCH:"#ef4444" };

export default async function RisikenPage() {
  const risiken = await prisma.risiko.findMany({
    include: { projekt: { select: { nummer:true, name:true } } },
    orderBy: [{ auswirkung:"desc" }, { wahrscheinlichkeit:"desc" }],
  });

  return (
    <div style={{ padding:24, fontFamily:"Segoe UI, sans-serif" }}>
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:18, fontWeight:700, color:"#333", marginBottom:4 }}>Risiken & Chancen</h1>
        <p style={{ fontSize:12, color:"#999" }}>Risikoregister aller Projekte nach Priorität</p>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:24 }}>
        {[
          { label:"Kritisch", count: risiken.filter(r=>r.auswirkung==="KRITISCH").length, color:"#ef4444" },
          { label:"Erheblich",count: risiken.filter(r=>r.auswirkung==="ERHEBLICH").length,color:"#f59e0b" },
          { label:"Gering",   count: risiken.filter(r=>r.auswirkung==="GERING").length,   color:"#22c55e" },
        ].map(k => (
          <div key={k.label} style={{ background:"#fff", border:`1px solid ${k.color}44`, borderRadius:10, padding:16, textAlign:"center" }}>
            <div style={{ fontSize:32, fontWeight:900, color:k.color }}>{k.count}</div>
            <div style={{ fontSize:12, color:"#999" }}>Auswirkung: {k.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background:"#fff", border:"1px solid #e0e0e0", borderRadius:10, overflow:"hidden" }}>
        <div style={{ padding:"12px 16px", borderBottom:"1px solid #eee", fontWeight:700, fontSize:14, display:"flex", justifyContent:"space-between" }}>
          <span>Risikoregister</span>
          <span style={{ fontSize:12, color:"#999" }}>{risiken.length} Einträge</span>
        </div>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
          <thead>
            <tr style={{ background:"#f5f5f5" }}>
              {["Projekt","Titel","Kategorie","Wahrscheinlichkeit","Auswirkung","Massnahme"].map(h => (
                <th key={h} style={{ padding:"8px 12px", textAlign:"left", fontWeight:600, color:"#555", borderBottom:"1px solid #e0e0e0" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {risiken.map((r,i) => (
              <tr key={r.id} style={{ borderBottom:"1px solid #f0f0f0", background: i%2===0?"#fff":"#fafafa" }}>
                <td style={{ padding:"9px 12px", color:"#c0392b", fontWeight:700, whiteSpace:"nowrap" }}>{r.projekt.nummer}</td>
                <td style={{ padding:"9px 12px", fontWeight:600 }}>{r.titel}</td>
                <td style={{ padding:"9px 12px", color:"#666" }}>{r.kategorie}</td>
                <td style={{ padding:"9px 12px" }}>
                  <span style={{ background:(W_COLOR[r.wahrscheinlichkeit]||"#666")+"22", color:W_COLOR[r.wahrscheinlichkeit]||"#666", padding:"2px 8px", borderRadius:3, fontWeight:600 }}>
                    {W_LABEL[r.wahrscheinlichkeit]}
                  </span>
                </td>
                <td style={{ padding:"9px 12px" }}>
                  <span style={{ background:(A_COLOR[r.auswirkung]||"#666")+"22", color:A_COLOR[r.auswirkung]||"#666", padding:"2px 8px", borderRadius:3, fontWeight:600 }}>
                    {A_LABEL[r.auswirkung]}
                  </span>
                </td>
                <td style={{ padding:"9px 12px", color:"#777", maxWidth:240, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.massnahme||"–"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
