import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import Modal from '../components/common/Modal';

const AssetDirectory = () => {
  const { user } = useAuth();
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: '', category: '', department: '' });
  const [form, setForm] = useState({
    name: '', category: '', serialNumber: '', acquisitionDate: '',
    acquisitionCost: '', condition: 'new', location: '', isBookable: false, department: '',
    documents: []
  });
  const [docNames, setDocNames] = useState([]);

  useEffect(() => { fetchAssets(); fetchCategories(); fetchDepartments(); }, []);

  const fetchAssets = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (filters.status) params.status = filters.status;
      if (filters.category) params.category = filters.category;
      if (filters.department) params.department = filters.department;
      const { data } = await API.get('/assets', { params });
      setAssets(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const fetchCategories = async () => {
    try {
      const { data } = await API.get('/categories');
      setCategories(data);
    } catch (e) {}
  };

  const fetchDepartments = async () => {
    try {
      const { data } = await API.get('/departments');
      setDepartments(data);
    } catch (e) {}
  };

  useEffect(() => { fetchAssets(); }, [search, filters]);

  const handleDocUpload = (e) => {
    const files = Array.from(e.target.files);
    const names = files.map(f => f.name);
    setDocNames(names);
    Promise.all(files.map(f => new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(f);
    }))).then(results => setForm({ ...form, documents: results }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/assets', form);
      setShowModal(false);
      setForm({ name: '', category: '', serialNumber: '', acquisitionDate: '', acquisitionCost: '', condition: 'new', location: '', isBookable: false, department: '', documents: [] });
      setDocNames([]);
      fetchAssets();
    } catch (err) { alert(err.response?.data?.message || 'Error registering asset'); }
  };

  const viewDetail = async (id) => {
    try {
      const { data } = await API.get(`/assets/${id}`);
      setShowDetail(data);
    } catch (err) { alert('Error fetching asset details'); }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Asset Directory</h1>
        {['asset_manager', 'admin'].includes(user?.role) && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Register Asset</button>
        )}
      </div>

      <div className="filters-bar">
        <input className="search-input" placeholder="Search by tag, serial, name..." value={search} onChange={e => setSearch(e.target.value)} />
        <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All Status</option>
          <option value="available">Available</option><option value="allocated">Allocated</option>
          <option value="reserved">Reserved</option><option value="under_maintenance">Under Maintenance</option>
          <option value="lost">Lost</option><option value="retired">Retired</option><option value="disposed">Disposed</option>
        </select>
        <select value={filters.category} onChange={e => setFilters({ ...filters, category: e.target.value })}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <select value={filters.department} onChange={e => setFilters({ ...filters, department: e.target.value })}>
          <option value="">All Departments</option>
          {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
        </select>
      </div>

      <table className="table">
        <thead>
          <tr><th>Asset Tag</th><th>Name</th><th>Category</th><th>Status</th><th>Location</th><th>Holder</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {assets.map(a => (
            <tr key={a._id}>
              <td><strong>{a.assetTag}</strong></td>
              <td>{a.name}</td>
              <td>{a.category?.name || '-'}</td>
              <td><span className={`badge status-${a.status}`}>{a.status.replace('_', ' ')}</span></td>
              <td>{a.location || '-'}</td>
              <td>{a.currentHolder?.name || '-'}</td>
              <td><button className="btn btn-sm" onClick={() => viewDetail(a._id)}>View</button></td>
            </tr>
          ))}
          {assets.length === 0 && <tr><td colSpan={7} className="text-center">No assets found</td></tr>}
        </tbody>
      </table>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Register Asset" width="600px">
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group"><label>Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="form-group"><label>Category *</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required>
                <option value="">Select category</option>
                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Serial Number</label><input value={form.serialNumber} onChange={e => setForm({ ...form, serialNumber: e.target.value })} /></div>
            <div className="form-group"><label>Acquisition Date</label><input type="date" value={form.acquisitionDate} onChange={e => setForm({ ...form, acquisitionDate: e.target.value })} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Acquisition Cost</label><input type="number" value={form.acquisitionCost} onChange={e => setForm({ ...form, acquisitionCost: e.target.value })} /></div>
            <div className="form-group"><label>Condition</label>
              <select value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })}>
                <option value="new">New</option><option value="good">Good</option><option value="fair">Fair</option>
                <option value="poor">Poor</option><option value="damaged">Damaged</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Location</label><input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></div>
            <div className="form-group"><label>Department</label>
              <select value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}>
                <option value="">None</option>
                {departments.filter(d => d.status === 'active').map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label><input type="checkbox" checked={form.isBookable} onChange={e => setForm({ ...form, isBookable: e.target.checked })} /> Shared/Bookable Resource</label>
          </div>
          <div className="form-group"><label>Documents (warranty, invoice, etc.)</label>
            <input type="file" multiple accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg" onChange={handleDocUpload} />
            {docNames.length > 0 && (
              <ul className="doc-list">{docNames.map((n, i) => <li key={i}>{n}</li>)}</ul>
            )}
          </div>
          <button type="submit" className="btn btn-primary btn-block">Register Asset</button>
        </form>
      </Modal>

      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title="Asset Details" width="700px">
        {showDetail && (
          <div>
            <div className="detail-grid">
              <div><strong>Asset Tag:</strong> {showDetail.asset?.assetTag}</div>
              <div><strong>Name:</strong> {showDetail.asset?.name}</div>
              <div><strong>Category:</strong> {showDetail.asset?.category?.name}</div>
              <div><strong>Serial Number:</strong> {showDetail.asset?.serialNumber || '-'}</div>
              <div><strong>Status:</strong> <span className={`badge status-${showDetail.asset?.status}`}>{showDetail.asset?.status?.replace('_', ' ')}</span></div>
              <div><strong>Condition:</strong> {showDetail.asset?.condition}</div>
              <div><strong>Location:</strong> {showDetail.asset?.location || '-'}</div>
              <div><strong>Acquisition Cost:</strong> ${showDetail.asset?.acquisitionCost || 0}</div>
              <div><strong>Bookable:</strong> {showDetail.asset?.isBookable ? 'Yes' : 'No'}</div>
              <div><strong>Current Holder:</strong> {showDetail.asset?.currentHolder?.name || '-'}</div>
            </div>
            <h4 style={{ marginTop: 20 }}>Allocation History</h4>
            <table className="table">
              <thead><tr><th>Employee</th><th>Allocated Date</th><th>Returned Date</th><th>Status</th></tr></thead>
              <tbody>
                {showDetail.history?.map(h => (
                  <tr key={h._id}>
                    <td>{h.employee?.name}</td>
                    <td>{new Date(h.allocatedDate).toLocaleDateString()}</td>
                    <td>{h.returnedDate ? new Date(h.returnedDate).toLocaleDateString() : '-'}</td>
                    <td><span className={`badge ${h.status}`}>{h.status}</span></td>
                  </tr>
                )) || <tr><td colSpan={4} className="text-center">No history</td></tr>}
              </tbody>
            </table>
            {showDetail.asset?.documents?.length > 0 && (
              <>
                <h4 style={{ marginTop: 20 }}>Documents</h4>
                <ul className="doc-list">
                  {showDetail.asset.documents.map((doc, i) => (
                    <li key={i}>
                      <a href={doc} target="_blank" rel="noopener noreferrer">Document {i + 1}</a>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AssetDirectory;
