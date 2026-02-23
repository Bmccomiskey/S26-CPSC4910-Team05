import { useState } from 'react';
import { Link } from 'react-router-dom';
import './LoginPage.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || 'Something went wrong. Please try again.');
      } else {
        setSubmitted(true);
      }
    } catch {
      setError('Unable to reach the server. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // shown after successful submission
  if (submitted) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="header">
            <h1>Check Your Email</h1>
          </div>
          <p style={{ color: 'var(--chrome)', fontSize: '14px', lineHeight: 1.7, marginBottom: '24px' }}>
            If an account with <strong style={{ color: 'var(--amber)' }}>{email}</strong> exists,
            a reset link has been sent. The link expires in{' '}
            <strong style={{ color: 'var(--amber)' }}>30 minutes</strong>.
          </p>
          <button className="submit-btn" onClick={() => { setSubmitted(false); setEmail(''); }}>
            Try Another Email
          </button>
          <p className="signup-link" style={{ marginTop: '20px' }}>
            <Link to="/login">← Back to login</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="header">
          <h1>Forgot Password</h1>
        </div>

        <p style={{ color: 'var(--chrome)', fontSize: '13px', marginBottom: '28px', lineHeight: 1.6 }}>
          Enter your email and we'll send you a link to reset your password.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {error && <p className="error-message">{error}</p>}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <p className="signup-link" style={{ marginTop: '24px' }}>
          <Link to="/login">← Back to login</Link>
        </p>
      </div>
    </div>
  );
}
