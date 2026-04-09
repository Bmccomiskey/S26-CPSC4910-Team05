import React, { useEffect, useMemo, useState } from 'react';
import './PointsManagement.css';

const DEFAULT_FORM = {
  operation: 'add',
  points: '',
  reason: '',
  hiddenFromReports: false,
};

export default function PointsManagement({ currentUser }) {
  const [mode, setMode] = useState('drivers');

  const [drivers, setDrivers] = useState([]);
  const [sponsors, setSponsors] = useState([]);

  const [loadingDrivers, setLoadingDrivers] = useState(true);
  const [loadingSponsors, setLoadingSponsors] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const [selectedDriverIds, setSelectedDriverIds] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [selectedSponsor, setSelectedSponsor] = useState(null);

  const [driverHistory, setDriverHistory] = useState([]);
  const [sponsorHistory, setSponsorHistory] = useState([]);

  const [driverSearch, setDriverSearch] = useState('');
  const [sponsorSearch, setSponsorSearch] = useState('');

  const [form, setForm] = useState(DEFAULT_FORM);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const flash = (text, isError = false) => {
    if (isError) {
      setError(text);
      setMessage('');
    } else {
      setMessage(text);
      setError('');
    }

    window.setTimeout(() => {
      setMessage('');
      setError('');
    }, 3500);
  };

  const fetchDrivers = async () => {
    setLoadingDrivers(true);
    try {
      const res = await fetch('/points/admin/drivers', {
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to load drivers.');
      }
      setDrivers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load drivers.');
    }
    setLoadingDrivers(false);
  };

  const fetchSponsors = async () => {
    setLoadingSponsors(true);
    try {
      const res = await fetch('/points/admin/sponsors', {
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to load sponsors.');
      }
      setSponsors(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load sponsors.');
    }
    setLoadingSponsors(false);
  };

  const fetchDriverHistory = async (driver) => {
    if (!driver) return;
    setLoadingHistory(true);
    try {
      const res = await fetch(`/points/driver/${driver.driver_id}/history`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to load driver history.');
      }
      setDriverHistory(Array.isArray(data) ? data : []);
      setSelectedDriver(driver);
    } catch (err) {
      setError(err.message || 'Failed to load driver history.');
    }
    setLoadingHistory(false);
  };

  const fetchSponsorHistory = async (sponsor) => {
    if (!sponsor) return;
    setLoadingHistory(true);
    try {
      const res = await fetch(`/points/sponsor/${sponsor.sponsor_id}/history`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to load sponsor history.');
      }
      setSponsorHistory(Array.isArray(data) ? data : []);
      setSelectedSponsor(sponsor);
    } catch (err) {
      setError(err.message || 'Failed to load sponsor history.');
    }
    setLoadingHistory(false);
  };

  useEffect(() => {
    fetchDrivers();
    fetchSponsors();
  }, []);

  const filteredDrivers = useMemo(() => {
    const term = driverSearch.trim().toLowerCase();
    if (!term) return drivers;

    return drivers.filter(
      (driver) =>
        driver.driver_email.toLowerCase().includes(term) ||
        driver.sponsor_display.toLowerCase().includes(term)
    );
  }, [drivers, driverSearch]);

  const filteredSponsors = useMemo(() => {
    const term = sponsorSearch.trim().toLowerCase();
    if (!term) return sponsors;

    return sponsors.filter(
      (sponsor) =>
        sponsor.sponsor_email.toLowerCase().includes(term) ||
        sponsor.driver_display.toLowerCase().includes(term)
    );
  }, [sponsors, sponsorSearch]);

  const allVisibleSelected =
    filteredDrivers.length > 0 &&
    filteredDrivers.every((driver) =>
      selectedDriverIds.includes(driver.driver_id)
    );

  const toggleDriver = (driverId) => {
    setSelectedDriverIds((prev) =>
      prev.includes(driverId)
        ? prev.filter((id) => id !== driverId)
        : [...prev, driverId]
    );
  };

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      const visibleIds = new Set(filteredDrivers.map((driver) => driver.driver_id));
      setSelectedDriverIds((prev) => prev.filter((id) => !visibleIds.has(id)));
      return;
    }

    setSelectedDriverIds((prev) => {
      const next = new Set(prev);
      filteredDrivers.forEach((driver) => next.add(driver.driver_id));
      return Array.from(next);
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (selectedDriverIds.length === 0) {
      return flash('Select at least one driver.', true);
    }

    if (!form.points || Number(form.points) <= 0) {
      return flash('Enter a valid point amount.', true);
    }

    setSubmitting(true);
    try {
      const res = await fetch('/points/admin/bulk-adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          admin_id: currentUser.id,
          driver_ids: selectedDriverIds,
          operation: form.operation,
          points: Number(form.points),
          reason: form.reason.trim() || null,
          hidden_from_reports: form.hiddenFromReports,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to apply point change.');
      }

      flash(data.message || 'Point change applied successfully.');
      setForm(DEFAULT_FORM);
      setSelectedDriverIds([]);
      fetchDrivers();

      if (selectedDriver) {
        fetchDriverHistory(selectedDriver);
      }
    } catch (err) {
      flash(err.message || 'Failed to apply point change.', true);
    }
    setSubmitting(false);
  };

  return (
    <>
      <div className="sd-top-bar">
        <h1 className="sd-page-title">Points Management</h1>
      </div>

      <div className="sd-section">
        <div className="pm-mode-toggle">
          <button
            className={`pm-mode-btn ${mode === 'drivers' ? 'active' : ''}`}
            onClick={() => setMode('drivers')}
            type="button"
          >
            Driver Points
          </button>

          <button
            className={`pm-mode-btn ${mode === 'sponsors' ? 'active' : ''}`}
            onClick={() => setMode('sponsors')}
            type="button"
          >
            Sponsor Points
          </button>
        </div>

        {message && <div className="pm-message pm-success">✓ {message}</div>}
        {error && <div className="pm-message pm-error">⚠ {error}</div>}

        {mode === 'drivers' && (
          <>
            <h2>Manage Driver Points</h2>
            <p style={{ marginTop: '10px', color: '#374151' }}>
              Add or subtract points for one or more drivers, then review transaction history for an individual driver.
            </p>

            <form className="pm-form" onSubmit={handleSubmit}>
              <div className="pm-form-grid">
                <div className="pm-field">
                  <label>Action</label>
                  <select
                    value={form.operation}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, operation: e.target.value }))
                    }
                  >
                    <option value="add">Add Points</option>
                    <option value="subtract">Subtract Points</option>
                  </select>
                </div>

                <div className="pm-field">
                  <label>Points</label>
                  <input
                    type="number"
                    min="1"
                    value={form.points}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, points: e.target.value }))
                    }
                    placeholder="e.g. 100"
                    required
                  />
                </div>

                <div className="pm-field pm-field-wide">
                  <label>Reason</label>
                  <input
                    type="text"
                    value={form.reason}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, reason: e.target.value }))
                    }
                    placeholder="Reason drivers should see in point history"
                  />
                </div>
              </div>

              <label className="pm-checkbox-row">
                <input
                  type="checkbox"
                  checked={form.hiddenFromReports}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      hiddenFromReports: e.target.checked,
                    }))
                  }
                />
                <span>Hide this change from sponsor and driver reports</span>
              </label>

              <div className="pm-toolbar">
                <input
                  className="pm-search"
                  type="text"
                  value={driverSearch}
                  onChange={(e) => setDriverSearch(e.target.value)}
                  placeholder="Search drivers or sponsors"
                />

                <div className="pm-toolbar-actions">
                  <button type="button" className="um-btn refresh" onClick={fetchDrivers}>
                    Refresh List
                  </button>
                  <button type="submit" className="um-btn create" disabled={submitting}>
                    {submitting
                      ? 'Applying...'
                      : `Apply to ${selectedDriverIds.length} Driver${selectedDriverIds.length === 1 ? '' : 's'}`}
                  </button>
                </div>
              </div>

              <div className="pm-table-wrap">
                <table className="um-table">
                  <thead>
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          checked={allVisibleSelected}
                          onChange={toggleSelectAllVisible}
                          aria-label="Select all visible drivers"
                        />
                      </th>
                      <th>Driver</th>
                      <th>Balance</th>
                      <th>Sponsor</th>
                      <th>History</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingDrivers ? (
                      <tr>
                        <td colSpan="5" className="pm-empty-cell">Loading drivers...</td>
                      </tr>
                    ) : filteredDrivers.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="pm-empty-cell">No drivers found.</td>
                      </tr>
                    ) : (
                      filteredDrivers.map((driver) => (
                        <tr key={driver.driver_id}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedDriverIds.includes(driver.driver_id)}
                              onChange={() => toggleDriver(driver.driver_id)}
                              aria-label={`Select ${driver.driver_email}`}
                            />
                          </td>
                          <td>{driver.driver_email}</td>
                          <td>{Number(driver.balance || 0).toLocaleString()}</td>
                          <td>{driver.sponsor_display}</td>
                          <td>
                            <button
                              type="button"
                              className="um-btn refresh"
                              onClick={() => fetchDriverHistory(driver)}
                            >
                              View History
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </form>

            <div className="pm-history-card">
              <h3>
                {selectedDriver
                  ? `Driver Transaction History: ${selectedDriver.driver_email}`
                  : 'Driver Transaction History'}
              </h3>

              {!selectedDriver ? (
                <p className="pm-history-empty">Select a driver to view transaction history.</p>
              ) : loadingHistory ? (
                <p className="pm-history-empty">Loading history...</p>
              ) : driverHistory.length === 0 ? (
                <p className="pm-history-empty">No transactions found for this driver.</p>
              ) : (
                <div className="pm-table-wrap">
                  <table className="um-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Sponsor</th>
                        <th>Points</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {driverHistory.map((txn) => (
                        <tr key={txn.id}>
                          <td>{new Date(txn.created_at).toLocaleString()}</td>
                          <td>{txn.sponsor_email}</td>
                          <td>{txn.points}</td>
                          <td>{txn.description || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {mode === 'sponsors' && (
          <>
            <h2>Sponsor Point History</h2>
            <p style={{ marginTop: '10px', color: '#374151' }}>
              Search for a sponsor and review the point transactions that sponsor has issued.
            </p>

            <div className="pm-toolbar">
              <input
                className="pm-search"
                type="text"
                value={sponsorSearch}
                onChange={(e) => setSponsorSearch(e.target.value)}
                placeholder="Search sponsors or drivers"
              />

              <div className="pm-toolbar-actions">
                <button type="button" className="um-btn refresh" onClick={fetchSponsors}>
                  Refresh List
                </button>
              </div>
            </div>

            <div className="pm-table-wrap">
              <table className="um-table">
                <thead>
                  <tr>
                    <th>Sponsor</th>
                    <th>Total Awarded</th>
                    <th>Approved Drivers</th>
                    <th>History</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingSponsors ? (
                    <tr>
                      <td colSpan="4" className="pm-empty-cell">Loading sponsors...</td>
                    </tr>
                  ) : filteredSponsors.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="pm-empty-cell">No sponsors found.</td>
                    </tr>
                  ) : (
                    filteredSponsors.map((sponsor) => (
                      <tr key={sponsor.sponsor_id}>
                        <td>{sponsor.sponsor_email}</td>
                        <td>{Number(sponsor.total_awarded || 0).toLocaleString()}</td>
                        <td>{sponsor.driver_display}</td>
                        <td>
                          <button
                            type="button"
                            className="um-btn refresh"
                            onClick={() => fetchSponsorHistory(sponsor)}
                          >
                            View History
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="pm-history-card">
              <h3>
                {selectedSponsor
                  ? `Sponsor Transaction History: ${selectedSponsor.sponsor_email}`
                  : 'Sponsor Transaction History'}
              </h3>

              {!selectedSponsor ? (
                <p className="pm-history-empty">Select a sponsor to view transaction history.</p>
              ) : loadingHistory ? (
                <p className="pm-history-empty">Loading history...</p>
              ) : sponsorHistory.length === 0 ? (
                <p className="pm-history-empty">No transactions found for this sponsor.</p>
              ) : (
                <div className="pm-table-wrap">
                  <table className="um-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Driver</th>
                        <th>Points</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sponsorHistory.map((txn) => (
                        <tr key={txn.id}>
                          <td>{new Date(txn.created_at).toLocaleString()}</td>
                          <td>{txn.driver_email}</td>
                          <td>{txn.points}</td>
                          <td>{txn.description || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}