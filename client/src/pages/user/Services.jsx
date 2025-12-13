import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Services.css';

// IVF-related services data
const servicesData = [
  {
    id: 'ivf',
    title: 'In Vitro Fertilization (IVF)',
    description: 'Advanced assisted reproductive technology with high success rates. Our state-of-the-art lab ensures optimal embryo development.',
    icon: '🔬',
    color: '#14C38E'
  },
  {
    id: 'iui',
    title: 'Intrauterine Insemination (IUI)',
    description: 'A less invasive fertility treatment option. Perfect for couples seeking a natural approach with medical assistance.',
    icon: '💉',
    color: '#00FFAB'
  },
  {
    id: 'icsi',
    title: 'Intracytoplasmic Sperm Injection',
    description: 'Precision technique for male infertility. Direct sperm injection into eggs for improved fertilization success.',
    icon: '🔬',
    color: '#14C38E'
  },
  {
    id: 'egg-freezing',
    title: 'Egg Freezing & Preservation',
    description: 'Preserve your fertility for the future. Advanced cryopreservation technology with excellent survival rates.',
    icon: '❄️',
    color: '#00FFAB'
  },
  {
    id: 'genetic-testing',
    title: 'Genetic Testing & Screening',
    description: 'Comprehensive pre-implantation genetic testing to ensure healthy embryos and reduce genetic disorders.',
    icon: '🧬',
    color: '#14C38E'
  },
  {
    id: 'donor-program',
    title: 'Egg & Sperm Donor Program',
    description: 'Access to carefully screened donors. Comprehensive matching process with full medical history and genetic screening.',
    icon: '🤝',
    color: '#00FFAB'
  },
  {
    id: 'male-fertility',
    title: 'Male Fertility Treatment',
    description: 'Specialized care for male infertility issues. Advanced diagnostics and treatment options for optimal results.',
    icon: '👨‍⚕️',
    color: '#14C38E'
  },
  {
    id: 'surrogacy',
    title: 'Surrogacy Services',
    description: 'Comprehensive surrogacy program with legal support. Matching with qualified surrogates and full-cycle management.',
    icon: '🤱',
    color: '#00FFAB'
  },
  {
    id: 'fertility-surgery',
    title: 'Fertility Surgery',
    description: 'Minimally invasive surgical procedures to address structural issues affecting fertility. Expert surgical team.',
    icon: '⚕️',
    color: '#14C38E'
  }
];

// Doctors data (matching Doctors.jsx)
const doctorsData = [
  { 
    id: 1, 
    name: 'Dr. Sarah Cameron', 
    specialty: 'Senior Embryologist', 
    services: ['ivf', 'egg-freezing']
  },
  { 
    id: 2, 
    name: 'Dr. Michael Ross', 
    specialty: 'Infertility Specialist', 
    services: ['ivf', 'iui']
  },
  { 
    id: 3, 
    name: 'Dr. Emily Chen', 
    specialty: 'Reproductive Geneticist', 
    services: ['genetic-testing', 'donor-program']
  },
  { 
    id: 4, 
    name: 'Dr. James Wilson', 
    specialty: 'Urologist & Andrologist', 
    services: ['icsi', 'male-fertility']
  },
  { 
    id: 5, 
    name: 'Dr. Anita Roy', 
    specialty: 'Gynecologist & Obstetrician', 
    services: ['iui', 'ivf']
  },
  { 
    id: 6, 
    name: 'Dr. Robert Kim', 
    specialty: 'Fertility Surgeon', 
    services: ['fertility-surgery', 'ivf']
  },
  { 
    id: 7, 
    name: 'Dr. Lisa Thompson', 
    specialty: 'Reproductive Endocrinologist', 
    services: ['surrogacy', 'donor-program']
  },
  { 
    id: 8, 
    name: 'Dr. David Martinez', 
    specialty: 'IVF Laboratory Director', 
    services: ['ivf', 'icsi', 'egg-freezing']
  }
];

// Available time slots
const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30'
];

