import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAuth, useDoctors } from '../../store/hooks';
import { fetchDoctorAppointments, cancelAppointment, updateAvailability } from '../../store/slices/doctorSlice';
import { logout } from '../../store/slices/authSlice';
import './Patient.css';

const Patient = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const { appointments, loading, error } = useDoctors();
  const [showAvailability, setShowAvailability] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'doctor') {
      navigate('/');
      return;
    }
    dispatch(fetchDoctorAppointments());
  }, [navigate, user, dispatch]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const handleRowClick = (appointmentId) => {
    navigate(`/doctor/patient/${appointmentId}`);
  };

  const handleCancel = (e, id) => {
    e.stopPropagation(); // Prevent row click
    if(window.confirm('Are you sure you want to cancel this appointment?')) {
      dispatch(cancelAppointment(id));
    }
  };

  // Sort: Date ASC, then Time ASC (Assuming HH:mm format)
  const sortedAppointments = [...appointments].sort((a, b) => {
    const dateA = new Date(a.appointmentDate).getTime();
    const dateB = new Date(b.appointmentDate).getTime();
    if (dateA !== dateB) return dateA - dateB;
    // Simple string compare for "HH:mm" works for 24h format
    return a.appointmentTime.localeCompare(b.appointmentTime);
  });

  return (
    <div className="patient-page">
      <div className="patient-container">
        <div className="patient-header">
          <div>
            <h1>Doctor Dashboard</h1>
            <p>Manage appointments and patient prescriptions</p>
          </div>
          <div className="patient-user-info">
             {/* Simple toggle for availability UI (implement full form in modal ideally) */}
            <button className="availability-btn" onClick={() => setShowAvailability(!showAvailability)}>
              {showAvailability ? 'Hide Schedule' : 'Set Availability'}
            </button>
            <span style={{margin: '0 10px'}}>Dr. {user?.name}</span>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
        </div>

        {/* Placeholder for Availability Form */}
        {showAvailability && (
          <div className="availability-panel">
            <h3>Update Working Hours</h3>
            <p><i>(Feature implementation: Create a form mapping days to start/end times and dispatch updateAvailability)</i></p>
            {/* Example Dispatch:
                dispatch(updateAvailability({
                    monday: { available: true, startTime: "09:00", endTime: "17:00" },
                    ...
                }))
            */}
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        <div className="appointments-card">
          <h2>Upcoming Appointments</h2>
          {loading ? (
            <div className="loading-message">Loading...</div>
          ) : sortedAppointments.length === 0 ? (
            <div className="empty-message">No appointments found</div>
          ) : (
            <div className="appointments-table">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Patient</th>
                    <th>Service</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedAppointments.map((app) => (
                    <tr 
                        key={app._id} 
                        onClick={() => handleRowClick(app._id)}
                        className="clickable-row"
                    >
                      <td>{new Date(app.appointmentDate).toLocaleDateString()}</td>
                      <td>{app.appointmentTime}</td>
                      <td>{app.userId?.name || 'N/A'}</td>
                      <td>{app.serviceName}</td>
                      <td>
                        <span className={`status-badge ${app.status}`}>{app.status}</span>
                      </td>
                      <td>
                        {app.status === 'pending' || app.status === 'confirmed' ? (
                          <button 
                            className="cancel-btn"
                            onClick={(e) => handleCancel(e, app._id)}
                          >
                            Cancel
                          </button>
                        ) : '-'}
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