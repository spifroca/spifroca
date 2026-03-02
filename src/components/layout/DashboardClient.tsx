"use client";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import type { Session } from "next-auth";
import Link from "next/link";

const NAV_ITEMS = [
  { href: "/dashboard/projekte",          label: "Projekte",           icon: "🏠" },
  { href: "/dashboard/kostenplanung",     label: "Kostenplanung",      icon: "💰" },
  { href: "/dashboard/ausschreibung",     label: "Ausschreibung",      icon: "📋" },
  { href: "/dashboard/termine",           label: "Termine",            icon: "📅" },
  { href: "/dashboard/risiken",           label: "Risiken & Chancen",  icon: "⚡" },
  { href: "/dashboard/personen",          label: "Personen",           icon: "👥" },
];

const ADMIN_NAV = [
  { href: "/dashboard/benutzerverwaltung", label: "Benutzerverwaltung", icon: "👥" },
];

const ROLLE_COLOR: Record<string, string> = {
  ADMINISTRATOR:    "#c0392b",
  PROJEKTLEITER:    "#3b82f6",
  CONTROLLING:      "#8b5cf6",
  EXTERNER_PLANER:  "#f59e0b",
  BETRACHTER:       "#6b7280",
};

const ROLLE_LABEL: Record<string, string> = {
  ADMINISTRATOR:   "Administrator",
  PROJEKTLEITER:   "Projektleiter",
  CONTROLLING:     "Controlling",
  EXTERNER_PLANER: "Externer Planer",
  BETRACHTER:      "Betrachter",
};

interface Props {
  session: Session;
  children: React.ReactNode;
}

export function DashboardClient({ session, children }: Props) {
  const pathname = usePathname();
  const router   = useRouter();
  const user     = session.user as any;
  const rolle    = user?.rolle || "BETRACHTER";
  const isAdmin  = rolle === "ADMINISTRATOR";
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const initials = (user?.name || "??").split(" ").map((n: string) => n[0]).join("").toUpperCase();

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", overflow:"hidden", fontFamily:"Segoe UI, Helvetica Neue, Arial, sans-serif" }}>

      {/* ── Topbar ─────────────────────────────────────────────────────────── */}
      <header style={{ height:32, background:"#c0392b", color:"#fff", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 16px", flexShrink:0, zIndex:50 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          {/* Spiderfrog Logo */}
          <img
            src="https://spiderfrog.ch/wp-content/uploads/Subless_White.png"
            alt="spifroca"
            style={{ height:22, width:"auto", objectFit:"contain" }}
            onError={(e) => { (e.target as HTMLImageElement).style.display="none"; }}
          />
          <span style={{ fontWeight:800, fontSize:13, letterSpacing:"0.5px", color:"#fff" }}>spifroca</span>
          <span style={{ opacity:.5, fontSize:12 }}>Bauprojektmanagement</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <span style={{ fontSize:11, opacity:.8 }}>👤 {user?.name}</span>
          <span style={{ fontSize:11, opacity:.6, cursor:"pointer" }}>🔄 Visumsvertretung</span>
          <button onClick={() => signOut({ callbackUrl:"/auth/login" })} style={{ fontSize:11, opacity:.7, cursor:"pointer", background:"none", border:"none", color:"#fff" }}>
            🔒 Abmelden
          </button>
        </div>
      </header>

      <div style={{ display:"flex", flex:1, overflow:"hidden" }}>

        {/* ── Sidebar ──────────────────────────────────────────────────────── */}
        <aside style={{ width: sidebarOpen ? 220 : 52, background:"#1a1d26", borderRight:"1px solid #2a2d3a", display:"flex", flexDirection:"column", transition:"width 0.2s", flexShrink:0, overflow:"hidden" }}>

          {/* Toggle */}
          <div style={{ padding:"10px 12px", display:"flex", justifyContent: sidebarOpen?"flex-end":"center", borderBottom:"1px solid #2a2d3a" }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background:"none", border:"none", color:"#666", cursor:"pointer", fontSize:16, padding:2 }}>
              {sidebarOpen ? "◀" : "▶"}
            </button>
          </div>

          {/* Nav Items */}
          <nav style={{ padding:"8px 8px", flex:1 }}>
            {NAV_ITEMS.map(item => {
              const active = pathname.startsWith(item.href);
              return (
                <Link key={item.href} href={item.href}
                  style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 10px", marginBottom:2, borderRadius:7, background: active?"#c0392b":"transparent", color: active?"#fff":"#9ca3af", textDecoration:"none", fontWeight: active?700:400, fontSize:13, whiteSpace:"nowrap", overflow:"hidden", transition:"all 0.1s" }}
                  onMouseEnter={e => { if(!active)(e.currentTarget as HTMLElement).style.background="#2a2d3a"; }}
                  onMouseLeave={e => { if(!active)(e.currentTarget as HTMLElement).style.background="transparent"; }}
                >
                  <span style={{ fontSize:16, flexShrink:0 }}>{item.icon}</span>
                  {sidebarOpen && <span style={{ overflow:"hidden", textOverflow:"ellipsis" }}>{item.label}</span>}
                </Link>
              );
            })}

            {isAdmin && (
              <>
                {sidebarOpen && <div style={{ fontSize:10, color:"#444", textTransform:"uppercase", letterSpacing:"0.5px", padding:"12px 10px 4px" }}>Administration</div>}
                {ADMIN_NAV.map(item => {
                  const active = pathname.startsWith(item.href);
                  return (
                    <Link key={item.href} href={item.href}
                      style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 10px", marginBottom:2, borderRadius:7, background: active?"#c0392b":"transparent", color: active?"#fff":"#9ca3af", textDecoration:"none", fontWeight: active?700:400, fontSize:13, whiteSpace:"nowrap", overflow:"hidden" }}
                      onMouseEnter={e => { if(!active)(e.currentTarget as HTMLElement).style.background="#2a2d3a"; }}
                      onMouseLeave={e => { if(!active)(e.currentTarget as HTMLElement).style.background="transparent"; }}
                    >
                      <span style={{ fontSize:16, flexShrink:0 }}>{item.icon}</span>
                      {sidebarOpen && <span>{item.label}</span>}
                    </Link>
                  );
                })}
              </>
            )}
          </nav>

          {/* User info */}
          {sidebarOpen && (
            <div style={{ padding:"12px 14px", borderTop:"1px solid #2a2d3a" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:32, height:32, borderRadius:"50%", background:(ROLLE_COLOR[rolle]||"#666")+"33", border:`1.5px solid ${ROLLE_COLOR[rolle]||"#666"}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, color:ROLLE_COLOR[rolle]||"#666", flexShrink:0 }}>
                  {initials}
                </div>
                <div style={{ overflow:"hidden" }}>
                  <div style={{ fontSize:12, fontWeight:700, color:"#ddd", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user?.name}</div>
                  <div style={{ fontSize:10, color:ROLLE_COLOR[rolle]||"#666" }}>{ROLLE_LABEL[rolle]||rolle}</div>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* ── Main Content ─────────────────────────────────────────────────── */}
        <main style={{ flex:1, overflow:"auto", background:"#f5f5f5" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
