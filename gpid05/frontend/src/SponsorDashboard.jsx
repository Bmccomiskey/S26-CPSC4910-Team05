import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import { useState, useEffect } from 'react';
import './SponsorDashboard.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';


export default function SponsorDashboard() {
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
          <a className="sd-nav-item active" href="#">Dashboard</a>
          <a className="sd-nav-item" href="#">Manage Drivers</a>
          <a className="sd-nav-item" href="#">Award Points</a>
          <a className="sd-nav-item" href="#">Catalog</a>
          <a className="sd-nav-item" href="#">Profile</a>
        </nav>
        <button className="sd-logout-btn" onClick={handleLogout}>
          Sign Out
        </button>
      </div>

      <main className="sd-main">
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

        <div className="sd-section">
          <h2 className="sd-section-title">Recent Point Awards</h2>
          <div className="sd-table-wrapper">
            <table className="sd-table">
              <thead>
                <tr>
                  <th className="sd-th">Driver</th>
                  <th className="sd-th">Points</th>
                  <th className="sd-th">Reason</th>
                  <th className="sd-th">Date</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { driver: 'Alice Johnson', points: 200, reason: 'Safe driving bonus', date: 'Feb 15, 2026' },
                  { driver: 'Bob Smith', points: 150, reason: 'On-time delivery streak', date: 'Feb 12, 2026' },
                  { driver: 'Carol White', points: 100, reason: 'Customer feedback', date: 'Feb 10, 2026' },
                  { driver: 'David Lee', points: 75, reason: 'Fuel efficiency', date: 'Feb 8, 2026' },
                ].map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'sd-tr-even' : ''}>
                    <td className="sd-td">{row.driver}</td>
                    <td className="sd-td points">+{row.points}</td>
                    <td className="sd-td">{row.reason}</td>
                    <td className="sd-td">{row.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}