import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './SponsorProfile.css';

const API_BASE =
  process.env.NODE_ENV === "production"
    ? "http://23.22.72.87"
    : "http://localhost:8000";

const DEFAULTS = {
  companyName: '', contactName: '', phone: '', website: '',
  address: '', industry: '', pointBudget: '200000',
  minPointCost: '0', maxPointCost: '10000', pointPerDollar: '100',
};

export default function SponsorProfile({ user, applications = [], onConfigUpdated }) {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [saved, setSaved]     = useState(false);
  const [profile, setProfile] = useState(DEFAULTS);

  useEffect(() => {
    if (!user?.id) return;
    fetch(`/profile/${user.id}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data && Object.keys(data).length > 0) {
          setProfile({
            companyName:  data.company_name   || '',
            contactName:  data.contact_name   || '',
            phone:        data.phone          || '',
            website:      data.website        || '',
            address:      data.address        || '',
            industry:     data.industry       || '',
            pointBudget:  data.point_budget   || '200000',
            minPointCost: data.min_point_cost || '0',
            maxPointCost: data.max_point_cost || '10000',
            pointPerDollar: data.point_per_dollar || '100',
          });
        }
      })
      .catch(err => console.error('Error fetching profile:', err));
  }, [user]);

  const set = (key, val) => setProfile(p => ({ ...p, [key]: val }));

  const approved    = applications.filter(a => a.status === 'APPROVED').length;
  const budgetUsed  = 8400;
  const budgetTotal = parseInt(profile.pointBudget) || 1;
  const budgetPct   = Math.min(100, Math.round((budgetUsed / budgetTotal) * 100));

  const handleSave = async (e) => {
  e.preventDefault();

  try {
    const res = await fetch(
      `${API_BASE}/catalog/${user.id}/config?min_point_cost=${profile.minPointCost}&max_point_cost=${profile.maxPointCost}&points_per_dollar=${profile.pointsPerDollar}`,
      {
        method: 'POST',
        credentials: 'include',
      }
    );

    const data = await res.json();

    if (!res.ok) {
      console.error("Failed to save catalog config:", data);
      return;
    }

    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);

    if (onConfigUpdated) {
      onConfigUpdated();
    }
  } catch (err) {
    console.error("Profile save failed:", err);
  }
};

  return (
    <div className="srp-root">

      {/* Page heading */}
      <div className="srp-page-header">
        <div>
          <h1 className="srp-page-title">Profile</h1>
          <p className="srp-page-sub">Manage your sponsor account and company information</p>
        </div>
        {!editing && (
          <button className="srp-edit-btn" onClick={() => setEditing(true)}>
            Edit Profile
          </button>
        )}
      </div>

      {saved && (
        <div className="srp-alert-success">
          ✓ Profile updated successfully
        </div>
      )}

      {/* Hero card */}
      <div className="srp-hero">
        <div className="srp-avatar">{profile.companyName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'S'}</div>
        <div className="srp-hero-info">
          <p className="srp-hero-name">{profile.companyName}</p>
          <p className="srp-hero-email">{user?.email}</p>
          <div className="srp-hero-tags">
            <span className="srp-tag srp-tag-role">Sponsor</span>
            <span className="srp-tag srp-tag-active">Active</span>
            <span className="srp-tag srp-tag-neutral">{profile.industry}</span>
          </div>
        </div>
        <div className="srp-hero-stats">
          <div className="srp-hero-stat">
            <span className="srp-hero-stat-val">{approved}</span>
            <span className="srp-hero-stat-label">Drivers</span>
          </div>
          <div className="srp-hero-stat-divider" />
          <div className="srp-hero-stat">
            <span className="srp-hero-stat-val">8,400</span>
            <span className="srp-hero-stat-label">Pts Awarded</span>
          </div>
          <div className="srp-hero-stat-divider" />
          <div className="srp-hero-stat">
            <span className="srp-hero-stat-val">32</span>
            <span className="srp-hero-stat-label">Catalog Items</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave}>

        {/* Company Information */}
        <div className="srp-card">
          <div className="srp-card-header">
            <h2 className="srp-card-title">Company Information</h2>
            <span className="srp-card-icon">🏢</span>
          </div>
          <div className="srp-grid">
            <Field label="Company Name" editing={editing} value={profile.companyName} onChange={v => set('companyName', v)} />
            <Field label="Industry"     editing={editing} value={profile.industry}    onChange={v => set('industry',    v)} />
            <Field label="Website"      editing={editing} value={profile.website}     onChange={v => set('website',     v)} />
            <Field label="Address"      editing={editing} value={profile.address}     onChange={v => set('address',     v)} span={2} />
          </div>
        </div>

        {/* Contact */}
        <div className="srp-card">
          <div className="srp-card-header">
            <h2 className="srp-card-title">Contact</h2>
            <span className="srp-card-icon">📋</span>
          </div>
          <div className="srp-grid">
            <Field label="Contact Name" editing={editing} value={profile.contactName} onChange={v => set('contactName', v)} />
            <Field label="Phone"        editing={editing} value={profile.phone}       onChange={v => set('phone',       v)} type="tel" />
            <div className="srp-field">
              <label className="srp-field-label">Email Address</label>
              <p className="srp-field-value">{user?.email || '—'}</p>
            </div>
          </div>
        </div>

        {/* Program Settings */}
        <div className="srp-card">
          <div className="srp-card-header">
            <h2 className="srp-card-title">Program Settings</h2>
            <span className="srp-card-icon">⚙️</span>
          </div>
          <div className="srp-grid">
            <div className="srp-field">
              <Field
              label="Minimum Catalog Points"
              editing={editing}
              value={profile.minPointCost}
              onChange={v => set('minPointCost', v)}
              type="number"
              />
              <Field
              label="Maximum Catalog Points"
              editing={editing}
              value={profile.maxPointCost}
              onChange={v => set('maxPointCost', v)}
              type="number"
              />
              <Field
              label="Points Per Dollar"
              editing={editing}
              value={profile.pointsPerDollar}
              onChange={v => set('pointsPerDollar', v)}
              type="number"
              />
              <label className="srp-field-label">Points Budget</label>
              {editing ? (
                <input
                  className="srp-input"
                  type="number"
                  value={profile.pointBudget}
                  onChange={e => set('pointBudget', e.target.value)}
                />
              ) : (
                <p className="srp-field-value">{parseInt(profile.pointBudget).toLocaleString()} pts</p>
              )}
            </div>
            <div className="srp-field">
              <label className="srp-field-label">Points Used</label>
              <p className="srp-field-value">
                {budgetUsed.toLocaleString()} pts
                <span className="srp-muted"> ({budgetPct}%)</span>
              </p>
            </div>
            <div className="srp-field">
              <label className="srp-field-label">Account Status</label>
              <span className="srp-tag srp-tag-active" style={{ display: 'inline-block', marginTop: 6 }}>Active</span>
            </div>
            <div className="srp-field">
              <label className="srp-field-label">Member Since</label>
              <p className="srp-field-value">January 2026</p>
            </div>

            <Field
            label="Minimum Catalog Points"
            editing={editing}
            value={profile.minPointCost}
            onChange={v => set('minPointCost', v)}
            type="number"
            />
            <Field
            label="Maximum Catalog Points"
            editing={editing}
            value={profile.maxPointCost}
            onChange={v => set('maxPointCost', v)}
            type="number"
            />
          </div>

          {/* Budget bar */}
          <div className="srp-budget">
            <div className="srp-budget-header">
              <span>Budget Utilization</span>
              <span className="srp-budget-pct">
                {budgetUsed.toLocaleString()} / {parseInt(profile.pointBudget).toLocaleString()} pts
              </span>
            </div>
            <div className="srp-progress-track">
              <div className="srp-progress-fill" style={{ width: `${budgetPct}%` }} />
            </div>
            <p className="srp-budget-hint">
              {(budgetTotal - budgetUsed).toLocaleString()} points remaining
            </p>
          </div>
        </div>

        {/* Security */}
        <div className="srp-card">
          <div className="srp-card-header">
            <h2 className="srp-card-title">Security</h2>
            <span className="srp-card-icon">🔒</span>
          </div>
          <div className="srp-grid">
            <div className="srp-field">
              <label className="srp-field-label">User ID</label>
              <p className="srp-field-value">#{user?.id || '—'}</p>
            </div>
            <div className="srp-field">
              <label className="srp-field-label">Password</label>
              <div className="srp-pw-row">
                <p className="srp-field-value" style={{ margin: 0 }}>••••••••••••</p>
                <button
                  type="button"
                  className="srp-link-btn"
                  onClick={() => navigate('/forgot-password')}
                >
                  Change
                </button>
              </div>
            </div>
          </div>
        </div>

        {editing && (
          <div className="srp-form-actions">
            <button
              type="button"
              className="srp-cancel-btn"
              onClick={() => setEditing(false)}
            >
              Cancel
            </button>
            <button type="submit" className="srp-save-btn">
              Save Changes
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

function Field({ label, value, onChange, editing, type = 'text', span }) {
  return (
    <div className="srp-field" style={span ? { gridColumn: `span ${span}` } : {}}>
      <label className="srp-field-label">{label}</label>
      {editing ? (
        <input
          className="srp-input"
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      ) : (
        <p className="srp-field-value">{value || '—'}</p>
      )}
    </div>
  );
}