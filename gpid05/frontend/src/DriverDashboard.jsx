import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function DriverDashboard() {
  const navigate = useNavigate();
  const { user, loading } = useAuth('user'); // redirects if not logged in or wrong role

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

  if (loading) return <div style={{padding: '40px', fontSize: '18px'}}>Loading...</div>;
  if (!user) return null;

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <h2 style={styles.sidebarTitle}>🚗 Driver Portal</h2>
        </div>
        <nav style={styles.nav}>
          <a style={{ ...styles.navItem, ...styles.navItemActive }} href="#">Dashboard</a>
          <a style={styles.navItem} href="#">My Points</a>
          <a style={styles.navItem} href="#">Catalog</a>
          <a style={styles.navItem} href="#">My Orders</a>
          <a style={styles.navItem} href="#">Profile</a>
        </nav>
        <button style={styles.logoutBtn} onClick={handleLogout}>
          Sign Out
        </button>
      </div>

      <main style={styles.main}>
        <div style={styles.topBar}>
          <h1 style={styles.pageTitle}>Driver Dashboard</h1>
        </div>

        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <p style={styles.statLabel}>Total Points</p>
            <p style={styles.statValue}>1,250</p>
          </div>
          <div style={styles.statCard}>
            <p style={styles.statLabel}>Points This Month</p>
            <p style={styles.statValue}>320</p>
          </div>
          <div style={styles.statCard}>
            <p style={styles.statLabel}>Items Redeemed</p>
            <p style={styles.statValue}>4</p>
          </div>
          <div style={styles.statCard}>
            <p style={styles.statLabel}>Active Sponsors</p>
            <p style={styles.statValue}>2</p>
          </div>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Recent Activity</h2>
          <div style={styles.activityList}>
            {[
              { label: 'Points awarded by Sponsor A', points: '+100', date: 'Feb 15, 2026' },
              { label: 'Redeemed: $10 Gift Card', points: '-500', date: 'Feb 10, 2026' },
              { label: 'Points awarded by Sponsor B', points: '+220', date: 'Feb 5, 2026' },
            ].map((item, i) => (
              <div key={i} style={styles.activityItem}>
                <div>
                  <p style={styles.activityLabel}>{item.label}</p>
                  <p style={styles.activityDate}>{item.date}</p>
                </div>
                <span style={{
                  ...styles.activityPoints,
                  color: item.points.startsWith('+') ? '#16a34a' : '#dc2626'
                }}>
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

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    fontFamily: 'system-ui, sans-serif',
    backgroundColor: '#f1f5f9',
    position: 'relative',
    zIndex: 999,
  },
  sidebar: {
    width: '240px',
    backgroundColor: '#1e293b',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px 0',
  },
  sidebarHeader: {
    padding: '0 20px 24px',
    borderBottom: '1px solid #334155',
  },
  sidebarTitle: {
    color: '#f8fafc',
    fontSize: '18px',
    margin: 0,
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    padding: '16px 0',
    flex: 1,
  },
  navItem: {
    color: '#94a3b8',
    textDecoration: 'none',
    padding: '10px 20px',
    fontSize: '14px',
    transition: 'background 0.2s',
  },
  navItemActive: {
    color: '#f8fafc',
    backgroundColor: '#334155',
    borderLeft: '3px solid #3b82f6',
  },
  logoutBtn: {
    margin: '16px',
    padding: '10px',
    backgroundColor: '#dc2626',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  main: {
    flex: 1,
    padding: '32px',
  },
  topBar: {
    marginBottom: '32px',
  },
  pageTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#0f172a',
    margin: 0,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
    marginBottom: '32px',
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: '10px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
  statLabel: {
    fontSize: '13px',
    color: '#64748b',
    margin: '0 0 8px',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#0f172a',
    margin: 0,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: '10px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#0f172a',
    margin: '0 0 16px',
  },
  activityList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  activityItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
  },
  activityLabel: {
    margin: 0,
    fontSize: '14px',
    color: '#1e293b',
    fontWeight: '500',
  },
  activityDate: {
    margin: '4px 0 0',
    fontSize: '12px',
    color: '#94a3b8',
  },
  activityPoints: {
    fontWeight: '700',
    fontSize: '14px',
  },
};
