import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import Modal from '../components/common/Modal';

const AssetAudit = () => {
  const [cycles, setCycles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [auditItems, setAuditItems] = useState([]);
  const [discrepancyReport, setDiscrepancyReport] = useState([]);
  const [showDiscrepancy, setShowDiscrepancy] = useState(false);
  const [form, setForm] = useState({
    name: '', department: '', location: '', startDate: '', endDate: '', auditors: []
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [cycleRes, deptRes, empRes] = await Promise.all([
        API.get('/audits'), API.get('/departments'), API.get('/employees', { params: { status: 'active' } })
      ]);
      setCycles(cycleRes.data);
      setDepartments(deptRes.data);
      setEmployees(empRes.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await API.post('/audits', form);
      setShowModal(false);
      setForm({ name: '', department: '', location: '', startDate: '', endDate: '', auditors: [] });
      fetchData();
    } catch (err) { alert(err.response?.data?.message || 'Error creating audit'); }
  };

  const viewCycle = async (id) => {
    try {
      const { data } = await API.get(`/audits/${id}`);
      setSelectedCycle(data.cycle);
      setAuditItems(data.items);
    } catch (err) { alert('Error fetching audit'); }
  };

  const verifyItem = async (itemId, status) => {
    try {
      await API.put(`/audits/items/${itemId}`, { status, notes: status === 'verified' ? 'Verified' : status === 'missing' ? 'Missing' : 'Damaged' });
      viewCycle(selectedCycle._id);
    } catch (err) { alert(err.response?.data?.message || 'Error updating'); }
  };

  const updateStatus = async (id, status) => {
    try {
      await API.put(`/audits/${id}/status`, { status });
      fetchData();
      setSelectedCycle(null);
    } catch (err) { alert('Error updating status'); }
  };

  const viewDiscrepancy = async (id) => {
    try {
      const { data } = await API.get(`/audits/${id}/discrepancy-report`);
      setDiscrepancyReport(data);
      setShowDiscrepancy(true);
    } catch (err) { alert('Error fetching report'); }
  };

  if (loading) return <div className="page-loading"><div className="spinner"></div></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Asset Audit</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Audit Cycle</button>
      </div>

      <div className="card-grid">
        {cycles.map(c => (
          <div key={c._id} className="card">
            <div className="card-header">
              <h3>{c.name}</h3>
              <span className={`badge status-${c.status}`}>{c.status.replace('_', ' ')}</span>
            </div>
            <div className="card-body">
              <p>Department: {c.department?.name || 'All'}</p>
              <p>Location: {c.location || 'All'}</p>
              <p>Period: {new Date(c.startDate).toLocaleDateString()} - {new Date(c.endDate).toLocaleDateString()}</p>
              <p>Auditors: {c.auditors?.map(a => a.name).join(', ') || 'Not assigned'}</p>
              <div className="btn-group">
                <button className="btn btn-sm" onClick={() => viewCycle(c._id)}>View Items</button>
                <button className="btn btn-sm btn-outline" onClick={() => viewDiscrepancy(c._id)}>Discrepancies</button>
                {c.status === 'open' && <button className="btn btn-sm btn-success" onClick={() => updateStatus(c._id, 'in_progress')}>Start Audit</button>}
                {c.status === 'in_progress' && <button className="btn btn-sm btn-danger" onClick={() => updateStatus(c._id, 'closed')}>Close Cycle</button>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedCycle && (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-header">
            <h3>{selectedCycle.name} - Audit Items</h3>
            <button className="btn btn-sm" onClick={() => setSelectedCycle(null)}>Close</button>
          </div>
          <div className="card-body">
            <table className="table">
              <thead><tr><th>Asset</th><th>Asset Tag</th><th>Location</th><th>Status</th><th>Verified By</th><th>Actions</th></tr></thead>
              <tbody>
                {auditItems.map(item => (
                  <tr key={item._id}>
                    <td>{item.asset?.name}</td>
                    <td>{item.asset?.assetTag}</td>
                    <td>{item.asset?.location || '-'}</td>
                    <td><span className={`badge status-${item.status}`}>{item.status}</span></td>
                    <td>{item.verifiedBy?.name || '-'}</td>
                    <td>
                      {selectedCycle.status !== 'closed' && (
                        <>
                          <button className="btn btn-sm btn-success" onClick={() => verifyItem(item._id, 'verified')}>✓</button>
                          <button className="btn btn-sm btn-warning ml-1" onClick={() => verifyItem(item._id, 'missing')}>?</button>
                          <button className="btn btn-sm btn-danger ml-1" onClick={() => verifyItem(item._id, 'damaged')}>!</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Audit Cycle" width="500px">
        <form onSubmit={handleCreate}>
          <div className="form-group"><label>Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
          <div className="form-row">
            <div className="form-group"><label>Department</label>
              <select value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}>
                <option value="">All</option>
                {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Location</label><input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Start Date *</label><input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} required /></div>
            <div className="form-group"><label>End Date *</label><input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} required /></div>
          </div>
          <div className="form-group"><label>Auditors</label>
            <select multiple value={form.auditors} onChange={e => setForm({ ...form, auditors: Array.from(e.target.selectedOptions, o => o.value) })}>
              {employees.map(e => <option key={e._id} value={e._id}>{e.name} ({e.email})</option>)}
            </select>
            <small className="text-muted">Hold Ctrl/Cmd to select multiple</small>
          </div>
          <button type="submit" className="btn btn-primary btn-block">Create Audit Cycle</button>
        </form>
      </Modal>

      <Modal isOpen={showDiscrepancy} onClose={() => setShowDiscrepancy(false)} title="Discrepancy Report" width="600px">
        <div>
          {discrepancyReport.length === 0 ? (
            <p className="text-muted">No discrepancies found</p>
          ) : (
            <table className="table">
              <thead><tr><th>Asset</th><th>Tag</th><th>Location</th><th>Status</th><th>Verified By</th></tr></thead>
              <tbody>
                {discrepancyReport.map(item => (
                  <tr key={item._id}>
                    <td>{item.asset?.name}</td>
                    <td>{item.asset?.assetTag}</td>
                    <td>{item.asset?.location || '-'}</td>
                    <td><span className={`badge status-${item.status}`}>{item.status}</span></td>
                    <td>{item.verifiedBy?.name || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default AssetAudit;
