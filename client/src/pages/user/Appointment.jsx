import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import './Appointment.css';

// Services data
const servicesData = [
  { id: 'ivf', title: 'In Vitro Fertilization (IVF)' },
  { id: 'iui', title: 'Intrauterine Insemination (IUI)' },
  { id: 'icsi', title: 'Intracytoplasmic Sperm Injection' },
  { id: 'egg-freezing', title: 'Egg Freezing & Preservation' },
  { id: 'genetic-testing', title: 'Genetic Testing & Screening' },
  { id: 'donor-program', title: 'Egg & Sperm Donor Program' },
  { id: 'male-fertility', title: 'Male Fertility Treatment' },
  { id: 'surrogacy', title: 'Surrogacy Services' },
  { id: 'fertility-surgery', title: 'Fertility Surgery' }
];

// Mock doctors data (as array for easier filtering)
const doctorsDataArray = [
  { id: 1, name: 'Dr. Sarah Cameron', specialty: 'Senior Embryologist', services: ['ivf', 'egg-freezing'] },
  { id: 2, name: 'Dr. Michael Ross', specialty: 'Infertility Specialist', services: ['ivf', 'iui'] },
  { id: 3, name: 'Dr. Emily Chen', specialty: 'Reproductive Geneticist', services: ['genetic-testing', 'donor-program'] },
  { id: 4, name: 'Dr. James Wilson', specialty: 'Urologist & Andrologist', services: ['icsi', 'male-fertility'] },
  { id: 5, name: 'Dr. Anita Roy', specialty: 'Gynecologist & Obstetrician', services: ['iui', 'ivf'] },
  { id: 6, name: 'Dr. Robert Kim', specialty: 'Fertility Surgeon', services: ['fertility-surgery', 'ivf'] },
  { id: 7, name: 'Dr. Lisa Thompson', specialty: 'Reproductive Endocrinologist', services: ['surrogacy', 'donor-program'] },
  { id: 8, name: 'Dr. David Martinez', specialty: 'IVF Laboratory Director', services: ['ivf', 'icsi', 'egg-freezing'] }
];

// Legacy format for backward compatibility
const doctorsData = {
  1: doctorsDataArray[0],
  2: doctorsDataArray[1],
  3: doctorsDataArray[2],
  4: doctorsDataArray[3],
  5: doctorsDataArray[4],
  6: doctorsDataArray[5],
  7: doctorsDataArray[6],
  8: doctorsDataArray[7]
};

// Available time slots
const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30'
];

