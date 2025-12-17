import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Navbar from '../components/Navbar';
import Home from '../pages/Home';
import Services from '../pages/user/Services';
import Doctors from '../pages/user/Doctors';
import Appointment from '../pages/user/Appointment';
import AppointmentSuccess from '../pages/user/AppointmentSuccess';
import LabReports from '../pages/user/LabReports';
import Dashboard from '../pages/user/Dashboard';
import Pharmacy from '../pages/user/Pharmacy';
import Login from '../pages/user/Login';
import Signup from '../pages/user/Signup';

export const MainRoutes = () => {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        
        {/* Services Page */}
        <Route path="/services" element={<Services />} />
        
        {/* Doctors Page (Direct Access) */}
        <Route path="/doctors" element={<Doctors />} />
        
        {/* CRITICAL FIX: Dynamic Route for Service Specific Doctors */}
        {/* This handles /services/ivf/doctors, /services/iui/doctors, etc. */}
        <Route path="/services/:serviceId/doctors" element={<Doctors />} />
        
        <Route path="/appointment" element={<Appointment />} />
        <Route path="/appointment/success" element={<AppointmentSuccess />} />
        
        {/* Lab Reports Page */}
        <Route path="/lab-reports" element={<LabReports />} />
        
        {/* Dashboard Page */}
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Pharmacy Page */}
        <Route path="/pharmacy" element={<Pharmacy />} />
        
        {/* Authentication Pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    </Router>
  );
};