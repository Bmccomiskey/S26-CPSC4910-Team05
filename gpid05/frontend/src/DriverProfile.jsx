import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './DriverProfile.css';

export default function DriverProfile({ user, applications = [], transactions = [] }) {
  const navigate = useNavigate();
  const [editing, setEditing]     = useState(false);
  const [saved, setSaved]         = useState(false);
  const [profile, setProfile]     = useState({
    firstName: 'Your',
    lastName:  'Name',
    phone:     '(---) - --- - ---',
    city:      'City',
    state:     'State',
    cdlNumber: 'CDL-TX-48821',
    cdlClass:  'Class A',
    yearsExp:  '-',
  });

  const approved = applications.filter(a => a.status === 'APPROVED').length;
  const totalPoints = transactions.reduce((sum, t) => sum + t.points, 0);

  const set = (key, val) => setProfile(p => ({ ...p, [key]: val }));

  const handleSave = (e) => {
    e.preventDefault();
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const initials = (profile.firstName[0] || 'D') + (profile.lastName[0] || '');

  return (
    <div className="drp-root">

      {/* Page heading */}
      <div className="drp-page-header">
        <div>
          <h1 className="drp-page-title">Profile</h1>
          <p className="drp-page-sub">Manage your personal and CDL information</p>
        </div>
        {!editing && (
          <button className="drp-edit-btn" onClick={() => setEditing(true)}>
            Edit Profile
          </button>
        )}
      </div>

      {saved && (
        <div className="drp-alert-success">
          ✓ Profile updated successfully
        </div>
      )}

      {/* Hero card */}
      <div className="drp-hero">
        <div className="drp-avatar">{initials}</div>
        <div className="drp-hero-info">
          <p className="drp-hero-name">{profile.firstName} {profile.lastName}</p>
          <p className="drp-hero-email">{user?.email}</p>
          <div className="drp-hero-tags">
            <span className="drp-tag drp-tag-role">Driver</span>
            <span className="drp-tag drp-tag-active">Active</span>
            <span className="drp-tag drp-tag-neutral">{profile.cdlClass}</span>
          </div>
        </div>
        <div className="drp-hero-stats">
          <div className="drp-hero-stat">
            <span className="drp-hero-stat-val">{totalPoints.toLocaleString()}</span>
            <span className="drp-hero-stat-label">Points</span>
          </div>
          <div className="drp-hero-stat-divider" />
          <div className="drp-hero-stat">
            <span className="drp-hero-stat-val">{approved}</span>
            <span className="drp-hero-stat-label">Sponsors</span>
          </div>
          <div className="drp-hero-stat-divider" />
          <div className="drp-hero-stat">
            <span className="drp-hero-stat-val">7</span>
            <span className="drp-hero-stat-label">Orders</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave}>

        {/* Personal Information */}
        <div className="drp-card">
          <div className="drp-card-header">
            <h2 className="drp-card-title">Personal Information</h2>
            <span className="drp-card-icon">👤</span>
          </div>
          <div className="drp-grid">
            <Field label="First Name"   editing={editing} value={profile.firstName}  onChange={v => set('firstName', v)} />
            <Field label="Last Name"    editing={editing} value={profile.lastName}   onChange={v => set('lastName',  v)} />
            <Field label="Phone"        editing={editing} value={profile.phone}      onChange={v => set('phone',     v)} type="tel" />
            <Field label="City"         editing={editing} value={profile.city}       onChange={v => set('city',      v)} />
            <Field label="State"        editing={editing} value={profile.state}      onChange={v => set('state',     v)} />
            <div className="drp-field">
              <label className="drp-field-label">Email Address</label>
              <p className="drp-field-value">{user?.email || '—'}</p>
            </div>
          </div>
        </div>

        {/* CDL Information */}
        <div className="drp-card">
          <div className="drp-card-header">
            <h2 className="drp-card-title">CDL Information</h2>
            <span className="drp-card-icon">🪪</span>
          </div>
          <div className="drp-grid">
            <Field label="CDL Number"          editing={editing} value={profile.cdlNumber} onChange={v => set('cdlNumber', v)} />
            <Field label="Years of Experience" editing={editing} value={profile.yearsExp}  onChange={v => set('yearsExp',  v)} type="number" />
            <div className="drp-field">
              <label className="drp-field-label">CDL Class</label>
              {editing ? (
                <select
                  className="drp-input"
                  value={profile.cdlClass}
                  onChange={e => set('cdlClass', e.target.value)}
                >
                  <option>Class A</option>
                  <option>Class B</option>
                  <option>Class C</option>
                </select>
              ) : (
                <p className="drp-field-value">{profile.cdlClass}</p>
              )}
            </div>
          </div>
        </div>

        {/* Account */}
        <div className="drp-card">
          <div className="drp-card-header">
            <h2 className="drp-card-title">Account</h2>
            <span className="drp-card-icon">⚙️</span>
          </div>
          <div className="drp-grid">
            <div className="drp-field">
              <label className="drp-field-label">Status</label>
              <span className="drp-tag drp-tag-active" style={{ display: 'inline-block', marginTop: 6 }}>Active</span>
            </div>
            <div className="drp-field">
              <label className="drp-field-label">Member Since</label>
              <p className="drp-field-value">January 2026</p>
            </div>
            <div className="drp-field">
              <label className="drp-field-label">User ID</label>
              <p className="drp-field-value">#{user?.id || '—'}</p>
            </div>
            <div className="drp-field">
              <label className="drp-field-label">Password</label>
              <div className="drp-pw-row">
                <p className="drp-field-value" style={{ margin: 0 }}>••••••••••••</p>
                <button
                  type="button"
                  className="drp-link-btn"
                  onClick={() => navigate('/forgot-password')}
                >
                  Change
                </button>
              </div>
            </div>
          </div>
        </div>

        {editing && (
          <div className="drp-form-actions">
            <button
              type="button"
              className="drp-cancel-btn"
              onClick={() => setEditing(false)}
            >
              Cancel
            </button>
            <button type="submit" className="drp-save-btn">
              Save Changes
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

function Field({ label, value, onChange, editing, type = 'text' }) {
  return (
    <div className="drp-field">
      <label className="drp-field-label">{label}</label>
      {editing ? (
        <input
          className="drp-input"
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      ) : (
        <p className="drp-field-value">{value || '—'}</p>
      )}
    </div>
  );
}