const Appointment = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const doctorId = parseInt(searchParams.get('doctorId'));
  
  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter] = useState('all'); // all, upcoming, past
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  
  // Booking form state (only used when doctorId is present)
  const [formData, setFormData] = useState({
    appointmentDate: '',
    appointmentTime: '',
    notes: ''
  });
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Modal form state
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [availableTimes, setAvailableTimes] = useState([]);
  
  // React Hook Form
  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
    defaultValues: {
      serviceId: '',
      doctorId: '',
      appointmentDate: new Date().toISOString().split('T')[0],
      appointmentTime: ''
    }
  });
  
  const watchedServiceId = watch('serviceId');
  const watchedDoctorId = watch('doctorId');
  const watchedDate = watch('appointmentDate');

  // Check authentication and fetch appointments
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
      fetchAppointments(token);
    } else {
      navigate('/login?redirect=/appointment' + (doctorId ? `?doctorId=${doctorId}` : ''));
      return;
    }

    // If doctorId is present, set up booking form
    if (doctorId) {
      if (doctorsData[doctorId]) {
        setSelectedDoctor(doctorsData[doctorId]);
        const today = new Date().toISOString().split('T')[0];
        setFormData(prev => ({ ...prev, appointmentDate: today }));
      } else {
        setError('Doctor not found');
      }
    }
  }, [doctorId, navigate]);

  // Update available time slots based on date
  const updateAvailableTimes = useCallback((selectedDate) => {
    if (!selectedDate) {
      setAvailableTimes([]);
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDateObj = new Date(selectedDate);
    selectedDateObj.setHours(0, 0, 0, 0);
    const now = new Date();
    
    let times = [...timeSlots];

    // If selected date is today, filter out past times
    if (selectedDateObj.getTime() === today.getTime()) {
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTimeInMinutes = currentHour * 60 + currentMinute;

      times = times.filter(time => {
        const [hours, minutes] = time.split(':').map(Number);
        const timeInMinutes = hours * 60 + minutes;
        // Add 30 minutes buffer - can't book if less than 30 minutes from now
        return timeInMinutes > (currentTimeInMinutes + 30);
      });
    }

    setAvailableTimes(times);
  }, []);

  // Filter doctors when service changes
  useEffect(() => {
    if (watchedServiceId) {
      const filtered = doctorsDataArray.filter(doc => doc.services.includes(watchedServiceId));
      setAvailableDoctors(filtered);
      // Reset doctor selection when service changes
      setValue('doctorId', '');
      setValue('appointmentTime', '');
    } else {
      setAvailableDoctors([]);
      setValue('doctorId', '');
    }
  }, [watchedServiceId, setValue]);

  // Update available times when doctor and date are selected
  useEffect(() => {
    if (watchedDoctorId && watchedDate) {
      updateAvailableTimes(watchedDate);
    } else {
      setAvailableTimes([]);
      setValue('appointmentTime', '');
    }
  }, [watchedDoctorId, watchedDate, updateAvailableTimes, setValue]);

  // Get max date (7 days from today)
  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 7);
    return maxDate.toISOString().split('T')[0];
  };

  // Get min date (today)
  const getMinDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Handle modal form submission
  const onModalFormSubmit = async (data) => {
    setError('');
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You must be logged in to book an appointment');
        setIsSubmitting(false);
        navigate('/login?redirect=/appointment');
        return;
      }

      // Get selected service and doctor details
      const selectedService = servicesData.find(s => s.id === data.serviceId);
      const selectedDoctor = doctorsDataArray.find(d => d.id === parseInt(data.doctorId));

      const appointmentData = {
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.name,
        serviceId: selectedService.id,
        serviceName: selectedService.title,
        appointmentDate: data.appointmentDate,
        appointmentTime: data.appointmentTime,
        amount: 0,
        notes: ''
      };

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/appointments/create`,
        appointmentData,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        // Close modal and refresh appointments
        setShowBookingModal(false);
        reset();
        setAvailableDoctors([]);
        setAvailableTimes([]);
        fetchAppointments(token);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book appointment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fetch appointments from API
  const fetchAppointments = async (token) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/appointments/my-appointments`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setAppointments(data.appointments || []);
      } else {
        console.error('Failed to fetch appointments:', data.message);
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter appointments
  const filteredAppointments = appointments.filter(apt => {
    if (filter === 'all') return true;
    
    const appointmentDateTime = new Date(`${apt.appointmentDate}T${apt.appointmentTime}`);
    const now = new Date();
    
    if (filter === 'upcoming') {
      return appointmentDateTime >= now;
    } else if (filter === 'past') {
      return appointmentDateTime < now;
    }
    return true;
  });

  // Sort appointments: upcoming first, then past
  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    const dateA = new Date(`${a.appointmentDate}T${a.appointmentTime}`);
    const dateB = new Date(`${b.appointmentDate}T${b.appointmentTime}`);
    const now = new Date();
    
    // Upcoming appointments first
    if (dateA >= now && dateB < now) return -1;
    if (dateA < now && dateB >= now) return 1;
    
    // Then sort by date
    return dateB - dateA;
  });

  // Handle booking form input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  // Handle booking form submit (for URL-based doctor selection)
  const handleBookingFormSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.appointmentDate || !formData.appointmentTime) {
      setError('Please select both date and time');
      return;
    }

    const selectedDate = new Date(formData.appointmentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      setError('Please select a future date');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/appointments/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          doctorId: selectedDoctor.id,
          doctorName: selectedDoctor.name,
          serviceId: selectedDoctor.services[0] || '',
          serviceName: selectedDoctor.services[0] || '',
          appointmentDate: formData.appointmentDate,
          appointmentTime: formData.appointmentTime,
          amount: 500,
          notes: formData.notes
        })
      });

      const data = await response.json();

      if (data.success) {
        // Refresh appointments list
        await fetchAppointments(token);
        // Clear form and remove doctorId from URL
        setFormData({ appointmentDate: '', appointmentTime: '', notes: '' });
        navigate('/appointment', { replace: true });
        setSelectedDoctor(null);
      } else {
        setError(data.message || 'Failed to create appointment');
      }
    } catch (err) {
      console.error('Appointment creation error:', err);
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Check if appointment is upcoming
  const isUpcoming = (appointmentDate, appointmentTime) => {
    const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
    return appointmentDateTime >= new Date();
  };

  if (!isAuthenticated) {
    return (
      <div className="appointment-page">
        <div className="content-wrapper">
          <div className="loading-state">
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="appointment-page">
      <div className="content-wrapper">
        
        {/* Header */}
        <section className="appointment-header animate-on-scroll slide-up">
          <div className="header-content">
            <span className="badge">My Appointments</span>
            <h1>
              Your <span className="text-gradient">Appointments</span>
            </h1>
            <p className="header-subtext">
              View and manage all your appointments in one place.
            </p>
          </div>
          
          {/* Book New Appointment Button */}
          <div className="header-actions">
            <button
              onClick={() => {
                setShowBookingModal(true);
                const today = new Date().toISOString().split('T')[0];
                reset({
                  serviceId: '',
                  doctorId: '',
                  appointmentDate: today,
                  appointmentTime: ''
                });
                setAvailableDoctors([]);
                setAvailableTimes([]);
                setError('');
              }}
              className="btn btn-primary btn-book-new"
            >
              <span className="btn-icon">➕</span>
              Book New Appointment
            </button>
          </div>
        </section>

        {/* Booking Form (only shown when doctorId is present) */}
        {doctorId && selectedDoctor && (
          <section className="booking-form-section animate-on-scroll slide-up delay-100">
            <div className="booking-form-header">
              <h2>Schedule Appointment with {selectedDoctor.name}</h2>
              <button
                onClick={() => {
                  navigate('/appointment', { replace: true });
                  setSelectedDoctor(null);
                }}
                className="btn-close"
              >
                ✕
              </button>
            </div>

            <div className="doctor-info-card">
              <div className="doctor-card-content">
                <div className="doctor-avatar">👨‍⚕️</div>
                <div className="doctor-details">
                  <h3>{selectedDoctor.name}</h3>
                  <p className="specialty">{selectedDoctor.specialty}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleBookingFormSubmit} className="appointment-form">
              <div className="form-group">
                <label htmlFor="appointmentDate">
                  <span className="label-icon">📅</span>
                  Select Date
                </label>
                <input
                  type="date"
                  id="appointmentDate"
                  name="appointmentDate"
                  value={formData.appointmentDate}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="appointmentTime">
                  <span className="label-icon">🕐</span>
                  Select Time
                </label>
                <div className="time-slots-grid">
                  {timeSlots.map((time) => (
                    <button
                      key={time}
                      type="button"
                      className={`time-slot-btn ${formData.appointmentTime === time ? 'selected' : ''}`}
                      onClick={() => handleInputChange({ target: { name: 'appointmentTime', value: time } })}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="notes">
                  <span className="label-icon">📝</span>
                  Additional Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows="4"
                  placeholder="Any specific concerns or information you'd like to share..."
                  className="form-textarea"
                />
              </div>

              {error && (
                <div className="error-message">
                  <span className="error-icon">⚠️</span>
                  {error}
                </div>
              )}

              <div className="payment-summary">
                <div className="summary-row">
                  <span>Consultation Fee</span>
                  <span className="amount">₹500</span>
                </div>
                <div className="summary-row total">
                  <span>Total Amount</span>
                  <span className="amount">₹500</span>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => {
                    navigate('/appointment', { replace: true });
                    setSelectedDoctor(null);
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.appointmentDate || !formData.appointmentTime}
                  className="btn btn-primary"
                >
                  {isSubmitting ? 'Processing...' : 'Confirm & Pay ₹500'}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Filters */}
        {!doctorId && (
          <section className="appointment-filters animate-on-scroll slide-up delay-100">
            <div className="filter-buttons">
              <button
                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All Appointments
              </button>
              <button
                className={`filter-btn ${filter === 'upcoming' ? 'active' : ''}`}
                onClick={() => setFilter('upcoming')}
              >
                Upcoming
              </button>
              <button
                className={`filter-btn ${filter === 'past' ? 'active' : ''}`}
                onClick={() => setFilter('past')}
              >
                Past
              </button>
            </div>
          </section>
        )}

        {/* Appointments List */}
        {!doctorId && (
          <section className="appointments-list-section animate-on-scroll slide-up delay-200">
            {isLoading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading appointments...</p>
              </div>
            ) : sortedAppointments.length > 0 ? (
              <div className="appointments-grid">
                {sortedAppointments.map((appointment) => {
                  const upcoming = isUpcoming(appointment.appointmentDate, appointment.appointmentTime);
                  return (
                    <div
                      key={appointment._id || appointment.id}
                      className={`appointment-card ${upcoming ? 'upcoming' : 'past'}`}
                    >
                      <div className="appointment-card-header">
                        <div className="appointment-status">
                          <span className={`status-badge status-${appointment.status}`}>
                            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                          </span>
                          {upcoming && <span className="upcoming-badge">Upcoming</span>}
                        </div>
                        <div className={`payment-status payment-${appointment.paymentStatus}`}>
                          {appointment.paymentStatus === 'paid' ? '✓ Paid' : '⏳ Pending'}
                        </div>
                      </div>

                      <div className="appointment-card-body">
                        <div className="appointment-doctor">
                          <div className="doctor-icon">👨‍⚕️</div>
                          <div>
                            <h3>{appointment.doctorName}</h3>
                            {appointment.serviceName && (
                              <p className="service-name">{appointment.serviceName}</p>
                            )}
                          </div>
                        </div>

                        <div className="appointment-details-list">
                          <div className="detail-item">
                            <span className="detail-icon">📅</span>
                            <div>
                              <span className="detail-label">Date</span>
                              <span className="detail-value">{formatDate(appointment.appointmentDate)}</span>
                            </div>
                          </div>
                          <div className="detail-item">
                            <span className="detail-icon">🕐</span>
                            <div>
                              <span className="detail-label">Time</span>
                              <span className="detail-value">{appointment.appointmentTime}</span>
                            </div>
                          </div>
                          {appointment.amount > 0 && (
                            <div className="detail-item">
                              <span className="detail-icon">💰</span>
                              <div>
                                <span className="detail-label">Amount</span>
                                <span className="detail-value">₹{appointment.amount}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {appointment.notes && (
                          <div className="appointment-notes">
                            <p><strong>Notes:</strong> {appointment.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="no-appointments">
                <div className="empty-state">
                  <div className="empty-icon">📅</div>
                  <h3>No Appointments Found</h3>
                  <p>
                    {filter !== 'all'
                      ? `You don't have any ${filter} appointments.`
                      : "You don't have any appointments yet. Book your first appointment to get started!"}
                  </p>
                  <button
                    onClick={() => navigate('/services')}
                    className="btn btn-primary"
                  >
                    Book New Appointment
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="booking-modal-overlay" onClick={() => setShowBookingModal(false)}>
          <div className="booking-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="booking-modal-header">
              <h2>Book New Appointment</h2>
              <button className="close-button" onClick={() => setShowBookingModal(false)}>×</button>
            </div>

            {error && (
              <div className="booking-error-message">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onModalFormSubmit)} className="booking-form">
              {/* Service Selection */}
              <div className="form-group">
                <label htmlFor="serviceId">Service *</label>
                <select
                  id="serviceId"
                  {...register('serviceId', { required: 'Please select a service' })}
                  className="form-select"
                >
                  <option value="">Select a service</option>
                  {servicesData.map(service => (
                    <option key={service.id} value={service.id}>
                      {service.title}
                    </option>
                  ))}
                </select>
                {errors.serviceId && (
                  <span className="error-text">{errors.serviceId.message}</span>
                )}
              </div>

              {/* Doctor Selection */}
              <div className="form-group">
                <label htmlFor="doctorId">Doctor *</label>
                <select
                  id="doctorId"
                  {...register('doctorId', { required: 'Please select a doctor' })}
                  disabled={!watchedServiceId || availableDoctors.length === 0}
                  className="form-select"
                >
                  <option value="">
                    {!watchedServiceId 
                      ? 'Please select a service first' 
                      : availableDoctors.length === 0 
                      ? 'No doctors available for this service'
                      : 'Select a doctor'}
                  </option>
                  {availableDoctors.map(doctor => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.name} - {doctor.specialty}
                    </option>
                  ))}
                </select>
                {errors.doctorId && (
                  <span className="error-text">{errors.doctorId.message}</span>
                )}
              </div>

              {/* Date Selection */}
              <div className="form-group">
                <label htmlFor="appointmentDate">Date *</label>
                <input
                  type="date"
                  id="appointmentDate"
                  {...register('appointmentDate', { required: 'Please select a date' })}
                  min={getMinDate()}
                  max={getMaxDate()}
                  className="form-input"
                />
                <small className="form-hint">You can book appointments up to 7 days in advance</small>
                {errors.appointmentDate && (
                  <span className="error-text">{errors.appointmentDate.message}</span>
                )}
              </div>

              {/* Time Selection */}
              <div className="form-group">
                <label htmlFor="appointmentTime">Time *</label>
                <select
                  id="appointmentTime"
                  {...register('appointmentTime', { required: 'Please select a time' })}
                  disabled={!watchedDoctorId || !watchedDate || availableTimes.length === 0}
                  className="form-select"
                >
                  <option value="">
                    {!watchedDoctorId || !watchedDate
                      ? 'Please select doctor and date first'
                      : availableTimes.length === 0
                      ? 'No available time slots'
                      : 'Select a time'}
                  </option>
                  {availableTimes.map(time => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
                {watchedDate && availableTimes.length === 0 && watchedDoctorId && (
                  <small className="form-hint error-text">
                    No available time slots for this date. Please select another date.
                  </small>
                )}
                {errors.appointmentTime && (
                  <span className="error-text">{errors.appointmentTime.message}</span>
                )}
              </div>

              {/* Submit Button */}
              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowBookingModal(false);
                    reset();
                    setAvailableDoctors([]);
                    setAvailableTimes([]);
                    setError('');
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Processing...' : 'Confirm and Pay'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointment;
