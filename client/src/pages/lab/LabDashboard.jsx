import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector, useAuth } from '../../store/hooks';
import { fetchLabStats } from '../../store/slices/labSlice';
import '../user/Dashboard.css'; // Reuse user dashboard theme

const LabDashboard = () => {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const { stats, loading } = useAppSelector((state) => state.lab);

  useEffect(() => {
    dispatch(fetchLabStats());
  }, [dispatch]);

  if (loading && !stats.total) return <div className="loading-state"><div className="loading-spinner"></div><p>Loading Lab Stats...</p></div>;

  return (
    <div className="dashboard-page">
      <div className="content-wrapper">
        
        <section className="dashboard-header animate-on-scroll slide-up">
          <div className="header-content">
            <span className="badge">Lab Portal</span>
            <h1>Welcome, <span className="text-gradient">{user?.name || 'Technician'}</span></h1>
            <p className="header-subtext">Manage test requests and upload reports.</p>
          </div>
        </section>

        <div className="dashboard-grid">
            
            {/* Pending Requests */}
            <div className="dashboard-column animate-on-scroll slide-up delay-100">
              <div className="column-header">
                <div className="column-icon">🧪</div>
                <div>
                  <h2>Pending Tests</h2>
                  <p className="column-count">{stats.pending} To Do</p>
                </div>
              </div>
              <div className="column-content">
                <div className="empty-state-small">
                    <p>You have {stats.pending} assigned tests waiting for results.</p>
                </div>
              </div>
              <div className="column-footer">
                <Link to="/lab/assigned-tests" className="view-all-link">View Pending Requests →</Link>
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
                    <p>{stats.completed} reports delivered.</p>
                </div>
              </div>
              <div className="column-footer">
                <Link to="/lab/completed-reports" className="view-all-link">View History →</Link>
              </div>
            </div>

            {/* Total Stats */}
            <div className="dashboard-column animate-on-scroll slide-up delay-300">
               <div className="column-header">
                  <div className="column-icon">📊</div>
                  <div><h2>Total</h2><p className="column-count">{stats.total} Assignments</p></div>
              </div>
              <div className="column-content">
                  <div className="item-details" style={{padding: '10px'}}>
                      <p><strong>Lab Name:</strong> {user?.name}</p>
                      <p><strong>Email:</strong> {user?.email}</p>
                      <p><strong>Status:</strong> <span className="status-badge status-confirmed">Active</span></p>
                  </div>
              </div>
            </div>

          </div>
      </div>
    </div>
  );
};

export default LabDashboard;