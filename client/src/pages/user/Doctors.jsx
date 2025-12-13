import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import './Doctors.css';

// Mock Data for Doctors
const doctorsData = [
  { 
    id: 1, 
    name: 'Dr. Sarah Cameron', 
    specialty: 'Senior Embryologist', 
    services: ['ivf', 'egg-freezing'], 
    experience: '15 Years',
    successRate: '92%',
    patients: '500+',
    education: 'MD, PhD in Reproductive Medicine',
    image: '👩‍⚕️'
  },
  { 
    id: 2, 
    name: 'Dr. Michael Ross', 
    specialty: 'Infertility Specialist', 
    services: ['ivf', 'iui'], 
    experience: '12 Years',
    successRate: '88%',
    patients: '450+',
    education: 'MD, Board Certified Reproductive Endocrinologist',
    image: '👨‍⚕️'
  },
  { 
    id: 3, 
    name: 'Dr. Emily Chen', 
    specialty: 'Reproductive Geneticist', 
    services: ['genetic-testing', 'donor-program'], 
    experience: '10 Years',
    successRate: '95%',
    patients: '380+',
    education: 'MD, PhD in Genetics',
    image: '👩‍⚕️'
  },
  { 
    id: 4, 
    name: 'Dr. James Wilson', 
    specialty: 'Urologist & Andrologist', 
    services: ['icsi', 'male-fertility'], 
    experience: '18 Years',
    successRate: '90%',
    patients: '600+',
    education: 'MD, FACS, Urology Specialist',
    image: '👨‍⚕️'
  },
  { 
    id: 5, 
    name: 'Dr. Anita Roy', 
    specialty: 'Gynecologist & Obstetrician', 
    services: ['iui', 'ivf'], 
    experience: '20 Years',
    successRate: '94%',
    patients: '700+',
    education: 'MD, FRCOG, OB-GYN Specialist',
    image: '👩‍⚕️'
  },
  { 
    id: 6, 
    name: 'Dr. Robert Kim', 
    specialty: 'Fertility Surgeon', 
    services: ['fertility-surgery', 'ivf'], 
    experience: '14 Years',
    successRate: '89%',
    patients: '420+',
    education: 'MD, FACS, Minimally Invasive Surgery',
    image: '👨‍⚕️'
  },
  { 
    id: 7, 
    name: 'Dr. Lisa Thompson', 
    specialty: 'Reproductive Endocrinologist', 
    services: ['surrogacy', 'donor-program'], 
    experience: '11 Years',
    successRate: '91%',
    patients: '350+',
    education: 'MD, REI Board Certified',
    image: '👩‍⚕️'
  },
  { 
    id: 8, 
    name: 'Dr. David Martinez', 
    specialty: 'IVF Laboratory Director', 
    services: ['ivf', 'icsi', 'egg-freezing'], 
    experience: '16 Years',
    successRate: '93%',
    patients: '550+',
    education: 'PhD, HCLD, Embryology Specialist',
    image: '👨‍⚕️'
  }
];

// Service name mapping for display
const serviceNameMap = {
  'ivf': 'IVF',
  'iui': 'IUI',
  'icsi': 'ICSI',
  'egg-freezing': 'Egg Freezing',
  'genetic-testing': 'Genetic Testing',
  'donor-program': 'Donor Program',
  'male-fertility': 'Male Fertility',
  'surrogacy': 'Surrogacy',
  'fertility-surgery': 'Fertility Surgery'
};

