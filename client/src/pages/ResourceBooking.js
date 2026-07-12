import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import Modal from '../components/common/Modal';

const ResourceBooking = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [form, setForm] = useState({ resource: '', date: selectedDate, startTime: '', endTime: '', purpose: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [bookRes, assetRes] = await Promise.all([
        API.get('/bookings'),
        API.get('/assets', { params: { isBookable: 'true' } })
      ]);
      setBookings(bookRes.data);
      setResources(assetRes.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => {
    API.get('/bookings', { params: { date: selectedDate } })
      .then(({ data }) => setBookings(data))
      .catch(() => {});
  }, [selectedDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await API.post('/bookings', { ...form, date: selectedDate });
      setShowModal(false);
      setForm({ resource: '', date: selectedDate, startTime: '', endTime: '', purpose: '' });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed');
    }
  };

  const handleCancel = async (id) => {
    try {
      await API.put(`/bookings/${id}`, { status: 'cancelled' });
      fetchData();
    } catch (err) { alert('Error cancelling booking'); }
  };

  const dayBookings = bookings.filter(b => {
    const bDate = new Date(b.date).toISOString().split('T')[0];
    return bDate === selectedDate;
  });

  if (loading) return <div className="page-loading"><div className="spinner"></div></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Resource Booking</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Booking</button>
      </div>

      <div className="filters-bar">
        <label>Date:</label>
        <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="card-header"><h3>Bookings for {selectedDate}</h3></div>
        <div className="card-body">
          {dayBookings.length === 0 ? (
            <p className="text-muted">No bookings for this date</p>
          ) : (
            <div className="booking-timeline">
              {dayBookings.map(b => (
                <div key={b._id} className={`booking-card status-${b.status}`}>
                  <div className="booking-time">{b.startTime} - {b.endTime}</div>
                  <div className="booking-info">
                    <strong>{b.resource?.name}</strong>
                    <span className="text-muted"> by {b.booker?.name}</span>
                    {b.purpose && <div className="text-muted">{b.purpose}</div>}
                  </div>
                  <div className="booking-actions">
                    <span className={`badge ${b.status}`}>{b.status}</span>
                    {b.status !== 'cancelled' && b.status !== 'completed' && (
                      (user?._id === b.booker?._id || user?.role === 'admin' || user?.role === 'department_head') && (
                        <button className="btn btn-sm btn-danger" onClick={() => handleCancel(b._id)}>Cancel</button>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3>All Resources</h3></div>
        <div className="card-body">
          <div className="resource-grid">
            {resources.map(r => (
              <div key={r._id} className="resource-card">
                <h4>{r.name}</h4>
                <p className="text-muted">{r.assetTag} | {r.location || 'No location'}</p>
                <button className="btn btn-sm btn-primary" onClick={() => {
                  setForm({ resource: r._id, date: selectedDate, startTime: '', endTime: '', purpose: '' });
                  setShowModal(true);
                }}>Book Now</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Booking" width="450px">
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label>Resource *</label>
            <select value={form.resource} onChange={e => setForm({ ...form, resource: e.target.value })} required>
              <option value="">Select resource</option>
              {resources.map(r => <option key={r._id} value={r._id}>{r.name} ({r.assetTag})</option>)}
            </select>
          </div>
          <div className="form-group"><label>Date</label><input type="date" value={selectedDate} disabled /></div>
          <div className="form-row">
            <div className="form-group"><label>Start Time *</label><input type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} required /></div>
            <div className="form-group"><label>End Time *</label><input type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} required /></div>
          </div>
          <div className="form-group"><label>Purpose</label><textarea value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })}></textarea></div>
          <button type="submit" className="btn btn-primary btn-block">Confirm Booking</button>
        </form>
      </Modal>
    </div>
  );
};

export default ResourceBooking;
