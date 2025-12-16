import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useDoctors } from '../../store/hooks';
import { updatePrescription } from '../../store/slices/doctorSlice';
import './Patient.css';

const DoctorPatientDetails = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { appointments } = useDoctors();
  
  const appointment = appointments.find(a => a._id === appointmentId);
  
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [notes, setNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (appointment) {
      setNotes(appointment.notes || '');
    }
  }, [appointment]);

  // Handle File Selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Create local preview URL
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreview(objectUrl);
    }
  };

  const handleSave = async () => {
    if (!file && !notes) {
      alert("Please upload a file or add notes.");
      return;
    }

    setIsUploading(true);
    
    // Create FormData object
    const formData = new FormData();
    if (file) {
      formData.append('prescriptionFile', file);
    }
    formData.append('diagnosis', notes);
    formData.append('status', 'completed');

    try {
      await dispatch(updatePrescription({ 
        appointmentId, 
        formData 
      })).unwrap();
      
      alert('Prescription uploaded successfully!');
      navigate('/doctor/patients');
    } catch (err) {
      alert('Failed to upload: ' + err);
    } finally {
      setIsUploading(false);
    }
  };

  if (!appointment) return <div className="patient-container">Appointment not found.</div>;

  const isPdf = (url) => url?.toLowerCase().endsWith('.pdf');

  return (
    <div className="patient-page">
      <div className="patient-container">
        <button onClick={() => navigate('/doctor/patients')} className="back-button">← Back to List</button>
        
        <div className="auth-card" style={{maxWidth: '800px', margin: '20px auto'}}>
            <h1>Patient Consultation</h1>
            
            <div className="patient-info-grid">
                <div><strong>Patient:</strong> {appointment.userId?.name}</div>
                <div><strong>Email:</strong> {appointment.userId?.email}</div>
                <div><strong>Service:</strong> {appointment.serviceName}</div>
                <div><strong>Date:</strong> {new Date(appointment.appointmentDate).toDateString()}</div>
            </div>

            {/* Existing Prescription View */}
            {appointment.prescription && (
              <div className="existing-prescription" style={{marginTop: '20px', padding: '10px', background: '#f5f5f5'}}>
                <h4>Current Prescription:</h4>
                {isPdf(appointment.prescription) ? (
                  <a href={appointment.prescription} target="_blank" rel="noopener noreferrer" className="view-pdf-btn">
                    📄 View Prescription PDF
                  </a>
                ) : (
                  <img src={appointment.prescription} alt="Prescription" style={{maxWidth: '100%', maxHeight: '400px'}} />
                )}
              </div>
            )}

            <hr style={{margin: '20px 0'}} />

            {/* Upload Section */}
            <div className="form-group">
                <label>Upload Prescription (Image or PDF)</label>
                <input 
                  type="file" 
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  style={{padding: '10px 0'}}
                />
            </div>

            {/* File Preview */}
            {preview && file && !file.type.includes('pdf') && (
              <div className="preview-container" style={{marginBottom: '15px'}}>
                <p>Preview:</p>
                <img src={preview} alt="Preview" style={{maxWidth: '200px', border: '1px solid #ddd'}} />
              </div>
            )}

            <div className="form-group">
                <label>Diagnosis / Additional Notes</label>
                <textarea 
                    rows="4"
                    style={{width: '100%', padding: '10px'}}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter diagnosis notes (optional)..."
                />
            </div>

            <button 
              onClick={handleSave} 
              className="auth-button"
              disabled={isUploading}
              style={{opacity: isUploading ? 0.7 : 1}}
            >
              {isUploading ? 'Uploading & Saving...' : 'Save Prescription & Complete'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default DoctorPatientDetails;