import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import './DriverDashboard.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function DriverDashboard() {
  const navigate = useNavigate();
  const { user, loading } = useAuth('user');

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
          <h2 className="dd-sidebar-title">🚗 Driver Portal</h2>
        </div>
        <nav className="dd-nav">
          <a className="dd-nav-item active" href="#">Dashboard</a>
          <a className="dd-nav-item" href="#">My Points</a>
          <a className="dd-nav-item" href="#">Catalog</a>
          <a className="dd-nav-item" href="#">My Orders</a>
          <a className="dd-nav-item" href="#">Profile</a>
        </nav>
        <button className="dd-logout-btn" onClick={handleLogout}>
          Sign Out
        </button>
      </div>

      <main className="dd-main">
        <div className="dd-top-bar">
          <h1 className="dd-page-title">Driver Dashboard</h1>
        </div>

        <div className="dd-stats-grid">
          <div className="dd-stat-card">
            <p className="dd-stat-label">Total Points</p>
            <p className="dd-stat-value">1,250</p>
          </div>
          <div className="dd-stat-card">
            <p className="dd-stat-label">Points This Month</p>
            <p className="dd-stat-value">320</p>
          </div>
          <div className="dd-stat-card">
            <p className="dd-stat-label">Items Redeemed</p>
            <p className="dd-stat-value">4</p>
          </div>
          <div className="dd-stat-card">
            <p className="dd-stat-label">Active Sponsors</p>
            <p className="dd-stat-value">2</p>
          </div>
        </div>

        <div className="dd-section">
          <h2 className="dd-section-title">Recent Activity</h2>
          <div className="dd-activity-list">
            {[
              { label: 'Points awarded by Sponsor A', points: '+100', date: 'Feb 15, 2026' },
              { label: 'Redeemed: $10 Gift Card', points: '-500', date: 'Feb 10, 2026' },
              { label: 'Points awarded by Sponsor B', points: '+220', date: 'Feb 5, 2026' },
            ].map((item, i) => (
              <div key={i} className="dd-activity-item">
                <div>
                  <p className="dd-activity-label">{item.label}</p>
                  <p className="dd-activity-date">{item.date}</p>
                </div>
                <span className={`dd-activity-points ${item.points.startsWith('+') ? 'positive' : 'negative'}`}>
                  {item.points} pts
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}