import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchLabRequests, uploadLabReport, clearLabErrors } from '../../store/slices/labSlice';
import '../user/Dashboard.css';

const AssignedTests = () => {
  const dispatch = useAppDispatch();
  const { requests, loading, error, uploadSuccess } = useAppSelector((state) => state.lab);
  const [uploadingId, setUploadingId] = useState(null);

  useEffect(() => {
    dispatch(fetchLabRequests('pending'));
  }, [dispatch]);

  // Auto-clear success message after 3 seconds
  useEffect(() => {
    if (uploadSuccess) {
        const timer = setTimeout(() => dispatch(clearLabErrors()), 3000);
        return () => clearTimeout(timer);
    }
  }, [uploadSuccess, dispatch]);

  const handleFileUpload = async (e, reportId) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingId(reportId);
    const formData = new FormData();
    formData.append('reportFile', file);

    await dispatch(uploadLabReport({ id: reportId, formData }));
    setUploadingId(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="dashboard-page">
      <div className="content-wrapper">
        <section className="dashboard-header">
          <div className="header-content">
            <span className="badge">Work Queue</span>
            <h1>Assigned Tests</h1>
            {uploadSuccess && <div className="status-badge status-confirmed" style={{marginTop:'10px', display:'inline-block'}}>{uploadSuccess}</div>}
            {error && <div className="status-badge status-cancelled" style={{marginTop:'10px', display:'inline-block'}}>{error}</div>}
          </div>
        </section>

        {loading && !uploadingId ? (
           <div className="loading-state"><div className="loading-spinner"></div><p>Loading requests...</p></div>
        ) : (
          <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
            {requests.length === 0 ? (
                <div className="empty-state-small" style={{gridColumn: '1/-1'}}>
                    <div className="empty-icon">✓</div>
                    <p>No pending tests found. Good job!</p>
                </div>
            ) : (
                requests.map((req) => (
                <div key={req._id} className="dashboard-item animate-on-scroll slide-up">
                    <div className="item-header">
                        <span className="item-id">Patient: {req.userId?.name || 'Unknown'}</span>
                        <span className="status-badge status-pending">Pending</span>
                    </div>
                    
                    <div className="item-body">
                        <div className="item-details">
                            <p><strong>Tests:</strong> {req.testNames?.join(', ')}</p>
                            <p><strong>Doctor:</strong> {req.doctorId?.name}</p>
                            <p><strong>Date:</strong> {formatDate(req.appointmentId?.appointmentDate)}</p>
                            <p><strong>Patient Info:</strong> {req.userId?.gender || '-'}, {req.userId?.age || '-'} yrs</p>
                        </div>
                        
                        <div className="action-area" style={{marginTop: '15px'}}>
                            {uploadingId === req._id ? (
                                <button className="auth-button" disabled>Uploading...</button>
                            ) : (
                                <>
                                    <input
                                        type="file"
                                        id={`file-${req._id}`}
                                        style={{ display: 'none' }}
                                        onChange={(e) => handleFileUpload(e, req._id)}
                                        accept=".pdf,.jpg,.jpeg,.png"
                                    />
                                    <label htmlFor={`file-${req._id}`} className="view-presc-btn" style={{cursor: 'pointer', display: 'block', textAlign:'center'}}>
                                        📤 Upload Report
                                    </label>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignedTests;