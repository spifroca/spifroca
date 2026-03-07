"use client";
import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";
import type { Session } from "next-auth";
import Link from "next/link";
import { useProjekt } from "@/lib/projektContext";

const C = { topbar: "#1a1a1a", sidebar: "#2d2d2d", accent: "#0099cc", bg: "#f0f0f0", white: "#ffffff", border: "#cccccc" };

const NAV_ITEMS = [
  { href: "/dashboard/kostenplanung", label: "Kosten",       icon: "💰" },
  { href: "/dashboard/ausschreibung", label: "Ausschreibung",icon: "📋" },
  { href: "/dashboard/termine",       label: "Termine",      icon: "📅" },
  { href: "/dashboard/risiken",       label: "Risiken",      icon: "⚡" },
];
const KONTAKT_ITEMS = [
  { href: "/dashboard/personen",      label: "Personen",     icon: "👥" },
];
const PERSON_SUB_PAGES = [
  { key: "Übersicht",         label: "Übersicht",     icon: "📋" },
  { key: "Persönliche Daten", label: "Pers. Daten",   icon: "👤" },
  { key: "Kommunikation",     label: "Kommunikation", icon: "📞" },
  { key: "Adressen",          label: "Adressen",      icon: "📍" },
  { key: "Rollen",            label: "Rollen",        icon: "🎭" },
  { key: "Dokumente",         label: "Dokumente",     icon: "📄" },
  { key: "Notizen",           label: "Notizen",       icon: "📝" },
];
const ADMIN_ITEMS = [
  { href: "/dashboard/benutzerverwaltung", label: "Benutzer",icon: "🔐" },
];
const ROLLE_LABEL: Record<string, string> = {
  ADMINISTRATOR: "Administrator", PROJEKTLEITER: "Projektleiter",
  CONTROLLING: "Controlling", EXTERNER_PLANER: "Ext. Planer", BETRACHTER: "Betrachter",
};
interface SearchResult { id: string; typ: string; titel: string; sub: string; href: string; }
interface Props { session: Session; children: React.ReactNode; }

