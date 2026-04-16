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

      const params = new URLSearchParams({ subject, message });
      if (userRole === 'sponsor') params.append('sponsor_id', '1');

      const res = await fetch(endpoint + '?' + params.toString(), {
        method: 'POST',
        credentials: 'include',
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

  const [customItem, setCustomItem] = useState({
    name: "",
    description: "",
    image_url: "",
    price_usd: ""
  });

  const [notificationHistory, setNotificationHistory] = useState([]);
  const [scheduledNotifications, setScheduledNotifications] = useState([]);

  const updateCustomItem = (key, value) => {
    setCustomItem(prev => ({ ...prev, [key]: value }));
  };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeTab, catalogSearch]);
  useEffect(() => {
    if (user) {
      fetchApplications();
      fetchPointsHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const addCustomItem = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/catalog/${user.id}/custom`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          sponsor_id: user.id,
          name: customItem.name,
          description: customItem.description,
          image_url: customItem.image_url,
          price_usd: parseFloat(customItem.price_usd)
        })
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("Failed to add custom item:", data);
        return;
      }
      setCustomItem({
        name: "",
        description: "",
        image_url: "",
        price_usd: ""
      });
      fetchCatalog();
    } catch (err) {
      console.error("Add custom item failed:", err);
    }
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

  const fetchNotificationHistory = async () => {
    try {
      const res = await fetch(`/auth/sponsor/notification-history?sponsor_id=${user.id}`, {
        credentials: 'include'
      });
      const data = await res.json();
      setNotificationHistory(data);
    } catch (err) {
      console.error('Error fetching notification history:', err);
    }
  };

  const fetchScheduledNotifications = async () => {
    try {
      const res = await fetch(`/auth/sponsor/scheduled-notifications?sponsor_id=${user.id}`, {
        credentials: 'include'
      });
      const data = await res.json();
      setScheduledNotifications(data);
    } catch (err) {
      console.error('Error fetching scheduled notifications:', err);
    }
  };

  const cancelScheduledNotification = async (notifId) => {
    try {
      await fetch(`/auth/sponsor/scheduled-notification/${notifId}?sponsor_id=${user.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      fetchScheduledNotifications();
    } catch (err) {
      console.error('Error cancelling notification:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'notificationHistory') fetchNotificationHistory();
    if (activeTab === 'scheduledNotifications') fetchScheduledNotifications();
  }, [activeTab]);

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
            className={`sd-nav-item ${activeTab === "notificationHistory" ? "active" : ""}`}
            onClick={() => setActiveTab("notificationHistory")}
          >
            <span className="sd-nav-icon">📋</span> Notification History
          </button>

          <button
            className={`sd-nav-item ${activeTab === "scheduledNotifications" ? "active" : ""}`}
            onClick={() => setActiveTab("scheduledNotifications")}
          >
            <span className="sd-nav-icon">⏰</span> Scheduled Notifications
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
          <div className="cat-root">

            {/* ── Page header ── */}
            <div className="cat-page-header">
              <div>
                <h1 className="cat-page-title">Product Catalog</h1>
                <p className="cat-page-sub">Manage the items available to your approved drivers</p>
              </div>
              <div className="cat-header-actions">
                {lastUpdated && (
                  <span className="cat-updated-pill">
                    Updated {new Date(lastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                )}
                <button className="cat-refresh-btn" onClick={refreshCatalog}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                    <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
                  </svg>
                  Refresh Catalog
                </button>
              </div>
            </div>

            {/* ── Toolbar ── */}
            <div className="cat-toolbar">
              <div className="cat-search-wrap">
                <svg className="cat-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  className="cat-search-input"
                  type="text"
                  placeholder="Search catalog..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                />
              </div>
              <select
                className="cat-sort-select"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
              >
                <option value="none">Sort by…</option>
                <option value="price_asc">Price: Low → High</option>
                <option value="price_desc">Price: High → Low</option>
                <option value="points_asc">Points: Low → High</option>
                <option value="points_desc">Points: High → Low</option>
              </select>
            </div>

            {/* ── Add panels ── */}
            <div className="cat-add-row">

              {/* Custom item */}
              <div className="cat-add-card">
                <div className="cat-add-card-header">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
                  </svg>
                  <h3 className="cat-add-card-title">Add Custom Item</h3>
                </div>
                <form onSubmit={addCustomItem} className="cat-custom-form">
                  <input
                    className="cat-form-input"
                    type="text"
                    placeholder="Item name *"
                    value={customItem.name}
                    onChange={(e) => updateCustomItem("name", e.target.value)}
                    required
                  />
                  <textarea
                    className="cat-form-input cat-form-textarea"
                    placeholder="Description"
                    value={customItem.description}
                    onChange={(e) => updateCustomItem("description", e.target.value)}
                    rows="2"
                  />
                  <input
                    className="cat-form-input"
                    type="text"
                    placeholder="Image URL"
                    value={customItem.image_url}
                    onChange={(e) => updateCustomItem("image_url", e.target.value)}
                  />
                  <input
                    className="cat-form-input"
                    type="number"
                    step="0.01"
                    placeholder="Price (USD) *"
                    value={customItem.price_usd}
                    onChange={(e) => updateCustomItem("price_usd", e.target.value)}
                    required
                  />
                  <button type="submit" className="cat-add-submit-btn">Add to Catalog</button>
                </form>
              </div>

              {/* External search */}
              <div className="cat-add-card">
                <div className="cat-add-card-header">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <h3 className="cat-add-card-title">Search External Products</h3>
                </div>
                <div className="cat-ext-search-row">
                  <input
                    className="cat-form-input"
                    type="text"
                    placeholder="Search products…"
                    value={externalSearch}
                    onChange={(e) => setExternalSearch(e.target.value)}
                  />
                  <button className="cat-ext-search-btn" onClick={fetchExternalCatalog}>
                    Search
                  </button>
                </div>
                {externalLoading ? (
                  <p className="cat-loading-text">Searching…</p>
                ) : externalItems.length > 0 && (
                  <div className="cat-ext-results">
                    {externalItems.map((item) => (
                      <div key={item.external_id} className="cat-ext-result-row">
                        <span className="cat-ext-result-name">{item.name}</span>
                        <span className="cat-ext-result-price">${item.price_usd}</span>
                        <button
                          className="cat-ext-add-btn"
                          onClick={() => addExternalItem(item.external_id)}
                        >
                          + Add
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Catalog grid ── */}
            {catalogLoading ? (
              <div className="cat-loading-state">Loading catalog…</div>
            ) : catalogItems.length === 0 ? (
              <div className="cat-empty">
                <p className="cat-empty-title">No items in your catalog yet</p>
                <p className="cat-empty-sub">Refresh from the external store or add a custom item above.</p>
              </div>
            ) : (
              <div className="cat-grid">
                {[...catalogItems]
                  .sort((a, b) => {
                    switch (sortOption) {
                      case "price_asc":  return a.price_usd - b.price_usd;
                      case "price_desc": return b.price_usd - a.price_usd;
                      case "points_asc": return a.point_cost - b.point_cost;
                      case "points_desc": return b.point_cost - a.point_cost;
                      default: return 0;
                    }
                  })
                  .map((item) => (
                    <div key={item.id} className={`cat-card${!item.is_active ? ' cat-card--inactive' : ''}`}>
                      <div className="cat-card-img-wrap">
                        {item.image_url
                          ? <img className="cat-card-img" src={item.image_url} alt={item.name} />
                          : <div className="cat-card-img-placeholder">—</div>
                        }
                        {!item.is_active && (
                          <span className="cat-card-budget-badge">Outside Budget</span>
                        )}
                      </div>
                      <div className="cat-card-body">
                        <p className="cat-card-name" title={item.name}>{item.name}</p>
                        <div className="cat-card-meta">
                          <span className="cat-card-points">{item.point_cost?.toLocaleString()} pts</span>
                          <span className="cat-card-price">${Number(item.price_usd).toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="cat-card-footer">
                        {item.is_active ? (
                          <button className="cat-card-btn cat-card-btn--remove" onClick={() => removeItem(item.id)}>
                            Remove
                          </button>
                        ) : (
                          <button className="cat-card-btn cat-card-btn--restore" onClick={() => activateItem(item.id)}>
                            Add Back
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                }
              </div>
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
        {activeTab === "notificationHistory" && (
          <>
            <div className="sd-top-bar">
              <h1 className="sd-page-title">Notification History</h1>
            </div>
            <div className="sd-section">
              {notificationHistory.length === 0 ? (
                <p style={{ color: '#94a3b8' }}>No notifications sent yet.</p>
              ) : (
                <table className="sd-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Recipients</th>
                      <th>Subject</th>
                      <th>Message</th>
                      <th>Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notificationHistory.map((notif) => (
                      <tr key={notif.id}>
                        <td>{new Date(notif.sent_at).toLocaleString()}</td>
                        <td style={{ textTransform: 'capitalize' }}>{notif.recipient_type}</td>
                        <td>{notif.subject}</td>
                        <td style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {notif.message}
                        </td>
                        <td>{notif.recipient_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {activeTab === "scheduledNotifications" && (
          <>
            <div className="sd-top-bar">
              <h1 className="sd-page-title">Scheduled Notifications</h1>
            </div>
            <div className="sd-section">
              {scheduledNotifications.length === 0 ? (
                <p style={{ color: '#94a3b8' }}>No scheduled notifications.</p>
              ) : (
                <table className="sd-table">
                  <thead>
                    <tr>
                      <th>Scheduled Time</th>
                      <th>Recipients</th>
                      <th>Subject</th>
                      <th>Message</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scheduledNotifications.map((notif) => (
                      <tr key={notif.id}>
                        <td>{new Date(notif.scheduled_time).toLocaleString()}</td>
                        <td style={{ textTransform: 'capitalize' }}>{notif.recipient_type}</td>
                        <td>{notif.subject}</td>
                        <td style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {notif.message}
                        </td>
                        <td>
                          <button
                            className="sd-btn sd-btn-reject"
                            onClick={() => cancelScheduledNotification(notif.id)}
                          >
                            Cancel
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </main>
      </div>
      );
    }