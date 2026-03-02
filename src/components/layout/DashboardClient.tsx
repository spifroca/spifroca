"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { Session } from "next-auth";
import Link from "next/link";

// ─── Real North Farben ───────────────────────────────────────────────────────
const RN = {
  navy:      "#1C2B3A",
  navyDark:  "#111d28",
  navyLight: "#243447",
  gold:      "#C8A96E",
  goldDark:  "#b8935a",
  bg:        "#F5F4F2",
  white:     "#ffffff",
};

const NAV_ITEMS = [
  { href: "/dashboard/projekte",           label: "Projekte",           icon: "🏗️" },
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

const ROLLE_COLOR: Record<string, string> = {
  ADMINISTRATOR:   "#C8A96E",
  PROJEKTLEITER:   "#3b82f6",
  CONTROLLING:     "#8b5cf6",
  EXTERNER_PLANER: "#f59e0b",
  BETRACHTER:      "#6b7280",
};

const ROLLE_LABEL: Record<string, string> = {
  ADMINISTRATOR:   "Administrator",
  PROJEKTLEITER:   "Projektleiter",
  CONTROLLING:     "Controlling",
  EXTERNER_PLANER: "Externer Planer",
  BETRACHTER:      "Betrachter",
};

interface Props { session: Session; children: React.ReactNode; }

export function DashboardClient({ session, children }: Props) {
  const pathname = usePathname();
  const user     = session.user as any;
  const rolle    = user?.rolle || "BETRACHTER";
  const isAdmin  = rolle === "ADMINISTRATOR";
  const [open, setOpen] = useState(true);

  const initials = (user?.name || "??")
    .split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  const NavLink = ({ href, label, icon }: { href: string; label: string; icon: string }) => {
    const active = pathname.startsWith(href);
    return (
      <Link href={href} style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: open ? "9px 12px" : "9px 0",
        justifyContent: open ? "flex-start" : "center",
        marginBottom: 2, borderRadius: 7,
        background: active ? RN.gold : "transparent",
        color: active ? RN.navy : "#94a3b8",
        textDecoration: "none",
        fontWeight: active ? 700 : 400,
        fontSize: 13, whiteSpace: "nowrap",
        borderLeft: active ? `3px solid ${RN.goldDark}` : "3px solid transparent",
        transition: "all 0.15s",
      }}
        onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = RN.navyLight; (e.currentTarget as HTMLElement).style.color = RN.white; }}}
        onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#94a3b8"; }}}
      >
        <span style={{ fontSize: 16, flexShrink: 0, width: 20, textAlign: "center" }}>{icon}</span>
        {open && <span>{label}</span>}
      </Link>
    );
  };

  const SectionLabel = ({ label }: { label: string }) => open ? (
    <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: "1px", padding: "4px 12px 6px", fontWeight: 700 }}>{label}</div>
  ) : null;

  const Divider = () => (
    <div style={{ margin: "10px 0 8px", borderTop: `1px solid ${RN.navyLight}` }} />
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", fontFamily: "Segoe UI, Helvetica Neue, Arial, sans-serif" }}>

      {/* ── Topbar ─────────────────────────────────────────────────────────── */}
      <header style={{
        height: 48, background: RN.navyDark, color: RN.white,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 20px", flexShrink: 0, zIndex: 50,
        borderBottom: `2px solid ${RN.gold}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img
            src="https://spiderfrog.ch/wp-content/uploads/Subless_White.png"
            alt="spifroca"
            style={{ height: 24, objectFit: "contain" }}
            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <div style={{ width: 1, height: 20, background: RN.gold + "55" }} />
          <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: "1px", color: RN.gold }}>spifroca</span>
          <span style={{ opacity: 0.4, fontSize: 12 }}>Bauprojektmanagement</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>👤 {user?.name}</span>
          <button onClick={() => signOut({ callbackUrl: "/auth/login" })}
            style={{ fontSize: 12, color: "#94a3b8", cursor: "pointer", background: "none", border: "1px solid #94a3b844", borderRadius: 5, padding: "3px 10px" }}>
            Abmelden
          </button>
        </div>
      </header>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ── Sidebar ──────────────────────────────────────────────────────── */}
        <aside style={{
          width: open ? 220 : 52, background: RN.navy,
          display: "flex", flexDirection: "column",
          transition: "width 0.2s", flexShrink: 0,
          borderRight: `1px solid ${RN.navyLight}`,
        }}>

          {/* Toggle Button */}
          <div style={{ padding: "10px 12px", display: "flex", justifyContent: open ? "flex-end" : "center", borderBottom: `1px solid ${RN.navyLight}` }}>
            <button onClick={() => setOpen(!open)}
              style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 14, padding: 2 }}>
              {open ? "◀" : "▶"}
            </button>
          </div>

          {/* Navigation */}
          <nav style={{ padding: "10px 8px", flex: 1, overflowY: "auto" }}>

            <SectionLabel label="Module" />
            {NAV_ITEMS.map(item => <NavLink key={item.href} {...item} />)}

            <Divider />
            <SectionLabel label="Kontakte" />
            {KONTAKT_ITEMS.map(item => <NavLink key={item.href} {...item} />)}

            {isAdmin && (
              <>
                <Divider />
                <SectionLabel label="Administration" />
                {ADMIN_ITEMS.map(item => <NavLink key={item.href} {...item} />)}
              </>
            )}
          </nav>

          {/* User-Bereich */}
          {open && (
            <div style={{ padding: "12px 14px", borderTop: `1px solid ${RN.navyLight}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: "50%",
                  background: RN.gold + "22", border: `2px solid ${RN.gold}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 800, color: RN.gold, flexShrink: 0,
                }}>
                  {initials}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 130 }}>{user?.name}</div>
                  <div style={{ fontSize: 10, color: ROLLE_COLOR[rolle] || RN.gold }}>{ROLLE_LABEL[rolle] || rolle}</div>
                </div>
              </div>
              <div style={{ marginTop: 10, padding: "5px 8px", background: RN.navyLight, borderRadius: 6, textAlign: "center" }}>
                <div style={{ fontSize: 9, color: "#475569" }}>Powered by</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: RN.gold, letterSpacing: "1px" }}>SPIDERFROG AG</div>
              </div>
            </div>
          )}
        </aside>

        {/* ── Main Content ─────────────────────────────────────────────────── */}
        <main style={{ flex: 1, overflow: "auto", background: RN.bg }}>
          {children}
        </main>
      </div>
    </div>
  );
}
