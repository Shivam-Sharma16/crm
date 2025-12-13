import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();

  // Logic to handle scroll animations
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

  return (
    <div className="home-container">
      
      {/* --- HERO SECTION --- */}
      <section className="hero-section">
        <div className="hero-bg-shape"></div>
        <div className="content-wrapper hero-grid">
          <div className="hero-text animate-on-scroll slide-up">
            <span className="badge">Welcome to MediCare Prime</span>
            <h1>
              Next Generation <br />
              <span className="text-gradient">Medical Care</span>
            </h1>
            <p className="hero-subtext">
              Experience the future of healthcare. We combine advanced technology 
              with compassionate care to ensure your well-being is always prioritized.
            </p>
            <div className="hero-buttons">
              <button 
                className="btn btn-primary"
                onClick={() => navigate('/services')}
              >
                Book Consultation
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => navigate('/services')}
              >
                View Services
              </button>
            </div>
            
            <div className="stats-row">
              <div className="stat-item">
                <strong>15k+</strong>
                <span>Happy Patients</span>
              </div>
              <div className="stat-item">
                <strong>4.9</strong>
                <span>Average Rating</span>
              </div>
            </div>
          </div>

          <div className="hero-visual animate-on-scroll fade-in delay-200">
            {/* CSS-based Abstract Medical Visualization */}
            <div className="visual-card main-card">
              <div className="card-icon">🩺</div>
              <h3>Expert Diagnosis</h3>
              <p>Precision AI-driven insights.</p>
            </div>
            <div className="visual-card floating-card-1">
              <span>❤️</span> 24/7 Support
            </div>
            <div className="visual-card floating-card-2">
              <span>🛡️</span> Top Specialists
            </div>
          </div>
        </div>
      </section>

      {/* --- WHY CHOOSE US SECTION --- */}
      <section className="section features-section">
        <div className="content-wrapper">
          <div className="section-header animate-on-scroll slide-up">
            <h2>Why Choose Us</h2>
            <p>Redefining standards in modern healthcare.</p>
          </div>
          
          <div className="features-grid">
            <div className="feature-card animate-on-scroll slide-up delay-100">
              <div className="icon-box">🔬</div>
              <h3>Advanced Lab</h3>
              <p>State-of-the-art diagnostic centers ensuring 100% precision in reports.</p>
            </div>
            <div className="feature-card animate-on-scroll slide-up delay-200">
              <div className="icon-box">👨‍⚕️</div>
              <h3>Qualified Doctors</h3>
              <p>A team of world-renowned specialists dedicated to your recovery.</p>
            </div>
            <div className="feature-card animate-on-scroll slide-up delay-300">
              <div className="icon-box">🚑</div>
              <h3>Emergency Care</h3>
              <p>Rapid response teams and ambulance services available 24/7.</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- SERVICES SECTION --- */}
      <section className="section services-section">
        <div className="content-wrapper">
          <div className="section-header animate-on-scroll slide-up">
            <h2>Our Medical Services</h2>
            <p>Comprehensive treatments for you and your family.</p>
          </div>

          <div className="services-grid">
            {['Cardiology', 'Neurology', 'Dental Care', 'Pediatrics', 'Eye Care', 'Orthopedics'].map((service, index) => (
              <div key={index} className={`service-card animate-on-scroll slide-up delay-${(index % 3) * 100}`}>
                <div className="service-icon-wrapper">
                  <div className="dot"></div>
                </div>
                <h3>{service}</h3>
                <p>Leading specialists providing top-tier {service.toLowerCase()} treatments.</p>
                <a href="#learn-more" className="learn-more">Learn More &rarr;</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- DOCTORS SECTION --- */}
      <section className="section doctors-section">
        <div className="content-wrapper">
          <div className="section-header animate-on-scroll slide-up">
            <h2>Meet Our Specialists</h2>
            <p>Trust your health with the best hands in the industry.</p>
          </div>

          <div className="doctors-grid">
            {[1, 2, 3, 4].map((doc, idx) => (
              <div key={idx} className="doctor-card animate-on-scroll fade-in">
                <div className="doctor-img-placeholder"></div>
                <div className="doctor-info">
                  <h3>Dr. Alex Cameron</h3>
                  <span className="specialty">Senior Surgeon</span>
                  <div className="social-dots">
                    <span>•</span><span>•</span><span>•</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- TESTIMONIALS SECTION --- */}
      <section className="section testimonials-section">
        <div className="content-wrapper">
          <h2 className="animate-on-scroll slide-up">Patient Success Stories</h2>
          <div className="testimonials-row animate-on-scroll slide-up delay-200">
            <div className="testimonial-card">
              <div className="quote-icon">“</div>
              <p>The level of care and technology used at MediCare Prime is unmatched. I felt safe and cared for every step of the way.</p>
              <h4>- Sarah Jenkins</h4>
            </div>
            <div className="testimonial-card">
              <div className="quote-icon">“</div>
              <p>Professional, clean, and incredibly efficient. The doctors took the time to explain everything to me clearly.</p>
              <h4>- Michael Ross</h4>
            </div>
          </div>
        </div>
      </section>

      {/* --- CTA SECTION --- */}
      <section className="cta-section animate-on-scroll zoom-in">
        <div className="cta-content">
          <h2>Ready to Prioritize Your Health?</h2>
          <p>Book an appointment today and experience the difference.</p>
          <button 
            className="btn btn-white"
            onClick={() => navigate('/services')}
          >
            Schedule Appointment
          </button>
        </div>
      </section>

    </div>
  );
};

export default Home;