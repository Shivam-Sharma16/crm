import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './LabReports.css';

// Mock Data for Lab Reports
// In a real app, this would come from an API call filtered by logged-in user
const labReportsData = [
  {
    id: 1,
    reportId: 'LAB-2024-001',
    patientName: 'John Doe',
    userId: 'user1', // User ID to match with logged-in user
    patientEmail: 'john.doe@example.com', // Alternative matching by email
    testType: 'Complete Blood Count (CBC)',
    testDate: '2024-01-15',
    status: 'completed',
    doctor: 'Dr. Sarah Cameron',
    results: {
      hemoglobin: '14.2 g/dL',
      wbc: '7,500 /μL',
      platelets: '250,000 /μL',
      hematocrit: '42%'
    },
    notes: 'All values within normal range. Patient is healthy.'
  },
  {
    id: 2,
    reportId: 'LAB-2024-002',
    patientName: 'Jane Smith',
    userId: 'user2',
    patientEmail: 'jane.smith@example.com',
    testType: 'Lipid Profile',
    testDate: '2024-01-18',
    status: 'completed',
    doctor: 'Dr. Michael Ross',
    results: {
      totalCholesterol: '180 mg/dL',
      ldl: '110 mg/dL',
      hdl: '55 mg/dL',
      triglycerides: '120 mg/dL'
    },
    notes: 'Cholesterol levels are optimal. Continue current diet.'
  },
  {
    id: 3,
    reportId: 'LAB-2024-003',
    patientName: 'Robert Johnson',
    userId: 'user3',
    patientEmail: 'robert.johnson@example.com',
    testType: 'Liver Function Test (LFT)',
    testDate: '2024-01-20',
    status: 'pending',
    doctor: 'Dr. Emily Chen',
    results: null,
    notes: 'Test results pending. Expected completion: 2-3 business days.'
  },
  {
    id: 4,
    reportId: 'LAB-2024-004',
    patientName: 'Maria Garcia',
    userId: 'user4',
    patientEmail: 'maria.garcia@example.com',
    testType: 'Thyroid Function Test',
    testDate: '2024-01-22',
    status: 'completed',
    doctor: 'Dr. James Wilson',
    results: {
      tsh: '2.5 mIU/L',
      t3: '120 ng/dL',
      t4: '8.5 μg/dL'
    },
    notes: 'Thyroid function is normal. No medication required.'
  },
  {
    id: 5,
    reportId: 'LAB-2024-005',
    patientName: 'David Lee',
    userId: 'user5',
    patientEmail: 'david.lee@example.com',
    testType: 'Blood Glucose Test',
    testDate: '2024-01-25',
    status: 'completed',
    doctor: 'Dr. Anita Roy',
    results: {
      fastingGlucose: '95 mg/dL',
      hba1c: '5.4%',
      randomGlucose: '110 mg/dL'
    },
    notes: 'Blood sugar levels are well controlled.'
  },
  {
    id: 6,
    reportId: 'LAB-2024-006',
    patientName: 'Sarah Williams',
    userId: 'user6',
    patientEmail: 'sarah.williams@example.com',
    testType: 'Kidney Function Test',
    testDate: '2024-01-28',
    status: 'completed',
    doctor: 'Dr. Robert Kim',
    results: {
      creatinine: '0.9 mg/dL',
      bun: '15 mg/dL',
      egfr: '90 mL/min/1.73m²'
    },
    notes: 'Kidney function is excellent. All parameters normal.'
  }
];

