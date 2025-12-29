import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { useAppDispatch, useDoctors, useAppSelector } from '../../store/hooks';
import { 
    saveTreatmentPlan, 
    fetchTreatmentPlan, 
    fetchPatientHistory, 
    deletePlanFile,
    clearCurrentPlan
} from '../../store/slices/doctorSlice';
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

  // Close when clicking outside
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
    const currentSelected = selected || []; 
    let newSelected;
    if (currentSelected.includes(option)) {
      newSelected = currentSelected.filter(item => item !== option);
    } else {
      newSelected = [...currentSelected, option];
    }
    onChange(newSelected);
  };

  const safeSelected = selected || [];

  return (
    <div className="multiselect-container" ref={dropdownRef}>
      <label className="multiselect-label">{title}</label>
      
      <div 
        className={`multiselect-header ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{safeSelected.length > 0 ? `${safeSelected.length} selected` : 'Select options...'}</span>
        <span className="multiselect-arrow">▼</span>
      </div>

      {isOpen && (
        <div className="multiselect-menu">
          {options.map((option) => (
            <div 
              key={option} 
              className={`multiselect-item ${safeSelected.includes(option) ? 'selected' : ''}`}
              onClick={() => toggleOption(option)}
            >
              <input 
                type="checkbox" 
                checked={safeSelected.includes(option)} 
                readOnly 
                className="multiselect-checkbox"
              />
              {option}
            </div>
          ))}
        </div>
      )}
      
      <div className="multiselect-tags">
        {safeSelected.map(item => (
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
  
  // New selector for the separate plan
  const { currentTreatmentPlan } = useAppSelector(state => state.doctors);
  
  const appointment = appointments.find(a => a._id === appointmentId);
  const [preview, setPreview] = useState(null);

  // --- React Hook Form ---
  const { register, control, handleSubmit, setValue, watch, formState: { isSubmitting } } = useForm({
    defaultValues: {
      labTests: [],
      dietPlan: [],
      pharmacy: [],
      prescriptionDescription: '',
      prescriptionFile: null
    }
  });

  // 1. Initial Load: Fetch History & Plan
  useEffect(() => {
    if (appointmentId) {
        dispatch(fetchTreatmentPlan(appointmentId));
    }
    // Cleanup on unmount
    return () => { dispatch(clearCurrentPlan()); };
  }, [appointmentId, dispatch]);

  useEffect(() => {
    if (appointment) {
        const pId = appointment.patientId || appointment.userId?._id;
        if (pId) dispatch(fetchPatientHistory(pId));
    }
  }, [appointment, dispatch]);

  // 2. Populate Form when currentTreatmentPlan arrives
  useEffect(() => {
    if (currentTreatmentPlan) {
        setValue('labTests', currentTreatmentPlan.labTests || []);
        setValue('dietPlan', currentTreatmentPlan.dietPlan || []);
        setValue('prescriptionDescription', currentTreatmentPlan.prescriptionDescription || currentTreatmentPlan.diagnosis || '');
        
        // Map pharmacy if exists
        if (currentTreatmentPlan.pharmacy && currentTreatmentPlan.pharmacy.length > 0) {
            setValue('pharmacy', currentTreatmentPlan.pharmacy);
        } else {
            setValue('pharmacy', []);
        }
    }
  }, [currentTreatmentPlan, setValue]);

  // Handle File Preview
  const handleFileChange = (e) => {
      const selectedFile = e.target.files[0];
      if (selectedFile) {
          const objectUrl = URL.createObjectURL(selectedFile);
          setPreview(objectUrl);
      } else {
          setPreview(null);
      }
  };

  // Handle Medication Name Selection (Syncs with RHF pharmacy array)
  const handlePharmacySelection = (selectedNames, currentPharmacyValues, onChange) => {
    const currentValues = currentPharmacyValues || [];
    
    // 1. Filter out items that were deselected
    const keptItems = currentValues.filter(item => selectedNames.includes(item.medicineName));
    
    // 2. Add new items that were selected
    const newItems = selectedNames
        .filter(name => !currentValues.some(item => item.medicineName === name))
        .map(name => ({ medicineName: name, frequency: '', duration: '' }));
    
    onChange([...keptItems, ...newItems]);
  };

  const onSubmit = async (data) => {
    const formData = new FormData();
    // Unified payload structure for Treatment Plan
    formData.append('diagnosis', data.prescriptionDescription || ''); 
    formData.append('prescriptionDescription', data.prescriptionDescription || ''); 
    formData.append('status', 'completed');

    // JSON Stringify complex arrays
    formData.append('labTests', JSON.stringify(data.labTests || []));
    formData.append('dietPlan', JSON.stringify(data.dietPlan || []));
    formData.append('pharmacy', JSON.stringify(data.pharmacy || []));

    if (data.prescriptionFile && data.prescriptionFile.length > 0) {
      formData.append('prescriptionFile', data.prescriptionFile[0]);
    }

    try {
      // Using the NEW saveTreatmentPlan action
      await dispatch(saveTreatmentPlan({ appointmentId, formData })).unwrap();
      alert('Treatment plan saved successfully!');
      setPreview(null);
    } catch (err) {
      console.error(err);
      alert('Failed to save plan: ' + err);
    }
  };

  const handleRemoveFile = async (fileId) => {
      if(!window.confirm("Are you sure you want to remove this file?")) return;
      try {
          await dispatch(deletePlanFile({ appointmentId, fileId })).unwrap();
          alert("File removed.");
      } catch (err) {
          alert("Failed to remove file: " + err);
      }
  };

  if (!appointment) return <div className="patient-container">Appointment not found.</div>;

  // Use attachments from the separate plan if available
  const attachments = currentTreatmentPlan?.attachments || [];
  const pharmacyValues = watch('pharmacy') || [];
  const selectedMedNames = pharmacyValues.map(p => p.medicineName);
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
                <div className="status-tag">Status: {appointment.status}</div>
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
                                <div className="history-notes">
                                    {hist.prescriptionDescription || hist.notes || 'No notes'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <hr className="divider" />

            {/* --- UNIFIED TREATMENT FORM --- */}
            <form onSubmit={handleSubmit(onSubmit)}>
                <h3>Treatment Plan</h3>
                
                {/* Lab Tests */}
                <div className="form-group-row">
                    <Controller
                        name="labTests"
                        control={control}
                        render={({ field }) => (
                            <MultiSelectDropdown 
                                title="Lab Tests (IVF)" 
                                options={IVF_LAB_TESTS} 
                                selected={field.value || []} 
                                onChange={field.onChange} 
                            />
                        )}
                    />
                </div>

                {/* Diet Plan */}
                <div className="form-group-row">
                    <Controller
                        name="dietPlan"
                        control={control}
                        render={({ field }) => (
                            <MultiSelectDropdown 
                                title="Dietary Recommendations" 
                                options={IVF_DIET_PLAN} 
                                selected={field.value || []} 
                                onChange={field.onChange} 
                            />
                        )}
                    />
                </div>

                {/* Pharmacy & Medications */}
                <div className="form-group-row">
                    <Controller
                        name="pharmacy"
                        control={control}
                        render={({ field }) => (
                            <MultiSelectDropdown 
                                title="Pharmacy & Medications" 
                                options={IVF_MEDICATIONS} 
                                selected={selectedMedNames} 
                                onChange={(newNames) => handlePharmacySelection(newNames, field.value, field.onChange)} 
                            />
                        )}
                    />

                    {pharmacyValues.length > 0 && (
                        <div className="pharmacy-details-box">
                            <h4>Medication Details</h4>
                            {pharmacyValues.map((item, index) => (
                                <div key={item.medicineName} className="medication-row">
                                    <div className="med-name">{item.medicineName}</div>
                                    
                                    <select 
                                        {...register(`pharmacy.${index}.frequency`)}
                                        className="med-input"
                                    >
                                        <option value="">Select Frequency</option>
                                        {FREQUENCY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>

                                    <input 
                                        type="text" 
                                        placeholder="Duration (e.g. 5 days)" 
                                        {...register(`pharmacy.${index}.duration`)}
                                        className="med-input"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                <hr className="divider" />

                {/* --- DOCUMENTS & NOTES --- */}
                <div className="prescriptions-section">
                    <h3>Uploaded Documents / Files</h3>
                    {attachments.length === 0 ? (
                        <p className="no-docs-text">No files uploaded yet.</p>
                    ) : (
                        <div className="prescriptions-list">
                            {attachments.map((item, index) => (
                                <div key={item._id || index} className="prescription-item">
                                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="doc-link">
                                        <div className="doc-icon">📄</div>
                                        <div className="doc-name">{item.name || 'Document'}</div>
                                    </a>
                                    <button 
                                        type="button" 
                                        onClick={() => handleRemoveFile(item._id)} 
                                        className="doc-remove-btn"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <h3 className="section-title">Add File & Notes</h3>
                <div className="form-group">
                    <input 
                        type="file" 
                        accept="image/*,.pdf" 
                        {...register('prescriptionFile', {
                            onChange: handleFileChange
                        })}
                        className="file-input" 
                    />
                </div>

                {preview && !watch('prescriptionFile')?.[0]?.type?.includes('pdf') && (
                  <div className="preview-container">
                    <img src={preview} alt="Preview" />
                  </div>
                )}

                <div className="form-group">
                    <textarea 
                        rows="4"
                        className="notes-input"
                        {...register('prescriptionDescription')}
                        placeholder="Prescription / Diagnosis notes..."
                    />
                </div>

                <button 
                  type="submit"
                  className="auth-button save-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving & Uploading...' : 'Save & Upload'}
                </button>
            </form>
        </div>
      </div>
    </div>
  );
};

export default DoctorPatientDetails;