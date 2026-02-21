import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import { useState, useEffect } from 'react';
import './SponsorDashboard.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';


export default function SponsorDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const navigate = useNavigate();
  const { user, loading } = useAuth('sponsor');

  const [applications, setApplications] = useState([]);
  const fetchApplications = () => {
    fetch(`${API_BASE}/applications/sponsor/${user.id}`, {
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => setApplications(data))
      .catch(err => console.error('Error fetching applications:', err));
  };
  useEffect(() => {
    if (user) fetchApplications();
  }, [user]);

  const handleApprove = async (id) => {
    await fetch(
      `${API_BASE}/applications/${id}/approve?sponsor_id=${user.id}`,
      {
        method: 'POST',
        credentials: 'include',
      }
    );
    fetchApplications();
  };
  const handleReject = async (id) => {
    await fetch(
      `${API_BASE}/applications/${id}/reject?sponsor_id=${user.id}`,
      {
        method: 'POST',
        credentials: 'include',
      }
    );
    fetchApplications();
  };
  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
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
          <h2 className="sd-sidebar-title">Sponsor Portal</h2>
        </div>
        <nav className="sd-nav">
          <button
          className={`sd-nav-item ${activeTab === "dashboard" ? "active" : ""}`}
          onClick={() => setActiveTab("dashboard")}
          >
            Dashboard
          </button>
          <button
            className={`sd-nav-item ${activeTab === "manageDrivers" ? "active" : ""}`}
            onClick={() => setActiveTab("manageDrivers")}
          >
            Manage Drivers
          </button>

          <a className="sd-nav-item" href="#">Award Points</a>
          <a className="sd-nav-item" href="#">Catalog</a>
          <a className="sd-nav-item" href="#">Profile</a>
        </nav>
        <button className="sd-logout-btn" onClick={handleLogout}>
          Sign Out
        </button>
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
              <p className="sd-stat-value">32</p> </div>
          </div>

            <div className="sd-section">
            ...
            </div>
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
                    {applications
                    .filter(app => app.status === "PENDING")
                    .map((app) => (
                    <tr key={app.id}>
                      <td>{app.driver_email}</td>
                      <td>{app.status}</td>
                      <td>
                        <button onClick={() => handleApprove(app.id)}>
                          Approve
                          </button>
                          <button onClick={() => handleReject(app.id)}>
                            Reject
                            </button>
                            </td>
                            </tr>
                          ))}
                          </tbody>
                          </table>
                          </>
                      
        )}
        <h2 style={{ marginTop: "40px" }}>Approved Drivers</h2>
        <table className="sd-table">
          <thead>
            <tr>
              <th>Driver</th>
              <th>Status</th>
              </tr>
              </thead>
              <tbody>
                {applications
                .filter(app => app.status === "APPROVED")
                .map((app) => (
                <tr key={app.id}>
                  <td>{app.driver_email}</td>
                  <td>
                    <span style={{ color: "green", fontWeight: "bold" }}>
                      APPROVED
                      </span>
                      </td>
                      </tr>
                    ))}
                    </tbody>
                    </table>
      </main>
    </div>
  );
}