const Services = () => {
  const navigate = useNavigate();
  
  // Booking form state
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [formData, setFormData] = useState({
    serviceId: '',
    doctorId: '',
    appointmentDate: '',
    appointmentTime: ''
  });
  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  // Scroll animation logic
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, observerOptions);

    const elements = document.querySelectorAll('.animate-on-scroll');
    elements.forEach((el) => observer.observe(el));

    // Cleanup
    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  // Update available times when doctor or date changes
  useEffect(() => {
    if (formData.doctorId && formData.appointmentDate) {
      updateAvailableTimes(formData.appointmentDate);
    } else {
      setAvailableTimes([]);
    }
  }, [formData.doctorId, formData.appointmentDate, updateAvailableTimes]);

  // Handle service card click - navigate to doctors page filtered by service
  const handleServiceClick = (serviceId) => {
    navigate(`/services/${serviceId}/doctors`);
  };

  // Handle book new appointment button click
  const handleBookAppointment = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login?redirect=/services');
      return;
    }
    setShowBookingForm(true);
    setError('');
    setSuccess('');
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    setFormData({
      serviceId: '',
      doctorId: '',
      appointmentDate: today,
      appointmentTime: ''
    });
    setAvailableDoctors([]);
    setAvailableTimes([]);
  };

  // Handle service selection
  const handleServiceChange = (e) => {
    const selectedServiceId = e.target.value;
    setFormData({
      ...formData,
      serviceId: selectedServiceId,
      doctorId: '', // Reset doctor when service changes
      appointmentTime: '' // Reset time when service changes
    });

    // Filter doctors by selected service
    if (selectedServiceId) {
      const filtered = doctorsData.filter(doc => doc.services.includes(selectedServiceId));
      setAvailableDoctors(filtered);
    } else {
      setAvailableDoctors([]);
    }
    setAvailableTimes([]);
  };

  // Handle doctor selection
  const handleDoctorChange = (e) => {
    const selectedDoctorId = e.target.value;
    setFormData({
      ...formData,
      doctorId: selectedDoctorId,
      appointmentTime: '' // Reset time when doctor changes
    });
  };

  // Handle date selection
  const handleDateChange = (e) => {
    const selectedDate = e.target.value;
    setFormData({
      ...formData,
      appointmentDate: selectedDate,
      appointmentTime: '' // Reset time when date changes
    });
  };

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

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    // Validation
    if (!formData.serviceId || !formData.doctorId || !formData.appointmentDate || !formData.appointmentTime) {
      setError('Please fill in all fields');
      setIsSubmitting(false);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in to book an appointment');
      setIsSubmitting(false);
      navigate('/login?redirect=/services');
      return;
    }

    try {
      // Get selected service and doctor details
      const selectedService = servicesData.find(s => s.id === formData.serviceId);
      const selectedDoctor = doctorsData.find(d => d.id === parseInt(formData.doctorId));

      const appointmentData = {
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.name,
        serviceId: selectedService.id,
        serviceName: selectedService.title,
        appointmentDate: formData.appointmentDate,
        appointmentTime: formData.appointmentTime,
        amount: 0, // You can set a default amount or calculate based on service
        notes: ''
      };

      const response = await axios.post(
        'http://localhost:3000/api/appointments/create',
        appointmentData,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setSuccess('Appointment booked successfully!');
        // Reset form
        setTimeout(() => {
          setShowBookingForm(false);
          setFormData({
            serviceId: '',
            doctorId: '',
            appointmentDate: getMinDate(),
            appointmentTime: ''
          });
          setAvailableDoctors([]);
          setAvailableTimes([]);
          setSuccess('');
          // Optionally navigate to appointments page
          // navigate('/appointment');
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book appointment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Close booking form
  const handleCloseForm = () => {
    setShowBookingForm(false);
    setError('');
    setSuccess('');
    setFormData({
      serviceId: '',
      doctorId: '',
      appointmentDate: getMinDate(),
      appointmentTime: ''
    });
    setAvailableDoctors([]);
    setAvailableTimes([]);
  };

  return (
    <div className="services-page">
      <div className="content-wrapper">
        
        {/* Header Section */}
        <section className="services-header animate-on-scroll slide-up">
          <span className="badge">Our Specialized Services</span>
          <h1>
            Comprehensive <span className="text-gradient">IVF & Fertility Care</span>
          </h1>
          <p className="header-subtext">
            World-class fertility treatments with cutting-edge technology and compassionate care. 
            Choose a service to view our specialized doctors.
          </p>
        </section>

        {/* Services Grid */}
        <section className="services-grid-section">
          <div className="services-grid">
            {servicesData.map((service, index) => (
              <div
                key={service.id}
                className={`service-card animate-on-scroll slide-up delay-${(index % 3) * 100}`}
                onClick={() => handleServiceClick(service.id)}
              >
                {/* Card Icon */}
                <div className="service-icon-wrapper">
                  <div className="service-icon" style={{ '--icon-color': service.color }}>
                    {service.icon}
                  </div>
                  <div className="icon-glow"></div>
                </div>

                {/* Card Content */}
                <div className="service-content">
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                </div>

                {/* Card Footer */}
                <div className="service-footer">
                  <span className="learn-more">
                    View Specialists <span className="arrow">→</span>
                  </span>
                </div>

                {/* Hover Effect Overlay */}
                <div className="card-overlay"></div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="services-cta animate-on-scroll fade-in">
          <div className="cta-card">
            <h2>Ready to Book Your Appointment?</h2>
            <p>Schedule your consultation with our expert team today.</p>
            <button className="btn btn-primary" onClick={handleBookAppointment}>
              Book New Appointment
            </button>
          </div>
        </section>

      </div>

      {/* Booking Form Modal */}
      {showBookingForm && (
        <div className="booking-modal-overlay" onClick={handleCloseForm}>
          <div className="booking-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="booking-modal-header">
              <h2>Book New Appointment</h2>
              <button className="close-button" onClick={handleCloseForm}>×</button>
            </div>

            {error && (
              <div className="booking-error-message">
                {error}
              </div>
            )}

            {success && (
              <div className="booking-success-message">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="booking-form">
              {/* Service Selection */}
              <div className="form-group">
                <label htmlFor="serviceId">Service *</label>
                <select
                  id="serviceId"
                  name="serviceId"
                  value={formData.serviceId}
                  onChange={handleServiceChange}
                  required
                  className="form-select"
                >
                  <option value="">Select a service</option>
                  {servicesData.map(service => (
                    <option key={service.id} value={service.id}>
                      {service.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Doctor Selection */}
              <div className="form-group">
                <label htmlFor="doctorId">Doctor *</label>
                <select
                  id="doctorId"
                  name="doctorId"
                  value={formData.doctorId}
                  onChange={handleDoctorChange}
                  required
                  disabled={!formData.serviceId || availableDoctors.length === 0}
                  className="form-select"
                >
                  <option value="">
                    {!formData.serviceId 
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
              </div>

              {/* Date Selection */}
              <div className="form-group">
                <label htmlFor="appointmentDate">Date *</label>
                <input
                  type="date"
                  id="appointmentDate"
                  name="appointmentDate"
                  value={formData.appointmentDate}
                  onChange={handleDateChange}
                  min={getMinDate()}
                  max={getMaxDate()}
                  required
                  className="form-input"
                />
                <small className="form-hint">You can book appointments up to 7 days in advance</small>
              </div>

              {/* Time Selection */}
              <div className="form-group">
                <label htmlFor="appointmentTime">Time *</label>
                <select
                  id="appointmentTime"
                  name="appointmentTime"
                  value={formData.appointmentTime}
                  onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })}
                  required
                  disabled={!formData.doctorId || !formData.appointmentDate || availableTimes.length === 0}
                  className="form-select"
                >
                  <option value="">
                    {!formData.doctorId || !formData.appointmentDate
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
                {formData.appointmentDate && availableTimes.length === 0 && formData.doctorId && (
                  <small className="form-hint error-text">
                    No available time slots for this date. Please select another date.
                  </small>
                )}
              </div>

              {/* Submit Button */}
              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={handleCloseForm}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Booking...' : 'Confirm and Pay'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Services;


