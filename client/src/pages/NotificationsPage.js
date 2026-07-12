import React, { useState, useEffect } from 'react';
import API from '../api/axios';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [logs, setLogs] = useState([]);
  const [tab, setTab] = useState('notifications');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [notifRes, logRes] = await Promise.all([
        API.get('/notifications'),
        API.get('/notifications/activity-logs')
      ]);
      setNotifications(notifRes.data);
      setLogs(logRes.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const markRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (err) {}
  };

  const markAllRead = async () => {
    try {
      await API.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {}
  };

  const getIcon = (type) => {
    const icons = {
      asset_assigned: '📋', maintenance_approved: '✅', maintenance_rejected: '❌',
      booking_confirmed: '📅', booking_cancelled: '🚫', booking_reminder: '⏰',
      transfer_approved: '🔄', overdue_return: '⚠️', audit_discrepancy: '🔍', general: '📢'
    };
    return icons[type] || '📢';
  };

  if (loading) return <div className="page-loading"><div className="spinner"></div></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Notifications & Activity Log</h1>
        {tab === 'notifications' && (
          <button className="btn btn-outline" onClick={markAllRead}>Mark All Read</button>
        )}
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'notifications' ? 'active' : ''}`} onClick={() => setTab('notifications')}>
          Notifications
        </button>
        <button className={`tab ${tab === 'logs' ? 'active' : ''}`} onClick={() => setTab('logs')}>
          Activity Logs
        </button>
      </div>

      {tab === 'notifications' && (
        <div className="notification-list">
          {notifications.length === 0 ? (
            <div className="card"><div className="card-body text-center text-muted">No notifications</div></div>
          ) : (
            notifications.map(n => (
              <div key={n._id} className={`notification-item ${n.read ? 'read' : 'unread'}`} onClick={() => !n.read && markRead(n._id)}>
                <div className="notif-icon">{getIcon(n.type)}</div>
                <div className="notif-content">
                  <div className="notif-title">{n.title}</div>
                  <div className="notif-message">{n.message}</div>
                  <div className="notif-time">{new Date(n.createdAt).toLocaleString()}</div>
                </div>
                {!n.read && <div className="notif-dot"></div>}
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'logs' && (
        <div className="card">
          <div className="card-body">
            <table className="table">
              <thead><tr><th>User</th><th>Action</th><th>Entity</th><th>Details</th><th>Timestamp</th></tr></thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log._id}>
                    <td>{log.user?.name}</td>
                    <td>{log.action}</td>
                    <td>{log.entity}</td>
                    <td>{log.details ? Object.entries(log.details).map(([k, v]) => `${k}: ${v}`).join(', ') : '-'}</td>
                    <td>{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
                {logs.length === 0 && <tr><td colSpan={5} className="text-center text-muted">No activity logs</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
