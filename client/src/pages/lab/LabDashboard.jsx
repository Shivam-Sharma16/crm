import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../store/hooks';
import '../user/Dashboard.css'; // Reuse existing theme

const LabDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ pending: 0, completed: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Mock data fetching - Replace with actual API call to /api/lab/stats
  useEffect(() => {
    // Simulate API delay
    setTimeout(() => {
        setStats({ pending: 12, completed: 45, total: 57 });
        setIsLoading(false);
    }, 800);
  }, []);

  if (isLoading) return <div className="loading-state"><div className="loading-spinner"></div><p>Loading Lab Dashboard...</p></div>;

  return (
    <div className="dashboard-page">
      <div className="content-wrapper">
        
        {/* Header */}
        <section className="dashboard-header animate-on-scroll slide-up">
          <div className="header-content">
            <span className="badge">Lab Portal</span>
            <h1>Hello, <span className="text-gradient">{user?.name || 'Lab Technician'}</span></h1>
            <p className="header-subtext">Manage test requests, upload reports, and view history.</p>
          </div>
        </section>

        {/* Stats Grid */}
        <div className="dashboard-grid">
            
            {/* Pending Requests */}
            <div className="dashboard-column animate-on-scroll slide-up delay-100">
              <div className="column-header">
                <div className="column-icon">🧪</div>
                <div>
                  <h2>Pending</h2>
                  <p className="column-count">{stats.pending} Requests</p>
                </div>
              </div>
              <div className="column-content">
                <div className="empty-state-small">
                    <p>You have {stats.pending} samples waiting for analysis.</p>
                </div>
              </div>
              <div className="column-footer">
                <Link to="/lab/assigned-tests" className="view-all-link">View Pending Tests →</Link>
              </div>
            </div>

            {/* Completed Reports */}
            <div className="dashboard-column animate-on-scroll slide-up delay-200">
              <div className="column-header">
                  <div className="column-icon">📋</div>
                  <div>
                    <h2>Completed</h2>
                    <p className="column-count">{stats.completed} Reports</p>
                  </div>
              </div>
              <div className="column-content">
                <div className="empty-state-small">
                    <p>{stats.completed} reports delivered successfully.</p>
                </div>
              </div>
              <div className="column-footer">
                <Link to="/lab/completed-reports" className="view-all-link">View History →</Link>
              </div>
            </div>

            {/* Profile / Settings */}
            <div className="dashboard-column animate-on-scroll slide-up delay-300">
               <div className="column-header">
                  <div className="column-icon">⚙️</div>
                  <div><h2>Settings</h2><p className="column-count">Profile & Config</p></div>
              </div>
              <div className="column-content">
                  <div className="item-details" style={{padding: '10px'}}>
                      <p><strong>Lab Name:</strong> {user?.name}</p>
                      <p><strong>Email:</strong> {user?.email}</p>
                      <p><strong>Status:</strong> <span className="status-badge status-confirmed">Active</span></p>
                  </div>
              </div>
              <div className="column-footer">
                <Link to="/lab/profile" className="view-all-link">Manage Profile →</Link>
              </div>
            </div>

          </div>
      </div>
    </div>
  );
};

export default LabDashboard;