const LabReports = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState('all'); // all, completed, pending
  const [searchTerm, setSearchTerm] = useState('');
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication and get logged-in user from localStorage
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        setLoggedInUser(user);
        setIsLoading(false);
      } catch (e) {
        console.error('Error parsing user data:', e);
        navigate('/login?redirect=/lab-reports');
        return;
      }
    } else {
      // No token or user data, redirect to login
      navigate('/login?redirect=/lab-reports');
      return;
    }
  }, [navigate]);

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
  }, []);

  // Filter reports by logged-in user, status, and search
  useEffect(() => {
    if (isLoading) return;

    let filtered = labReportsData;

    // Filter by logged-in user
    if (loggedInUser) {
      // Try multiple matching strategies
      const userId = loggedInUser.id || loggedInUser.userId || loggedInUser._id;
      const userEmail = loggedInUser.email || loggedInUser.userEmail;
      const userName = loggedInUser.name || loggedInUser.userName || loggedInUser.fullName;

      filtered = filtered.filter(report => {
        // Match by userId
        if (userId && report.userId === userId) return true;
        
        // Match by email
        if (userEmail && report.patientEmail && 
            report.patientEmail.toLowerCase() === userEmail.toLowerCase()) return true;
        
        // Match by name (case-insensitive)
        if (userName && report.patientName && 
            report.patientName.toLowerCase() === userName.toLowerCase()) return true;
        
        return false;
      });
    } else {
      // If no user is logged in, show empty array
      filtered = [];
    }

    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter(report => report.status === filter);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(report =>
        report.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.testType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.reportId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.doctor.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setReports(filtered);
  }, [filter, searchTerm, loggedInUser, isLoading]);

  // Handle download report
  const handleDownload = (reportId) => {
    // In a real app, this would download the PDF
    alert(`Downloading report ${reportId}...`);
  };

  // Handle view details
  const handleViewDetails = (reportId) => {
    // In a real app, this would navigate to a detailed view
    alert(`Viewing details for report ${reportId}...`);
  };

  // Show loading state
  if (isLoading || !loggedInUser) {
    return (
      <div className="lab-reports-page">
        <div className="content-wrapper">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading your reports...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lab-reports-page">
      <div className="content-wrapper">
        
        {/* Header Section */}
        <section className="reports-header animate-on-scroll slide-up">
          <Link to="/" className="back-link">
            <span className="back-arrow">←</span> Back to Home
          </Link>
          
          <div className="header-content">
            <span className="badge">Patient Lab Reports</span>
            <h1>
              Your <span className="text-gradient">Medical Reports</span>
            </h1>
            <p className="header-subtext">
              Access and manage all your laboratory test results in one place. 
              View, download, and share your reports securely.
            </p>
            {loggedInUser && (loggedInUser.name || loggedInUser.email) && (
              <p className="user-greeting">
                Welcome, <strong>{loggedInUser.name || loggedInUser.email}</strong>
              </p>
            )}
          </div>
        </section>

        {/* Filters and Search Section */}
        <section className="reports-controls animate-on-scroll slide-up delay-100">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by patient name, test type, or report ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-buttons">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All Reports
            </button>
            <button
              className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
              onClick={() => setFilter('completed')}
            >
              Completed
            </button>
            <button
              className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
              onClick={() => setFilter('pending')}
            >
              Pending
            </button>
          </div>
        </section>

        {/* Reports Grid */}
        <section className="reports-grid-section">
          {reports.length > 0 ? (
            <div className="reports-grid">
              {reports.map((report, index) => (
                <div
                  key={report.id}
                  className={`report-card animate-on-scroll slide-up delay-${(index % 3) * 100}`}
                >
                  {/* Report Header */}
                  <div className="report-card-header">
                    <div className="report-id">
                      <span className="id-label">Report ID</span>
                      <span className="id-value">{report.reportId}</span>
                    </div>
                    <div className={`status-badge status-${report.status}`}>
                      {report.status === 'completed' ? '✓ Completed' : '⏳ Pending'}
                    </div>
                  </div>

                  {/* Report Body */}
                  <div className="report-card-body">
                    <div className="patient-info">
                      <h3>{report.patientName}</h3>
                      <p className="test-type">{report.testType}</p>
                    </div>

                    <div className="report-meta">
                      <div className="meta-item">
                        <span className="meta-icon">📅</span>
                        <div>
                          <span className="meta-label">Test Date</span>
                          <span className="meta-value">{new Date(report.testDate).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}</span>
                        </div>
                      </div>
                      <div className="meta-item">
                        <span className="meta-icon">👨‍⚕️</span>
                        <div>
                          <span className="meta-label">Doctor</span>
                          <span className="meta-value">{report.doctor}</span>
                        </div>
                      </div>
                    </div>

                    {/* Results Preview */}
                    {report.status === 'completed' && report.results && (
                      <div className="results-preview">
                        <h4>Key Results</h4>
                        <div className="results-grid">
                          {Object.entries(report.results).slice(0, 3).map(([key, value]) => (
                            <div key={key} className="result-item">
                              <span className="result-label">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                              <span className="result-value">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    <div className="report-notes">
                      <p>{report.notes}</p>
                    </div>
                  </div>

                  {/* Report Footer */}
                  <div className="report-card-footer">
                    {report.status === 'completed' ? (
                      <>
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleViewDetails(report.reportId)}
                        >
                          View Details
                        </button>
                        <button
                          className="btn btn-primary"
                          onClick={() => handleDownload(report.reportId)}
                        >
                          Download PDF
                        </button>
                      </>
                    ) : (
                      <button className="btn btn-secondary" disabled>
                        Results Pending
                      </button>
                    )}
                  </div>

                  {/* Card Hover Effect */}
                  <div className="card-hover-effect"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-reports-found animate-on-scroll fade-in">
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <h3>No Reports Found</h3>
                <p>
                  {searchTerm || filter !== 'all'
                    ? 'No reports match your search criteria. Try adjusting your filters.'
                    : 'You don\'t have any lab reports yet. Reports will appear here once your tests are completed and results are available.'}
                </p>
                {(searchTerm || filter !== 'all') && (
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setSearchTerm('');
                      setFilter('all');
                    }}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          )}
        </section>

        {/* CTA Section */}
        {reports.length > 0 && (
          <section className="reports-cta animate-on-scroll fade-in">
            <div className="cta-card">
              <h2>Need Help Understanding Your Reports?</h2>
              <p>Our medical team is available to explain your test results and answer any questions.</p>
              <button className="btn btn-white">Schedule Consultation</button>
            </div>
          </section>
        )}

      </div>
    </div>
  );
};

export default LabReports;

