import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useDoctors } from '../../store/hooks';
import { updatePrescription, deletePrescription, fetchPatientHistory } from '../../store/slices/doctorSlice';
import api from '../../utils/api'; // Direct API access for fetching labs
import './Patient.css';

// --- IVF RELATED DATA CONSTANTS ---
const IVF_LAB_TESTS = [
  "FSH (Follicle Stimulating Hormone)",
  "LH (Luteinizing Hormone)",
  "Estradiol (E2)",
  "Progesterone (P4)",
  "AMH (Anti-Mullerian Hormone)",
  "Beta hCG",
  "TSH (Thyroid)",
  "Prolactin",
  "Semen Analysis",
  "Transvaginal Ultrasound",
  "Hysterosalpingogram (HSG)"
];

const IVF_DIET_PLAN = [
  "High Protein Diet",
  "Mediterranean Diet",
  "Anti-inflammatory Diet",
  "Low Carb / Keto",
  "Gluten-Free",
  "Dairy-Free",
  "Increased Hydration (3L+ water)",
  "Avoid Caffeine",
  "Avoid Alcohol",
  "Folic Acid Rich Foods"
];

const IVF_MEDICATIONS = [
  "Folic Acid (400mcg/5mg)",
  "Prenatal Vitamins",
  "Clomiphene Citrate (Clomid)",
  "Letrozole (Femara)",
  "Gonadotropins (Gonal-F/Follistim)",
  "Menopur",
  "Cetrotide / Ganirelix",
  "Lupron (Leuprolide)",
  "Ovidrel (hCG Trigger)",
  "Progesterone in Oil (PIO)",
  "Progesterone Suppositories (Endometrin)",
  "Estrogen (Estrace/Patches)",
  "Doxycycline (Antibiotic)",
  "Medrol (Steroid)"
];

const FREQUENCY_OPTIONS = [
  "Once a day",
  "Twice a day",
  "Three times a day",
  "Every 4 hours",
  "Every other day",
  "Before bed",
  "With meals",
  "Empty stomach"
];

