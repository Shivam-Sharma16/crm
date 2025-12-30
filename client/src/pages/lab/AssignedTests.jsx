import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchLabRequests, uploadLabReport, clearLabErrors } from '../../store/slices/labSlice';
import { FaSearch, FaFilter, FaUserInjured, FaUserMd, FaVial, FaFileMedical, FaCloudUploadAlt, FaTimes, FaCheckCircle, FaCalendarAlt, FaNotesMedical } from 'react-icons/fa';
import './AssignedTests.css';

const AssignedTests = () => {
  const dispatch = useAppDispatch();
  const { requests, loading, error, uploadSuccess } = useAppSelector((state) => state.lab);
  
  // Local State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null); // For Modal
  const [notes, setNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    dispatch(fetchLabRequests('pending'));
  }, [dispatch]);

  useEffect(() => {
    if (uploadSuccess) {
        closeModal();
        const timer = setTimeout(() => dispatch(clearLabErrors()), 3000);
        return () => clearTimeout(timer);
    }
  }, [uploadSuccess, dispatch]);

  // --- Filtering ---
  const filteredRequests = requests.filter(req => 
    req.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.testNames?.some(test => test.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // --- Handlers ---
  const openModal = (request) => {
    setSelectedRequest(request);
    setNotes(request.notes || '');
    setSelectedFile(null);
  };

  const closeModal = () => {
    setSelectedRequest(null);
    setNotes('');
    setSelectedFile(null);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRequest || !selectedFile) return;

    const formData = new FormData();
    formData.append('reportFile', selectedFile);
    formData.append('notes', notes); // Appending notes to FormData

    await dispatch(uploadLabReport({ id: selectedRequest._id, formData }));
  };

  // --- Helper: Get Prescription ---
  const getDoctorPrescription = (appointment) => {
    if (!appointment) return null;
    if (appointment.prescriptions?.length > 0) {
        const docDocs = appointment.prescriptions.filter(p => p.type !== 'lab_report');
        if (docDocs.length > 0) return docDocs[docDocs.length - 1]; 
    }
    if (appointment.prescription) {
        return { url: appointment.prescription, name: 'Prescription File' };
    }
    return null;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="lab-page-container">
      {/* --- Header Section --- */}
      <header className="lab-header">
        <div className="header-title">
          <h1><FaVial className="header-icon"/> Lab Requests</h1>
          <p>Manage pending tests and upload diagnostic reports</p>
        </div>
        
        <div className="header-actions">
          <div className="search-box">
            <FaSearch className="search-icon"/>
            <input 
              type="text" 
              placeholder="Search patient or test..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-badge">
            <FaFilter /> {filteredRequests.length} Pending
          </div>
        </div>
      </header>

      {/* --- Status Messages --- */}
      {uploadSuccess && <div className="lab-alert success"><FaCheckCircle/> {uploadSuccess}</div>}
      {error && <div className="lab-alert error"><FaTimes/> {error}</div>}

      {/* --- Content Grid --- */}
      {loading && !selectedRequest ? (
         <div className="lab-loading"><div className="spinner"></div><p>Fetching requests...</p></div>
      ) : (
        <div className="lab-grid">
          {filteredRequests.length === 0 ? (
            <div className="lab-empty-state">
                <img src="https://cdn-icons-png.flaticon.com/512/7486/7486744.png" alt="No Tasks" />
                <h3>All Caught Up!</h3>
                <p>There are no pending lab tests assigned to you right now.</p>
            </div>
          ) : (
            filteredRequests.map((req) => {
                const prescription = getDoctorPrescription(req.appointmentId);
                return (
                    <div key={req._id} className="lab-card">
                        <div className="card-header">
                            <span className="patient-id">ID: #{req.patientId || 'N/A'}</span>
                            <span className="date-badge"><FaCalendarAlt/> {formatDate(req.appointmentId?.appointmentDate)}</span>
                        </div>
                        
                        <div className="card-body">
                            <div className="info-row">
                                <div className="info-group">
                                    <label><FaUserInjured/> Patient</label>
                                    <h4>{req.userId?.name}</h4>
                                    <span>{req.userId?.gender}, {req.userId?.age} yrs</span>
                                </div>
                                <div className="info-group">
                                    <label><FaUserMd/> Doctor</label>
                                    <h4>{req.doctorId?.name}</h4>
                                </div>
                            </div>

                            <div className="test-list">
                                <label>Prescribed Tests:</label>
                                <div className="tags">
                                    {req.testNames?.map((test, i) => (
                                        <span key={i} className="test-tag">{test}</span>
                                    ))}
                                </div>
                            </div>

                            {prescription && (
                                <a href={prescription.url} target="_blank" rel="noreferrer" className="prescription-link">
                                    <FaFileMedical/> View Prescription
                                </a>
                            )}
                        </div>

                        <div className="card-footer">
                            <button className="btn-process" onClick={() => openModal(req)}>
                                Process & Upload Report
                            </button>
                        </div>
                    </div>
                );
            })
          )}
        </div>
      )}

      {/* --- Upload Modal --- */}
      {selectedRequest && (
        <div className="lab-modal-overlay" onClick={closeModal}>
          <div className="lab-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Upload Lab Report</h2>
              <button className="close-btn" onClick={closeModal}><FaTimes/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="modal-content">
              {/* Summary Section */}
              <div className="modal-summary">
                <div className="summary-item">
                    <span>Patient:</span>
                    <strong>{selectedRequest.userId?.name}</strong>
                </div>
                <div className="summary-item">
                    <span>Tests:</span>
                    <strong>{selectedRequest.testNames?.join(', ')}</strong>
                </div>
              </div>

              {/* Input: Notes */}
              <div className="form-group">
                <label><FaNotesMedical/> Lab Technician Notes</label>
                <textarea 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)} 
                  placeholder="Enter observations, test result summaries, or internal notes..."
                  rows="3"
                ></textarea>
              </div>

              {/* Input: File Upload (Drag & Drop) */}
              <div className="form-group">
                <label><FaCloudUploadAlt/> Report File (PDF/Image)</label>
                <div 
                    className={`drop-zone ${dragActive ? 'active' : ''} ${selectedFile ? 'has-file' : ''}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <input 
                        type="file" 
                        id="report-file" 
                        accept=".pdf,.jpg,.png,.jpeg" 
                        onChange={handleFileChange}
                        hidden
                    />
                    
                    {selectedFile ? (
                        <div className="file-info">
                            <FaFileMedical className="file-icon"/>
                            <span>{selectedFile.name}</span>
                            <button type="button" onClick={() => setSelectedFile(null)} className="remove-file">Change</button>
                        </div>
                    ) : (
                        <div className="upload-prompt">
                            <FaCloudUploadAlt className="upload-icon-large"/>
                            <p>Drag & Drop file here or <label htmlFor="report-file">Browse</label></p>
                            <span>Supports PDF, JPG, PNG</span>
                        </div>
                    )}
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={closeModal}>Cancel</button>
                <button 
                    type="submit" 
                    className={`btn-submit ${loading ? 'loading' : ''}`}
                    disabled={!selectedFile || loading}
                >
                    {loading ? 'Uploading...' : 'Confirm Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignedTests;