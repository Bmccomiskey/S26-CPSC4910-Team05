import { useState } from 'react';
import './AwardPoints.css';

export default function AwardPoints({ user, approvedDrivers = [], pointsHistory = [], onAward }) {
  const [mode, setMode] = useState('single'); // 'single' | 'multi'
  const [selectedDriver, setSelectedDriver] = useState('');
  const [points, setPoints] = useState('');
  const [description, setDescription] = useState('');
  const [multiSelections, setMultiSelections] = useState({}); // { driverId: points }
  const [multiDesc, setMultiDesc] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const flash = (msg, isError = false) => {
    if (isError) { setErrorMsg(msg); setSuccessMsg(''); }
    else { setSuccessMsg(msg); setErrorMsg(''); }
    setTimeout(() => { setSuccessMsg(''); setErrorMsg(''); }, 3500);
  };

  const handleSingleSubmit = async () => {
    if (!selectedDriver) return flash('Please select a driver.', true);
    if (!points || isNaN(points) || Number(points) <= 0) return flash('Enter a valid points amount.', true);
    setSubmitting(true);
    try {
      const res = await fetch(`/points/award`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          sponsor_id: user.id,
          driver_id: selectedDriver,
          points: Number(points),
          description,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        flash(d.detail || 'Something went wrong.', true);
      } else {
        flash('Points awarded successfully!');
        setSelectedDriver('');
        setPoints('');
        setDescription('');
        if (onAward) onAward();
      }
    } catch {
      flash('Network error.', true);
    }
    setSubmitting(false);
  };

  const handleMultiSubmit = async () => {
    const entries = Object.entries(multiSelections).filter(([, pts]) => pts && Number(pts) > 0);
    if (entries.length === 0) return flash('Enter points for at least one driver.', true);
    setSubmitting(true);
    try {
      const results = await Promise.all(
        entries.map(([driverId, pts]) =>
          fetch(`/points/award`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              sponsor_id: user.id,
              driver_id: driverId,
              points: Number(pts),
              description: multiDesc,
            }),
          })
        )
      );
      const allOk = results.every(r => r.ok);
      if (allOk) {
        flash(`Points awarded to ${entries.length} driver${entries.length > 1 ? 's' : ''}!`);
        setMultiSelections({});
        setMultiDesc('');
        if (onAward) onAward();
      } else {
        flash('Some awards failed. Please try again.', true);
      }
    } catch {
      flash('Network error.', true);
    }
    setSubmitting(false);
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="awp-root">

      {/* Page header */}
      <div className="awp-page-header">
        <div>
          <h1 className="awp-page-title">Award Points</h1>
          <p className="awp-page-sub">Reward your approved drivers with points</p>
        </div>
      </div>

      {successMsg && <div className="awp-alert awp-alert-success">✓ {successMsg}</div>}
      {errorMsg   && <div className="awp-alert awp-alert-error">⚠ {errorMsg}</div>}

      {/* Mode toggle */}
      <div className="awp-mode-toggle">
        <button
          className={`awp-mode-btn ${mode === 'single' ? 'active' : ''}`}
          onClick={() => setMode('single')}
        >
          Single Driver
        </button>
        <button
          className={`awp-mode-btn ${mode === 'multi' ? 'active' : ''}`}
          onClick={() => setMode('multi')}
        >
          Multiple Drivers
        </button>
      </div>

      {/* Single driver form */}
      {mode === 'single' && (
        <div className="awp-card">
          <div className="awp-card-header">
            <h2 className="awp-card-title">Award to Single Driver</h2>
            <span className="awp-card-icon">🎯</span>
          </div>

          {approvedDrivers.length === 0 ? (
            <p className="awp-empty-text">No approved drivers yet. Approve drivers from the Manage Drivers tab.</p>
          ) : (
            <div className="awp-form">
              <div className="awp-field">
                <label className="awp-label">Select Driver</label>
                <select
                  className="awp-input"
                  value={selectedDriver}
                  onChange={e => setSelectedDriver(e.target.value)}
                >
                  <option value="">— Choose a driver —</option>
                  {approvedDrivers.map(d => (
                    <option key={d.driver_id} value={d.driver_id}>{d.driver_email}</option>
                  ))}
                </select>
              </div>
              <div className="awp-field">
                <label className="awp-label">Points to Award</label>
                <input
                  className="awp-input"
                  type="number"
                  min="1"
                  placeholder="e.g. 100"
                  value={points}
                  onChange={e => setPoints(e.target.value)}
                />
              </div>
              <div className="awp-field awp-field-full">
                <label className="awp-label">Description <span className="awp-optional">(optional)</span></label>
                <input
                  className="awp-input"
                  type="text"
                  placeholder="e.g. Safe driving bonus — March"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>
              <div className="awp-form-actions">
                <button className="awp-submit-btn" onClick={handleSingleSubmit} disabled={submitting}>
                  {submitting ? 'Awarding…' : 'Award Points'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Multi driver form */}
      {mode === 'multi' && (
        <div className="awp-card">
          <div className="awp-card-header">
            <h2 className="awp-card-title">Award to Multiple Drivers</h2>
            <span className="awp-card-icon">🏆</span>
          </div>

          {approvedDrivers.length === 0 ? (
            <p className="awp-empty-text">No approved drivers yet. Approve drivers from the Manage Drivers tab.</p>
          ) : (
            <>
              <div className="awp-field awp-field-full" style={{ marginBottom: '20px' }}>
                <label className="awp-label">Description <span className="awp-optional">(optional — applies to all)</span></label>
                <input
                  className="awp-input"
                  type="text"
                  placeholder="e.g. Monthly performance bonus"
                  value={multiDesc}
                  onChange={e => setMultiDesc(e.target.value)}
                />
              </div>

              <table className="awp-multi-table">
                <thead>
                  <tr>
                    <th>Driver</th>
                    <th>Points to Award</th>
                  </tr>
                </thead>
                <tbody>
                  {approvedDrivers.map(d => (
                    <tr key={d.driver_id}>
                      <td className="awp-multi-driver">{d.driver_email}</td>
                      <td>
                        <input
                          className="awp-input awp-points-input"
                          type="number"
                          min="0"
                          placeholder="0"
                          value={multiSelections[d.driver_id] || ''}
                          onChange={e => setMultiSelections(prev => ({
                            ...prev,
                            [d.driver_id]: e.target.value,
                          }))}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="awp-form-actions">
                <button className="awp-submit-btn" onClick={handleMultiSubmit} disabled={submitting}>
                  {submitting ? 'Awarding…' : `Award Points to ${Object.values(multiSelections).filter(v => v > 0).length || 0} Driver(s)`}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* History */}
      <div className="awp-card">
        <div className="awp-card-header">
          <h2 className="awp-card-title">Points Award History</h2>
          <span className="awp-card-icon">📋</span>
        </div>

        {pointsHistory.length === 0 ? (
          <div className="awp-history-empty">
            <p className="awp-empty-title">No history yet</p>
            <p className="awp-empty-desc">Points you award will appear here.</p>
          </div>
        ) : (
          <table className="awp-history-table">
            <thead>
              <tr>
                <th>Driver</th>
                <th>Description</th>
                <th>Date</th>
                <th>Points</th>
              </tr>
            </thead>
            <tbody>
              {pointsHistory.map(h => (
                <tr key={h.id}>
                  <td className="awp-td-driver">{h.driver_email}</td>
                  <td className="awp-td-desc">{h.description || '—'}</td>
                  <td className="awp-td-date">{formatDate(h.created_at)}</td>
                  <td>
                    <span className="awp-pts-badge">+{Number(h.points).toLocaleString()}</span>
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