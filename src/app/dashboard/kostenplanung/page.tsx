import { prisma } from "@/lib/prisma";

export default async function KostenplanungPage() {
  const projekte = await prisma.projekt.findMany({
    include: { kostenstellen: true },
    orderBy: { nummer: "asc" },
  });

  const total     = projekte.reduce((s, p) => s + (p.budgetTotal||0), 0);
  const verbraucht = projekte.reduce((s, p) => s + (p.budgetVerbraucht||0), 0);
  const fmt = (n: number) => new Intl.NumberFormat("de-CH", { style:"currency", currency:"CHF", maximumFractionDigits:0 }).format(n);
  const pct = (v: number, t: number) => t > 0 ? Math.min(100, Math.round(v / t * 100)) : 0;

  return (
    <div style={{ padding:24, fontFamily:"Segoe UI, sans-serif" }}>
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:18, fontWeight:700, color:"#333", marginBottom:4 }}>Kostenplanung</h1>
        <p style={{ fontSize:12, color:"#999" }}>Budgets und Kostenübersicht aller Projekte</p>
      </div>

      {/* KPI */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:24 }}>
        {[
          { label:"Gesamtbudget",  value:fmt(total),            color:"#3b82f6" },
          { label:"Verbraucht",    value:fmt(verbraucht),       color:"#f59e0b" },
          { label:"Verfügbar",     value:fmt(total-verbraucht), color:"#22c55e" },
        ].map(k => (
          <div key={k.label} style={{ background:"#fff", border:`1px solid ${k.color}44`, borderRadius:10, padding:18 }}>
            <div style={{ fontSize:11, color:"#999", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:6 }}>{k.label}</div>
            <div style={{ fontSize:24, fontWeight:800, color:k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Projekte */}
      <div style={{ background:"#fff", border:"1px solid #e0e0e0", borderRadius:10, overflow:"hidden" }}>
        <div style={{ padding:"12px 16px", borderBottom:"1px solid #eee", fontWeight:700, fontSize:14 }}>Kostenübersicht nach Projekt</div>
        {projekte.map(p => {
          const prog = pct(p.budgetVerbraucht||0, p.budgetTotal||0);
          return (
            <div key={p.id} style={{ padding:"12px 16px", borderTop:"1px solid #eee" }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <div>
                  <span style={{ fontWeight:700, color:"#c0392b", marginRight:8, fontSize:12 }}>{p.nummer}</span>
                  <span style={{ fontSize:13 }}>{p.name}</span>
                </div>
                <div style={{ fontSize:12, color:"#666", whiteSpace:"nowrap" }}>{fmt(p.budgetVerbraucht||0)} / {fmt(p.budgetTotal||0)}</div>
              </div>
              <div style={{ height:8, background:"#f0f0f0", borderRadius:4 }}>
                <div style={{ width:`${prog}%`, height:"100%", background: prog>90?"#ef4444":prog>70?"#f59e0b":"#22c55e", borderRadius:4 }} />
              </div>
              <div style={{ fontSize:11, color:"#999", marginTop:3 }}>{prog}% verbraucht · Verfügbar: {fmt((p.budgetTotal||0)-(p.budgetVerbraucht||0))}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
