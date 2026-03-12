import { useNavigate } from 'react-router-dom';
import DriverOrders from './DriverOrders';
import DriverPoints from './DriverPoints';
import DriverProfile from './DriverProfile';
import { useAuth } from '../useAuth';
import { useState, useEffect } from 'react';
import './DriverDashboard.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';


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
  const [driverCatalog, setDriverCatalog] = useState([]);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogLoading, setCatalogLoading] = useState(false);

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
      .then(data => setGoals(data))
      .catch(err => console.error("Error fetching goals:", err));
  };

  useEffect(() => {
    if (user) {
      fetch(`/applications/driver/${user.id}`)
        .then(res => res.json())
        .then(data => setMyApplications(data))
        .catch(err => console.error("Error fetching applications:", err));

      fetchTransactions();
      fetchGoals();
    }
  }, [user]);

  // Re-fetch transactions every time the points tab is opened
  useEffect(() => {
    if (activeTab === "points") {
      fetchTransactions();
    }
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

  const isImpersonating = localStorage.getItem("isImpersonating") === "true";
  const exitImpersonation = async () => {
    try {
      await fetch("/admin/impersonate/stop", { method: "POST", credentials: "include" });
    } catch (e) {}

    // restore original admin identity
    localStorage.setItem("userRole", localStorage.getItem("impersonatorRole") || "admin");
    localStorage.setItem("userEmail", localStorage.getItem("impersonatorEmail") || "");
    localStorage.setItem("userId", localStorage.getItem("impersonatorId") || "");

    localStorage.removeItem("isImpersonating");
    localStorage.removeItem("impersonatorRole");
    localStorage.removeItem("impersonatorEmail");
    localStorage.removeItem("impersonatorId");

    window.location.href = "/admin-dashboard";
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
                        <button onClick={() => handleApply(sponsor.id)}>
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
          <h2>Available Rewards</h2>
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
              <p>
                Last Updated: {new Date(catalog.last_updated).toLocaleString()}
              </p>
            )}
            <table className="dd-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Points</th>
                  <th>Price (USD)</th>
                  </tr>
                  </thead>
                <tbody>
                  {catalog.items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>{item.point_cost}</td>
                      <td>${item.price_usd}</td>
                  </tr>
                ))}
                </tbody>
              </table>
            </div>
            ))
            )}
            </div>
          )}
      {activeTab === "orders" && (
        <DriverOrders user={user} orders={[]} />
      )}

      {activeTab === "points" && (
        <DriverPoints user={user} transactions={transactions} />
      )}

      {activeTab === "profile" && (
        <DriverProfile user={user} applications={myApplications} transactions={transactions} />
      )}

      </main>
    </div>
  );
}