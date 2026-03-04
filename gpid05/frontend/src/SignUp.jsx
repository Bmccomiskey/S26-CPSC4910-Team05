import { useState } from "react";
import './LoginPage.css';
import { useNavigate, Link } from "react-router-dom";

// const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function SignUp() {
  const [accountType, setAccountType] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch(`/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        // Note: 'name' is not yet stored by the backend — only email, password, role are sent
        body: JSON.stringify({ email, password, role: accountType }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Account created! Redirecting to login...');
        setTimeout(() => navigate('/'), 1500);
      } else {
        const detail = data.detail;
        if (Array.isArray(detail)) {
          setError(detail.join(' '));
        } else {
          setError(detail || 'Registration failed. Please try again.');
        }
      }
    } catch (err) {
      setError('Unable to connect to the server. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="header">
          <h1>Create an account</h1>
          <p className="subtitle">Join us today</p>
        </div>

        <form className="form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="accountType">Account Type</label>
            <select
              id="accountType"
              name="accountType"
              value={accountType}
              onChange={(e) => setAccountType(e.target.value)}
              required
              disabled={loading}
            >
              <option value="">Select account type</option>
              <option value="user">Driver</option>
              <option value="sponsor">Sponsor</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="name">Full name</label>
            <input
              type="text"
              id="name"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input
              type="email"
              id="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {error && <p className="error-message">{error}</p>}
          {success && <p className="success-message">{success}</p>}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Creating account...' : 'Sign up'}
          </button>
        </form>

        <p className="signup-link">
          Already have an account? <Link to="/">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default SignUp;
