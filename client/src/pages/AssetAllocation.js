import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import Modal from '../components/common/Modal';

const AssetAllocation = () => {
  const { user } = useAuth();
  const [allocations, setAllocations] = useState([]);
  const [assets, setAssets] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [transferReqs, setTransferReqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllocModal, setShowAllocModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedAlloc, setSelectedAlloc] = useState(null);
  const [tab, setTab] = useState('active');
  const [form, setForm] = useState({ asset: '', employee: '', department: '', expectedReturnDate: '', notes: '' });
  const [transferForm, setTransferForm] = useState({ asset: '', fromEmployee: '', toEmployee: '', notes: '' });
  const [returnNote, setReturnNote] = useState('');
  const [blockError, setBlockError] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [allocRes, assetRes, deptRes, empRes, transferRes] = await Promise.all([
        API.get('/allocations'),
        API.get('/assets'),
        API.get('/departments'),
        API.get('/employees', { params: { status: 'active' } }),
        API.get('/allocations/transfer-requests')
      ]);
      setAllocations(allocRes.data);
      setAssets(assetRes.data);
      setDepartments(deptRes.data);
      setEmployees(empRes.data);
      setTransferReqs(transferRes.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleAllocate = async (e) => {
    e.preventDefault();
    setBlockError('');
    try {
      await API.post('/allocations', form);
      setShowAllocModal(false);
      setForm({ asset: '', employee: '', department: '', expectedReturnDate: '', notes: '' });
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Error allocating';
      const isBlocked = err.response?.data?.transferRequired;
      setBlockError(msg);
      if (isBlocked) {
        const holder = err.response?.data?.currentHolder;
        setTransferForm(prev => ({ ...prev, asset: form.asset, fromEmployee: holder?._id || '', toEmployee: form.employee }));
      }
    }
  };

  const handleReturn = async () => {
    if (!selectedAlloc) return;
    try {
      await API.put(`/allocations/${selectedAlloc._id}/return`, { conditionCheckIn: returnNote });
      setShowReturnModal(false);
      setSelectedAlloc(null);
      setReturnNote('');
      fetchData();
    } catch (err) { alert(err.response?.data?.message || 'Error returning asset'); }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    try {
      await API.post('/allocations/transfer-requests', transferForm);
      setShowTransferModal(false);
      setTransferForm({ asset: '', fromEmployee: '', toEmployee: '', notes: '' });
      fetchData();
    } catch (err) { alert(err.response?.data?.message || 'Error creating transfer'); }
  };

  const handleTransferStatus = async (id, status) => {
    try {
      await API.put(`/allocations/transfer-requests/${id}`, { status });
      fetchData();
    } catch (err) { alert(err.response?.data?.message || 'Error updating transfer'); }
  };

  const filteredAllocations = allocations.filter(a => tab === 'all' || a.status === tab);

  if (loading) return <div className="page-loading"><div className="spinner"></div></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Asset Allocation & Transfers</h1>
        <div>
          {['asset_manager', 'department_head', 'admin'].includes(user?.role) && (
            <button className="btn btn-primary" onClick={() => setShowAllocModal(true)}>+ Allocate Asset</button>
          )}
          <button className="btn btn-outline ml-2" onClick={() => setShowTransferModal(true)}>Request Transfer</button>
        </div>
      </div>

      {blockError && <div className="alert alert-error">{blockError}</div>}

      <div className="tabs">
        <button className={`tab ${tab === 'active' ? 'active' : ''}`} onClick={() => setTab('active')}>Active</button>
        <button className={`tab ${tab === 'returned' ? 'active' : ''}`} onClick={() => setTab('returned')}>Returned</button>
        <button className={`tab ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>All</button>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><h3>Transfer Requests</h3></div>
        <div className="card-body">
          {transferReqs.filter(r => r.status === 'pending').length === 0 ? (
            <p className="text-muted">No pending transfers</p>
          ) : (
            <table className="table">
              <thead><tr><th>Asset</th><th>From</th><th>To</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {transferReqs.filter(r => r.status === 'pending').map(r => (
                  <tr key={r._id}>
                    <td>{r.asset?.name}</td><td>{r.fromEmployee?.name}</td><td>{r.toEmployee?.name}</td>
                    <td><span className={`badge ${r.status}`}>{r.status}</span></td>
                    <td>
                      {['asset_manager', 'department_head', 'admin'].includes(user?.role) && (
                        <>
                          <button className="btn btn-sm btn-success" onClick={() => handleTransferStatus(r._id, 'approved')}>Approve</button>
                          <button className="btn btn-sm btn-danger ml-1" onClick={() => handleTransferStatus(r._id, 'rejected')}>Reject</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <table className="table">
        <thead><tr><th>Asset</th><th>Employee</th><th>Department</th><th>Allocated Date</th><th>Expected Return</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          {filteredAllocations.map(a => (
            <tr key={a._id}>
              <td>{a.asset?.name} ({a.asset?.assetTag})</td>
              <td>{a.employee?.name}</td>
              <td>{a.department?.name || '-'}</td>
              <td>{new Date(a.allocatedDate).toLocaleDateString()}</td>
              <td>{a.expectedReturnDate ? new Date(a.expectedReturnDate).toLocaleDateString() : '-'}</td>
              <td>
                <span className={`badge ${a.status === 'active' && a.expectedReturnDate && new Date(a.expectedReturnDate) < new Date() ? 'overdue' : a.status}`}>
                  {a.status === 'active' && a.expectedReturnDate && new Date(a.expectedReturnDate) < new Date() ? 'overdue' : a.status}
                </span>
              </td>
              <td>
                {a.status === 'active' && ['asset_manager', 'admin'].includes(user?.role) && (
                  <button className="btn btn-sm" onClick={() => { setSelectedAlloc(a); setShowReturnModal(true); }}>Return</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Modal isOpen={showAllocModal} onClose={() => { setShowAllocModal(false); setBlockError(''); }} title="Allocate Asset" width="500px">
        <form onSubmit={handleAllocate}>
          {blockError && <div className="alert alert-error">{blockError}</div>}
          <div className="form-group"><label>Asset *</label>
            <select value={form.asset} onChange={e => setForm({ ...form, asset: e.target.value })} required>
              <option value="">Select asset</option>
              {assets.filter(a => a.status === 'available' || form.asset === a._id).map(a => (
                <option key={a._id} value={a._id}>{a.name} ({a.assetTag}) - {a.status}</option>
              ))}
            </select>
          </div>
          <div className="form-group"><label>Employee *</label>
            <select value={form.employee} onChange={e => {
              const emp = employees.find(emp => emp._id === e.target.value);
              setForm({ ...form, employee: e.target.value, department: emp?.department?._id || '' });
            }} required>
              <option value="">Select employee</option>
              {employees.map(e => <option key={e._id} value={e._id}>{e.name} ({e.email}){e.department ? ` - ${e.department.name}` : ''}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Department</label>
            <select value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}>
              <option value="">None</option>
              {departments.filter(d => d.status === 'active').map(d => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group"><label>Expected Return Date</label><input type="date" value={form.expectedReturnDate} onChange={e => setForm({ ...form, expectedReturnDate: e.target.value })} /></div>
          <div className="form-group"><label>Notes</label><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}></textarea></div>
          <button type="submit" className="btn btn-primary btn-block">Allocate</button>
        </form>
      </Modal>

      <Modal isOpen={showTransferModal} onClose={() => setShowTransferModal(false)} title="Request Transfer" width="500px">
        <form onSubmit={handleTransfer}>
          <div className="form-group"><label>Asset *</label>
            <select value={transferForm.asset} onChange={e => setTransferForm({ ...transferForm, asset: e.target.value })} required>
              <option value="">Select asset</option>
              {assets.filter(a => a.status === 'allocated').map(a => (
                <option key={a._id} value={a._id}>{a.name} ({a.assetTag}) - {a.currentHolder?.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group"><label>From Employee</label><input value={transferForm.fromEmployee ? employees.find(e => e._id === transferForm.fromEmployee)?.name || '' : ''} disabled /></div>
          <div className="form-group"><label>To Employee *</label>
            <select value={transferForm.toEmployee} onChange={e => setTransferForm({ ...transferForm, toEmployee: e.target.value })} required>
              <option value="">Select employee</option>
              {employees.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Notes</label><textarea value={transferForm.notes} onChange={e => setTransferForm({ ...transferForm, notes: e.target.value })}></textarea></div>
          <button type="submit" className="btn btn-primary btn-block">Submit Transfer Request</button>
        </form>
      </Modal>

      <Modal isOpen={showReturnModal} onClose={() => setShowReturnModal(false)} title="Return Asset">
        <div>
          <p>Returning: <strong>{selectedAlloc?.asset?.name}</strong> from <strong>{selectedAlloc?.employee?.name}</strong></p>
          <div className="form-group"><label>Condition Check-in Notes</label><textarea value={returnNote} onChange={e => setReturnNote(e.target.value)} rows={3}></textarea></div>
          <button className="btn btn-primary btn-block" onClick={handleReturn}>Confirm Return</button>
        </div>
      </Modal>
    </div>
  );
};

export default AssetAllocation;
