import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAuth, useDoctors } from '../../store/hooks';
import { fetchDoctorAppointments } from '../../store/slices/doctorSlice';
import { logout } from '../../store/slices/authSlice';
import './Patient.css';

const Patient = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const { appointments, loading, error } = useDoctors();

  useEffect(() => {
    // Check if user is doctor
    if (!user || user.role !== 'doctor') {
      navigate('/');
      return;
    }
    // Fetch appointments using Redux
    dispatch(fetchDoctorAppointments());
  }, [navigate, user, dispatch]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'confirmed':
        return 'status-confirmed';
      case 'completed':
        return 'status-completed';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return 'status-pending';
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="patient-page">
      <div className="patient-container">
        {/* Header */}
        <div className="patient-header">
          <div>
            <h1>My Patients</h1>
            <p>View all appointments and patient information</p>
          </div>
          <div className="patient-user-info">
            <span>Welcome, Dr. {user.name}</span>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Appointments List */}
        <div className="appointments-card">
          <h2>Appointments</h2>
          {loading ? (
            <div className="loading-message">Loading appointments...</div>
          ) : appointments.length === 0 ? (
            <div className="empty-message">No appointments found</div>
          ) : (
            <div className="appointments-table">
              <table>
                <thead>
                  <tr>
                    <th>Patient Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Service</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((appointment) => (
                    <tr key={appointment._id || appointment.id}>
                      <td>
                        {appointment.userId?.name || 'N/A'}
                      </td>
                      <td>{appointment.userId?.email || 'N/A'}</td>
                      <td>{appointment.userId?.phone || '-'}</td>
                      <td>{appointment.serviceName || 'N/A'}</td>
                      <td>{formatDate(appointment.appointmentDate)}</td>
                      <td>{appointment.appointmentTime}</td>
                      <td>
                        <span className={`status-badge ${getStatusBadgeClass(appointment.status)}`}>
                          {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Patient;


