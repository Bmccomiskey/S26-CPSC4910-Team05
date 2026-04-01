import './DriverCart.css';

export default function DriverCart({ user, cartItems = [], transactions = [], balance = null,  onRemoveItem, onCheckout, onBrowseCatalog, onClose }) {
  const currentBalance = balance == null ? transactions.reduce((sum, t) => sum + t.points, 0) : balance;
  const totalCost = cartItems.reduce((sum, item) => sum + item.point_cost, 0);
  const canAfford = currentBalance >= totalCost;

  const fmt = (pts) => pts?.toLocaleString();

  return (
    <div className="dc-root">
      <div className="dc-page-header">
        <div>
          <h1 className="dc-page-title">My Cart</h1>
          <p className="dc-page-sub">Review your selected rewards before redeeming</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {cartItems.length > 0 && (
            <div className="dc-summary-pill">
              {cartItems.length} item{cartItems.length !== 1 ? 's' : ''}
            </div>
          )}
          {onClose && (
            <button className="dc-close-btn" onClick={onClose} title="Close cart">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Balance banner */}
      <div className="dc-balance-bar">
        <div className="dc-balance-info">
          <span className="dc-balance-label">Your Balance</span>
          <span className="dc-balance-value">{fmt(currentBalance)} pts</span>
        </div>
        {cartItems.length > 0 && (
          <>
            <div className="dc-balance-divider" />
            <div className="dc-balance-info">
              <span className="dc-balance-label">Cart Total</span>
              <span className={`dc-balance-value ${!canAfford ? 'dc-val-over' : ''}`}>
                {fmt(totalCost)} pts
              </span>
            </div>
            <div className="dc-balance-divider" />
            <div className="dc-balance-info">
              <span className="dc-balance-label">Remaining After</span>
              <span className={`dc-balance-value ${!canAfford ? 'dc-val-over' : 'dc-val-remain'}`}>
                {fmt(currentBalance - totalCost)} pts
              </span>
            </div>
          </>
        )}
      </div>

      {/* Insufficient points warning */}
      {!canAfford && cartItems.length > 0 && (
        <div className="dc-warning">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span>
            You don't have enough points to redeem all items.
            You need <strong>{fmt(totalCost - currentBalance)} more points</strong> to complete this order.
          </span>
        </div>
      )}

      {cartItems.length === 0 ? (
        <div className="dc-empty">
          <div className="dc-empty-icon-wrap">
            <svg className="dc-empty-icon" viewBox="0 0 64 64" fill="none">
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
          <h2 className="dc-empty-title">Your cart is empty</h2>
          <p className="dc-empty-desc">
            Browse the catalog and add items to your cart to redeem them here.
          </p>
          <button className="dc-cta-btn" onClick={onBrowseCatalog}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            Browse Catalog
          </button>
        </div>
      ) : (
        <div className="dc-layout">
          {/* Cart items list */}
          <div className="dc-items-card">
            <div className="dc-items-header">
              <h2 className="dc-items-title">Cart Items</h2>
            </div>
            <div className="dc-items-list">
              {cartItems.map((item, idx) => (
                <div key={`${item.id}-${item.sponsor_id}-${idx}`} className="dc-item-row">
                  {item.image_url && (
                    <img className="dc-item-img" src={item.image_url} alt={item.name} />
                  )}
                  <div className="dc-item-info">
                    <p className="dc-item-name">{item.name}</p>
                    <p className="dc-item-sponsor">Sponsor: {item.sponsor_email}</p>
                  </div>
                  <div className="dc-item-cost">
                    <span className="dc-points-badge">{fmt(item.point_cost)} pts</span>
                    {item.price_usd != null && (
                      <span className="dc-price-sub">${Number(item.price_usd).toFixed(2)}</span>
                    )}
                  </div>
                  <button
                    className="dc-remove-btn"
                    onClick={() => onRemoveItem(idx)}
                    title="Remove item"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Order summary */}
          <div className="dc-summary-card">
            <h2 className="dc-summary-title">Order Summary</h2>
            <div className="dc-summary-rows">
              {cartItems.map((item, idx) => (
                <div key={idx} className="dc-summary-row">
                  <span className="dc-summary-item-name">{item.name}</span>
                  <span className="dc-summary-item-pts">{fmt(item.point_cost)} pts</span>
                </div>
              ))}
              <div className="dc-summary-divider" />
              <div className="dc-summary-total-row">
                <span>Total</span>
                <span className={!canAfford ? 'dc-total-over' : ''}>{fmt(totalCost)} pts</span>
              </div>
            </div>
            <button
              className="dc-checkout-btn"
              disabled={!canAfford}
              onClick={onCheckout}
            >
              Redeem All — {cartItems.length} item{cartItems.length !== 1 ? 's' : ''}
            </button>
            {!canAfford && (
              <p className="dc-checkout-hint">Not enough points to redeem</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
