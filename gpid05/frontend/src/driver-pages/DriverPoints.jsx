import './DriverPoints.css';

export default function DriverPoints({ user, transactions = [], balance = null }) {
  const totalPoints = balance == null ? transactions.reduce((sum, t) => sum + t.points, 0) : balance;
  const earned = transactions.filter(t => t.points > 0).reduce((sum, t) => sum + t.points, 0);
  const spent  = transactions.filter(t => t.points < 0).reduce((sum, t) => sum + t.points, 0);

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="drpt-root">

      {/* Page header */}
      <div className="drpt-page-header">
        <div>
          <h1 className="drpt-page-title">My Points</h1>
          <p className="drpt-page-sub">Track your point balance and transaction history</p>
        </div>
      </div>

      {/* Balance cards */}
      <div className="drpt-stats-row">
        <div className="drpt-balance-card">
          <p className="drpt-balance-label">Current Balance</p>
          <p className="drpt-balance-value">{totalPoints.toLocaleString()}</p>
          <p className="drpt-balance-unit">points</p>
        </div>
        <div className="drpt-stat-card">
          <p className="drpt-stat-label">Total Earned</p>
          <p className="drpt-stat-value drpt-positive">+{earned.toLocaleString()}</p>
        </div>
        <div className="drpt-stat-card">
          <p className="drpt-stat-label">Total Spent</p>
          <p className="drpt-stat-value drpt-negative">{spent.toLocaleString()}</p>
        </div>
        <div className="drpt-stat-card">
          <p className="drpt-stat-label">Transactions</p>
          <p className="drpt-stat-value">{transactions.length}</p>
        </div>
      </div>

      {/* Transaction history */}
      <div className="drpt-card">
        <div className="drpt-card-header">
          <h2 className="drpt-card-title">Transaction History</h2>
          <span className="drpt-card-icon">📋</span>
        </div>

        {transactions.length === 0 ? (
          <div className="drpt-empty">
            <div className="drpt-empty-icon-wrap">
              <svg width="48" height="48" viewBox="0 0 64 64" fill="none">
                <circle cx="32" cy="32" r="30" stroke="#e2e8f0" strokeWidth="2"/>
                <circle cx="32" cy="32" r="14" stroke="#cbd5e1" strokeWidth="2"/>
                <path d="M32 24v8l5 3" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="46" cy="18" r="6" fill="#F59E0B"/>
                <path d="M46 15v3.5l2 1.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="drpt-empty-title">No transactions yet</p>
            <p className="drpt-empty-desc">Points awarded by your sponsors will appear here.</p>
          </div>
        ) : (
          <table className="drpt-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Sponsor</th>
                <th>Date</th>
                <th>Points</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id}>
                  <td className="drpt-td-desc">{t.description || '—'}</td>
                  <td className="drpt-td-sponsor">{t.sponsor_name || t.sponsor_email || '—'}</td>
                  <td className="drpt-td-date">{formatDate(t.created_at)}</td>
                  <td>
                    <span className={`drpt-points-badge ${t.points >= 0 ? 'drpt-points-pos' : 'drpt-points-neg'}`}>
                      {t.points >= 0 ? '+' : ''}{t.points.toLocaleString()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}