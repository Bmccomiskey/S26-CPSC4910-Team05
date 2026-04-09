import { useNavigate } from 'react-router-dom';
import AwardPoints from './AwardPoints';
import SponsorProfile from './SponsorProfile';
import SponsorGoals from './SponsorGoals';
import { useAuth } from '../useAuth';
import { useState, useEffect } from 'react';
import './SponsorDashboard.css';
const API_BASE =
  process.env.NODE_ENV === "production"
    ? "http://23.22.72.87"
    : "http://localhost:8000";

console.log("API_BASE in production:", API_BASE);

function NotificationForm({ userRole }) {
  const [recipient, setRecipient] = useState('drivers');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!subject || !message) {
      setError('Subject and message are required');
      return;
    };

    setSending(true);
    setError('');
    setSuccess('');

    try {
      const endpoint = userRole === 'admin'
        ? `/auth/admin/notify-${recipient}`
        : '/auth/sponsor/notify-drivers';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ subject, message, sponsor_id: 1 })
      });

      if (!res.ok) throw new Error('Failed to send notification');

      const data = await res.json();
      setSuccess(data.message);
      setSubject('');
      setMessage('');
    } catch (err) {
      setError(err.message);
    }

    setSending(false);
  };

  return (
    <div className="sd-section">
      {userRole === 'admin' && (
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
            Send to:
          </label>
          <select
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', width: '200px' }}
          >
            <option value="drivers">All Drivers</option>
            <option value="sponsors">All Sponsors</option>
          </select>
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
          Subject:
        </label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Enter email subject"
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', width: '100%', maxWidth: '500px' }}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
          Message:
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter your message"
          rows="6"
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', width: '100%', maxWidth: '500px' }}
        />
      </div>

      {error && <p style={{ color: 'red', marginBottom: '10px' }}>{error}</p>}
      {success && <p style={{ color: 'green', marginBottom: '10px' }}>{success}</p>}

      <button
        className="sd-nav-item"
        style={{ width: 'auto' }}
        onClick={handleSend}
        disabled={sending}
      >
        {sending ? 'Sending...' : 'Send Notification'}
      </button>
    </div>
  );
}

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
  const [sortOption, setSortOption] = useState("none");

  const [externalSearch, setExternalSearch] = useState("");
  const [externalItems, setExternalItems] = useState([]);
  const [externalLoading, setExternalLoading] = useState(false);

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

  const fetchExternalCatalog = async () => {
    setExternalLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/catalog/external/search?search=${encodeURIComponent(externalSearch)}`
      );
      const data = await res.json();
      setExternalItems(data.items || []);
    } catch (err) {
      console.error("External catalog fetch error:", err);
    }
    setExternalLoading(false);
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

  const addExternalItem = async (externalId) => {
    try {
      await fetch(`${API_BASE}/catalog/${user.id}/add-external/${externalId}`, {
        method: "POST"
      });
      fetchCatalog();
    } catch (err) {
      console.error("Add external item failed:", err);
    }
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

  const handleDropDriver = async (id) => {
    if (!window.confirm('Are you sure you want to drop this driver? They will lose access to your sponsorship.')) return;
    await fetch(`/applications/${id}/drop?sponsor_id=${user.id}`, {
      method: 'POST',
      credentials: 'include',
    });
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

  const handleViewAsDriver = (driverEmail, driverId) => {
    localStorage.setItem("sponsorViewerRole", localStorage.getItem("userRole"));
    localStorage.setItem("sponsorViewerEmail", localStorage.getItem("userEmail"));
    localStorage.setItem("sponsorViewerId", localStorage.getItem("userId"));
    localStorage.setItem("isSponsorViewing", "true");

    localStorage.setItem("userRole", "user");
    localStorage.setItem("userEmail", driverEmail);
    localStorage.setItem("userId", String(driverId));

    navigate("/driver-dashboard");
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
          >
            <span className="sd-nav-icon">◈</span> Award Points
          </button>
          <button
            className={`sd-nav-item ${activeTab === "goals" ? "active" : ""}`}
            onClick={() => setActiveTab("goals")}
          >
            <span className="sd-nav-icon">◎</span> Driver Goals
          </button>
          <button
            className={`sd-nav-item ${activeTab === "notifications" ? "active" : ""}`}
            onClick={() => setActiveTab("notifications")}
          >
            <span className="sd-nav-icon">✉</span> Send Notifications
          </button>
          <button
            className={`sd-nav-item ${activeTab === "catalog" ? "active" : ""}`}
            onClick={() => setActiveTab("catalog")}
          >
            <span className="sd-nav-icon">⊙</span> Catalog
          </button>

          <div className="sd-nav-divider" />

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
                      <button className="sd-btn sd-btn-approve" onClick={() => handleApprove(app.id)}>Approve</button>
                      <button className="sd-btn sd-btn-reject" onClick={() => handleReject(app.id)}>Reject</button>
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
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.filter(app => app.status === "APPROVED").map((app) => (
                  <tr key={app.id}>
                    <td>{app.driver_email}</td>
                    <td><span style={{ color: "green", fontWeight: "bold" }}>APPROVED</span></td>
                    <td>
                      <button className="sd-btn sd-btn-approve" onClick={() => handleViewAsDriver(app.driver_email, app.driver_id)}>
                        View as Driver
                      </button>
                      <button className="sd-btn sd-btn-drop" onClick={() => handleDropDriver(app.id)}>
                        Drop Driver
                      </button>
                    </td>
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
            <div style={{ marginTop: "25px", marginBottom: "25px" }}>
  <h3>Add New Item to Catalog</h3>

  <input
    type="text"
    placeholder="Search external products..."
    value={externalSearch}
    onChange={(e) => setExternalSearch(e.target.value)}
    style={{ marginBottom: "10px", padding: "5px", marginRight: "10px" }}
  />

  <button onClick={fetchExternalCatalog}>
    Search External Products
  </button>
  {externalLoading ? (
    <p style={{ marginTop: "10px" }}>Searching...</p>
  ) : (
    externalItems.length > 0 && (
    <table className="sd-table" style={{ marginTop: "15px" }}>
      <thead>
        <tr>
          <th>Name</th>
          <th>Price (USD)</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {externalItems.map((item) => (
          <tr key={item.external_id}>
            <td>{item.name}</td>
            <td>${item.price_usd}</td>
            <td>
              <button onClick={() => addExternalItem(item.external_id)}>
                Add to Catalog
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    )
    )}
    </div>
            {catalogLoading ? (
              <p>Loading...</p>
            ) : (
            <table className="sd-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Points</th>
                  <th>Price (USD)</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {[...catalogItems]
                .sort((a, b) => {
                  switch (sortOption) {
                    case "price_asc":
                      return a.price_usd - b.price_usd;
                    case "price_desc":
                      return b.price_usd - a.price_usd;
                    case "points_asc":
                      return a.point_cost - b.point_cost;
                    case "points_desc":
                      return b.point_cost - a.point_cost;
                    default:
                      return 0;
                    }
                  })
                .map((item) => (
                <tr
                key={item.id}
                style={{
                  opacity: item.is_active ? 1 : 0.4
                }}
                >
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
                    {!item.is_active && (
                      <span style={{ color: "red", marginRight: "10px" }}>
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
        {activeTab === "notifications" && (
          <>
            <div className="sd-top-bar">
              <h1 className="sd-page-title">Send Notifications</h1>
            </div>
            <NotificationForm userRole="sponsor" />
          </>
        )}
      </main>
      </div>
      );
    }