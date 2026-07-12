import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  // State variables for user inputs and UI status
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // Authentication context
  const { login } = useAuth();
  // Hook for page navigation
  const navigate = useNavigate();
// Handle login form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Authenticate user
      await login(email, password);
       // Redirect to dashboard after successful login
      navigate('/dashboard');
    } catch (err) {
      // Display error message if login fails
      setError(err.response?.data?.message || 'Login failed');
    } finally {
       // Stop loading indicator
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>📊 AssetFlow</h1>
          <p>Enterprise Asset & Resource Management</p>
        </div>
        <form onSubmit={handleSubmit}>
          <h2>Sign In</h2>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          <div className="auth-links">
            <Link to="/forgot-password">Forgot Password?</Link>
            <span> | </span>
            <Link to="/signup">Create Account</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
