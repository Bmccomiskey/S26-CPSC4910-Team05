import { useNavigate } from 'react-router-dom';
import AwardPoints from './AwardPoints';
import SponsorProfile from './SponsorProfile';
import SponsorGoals from './SponsorGoals';
import { useAuth } from '../useAuth';
import { useState, useEffect } from 'react';
import './SponsorDashboard.css';

// const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';


export default function SponsorDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const navigate = useNavigate();
  const { user, loading } = useAuth('sponsor');

  const [applications, setApplications] = useState([]);
  const [pointsHistory, setPointsHistory] = useState([]);

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
      </main>
    </div>
  );
}