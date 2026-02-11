import React from "react";
import './LoginPage.css'; 

function SignUp() {
  return (
    <div className="login-container">
      <div className="login-card">
        <div className="header">
          <h1>Create an account</h1>
          <p className="subtitle">Join us today</p>
        </div>
        
        <form className="form">
          <div className="form-group">
            <label htmlFor="accountType">Account Type</label>
            <select
              id="accountType"
              name="accountType"
              required
            >
              <option value="">Select account type</option>
              <option value="driver">Driver</option>
              <option value="sponsor">Sponsor</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="name">Full name</label>
            <input
              type="text"
              id="name"
              placeholder="John Doe"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input
              type="email"
              id="email"
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              placeholder="Create a password"
              required
            />
          </div>

          <button type="submit" className="submit-btn">
            Sign up
          </button>
        </form>

        <p className="signup-link">
          Already have an account? <a href="/">Sign in</a>
        </p>
      </div>
    </div>
  );
}

export default SignUp;
