import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import Modal from '../components/common/Modal';

const OrganizationSetup = () => {
  const [activeTab, setActiveTab] = useState('departments');
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);

  const [deptForm, setDeptForm] = useState({ name: '', description: '', head: '', parentDepartment: '', status: 'active' });
  const [catForm, setCatForm] = useState({ name: '', description: '', customFields: '{}', status: 'active' });
  const [editDeptId, setEditDeptId] = useState(null);
  const [editCatId, setEditCatId] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [deptRes, catRes, empRes] = await Promise.all([
        API.get('/departments'), API.get('/categories'), API.get('/employees')
      ]);
      setDepartments(deptRes.data);
      setCategories(catRes.data);
      setEmployees(empRes.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleDeptSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...deptForm };
      if (!payload.head) delete payload.head;
      if (!payload.parentDepartment) delete payload.parentDepartment;
      if (editDeptId) {
        await API.put(`/departments/${editDeptId}`, payload);
      } else {
        await API.post('/departments', payload);
      }
      setShowDeptModal(false);
      resetDeptForm();
      fetchData();
    } catch (err) { alert(err.response?.data?.message || 'Error saving department'); }
  };

  const handleCatSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...catForm, customFields: JSON.parse(catForm.customFields || '{}') };
      if (editCatId) {
        await API.put(`/categories/${editCatId}`, payload);
      } else {
        await API.post('/categories', payload);
      }
      setShowCatModal(false);
      setCatForm({ name: '', description: '', customFields: '{}', status: 'active' });
      fetchData();
    } catch (err) { alert(err.response?.data?.message || 'Error saving category'); }
  };

  const handleRoleChange = async (empId, role) => {
    try {
      await API.put(`/employees/${empId}/role`, { role });
      fetchData();
    } catch (err) { alert(err.response?.data?.message || 'Error updating role'); }
  };

  const handleStatusChange = async (empId, status) => {
    try {
      await API.put(`/employees/${empId}/status`, { status });
      fetchData();
    } catch (err) { alert(err.response?.data?.message || 'Error updating status'); }
  };

  const resetDeptForm = () => {
    setDeptForm({ name: '', description: '', head: '', parentDepartment: '', status: 'active' });
    setEditDeptId(null);
  };

  const editDept = (dept) => {
    setDeptForm({
      name: dept.name, description: dept.description || '',
      head: dept.head?._id || '', parentDepartment: dept.parentDepartment?._id || '',
      status: dept.status
    });
    setEditDeptId(dept._id);
    setShowDeptModal(true);
  };

  if (loading) return <div className="page-loading"><div className="spinner"></div></div>;

  return (
    <div className="page">
      <div className="page-header"><h1>Organization Setup</h1></div>
      <div className="tabs">
        <button className={`tab ${activeTab === 'departments' ? 'active' : ''}`} onClick={() => setActiveTab('departments')}>Departments</button>
        <button className={`tab ${activeTab === 'categories' ? 'active' : ''}`} onClick={() => setActiveTab('categories')}>Asset Categories</button>
        <button className={`tab ${activeTab === 'employees' ? 'active' : ''}`} onClick={() => setActiveTab('employees')}>Employee Directory</button>
      </div>

      <div className="tab-content">
        {activeTab === 'departments' && (
          <div>
            <button className="btn btn-primary" onClick={() => { resetDeptForm(); setShowDeptModal(true); }}>+ Add Department</button>
            <table className="table">
              <thead><tr><th>Name</th><th>Head</th><th>Parent</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {departments.map(d => (
                  <tr key={d._id}>
                    <td>{d.name}</td>
                    <td>{d.head?.name || '-'}</td>
                    <td>{d.parentDepartment?.name || '-'}</td>
                    <td><span className={`badge ${d.status}`}>{d.status}</span></td>
                    <td><button className="btn btn-sm" onClick={() => editDept(d)}>Edit</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'categories' && (
          <div>
            <button className="btn btn-primary" onClick={() => { setEditCatId(null); setCatForm({ name: '', description: '', customFields: '{}', status: 'active' }); setShowCatModal(true); }}>+ Add Category</button>
            <table className="table">
              <thead><tr><th>Name</th><th>Description</th><th>Custom Fields</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {categories.map(c => (
                  <tr key={c._id}>
                    <td>{c.name}</td>
                    <td>{c.description}</td>
                    <td>{Object.keys(c.customFields || {}).join(', ') || '-'}</td>
                    <td><span className={`badge ${c.status}`}>{c.status}</span></td>
                    <td>
                      <button className="btn btn-sm" onClick={() => {
                        setEditCatId(c._id);
                        setCatForm({ name: c.name, description: c.description || '', customFields: JSON.stringify(c.customFields || {}), status: c.status });
                        setShowCatModal(true);
                      }}>Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'employees' && (
          <div>
            <table className="table">
              <thead><tr><th>Name</th><th>Email</th><th>Department</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {employees.map(emp => (
                  <tr key={emp._id}>
                    <td>{emp.name}</td>
                    <td>{emp.email}</td>
                    <td>{emp.department?.name || '-'}</td>
                    <td><span className={`badge role-${emp.role}`}>{emp.role.replace('_', ' ')}</span></td>
                    <td>
                      <select value={emp.status} onChange={e => handleStatusChange(emp._id, e.target.value)}>
                        <option value="active">Active</option><option value="inactive">Inactive</option>
                      </select>
                    </td>
                    <td>
                      <select value={emp.role} onChange={e => handleRoleChange(emp._id, e.target.value)}>
                        <option value="employee">Employee</option>
                        <option value="department_head">Department Head</option>
                        <option value="asset_manager">Asset Manager</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={showDeptModal} onClose={() => setShowDeptModal(false)} title={editDeptId ? 'Edit Department' : 'Add Department'}>
        <form onSubmit={handleDeptSubmit}>
          <div className="form-group"><label>Name</label><input value={deptForm.name} onChange={e => setDeptForm({ ...deptForm, name: e.target.value })} required /></div>
          <div className="form-group"><label>Description</label><textarea value={deptForm.description} onChange={e => setDeptForm({ ...deptForm, description: e.target.value })}></textarea></div>
          <div className="form-group"><label>Department Head</label>
            <select value={deptForm.head} onChange={e => setDeptForm({ ...deptForm, head: e.target.value })}>
              <option value="">None</option>
              {employees.filter(e => e.status === 'active').map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Parent Department</label>
            <select value={deptForm.parentDepartment} onChange={e => setDeptForm({ ...deptForm, parentDepartment: e.target.value })}>
              <option value="">None</option>
              {departments.filter(d => d._id !== editDeptId).map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Status</label>
            <select value={deptForm.status} onChange={e => setDeptForm({ ...deptForm, status: e.target.value })}>
              <option value="active">Active</option><option value="inactive">Inactive</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary btn-block">{editDeptId ? 'Update' : 'Create'} Department</button>
        </form>
      </Modal>

      <Modal isOpen={showCatModal} onClose={() => setShowCatModal(false)} title={editCatId ? 'Edit Category' : 'Add Category'}>
        <form onSubmit={handleCatSubmit}>
          <div className="form-group"><label>Name</label><input value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })} required /></div>
          <div className="form-group"><label>Description</label><textarea value={catForm.description} onChange={e => setCatForm({ ...catForm, description: e.target.value })}></textarea></div>
          <div className="form-group"><label>Custom Fields (JSON)</label><textarea value={catForm.customFields} onChange={e => setCatForm({ ...catForm, customFields: e.target.value })} rows={3} /></div>
          <button type="submit" className="btn btn-primary btn-block">{editCatId ? 'Update' : 'Create'} Category</button>
        </form>
      </Modal>
    </div>
  );
};

export default OrganizationSetup;
