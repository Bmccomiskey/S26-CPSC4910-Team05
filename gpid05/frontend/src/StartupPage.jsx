import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import "./StartupPage.css";

export default function StartupPage() {
  const navigate = useNavigate();
  const roadRef = useRef(null);
  const [dbInfo, setDbInfo] = useState({ status: "checking" });

  // Animate dashes on the road background via JS offset
  useEffect(() => {
    const road = roadRef.current;
    if (!road) return;
    let offset = 0;
    const interval = setInterval(() => {
      offset = (offset + 2) % 60;
      road.style.backgroundPosition = `center ${offset}px`;
    }, 30);
    return () => clearInterval(interval);
  }, []);

  // Fetch DB info from backend on mount
  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => setDbInfo(data))
      .catch(() => setDbInfo({ status: "disconnected" }));
  }, []);

  const isConnected = dbInfo.status === "connected";
  const isChecking  = dbInfo.status === "checking";

  return (
    <div className="startup-page" style={{position: "relative", zIndex: 0, minHeight: "100vh", width: "100%", backgroundColor: "#0a0a0a", display: "flex", flexDirection: "column"}}>

      {/* Animated road background */}
      <div className="startup-road-bg" ref={roadRef} />

      {/* Fog depth layers */}
      <div className="startup-fog-bottom" />
      <div className="startup-fog-top" />

      {/* Noise grain overlay */}
      <div className="startup-grain" />

      {/* ── NAV ── */}
      <nav className="startup-nav">
        <div className="startup-nav-logo">
          <span className="startup-logo-icon">🚛</span>
          <span className="startup-logo-text">
            Good Driver<span className="startup-logo-accent"> Incentive Program</span>
          </span>
        </div>
        <div className="startup-nav-buttons">
          <button className="startup-btn-signin" onClick={() => navigate("/login")}>
            SIGN IN
          </button>
          <button className="startup-btn-signup" onClick={() => navigate("/signup")}>
            SIGN UP
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <main className="startup-hero">

        {/* Headlight beams */}
        <div className="startup-beam-left" />
        <div className="startup-beam-right" />

        <div className="startup-hero-content">
          <p className="startup-eyebrow">⬡ &nbsp;THE ROAD NEVER STOPS&nbsp; ⬡</p>
          <h1 className="startup-headline">
            <span className="startup-headline-top">MILES</span>
            <span className="startup-headline-mid">AHEAD</span>
          </h1>
          <p className="startup-sub">
            Rewards built for drivers who keep America moving.<br />
            Earn points. Redeem gear. Own the road.
          </p>
          <div className="startup-cta-row">
            <button className="startup-cta-primary" onClick={() => navigate("/signup")}>
              GET STARTED — IT'S FREE
            </button>
            <button className="startup-cta-secondary" onClick={() => navigate("/login")}>
              ALREADY A MEMBER →
            </button>
          </div>
        </div>

        {/* Truck silhouette */}
        <div className="startup-truck-wrap">
          <svg viewBox="0 0 420 180" className="startup-truck-svg" xmlns="http://www.w3.org/2000/svg">
            {/* Trailer */}
            <rect x="10" y="55" width="260" height="95" rx="4" fill="#1a1a1a" stroke="#F59E0B" strokeWidth="2"/>
            <line x1="10" y1="78" x2="270" y2="78" stroke="#F59E0B" strokeWidth="1" opacity="0.4"/>
            {/* Trailer ribs */}
            {[50, 90, 130, 170, 210].map(x => (
              <line key={x} x1={x} y1="55" x2={x} y2="150" stroke="#333" strokeWidth="1.5"/>
            ))}
            {/* Cab */}
            <rect x="270" y="70" width="110" height="80" rx="6" fill="#111" stroke="#F59E0B" strokeWidth="2"/>
            {/* Windshield */}
            <polygon points="280,72 370,72 370,105 280,105" fill="#1e3a5f" opacity="0.9"/>
            {/* Headlight glow */}
            <ellipse cx="382" cy="128" rx="8" ry="7" fill="#FDE68A" opacity="0.95"/>
            <ellipse cx="382" cy="128" rx="14" ry="12" fill="#F59E0B" opacity="0.25"/>
            {/* Exhaust stacks */}
            <rect x="295" y="30" width="8" height="42" rx="2" fill="#222" stroke="#555" strokeWidth="1"/>
            <rect x="310" y="38" width="8" height="34" rx="2" fill="#222" stroke="#555" strokeWidth="1"/>
            {/* Smoke puffs */}
            <circle cx="299" cy="25" r="5" fill="#444" opacity="0.6"/>
            <circle cx="294" cy="16" r="7" fill="#333" opacity="0.4"/>
            <circle cx="314" cy="30" r="5" fill="#444" opacity="0.5"/>
            {/* Wheels */}
            <circle cx="60"  cy="152" r="22" fill="#111" stroke="#F59E0B" strokeWidth="2.5"/>
            <circle cx="60"  cy="152" r="10" fill="#1a1a1a" stroke="#666" strokeWidth="1.5"/>
            <circle cx="200" cy="152" r="22" fill="#111" stroke="#F59E0B" strokeWidth="2.5"/>
            <circle cx="200" cy="152" r="10" fill="#1a1a1a" stroke="#666" strokeWidth="1.5"/>
            <circle cx="310" cy="152" r="22" fill="#111" stroke="#F59E0B" strokeWidth="2.5"/>
            <circle cx="310" cy="152" r="10" fill="#1a1a1a" stroke="#666" strokeWidth="1.5"/>
            <circle cx="360" cy="152" r="18" fill="#111" stroke="#F59E0B" strokeWidth="2.5"/>
            <circle cx="360" cy="152" r="8"  fill="#1a1a1a" stroke="#666" strokeWidth="1.5"/>
            {/* Ground shadow */}
            <ellipse cx="210" cy="175" rx="200" ry="8" fill="black" opacity="0.5"/>
          </svg>
        </div>
      </main>

      {/* ── STATS BAR ── */}
      <div className="startup-stats-bar">
        {[
          { num: "12,400+", label: "Active Drivers" },
          { num: "340+",    label: "Sponsor Partners" },
          { num: "2.1M",    label: "Miles Rewarded" },
          { num: "98%",     label: "Driver Satisfaction" },
        ].map((s, i) => (
          <div key={i} className="startup-stat-item">
            <span className="startup-stat-num">{s.num}</span>
            <span className="startup-stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── DB STATUS BADGE ── */}
      <div style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        zIndex: 100,
        backgroundColor: "#111",
        border: `1px solid ${isChecking ? "#555" : isConnected ? "#22c55e" : "#ef4444"}`,
        borderRadius: "8px",
        padding: "10px 16px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        boxShadow: `0 0 16px ${isChecking ? "transparent" : isConnected ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#ccc",
        minWidth: "220px",
      }}>
        {/* Pulsing dot */}
        <span style={{
          width: "10px",
          height: "10px",
          borderRadius: "50%",
          backgroundColor: isChecking ? "#888" : isConnected ? "#22c55e" : "#ef4444",
          flexShrink: 0,
          animation: isConnected ? "dbPulse 2s ease-in-out infinite" : "none",
        }} />

        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <span style={{
            color: isChecking ? "#888" : isConnected ? "#22c55e" : "#ef4444",
            fontWeight: "bold",
            letterSpacing: "0.05em",
            fontSize: "11px",
          }}>
            {isChecking ? "CONNECTING..." : isConnected ? "DB CONNECTED" : "DB DISCONNECTED"}
          </span>

          {isConnected && (
            <>
              <span style={{ color: "#aaa" }}>
                Team: <span style={{ color: "#F59E0B" }}>{dbInfo.team}</span>
              </span>
              <span style={{ color: "#aaa" }}>
                v<span style={{ color: "#F59E0B" }}>{dbInfo.version}</span>
                {" · "}
                <span style={{ color: "#666" }}>{dbInfo.date}</span>
              </span>
            </>
          )}

          {!isConnected && !isChecking && (
            <span style={{ color: "#ef4444", fontSize: "11px" }}>Could not reach database</span>
          )}
        </div>
      </div>

      {/* Pulse keyframe injected inline */}
      <style>{`
        @keyframes dbPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(0.85); }
        }
      `}</style>

    </div>
  );
}
