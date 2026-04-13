import { useNavigate } from 'react-router-dom';
import DriverOrders from './DriverOrders';
import DriverPoints from './DriverPoints';
import DriverProfile from './DriverProfile';
import DriverCart from './DriverCart';
import { useAuth } from '../useAuth';
import { useState, useEffect } from 'react';
import './DriverDashboard.css';

const API_BASE =
  process.env.NODE_ENV === "production"
    ? "http://23.22.72.87"
    : "http://localhost:8000";


export default function DriverDashboard() {
  const navigate = useNavigate();
  const { user, loading } = useAuth('user');
  const [activeTab, setActiveTab] = useState("dashboard");
  const [myApplications, setMyApplications] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [personalGoals, setPersonalGoals] = useState([]);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalSubmitting, setGoalSubmitting] = useState(false);
  const [goalSuccessMsg, setGoalSuccessMsg] = useState('');
  const [goalErrorMsg, setGoalErrorMsg] = useState('');
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [goalTargetPoints, setGoalTargetPoints] = useState('');
  const [goalDeadline, setGoalDeadline] = useState('');
  const [driverCatalog, setDriverCatalog] = useState([]);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [sortOption, setSortOption] = useState("none");
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [pointBalance, setPointBalance] = useState(0);
  const [driverName, setDriverName] = useState("");
  const fetchDriverCatalog = async () => {
    setCatalogLoading(true);
    try {
      const resApps = await fetch(`${API_BASE}/applications/driver/${user.id}`, { credentials: 'include' });
      const applications = await resApps.json();
      const approved = applications.filter(app => app.status === "APPROVED");

      const catalogs = [];
      for (const app of approved) {
        const resCatalog = await fetch(
          `${API_BASE}/catalog/sponsor/${app.sponsor_id}?search=${catalogSearch}`,
          { credentials: 'include' }
        );
        const data = await resCatalog.json();
        catalogs.push({
          sponsor_id: app.sponsor_id,
          sponsor_email: app.sponsor_email,
          last_updated: data.last_updated,
          items: data.items || [],
        });
      }
      setDriverCatalog(catalogs);
    } catch (err) {
      console.error("Driver catalog fetch error:", err);
    }
    setCatalogLoading(false);
  };

  const fetchPointBalance = () => {
    if (!user) return;
    fetch(`${API_BASE}/points/driver/${user.id}/balance`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setPointBalance(Number(data.balance || 0)))
      .catch(err => console.error("Error fetching point balance:", err));
  };

  useEffect(() => {
    if (user && activeTab === "catalog") {
      fetchDriverCatalog();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeTab, catalogSearch]);

  useEffect(() => {
    if (user && activeTab === "apply") {
      fetch(`/applications/sponsors`)
        .then(res => res.json())
        .then(data => setSponsors(data))
        .catch(err => console.error("Error fetching sponsors:", err));
    }
  }, [user, activeTab]);

  const fetchTransactions = () => {
    if (!user) return;
    fetch(`${API_BASE}/points/driver/${user.id}/history`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setTransactions(data))
      .catch(err => console.error("Error fetching points:", err));
  };

  const fetchGoals = () => {
    if (!user) return;
    fetch(`/points/goals/driver/${user.id}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setGoals(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error fetching goals:", err));
  };

  const fetchPersonalGoals = () => {
    if (!user) return;
    fetch(`/points/goals/personal/${user.id}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setPersonalGoals(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error fetching personal goals:", err));
  };

  const flashGoal = (msg, isError = false) => {
    if (isError) { setGoalErrorMsg(msg); setGoalSuccessMsg(''); }
    else { setGoalSuccessMsg(msg); setGoalErrorMsg(''); }
    setTimeout(() => { setGoalSuccessMsg(''); setGoalErrorMsg(''); }, 3500);
  };

  const handleGoalSubmit = async () => {
    if (!goalTitle.trim()) return flashGoal('Please enter a goal title.', true);
    if (!goalTargetPoints || Number(goalTargetPoints) <= 0) return flashGoal('Please enter a valid target.', true);
    setGoalSubmitting(true);
    try {
      const res = await fetch('/points/goals/personal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          driver_id: user.id,
          title: goalTitle,
          description: goalDescription,
          target_points: Number(goalTargetPoints),
          deadline: goalDeadline || null,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        flashGoal(d.detail || 'Something went wrong.', true);
      } else {
        flashGoal('Personal goal created!');
        setShowGoalForm(false);
        setGoalTitle(''); setGoalDescription(''); setGoalTargetPoints(''); setGoalDeadline('');
        fetchPersonalGoals();
      }
    } catch { flashGoal('Network error.', true); }
    setGoalSubmitting(false);
  };

  const handleDeletePersonalGoal = async (goalId) => {
    if (!window.confirm('Delete this goal?')) return;
    await fetch(`/points/goals/personal/${goalId}?driver_id=${user.id}`, {
      method: 'DELETE', credentials: 'include',
    });
    fetchPersonalGoals();
  };

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  useEffect(() => {
    if (!user) return;
    fetch(`${API_BASE}/applications/driver/${user.id}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setMyApplications(data))
      .catch(err => console.error("Error fetching applications:", err));

    fetchTransactions();
    fetchPointBalance();
    fetchGoals();
    fetchPersonalGoals();

    fetch(`${API_BASE}/profile/${user.id}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.first_name) setDriverName(data.first_name);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Re-fetch when switching tabs
  useEffect(() => {
    if (activeTab === "points") { fetchTransactions(); fetchPointBalance(); }
    if (activeTab === "goals") { fetchGoals(); fetchPersonalGoals(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);
  const handleApply = async (sponsorId) => {
    try {
      const res = await fetch(`/applications/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          driver_id: user.id,
          sponsor_id: sponsorId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.detail || "Something went wrong.");
        setSuccessMessage('');
        return;
      }
      setSuccessMessage("Application submitted successfully!");
      setErrorMessage('');

      // Refresh applications so UI updates
      const refresh = await fetch(
        `/applications/driver/${user.id}`
      );
      const refreshedData = await refresh.json();
      setMyApplications(refreshedData);

    } catch (err) {
      setErrorMessage("Network error.");
      setSuccessMessage('');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.error('Logout error:', err);
    }
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    navigate('/login');
  };

  const isSponsorViewing = localStorage.getItem("isSponsorViewing") === "true";
  const exitSponsorView = () => {
    localStorage.setItem("userRole", localStorage.getItem("sponsorViewerRole") || "sponsor");
    localStorage.setItem("userEmail", localStorage.getItem("sponsorViewerEmail") || "");
    localStorage.setItem("userId", localStorage.getItem("sponsorViewerId") || "");

    localStorage.removeItem("isSponsorViewing");
    localStorage.removeItem("sponsorViewerRole");
    localStorage.removeItem("sponsorViewerEmail");
    localStorage.removeItem("sponsorViewerId");

    window.location.href = "/sponsor-dashboard";
  };

  const addToCart = (item, sponsorId, sponsorEmail) => {
    setCart(prev => {
      const existingIdx = prev.findIndex(ci => ci.id === item.id && ci.sponsor_id === sponsorId);
      if (existingIdx !== -1) {
        return prev.map((ci, i) => i === existingIdx ? { ...ci, quantity: ci.quantity + 1 } : ci);
      }
      return [...prev, { ...item, sponsor_id: sponsorId, sponsor_email: sponsorEmail, quantity: 1 }];
    });
  };

  const removeFromCart = (index) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const handleCancelOrder = async (transactionId) => {
    const res = await fetch(`${API_BASE}/points/cancel/${transactionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ driver_id: user.id }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.detail || "Failed to cancel order.");
    } else {
      alert("Order cancelled and points refunded.");
      fetchTransactions();
      fetchPointBalance();
    }
  };

  const handleCartCheckout = async () => {
    if (cart.length === 0) return;
    const errors = [];
    for (const item of cart) {
      const qty = item.quantity || 1;
      for (let q = 0; q < qty; q++) {
        const res = await fetch(`${API_BASE}/points/redeem`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            driver_id: user.id,
            sponsor_id: item.sponsor_id,
            item_id: item.id,
            item_name: item.name,
            point_cost: item.point_cost,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          errors.push(`${item.name}: ${data.detail || 'Failed'}`);
          break;
        }
      }
    }
    if (errors.length > 0) {
      alert(`Some items could not be redeemed:\n${errors.join('\n')}`);
    } else {
      alert('All items redeemed successfully!');
      setCart([]);
    }
    fetchTransactions();
    fetchPointBalance();
  };

  const isImpersonating = localStorage.getItem("isImpersonating") === "true";
  const exitImpersonation = async () => {
    try {
      const res = await fetch("/admin/impersonate/stop", {
        method: "POST",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Failed to exit impersonation");
      }

      localStorage.setItem("userRole", localStorage.getItem("impersonatorRole") || "admin");
      localStorage.setItem("userEmail", localStorage.getItem("impersonatorEmail") || "");
      localStorage.setItem("userId", localStorage.getItem("impersonatorId") || "");

      localStorage.removeItem("isImpersonating");
      localStorage.removeItem("impersonatorRole");
      localStorage.removeItem("impersonatorEmail");
      localStorage.removeItem("impersonatorId");

      window.location.href = "/admin-dashboard";
    } catch (err) {
      alert("Failed to exit impersonation. Please try again.");
    }
  };

  useEffect(() => {
    setSuccessMessage('');
    setErrorMessage('');
  }, [activeTab]);

  if (loading) return <div style={{ padding: '40px', fontSize: '18px' }}>Loading...</div>;
  if (!user) return null;
  return (
    <div className="dd-container">
      <div className="dd-sidebar">
        <div className="dd-sidebar-header">
          <div className="dd-sidebar-brand">
            <div className="dd-sidebar-brand-icon">D</div>
            <div>
              <p className="dd-sidebar-title">Driver Portal</p>
              <p className="dd-sidebar-subtitle">Rewards Dashboard</p>
            </div>
          </div>
        </div>

        <nav className="dd-nav">
          <button className={`dd-nav-item ${activeTab === "dashboard" ? "active" : ""}`} onClick={() => setActiveTab("dashboard")}>
            Dashboard
          </button>
          <button className={`dd-nav-item ${activeTab === "catalog" ? "active" : ""}`} onClick={() => setActiveTab("catalog")}>
            Catalog
            {cart.length > 0 && <span className="dd-nav-cart-badge">{cart.reduce((s, i) => s + (i.quantity || 1), 0)}</span>}
          </button>
          <button className={`dd-nav-item ${activeTab === "orders" ? "active" : ""}`} onClick={() => setActiveTab("orders")}>
            My Orders
          </button>
          <button className={`dd-nav-item ${activeTab === "points" ? "active" : ""}`} onClick={() => setActiveTab("points")}>
            My Points
          </button>
          <button className={`dd-nav-item ${activeTab === "goals" ? "active" : ""}`} onClick={() => setActiveTab("goals")}>
            My Goals
          </button>
          <button className={`dd-nav-item ${activeTab === "apply" ? "active" : ""}`} onClick={() => setActiveTab("apply")}>
            Sponsorships
          </button>
          <button className={`dd-nav-item ${activeTab === "profile" ? "active" : ""}`} onClick={() => setActiveTab("profile")}>
            Profile
          </button>
        </nav>

        <div className="dd-sidebar-footer">
          <div className="dd-user-card">
            <div className="dd-user-avatar">{user.email?.[0]?.toUpperCase() || 'D'}</div>
            <div className="dd-user-info">
              <p className="dd-user-name">{driverName || user.email}</p>
              <p className="dd-user-role">Driver</p>
            </div>
          </div>
          <button className="dd-logout-btn" onClick={handleLogout}>
Sign Out
          </button>
        </div>
      </div>

      <main className="dd-main">
        {isSponsorViewing && (
          <div className="dd-banner dd-banner-info">
            <strong>Sponsor View:</strong> Viewing as {localStorage.getItem("userEmail")}.
            <button className="dd-banner-btn" onClick={exitSponsorView}>Return to Sponsor Dashboard</button>
          </div>
        )}
        {isImpersonating && (
          <div className="dd-banner dd-banner-warn">
            <strong>Admin Impersonation:</strong> You are viewing this account as an admin.
            <button className="dd-banner-btn" onClick={exitImpersonation}>Exit</button>
          </div>
        )}

        {activeTab === "dashboard" && (
          <div className="dhome-root">
            {/* Welcome banner */}
            <div className="dhome-hero">
              <div className="dhome-hero-text">
                <p className="dhome-hero-greeting">Welcome back</p>
                <h1 className="dhome-hero-name">{driverName || user.email}</h1>
                <p className="dhome-hero-sub">Here's a snapshot of your rewards activity</p>
              </div>
              <button className="dhome-hero-cta" onClick={() => setActiveTab("catalog")}>
                Browse Catalog →
              </button>
            </div>

            {/* Stat cards */}
            <div className="dhome-stats">
              <div className="dhome-stat-card dhome-stat-blue">
                <p className="dhome-stat-label">Point Balance</p>
                <p className="dhome-stat-value">{pointBalance.toLocaleString()}</p>
              </div>
              <div className="dhome-stat-card dhome-stat-green">
                <p className="dhome-stat-label">Total Orders</p>
                <p className="dhome-stat-value">
                  {transactions.filter(t => t.description?.startsWith("Redeemed:")).length}
                </p>
              </div>
              <div className="dhome-stat-card dhome-stat-purple">
                <p className="dhome-stat-label">Active Goals</p>
                <p className="dhome-stat-value">{goals.filter(g => !g.completed).length}</p>
              </div>
              <div className="dhome-stat-card dhome-stat-amber">
                <p className="dhome-stat-label">Sponsors</p>
                <p className="dhome-stat-value">
                  {myApplications.filter(a => a.status === "APPROVED").length}
                </p>
              </div>
            </div>

            <div className="dhome-lower">
              {/* Recent activity */}
              <div className="dhome-card">
                <div className="dhome-card-header">
                  <h2 className="dhome-card-title">Recent Activity</h2>
                  <button className="dhome-card-link" onClick={() => setActiveTab("points")}>View all</button>
                </div>
                {transactions.length === 0 ? (
                  <p className="dhome-empty">No transactions yet.</p>
                ) : (
                  <div className="dhome-activity-list">
                    {[...transactions]
                      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                      .slice(0, 5)
                      .map(t => (
                      <div key={t.id} className="dhome-activity-row">
                        <div className={`dhome-activity-dot ${t.points > 0 ? 'dhome-dot-green' : 'dhome-dot-red'}`} />
                        <div className="dhome-activity-info">
                          <p className="dhome-activity-desc">{t.description || 'Transaction'}</p>
                          <p className="dhome-activity-date">
                            {new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                        <span className={`dhome-activity-pts ${t.points > 0 ? 'dhome-pts-pos' : 'dhome-pts-neg'}`}>
                          {t.points > 0 ? '+' : ''}{t.points.toLocaleString()} pts
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Active goals */}
              <div className="dhome-card">
                <div className="dhome-card-header">
                  <h2 className="dhome-card-title">Active Goals</h2>
                  <button className="dhome-card-link" onClick={() => setActiveTab("goals")}>View all</button>
                </div>
                {goals.filter(g => !g.completed).length === 0 ? (
                  <p className="dhome-empty">No active goals. Your sponsor will set goals for you here.</p>
                ) : (
                  <div className="dhome-goals-list">
                    {goals.filter(g => !g.completed).slice(0, 3).map(goal => {
                      const pct = Math.min(100, Math.round(((goal.current_points || 0) / goal.target_points) * 100));
                      return (
                        <div key={goal.id} className="dhome-goal-row">
                          <div className="dhome-goal-top">
                            <p className="dhome-goal-title">{goal.title}</p>
                            <span className="dhome-goal-pct">{pct}%</span>
                          </div>
                          <div className="dhome-progress-bar">
                            <div className="dhome-progress-fill" style={{ width: `${pct}%` }} />
                          </div>
                          <p className="dhome-goal-pts">
                            {(goal.current_points || 0).toLocaleString()} / {goal.target_points.toLocaleString()} pts
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      {activeTab === "apply" && (
        <div className="dapply-root">
          <div className="dd-top-bar">
            <h1 className="dd-page-title">Sponsorships</h1>
          </div>

          {successMessage && <div className="dd-alert dd-alert-success">✓ {successMessage}</div>}
          {errorMessage   && <div className="dd-alert dd-alert-error">⚠ {errorMessage}</div>}

          <div className="dapply-grid">
            {/* Available sponsors */}
            <div className="dapply-card">
              <h2 className="dapply-card-title">Available Sponsors</h2>
              {sponsors.length === 0 ? (
                <p className="dapply-empty">No sponsors available right now.</p>
              ) : (
                <div className="dapply-list">
                  {sponsors.map(sponsor => {
                    const existing = myApplications.find(
                      app => app.sponsor_id === sponsor.id
                    );
                    const isPending  = existing?.status === "PENDING";
                    const isApproved = existing?.status === "APPROVED";
                    const isRejected = existing?.status === "REJECTED";
                    return (
                      <div key={sponsor.id} className="dapply-row">
                        <div className="dapply-row-avatar">{sponsor.email?.[0]?.toUpperCase()}</div>
                        <span className="dapply-row-email">{sponsor.email}</span>
                        {isApproved && <span className="dapply-badge dapply-badge--approved">Approved</span>}
                        {isPending  && <span className="dapply-badge dapply-badge--pending">Pending</span>}
                        {isRejected && <span className="dapply-badge dapply-badge--rejected">Rejected</span>}
                        {!existing && (
                          <button className="dapply-apply-btn" onClick={() => handleApply(sponsor.id)}>
                            Apply
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* My applications */}
            <div className="dapply-card">
              <h2 className="dapply-card-title">My Applications</h2>
              {myApplications.length === 0 ? (
                <p className="dapply-empty">No applications yet.</p>
              ) : (
                <div className="dapply-list">
                  {myApplications.map(app => (
                    <div key={app.id} className="dapply-row">
                      <div className="dapply-row-avatar">{app.sponsor_email?.[0]?.toUpperCase()}</div>
                      <span className="dapply-row-email">{app.sponsor_email}</span>
                      {app.status === "APPROVED" && <span className="dapply-badge dapply-badge--approved">Approved</span>}
                      {app.status === "PENDING"  && <span className="dapply-badge dapply-badge--pending">Pending</span>}
                      {app.status === "REJECTED" && <span className="dapply-badge dapply-badge--rejected">Rejected</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {activeTab === "catalog" && (
        <div className="dcat-root">
          {/* Header */}
          <div className="dcat-page-header">
            <div>
              <h1 className="dcat-page-title">Rewards Catalog</h1>
              <p className="dcat-page-sub">Browse and redeem items from your approved sponsors</p>
            </div>
            <button className="dcat-cart-btn" onClick={() => setCartOpen(true)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
              Cart
              {cart.length > 0 && (
                <span className="dcat-cart-badge">
                  {cart.reduce((s, i) => s + (i.quantity || 1), 0)}
                </span>
              )}
            </button>
          </div>

          {/* Toolbar */}
          <div className="dcat-toolbar">
            <div className="dcat-search-wrap">
              <svg className="dcat-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                className="dcat-search-input"
                type="text"
                placeholder="Search items…"
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
              />
            </div>
            <select className="dcat-sort-select" value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
              <option value="none">Sort by</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
              <option value="points_asc">Points: Low → High</option>
              <option value="points_desc">Points: High → Low</option>
            </select>
          </div>

          {/* Content */}
          {catalogLoading ? (
            <div className="dcat-loading">Loading catalog…</div>
          ) : driverCatalog.length === 0 ? (
            <div className="dcat-empty">
              <div className="dcat-empty-icon">🛍️</div>
              <p className="dcat-empty-title">No catalog available</p>
              <p className="dcat-empty-sub">Apply to sponsors to unlock their reward catalogs.</p>
            </div>
          ) : (
            driverCatalog.map((catalog, idx) => {
              const sortedItems = [...catalog.items].sort((a, b) => {
                switch (sortOption) {
                  case "price_asc":   return a.price_usd - b.price_usd;
                  case "price_desc":  return b.price_usd - a.price_usd;
                  case "points_asc":  return a.point_cost - b.point_cost;
                  case "points_desc": return b.point_cost - a.point_cost;
                  default:            return 0;
                }
              });
              return (
                <div key={idx} className="dcat-sponsor-section">
                  <div className="dcat-sponsor-header">
                    <div className="dcat-sponsor-avatar">{catalog.sponsor_email?.[0]?.toUpperCase()}</div>
                    <div>
                      <p className="dcat-sponsor-name">{catalog.sponsor_email}</p>
                      {catalog.last_updated && (
                        <p className="dcat-sponsor-updated">
                          Updated {new Date(catalog.last_updated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                  </div>

                  {sortedItems.length === 0 ? (
                    <p className="dcat-no-results">No items match your search.</p>
                  ) : (
                    <div className="dcat-grid">
                      {sortedItems.map(item => (
                        <div key={item.id} className={`dcat-card${!item.is_active ? ' dcat-card--unavailable' : ''}`}>
                          <div className="dcat-card-img-wrap">
                            {item.image_url
                              ? <img className="dcat-card-img" src={item.image_url} alt={item.name} />
                              : <div className="dcat-card-img-placeholder">—</div>
                            }
                          </div>
                          <div className="dcat-card-body">
                            <p className="dcat-card-name" title={item.name}>{item.name}</p>
                            <div className="dcat-card-meta">
                              <span className="dcat-card-points">{item.point_cost?.toLocaleString()} pts</span>
                              <span className="dcat-card-price">${Number(item.price_usd).toFixed(2)}</span>
                            </div>
                          </div>
                          <div className="dcat-card-footer">
                            {item.is_active === false ? (
                              <span className="dcat-unavailable-badge">Unavailable</span>
                            ) : (
                              <button
                                className="dcat-add-btn"
                                onClick={() => addToCart(item, catalog.sponsor_id, catalog.sponsor_email)}
                              >
                                + Add to Cart
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Cart drawer overlay */}
      {cartOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            display: 'flex', justifyContent: 'flex-end',
          }}
        >
          <div
            onClick={() => setCartOpen(false)}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)' }}
          />
          <div style={{
            position: 'relative', width: '100%', maxWidth: '780px',
            background: '#f8fafc', height: '100%', overflowY: 'auto',
            padding: '28px 24px', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
          }}>
            <DriverCart
              user={user}
              cartItems={cart}
              transactions={transactions}
              balance={pointBalance}
              onRemoveItem={removeFromCart}
              onCheckout={handleCartCheckout}
              onClose={() => setCartOpen(false)}
              onBrowseCatalog={() => { setCartOpen(false); setActiveTab("catalog"); }}
            />
          </div>
        </div>
      )}
      {/* ── My Goals tab ── */}
      {activeTab === "goals" && (
        <div className="dd-goals-tab">
          <div className="dd-top-bar">
            <h1 className="dd-page-title">My Goals</h1>
            <button
              className="dd-new-goal-btn"
              onClick={() => { setShowGoalForm(v => !v); setGoalSuccessMsg(''); setGoalErrorMsg(''); }}
            >
              {showGoalForm ? '✕ Cancel' : '+ Personal Goal'}
            </button>
          </div>

          {goalSuccessMsg && <div className="dd-alert dd-alert-success">✓ {goalSuccessMsg}</div>}
          {goalErrorMsg   && <div className="dd-alert dd-alert-error">⚠ {goalErrorMsg}</div>}

          {showGoalForm && (
            <div className="dd-goal-form-card">
              <div className="dd-goal-form-header">
                <h2>Create Personal Goal</h2>
                <span></span>
              </div>
              <div className="dd-goal-form-grid">
                <div className="dd-goal-form-field dd-goal-form-full">
                  <label className="dd-goal-label">Goal Title</label>
                  <input className="dd-goal-input" type="text" placeholder="e.g. Reach 1,000 points by June"
                    value={goalTitle} onChange={e => setGoalTitle(e.target.value)} />
                </div>
                <div className="dd-goal-form-field">
                  <label className="dd-goal-label">Target Points</label>
                  <input className="dd-goal-input" type="number" min="1" placeholder="e.g. 1000"
                    value={goalTargetPoints} onChange={e => setGoalTargetPoints(e.target.value)} />
                </div>
                <div className="dd-goal-form-field">
                  <label className="dd-goal-label">Deadline <span className="dd-goal-optional">(optional)</span></label>
                  <input className="dd-goal-input" type="date"
                    value={goalDeadline} onChange={e => setGoalDeadline(e.target.value)} />
                </div>
                <div className="dd-goal-form-field dd-goal-form-full">
                  <label className="dd-goal-label">Description <span className="dd-goal-optional">(optional)</span></label>
                  <input className="dd-goal-input" type="text" placeholder="e.g. Stay consistent with safe driving this month"
                    value={goalDescription} onChange={e => setGoalDescription(e.target.value)} />
                </div>
                <div className="dd-goal-form-actions">
                  <button className="dd-goal-submit-btn" onClick={handleGoalSubmit} disabled={goalSubmitting}>
                    {goalSubmitting ? 'Saving…' : 'Create Goal'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {(() => {
            const allGoals = [
              ...personalGoals.map(g => ({ ...g, type: 'personal' })),
              ...goals.map(g => ({ ...g, type: 'sponsor' })),
            ];

            if (allGoals.length === 0) {
              return (
                <div className="dd-section">
                  <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>
                    No goals yet. Create a personal goal or wait for your sponsor to assign one.
                  </p>
                </div>
              );
            }

            return (
              <div className="dd-goals-grid">
                {allGoals.map(goal => {
                  const pct = Math.min(100, Math.round(((goal.current_points || 0) / goal.target_points) * 100));
                  const daysLeft = goal.deadline
                    ? Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24))
                    : null;
                  const overdue = daysLeft !== null && daysLeft < 0;
                  const urgent = daysLeft !== null && daysLeft >= 0 && daysLeft <= 3;
                  const isPersonal = goal.type === 'personal';

                  return (
                    <div key={`${goal.type}-${goal.id}`} className={`dd-goal-card ${goal.completed ? 'dd-goal-completed' : ''}`}>
                      <div className="dd-goal-top">
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span className={isPersonal ? 'dd-goal-type-personal' : 'dd-goal-type-sponsor'}>
                              {isPersonal ? 'Personal' : 'Sponsor'}
                            </span>
                            {!isPersonal && goal.sponsor_email && (
                              <span className="dd-goal-sponsor-name">{goal.sponsor_email}</span>
                            )}
                          </div>
                          <h3 className="dd-goal-title">{goal.title}</h3>
                          {goal.description && <p className="dd-goal-desc">{goal.description}</p>}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                          {goal.completed && <span className="dd-badge-complete">✓ Done</span>}
                          {!goal.completed && overdue && <span className="dd-badge-overdue">Overdue</span>}
                          {!goal.completed && urgent && <span className="dd-badge-urgent">{daysLeft}d left</span>}
                          {isPersonal && !goal.completed && (
                            <button className="dd-goal-delete-btn" onClick={() => handleDeletePersonalGoal(goal.id)} title="Delete goal">✕</button>
                          )}
                        </div>
                      </div>

                      <div className="dd-goal-progress-bar">
                        <div
                          className={`dd-goal-progress-fill ${goal.completed ? 'dd-goal-progress-done' : ''} ${isPersonal ? 'dd-goal-progress-personal' : ''}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="dd-goal-progress-labels">
                        <span>{(goal.current_points || 0).toLocaleString()} / {goal.target_points.toLocaleString()} pts</span>
                        <span>{pct}%</span>
                      </div>
                      {goal.deadline && (
                        <p className="dd-goal-deadline">Deadline: {formatDate(goal.deadline)}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {activeTab === "orders" && (
        <DriverOrders
          user={user}
          orders={transactions
            .filter(t => t.points < 0 && (t.description?.startsWith("Redeemed:") || t.description?.startsWith("Cancelled:")))
            .map(t => ({
              id: t.id,
              item_name: t.description.replace(/^(Redeemed|Cancelled): /, ""),
              created_at: t.created_at,
              points_spent: Math.abs(t.points),
              status: t.description.startsWith("Cancelled:") ? "CANCELLED" : "COMPLETED",
            }))
          }
          onBrowseCatalog={() => setActiveTab("catalog")}
          onCancelOrder={handleCancelOrder}
        />
      )}

      {activeTab === "points" && (
        <DriverPoints user={user} transactions={transactions} balance={pointBalance} />
      )}

      {activeTab === "profile" && (
        <DriverProfile user={user} applications={myApplications} transactions={transactions} balance={pointBalance} />
      )}

      </main>
    </div>
  );
}