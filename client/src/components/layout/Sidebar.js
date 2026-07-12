import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const { hasRole } = useAuth();

  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: '📊', roles: ['employee', 'department_head', 'asset_manager', 'admin'] },
    { to: '/organization', label: 'Organization', icon: '🏢', roles: ['admin'] },
    { to: '/assets', label: 'Assets', icon: '📦', roles: ['employee', 'department_head', 'asset_manager', 'admin'] },
    { to: '/allocations', label: 'Allocations', icon: '🔄', roles: ['employee', 'department_head', 'asset_manager', 'admin'] },
    { to: '/bookings', label: 'Bookings', icon: '📅', roles: ['employee', 'department_head', 'asset_manager', 'admin'] },
    { to: '/maintenance', label: 'Maintenance', icon: '🔧', roles: ['employee', 'department_head', 'asset_manager', 'admin'] },
    { to: '/audits', label: 'Audits', icon: '✅', roles: ['admin'] },
    { to: '/reports', label: 'Reports', icon: '📈', roles: ['asset_manager', 'admin', 'department_head'] },
    { to: '/notifications', label: 'Notifications', icon: '🔔', roles: ['employee', 'department_head', 'asset_manager', 'admin'] },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-links">
        {links.filter(l => hasRole(...l.roles)).map(link => (
          <NavLink key={link.to} to={link.to} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <span className="sidebar-icon">{link.icon}</span>
            <span className="sidebar-label">{link.label}</span>
          </NavLink>
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;
