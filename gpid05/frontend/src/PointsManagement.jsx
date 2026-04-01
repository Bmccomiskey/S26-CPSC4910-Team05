import React, { useEffect, useMemo, useState } from 'react';
import './PointsManagement.css';

const DEFAULT_FORM = {
  operation: 'add',
  points: '',
  reason: '',
  hiddenFromReports: false,
};

export default function PointsManagement({ currentUser }) {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDriverIds, setSelectedDriverIds] = useState([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(DEFAULT_FORM);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchDrivers = async () => {
    setLoading(true);
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
    setLoading(false);
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

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

  const filteredDrivers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return drivers;
    return drivers.filter(
      (driver) =>
        driver.driver_email.toLowerCase().includes(term) ||
        driver.sponsor_display.toLowerCase().includes(term)
    );
  }, [drivers, search]);

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
        <h2>Manage Driver Points</h2>
        <p style={{ marginTop: '10px', color: '#374151' }}>
          Add or subtract points for one or more drivers, include a reason, and decide whether the change should be hidden from sponsor and driver reports.
        </p>

        {message && <div className="pm-message pm-success">✓ {message}</div>}
        {error && <div className="pm-message pm-error">⚠ {error}</div>}

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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" className="pm-empty-cell">Loading drivers...</td>
                  </tr>
                ) : filteredDrivers.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="pm-empty-cell">No drivers found.</td>
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
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </form>
      </div>
    </>
  );
}