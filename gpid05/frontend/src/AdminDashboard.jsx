import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import { useState } from 'react';
import './sponsor-pages/SponsorDashboard.css';
import UserManagement from './UserManagement';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, loading } = useAuth('admin');
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleLogout = async () => {
    try {
      await fetch('/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.error('Logout error:', err);
    }

    // keep compatibility with current auth flow
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
            className={`sd-nav-iem' ${activeTab === 'system' ? 'active' : ''}`}
            onClick={() => setActiveTab('system')}
          >
            System Management
          </button>

          {/* Future admin stories can plug into these tabs */}
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
        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <>
            <div className="sd-top-bar">
              <h1 className="sd-page-title">Admin Dashboard</h1>
            </div>

            <div className="sd-stats-grid">
              <div className="sd-stat-card">
                <p className="sd-stat-label">Role</p>
                <p className="sd-stat-value">{user.role}</p>
              </div>
              <div className="sd-stat-card">
                <p className="sd-stat-label">Email</p>
                <p className="sd-stat-value" style={{ fontSize: '16px' }}>
                  {user.email}
                </p>
              </div>
            </div>

            <div className="sd-section">
              <h2>Welcome, Admin</h2>
              <div style={{ marginTop: '14px' }}>
                <button
                  className="sd-nav-item"
                  style={{ width: 'auto' }}
                  onClick={() => setActiveTab('users')}
                >
                  Go to User Management
                </button>
              </div>
            </div>
          </>
        )}

        {/* USER MANAGEMENT TAB (moved to separate component) */}
        {activeTab === 'users' && <UserManagement currentUser={user} />}

        {activeTab === 'system' && (
          <>
            <div className="sd-top-bar">
              <h1 className="sd-page-title">System Management</h1>
            </div>
            <div className="sd-section">
              <h2>System Management</h2>
              <p style={{ marginTop: '10px', color: '#c9c9c9' }}>
                Catalog admin features will be implemented in future admin stories.
              </p>
            </div>
          </>
        )}

        {/* PLACEHOLDER TABS FOR FUTURE STORIES */}
        {activeTab === 'audit' && (
          <>
            <div className="sd-top-bar">
              <h1 className="sd-page-title">Audit Logs</h1>
            </div>
            <div className="sd-section">
              <h2>Audit Logs</h2>
              <p style={{ marginTop: '10px', color: '#c9c9c9' }}>
                Audit log features will be implemented in future admin stories.
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
                Catalog admin features will be implemented in future admin stories.
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