import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import { useState, useEffect } from 'react';
import './DriverDashboard.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';


export default function DriverDashboard() {
  const navigate = useNavigate();
  const { user, loading } = useAuth('user');
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sponsors, setSponsors] = useState([]);
  const [selectedSponsor, setSelectedSponsor] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
  if (user && activeTab === "apply") {
    fetch(`${API_BASE}/applications/sponsors`)
      .then(res => res.json())
      .then(data => setSponsors(data))
      .catch(err => console.error("Error fetching sponsors:", err));
    }
  }, [user, activeTab]);

  const handleApply = async (sponsorId) => {
    await fetch(`${API_BASE}/applications/`, {
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

  alert("Application submitted!");
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

          <button className="dd-nav-item">My Points</button>
          <button className="dd-nav-item">Catalog</button>
          <button className="dd-nav-item">My Orders</button>
          <button className="dd-nav-item">Profile</button>
        </nav>
        <button className="dd-logout-btn" onClick={handleLogout}>
          Sign Out
        </button>
      </div>

      <main className="dd-main">

        {activeTab === "dashboard" && (
          <>
          <div className="dd-top-bar">
          <h1 className="dd-page-title">Driver Dashboard</h1>
        </div>

        <div className="dd-stats-grid">
          ... your existing stat cards ...
        </div>

        <div className="dd-section">
          ... your existing recent activity ...
        </div>
        </>
      )}

      {activeTab === "apply" && (
        <>
        <div className="dd-top-bar">
          <h1 className="dd-page-title">Apply for Sponsorship</h1>
        </div>

        <div className="dd-section">
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
                      <button onClick={() => handleApply(sponsor.id)}>
                        Apply
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {sponsors.length === 0 && (
              <p style={{ marginTop: "20px" }}>
                No sponsors available.
              </p>
            )}
          </div>
        </div>
          </>
        )}

      </main>
    </div>
  );
}