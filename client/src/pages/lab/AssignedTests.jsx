// client/src/pages/lab/AssignedTests.jsx
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

  // --- HELPER: Extract Prescription Link ---
  const getDoctorPrescription = (appointment) => {
    if (!appointment) return null;
    
    // 1. Check modern 'prescriptions' array (exclude lab reports)
    if (appointment.prescriptions && appointment.prescriptions.length > 0) {
        // Find documents that are NOT lab reports (so they are from doctor)
        const docDocs = appointment.prescriptions.filter(p => p.type !== 'lab_report');
        if (docDocs.length > 0) {
            // Return the most recent one
            return docDocs[docDocs.length - 1]; 
        }
    }
    
    // 2. Fallback to legacy string field
    if (appointment.prescription) {
        return { url: appointment.prescription, name: 'Prescription File' };
    }
    
    return null;
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
                requests.map((req) => {
                    // Extract prescription using helper
                    const docPrescription = getDoctorPrescription(req.appointmentId);
                    
                    return (
                        <div key={req._id} className="dashboard-item animate-on-scroll slide-up">
                            <div className="item-header">
                                <span className="item-id">Patient: {req.userId?.name || 'Unknown'}</span>
                                <span className="status-badge status-pending">Pending</span>
                            </div>
                            
                            <div className="item-body">
                                <div className="item-details">
                                    <p><strong>Tests:</strong> <span style={{color: '#d97706', fontWeight: 'bold'}}>{req.testNames?.join(', ')}</span></p>
                                    <p><strong>Doctor:</strong> {req.doctorId?.name}</p>
                                    <p><strong>Date:</strong> {formatDate(req.appointmentId?.appointmentDate)}</p>
                                    <p><strong>Patient Info:</strong> {req.userId?.gender || '-'}, {req.userId?.age || '-'} yrs</p>
                                    
                                    {/* --- RENDER PRESCRIPTION LINK --- */}
                                    {docPrescription ? (
                                        <div style={{
                                            marginTop: '12px', 
                                            padding: '10px', 
                                            background: '#f0f9ff', 
                                            borderRadius: '8px', 
                                            border: '1px solid #bae6fd'
                                        }}>
                                            <p style={{margin: '0 0 5px 0', fontSize: '0.8rem', color: '#0284c7', fontWeight: '600'}}>
                                                Doctor's Prescription:
                                            </p>
                                            <a 
                                                href={docPrescription.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                style={{
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    gap: '8px', 
                                                    textDecoration: 'none', 
                                                    color: '#0369a1', 
                                                    fontWeight: '500', 
                                                    fontSize: '0.9rem'
                                                }}
                                            >
                                                <span style={{fontSize: '1.2rem'}}>📄</span> 
                                                <span style={{textDecoration: 'underline'}}>{docPrescription.name || 'View Document'}</span>
                                            </a>
                                        </div>
                                    ) : (
                                        <div style={{marginTop: '10px', fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic'}}>
                                            No prescription file attached
                                        </div>
                                    )}
                                </div>
                                
                                <div className="action-area" style={{marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee'}}>
                                    {uploadingId === req._id ? (
                                        <button className="auth-button" style={{width: '100%', opacity: 0.7}} disabled>Uploading...</button>
                                    ) : (
                                        <>
                                            <input
                                                type="file"
                                                id={`file-${req._id}`}
                                                style={{ display: 'none' }}
                                                onChange={(e) => handleFileUpload(e, req._id)}
                                                accept=".pdf,.jpg,.jpeg,.png"
                                            />
                                            <label 
                                                htmlFor={`file-${req._id}`} 
                                                className="view-presc-btn" 
                                                style={{
                                                    cursor: 'pointer', 
                                                    display: 'block', 
                                                    textAlign:'center', 
                                                    background: '#14C38E', 
                                                    color: 'white', 
                                                    border: 'none',
                                                    padding: '10px'
                                                }}
                                            >
                                                📤 Upload Results
                                            </label>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignedTests;