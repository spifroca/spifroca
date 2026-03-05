"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) setError("E-Mail oder Passwort ungültig.");
    else router.push("/dashboard/projekte");
  };

  return (
    <div style={{ minHeight:"100vh", background:"#1a1a2e", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"Segoe UI, sans-serif" }}>
      {/* Background grid */}
      <div style={{ position:"fixed", inset:0, backgroundImage:"linear-gradient(#ffffff08 1px,transparent 1px),linear-gradient(90deg,#ffffff08 1px,transparent 1px)", backgroundSize:"40px 40px" }} />
      <div style={{ position:"fixed", top:"30%", left:"50%", transform:"translateX(-50%)", width:500, height:500, background:"radial-gradient(circle,#c0392b18,transparent 70%)" }} />

      <div style={{ position:"relative", width:"100%", maxWidth:420, padding:24 }}>
        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:36 }}>
          <img
            src="https://spiderfrog.ch/wp-content/uploads/Subless_Black.webp"
            alt="spifroca"
            style={{ height:48, width:"auto", objectFit:"contain", marginBottom:12, filter:"brightness(0) invert(1)" }}
            onError={(e) => {
              const el = e.target as HTMLImageElement;
              el.style.display = "none";
              const fallback = document.createElement("div");
              fallback.textContent = "SF";
              fallback.style.cssText = "width:56px;height:56px;background:#c0392b;border-radius:14px;display:inline-flex;align-items:center;justify-content:center;font-size:22px;font-weight:900;color:#fff;margin:0 auto 12px;";
              el.parentNode?.insertBefore(fallback, el);
            }}
          />
          <div style={{ fontSize:28, fontWeight:900, color:"#fff", letterSpacing:"-0.5px" }}>spifroca</div>
          <div style={{ fontSize:12, color:"#666", marginTop:4 }}>Bauprojektmanagement · Sicherer Login</div>
          <div style={{ fontSize:11, color:"#555", marginTop:2 }}>Powered by <span style={{ color:"#c0392b" }}>Spiderfrog AG</span></div>
        </div>

        <form onSubmit={handleSubmit} style={{ background:"#13151c", border:"1px solid #2a2d3a", borderRadius:16, padding:28, boxShadow:"0 24px 80px #00000088" }}>
          <div style={{ fontSize:16, fontWeight:800, color:"#fff", marginBottom:4 }}>Willkommen zurück</div>
          <div style={{ fontSize:12, color:"#666", marginBottom:22 }}>Bitte melden Sie sich mit Ihren Zugangsdaten an.</div>

          {error && (
            <div style={{ background:"#c0392b22", border:"1px solid #c0392b44", borderRadius:8, padding:"9px 12px", fontSize:12, color:"#e74c3c", marginBottom:14 }}>
              ⚠ {error}
            </div>
          )}

          {/* E-Mail */}
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:11, fontWeight:600, color:"#888", textTransform:"uppercase", letterSpacing:"0.5px", display:"block", marginBottom:5 }}>E-Mail</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="name@firma.ch"
              style={{ width:"100%", background:"#0d0f14", border:"1px solid #2a2d3a", borderRadius:8, padding:"10px 12px", color:"#fff", fontSize:13, outline:"none", fontFamily:"inherit" }}
              onFocus={e => e.target.style.borderColor="#c0392b"} onBlur={e => e.target.style.borderColor="#2a2d3a"} />
          </div>

          {/* Passwort */}
          <div style={{ marginBottom:20 }}>
            <label style={{ fontSize:11, fontWeight:600, color:"#888", textTransform:"uppercase", letterSpacing:"0.5px", display:"block", marginBottom:5 }}>Passwort</label>
            <div style={{ position:"relative" }}>
              <input type={showPw?"text":"password"} value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
                style={{ width:"100%", background:"#0d0f14", border:"1px solid #2a2d3a", borderRadius:8, padding:"10px 38px 10px 12px", color:"#fff", fontSize:13, outline:"none", fontFamily:"inherit" }}
                onFocus={e => e.target.style.borderColor="#c0392b"} onBlur={e => e.target.style.borderColor="#2a2d3a"} />
              <button type="button" onClick={() => setShowPw(!showPw)} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"#666", cursor:"pointer", fontSize:14 }}>
                {showPw ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading || !email || !password}
            style={{ width:"100%", padding:"11px", background: loading?"#992020":"#c0392b", color:"#fff", border:"none", borderRadius:8, fontWeight:800, fontSize:14, cursor:"pointer", letterSpacing:"0.3px" }}>
            {loading ? "Wird überprüft…" : "Anmelden →"}
          </button>

          <div style={{ textAlign:"center", marginTop:14, fontSize:12 }}>
            <span style={{ color:"#c0392b", cursor:"pointer" }}>Passwort vergessen?</span>
          </div>

          {/* Demo-Zugänge */}
          <div style={{ marginTop:20, padding:14, background:"#0d0f14", borderRadius:10, border:"1px solid #2a2d3a" }}>
            <div style={{ fontSize:10, color:"#666", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:8 }}>Demo-Zugänge</div>
            {[
              { email:"admin@spiderfrog.ch",       pw:"Admin123!",   name:"Sandra Meier",    rolle:"Administrator",   color:"#c0392b" },
              { email:"leiter@spiderfrog.ch",       pw:"Leiter123!",  name:"Marco Weber",     rolle:"Projektleiter",   color:"#3b82f6" },
              { email:"controlling@spiderfrog.ch",  pw:"Control123!", name:"Beat Zimmermann", rolle:"Controlling",     color:"#8b5cf6" },
              { email:"planer@extern.ch",       pw:"Planer123!",  name:"Maria Keller",    rolle:"Ext. Planer",     color:"#f59e0b" },
            ].map(u => (
              <div key={u.email} onClick={() => { setEmail(u.email); setPassword(u.pw); }}
                style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 6px", borderRadius:6, cursor:"pointer", marginBottom:3 }}
                onMouseEnter={e => (e.currentTarget.style.background="#1a1d26")}
                onMouseLeave={e => (e.currentTarget.style.background="transparent")}
              >
                <div style={{ width:28, height:28, borderRadius:"50%", background:u.color+"33", border:`1.5px solid ${u.color}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:800, color:u.color, flexShrink:0 }}>
                  {u.name.split(" ").map(n=>n[0]).join("")}
                </div>
                <div>
                  <div style={{ fontSize:12, fontWeight:600, color:"#ccc" }}>{u.name}</div>
                  <div style={{ fontSize:10, color:u.color }}>{u.rolle}</div>
                </div>
              </div>
            ))}
          </div>
        </form>

        <div style={{ textAlign:"center", marginTop:20, fontSize:11, color:"#444" }}>
          🔒 TLS-verschlüsselt · 🇨🇭 Schweizer Server · DSGVO-konform<br/>
          <span style={{ color:"#555" }}>© 2025 Spiderfrog AG, Birkenweg 3, 6340 Baar</span>
        </div>
      </div>
    </div>
  );
}
