import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import KPICard from '../components/common/KPICard';

const Reports = () => {
  const [dashboard, setDashboard] = useState(null);
  const [utilization, setUtilization] = useState(null);
  const [maintenanceFreq, setMaintenanceFreq] = useState(null);
  const [deptSummary, setDeptSummary] = useState([]);
  const [bookingHeatmap, setBookingHeatmap] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      API.get('/reports/dashboard'),
      API.get('/reports/utilization'),
      API.get('/reports/maintenance-frequency'),
      API.get('/reports/department-summary'),
      API.get('/reports/booking-heatmap')
    ]).then(([d, u, m, ds, bh]) => {
      setDashboard(d.data);
      setUtilization(u.data);
      setMaintenanceFreq(m.data);
      setDeptSummary(ds.data);
      setBookingHeatmap(bh.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading"><div className="spinner"></div></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Reports & Analytics</h1>
        <button className="btn btn-outline" onClick={() => window.print()}>🖨️ Export / Print</button>
      </div>

      <div className="kpi-grid">
        <KPICard title="Total Assets" value={dashboard?.totalAssets} icon="📦" color="#007bff" />
        <KPICard title="Available" value={dashboard?.availableAssets} icon="✅" color="#28a745" />
        <KPICard title="Allocated" value={dashboard?.allocatedAssets} icon="📋" color="#17a2b8" />
        <KPICard title="Under Maintenance" value={dashboard?.maintenanceAssets} icon="🔧" color="#ffc107" />
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header"><h3>Asset Utilization (Most Used)</h3></div>
          <div className="card-body">
            <table className="table">
              <thead><tr><th>Asset</th><th>Tag</th><th>Times Allocated</th></tr></thead>
              <tbody>
                {utilization?.mostUsed?.slice(0, 10).map(a => (
                  <tr key={a._id}><td>{a.name}</td><td>{a.assetTag}</td><td>{a.allocations}</td></tr>
                )) || <tr><td colSpan={3} className="text-muted">No data</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3>Maintenance Frequency</h3></div>
          <div className="card-body">
            <table className="table">
              <thead><tr><th>Asset</th><th>Category</th><th>Requests</th></tr></thead>
              <tbody>
                {maintenanceFreq?.byAsset?.slice(0, 10).map(a => (
                  <tr key={a._id}><td>{a.name}</td><td>{a.category || '-'}</td><td>{a.count}</td></tr>
                )) || <tr><td colSpan={3} className="text-muted">No data</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header"><h3>Department-wise Allocation</h3></div>
          <div className="card-body">
            <table className="table">
              <thead><tr><th>Department</th><th>Assets</th></tr></thead>
              <tbody>
                {deptSummary.map(d => (
                  <tr key={d._id}><td>{d.name}</td><td>{d.assetCount}</td></tr>
                ))}
                {deptSummary.length === 0 && <tr><td colSpan={2} className="text-muted">No data</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3>Booking Heatmap (By Hour)</h3></div>
          <div className="card-body">
            <div className="heatmap">
              {Array.from({ length: 24 }, (_, i) => {
                const hour = String(i).padStart(2, '0');
                const slot = bookingHeatmap.find(b => b._id.hour === hour);
                const count = slot?.count || 0;
                const max = Math.max(...bookingHeatmap.map(b => b.count), 1);
                const intensity = count / max;
                return (
                  <div key={hour} className="heatmap-cell" style={{ backgroundColor: `rgba(26, 115, 232, ${intensity})` }}>
                    <small>{hour}:00</small>
                    <strong>{count}</strong>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3>Category Distribution</h3></div>
        <div className="card-body">
          <div className="status-bars">
            {dashboard?.categoryDistribution?.map(c => (
              <div key={c._id} className="status-bar-item">
                <div className="status-bar-label">
                  <span>{c.name || 'Uncategorized'}</span>
                  <span>{c.count}</span>
                </div>
                <div className="status-bar-track">
                  <div className="status-bar-fill" style={{ width: `${(c.count / Math.max(dashboard.totalAssets, 1)) * 100}%`, backgroundColor: '#17a2b8' }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