const Doctors = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  
  // Filter doctors based on serviceId
  const filteredDoctors = serviceId 
    ? doctorsData.filter(doc => doc.services.includes(serviceId))
    : doctorsData;

  // Get service display name
  const serviceTitle = serviceId 
    ? serviceNameMap[serviceId] || serviceId.replace(/-/g, ' ').toUpperCase()
    : 'All Specialists';

  // Scroll animation logic
  useEffect(() => {
    window.scrollTo(0, 0);
    
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

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, [serviceId]);

  // Handle appointment booking
  const handleBookAppointment = (doctorId) => {
    navigate(`/appointment?doctorId=${doctorId}`);
  };

  return (
    <div className="doctors-page">
      <div className="content-wrapper">
        
        {/* Header Section */}
        <section className="doctors-header animate-on-scroll slide-up">
          <Link to="/services" className="back-link">
            <span className="back-arrow">←</span> Back to Services
          </Link>
          
          <div className="header-content">
            <span className="badge">Meet Our Experts</span>
            <h1>
              {serviceId ? (
                <>
                  <span className="text-gradient">{serviceTitle}</span> Specialists
                </>
              ) : (
                <>
                  Our <span className="text-gradient">Medical Team</span>
                </>
              )}
            </h1>
            <p className="header-subtext">
              {serviceId 
                ? `Highly qualified specialists dedicated to ${serviceTitle} treatments.`
                : 'World-renowned fertility experts committed to your success.'
              }
            </p>
          </div>
        </section>

        {/* Doctors Grid */}
        <section className="doctors-grid-section">
          {filteredDoctors.length > 0 ? (
            <div className="doctors-grid">
              {filteredDoctors.map((doctor, index) => (
                <div
                  key={doctor.id}
                  className={`doctor-card animate-on-scroll slide-up delay-${(index % 3) * 100}`}
                >
                  {/* Doctor Image */}
                  <div className="doctor-image-wrapper">
                    <div className="doctor-image">
                      <span className="doctor-emoji">{doctor.image}</span>
                    </div>
                    <div className="image-overlay"></div>
                    <div className="success-badge">
                      <span className="success-rate">{doctor.successRate}</span>
                      <span className="success-label">Success Rate</span>
                    </div>
                  </div>

                  {/* Doctor Info */}
                  <div className="doctor-info">
                    <span className="specialty-badge">{doctor.specialty}</span>
                    <h3>{doctor.name}</h3>
                    <p className="education">{doctor.education}</p>
                    
                    {/* Stats */}
                    <div className="doctor-stats">
                      <div className="stat-item">
                        <span className="stat-icon">🎓</span>
                        <span className="stat-value">{doctor.experience}</span>
                        <span className="stat-label">Experience</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-icon">🏥</span>
                        <span className="stat-value">{doctor.patients}</span>
                        <span className="stat-label">Patients</span>
                      </div>
                    </div>

                    {/* Services Tags */}
                    <div className="services-tags">
                      {doctor.services.slice(0, 2).map((service) => (
                        <span key={service} className="service-tag">
                          {serviceNameMap[service] || service}
                        </span>
                      ))}
                      {doctor.services.length > 2 && (
                        <span className="service-tag more">+{doctor.services.length - 2}</span>
                      )}
                    </div>

                    {/* Action Button */}
                    <button 
                      className="btn btn-primary"
                      onClick={() => handleBookAppointment(doctor.id)}
                    >
                      Book Appointment
                    </button>
                  </div>

                  {/* Card Hover Effect */}
                  <div className="card-hover-effect"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-doctors-found animate-on-scroll fade-in">
              <div className="empty-state">
                <div className="empty-icon">👨‍⚕️</div>
                <h3>No Specialists Found</h3>
                <p>We don't have specialists specifically for this service category yet, but our general team is ready to help.</p>
                <div className="empty-actions">
                  <Link to="/services" className="btn btn-secondary">
                    Browse All Services
                  </Link>
                  <button className="btn btn-primary">
                    Contact Support
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* CTA Section */}
        {filteredDoctors.length > 0 && (
          <section className="doctors-cta animate-on-scroll fade-in">
            <div className="cta-card">
              <h2>Need Help Choosing a Doctor?</h2>
              <p>Our patient coordinators can help you find the perfect specialist for your needs.</p>
              <button className="btn btn-white">Get Personalized Recommendation</button>
            </div>
          </section>
        )}

      </div>
    </div>
  );
};

export default Doctors;