// --- HELPER COMPONENT: Multi-Select Dropdown ---
const MultiSelectDropdown = ({ title, options, selected, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (option) => {
    let newSelected;
    if (selected.includes(option)) {
      newSelected = selected.filter(item => item !== option);
    } else {
      newSelected = [...selected, option];
    }
    onChange(newSelected);
  };

  return (
    <div className="multiselect-container" ref={dropdownRef}>
      <label className="multiselect-label">{title}</label>
      
      <div 
        className={`multiselect-header ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{selected.length > 0 ? `${selected.length} selected` : 'Select options...'}</span>
        <span className="multiselect-arrow">▼</span>
      </div>

      {isOpen && (
        <div className="multiselect-menu">
          {options.map((option) => (
            <div 
              key={option} 
              className={`multiselect-item ${selected.includes(option) ? 'selected' : ''}`}
              onClick={() => toggleOption(option)}
            >
              <input 
                type="checkbox" 
                checked={selected.includes(option)} 
                readOnly 
                className="multiselect-checkbox"
              />
              {option}
            </div>
          ))}
        </div>
      )}
      
      <div className="multiselect-tags">
        {selected.map(item => (
          <span key={item} className="multiselect-tag">
            {item} 
            <span className="tag-remove" onClick={() => toggleOption(item)}>×</span>
          </span>
        ))}
      </div>
    </div>
  );
};

const DoctorPatientDetails = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { appointments, patientHistory } = useDoctors();
  
  const appointment = appointments.find(a => a._id === appointmentId);
  
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [notes, setNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Treatment States
  const [selectedLabs, setSelectedLabs] = useState([]);
  const [selectedDiet, setSelectedDiet] = useState([]);
  const [selectedMedNames, setSelectedMedNames] = useState([]); 
  const [pharmacyDetails, setPharmacyDetails] = useState([]);

  // Lab Selection States
  const [availableLabs, setAvailableLabs] = useState([]);
  const [selectedLabId, setSelectedLabId] = useState('');

  // 1. Fetch Available Labs on Mount
  useEffect(() => {
    const fetchLabs = async () => {
        try {
            // FIXED: Added '/api' prefix to the route to match server config
            const res = await api.get('/api/doctor/labs-list');
            if (res.data.success) {
                setAvailableLabs(res.data.labs);
            }
        } catch (err) {
            console.error("Failed to fetch labs list", err);
        }
    };
    fetchLabs();
  }, []);

  // 2. Initialize Data from Appointment
  useEffect(() => {
    if (appointment) {
      setNotes(appointment.notes || '');
      if (appointment.labTests) setSelectedLabs(appointment.labTests);
      if (appointment.dietPlan || appointment.diet) setSelectedDiet(appointment.dietPlan || appointment.diet);
      
      // Initialize Pharmacy
      if (appointment.pharmacy) {
        const mappedPharmacy = appointment.pharmacy.map(p => ({
            name: p.medicineName || p.name,
            frequency: p.frequency || '',
            duration: p.duration || ''
        }));
        setPharmacyDetails(mappedPharmacy);
        setSelectedMedNames(mappedPharmacy.map(p => p.name));
      }

      // Initialize Selected Lab
      if (appointment.labId) {
         // Handle if populated (object) or raw ID (string)
         const labVal = typeof appointment.labId === 'object' ? appointment.labId._id : appointment.labId;
         setSelectedLabId(labVal);
      }

      // Fetch History
      const pId = appointment.patientId || appointment.userId?._id;
      if (pId) {
          dispatch(fetchPatientHistory(pId));
      }
    }
  }, [appointment, dispatch]);

  const handleMedNameChange = (newNames) => {
    setSelectedMedNames(newNames);
    setPharmacyDetails(prev => {
      return newNames.map(name => {
        const existing = prev.find(p => p.name === name);
        return existing || { name, frequency: '', duration: '' };
      });
    });
  };

  const handlePharmacyDetailChange = (index, field, value) => {
    const updated = [...pharmacyDetails];
    updated[index] = { ...updated[index], [field]: value };
    setPharmacyDetails(updated);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreview(objectUrl);
    }
  };

  const handleSave = async () => {
    setIsUploading(true);
    const formData = new FormData();
    if (file) formData.append('prescriptionFile', file);
    formData.append('diagnosis', notes);
    formData.append('status', 'completed');

    // Append JSON strings for arrays
    formData.append('labTests', JSON.stringify(selectedLabs));
    formData.append('dietPlan', JSON.stringify(selectedDiet));
    formData.append('pharmacy', JSON.stringify(pharmacyDetails));
    
    // Append Selected Lab ID
    if (selectedLabId) {
        formData.append('labId', selectedLabId);
    }

    try {
      await dispatch(updatePrescription({ appointmentId, formData })).unwrap();
      alert('Treatment plan updated successfully!');
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

  // Separate Lab Reports from Doctor Documents
  const labReports = appointment.prescriptions?.filter(p => p.type === 'lab_report') || [];
  
  const getDoctorDocuments = () => {
      const allDocs = appointment.prescriptions || [];
      const docDocs = allDocs.filter(p => p.type !== 'lab_report');
      
      // Legacy support
      if (docDocs.length === 0 && appointment.prescription) {
          return [{ _id: 'legacy', url: appointment.prescription, name: 'Previous Prescription' }];
      }
      return docDocs;
  };

  const doctorDocuments = getDoctorDocuments();
  const patientDisplayId = appointment.patientId || appointment.userId?.patientId || 'N/A';

  return (
    <div className="patient-page">
      <div className="patient-container">
        <button onClick={() => navigate('/doctor/patients')} className="back-button">← Back to List</button>
        
        <div className="doctor-details-card">
            <div className="header-row">
                <h1>IVF Patient Consultation</h1>
                <span className="patient-id-badge">{patientDisplayId}</span>
            </div>
            
            <div className="patient-info-grid">
                <div><strong>Patient:</strong> {appointment.userId?.name}</div>
                <div><strong>Service:</strong> {appointment.serviceName}</div>
                <div><strong>Date:</strong> {new Date(appointment.appointmentDate).toDateString()}</div>
            </div>

            <hr className="divider" />

            {/* --- PATIENT HISTORY SECTION --- */}
            {patientHistory && patientHistory.length > 0 && (
                <div className="history-section">
                    <h3>Patient History</h3>
                    <div className="history-list">
                        {patientHistory.filter(h => h._id !== appointment._id).map((hist, idx) => (
                            <div key={idx} className="history-item">
                                <div className="history-date">{new Date(hist.appointmentDate).toLocaleDateString()}</div>
                                <div className="history-service">{hist.serviceName}</div>
                                <div className="history-status">{hist.status}</div>
                                <div className="history-notes">{hist.notes || 'No notes'}</div>
                            </div>
                        ))}
                        {patientHistory.filter(h => h._id !== appointment._id).length === 0 && (
                            <p className="no-history">No previous visits recorded.</p>
                        )}
                    </div>
                </div>
            )}

            <hr className="divider" />

            {/* --- LAB RESULTS (Incoming from Lab) --- */}
            {labReports.length > 0 && (
                <div className="lab-reports-section" style={{marginBottom: '30px'}}>
                    <h3 style={{color: '#0284c7', display:'flex', alignItems:'center', gap:'10px'}}>
                        🧪 Lab Results <span className="status-badge status-completed" style={{fontSize: '0.7rem'}}>New</span>
                    </h3>
                    <div className="prescriptions-list">
                        {labReports.map((report, index) => (
                            <div key={index} className="prescription-item" style={{borderColor: '#0284c7', backgroundColor: '#f0f9ff'}}>
                                <a href={report.url} target="_blank" rel="noopener noreferrer" className="doc-link">
                                    <div className="doc-icon">🔬</div>
                                    <div className="doc-name" style={{color: '#0284c7'}}>{report.name}</div>
                                </a>
                                <div className="doc-date" style={{fontSize: '0.8rem', color: '#666', marginLeft: 'auto'}}>
                                    {new Date(report.uploadedAt).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                    <hr className="divider" />
                </div>
            )}

            {/* --- TREATMENT PLAN --- */}
            <h3>Treatment Plan</h3>
            
            {/* NEW: Lab Selection Dropdown */}
            <div className="form-group-row" style={{marginBottom: '20px'}}>
                <label className="multiselect-label" style={{display:'block', marginBottom:'8px', fontWeight:'600'}}>Assign to Lab</label>
                <select 
                    className="med-input" 
                    style={{width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius:'8px', fontSize:'1rem'}}
                    value={selectedLabId}
                    onChange={(e) => setSelectedLabId(e.target.value)}
                >
                    <option value="">-- Select a Lab Center --</option>
                    {availableLabs.map(lab => (
                        <option key={lab._id} value={lab._id}>
                             {lab.name} {lab.address ? `(${lab.address})` : ''}
                        </option>
                    ))}
                </select>
                <small style={{color: '#666', marginTop:'5px', display:'block'}}>
                    Select the lab center where this test request should be routed.
                </small>
            </div>

            <div className="form-group-row">
                <MultiSelectDropdown 
                    title="Lab Tests (IVF)" 
                    options={IVF_LAB_TESTS} 
                    selected={selectedLabs} 
                    onChange={setSelectedLabs} 
                />
            </div>

            <div className="form-group-row">
                <MultiSelectDropdown 
                    title="Dietary Recommendations" 
                    options={IVF_DIET_PLAN} 
                    selected={selectedDiet} 
                    onChange={setSelectedDiet} 
                />
            </div>

            <div className="form-group-row">
                <MultiSelectDropdown 
                    title="Pharmacy & Medications" 
                    options={IVF_MEDICATIONS} 
                    selected={selectedMedNames} 
                    onChange={handleMedNameChange} 
                />

                {pharmacyDetails.length > 0 && (
                    <div className="pharmacy-details-box">
                        <h4>Medication Details</h4>
                        {pharmacyDetails.map((med, index) => (
                            <div key={index} className="medication-row">
                                <div className="med-name">{med.name}</div>
                                
                                <select 
                                    value={med.frequency}
                                    onChange={(e) => handlePharmacyDetailChange(index, 'frequency', e.target.value)}
                                    className="med-input"
                                >
                                    <option value="">Select Frequency</option>
                                    {FREQUENCY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>

                                <input 
                                    type="text" 
                                    placeholder="Duration (e.g. 5 days)" 
                                    value={med.duration}
                                    onChange={(e) => handlePharmacyDetailChange(index, 'duration', e.target.value)}
                                    className="med-input"
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            <hr className="divider" />

            {/* Documents Section (Doctor's Uploads) */}
            <div className="prescriptions-section">
                <h3>Uploaded Documents</h3>
                {doctorDocuments.length === 0 ? (
                    <p className="no-docs-text">No documents uploaded yet.</p>
                ) : (
                    <div className="prescriptions-list">
                        {doctorDocuments.map((item, index) => (
                            <div key={item._id || index} className="prescription-item">
                                <a href={item.url} target="_blank" rel="noopener noreferrer" className="doc-link">
                                    <div className="doc-icon">📄</div>
                                    <div className="doc-name">{item.name || 'Document'}</div>
                                </a>
                                {item._id !== 'legacy' && (
                                    <button onClick={() => handleDeletePrescription(item._id)} className="doc-remove-btn">
                                        Remove
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <h3 className="section-title">Add File / Notes</h3>
            <div className="form-group">
                <input type="file" accept="image/*,.pdf" onChange={handleFileChange} className="file-input" />
            </div>

            {preview && file && !file.type.includes('pdf') && (
              <div className="preview-container">
                <img src={preview} alt="Preview" />
              </div>
            )}

            <div className="form-group">
                <textarea 
                style={{color:'black'}}
                    rows="4"
                    className="notes-input"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="General diagnosis notes..."
                />
            </div>

            <button 
              onClick={handleSave} 
              className="auth-button save-btn"
              disabled={isUploading}
            >
              {isUploading ? 'Saving...' : 'Save Treatment Plan'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default DoctorPatientDetails;