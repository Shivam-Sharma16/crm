import React, { useEffect, useState } from 'react';
import './Appointment.css';

const Appointment = () => {
  // Fix body styles for full width on mount
  useEffect(() => {
    const originalBodyDisplay = document.body.style.display;
    const originalBodyPlaceItems = document.body.style.placeItems;
    
    // Override body flex centering to allow full width
    document.body.style.display = 'block';
    document.body.style.placeItems = 'unset';
    document.body.style.width = '100%';
    document.body.style.maxWidth = '100vw';
    
    // Cleanup on unmount
    return () => {
      document.body.style.display = originalBodyDisplay;
      document.body.style.placeItems = originalBodyPlaceItems;
      document.body.style.width = '';
      document.body.style.maxWidth = '';
    };
  }, []);

  // Mock Data for demonstration
  const [upcoming] = useState([
    {
      id: 1,
      doctor: "Dr. Sarah Jenkins",
      department: "Cardiology",
      date: "Oct 24, 2025",
      time: "10:30 AM",
      status: "Scheduled",
      imgPlaceholder: "SJ"
    },
    {
      id: 2,
      doctor: "Dr. Mark Collins",
      department: "Neurology",
      date: "Oct 28, 2025",
      time: "02:15 PM",
      status: "Pending",
      imgPlaceholder: "MC"
    }
  ]);

  const [past] = useState([
    {
      id: 3,
      doctor: "Dr. Emily Dao",
      department: "Pediatrics",
      date: "Sep 15, 2025",
      time: "09:00 AM",
      status: "Completed",
      imgPlaceholder: "ED"
    },
    {
      id: 4,
      doctor: "Dr. Alex Cameron",
      department: "Orthopedics",
      date: "Aug 10, 2025",
      time: "11:45 AM",
      status: "Cancelled",
      imgPlaceholder: "AC"
    },
    {
      id: 5,
      doctor: "Dr. Sarah Jenkins",
      department: "Cardiology",
      date: "Jul 22, 2025",
      time: "04:00 PM",
      status: "Completed",
      imgPlaceholder: "SJ"
    }
  ]);

  // Helper to determine status badge styling
  const getStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case 'scheduled': return 'status-scheduled';
      case 'pending': return 'status-pending';
      case 'completed': return 'status-completed';
      case 'cancelled': return 'status-cancelled';
      default: return '';
    }
  };

  return (
    <div className="appointment-page">
      
      {/* Header Section */}
      <header className="page-header animate-slide-down">
        <div className="header-text">
          <h1>My Appointments</h1>
          <p>Manage your upcoming schedules and view past history.</p>
        </div>
        <button className="btn-new-appointment">
          <span className="plus-icon">+</span> Book New Appointment
        </button>
      </header>

      {/* Upcoming Section */}
      <section className="appointment-section">
        <h2 className="section-title animate-fade-in">
          <span className="icon-wrapper">📅</span> Upcoming Schedule
        </h2>
        
        <div className="appointments-grid">
          {upcoming.map((appt, index) => (
            <div 
              key={appt.id} 
              className="appt-card animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="card-status-bar"></div>
              <div className="card-header">
                <div className="doctor-avatar">{appt.imgPlaceholder}</div>
                <div className="doctor-info">
                  <h3>{appt.doctor}</h3>
                  <span className="department">{appt.department}</span>
                </div>
                <span className={`status-badge ${getStatusClass(appt.status)}`}>
                  {appt.status}
                </span>
              </div>
              
              <div className="card-body">
                <div className="info-row">
                  <span className="label">Date</span>
                  <span className="value">{appt.date}</span>
                </div>
                <div className="info-row">
                  <span className="label">Time</span>
                  <span className="value">{appt.time}</span>
                </div>
              </div>

              <div className="card-footer">
                <button className="btn-text">Reschedule</button>
                <button className="btn-outline-sm">View Details</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="section-divider animate-width"></div>

      {/* Past Section */}
      <section className="appointment-section">
        <h2 className="section-title animate-fade-in delay-300">
          <span className="icon-wrapper">history</span> Past History
        </h2>

        <div className="appointments-grid">
          {past.map((appt, index) => (
            <div 
              key={appt.id} 
              className="appt-card animate-slide-up"
              style={{ animationDelay: `${(index + upcoming.length) * 100}ms` }}
            >
              <div className="card-header">
                <div className="doctor-avatar plain">{appt.imgPlaceholder}</div>
                <div className="doctor-info">
                  <h3>{appt.doctor}</h3>
                  <span className="department">{appt.department}</span>
                </div>
                <span className={`status-badge ${getStatusClass(appt.status)}`}>
                  {appt.status}
                </span>
              </div>

              <div className="card-body">
                <div className="info-row">
                  <span className="label">Date</span>
                  <span className="value">{appt.date}</span>
                </div>
                <div className="info-row">
                  <span className="label">Time</span>
                  <span className="value">{appt.time}</span>
                </div>
              </div>

              <div className="card-footer">
                <button className="btn-outline-sm full-width">View Summary</button>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};

export default Appointment;