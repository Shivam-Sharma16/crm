import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  const checkAuth = () => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  useEffect(() => {
    checkAuth();
    
    // Listen for storage changes (e.g., login/logout from another tab)
    const handleStorageChange = (e) => {
      if (e.key === 'token' || e.key === 'user') {
        checkAuth();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Re-check auth when location changes (e.g., after login/signup)
  useEffect(() => {
    checkAuth();
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo/Brand */}
        <NavLink to="/" className="navbar-brand">
          <span className="brand-icon">🏥</span>
          <span className="brand-text">MediCare Prime</span>
        </NavLink>

        {/* Navigation Links */}
        <div className="navbar-links">
          <NavLink 
            to="/" 
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
            end
          >
            Home
          </NavLink>
          
          <NavLink 
            to="/services" 
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            Services
          </NavLink>
          
          <NavLink 
            to="/doctors" 
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            Doctors
          </NavLink>
          
          <NavLink 
            to="/appointment" 
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            Appointment
          </NavLink>
          
          {isAuthenticated && (
            <NavLink 
              to="/lab-reports" 
              className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
            >
              Lab Reports
            </NavLink>
          )}
          
          {isAuthenticated && (
            <NavLink 
              to="/dashboard" 
              className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
            >
              Dashboard
            </NavLink>
          )}

          {/* Settings Dropdown */}
          <div className="settings-dropdown">
            <div className="nav-link settings-link">
              Settings
              <span className="dropdown-arrow">▼</span>
            </div>
            
            <div className="dropdown-menu">
              {isAuthenticated ? (
                <>
                  {user && (
                    <div className="dropdown-user-info">
                      <span className="user-name">{user.name}</span>
                      <span className="user-email">{user.email}</span>
                    </div>
                  )}
                  <button 
                    className="dropdown-item logout-btn"
                    onClick={handleLogout}
                  >
                    <span className="dropdown-icon">🚪</span>
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <NavLink 
                    to="/login" 
                    className="dropdown-item"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <span className="dropdown-icon">🔐</span>
                    Login
                  </NavLink>
                  <NavLink 
                    to="/signup" 
                    className="dropdown-item"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <span className="dropdown-icon">✍️</span>
                    Sign Up
                  </NavLink>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

