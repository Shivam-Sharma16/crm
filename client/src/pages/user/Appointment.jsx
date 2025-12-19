import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAppDispatch, useAuth, useAppointments, useCachedServices, useCachedDoctors } from '../../store/hooks';
import { fetchAppointments, createAppointment } from '../../store/slices/appointmentSlice';
import { fetchServices, fetchDoctors } from '../../store/slices/publicDataSlice';
import './Appointment.css';

// Base available time slots
const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30'
];

const Appointment = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  const doctorId = searchParams.get('doctorId');
  
  // Redux state
  const { isAuthenticated, user } = useAuth();
  const { appointments, loading: appointmentsLoading } = useAppointments();
  const { services: servicesData, loading: servicesLoading } = useCachedServices();
  const { doctors: doctorsData, loading: doctorsLoading } = useCachedDoctors();
  
  const [filter, setFilter] = useState('all'); 
  
  // Booking form state
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
  const watchedTime = watch('appointmentTime');

  useEffect(() => {
    dispatch(fetchServices());
    dispatch(fetchDoctors());
  }, [dispatch]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login?redirect=/appointment' + (doctorId ? `?doctorId=${doctorId}` : ''));
      return;
    }
    
    dispatch(fetchAppointments());

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

  const updateAvailableTimes = useCallback((selectedDate) => {
    if (!selectedDate) {
      setAvailableTimes([]);
      return;
    }

    let times = [...timeSlots];

    // 1. Filter by Doctor's Schedule
    const currentDoctorId = watchedDoctorId || (selectedDoctor ? (selectedDoctor._id || selectedDoctor.doctorId) : null);
    
    if (currentDoctorId && doctorsData.length > 0) {
        const doctor = doctorsData.find(d => d._id === currentDoctorId || d.doctorId === currentDoctorId);
        
        if (doctor && doctor.availability) {
            const dateObj = new Date(selectedDate);
            const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const dayName = days[dateObj.getDay()];
            const daySchedule = doctor.availability[dayName];

            // FIX: Only block if schedule exists AND is strictly unavailable
            if (daySchedule && daySchedule.available === false) {
                setAvailableTimes([]); // Doctor explicitly not working this day
                return;
            }

            if (daySchedule && daySchedule.startTime && daySchedule.endTime) {
                const getMinutes = (t) => {
                    const [h, m] = t.split(':').map(Number);
                    return h * 60 + m;
                };

                const startMin = getMinutes(daySchedule.startTime);
                const endMin = getMinutes(daySchedule.endTime);

                times = times.filter(t => {
                    const tMin = getMinutes(t);
                    // Appointment must start strictly before end time
                    return tMin >= startMin && tMin < endMin;
                });
            }
        }
    }

    // 2. Filter by Current Time (if Today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDateObj = new Date(selectedDate);
    selectedDateObj.setHours(0, 0, 0, 0);
    const now = new Date();
    
    if (selectedDateObj.getTime() === today.getTime()) {
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTimeInMinutes = currentHour * 60 + currentMinute;

      times = times.filter(time => {
        const [hours, minutes] = time.split(':').map(Number);
        const timeInMinutes = hours * 60 + minutes;
        // Buffer: Must be at least 30 mins from now
        return timeInMinutes > (currentTimeInMinutes + 30);
      });
    }

    setAvailableTimes(times);
  }, [watchedDoctorId, doctorsData, selectedDoctor]);

  useEffect(() => {
    if (watchedServiceId && doctorsData.length > 0) {
      const filtered = doctorsData.filter(doc => 
        doc.services && doc.services.some(s => s === watchedServiceId || s.id === watchedServiceId)
      );
      setAvailableDoctors(filtered.length > 0 ? filtered : doctorsData);
      setValue('doctorId', '');
      setValue('appointmentTime', '');
    } else {
      setAvailableDoctors(doctorsData);
      setValue('doctorId', '');
    }
  }, [watchedServiceId, setValue, doctorsData]);

  useEffect(() => {
    if (watchedDate) {
      updateAvailableTimes(watchedDate);
      setValue('appointmentTime', ''); // Clear time when date changes
    } else {
      setAvailableTimes([]);
      setValue('appointmentTime', '');
    }
  }, [watchedDoctorId, watchedDate, updateAvailableTimes, setValue]);
  
  // Also update times when looking at a specific doctor page and changing date
  useEffect(() => {
      if (selectedDoctor && formData.appointmentDate) {
          updateAvailableTimes(formData.appointmentDate);
      }
  }, [selectedDoctor, formData.appointmentDate, updateAvailableTimes]);


  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 14);
    return maxDate.toISOString().split('T')[0];
  };

  const getMinDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const onModalFormSubmit = async (data) => {
    setError('');
    
    // Explicit Validation Check
    if (!data.appointmentTime) {
        setError('Please select a valid time slot.');
        return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You must be logged in to book an appointment');
        setIsSubmitting(false);
        navigate('/login?redirect=/appointment');
        return;
      }

      const selectedService = servicesData.find(s => s.id === data.serviceId || s._id === data.serviceId);
      const selectedDoc = doctorsData.find(d => 
        d._id === data.doctorId || d.doctorId === data.doctorId
      );

      if (!selectedDoc) {
        setError('Selected doctor not found');
        setIsSubmitting(false);
        return;
      }

      const appointmentData = {
        doctorId: selectedDoc._id, // Prefer _id for DB linking
        doctorName: selectedDoc.name,
        serviceId: selectedService ? (selectedService.id || selectedService._id) : 'general',
        serviceName: selectedService ? (selectedService.title || selectedService.name) : 'General Consultation',
        appointmentDate: data.appointmentDate,
        appointmentTime: data.appointmentTime,
        amount: (selectedService && selectedService.price) ? selectedService.price : (selectedDoc.consultationFee || 500),
        notes: ''
      };

      const result = await dispatch(createAppointment(appointmentData));
      
      if (createAppointment.fulfilled.match(result)) {
        setShowBookingModal(false);
        reset();
        setAvailableDoctors([]);
        setAvailableTimes([]);
        dispatch(fetchAppointments());
      } else {
        setError(result.payload || 'Failed to book appointment.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book appointment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAppointments = appointments.filter(apt => {
    if (filter === 'all') return true;
    const appointmentDateTime = new Date(`${apt.appointmentDate}T${apt.appointmentTime}`);
    const now = new Date();
    if (filter === 'upcoming') return appointmentDateTime >= now;
    else if (filter === 'past') return appointmentDateTime < now;
    return true;
  });

  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    const dateA = new Date(`${a.appointmentDate}T${a.appointmentTime}`);
    const dateB = new Date(`${b.appointmentDate}T${b.appointmentTime}`);
    const now = new Date();
    if (dateA >= now && dateB < now) return -1;
    if (dateA < now && dateB >= now) return 1;
    return dateB - dateA;
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

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
      const selectedService = selectedDoctor.services && selectedDoctor.services[0] 
        ? servicesData.find(s => s.id === selectedDoctor.services[0])
        : null;

      const appointmentData = {
        doctorId: selectedDoctor._id, // Prefer _id for DB linking
        doctorName: selectedDoctor.name,
        serviceId: selectedService ? selectedService.id : (selectedDoctor.services ? selectedDoctor.services[0] : ''),
        serviceName: selectedService ? selectedService.title : '',
        appointmentDate: formData.appointmentDate,
        appointmentTime: formData.appointmentTime,
        amount: selectedDoctor.consultationFee || 500,
        notes: formData.notes
      };

      const result = await dispatch(createAppointment(appointmentData));

      if (createAppointment.fulfilled.match(result)) {
        dispatch(fetchAppointments());
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isUpcoming = (appointmentDate, appointmentTime) => {
    const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
    return appointmentDateTime >= new Date();
  };

  if (!isAuthenticated) {
    return (
      <div className="appointment-page">
        <div className="content-wrapper"><div className="loading-state"><p>Loading...</p></div></div>
      </div>
    );
  }

  return (
    <div className="appointment-page">
      <div className="content-wrapper">
        
        <section className="appointment-header animate-on-scroll slide-up">
          <div className="header-content">
            <span className="badge">My Appointments</span>
            <h1>Your <span className="text-gradient">Appointments</span></h1>
            <p className="header-subtext">View and manage all your appointments in one place.</p>
          </div>
          <div className="header-actions">
            <button
              onClick={() => {
                setShowBookingModal(true);
                const today = new Date().toISOString().split('T')[0];
                reset({ serviceId: '', doctorId: '', appointmentDate: today, appointmentTime: '' });
                setAvailableDoctors([]);
                setAvailableTimes([]);
                setError('');
              }}
              className="btn btn-primary btn-book-new"
            >
              <span className="btn-icon">➕</span> Book New Appointment
            </button>
          </div>
        </section>

        {doctorId && selectedDoctor && (
          <section className="booking-form-section animate-on-scroll slide-up delay-100">
            <div className="booking-form-header">
              <h2>Schedule Appointment with {selectedDoctor.name}</h2>
              <button onClick={() => { navigate('/appointment', { replace: true }); setSelectedDoctor(null); }} className="btn-close">✕</button>
            </div>
            
             <form onSubmit={handleBookingFormSubmit} className="appointment-form">
               <div className="form-group">
                 <label htmlFor="appointmentDate">Select Date</label>
                 <input 
                   type="date" 
                   name="appointmentDate" 
                   value={formData.appointmentDate} 
                   onChange={handleInputChange} 
                   min={getMinDate()} 
                   max={getMaxDate()}
                   required 
                   className="form-input"
                 />
               </div>
               
               <div className="form-group">
                 <label htmlFor="appointmentTime">Select Time</label>
                 {availableTimes.length > 0 ? (
                   <div className="time-slots-grid">
                     {availableTimes.map(t => (
                       <button 
                         key={t} 
                         type="button" 
                         className={`time-slot-btn ${formData.appointmentTime === t ? 'selected' : ''}`} 
                         onClick={() => handleInputChange({ target: { name: 'appointmentTime', value: t } })}
                       >
                         {t}
                       </button>
                     ))}
                   </div>
                 ) : (
                   <p className="no-slots-msg">No slots available for this date.</p>
                 )}
               </div>
               
               {error && <div className="error-message">{error}</div>}
               
               <div className="form-actions">
                 <button 
                   type="submit" 
                   className="btn btn-primary" 
                   disabled={isSubmitting || !formData.appointmentTime || availableTimes.length === 0}
                 >
                   {isSubmitting ? 'Booking...' : 'Confirm Appointment'}
                 </button>
               </div>
             </form>
          </section>
        )}

        {!doctorId && (
          <section className="appointment-filters animate-on-scroll slide-up delay-100">
            <div className="filter-buttons">
              <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All Appointments</button>
              <button className={`filter-btn ${filter === 'upcoming' ? 'active' : ''}`} onClick={() => setFilter('upcoming')}>Upcoming</button>
              <button className={`filter-btn ${filter === 'past' ? 'active' : ''}`} onClick={() => setFilter('past')}>Past</button>
            </div>
          </section>
        )}

        {!doctorId && (
          <section className="appointments-list-section animate-on-scroll slide-up delay-200">
            {appointmentsLoading ? (
              <div className="loading-state"><div className="loading-spinner"></div><p>Loading appointments...</p></div>
            ) : sortedAppointments.length > 0 ? (
              <div className="appointments-grid">
                {sortedAppointments.map((appointment) => {
                  const upcoming = isUpcoming(appointment.appointmentDate, appointment.appointmentTime);
                  return (
                    <div key={appointment._id || appointment.id} className={`appointment-card ${upcoming ? 'upcoming' : 'past'}`}>
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
                            {appointment.serviceName && <p className="service-name">{appointment.serviceName}</p>}
                          </div>
                        </div>

                        <div className="appointment-details-list">
                          <div className="detail-item">
                            <span className="detail-icon">📅</span>
                            <div><span className="detail-label">Date</span><span className="detail-value">{formatDate(appointment.appointmentDate)}</span></div>
                          </div>
                          <div className="detail-item">
                            <span className="detail-icon">🕐</span>
                            <div><span className="detail-label">Time</span><span className="detail-value">{appointment.appointmentTime}</span></div>
                          </div>
                        </div>

                        {appointment.prescription && (
                            <div className="appointment-prescription" style={{marginTop: '1rem', borderTop: '1px solid #eee', paddingTop: '1rem'}}>
                                <a 
                                    href={appointment.prescription} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="btn btn-secondary" 
                                    style={{width: '100%', textAlign: 'center', display: 'block', textDecoration: 'none'}}
                                >
                                    📄 View Prescription
                                </a>
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
                  <button onClick={() => navigate('/services')} className="btn btn-primary">Book New Appointment</button>
                </div>
              </div>
            )}
          </section>
        )}
      </div>

      {showBookingModal && (
        <div className="booking-modal-overlay" onClick={() => setShowBookingModal(false)}>
          <div className="booking-modal-content" onClick={(e) => e.stopPropagation()}>
             <div className="booking-modal-header"><h2>Book New Appointment</h2><button className="close-button" onClick={()=>setShowBookingModal(false)}>×</button></div>
             <form onSubmit={handleSubmit(onModalFormSubmit)} className="booking-form">
               <div className="form-group"><label>Service *</label><select {...register('serviceId', {required:true})} className="form-select"><option value="">Select Service</option>{servicesData.map(s=><option key={s.id || s._id} value={s.id || s._id}>{s.title || s.name}</option>)}</select></div>
               <div className="form-group"><label>Doctor *</label><select {...register('doctorId', {required:true})} className="form-select"><option value="">Select Doctor</option>{availableDoctors.map(d=><option key={d._id} value={d._id}>{d.name}</option>)}</select></div>
               <div className="form-group"><label>Date *</label><input type="date" {...register('appointmentDate', {required:true})} min={getMinDate()} max={getMaxDate()} className="form-input"/></div>
               
               <div className="form-group"><label>Time *</label>
               {availableTimes.length > 0 ? (
                   <select {...register('appointmentTime', {required:true})} className="form-select">
                     <option value="">Select Time</option>
                     {availableTimes.map(t=><option key={t} value={t}>{t}</option>)}
                   </select>
               ) : (
                   <p className="text-danger">No slots available for this date/doctor.</p>
               )}
               </div>
               
               {error && <div className="error-message" style={{marginBottom: '1rem'}}>{error}</div>}
               
               <div className="form-actions">
                   <button 
                    type="submit" 
                    className="btn btn-primary" 
                    disabled={isSubmitting || availableTimes.length === 0 || !watchedTime}
                   >
                       {isSubmitting ? 'Booking...' : 'Confirm'}
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