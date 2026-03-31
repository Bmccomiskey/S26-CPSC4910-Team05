import { useState } from 'react';
import './LoginPage.css';
import { Link, useNavigate } from "react-router-dom";

// const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const MAX_ATTEMPTS = 3;

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (locked) {
      setError('This account is locked due to too many failed login attempts.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch(`/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setAttempts(0);
        localStorage.setItem('userRole', data.role);
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userId', data.id);

        if (data.role === 'sponsor') {
          navigate('/sponsor-dashboard');
        } else if (data.role === 'admin') {
          navigate('/admin-dashboard');
        } else {
          navigate('/driver-dashboard');
        }
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (newAttempts >= MAX_ATTEMPTS) {
          setLocked(true);
          setError('Account locked after too many failed attempts.');
        } else {
          const detail = data.detail || 'Incorrect email or password.';
          setError(`${detail} Attempts left: ${MAX_ATTEMPTS - newAttempts}`);
        }
      }
    } catch (err) {
      setError('Unable to connect to the server. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-card">
      <Link to="/" className="login-back-link">
        ← Back to Home
      </Link>
      <div className="header">
        <h1>Welcome back</h1>
      </div>

      <form className="form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email address</label>
          <input
            type="email"
            id="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading || locked}
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading || locked}
          />
        </div>

        {error && <p className="error-message">{error}</p>}

        <div className="form-footer">
          <Link to="/forgot-password">Forgot password?</Link>
        </div>

        <button type="submit" className="submit-btn" disabled={loading || locked}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <p className="signup-link">
        Don't have an account? <Link to="/signup">Sign up</Link>
      </p>
    </div>
  );
}
