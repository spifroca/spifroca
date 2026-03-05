"use client";
import { useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import type { Session } from "next-auth";
import Link from "next/link";

const C = {
  topbar:  "#1a1a1a",
  sidebar: "#2d2d2d",
  accent:  "#0099cc",
  bg:      "#f0f0f0",
  white:   "#ffffff",
  border:  "#cccccc",
};

const NAV_ITEMS = [
  { href: "/dashboard/projekte",           label: "Projekte",          icon: "🏗" },
  { href: "/dashboard/kostenplanung",      label: "Kostenplanung",     icon: "💰" },
  { href: "/dashboard/ausschreibung",      label: "Ausschreibung",     icon: "📋" },
  { href: "/dashboard/termine",            label: "Termine",           icon: "📅" },
  { href: "/dashboard/risiken",            label: "Risiken & Chancen", icon: "⚡" },
];
const KONTAKT_ITEMS = [
  { href: "/dashboard/personen",           label: "Kontakte",          icon: "👥" },
];
const ADMIN_ITEMS = [
  { href: "/dashboard/benutzerverwaltung", label: "Benutzerverwaltung",icon: "🔐" },
];

const ROLLE_LABEL: Record<string, string> = {
  ADMINISTRATOR: "Administrator", PROJEKTLEITER: "Projektleiter",
  CONTROLLING: "Controlling", EXTERNER_PLANER: "Ext. Planer", BETRACHTER: "Betrachter",
};

interface SearchResult { id: string; typ: string; titel: string; sub: string; href: string; }

interface Props { session: Session; children: React.ReactNode; }

export function DashboardClient({ session, children }: Props) {
  const pathname = usePathname();
  const router   = useRouter();
  const user     = session.user as any;
  const rolle    = user?.rolle || "BETRACHTER";
  const isAdmin  = rolle === "ADMINISTRATOR";
  const [open, setOpen]           = useState(true);
  const [searchQ, setSearchQ]     = useState("");
  const [results, setResults]     = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDrop, setShowDrop]   = useState(false);
  const searchRef                 = useRef<HTMLInputElement>(null);
  const debounceRef               = useRef<any>(null);

  const initials = (user?.name || "??").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  const handleSearch = (q: string) => {
    setSearchQ(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) { setResults([]); setShowDrop(false); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res  = await fetch(`/api/suche?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setResults(data);
        setShowDrop(true);
      } finally { setSearching(false); }
    }, 250);
  };

  const handleResultClick = (href: string) => {
    setShowDrop(false);
    setSearchQ("");
    router.push(href);
  };

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
        onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = "#3a3a3a"; (e.currentTarget as HTMLElement).style.color = C.white; }}}
        onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#aaaaaa"; }}}
      >
        <span style={{ fontSize: 14, width: 18, textAlign: "center", flexShrink: 0 }}>{icon}</span>
        {open && <span>{label}</span>}
      </Link>
    );
  };

  const Sep = ({ label }: { label?: string }) => (
    <div style={{ padding: open ? "10px 14px 4px" : "8px 0 4px", textAlign: open ? "left" : "center" }}>
      {open && label
        ? <span style={{ fontSize: 9, color: "#666", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700 }}>{label}</span>
        : <div style={{ borderTop: "1px solid #444", margin: "0 8px" }} />}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", fontFamily: "Arial, Helvetica, sans-serif", fontSize: 13 }}>

      {/* ── Topbar ─────────────────────────────────────────────────────────── */}
      <header style={{ height: 40, background: C.topbar, color: C.white, display: "flex", alignItems: "center", gap: 12, padding: "0 12px", flexShrink: 0, zIndex: 50 }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <img src="https://spiderfrog.ch/wp-content/uploads/Subless_White.png" alt="spifroca"
            style={{ height: 20, objectFit: "contain" }}
            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
          <span style={{ fontWeight: 700, fontSize: 13, color: C.accent, letterSpacing: "0.5px", whiteSpace: "nowrap" }}>spifroca</span>
        </div>

        <div style={{ width: 1, height: 20, background: "#444", flexShrink: 0 }} />

        {/* ── Globale Suche ─────────────────────────────────────────────── */}
        <div style={{ flex: 1, maxWidth: 500, position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", background: "#333", borderRadius: 3, border: "1px solid #555", overflow: "visible" }}>
            <span style={{ padding: "0 8px", color: "#888", fontSize: 12 }}>🔍</span>
            <input
              ref={searchRef}
              value={searchQ}
              onChange={e => handleSearch(e.target.value)}
              onFocus={() => searchQ.length >= 2 && setShowDrop(true)}
              onBlur={() => setTimeout(() => setShowDrop(false), 150)}
              placeholder="Gib eine beliebige Folge von Suchbegriffen ein (F1 öffnet die Hilfe)"
              style={{
                flex: 1, background: "transparent", border: "none", outline: "none",
                color: C.white, fontSize: 12, padding: "6px 4px",
              }}
            />
            {searching && <span style={{ padding: "0 8px", color: "#888", fontSize: 11 }}>...</span>}
            {searchQ && (
              <button onClick={() => { setSearchQ(""); setResults([]); setShowDrop(false); }}
                style={{ background: "none", border: "none", color: "#888", cursor: "pointer", padding: "0 8px", fontSize: 14 }}>×</button>
            )}
          </div>

          {/* Suchergebnisse Dropdown */}
          {showDrop && results.length > 0 && (
            <div style={{
              position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 999,
              background: C.white, border: `1px solid ${C.border}`, borderRadius: 3,
              boxShadow: "0 4px 20px #00000044", maxHeight: 360, overflowY: "auto",
            }}>
              {results.map((r, i) => (
                <div key={i} onMouseDown={() => handleResultClick(r.href)}
                  style={{ padding: "8px 12px", borderBottom: "1px solid #f0f0f0", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#e8f4ff"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = C.white}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>
                    {r.typ === "Person" ? "👤" : r.typ === "Firma" ? "🏢" : r.typ === "Projekt" ? "🏗" : "📄"}
                  </span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#222" }}>{r.titel}</div>
                    <div style={{ fontSize: 11, color: "#888" }}>{r.typ} · {r.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {showDrop && results.length === 0 && searchQ.length >= 2 && !searching && (
            <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 999, background: C.white, border: `1px solid ${C.border}`, borderRadius: 3, padding: "12px", color: "#999", fontSize: 12 }}>
              Keine Ergebnisse für «{searchQ}»
            </div>
          )}
        </div>

        {/* Rechte Seite */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0, marginLeft: "auto" }}>
          <span style={{ fontSize: 11, background: "#333", padding: "2px 8px", borderRadius: 3, color: "#aaa" }}>{ROLLE_LABEL[rolle] || rolle}</span>
          <span style={{ fontSize: 11, color: "#777" }}>{user?.name}</span>
          <button onClick={() => signOut({ callbackUrl: "/auth/login" })}
            style={{ fontSize: 11, color: "#aaa", cursor: "pointer", background: "none", border: "1px solid #555", borderRadius: 3, padding: "2px 8px" }}>
            Abmelden
          </button>
        </div>
      </header>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ── Sidebar ──────────────────────────────────────────────────────── */}
        <aside style={{ width: open ? 200 : 44, background: C.sidebar, display: "flex", flexDirection: "column", transition: "width 0.15s", flexShrink: 0 }}>
          <div style={{ height: 32, display: "flex", alignItems: "center", justifyContent: open ? "flex-end" : "center", padding: "0 8px", borderBottom: "1px solid #444" }}>
            <button onClick={() => setOpen(!open)} style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: 12, padding: 4 }}>
              {open ? "◀" : "▶"}
            </button>
          </div>
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
          <div style={{ padding: "10px", borderTop: "1px solid #444", display: "flex", alignItems: "center", gap: 8 }}>
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
