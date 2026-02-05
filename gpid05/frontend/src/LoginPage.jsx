import { useState } from 'react';
import './LoginPage.css';



const MAX_ATTEMPTS = 3;


export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    //mock login in lock handling
    if (locked) {
      setError('This account is locked due to too many failed login attempts.');
      return;
    }

    const MOCK_EMAIL = 'test@example.com';
    const MOCK_PASSWORD = 'password123';

    if (email === MOCK_EMAIL && password === MOCK_PASSWORD) {
      setError('');
      setAttempts(0);
      console.log('Login successful');
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      if (newAttempts >= MAX_ATTEMPTS) {
        setLocked(true);
        setError('Account locked after too many failed attempts.');
      } else {
        setError(`Incorrect email or password. Attempts left: ${MAX_ATTEMPTS - newAttempts}`);
      }
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
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
            />
          </div>

          {error && <p className="error-message">{error}</p>}

          <div className="form-footer">
            <a href="#" className="forgot-link">Forgot password?</a>
          </div>

          <button type="submit" className="submit-btn" disabled={locked}>
            Sign in
          </button>
        </form>

        <p className="signup-link">
          Dont have an account? <a href="#">Sign up</a>
        </p>
      </div>
    </div>
  );
}
