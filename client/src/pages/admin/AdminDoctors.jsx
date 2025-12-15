import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAuth, useAdminEntities } from '../../store/hooks';
import { fetchAdminDoctors, createDoctor, updateDoctor, deleteDoctor } from '../../store/slices/adminEntitiesSlice';
import '../administration/Administrator.css';

const AdminDoctors = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const { doctors: doctorsState } = useAdminEntities();
  
  const doctors = doctorsState.data;
  const loadingData = doctorsState.loading;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    specialty: '',
    experience: '',
    education: '',
    services: [],
    availability: {
      monday: { available: false, startTime: '09:00', endTime: '17:00' },
      tuesday: { available: false, startTime: '09:00', endTime: '17:00' },
      wednesday: { available: false, startTime: '09:00', endTime: '17:00' },
      thursday: { available: false, startTime: '09:00', endTime: '17:00' },
      friday: { available: false, startTime: '09:00', endTime: '17:00' },
      saturday: { available: false, startTime: '09:00', endTime: '17:00' },
      sunday: { available: false, startTime: '09:00', endTime: '17:00' }
    },
    successRate: '90%',
    patientsCount: '100+',
    image: '👨‍⚕️',
    bio: '',
    consultationFee: 0
  });

  const availableServices = [
    { id: 'ivf', name: 'In Vitro Fertilization (IVF)' },
    { id: 'iui', name: 'Intrauterine Insemination (IUI)' },
    { id: 'icsi', name: 'Intracytoplasmic Sperm Injection' },
    { id: 'egg-freezing', name: 'Egg Freezing & Preservation' },
    { id: 'genetic-testing', name: 'Genetic Testing & Screening' },
    { id: 'donor-program', name: 'Egg & Sperm Donor Program' },
    { id: 'male-fertility', name: 'Male Fertility Treatment' },
    { id: 'surrogacy', name: 'Surrogacy Services' },
    { id: 'fertility-surgery', name: 'Fertility Surgery' }
  ];

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    // Fetch doctors using Redux
    dispatch(fetchAdminDoctors());
  }, [navigate, user, dispatch]);

  // Sync error from Redux
  useEffect(() => {
    if (doctorsState.error) {
      setError(doctorsState.error);
    }
  }, [doctorsState.error]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError('');
    setSuccess('');
  };

  const handleServiceChange = (e) => {
    const selectedServices = Array.from(e.target.selectedOptions, option => option.value);
    setFormData({ ...formData, services: selectedServices });
  };

  const handleAvailabilityChange = (day, field, value) => {
    setFormData({
      ...formData,
      availability: {
        ...formData.availability,
        [day]: {
          ...formData.availability[day],
          [field]: field === 'available' ? value : value
        }
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (editingDoctor) {
        const result = await dispatch(updateDoctor({ id: editingDoctor._id, doctorData: formData }));
        if (updateDoctor.fulfilled.match(result)) {
          setSuccess('Doctor updated successfully');
          resetForm();
        } else {
          setError(result.payload || 'Failed to update doctor');
        }
      } else {
        // Validate required fields
        if (!formData.name || !formData.email) {
          setError('Name and email are required');
          setLoading(false);
          return;
        }

        // Validate password for new doctors
        if (!formData.password || formData.password.length < 6) {
          setError('Password is required and must be at least 6 characters');
          setLoading(false);
          return;
        }

        // Validate services for doctor
        if (!formData.services || formData.services.length === 0) {
          setError('Please select at least one service');
          setLoading(false);
          return;
        }
        
        // Clean up the formData before sending - ensure consultationFee is a number
        const doctorData = {
          ...formData,
          consultationFee: formData.consultationFee ? Number(formData.consultationFee) : 0
        };
        
        const result = await dispatch(createDoctor(doctorData));
        if (createDoctor.fulfilled.match(result)) {
          let successMsg = 'Doctor created successfully';
          // Note: generatedPassword would need to be returned in the action payload
          setSuccess(successMsg);
          resetForm();
        } else {
          setError(result.payload || 'Failed to create doctor');
        }
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Error saving doctor';
      setError(errorMessage);
      console.error('Error saving doctor:', err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (doctor) => {
    setEditingDoctor(doctor);
    setFormData({
      name: doctor.name,
      email: doctor.email,
      phone: doctor.phone || '',
      password: '', // Don't show password when editing
      specialty: doctor.specialty || '',
      experience: doctor.experience || '',
      education: doctor.education || '',
      services: doctor.services || [],
      availability: doctor.availability || formData.availability,
      successRate: doctor.successRate || '90%',
      patientsCount: doctor.patientsCount || '100+',
      image: doctor.image || '👨‍⚕️',
      bio: doctor.bio || '',
      consultationFee: doctor.consultationFee || 0
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this doctor?')) {
      try {
        const result = await dispatch(deleteDoctor(id));
        if (deleteDoctor.fulfilled.match(result)) {
          setSuccess('Doctor deleted successfully');
        } else {
          setError(result.payload || 'Error deleting doctor');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Error deleting doctor');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      userId: '',
      name: '',
      email: '',
      phone: '',
      password: '',
      specialty: '',
      experience: '',
      education: '',
      services: [],
      availability: {
        monday: { available: false, startTime: '09:00', endTime: '17:00' },
        tuesday: { available: false, startTime: '09:00', endTime: '17:00' },
        wednesday: { available: false, startTime: '09:00', endTime: '17:00' },
        thursday: { available: false, startTime: '09:00', endTime: '17:00' },
        friday: { available: false, startTime: '09:00', endTime: '17:00' },
        saturday: { available: false, startTime: '09:00', endTime: '17:00' },
        sunday: { available: false, startTime: '09:00', endTime: '17:00' }
      },
      successRate: '90%',
      patientsCount: '100+',
      image: '👨‍⚕️',
      bio: '',
      consultationFee: 0
    });
    setEditingDoctor(null);
    setShowForm(false);
  };

  return (
    <div className="administrator-page">
      <div className="administrator-container">
        <div className="admin-header">
          <div>
            <h1>Manage Doctors</h1>
            <p>Add and manage doctor profiles with complete details</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
            {showForm ? 'Cancel' : '+ Add Doctor'}
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {showForm && (
          <div className="form-card">
            <h2>{editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phone">Phone</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="password">{editingDoctor ? 'New Password (leave blank to keep current)' : 'Password *'}</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder={editingDoctor ? 'Enter new password or leave blank' : 'Enter password for login'}
                    required={!editingDoctor}
                    minLength={6}
                  />
                  <small className="form-hint">Minimum 6 characters. User will login with this email and password.</small>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="specialty">Specialty</label>
                  <input
                    type="text"
                    id="specialty"
                    name="specialty"
                    value={formData.specialty}
                    onChange={handleChange}
                    placeholder="e.g., IVF Specialist"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="experience">Experience</label>
                  <input
                    type="text"
                    id="experience"
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    placeholder="e.g., 15 Years"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="education">Education</label>
                  <input
                    type="text"
                    id="education"
                    name="education"
                    value={formData.education}
                    onChange={handleChange}
                    placeholder="e.g., MD, PhD"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="services">Services *</label>
                <select
                  id="services"
                  name="services"
                  multiple
                  value={formData.services}
                  onChange={handleServiceChange}
                  required
                  className="services-multiselect"
                  size={5}
                >
                  {availableServices.map(service => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
                <small className="form-hint">Hold Ctrl (Windows) or Cmd (Mac) to select multiple services</small>
              </div>

              <div className="form-group">
                <label>Availability</label>
                <div className="availability-grid">
                  {days.map(day => (
                    <div key={day} className="availability-day">
                      <label>
                        <input
                          type="checkbox"
                          checked={formData.availability[day].available}
                          onChange={(e) => handleAvailabilityChange(day, 'available', e.target.checked)}
                        />
                        {day.charAt(0).toUpperCase() + day.slice(1)}
                      </label>
                      {formData.availability[day].available && (
                        <div className="time-inputs">
                          <input
                            type="time"
                            value={formData.availability[day].startTime}
                            onChange={(e) => handleAvailabilityChange(day, 'startTime', e.target.value)}
                          />
                          <span>to</span>
                          <input
                            type="time"
                            value={formData.availability[day].endTime}
                            onChange={(e) => handleAvailabilityChange(day, 'endTime', e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="successRate">Success Rate</label>
                  <input
                    type="text"
                    id="successRate"
                    name="successRate"
                    value={formData.successRate}
                    onChange={handleChange}
                    placeholder="e.g., 90%"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="patientsCount">Patients Count</label>
                  <input
                    type="text"
                    id="patientsCount"
                    name="patientsCount"
                    value={formData.patientsCount}
                    onChange={handleChange}
                    placeholder="e.g., 100+"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="image">Image Emoji</label>
                  <input
                    type="text"
                    id="image"
                    name="image"
                    value={formData.image}
                    onChange={handleChange}
                    placeholder="👨‍⚕️"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="consultationFee">Consultation Fee</label>
                  <input
                    type="number"
                    id="consultationFee"
                    name="consultationFee"
                    value={formData.consultationFee}
                    onChange={handleChange}
                    min="0"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="bio">Bio</label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Doctor biography..."
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : editingDoctor ? 'Update Doctor' : 'Create Doctor'}
                </button>
                <button type="button" onClick={resetForm} className="btn btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="users-table">
          <h2>All Doctors</h2>
          {loadingData ? (
            <div className="loading-message">Loading doctors...</div>
          ) : doctors.length === 0 ? (
            <div className="empty-message">No doctors found. Create one to get started.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Specialty</th>
                  <th>Experience</th>
                  <th>Services</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {doctors.map((doctor) => (
                  <tr key={doctor._id}>
                    <td>{doctor.name}</td>
                    <td>{doctor.email}</td>
                    <td>{doctor.specialty || '-'}</td>
                    <td>{doctor.experience || '-'}</td>
                    <td>{doctor.services?.length || 0} services</td>
                    <td>
                      <button onClick={() => handleEdit(doctor)} className="btn-edit">Edit</button>
                      <button onClick={() => handleDelete(doctor._id)} className="btn-delete">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDoctors;

