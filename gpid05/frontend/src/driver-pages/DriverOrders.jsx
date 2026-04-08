import { useState, useEffect } from 'react';
import './DriverOrders.css';

const CANCEL_WINDOW_MS = 10 * 60 * 1000;

export default function DriverOrders({ user, orders = [], onBrowseCatalog, onCancelOrder }) {
  const storageKey = `dro-dismissed-${user?.id}`;

  const [dismissedIds, setDismissedIds] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem(storageKey) || '[]'));
    } catch {
      return new Set();
    }
  });
  const [showHistory, setShowHistory] = useState(false);
  const [now, setNow] = useState(Date.now());

  // Tick every second while any order is still within the cancel window
  useEffect(() => {
    const cancellable = orders.some(o =>
      o.status === 'COMPLETED' && (Date.now() - new Date(o.created_at).getTime()) < CANCEL_WINDOW_MS
    );
    if (!cancellable) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [orders]);

  const getRemainingMs = (created_at) =>
    CANCEL_WINDOW_MS - (now - new Date(created_at).getTime());

  const formatCountdown = (ms) => {
    const totalSec = Math.max(0, Math.floor(ms / 1000));
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const statusMeta = {
    DELIVERED:  { label: 'Delivered',   color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
    SHIPPED:    { label: 'Shipped',     color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
    PROCESSING: { label: 'Processing',  color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
    CANCELLED:  { label: 'Cancelled',   color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
    COMPLETED:  { label: 'Completed',   color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatPoints = (pts) => pts?.toLocaleString();

  const dismiss = (id) => {
    setDismissedIds(prev => {
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem(storageKey, JSON.stringify([...next]));
      return next;
    });
  };

  const activeOrders = orders.filter(o => !dismissedIds.has(o.id));
  const displayedOrders = showHistory ? orders : activeOrders;
  const hasHistory = orders.length > 0;

  return (
    <div className="dro-root">
      <div className="dro-page-header">
        <div>
          <h1 className="dro-page-title">{showHistory ? 'Order History' : 'My Orders'}</h1>
          <p className="dro-page-sub">
            {showHistory
              ? 'All redeemed rewards including removed items'
              : 'Track your redeemed rewards and order history'}
          </p>
        </div>
        <div className="dro-header-actions">
          {hasHistory && (
            <button
              className="dro-history-btn"
              onClick={() => setShowHistory(v => !v)}
            >
              {showHistory ? '← Back to Orders' : 'Order History'}
            </button>
          )}
          {!showHistory && activeOrders.length > 0 && (
            <div className="dro-summary-pill">
              {activeOrders.length} order{activeOrders.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {displayedOrders.length === 0 ? (
        <div className="dro-empty">
          <div className="dro-empty-icon-wrap">
            <svg className="dro-empty-icon" viewBox="0 0 64 64" fill="none">
              <circle cx="32" cy="32" r="30" stroke="#e2e8f0" strokeWidth="2"/>
              <path d="M20 24h24l-3 16H23L20 24z" stroke="#cbd5e1" strokeWidth="2" strokeLinejoin="round"/>
              <path d="M20 24l-2-6H14" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="26" cy="44" r="2" fill="#cbd5e1"/>
              <circle cx="38" cy="44" r="2" fill="#cbd5e1"/>
              <path d="M27 31h10M27 36h6" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="44" cy="18" r="6" fill="#F59E0B"/>
              <path d="M44 15v3.5l2 1.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="dro-empty-title">No orders yet</h2>
          <p className="dro-empty-desc">
            Once you redeem points for rewards from the catalog, your orders will appear here.
          </p>
          <button className="dro-cta-btn" onClick={onBrowseCatalog}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            Browse Catalog
          </button>
        </div>
      ) : (
        <div className="dro-table-card">
          <table className="dro-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Date Ordered</th>
                <th>Points Spent</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {displayedOrders.map((order) => {
                const meta = statusMeta[order.status] || statusMeta.PROCESSING;
                const isDismissed = dismissedIds.has(order.id);
                return (
                  <tr key={order.id} className={isDismissed ? 'dro-row-dismissed' : ''}>
                    <td className="dro-td-item">
                      <span className="dro-item-name">{order.item_name}</span>
                    </td>
                    <td className="dro-td-date">{formatDate(order.created_at)}</td>
                    <td className="dro-td-points">
                      <span className="dro-points-badge">−{formatPoints(order.points_spent)} pts</span>
                    </td>
                    <td>
                      <span
                        className="dro-status-badge"
                        style={{ color: meta.color, background: meta.bg, border: `1px solid ${meta.border}` }}
                      >
                        {meta.label}
                      </span>
                    </td>
                    <td className="dro-td-actions">
                      {order.status === 'COMPLETED' && (() => {
                        const remaining = getRemainingMs(order.created_at);
                        if (remaining > 0) {
                          return (
                            <div className="dro-cancel-wrap">
                              <button
                                className="dro-cancel-btn"
                                onClick={() => onCancelOrder(order.id)}
                              >
                                Cancel Order
                              </button>
                              <span className="dro-cancel-timer">{formatCountdown(remaining)} left</span>
                            </div>
                          );
                        }
                        if (!showHistory) {
                          return (
                            <button
                              className="dro-remove-btn"
                              onClick={() => dismiss(order.id)}
                              title="Remove from orders"
                            >
                              Remove
                            </button>
                          );
                        }
                        return null;
                      })()}
                      {showHistory && isDismissed && (
                        <span className="dro-removed-label">Removed</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
