import React, { useState, useEffect } from 'react';
import { receptionAPI } from '../../utils/api';
import './ReceptionDashboard.css';

const ReceptionDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Reschedule Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [rescheduleError, setRescheduleError] = useState('');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await receptionAPI.getAllAppointments();
      if (response.success) {
        setAppointments(response.appointments);
      } else {
        setError('Failed to load appointments.');
      }
    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
      // More friendly error message
      if (err.response?.status === 404) {
        setError('Error: Reception API not found. Please check backend routes.');
      } else if (err.response?.status === 403) {
        setError('Access Denied: You do not have permission to view these appointments.');
      } else {
        setError('Failed to fetch appointments. Server may be down.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        await receptionAPI.cancelAppointment(id);
        fetchAppointments(); // Refresh list to show updated status
      } catch (err) {
        alert(err.response?.data?.message || 'Error cancelling appointment');
      }
    }
  };

  const openRescheduleModal = (apt) => {
    setSelectedAppointment(apt);
    // Format date for HTML input (YYYY-MM-DD)
    const dateStr = new Date(apt.appointmentDate).toISOString().split('T')[0];
    setNewDate(dateStr);
    setNewTime(apt.appointmentTime);
    setShowModal(true);
    setRescheduleError('');
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    setRescheduleError('');
    
    try {
      await receptionAPI.rescheduleAppointment(selectedAppointment._id, newDate, newTime);
      setShowModal(false);
      setSelectedAppointment(null);
      fetchAppointments();
      alert('Appointment rescheduled successfully');
    } catch (err) {
      setRescheduleError(err.response?.data?.message || 'Failed to reschedule');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading && appointments.length === 0) {
    return <div className="reception-loading">Loading appointments...</div>;
  }

  return (
    <div className="reception-dashboard">
      <div className="dashboard-header">
        <h1>Reception Dashboard</h1>
        <button className="refresh-btn" onClick={fetchAppointments}>
            {loading ? 'Refreshing...' : '🔄 Refresh'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="table-container">
        <table className="reception-table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>ID</th>
              <th>Doctor</th>
              <th>Service</th>
              <th>Date</th>
              <th>Time</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.length > 0 ? (
              appointments.map((apt) => (
                <tr key={apt._id} className={`status-${apt.status}`}>
                  <td>
                      <div className="patient-name">{apt.userId?.name || 'Unknown'}</div>
                      <div className="patient-contact">{apt.userId?.phone || '-'}</div>
                  </td>
                  <td>{apt.userId?.patientId || '-'}</td>
                  <td>{apt.doctorName || apt.doctorId?.name || 'Unknown'}</td>
                  <td>{apt.serviceName}</td>
                  <td>{formatDate(apt.appointmentDate)}</td>
                  <td>{apt.appointmentTime}</td>
                  <td>
                    <span className={`status-badge ${apt.status}`}>
                      {apt.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                          <>
                              <button 
                                  className="btn-reschedule"
                                  onClick={() => openRescheduleModal(apt)}
                              >
                                  Reschedule
                              </button>
                              <button 
                                  className="btn-cancel"
                                  onClick={() => handleCancel(apt._id)}
                              >
                                  Cancel
                              </button>
                          </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
                !loading && (
                    <tr>
                        <td colSpan="8" className="no-data">No appointments found.</td>
                    </tr>
                )
            )}
          </tbody>
        </table>
      </div>

      {/* Reschedule Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Reschedule Appointment</h2>
            <p className="modal-subtitle">
                For <strong>{selectedAppointment?.userId?.name}</strong> with Dr. <strong>{selectedAppointment?.doctorName}</strong>
            </p>
            
            {rescheduleError && <div className="modal-error">{rescheduleError}</div>}
            
            <form onSubmit={handleRescheduleSubmit}>
              <div className="form-group">
                <label>New Date</label>
                <input 
                  type="date" 
                  value={newDate} 
                  onChange={(e) => setNewDate(e.target.value)} 
                  required
                />
              </div>
              <div className="form-group">
                <label>New Time</label>
                <input 
                  type="time" 
                  value={newTime} 
                  onChange={(e) => setNewTime(e.target.value)} 
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn-confirm">Confirm Reschedule</button>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowModal(false)}
                >
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceptionDashboard;