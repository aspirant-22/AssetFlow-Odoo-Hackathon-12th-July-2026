import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import Modal from '../components/common/Modal';

const MaintenanceManagement = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedReq, setSelectedReq] = useState(null);
  const [form, setForm] = useState({ asset: '', description: '', priority: 'medium', photo: '' });
  const [resolveForm, setResolveForm] = useState({ technician: '', resolutionNotes: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [reqRes, assetRes] = await Promise.all([
        API.get('/maintenance'),
        user?.role === 'employee'
          ? API.get('/assets', { params: { currentHolder: user._id } })
          : API.get('/assets')
      ]);
      setRequests(reqRes.data);
      setAssets(assetRes.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/maintenance', form);
      setShowModal(false);
      setForm({ asset: '', description: '', priority: 'medium', photo: '' });
      fetchData();
    } catch (err) { alert(err.response?.data?.message || 'Error raising request'); }
  };

  const handleAction = async (id, status) => {
    try {
      await API.put(`/maintenance/${id}`, { status, ...resolveForm });
      setShowResolveModal(false);
      setSelectedReq(null);
      setResolveForm({ technician: '', resolutionNotes: '' });
      fetchData();
    } catch (err) { alert(err.response?.data?.message || 'Error updating'); }
  };

  if (loading) return <div className="page-loading"><div className="spinner"></div></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Maintenance Management</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Raise Request</button>
      </div>

      <div className="status-summary">
        {['pending', 'approved', 'rejected', 'technician_assigned', 'in_progress', 'resolved'].map(s => (
          <div key={s} className="status-count">
            <span className={`badge status-${s}`}>{s.replace('_', ' ')}</span>
            <strong>{requests.filter(r => r.status === s).length}</strong>
          </div>
        ))}
      </div>

      <table className="table">
        <thead>
          <tr><th>Asset</th><th>Requested By</th><th>Priority</th><th>Status</th><th>Date</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {requests.map(r => (
            <tr key={r._id}>
              <td>{r.asset?.name} ({r.asset?.assetTag})</td>
              <td>{r.requestedBy?.name}</td>
              <td><span className={`badge priority-${r.priority}`}>{r.priority}</span></td>
              <td><span className={`badge status-${r.status}`}>{r.status.replace('_', ' ')}</span></td>
              <td>{new Date(r.createdAt).toLocaleDateString()}</td>
              <td>
                {['asset_manager', 'admin'].includes(user?.role) && r.status === 'pending' && (
                  <>
                    <button className="btn btn-sm btn-success" onClick={() => handleAction(r._id, 'approved')}>Approve</button>
                    <button className="btn btn-sm btn-danger ml-1" onClick={() => handleAction(r._id, 'rejected')}>Reject</button>
                  </>
                )}
                {['asset_manager', 'admin'].includes(user?.role) && r.status === 'approved' && (
                  <button className="btn btn-sm" onClick={() => { setSelectedReq(r); setResolveForm({ ...resolveForm, technician: '' }); handleAction(r._id, 'technician_assigned'); }}>Assign Tech</button>
                )}
                {['asset_manager', 'admin'].includes(user?.role) && r.status === 'technician_assigned' && (
                  <button className="btn btn-sm" onClick={() => handleAction(r._id, 'in_progress')}>Start Work</button>
                )}
                {['asset_manager', 'admin'].includes(user?.role) && r.status === 'in_progress' && (
                  <button className="btn btn-sm btn-success" onClick={() => { setSelectedReq(r); setShowResolveModal(true); }}>Resolve</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Raise Maintenance Request" width="500px">
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label>Asset *</label>
            <select value={form.asset} onChange={e => setForm({ ...form, asset: e.target.value })} required>
              <option value="">Select asset</option>
              {assets.map(a => <option key={a._id} value={a._id}>{a.name} ({a.assetTag})</option>)}
            </select>
          </div>
          <div className="form-group"><label>Description *</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={4} required></textarea></div>
          <div className="form-group"><label>Priority</label>
            <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
              <option value="low">Low</option><option value="medium">Medium</option>
              <option value="high">High</option><option value="critical">Critical</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary btn-block">Submit Request</button>
        </form>
      </Modal>

      <Modal isOpen={showResolveModal} onClose={() => setShowResolveModal(false)} title="Resolve Maintenance" width="450px">
        <div>
          <p>Resolving: <strong>{selectedReq?.asset?.name}</strong></p>
          <div className="form-group"><label>Resolution Notes</label><textarea value={resolveForm.resolutionNotes} onChange={e => setResolveForm({ ...resolveForm, resolutionNotes: e.target.value })} rows={3}></textarea></div>
          <button className="btn btn-primary btn-block" onClick={() => handleAction(selectedReq?._id, 'resolved')}>Mark Resolved</button>
        </div>
      </Modal>
    </div>
  );
};

export default MaintenanceManagement;
