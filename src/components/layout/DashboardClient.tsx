"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { Session } from "next-auth";
import Link from "next/link";

// ─── Immopac-inspired Design ─────────────────────────────────────────────────
const C = {
  topbar:     "#1a1a1a",
  sidebar:    "#2d2d2d",
  sidebarHov: "#3a3a3a",
  sidebarAct: "#444444",
  accent:     "#0099cc",
  accentHov:  "#007aaa",
  bg:         "#f0f0f0",
  white:      "#ffffff",
  text:       "#333333",
  textLight:  "#666666",
  border:     "#cccccc",
};

const NAV_ITEMS = [
  { href: "/dashboard/projekte",           label: "Projekte",           icon: "🏗" },
  { href: "/dashboard/kostenplanung",      label: "Kostenplanung",      icon: "💰" },
  { href: "/dashboard/ausschreibung",      label: "Ausschreibung",      icon: "📋" },
  { href: "/dashboard/termine",            label: "Termine",            icon: "📅" },
  { href: "/dashboard/risiken",            label: "Risiken & Chancen",  icon: "⚡" },
];
const KONTAKT_ITEMS = [
  { href: "/dashboard/personen",           label: "Kontakte",           icon: "👥" },
];
const ADMIN_ITEMS = [
  { href: "/dashboard/benutzerverwaltung", label: "Benutzerverwaltung", icon: "🔐" },
];

const ROLLE_LABEL: Record<string, string> = {
  ADMINISTRATOR: "Administrator", PROJEKTLEITER: "Projektleiter",
  CONTROLLING: "Controlling", EXTERNER_PLANER: "Ext. Planer", BETRACHTER: "Betrachter",
};

interface Props { session: Session; children: React.ReactNode; }

export function DashboardClient({ session, children }: Props) {
  const pathname = usePathname();
  const user     = session.user as any;
  const rolle    = user?.rolle || "BETRACHTER";
  const isAdmin  = rolle === "ADMINISTRATOR";
  const [open, setOpen] = useState(true);

  const initials = (user?.name || "??").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  const NavLink = ({ href, label, icon }: { href: string; label: string; icon: string }) => {
    const active = pathname.startsWith(href);
    return (
      <Link href={href} style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: open ? "8px 14px" : "8px 0", justifyContent: open ? "flex-start" : "center",
        marginBottom: 1, color: active ? C.white : "#aaaaaa",
        textDecoration: "none", fontWeight: active ? 600 : 400, fontSize: 12,
        background: active ? C.accent : "transparent",
        borderLeft: active ? "3px solid #66ccee" : "3px solid transparent",
        transition: "all 0.1s",
      }}
        onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = C.sidebarHov; (e.currentTarget as HTMLElement).style.color = C.white; }}}
        onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#aaaaaa"; }}}
      >
        <span style={{ fontSize: 14, width: 18, textAlign: "center", flexShrink: 0 }}>{icon}</span>
        {open && <span>{label}</span>}
      </Link>
    );
  };

  const Sep = ({ label }: { label?: string }) => (
    <div style={{ padding: open ? "10px 14px 4px" : "10px 0 4px", textAlign: open ? "left" : "center" }}>
      {open && label && <span style={{ fontSize: 9, color: "#666", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700 }}>{label}</span>}
      {!label && <div style={{ borderTop: "1px solid #444", margin: "0 8px" }} />}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", fontFamily: "Arial, Helvetica, sans-serif", fontSize: 13 }}>

      {/* ── Topbar ─────────────────────────────────────────────────────────── */}
      <header style={{ height: 40, background: C.topbar, color: C.white, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 12px", flexShrink: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="https://spiderfrog.ch/wp-content/uploads/Subless_White.png" alt="spifroca"
            style={{ height: 20, objectFit: "contain" }}
            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
          <span style={{ fontWeight: 700, fontSize: 13, color: C.accent, letterSpacing: "0.5px" }}>spifroca</span>
          <span style={{ color: "#666", fontSize: 11 }}>Bauprojektmanagement</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 11, color: "#999" }}>{user?.email}</span>
          <span style={{ fontSize: 11, background: "#333", padding: "2px 8px", borderRadius: 3, color: "#aaa" }}>{ROLLE_LABEL[rolle] || rolle}</span>
          <button onClick={() => signOut({ callbackUrl: "/auth/login" })}
            style={{ fontSize: 11, color: "#aaa", cursor: "pointer", background: "none", border: "1px solid #555", borderRadius: 3, padding: "2px 8px" }}>
            Abmelden
          </button>
        </div>
      </header>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ── Sidebar ──────────────────────────────────────────────────────── */}
        <aside style={{ width: open ? 200 : 44, background: C.sidebar, display: "flex", flexDirection: "column", transition: "width 0.15s", flexShrink: 0 }}>

          {/* Toggle */}
          <div style={{ height: 32, display: "flex", alignItems: "center", justifyContent: open ? "flex-end" : "center", padding: "0 8px", borderBottom: "1px solid #444" }}>
            <button onClick={() => setOpen(!open)} style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: 12, padding: 4 }}>
              {open ? "◀" : "▶"}
            </button>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, overflowY: "auto", paddingTop: 6 }}>
            <Sep label="Module" />
            {NAV_ITEMS.map(i => <NavLink key={i.href} {...i} />)}
            <Sep />
            <Sep label="Kontakte" />
            {KONTAKT_ITEMS.map(i => <NavLink key={i.href} {...i} />)}
            {isAdmin && (<>
              <Sep />
              <Sep label="Admin" />
              {ADMIN_ITEMS.map(i => <NavLink key={i.href} {...i} />)}
            </>)}
          </nav>

          {/* User */}
          <div style={{ padding: "10px 10px", borderTop: "1px solid #444", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: C.white, flexShrink: 0 }}>
              {initials}
            </div>
            {open && (
              <div style={{ overflow: "hidden" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.white, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.name}</div>
                <div style={{ fontSize: 10, color: "#888" }}>{user?.email}</div>
              </div>
            )}
          </div>
        </aside>

        {/* ── Content ──────────────────────────────────────────────────────── */}
        <main style={{ flex: 1, overflow: "auto", background: C.bg }}>
          {children}
        </main>
      </div>
    </div>
  );
}
