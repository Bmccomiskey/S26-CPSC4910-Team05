import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import { useState } from 'react';
import './SponsorDashboard.css'; // reuse sponsor dashboard layout/styles

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, loading } = useAuth('admin');
  const [activeTab, setActiveTab] = useState('dashboard');

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
    localStorage.removeItem('userId');
    navigate('/login');
  };

  if (loading) {
    return <div style={{ padding: '40px', fontSize: '18px' }}>Loading...</div>;
  }

  if (!user) return null;

  return (
    <div className="sd-container">
      <div className="sd-sidebar">
        <div className="sd-sidebar-header">
          <h2 className="sd-sidebar-title">Admin Portal</h2>
        </div>

        <nav className="sd-nav">
          <button
            className={`sd-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>

          <button
            className={`sd-nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            User Management
          </button>

          <button
            className={`sd-nav-item ${activeTab === 'audit' ? 'active' : ''}`}
            onClick={() => setActiveTab('audit')}
          >
            Audit Logs
          </button>

          <button
            className={`sd-nav-item ${activeTab === 'catalog' ? 'active' : ''}`}
            onClick={() => setActiveTab('catalog')}
          >
            Catalog
          </button>

          <button
            className={`sd-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
        </nav>

        <button className="sd-logout-btn" onClick={handleLogout}>
          Sign Out
        </button>
      </div>

      <main className="sd-main">
        {activeTab === 'dashboard' && (
          <>
            <div className="sd-top-bar">
              <h1 className="sd-page-title">Admin Dashboard</h1>
            </div>

            <div className="sd-stats-grid">
              <div className="sd-stat-card">
                <p className="sd-stat-label">Total Users</p>
                <p className="sd-stat-value">--</p>
              </div>
              <div className="sd-stat-card">
                <p className="sd-stat-label">Sponsors</p>
                <p className="sd-stat-value">--</p>
              </div>
              <div className="sd-stat-card">
                <p className="sd-stat-label">Drivers</p>
                <p className="sd-stat-value">--</p>
              </div>
              <div className="sd-stat-card">
                <p className="sd-stat-label">Pending Actions</p>
                <p className="sd-stat-value">--</p>
              </div>
            </div>

            <div className="sd-section">
              <h2>Welcome, Admin</h2>
              <p style={{ marginTop: '10px', color: '#c9c9c9' }}>
                This dashboard is the admin landing page and navigation hub.
                Use the tabs on the left to access admin tools.
              </p>
            </div>
          </>
        )}

        {activeTab === 'users' && (
          <>
            <div className="sd-top-bar">
              <h1 className="sd-page-title">User Management</h1>
            </div>
            <div className="sd-section">
              <h2>User Management</h2>
              <p style={{ marginTop: '10px', color: '#c9c9c9' }}>
                Admin user-management tools will appear here in future stories.
              </p>
            </div>
          </>
        )}

        {activeTab === 'audit' && (
          <>
            <div className="sd-top-bar">
              <h1 className="sd-page-title">Audit Logs</h1>
            </div>
            <div className="sd-section">
              <h2>Audit Logs</h2>
              <p style={{ marginTop: '10px', color: '#c9c9c9' }}>
                Audit log monitoring tools will appear here in future stories.
              </p>
            </div>
          </>
        )}

        {activeTab === 'catalog' && (
          <>
            <div className="sd-top-bar">
              <h1 className="sd-page-title">Catalog</h1>
            </div>
            <div className="sd-section">
              <h2>Catalog Administration</h2>
              <p style={{ marginTop: '10px', color: '#c9c9c9' }}>
                Catalog administration features will appear here in future stories.
              </p>
            </div>
          </>
        )}

        {activeTab === 'profile' && (
          <>
            <div className="sd-top-bar">
              <h1 className="sd-page-title">Admin Profile</h1>
            </div>
            <div className="sd-section">
              <h2>Profile</h2>
              <p style={{ marginTop: '10px', color: '#c9c9c9' }}>
                Signed in as <strong>{user.email}</strong> ({user.role})
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}