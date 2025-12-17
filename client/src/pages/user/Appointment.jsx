import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './Doctors.css'; // Make sure this file exists!

// Mock Data for Doctors
const doctorsData = [
  { id: 1, name: 'Dr. Sarah Cameron', specialty: 'Senior Embryologist', services: ['ivf', 'egg-freezing'], exp: '15 Years' },
  { id: 2, name: 'Dr. Michael Ross', specialty: 'Infertility Specialist', services: ['ivf', 'iui'], exp: '12 Years' },
  { id: 3, name: 'Dr. Emily Chen', specialty: 'Reproductive Genetisist', services: ['genetic-testing', 'donor-program'], exp: '10 Years' },
  { id: 4, name: 'Dr. James Wilson', specialty: 'Urologist & Andrologist', services: ['icsi', 'male-fertility'], exp: '18 Years' },
  { id: 5, name: 'Dr. Anita Roy', specialty: 'Gynecologist & Obstetrician', services: ['iui', 'ivf'], exp: '20 Years' },
];

const Doctors = () => {
  const { serviceId } = useParams();
  
  // Logic: If serviceId exists (from URL), filter doctors. Otherwise, show all.
  const filteredDoctors = serviceId 
    ? doctorsData.filter(doc => doc.services.includes(serviceId))
    : doctorsData;

  const serviceTitle = serviceId 
    ? serviceId.replace(/-/g, ' ').toUpperCase() 
    : 'ALL SPECIALISTS';

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [serviceId]);

  return (
    <div className="doctors-page">
      <div className="content-wrapper">
        
        {/* Header */}
        <div className="doctors-header animate-on-scroll slide-up">
          <Link to="/services" className="back-link">&larr; Back to Services</Link>
          <h1>Meet Our {serviceTitle} Experts</h1>
          <p>Highly qualified specialists dedicated to your success.</p>
        </div>

        {/* Doctors Grid */}
        <div className="doctors-grid-wrapper">
          {filteredDoctors.length > 0 ? (
            filteredDoctors.map((doc) => (
              <div key={doc.id} className="doctor-profile-card fade-in">
                <div className="doc-image-box">
                  <div className="placeholder-img">👨‍⚕️</div>
                </div>
                <div className="doc-content">
                  <span className="doc-badge">{doc.specialty}</span>
                  <h3>{doc.name}</h3>
                  <div className="doc-meta">
                    <span>🎓 {doc.exp} Experience</span>
                    <span>🏥 500+ Success Stories</span>
                  </div>
                  <button className="btn btn-outline-primary">Book Appointment</button>
                </div>
              </div>
            ))
          ) : (
            <div className="no-docs-found">
              <p>No specialists found for this category specifically, but our general team is ready to help.</p>
              <button className="btn btn-primary">Contact Support</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Doctors;