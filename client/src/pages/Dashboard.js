import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import KPICard from '../components/common/KPICard';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/reports/dashboard')
      .then(({ data }) => setData(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading"><div className="spinner"></div></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Welcome, {user?.name}</h1>
        <p>Here's your operational snapshot</p>
      </div>

      <div className="kpi-grid">
        <KPICard title="Available Assets" value={data?.availableAssets} icon="✅" color="#28a745" subtitle="Ready to allocate" />
        <KPICard title="Allocated Assets" value={data?.allocatedAssets} icon="📋" color="#007bff" subtitle="Currently assigned" onClick={() => navigate('/allocations')} />
        <KPICard title="Under Maintenance" value={data?.maintenanceAssets} icon="🔧" color="#ffc107" subtitle="In repair" onClick={() => navigate('/maintenance')} />
        <KPICard title="Active Bookings" value={data?.activeBookings} icon="📅" color="#17a2b8" subtitle="Upcoming & ongoing" onClick={() => navigate('/bookings')} />
        <KPICard title="Pending Requests" value={data?.pendingTransfers} icon="⏳" color="#6f42c1" subtitle="Awaiting approval" onClick={() => navigate('/maintenance')} />
        <KPICard title="Upcoming Returns" value={data?.upcomingReturns} icon="↩️" color="#20c997" subtitle="Due for return" onClick={() => navigate('/allocations')} />
      </div>

      {data?.overdueAllocations > 0 && (
        <div className="alert alert-warning">
          ⚠️ {data.overdueAllocations} allocation(s) are overdue! <span className="clickable" onClick={() => navigate('/allocations')}>View details →</span>
        </div>
      )}

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header"><h3>Asset Status Overview</h3></div>
          <div className="card-body">
            <div className="status-bars">
              {data?.statusDistribution?.map(s => (
                <div key={s._id} className="status-bar-item">
                  <div className="status-bar-label">
                    <span>{s._id.replace('_', ' ')}</span>
                    <span>{s.count}</span>
                  </div>
                  <div className="status-bar-track">
                    <div className="status-bar-fill" style={{ width: `${(s.count / Math.max(data.totalAssets, 1)) * 100}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3>Quick Actions</h3></div>
          <div className="card-body">
            <div className="quick-actions">
              {['asset_manager', 'admin'].includes(user?.role) && (
                <button className="btn btn-primary btn-block" onClick={() => navigate('/assets')}>
                  📦 Register Asset
                </button>
              )}
              <button className="btn btn-outline btn-block" onClick={() => navigate('/bookings')}>
                📅 Book Resource
              </button>
              <button className="btn btn-outline btn-block" onClick={() => navigate('/maintenance')}>
                🔧 Raise Maintenance Request
              </button>
              {user?.role === 'admin' && (
                <button className="btn btn-outline btn-block" onClick={() => navigate('/organization')}>
                  🏢 Organization Setup
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
