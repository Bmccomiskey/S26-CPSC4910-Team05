import { useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import "./StartupPage.css";

export default function StartupPage() {
  const navigate = useNavigate();
  const roadRef = useRef(null);

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

  return (
    <div className="startup-page">

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
            HAULER<span className="startup-logo-accent">PRO</span>
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

    </div>
  );
}
