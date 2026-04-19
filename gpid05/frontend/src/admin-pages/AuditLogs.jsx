import { useEffect, useState } from 'react';
import './AuditLogs.css';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [types, setTypes] = useState([]);

  const [loading, setLoading] = useState(true);
  const [detailsOpenId, setDetailsOpenId] = useState(null);

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    total_pages: 1,
    per_page: 25,
  });

  const [filters, setFilters] = useState({
    search: '',
    event_type: '',
    role: '',
    success: 'all',
  });

  const fetchTypes = async () => {
    try {
      const res = await fetch('/audit/types', {
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to load audit types');
      setTypes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Audit types error:', err);
    }
  };

  const fetchLogs = async (pageToLoad = page, nextFilters = filters) => {
    setLoading(true);

    try {
      const params = new URLSearchParams();
      params.set('page', String(pageToLoad));
      params.set('per_page', '25');

      if (nextFilters.search.trim()) params.set('search', nextFilters.search.trim());
      if (nextFilters.event_type) params.set('event_type', nextFilters.event_type);
      if (nextFilters.role) params.set('role', nextFilters.role);
      if (nextFilters.success) params.set('success', nextFilters.success);

      const res = await fetch(`/audit/logs?${params.toString()}`, {
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to load audit logs');

      setLogs(Array.isArray(data.logs) ? data.logs : []);
      setPagination({
        total: data.total || 0,
        total_pages: data.total_pages || 1,
        per_page: data.per_page || 25,
      });
      setPage(data.page || 1);
    } catch (err) {
      console.error('Audit logs error:', err);
      setLogs([]);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchTypes();
    fetchLogs(1, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApplyFilters = () => {
    fetchLogs(1, filters);
  };

  const handleClearFilters = () => {
    const cleared = {
      search: '',
      event_type: '',
      role: '',
      success: 'all',
    };
    setFilters(cleared);
    fetchLogs(1, cleared);
  };

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > pagination.total_pages) return;
    fetchLogs(nextPage, filters);
  };

  return (
    <>
      <div className="sd-top-bar">
        <h1 className="sd-page-title">Audit Logs</h1>
      </div>

      <div className="sd-section">
        <h2>System Audit Logs</h2>
        <p className="al-subtext">
          Review admin, sponsor, and driver activity across the platform.
        </p>

        <div className="al-filters">
          <div className="al-field">
            <label>Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
              placeholder="Search email, event type, IP, or metadata"
            />
          </div>

          <div className="al-field">
            <label>Event Type</label>
            <select
              value={filters.event_type}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, event_type: e.target.value }))
              }
            >
              <option value="">All Types</option>
              {types.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="al-field">
            <label>User Role</label>
            <select
              value={filters.role}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, role: e.target.value }))
              }
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="sponsor">Sponsor</option>
              <option value="user">Driver</option>
            </select>
          </div>

          <div className="al-field">
            <label>Success</label>
            <select
              value={filters.success}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, success: e.target.value }))
              }
            >
              <option value="all">All</option>
              <option value="success">Success</option>
              <option value="failure">Failure</option>
            </select>
          </div>
        </div>

        <div className="al-actions">
          <button className="um-btn refresh" onClick={handleApplyFilters}>
            Apply Filters
          </button>
          <button className="um-btn delete" onClick={handleClearFilters}>
            Clear
          </button>
        </div>

        {loading ? (
          <p className="al-loading">Loading audit logs...</p>
        ) : (
          <>
            <div className="al-table-wrap">
              <table className="al-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Event Type</th>
                    <th>User</th>
                    <th>Role</th>
                    <th>Success</th>
                    <th>IP</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="al-empty">
                        No audit logs found.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <>
                        <tr key={log.id}>
                          <td>{new Date(log.created_at).toLocaleString()}</td>
                          <td>{log.event_type}</td>
                          <td>{log.user_email || `User #${log.user_id || 'N/A'}`}</td>
                          <td>{log.user_role || '—'}</td>
                          <td>
                            <span className={`al-pill ${log.success ? 'success' : 'failure'}`}>
                              {log.success ? 'Success' : 'Failure'}
                            </span>
                          </td>
                          <td>{log.ip_address || '—'}</td>
                          <td>
                            <button
                              className="um-btn refresh"
                              onClick={() =>
                                setDetailsOpenId((prev) => (prev === log.id ? null : log.id))
                              }
                            >
                              {detailsOpenId === log.id ? 'Hide' : 'View'}
                            </button>
                          </td>
                        </tr>

                        {detailsOpenId === log.id && (
                          <tr key={`${log.id}-details`}>
                            <td colSpan="7" className="al-details-cell">
                              <pre className="al-details">
                                {JSON.stringify(log.event_data, null, 2)}
                              </pre>
                            </td>
                          </tr>
                        )}
                      </>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="al-pagination">
              <span>
                Page {page} of {pagination.total_pages} · {pagination.total} total logs
              </span>

              <div className="al-pagination-buttons">
                <button
                  className="um-btn refresh"
                  disabled={page <= 1}
                  onClick={() => handlePageChange(page - 1)}
                >
                  Previous
                </button>
                <button
                  className="um-btn refresh"
                  disabled={page >= pagination.total_pages}
                  onClick={() => handlePageChange(page + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}