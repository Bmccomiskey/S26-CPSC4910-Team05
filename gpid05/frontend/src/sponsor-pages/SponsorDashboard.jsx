import { useNavigate } from 'react-router-dom';
import AwardPoints from './AwardPoints';
import SponsorProfile from './SponsorProfile';
import SponsorGoals from './SponsorGoals';
import { useAuth } from '../useAuth';
import { useState, useEffect } from 'react';
import './SponsorDashboard.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';


export default function SponsorDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const navigate = useNavigate();
  const { user, loading } = useAuth('sponsor');

  const [applications, setApplications] = useState([]);
  const [pointsHistory, setPointsHistory] = useState([]);

  const [catalogItems, setCatalogItems] = useState([]);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [catalogLoading, setCatalogLoading] = useState(false);

  const fetchApplications = () => {
    fetch(`/applications/sponsor/${user.id}`, {
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => setApplications(data))
      .catch(err => console.error('Error fetching applications:', err));
  };

  const fetchPointsHistory = () => {
    fetch(`/points/sponsor/${user.id}/history`, {
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => setPointsHistory(data))
      .catch(err => console.error('Error fetching points history:', err));
  };

  const fetchCatalog = async () => {
    setCatalogLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/catalog/sponsor/${user.id}?search=${catalogSearch}&include_inactive=true`
      );
      const data = await res.json();
      setCatalogItems(data.items || []);
      setLastUpdated(data.last_updated);
    } catch (err) {
      console.error("Catalog fetch error:", err);
    }
    setCatalogLoading(false);
  };

  const refreshCatalog = async () => {
    try {
      await fetch(`${API_BASE}/catalog/${user.id}/refresh`, {
        method: "POST",
      });
      fetchCatalog();
    } catch (err) {
      console.error("Refresh failed:", err);
    }
  };

  useEffect(() => {
    if (user && activeTab === "catalog") {
      fetchCatalog();
    }
  }, [user, activeTab, catalogSearch]);
  useEffect(() => {
    if (user) {
      fetchApplications();
      fetchPointsHistory();
    }
  }, [user]);

  const handleApprove = async (id) => {
    await fetch(
      `/applications/${id}/approve?sponsor_id=${user.id}`,
      {
        method: 'POST',
        credentials: 'include',
      }
    );
    fetchApplications();
  };

  const removeItem = async (itemId) => {
    await fetch(`${API_BASE}/catalog/${user.id}/remove/${itemId}`, {
      method: "POST"
    });
    fetchCatalog();
  };
  const activateItem = async (itemId) => {
    await fetch(`${API_BASE}/catalog/${user.id}/activate/${itemId}`, {
      method: "POST"
    });
    fetchCatalog();
  };

  const handleReject = async (id) => {
    await fetch(
      `/applications/${id}/reject?sponsor_id=${user.id}`,
      {
        method: 'POST',
        credentials: 'include',
      }
    );
    fetchApplications();
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

  if (loading) return <div style={{ padding: '40px', fontSize: '18px' }}>Loading...</div>;
  if (!user) return null;

  return (
    <div className="sd-container">
      <div className="sd-sidebar">
        <div className="sd-sidebar-header">
          <div className="sd-sidebar-brand">
            <div className="sd-sidebar-brand-icon">⭑</div>
            <div>
              <h2 className="sd-sidebar-title">Sponsor Portal</h2>
              <p className="sd-sidebar-subtitle">Fleet Rewards</p>
            </div>
          </div>
        </div>

        <nav className="sd-nav">
          <button
            className={`sd-nav-item ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
            <span className="sd-nav-icon">⊞</span> Dashboard
          </button>
          <button
            className={`sd-nav-item ${activeTab === "manageDrivers" ? "active" : ""}`}
            onClick={() => setActiveTab("manageDrivers")}
          >
            <span className="sd-nav-icon">◧</span> Manage Drivers
          </button>

          <div className="sd-nav-divider" />

          <button
            className={`sd-nav-item ${activeTab === "awardPoints" ? "active" : ""}`}
            onClick={() => setActiveTab("awardPoints")}
<<<<<<< Updated upstream:gpid05/frontend/src/sponsor-pages/SponsorDashboard.jsx
          >
            <span className="sd-nav-icon">◈</span> Award Points
          </button>
          <button
            className={`sd-nav-item ${activeTab === "goals" ? "active" : ""}`}
            onClick={() => setActiveTab("goals")}
          >
            <span className="sd-nav-icon">◎</span> Driver Goals
          </button>
          <a className="sd-nav-item" href="#">
            <span className="sd-nav-icon">⊙</span> Catalog
          </a>

          <div className="sd-nav-divider" />

=======
          >Award Points
          </button>
          <button
          className={`sd-nav-item ${activeTab === "catalog" ? "active" : ""}`}
          onClick={() => setActiveTab("catalog")}
          >Catalog
          </button>
>>>>>>> Stashed changes:gpid05/frontend/src/SponsorDashboard.jsx
          <button
            className={`sd-nav-item ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            <span className="sd-nav-icon">◯</span> Profile
          </button>
        </nav>

        <div className="sd-sidebar-footer">
          <div className="sd-user-card">
            <div className="sd-user-avatar">
              {user?.email?.[0]?.toUpperCase() || 'S'}
            </div>
            <div className="sd-user-info">
              <p className="sd-user-name">{user?.email || 'Sponsor'}</p>
              <p className="sd-user-role">Sponsor account</p>
            </div>
          </div>
          <button className="sd-logout-btn" onClick={handleLogout}>
            ⎋ Sign Out
          </button>
        </div>
      </div>

      <main className="sd-main">
        {activeTab === "dashboard" && (
          <>
            <div className="sd-top-bar">
              <h1 className="sd-page-title">Sponsor Dashboard</h1>
            </div>
            <div className="sd-stats-grid">
              <div className="sd-stat-card">
                <p className="sd-stat-label">Active Drivers</p>
                <p className="sd-stat-value">14</p>
              </div>
              <div className="sd-stat-card">
                <p className="sd-stat-label">Points Awarded</p>
                <p className="sd-stat-value">8,400</p>
              </div>
              <div className="sd-stat-card">
                <p className="sd-stat-label">Points Redeemed</p>
                <p className="sd-stat-value">3,120</p>
              </div>
              <div className="sd-stat-card">
                <p className="sd-stat-label">Catalog Items</p>
                <p className="sd-stat-value">32</p>
              </div>
            </div>
            <div className="sd-section">...</div>
          </>
        )}

        {activeTab === "manageDrivers" && (
          <>
            <div className="sd-top-bar">
              <h1 className="sd-page-title">Manage Driver Applications</h1>
            </div>
            <h2>Pending Applications</h2>
            <table className="sd-table">
              <thead>
                <tr>
                  <th>Driver</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.filter(app => app.status === "PENDING").map((app) => (
                  <tr key={app.id}>
                    <td>{app.driver_email}</td>
                    <td>{app.status}</td>
                    <td>
                      <button onClick={() => handleApprove(app.id)}>Approve</button>
                      <button onClick={() => handleReject(app.id)}>Reject</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h2 style={{ marginTop: "40px" }}>Approved Drivers</h2>
            <table className="sd-table">
              <thead>
                <tr>
                  <th>Driver</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {applications.filter(app => app.status === "APPROVED").map((app) => (
                  <tr key={app.id}>
                    <td>{app.driver_email}</td>
                    <td><span style={{ color: "green", fontWeight: "bold" }}>APPROVED</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {activeTab === "awardPoints" && (
          <AwardPoints
            user={user}
            approvedDrivers={applications.filter(a => a.status === "APPROVED")}
            pointsHistory={pointsHistory}
            onAward={fetchPointsHistory}
          />
        )}

        {activeTab === "goals" && (
          <SponsorGoals
            user={user}
            approvedDrivers={applications.filter(a => a.status === "APPROVED")}
          />
        )}

        {activeTab === "profile" && (
          <SponsorProfile user={user} applications={applications} />
        )}
<<<<<<< Updated upstream:gpid05/frontend/src/sponsor-pages/SponsorDashboard.jsx
=======

        {activeTab === "catalog" && (
          <div className="sd-section">
            <h2>Catalog</h2>
            <div style={{ marginBottom: "15px" }}>
              <button onClick={refreshCatalog}>
                Refresh Catalog
              </button>
            </div>
            {lastUpdated && (
              <p>
                Last Updated: {new Date(lastUpdated).toLocaleString()}
              </p>
            )}
            <input
            type="text"
            placeholder="Search catalog..."
            value={catalogSearch}
            onChange={(e) => setCatalogSearch(e.target.value)}
            style={{ marginBottom: "15px", padding: "5px" }}
            />
            {catalogLoading ? (
              <p>Loading...</p>
            ) : (
            <table className="sd-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Points</th>
                  <th>Price (USD)</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {catalogItems.map((item) => (
                  <tr
                  key={item.id}
                  style={{
                    opacity: item.is_active ? 1 : 0.4
                  }}
                  >
                    <td>{item.name}</td>
                    <td>{item.point_cost}</td>
                    <td>${item.price_usd}</td>
                    <td>
                      {!item.is_active && (
                        <span style={{ color: "red", marginRight: "10px"}}>
                          Outside Budget
                        </span>
                      )}
                      {item.is_active ? (
                        <button onClick={() => removeItem(item.id)}>
                          Remove
                          </button>
                          ) : (
                          <button onClick={() => activateItem(item.id)}>
                            Add Back
                          </button>
                        )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          </div>
        )}
>>>>>>> Stashed changes:gpid05/frontend/src/SponsorDashboard.jsx
      </main>
      </div>
      );
    }