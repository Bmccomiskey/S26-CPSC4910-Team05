import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import './LoginPage.css';

//password rules
const PASSWORD_RULES = [
  { test: (p) => p.length >= 8,           label: 'At least 8 characters' },
  { test: (p) => /[A-Z]/.test(p),         label: 'One uppercase letter' },
  { test: (p) => /[a-z]/.test(p),         label: 'One lowercase letter' },
  { test: (p) => /[0-9]/.test(p),         label: 'One number' },
  { test: (p) => /[^A-Za-z0-9]/.test(p), label: 'One special character' },
];

export default function ResetPassword() {
  const [searchParams]              = useSearchParams();
  const navigate                    = useNavigate();
  const token                       = searchParams.get('token') || '';

  const [tokenValid, setTokenValid] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPw, setConfirmPw]   = useState('');
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [success, setSuccess]       = useState(false);

  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      return;
    }

    fetch(`/auth/validate-reset-token?token=${encodeURIComponent(token)}`)
      .then((res) => {
        if (res.ok) {
          setTokenValid(true);
        }
        else {
          setTokenValid(false);
        }
      })
      .catch(() => setTokenValid(false));
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPw) {
      setError('Passwords do not match.');
      return;
    }

    const allPassed = PASSWORD_RULES.every((r) => r.test(newPassword));
    if (!allPassed) {
      setError('Password does not meet the requirements.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({token, new_password: newPassword}),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || 'Something went wrong. Please try again.');
      }
      else {
        setSuccess(true);
        setTimeout(() => navigate('/login'), 3000);
      }
    }
    catch {
      setError('Unable to reach the server. Please try again later.');
    }
    finally {
      setLoading(false);
    }
  };

  //checking token
  if (tokenValid === null) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="header">
            <h1>Verifying Link</h1>
          </div>
          <p style={{ color: 'var(--chrome)', fontSize: '14px', textAlign: 'center' }}>
            Checking your reset link...
          </p>
        </div>
      </div>
    );
  }

  //invalid/expired token
  if (!tokenValid) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="header">
            <h1>Link Expired</h1>
          </div>
          <p style={{ color: 'var(--chrome)', fontSize: '14px', lineHeight: 1.7, marginBottom: '24px' }}>
            This reset link is <strong style={{ color: '#f87171' }}>invalid or has expired</strong>.
            Reset links are only valid for 30 minutes and can only be used once.
          </p>
          <Link to="/forgot-password">
            <button className="submit-btn">Request a New Link</button>
          </Link>
          <p className="signup-link" style={{ marginTop: '20px' }}>
            <Link to="/login">← Back to login</Link>
          </p>
        </div>
      </div>
    );
  }

  //success
  if (success) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="header">
            <h1>Password Updated</h1>
          </div>
          <p style={{ color: 'var(--chrome)', fontSize: '14px', lineHeight: 1.7, marginBottom: '24px' }}>
            Your password has been updated successfully.
            Redirecting you to login in a moment...
          </p>
          <Link to="/login">
            <button className="submit-btn">Go to Login</button>
          </Link>
        </div>
      </div>
    );
  }

  //new password form
  return (
    <div className="login-container">
      <div className="login-card">
        <div className="header">
          <h1>Reset Password</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              autoFocus
            />
          </div>

          {newPassword.length > 0 && (
            <div style={{
              marginTop: '-12px',
              marginBottom: '20px',
              padding: '14px 16px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--steel-gray)',
            }}>
              {PASSWORD_RULES.map((rule) => {
                const passed = rule.test(newPassword);
                return (
                  <div key={rule.label} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '12px',
                    letterSpacing: '0.5px',
                    color: passed ? '#4ade80' : 'var(--chrome)',
                    marginBottom: '4px',
                    transition: 'color 0.2s',
                  }}>
                    <span style={{ fontSize: '10px' }}>{passed ? '✔' : '○'}</span>
                    {rule.label}
                  </div>
                );
              })}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="confirmPw">Confirm New Password</label>
            <input
              type="password"
              id="confirmPw"
              placeholder="Re-enter new password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              required
            />
          </div>

          {confirmPw.length > 0 && (
            <p style={{
              fontSize: '12px',
              letterSpacing: '0.5px',
              marginTop: '-16px',
              marginBottom: '16px',
              color: newPassword === confirmPw ? '#4ade80' : '#f87171',
            }}>
              {newPassword === confirmPw ? 'Passwords match' : 'Passwords do not match'}
            </p>
          )}

          {error && <p className="error-message">{error}</p>}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Updating' : 'Update Password'}
          </button>
        </form>

        <p className="signup-link" style={{ marginTop: '24px' }}>
          <Link to="/login">← Back to login</Link>
        </p>
      </div>
    </div>
  );
}
