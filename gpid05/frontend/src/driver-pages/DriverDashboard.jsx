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
  const [selectedSponsor, setSelectedSponsor] = useState('');
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

  const fetchDriverCatalog = async () => {
    setCatalogLoading(true);
    try {
      const resApps = await fetch(
        `${API_BASE}/applications/driver/${user.id}`
      );
      const applications = await resApps.json();
      const approved = applications.filter(
        app => app.status === "APPROVED"
      );

      const catalogs = [];

      for (let app of approved) {
        const resCatalog = await fetch(
          `${API_BASE}/catalog/sponsor/${app.sponsor_id}?search=${catalogSearch}`
        );
        const data = await resCatalog.json();

        catalogs.push({
          sponsor_id: app.sponsor_id,
          sponsor_email: app.sponsor_email,
          last_updated: data.last_updated,
          items: data.items
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
  fetch(`/points/driver/${user.id}/balance`, { credentials: 'include' })
    .then(res => res.json())
    .then(data => setPointBalance(Number(data.balance || 0)))
    .catch(err => console.error("Error fetching point balance:", err));
};

useEffect(() => {
  if (user && activeTab === "catalog") {
    fetchDriverCatalog();
  }
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
    fetch(`/points/driver/${user.id}/history`, { credentials: 'include' })
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
    if (user) {
      fetch(`/applications/driver/${user.id}`)
        .then(res => res.json())
        .then(data => setMyApplications(data))
        .catch(err => console.error("Error fetching applications:", err));

      fetchTransactions();
      fetchPointBalance();
      fetchGoals();
      fetchPersonalGoals();
    }
  }, [user]);

  // Re-fetch transactions every time the points tab is opened
  useEffect(() => {
    if (activeTab === "points") { fetchTransactions(); fetchPointBalance(); }
    if (activeTab === "goals") { fetchGoals(); fetchPersonalGoals(); }
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

const redeemItem = async (item, sponsorId) => {
  const res = await fetch(`${API_BASE}/points/redeem`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      driver_id: user.id,
      sponsor_id: sponsorId,
      item_id: item.id,
      item_name: item.name,
      point_cost: item.point_cost
    })
  });

  const data = await res.json();

  if (!res.ok) {
    alert(data.detail);
    return;
  }

  alert("Redemption successful!");

  // Refresh balance + history
  fetchTransactions();
  fetchPointBalance();
};

  const addToCart = (item, sponsorId, sponsorEmail) => {
    const alreadyInCart = cart.some(ci => ci.id === item.id && ci.sponsor_id === sponsorId);
    if (alreadyInCart) {
      alert(`"${item.name}" is already in your cart.`);
      return;
    }
    setCart(prev => [...prev, { ...item, sponsor_id: sponsorId, sponsor_email: sponsorEmail }]);
  };

  const removeFromCart = (index) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const handleCartCheckout = async () => {
    if (cart.length === 0) return;
    const errors = [];
    for (const item of cart) {
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
  console.log(myApplications);
  return (
    <div className="dd-container">
      <div className="dd-sidebar">
        <div className="dd-sidebar-header">
          <h2 className="dd-sidebar-title">Driver Portal</h2>
        </div>
        <nav className="dd-nav">
          <button
            className={`dd-nav-item ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
          Dashboard
          </button>

          <button
            className={`dd-nav-item ${activeTab === "apply" ? "active" : ""}`}
            onClick={() => setActiveTab("apply")}
          >
          Apply for Sponsorship
          </button>

          <button
            className={`dd-nav-item ${activeTab === "points" ? "active" : ""}`}
            onClick={() => setActiveTab("points")}
          >My Points</button>
          <button
            className={`dd-nav-item ${activeTab === "goals" ? "active" : ""}`}
            onClick={() => setActiveTab("goals")}
          >My Goals</button>
          <button
            className={`dd-nav-item ${activeTab === "catalog" ? "active" : ""}`}
            onClick={() => setActiveTab("catalog")}
          >
            Catalog
          </button>
          <button
            className={`dd-nav-item ${activeTab === "orders" ? "active" : ""}`}
            onClick={() => setActiveTab("orders")}
          >My Orders</button>
          <button
            className={`dd-nav-item ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >Profile</button>
        </nav>
        <button className="dd-logout-btn" onClick={handleLogout}>
          Sign Out
        </button>
      </div>

      <main className="dd-main">
        {isSponsorViewing && (
          <div style={{ padding: "10px 14px", background: "#d1ecf1", border: "1px solid #bee5eb", borderRadius: 8, marginBottom: 12 }}>
            <strong>Sponsor View:</strong> You are viewing the driver dashboard as {localStorage.getItem("userEmail")}.
            <button className="dd-new-goal-btn" style={{ marginLeft: 12 }} onClick={exitSponsorView}>
              Return to Sponsor Dashboard
            </button>
          </div>
        )}
        {isImpersonating && (
          <div style={{ padding: "10px 14px", background: "#fff3cd", border: "1px solid #ffeeba", borderRadius: 8, marginBottom: 12 }}>
            <strong>Impersonation mode:</strong> You are viewing this account as an admin.
            <button style={{ marginLeft: 12 }} onClick={exitImpersonation}>
              Exit
            </button>
          </div>
        )}

        {activeTab === "dashboard" && (
          <>
            <div className="dd-top-bar">
              <h1 className="dd-page-title">Driver Dashboard</h1>
            </div>

            {goals.length === 0 ? (
              <div className="dd-section">
                <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>
                  No active goals yet. Your sponsor will set point goals for you here.
                </p>
              </div>
            ) : (
              <>
                <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 14px' }}>
                  Your Active Goals
                </h2>
                <div className="dd-goals-grid">
                  {goals.map(goal => {
                    const pct = Math.min(100, Math.round((goal.current_points / goal.target_points) * 100));
                    const daysLeft = goal.deadline
                      ? Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24))
                      : null;
                    const overdue = daysLeft !== null && daysLeft < 0;

                    return (
                      <div key={goal.id} className={`dd-goal-card ${goal.completed ? 'dd-goal-completed' : ''}`}>
                        <div className="dd-goal-top">
                          <div>
                            <p className="dd-goal-sponsor">{goal.sponsor_email}</p>
                            <h3 className="dd-goal-title">{goal.title}</h3>
                            {goal.description && <p className="dd-goal-desc">{goal.description}</p>}
                          </div>
                          {goal.completed && <span className="dd-badge-complete">✓ Done</span>}
                          {!goal.completed && overdue && <span className="dd-badge-overdue">Overdue</span>}
                          {!goal.completed && daysLeft !== null && daysLeft >= 0 && daysLeft <= 3 && (
                            <span className="dd-badge-urgent">{daysLeft}d left</span>
                          )}
                        </div>

                        <div className="dd-goal-progress-bar">
                          <div
                            className={`dd-goal-progress-fill ${goal.completed ? 'dd-goal-progress-done' : ''}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="dd-goal-progress-labels">
                          <span>{goal.current_points.toLocaleString()} / {goal.target_points.toLocaleString()} pts</span>
                          <span>{pct}%</span>
                        </div>

                        {goal.deadline && (
                          <p className="dd-goal-deadline">
                            Deadline: {new Date(goal.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}

      {activeTab === "apply" && (
        <>
        <div className="dd-top-bar">
          <h1 className="dd-page-title">Apply for Sponsorship</h1>
        </div>

        <div className="dd-section">
          {successMessage && (
            <p style={{ marginBottom: "15px", color: "green" }}>
              {successMessage}
              </p>
            )}
            {errorMessage && (
              <p style={{ marginBottom: "15px", color: "red" }}>
                {errorMessage}
                </p>
              )}
          <div className="dd-table-wrapper">
            <table className="dd-table">
              <thead>
                <tr>
                  <th>Sponsor</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {sponsors.map((sponsor, i) => (
                  <tr key={sponsor.id}>
                    <td>{sponsor.email}</td>
                    <td>
                    {(() => {
                      const existing = myApplications.find(
                        app => app.sponsor_id === sponsor.id && app.status === "pending"
                      );

                      if (existing) {
                        return <span>Pending</span>;
                      } 
                      return(
                        <button className="dd-new-goal-btn" onClick={() => handleApply(sponsor.id)}>
                          Apply
                        </button>
                      );
                      
                    })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ marginTop: "40px" }}>
              <h2>My Sponsorship Status</h2>
              <table className="dd-table">
                <thead>
                  <tr>
                    <th>Sponsor</th>
                    <th>Status</th>
                    </tr>
                    </thead>
                    <tbody>
                      {myApplications.map((app) => (
                        <tr key={app.id}>
                          <td>{app.sponsor_email}</td>
                          <td>
                            {app.status === "APPROVED" && (
                              <span style={{ color: "green", fontWeight: "bold" }}>
                                APPROVED
                                </span>
                            )}
                            {app.status === "PENDING" && (
                              <span style={{ color: "orange" }}>
                                PENDING
                                </span>
                            )}
                            {app.status === "REJECTED" && (
                              <span style={{ color: "red" }}>
                                REJECTED
                                </span>
                            )}
                            </td>
                            </tr>
                          ))}
                          </tbody>
                          </table>
                          </div>

            {sponsors.length === 0 && (
              <p style={{ marginTop: "20px" }}>
                No sponsors available.
              </p>
            )}
          </div>
        </div>
          </>
        )}
      
      {activeTab === "catalog" && (
        <div className="dd-section">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ margin: 0 }}>Available Rewards</h2>
            <button
              onClick={() => setCartOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 18px', background: '#1e293b', color: '#fff',
                border: 'none', borderRadius: '8px', fontSize: '14px',
                fontWeight: '700', fontFamily: 'inherit', cursor: 'pointer',
                position: 'relative',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
              Cart
              {cart.length > 0 && (
                <span style={{
                  background: '#F59E0B', color: '#0f172a', borderRadius: '999px',
                  fontSize: '11px', fontWeight: '800', padding: '1px 7px', lineHeight: '1.6',
                }}>
                  {cart.length}
                </span>
              )}
            </button>
          </div>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            style={{ marginBottom: "15px", padding: "5px" }}
          >
            <option value="none">Sort</option>
            <option value="price_asc">Price: Low → High</option>
            <option value="price_desc">Price: High → Low</option>
            <option value="points_asc">Points: Low → High</option>
            <option value="points_desc">Points: High → Low</option>
          </select>
          <input
            type="text"
            placeholder="Search catalog..."
            value={catalogSearch}
            onChange={(e) => setCatalogSearch(e.target.value)}
            style={{ marginBottom: "15px", padding: "5px" }}
          />
          {catalogLoading ? (
            <p>Loading...</p>
          ) : driverCatalog.length === 0 ? (
            <p>No approved sponsors or no catalog available.</p>
          ) : (
            driverCatalog.map((catalog, idx) => (
              <div key={idx} style={{ marginBottom: "40px" }}>
                <h3>{catalog.sponsor_email}</h3>
                {catalog.last_updated && (
                  <p>Last Updated: {new Date(catalog.last_updated).toLocaleString()}</p>
                )}
                <table className="dd-table">
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Name</th>
                      <th>Points</th>
                      <th>Price (USD)</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const sortedItems = [...catalog.items].sort((a, b) => {
                        switch (sortOption) {
                          case "price_asc":   return a.price_usd - b.price_usd;
                          case "price_desc":  return b.price_usd - a.price_usd;
                          case "points_asc":  return a.point_cost - b.point_cost;
                          case "points_desc": return b.point_cost - a.point_cost;
                          default:            return 0;
                        }
                      });

                      if (sortedItems.length === 0) {
                        return (
                          <tr>
                            <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                              No items match your search. Try adjusting your search criteria.
                            </td>
                          </tr>
                        );
                      }

                      return sortedItems.map((item) => (
                        <tr key={item.id}>
                          <td>
                            {item.image_url && (
                              <img
                                src={item.image_url}
                                alt={item.name}
                                style={{
                                  width: "60px",
                                  height: "60px",
                                  objectFit: "contain",
                                  borderRadius: "6px"
                                }}
                              />
                            )}
                          </td>
                          <td>{item.name}</td>
                          <td>{item.point_cost}</td>
                          <td>${item.price_usd}</td>
                          <td>
                            <button
                              className="dd-add-cart-btn"
                              onClick={() => addToCart(item, catalog.sponsor_id, catalog.sponsor_email)}
                            >
                              + Add to Cart
                            </button>
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            ))
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
            .filter(t => t.points < 0 && t.description?.startsWith("Redeemed:"))
            .map(t => ({
              id: t.id,
              item_name: t.description.replace("Redeemed: ", ""),
              created_at: t.created_at,
              points_spent: Math.abs(t.points),
              status: "COMPLETED",
            }))
          }
          onBrowseCatalog={() => setActiveTab("catalog")}
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