import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function SponsorDashboard() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.error('Logout error:', err);
    }
    navigate('/');
  };

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <h2 style={styles.sidebarTitle}>🏢 Sponsor Portal</h2>
        </div>
        <nav style={styles.nav}>
          <a style={{ ...styles.navItem, ...styles.navItemActive }} href="#">Dashboard</a>
          <a style={styles.navItem} href="#">Manage Drivers</a>
          <a style={styles.navItem} href="#">Award Points</a>
          <a style={styles.navItem} href="#">Catalog</a>
          <a style={styles.navItem} href="#">Reports</a>
          <a style={styles.navItem} href="#">Profile</a>
        </nav>
        <button style={styles.logoutBtn} onClick={handleLogout}>
          Sign Out
        </button>
      </div>

      <main style={styles.main}>
        <div style={styles.topBar}>
          <h1 style={styles.pageTitle}>Sponsor Dashboard</h1>
        </div>

        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <p style={styles.statLabel}>Active Drivers</p>
            <p style={styles.statValue}>14</p>
          </div>
          <div style={styles.statCard}>
            <p style={styles.statLabel}>Points Awarded</p>
            <p style={styles.statValue}>8,400</p>
          </div>
          <div style={styles.statCard}>
            <p style={styles.statLabel}>Points Redeemed</p>
            <p style={styles.statValue}>3,120</p>
          </div>
          <div style={styles.statCard}>
            <p style={styles.statLabel}>Catalog Items</p>
            <p style={styles.statValue}>32</p>
          </div>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Recent Point Awards</h2>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Driver</th>
                  <th style={styles.th}>Points</th>
                  <th style={styles.th}>Reason</th>
                  <th style={styles.th}>Date</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { driver: 'Alice Johnson', points: 200, reason: 'Safe driving bonus', date: 'Feb 15, 2026' },
                  { driver: 'Bob Smith', points: 150, reason: 'On-time delivery streak', date: 'Feb 12, 2026' },
                  { driver: 'Carol White', points: 100, reason: 'Customer feedback', date: 'Feb 10, 2026' },
                  { driver: 'David Lee', points: 75, reason: 'Fuel efficiency', date: 'Feb 8, 2026' },
                ].map((row, i) => (
                  <tr key={i} style={i % 2 === 0 ? styles.trEven : {}}>
                    <td style={styles.td}>{row.driver}</td>
                    <td style={{ ...styles.td, color: '#16a34a', fontWeight: '600' }}>+{row.points}</td>
                    <td style={styles.td}>{row.reason}</td>
                    <td style={styles.td}>{row.date}</td>
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

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    fontFamily: 'system-ui, sans-serif',
    backgroundColor: '#f1f5f9',
  },
  sidebar: {
    width: '240px',
    backgroundColor: '#0f172a',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px 0',
  },
  sidebarHeader: {
    padding: '0 20px 24px',
    borderBottom: '1px solid #1e293b',
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
  },
  navItemActive: {
    color: '#f8fafc',
    backgroundColor: '#1e293b',
    borderLeft: '3px solid #f59e0b',
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
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '10px 12px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    borderBottom: '1px solid #e2e8f0',
  },
  td: {
    padding: '12px',
    fontSize: '14px',
    color: '#1e293b',
  },
  trEven: {
    backgroundColor: '#f8fafc',
  },
};
