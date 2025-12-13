import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [labReports, setLabReports] = useState([]);
  const [pharmacyOrders, setPharmacyOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication and fetch data
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
      fetchDashboardData(token);
    } else {
      navigate('/login?redirect=/dashboard');
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
  }, [isLoading]);

  // Fetch all dashboard data
  const fetchDashboardData = async (token) => {
    setIsLoading(true);
    try {
      // Fetch appointments
      const appointmentsResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/appointments/my-appointments`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const appointmentsData = await appointmentsResponse.json();
      if (appointmentsData.success) {
        setAppointments(appointmentsData.appointments || []);
      }

      // Fetch lab reports (mock data for now - replace with API call when available)
      // For now, we'll use the same logic as LabReports.jsx
      const userData = JSON.parse(localStorage.getItem('user'));
      const mockLabReports = getMockLabReports(userData);
      setLabReports(mockLabReports);

      // Fetch pharmacy orders (mock data for now - replace with API call when available)
      const mockPharmacyOrders = getMockPharmacyOrders(userData);
      setPharmacyOrders(mockPharmacyOrders);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Mock lab reports data (matching user)
  const getMockLabReports = (userData) => {
    const allReports = [
      {
        id: 1,
        reportId: 'LAB-2024-001',
        patientName: 'John Doe',
        userId: 'user1',
        patientEmail: 'john.doe@example.com',
        testType: 'Complete Blood Count (CBC)',
        testDate: '2024-01-15',
        status: 'completed',
        doctor: 'Dr. Sarah Cameron'
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
        doctor: 'Dr. Michael Ross'
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
        doctor: 'Dr. Emily Chen'
      }
    ];

    if (!userData) return [];

    const userId = userData.id || userData.userId || userData._id;
    const userEmail = userData.email || userData.userEmail;
    const userName = userData.name || userData.userName || userData.fullName;

    return allReports.filter(report => {
      if (userId && report.userId === userId) return true;
      if (userEmail && report.patientEmail && 
          report.patientEmail.toLowerCase() === userEmail.toLowerCase()) return true;
      if (userName && report.patientName && 
          report.patientName.toLowerCase() === userName.toLowerCase()) return true;
      return false;
    });
  };

  // Mock pharmacy orders data
  const getMockPharmacyOrders = (userData) => {
    const allOrders = [
      {
        id: 1,
        orderId: 'PHARM-2024-001',
        patientName: 'John Doe',
        userId: 'user1',
        patientEmail: 'john.doe@example.com',
        orderDate: '2024-01-16',
        status: 'delivered',
        items: [
          { name: 'Paracetamol 500mg', quantity: 2, price: 50 },
          { name: 'Vitamin D3', quantity: 1, price: 200 }
        ],
        totalAmount: 300,
        deliveryDate: '2024-01-18'
      },
      {
        id: 2,
        orderId: 'PHARM-2024-002',
        patientName: 'Jane Smith',
        userId: 'user2',
        patientEmail: 'jane.smith@example.com',
        orderDate: '2024-01-19',
        status: 'processing',
        items: [
          { name: 'Amoxicillin 500mg', quantity: 1, price: 150 },
          { name: 'Cough Syrup', quantity: 1, price: 120 }
        ],
        totalAmount: 270,
        deliveryDate: null
      },
      {
        id: 3,
        orderId: 'PHARM-2024-003',
        patientName: 'Robert Johnson',
        userId: 'user3',
        patientEmail: 'robert.johnson@example.com',
        orderDate: '2024-01-21',
        status: 'pending',
        items: [
          { name: 'Blood Pressure Monitor', quantity: 1, price: 1500 }
        ],
        totalAmount: 1500,
        deliveryDate: null
      }
    ];

    if (!userData) return [];

    const userId = userData.id || userData.userId || userData._id;
    const userEmail = userData.email || userData.userEmail;
    const userName = userData.name || userData.userName || userData.fullName;

    return allOrders.filter(order => {
      if (userId && order.userId === userId) return true;
      if (userEmail && order.patientEmail && 
          order.patientEmail.toLowerCase() === userEmail.toLowerCase()) return true;
      if (userName && order.patientName && 
          order.patientName.toLowerCase() === userName.toLowerCase()) return true;
      return false;
    });
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Check if appointment is upcoming
  const isUpcoming = (appointmentDate, appointmentTime) => {
    if (!appointmentDate || !appointmentTime) return false;
    const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
    return appointmentDateTime >= new Date();
  };

  if (!isAuthenticated) {
    return (
      <div className="dashboard-page">
        <div className="content-wrapper">
          <div className="loading-state">
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="content-wrapper">
        
        {/* Header */}
        <section className="dashboard-header animate-on-scroll slide-up">
          <div className="header-content">
            <span className="badge">User Dashboard</span>
            <h1>
              Welcome back, <span className="text-gradient">{user?.name || 'User'}</span>
            </h1>
            <p className="header-subtext">
              Here's an overview of your appointments, lab reports, and pharmacy orders.
            </p>
          </div>
        </section>

        {isLoading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading your dashboard...</p>
          </div>
        ) : (
          <div className="dashboard-grid">
            
            {/* Appointments Column */}
            <div className="dashboard-column animate-on-scroll slide-up delay-100">
              <div className="column-header">
                <div className="column-icon">📅</div>
                <div>
                  <h2>Appointments</h2>
                  <p className="column-count">{appointments.length} {appointments.length === 1 ? 'appointment' : 'appointments'}</p>
                </div>
              </div>
              
              <div className="column-content">
                {appointments.length > 0 ? (
                  <div className="items-list">
                    {appointments.slice(0, 5).map((appointment) => {
                      const upcoming = isUpcoming(appointment.appointmentDate, appointment.appointmentTime);
                      return (
                        <div key={appointment._id || appointment.id} className={`dashboard-item ${upcoming ? 'upcoming' : 'past'}`}>
                          <div className="item-header">
                            <span className={`status-badge status-${appointment.status}`}>
                              {appointment.status}
                            </span>
                            {upcoming && <span className="upcoming-badge">Upcoming</span>}
                          </div>
                          <div className="item-body">
                            <h3>{appointment.doctorName}</h3>
                            <div className="item-details">
                              <span className="detail">📅 {formatDate(appointment.appointmentDate)}</span>
                              <span className="detail">🕐 {appointment.appointmentTime}</span>
                            </div>
                            {appointment.serviceName && (
                              <p className="item-service">{appointment.serviceName}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="empty-state-small">
                    <div className="empty-icon">📅</div>
                    <p>No appointments yet</p>
                  </div>
                )}
              </div>
              
              <div className="column-footer">
                <Link to="/appointment" className="view-all-link">
                  View All Appointments →
                </Link>
              </div>
            </div>

            {/* Lab Reports Column */}
            <div className="dashboard-column animate-on-scroll slide-up delay-200">
              <div className="column-header">
                <div className="column-icon">🔬</div>
                <div>
                  <h2>Lab Reports</h2>
                  <p className="column-count">{labReports.length} {labReports.length === 1 ? 'report' : 'reports'}</p>
                </div>
              </div>
              
              <div className="column-content">
                {labReports.length > 0 ? (
                  <div className="items-list">
                    {labReports.slice(0, 5).map((report) => (
                      <div key={report.id} className="dashboard-item">
                        <div className="item-header">
                          <span className="item-id">{report.reportId}</span>
                          <span className={`status-badge status-${report.status}`}>
                            {report.status}
                          </span>
                        </div>
                        <div className="item-body">
                          <h3>{report.testType}</h3>
                          <div className="item-details">
                            <span className="detail">📅 {formatDate(report.testDate)}</span>
                            <span className="detail">👨‍⚕️ {report.doctor}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state-small">
                    <div className="empty-icon">🔬</div>
                    <p>No lab reports yet</p>
                  </div>
                )}
              </div>
              
              <div className="column-footer">
                <Link to="/lab-reports" className="view-all-link">
                  View All Reports →
                </Link>
              </div>
            </div>

            {/* Pharmacy Column */}
            <div className="dashboard-column animate-on-scroll slide-up delay-300">
              <div className="column-header">
                <div className="column-icon">💊</div>
                <div>
                  <h2>Pharmacy</h2>
                  <p className="column-count">{pharmacyOrders.length} {pharmacyOrders.length === 1 ? 'order' : 'orders'}</p>
                </div>
              </div>
              
              <div className="column-content">
                {pharmacyOrders.length > 0 ? (
                  <div className="items-list">
                    {pharmacyOrders.slice(0, 5).map((order) => (
                      <div key={order.id} className="dashboard-item">
                        <div className="item-header">
                          <span className="item-id">{order.orderId}</span>
                          <span className={`status-badge status-${order.status}`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="item-body">
                          <h3>{order.items.length} {order.items.length === 1 ? 'item' : 'items'}</h3>
                          <div className="item-details">
                            <span className="detail">📅 {formatDate(order.orderDate)}</span>
                            <span className="detail">💰 ₹{order.totalAmount}</span>
                          </div>
                          {order.deliveryDate && (
                            <p className="item-service">Delivered: {formatDate(order.deliveryDate)}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state-small">
                    <div className="empty-icon">💊</div>
                    <p>No pharmacy orders yet</p>
                  </div>
                )}
              </div>
              
              <div className="column-footer">
                <Link to="/pharmacy" className="view-all-link">
                  View All Orders →
                </Link>
              </div>
            </div>

          </div>
        )}

       

      </div>
    </div>
  );
};

export default Dashboard;

