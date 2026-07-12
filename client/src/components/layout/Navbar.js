import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (user) {
            // Load the current unread notification count for the logged-in user
      API.get('/notifications/unread-count').then(({ data }) => setUnread(data.count)).catch(() => {});
      const interval = setInterval(() => {
        API.get('/notifications/unread-count').then(({ data }) => setUnread(data.count)).catch(() => {});
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleLogout = () => {
        // Clear session and send the user back to the login page
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/dashboard">📊 AssetFlow</Link>
      </div>
      <div className="navbar-menu">
        <Link to="/notifications" className="nav-icon-link">
          🔔
          {unread > 0 && <span className="badge">{unread}</span>}
        </Link>
        <div className="nav-user" onClick={() => setShowDropdown(!showDropdown)}>
          <span className="nav-avatar">{user?.name?.charAt(0)?.toUpperCase()}</span>
          <span className="nav-user-name">{user?.name}</span>
          {showDropdown && (
            <div className="dropdown-menu">
              <div className="dropdown-item">{user?.email}</div>
              <div className="dropdown-item">Role: {user?.role?.replace('_', ' ')}</div>
              <hr />
              <div className="dropdown-item" onClick={handleLogout}>Logout</div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
