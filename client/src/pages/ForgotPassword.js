import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const { data } = await API.post('/auth/forgot-password', { email });
      setMessage(data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Request failed');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>📊 AssetFlow</h1>
          <p>Reset Password</p>
        </div>
        <form onSubmit={handleSubmit}>
          <h2>Forgot Password</h2>
          {message && <div className="alert alert-success">{message}</div>}
          {error && <div className="alert alert-error">{error}</div>}
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your registered email" required />
          </div>
          <button type="submit" className="btn btn-primary btn-block">Send Reset Link</button>
          <div className="auth-links">
            <Link to="/login">Back to Sign In</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
