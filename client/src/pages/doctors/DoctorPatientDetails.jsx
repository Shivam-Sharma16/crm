import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useDoctors } from '../../store/hooks';
import { updatePrescription, deletePrescription } from '../../store/slices/doctorSlice';
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

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
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
    const formData = new FormData();
    if (file) formData.append('prescriptionFile', file);
    formData.append('diagnosis', notes);
    formData.append('status', 'completed');

    try {
      await dispatch(updatePrescription({ appointmentId, formData })).unwrap();
      alert('Updated successfully!');
      setFile(null);
      setPreview(null);
    } catch (err) {
      alert('Failed to update: ' + err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePrescription = async (prescriptionId) => {
      if(!window.confirm("Are you sure you want to delete this prescription?")) return;
      
      try {
          await dispatch(deletePrescription({ appointmentId, prescriptionId })).unwrap();
          alert("Prescription removed.");
      } catch (err) {
          alert("Failed to remove: " + err);
      }
  };

  if (!appointment) return <div className="patient-container">Appointment not found.</div>;

  const isPdf = (url) => url?.toLowerCase().endsWith('.pdf');

  // Helper to get prescriptions list (handling legacy data + new array)
  const getPrescriptionsList = () => {
      if (appointment.prescriptions && appointment.prescriptions.length > 0) {
          return appointment.prescriptions;
      }
      // Fallback for old data structure
      if (appointment.prescription) {
          return [{ _id: 'legacy', url: appointment.prescription, name: 'Previous Prescription' }];
      }
      return [];
  };

  const prescriptionsList = getPrescriptionsList();

  return (
    <div className="patient-page">
      <div className="patient-container">
        <button onClick={() => navigate('/doctor/patients')} className="back-button">← Back to List</button>
        
        <div className="auth-card" style={{maxWidth: '800px', margin: '20px auto'}}>
            <h1>Patient Consultation</h1>
            
            <div className="patient-info-grid">
                <div><strong>Patient:</strong> {appointment.userId?.name}</div>
                <div><strong>Service:</strong> {appointment.serviceName}</div>
                <div><strong>Date:</strong> {new Date(appointment.appointmentDate).toDateString()}</div>
            </div>

            <hr style={{margin: '20px 0'}} />

            {/* Prescriptions List */}
            <div className="prescriptions-section">
                <h3>Prescriptions</h3>
                {prescriptionsList.length === 0 ? (
                    <p style={{color: '#666', fontStyle: 'italic'}}>No prescriptions uploaded yet.</p>
                ) : (
                    <div className="prescriptions-list" style={{display: 'flex', flexWrap: 'wrap', gap: '15px'}}>
                        {prescriptionsList.map((item, index) => (
                            <div key={item._id || index} className="prescription-item" style={{border: '1px solid #ddd', padding: '10px', borderRadius: '8px', width: '200px'}}>
                                {isPdf(item.url) ? (
                                    <div className="pdf-icon" style={{fontSize: '40px', textAlign: 'center'}}>📄</div>
                                ) : (
                                    <a href={item.url} target="_blank" rel="noopener noreferrer">
                                        <img src={item.url} alt="Prescription" style={{width: '100%', height: '150px', objectFit: 'cover', borderRadius: '4px'}} />
                                    </a>
                                )}
                                
                                <div style={{marginTop: '10px', fontSize: '12px'}}>
                                    <div style={{fontWeight: 'bold', marginBottom: '5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                                        {item.name || 'Prescription'}
                                    </div>
                                    <div style={{display: 'flex', justifyContent: 'space-between', gap: '5px'}}>
                                        <a href={item.url} target="_blank" rel="noopener noreferrer" style={{color: '#1976d2', textDecoration: 'none'}}>View</a>
                                        {item._id !== 'legacy' && (
                                            <button 
                                                onClick={() => handleDeletePrescription(item._id)}
                                                style={{background: 'none', border: 'none', color: '#d32f2f', cursor: 'pointer'}}
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <hr style={{margin: '20px 0'}} />

            {/* Upload Section */}
            <h3>Add New Prescription</h3>
            <div className="form-group">
                <input 
                  type="file" 
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  style={{padding: '10px 0'}}
                />
            </div>

            {preview && file && !file.type.includes('pdf') && (
              <div className="preview-container" style={{marginBottom: '15px'}}>
                <p>New Upload Preview:</p>
                <img src={preview} alt="Preview" style={{maxWidth: '200px', border: '1px solid #ddd'}} />
              </div>
            )}

            <div className="form-group">
                <label>Diagnosis / Notes</label>
                <textarea 
                    rows="4"
                    style={{width: '100%', padding: '10px'}}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter diagnosis notes..."
                />
            </div>

            <button 
              onClick={handleSave} 
              className="auth-button"
              disabled={isUploading}
              style={{opacity: isUploading ? 0.7 : 1}}
            >
              {isUploading ? 'Uploading...' : 'Upload & Update'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default DoctorPatientDetails;