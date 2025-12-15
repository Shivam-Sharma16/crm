import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { useAppDispatch, useAuth, useAppointments, useCachedServices, useCachedDoctors } from '../../store/hooks';
import { fetchAppointments, createAppointment } from '../../store/slices/appointmentSlice';
import { fetchServices, fetchDoctors } from '../../store/slices/publicDataSlice';
import './Appointment.css';

// Available time slots
const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30'
];

const Appointment = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  const doctorId = searchParams.get('doctorId'); // Keep as string for MongoDB ObjectId
  
  // Redux state
  const { isAuthenticated, user } = useAuth();
  const { appointments, loading: appointmentsLoading } = useAppointments();
  const { services: servicesData, loading: servicesLoading, isCached: servicesCached } = useCachedServices();
  const { doctors: doctorsData, loading: doctorsLoading, isCached: doctorsCached } = useCachedDoctors();
  
  const [filter, setFilter] = useState('all'); // all, upcoming, past
  const isLoadingData = servicesLoading || doctorsLoading;
  
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

  // Fetch services and doctors from database using Redux
  useEffect(() => {
    dispatch(fetchServices());
    dispatch(fetchDoctors());
  }, [dispatch]);

  // Check authentication and fetch appointments
  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login?redirect=/appointment' + (doctorId ? `?doctorId=${doctorId}` : ''));
      return;
    }
    
    // Fetch appointments using Redux
    dispatch(fetchAppointments());

    // If doctorId is present, set up booking form (wait for doctors to load)
    if (doctorId && doctorsData.length > 0) {
      const doctor = doctorsData.find(doc => doc._id === doctorId || doc.doctorId === doctorId);
      if (doctor) {
        setSelectedDoctor(doctor);
        const today = new Date().toISOString().split('T')[0];
        setFormData(prev => ({ ...prev, appointmentDate: today }));
      } else {
        setError('Doctor not found');
      }
    }
  }, [doctorId, navigate, doctorsData, isAuthenticated, user, dispatch]);

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
    if (watchedServiceId && doctorsData.length > 0) {
      // Filter doctors whose services array includes the selected serviceId
      const filtered = doctorsData.filter(doc => 
        doc.services && doc.services.includes(watchedServiceId)
      );
      setAvailableDoctors(filtered);
      // Reset doctor selection when service changes
      setValue('doctorId', '');
      setValue('appointmentTime', '');
    } else {
      setAvailableDoctors([]);
      setValue('doctorId', '');
    }
  }, [watchedServiceId, setValue, doctorsData]);

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
      const selectedDoctor = doctorsData.find(d => 
        d._id === data.doctorId || d.doctorId === data.doctorId
      );

      if (!selectedService || !selectedDoctor) {
        setError('Selected service or doctor not found');
        setIsSubmitting(false);
        return;
      }

      const appointmentData = {
        doctorId: selectedDoctor._id || selectedDoctor.doctorId,
        doctorName: selectedDoctor.name,
        serviceId: selectedService.id,
        serviceName: selectedService.title,
        appointmentDate: data.appointmentDate,
        appointmentTime: data.appointmentTime,
        amount: selectedService.price || 0,
        notes: ''
      };

      const result = await dispatch(createAppointment(appointmentData));
      
      if (createAppointment.fulfilled.match(result)) {
        // Close modal and refresh appointments
        setShowBookingModal(false);
        reset();
        setAvailableDoctors([]);
        setAvailableTimes([]);
        // Refresh appointments list
        dispatch(fetchAppointments());
      } else {
        setError(result.payload || 'Failed to book appointment. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book appointment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Appointments are now fetched via Redux in useEffect

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
      const appointmentData = {
        doctorId: selectedDoctor._id || selectedDoctor.doctorId,
        doctorName: selectedDoctor.name,
        serviceId: selectedDoctor.services && selectedDoctor.services[0] ? selectedDoctor.services[0] : '',
        serviceName: selectedDoctor.services && selectedDoctor.services[0] 
          ? servicesData.find(s => s.id === selectedDoctor.services[0])?.title || selectedDoctor.services[0]
          : '',
        appointmentDate: formData.appointmentDate,
        appointmentTime: formData.appointmentTime,
        amount: selectedDoctor.consultationFee || 500,
        notes: formData.notes
      };

      const result = await dispatch(createAppointment(appointmentData));

      if (createAppointment.fulfilled.match(result)) {
        // Refresh appointments list
        dispatch(fetchAppointments());
        // Clear form and remove doctorId from URL
        setFormData({ appointmentDate: '', appointmentTime: '', notes: '' });
        navigate('/appointment', { replace: true });
        setSelectedDoctor(null);
      } else {
        setError(result.payload || 'Failed to create appointment');
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
            {appointmentsLoading ? (
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
                  {isLoadingData ? (
                    <option value="" disabled>Loading services...</option>
                  ) : servicesData.length > 0 ? (
                    servicesData.map(service => (
                      <option key={service.id || service._id} value={service.id || service._id}>
                        {service.title}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No services available</option>
                  )}
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
                      : isLoadingData
                      ? 'Loading doctors...'
                      : availableDoctors.length === 0 
                      ? 'No doctors available for this service'
                      : 'Select a doctor'}
                  </option>
                  {availableDoctors.map(doctor => (
                    <option key={doctor._id || doctor.doctorId} value={doctor._id || doctor.doctorId}>
                      {doctor.name} - {doctor.specialty || 'General Practitioner'}
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