export function DashboardClient({ session, children }: Props) {
  const pathname  = usePathname();
  const router    = useRouter();
  const user      = session.user as any;
  const rolle     = user?.rolle || "BETRACHTER";
  const isAdmin   = rolle === "ADMINISTRATOR";
  const [open, setOpen]           = useState(true);
  const [searchQ, setSearchQ]     = useState("");
  const [results, setResults]     = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDrop, setShowDrop]   = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const debounceRef               = useState<any>(null);

  const { aktuellesProjekt } = useProjekt();
  const initials = (user?.name || "??").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  const handleSearch = (q: string) => {
    setSearchQ(q);
    if (debounceRef[0]) clearTimeout(debounceRef[0]);
    if (q.length < 2) { setResults([]); setShowDrop(false); return; }
    debounceRef[0] = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/suche?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setResults(data); setShowDrop(true);
      } finally { setSearching(false); }
    }, 250);
  };

  const NavSubLink = ({ href, label, icon, active }: { href: string; label: string; icon: string; active: boolean }) => (
    <Link href={href} style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: open ? "5px 14px 5px 34px" : "5px 0",
      justifyContent: open ? "flex-start" : "center", marginBottom: 1,
      color: active ? C.white : "#888", textDecoration: "none",
      fontWeight: active ? 600 : 400, fontSize: 11,
      background: active ? "#1a4a5a" : "transparent",
      borderLeft: active ? "3px solid #66ccee" : "3px solid transparent",
    }}
    onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = "#333"; (e.currentTarget as HTMLElement).style.color = "#ccc"; }}}
    onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#888"; }}}>
      <span style={{ fontSize: 11, width: 14, textAlign: "center", flexShrink: 0 }}>{icon}</span>
      {open && <span>{label}</span>}
    </Link>
  );
  const NavLink = ({ href, label, icon }: { href: string; label: string; icon: string }) => {
    const active = pathname.startsWith(href);
    return (
      <Link href={href} style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: open ? "8px 14px" : "8px 0", justifyContent: open ? "flex-start" : "center",
        marginBottom: 1, color: active ? C.white : "#aaa", textDecoration: "none",
        fontWeight: active ? 600 : 400, fontSize: 12,
        background: active ? C.accent : "transparent",
        borderLeft: active ? "3px solid #66ccee" : "3px solid transparent",
      }}
        onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = "#3a3a3a"; (e.currentTarget as HTMLElement).style.color = C.white; }}}
        onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#aaa"; }}}
      >
        <span style={{ fontSize: 14, width: 18, textAlign: "center", flexShrink: 0 }}>{icon}</span>
        {open && <span>{label}</span>}
      </Link>
    );
  };

  const Sep = ({ label }: { label?: string }) => (
    <div style={{ padding: open ? "10px 14px 4px" : "8px 0 4px" }}>
      {open && label
        ? <span style={{ fontSize: 9, color: "#666", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700 }}>{label}</span>
        : <div style={{ borderTop: "1px solid #444", margin: "0 8px" }} />}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", fontFamily: "Arial, Helvetica, sans-serif", fontSize: 13 }}>

      {/* ── Topbar ── */}
      <header style={{ height: 40, background: C.topbar, color: C.white, display: "flex", alignItems: "center", gap: 12, padding: "0 12px", flexShrink: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <span style={{ fontWeight: 700, fontSize: 13, color: C.accent, letterSpacing: "0.5px" }}>spifroca</span>
        </div>
        <div style={{ width: 1, height: 20, background: "#444", flexShrink: 0 }} />
        {/* Globale Suche */}
        <div style={{ flex: 1, maxWidth: 500, position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", background: "#333", borderRadius: 3, border: "1px solid #555" }}>
            <span style={{ padding: "0 8px", color: "#888", fontSize: 12 }}>🔍</span>
            <input value={searchQ} onChange={e => handleSearch(e.target.value)}
              onFocus={() => searchQ.length >= 2 && setShowDrop(true)}
              onBlur={() => setTimeout(() => setShowDrop(false), 150)}
              placeholder="Gib eine beliebige Folge von Suchbegriffen ein..."
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: C.white, fontSize: 12, padding: "6px 4px" }} />
            {searching && <span style={{ padding: "0 8px", color: "#888", fontSize: 11 }}>...</span>}
            {searchQ && <button onClick={() => { setSearchQ(""); setResults([]); setShowDrop(false); }} style={{ background: "none", border: "none", color: "#888", cursor: "pointer", padding: "0 8px" }}>×</button>}
          </div>
          {showDrop && results.length > 0 && (
            <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 999, background: C.white, border: `1px solid ${C.border}`, borderRadius: 3, boxShadow: "0 4px 20px #00000044", maxHeight: 320, overflowY: "auto" }}>
              {results.map((r, i) => (
                <div key={i} onMouseDown={() => { router.push(r.href); setShowDrop(false); setSearchQ(""); }}
                  style={{ padding: "8px 12px", borderBottom: "1px solid #f0f0f0", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#e8f4ff"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = C.white}>
                  <span style={{ fontSize: 16 }}>{r.typ === "Person" ? "👤" : r.typ === "Firma" ? "🏢" : r.typ === "Projekt" ? "🏗" : "📄"}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#222" }}>{r.titel}</div>
                    <div style={{ fontSize: 11, color: "#888" }}>{r.typ} · {r.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Rechts */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: "auto", flexShrink: 0 }}>


        </div>
      </header>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ── Sidebar ── */}
        <aside style={{ width: open ? 200 : 44, background: C.sidebar, display: "flex", flexDirection: "column", transition: "width 0.15s", flexShrink: 0 }}>

          {/* Toggle */}
          <div style={{ height: 32, display: "flex", alignItems: "center", justifyContent: open ? "flex-end" : "center", padding: "0 8px", borderBottom: "1px solid #444" }}>
            <button onClick={() => setOpen(!open)} style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: 12, padding: 4 }}>
              {open ? "◀" : "▶"}
            </button>
          </div>

          {/* ── Aktuelles Projekt (klickbar) ── */}
          <Link href="/dashboard/projekte" style={{ textDecoration: "none" }}>
            <div style={{
              padding: open ? "10px 12px" : "10px 6px",
              borderBottom: "1px solid #444",
              background: pathname.startsWith("/dashboard/projekte") ? "#1a3a4a" : "#242424",
              cursor: "pointer",
              transition: "background 0.1s",
            }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#1a3a4a"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = pathname.startsWith("/dashboard/projekte") ? "#1a3a4a" : "#242424"}>
              {open ? (
                <>
                  <div style={{ fontSize: 9, color: "#666", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 3 }}>Aktuelles Projekt</div>
                  {aktuellesProjekt ? (
                    <>
                      <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, lineHeight: 1.2 }}>{aktuellesProjekt.nummer}</div>
                      <div style={{ fontSize: 11, color: "#ccc", lineHeight: 1.3, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{aktuellesProjekt.name}</div>
                    </>
                  ) : (
                    <div style={{ fontSize: 11, color: "#666", fontStyle: "italic" }}>Kein Projekt gewählt</div>
                  )}
                  <div style={{ fontSize: 9, color: "#555", marginTop: 4 }}>▼ Projekt wechseln</div>
                </>
              ) : (
                <div style={{ textAlign: "center", fontSize: 16 }}>🏗</div>
              )}
            </div>
          </Link>

          {/* Nav */}
          <nav style={{ flex: 1, overflowY: "auto", paddingTop: 6 }}>
            <Sep label="Module" />
            {NAV_ITEMS.map(i => <NavLink key={i.href} {...i} />)}
            <Sep />
            <Sep label="Kontakte" />
            {KONTAKT_ITEMS.map(i => <NavLink key={i.href} {...i} />)}
              {pathname.startsWith("/dashboard/personen") && personId && PERSON_SUB_PAGES.map(sp => (
                <NavSubLink key={sp.key}
                  href={`/dashboard/personen?id=${personId}&tab=${sp.key}`}
                  label={sp.label} icon={sp.icon}
                  active={personTab === sp.key} />
              ))}

          </nav>

          {/* User Menu */}
          <div style={{ position: "relative" }}>
            {userMenuOpen && (
              <>
                {/* Backdrop */}
                <div style={{ position: "fixed", inset: 0, zIndex: 98 }} onClick={() => setUserMenuOpen(false)} />
                {/* Menu */}
                <div style={{ position: "absolute", bottom: "calc(100% + 4px)", left: 8, right: 8, zIndex: 99, background: "#1e1e1e", border: "1px solid #444", borderRadius: 4, boxShadow: "0 -4px 20px #00000066", overflow: "hidden" }}>
                  <div style={{ padding: "8px 12px", borderBottom: "1px solid #333" }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: C.white }}>{user?.name}</div>
                    <div style={{ fontSize: 10, color: "#888", marginTop: 1 }}>{user?.email}</div>
                    <div style={{ fontSize: 10, color: "#555", marginTop: 1 }}>{ROLLE_LABEL[rolle] || rolle}</div>
                  </div>
                  {isAdmin && (
                    <Link href="/dashboard/benutzerverwaltung" onClick={() => setUserMenuOpen(false)}
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", color: "#ccc", textDecoration: "none", fontSize: 12, borderBottom: "1px solid #333" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#2a2a2a"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                      <span style={{ fontSize: 14 }}>🔐</span> Benutzerverwaltung
                    </Link>
                  )}
                  <button onClick={() => { setUserMenuOpen(false); signOut({ callbackUrl: "/auth/login" }); }}
                    style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 12px", background: "none", border: "none", color: "#f87171", fontSize: 12, cursor: "pointer", textAlign: "left" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#2a2a2a"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                    <span style={{ fontSize: 14 }}>↩</span> Abmelden
                  </button>
                </div>
              </>
            )}
            <div onClick={() => setUserMenuOpen(m => !m)}
              style={{ padding: "10px", borderTop: "1px solid #444", display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#333"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: C.white, flexShrink: 0 }}>{initials}</div>
              {open && (
                <div style={{ overflow: "hidden", flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.white, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.name}</div>
                  <div style={{ fontSize: 10, color: "#888" }}>{ROLLE_LABEL[rolle] || rolle}</div>
                </div>
              )}
              {open && <span style={{ fontSize: 10, color: "#666", flexShrink: 0 }}>▲</span>}
            </div>
          </div>
        </aside>

        {/* ── Content ── */}
        <main style={{ flex: 1, overflow: "auto", background: C.bg }}>{children}</main>
      </div>
    </div>
  );
}
