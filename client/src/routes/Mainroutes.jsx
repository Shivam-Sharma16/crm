import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Navbar from '../components/Navbar';
import ProtectedRoute from '../components/ProtectedRoute';
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
import AdminLogin from '../pages/administration/AdminLogin';
import AdminSignup from '../pages/administration/AdminSignup';
import Administrator from '../pages/administration/Administrator';
import Admin from '../pages/admin/Admin';
import AdminDoctors from '../pages/admin/AdminDoctors';
import AdminLabs from '../pages/admin/AdminLabs';
import AdminPharmacy from '../pages/admin/AdminPharmacy';
import AdminReception from '../pages/admin/AdminReception';
import AdminServices from '../pages/admin/AdminServices';
import Patient from '../pages/doctors/Patient';

export const MainRoutes = () => {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        
        {/* Services Page - Accessible to all except admin, but admin blocked */}
        <Route 
          path="/services" 
          element={
            <ProtectedRoute allowedRoles={['user', 'doctor', 'lab', 'pharmacy', 'reception']}>
              <Services />
            </ProtectedRoute>
          } 
        />
        
        {/* Doctors Page (Direct Access) - Accessible to all except admin, but admin blocked */}
        <Route 
          path="/doctors" 
          element={
            <ProtectedRoute allowedRoles={['user', 'doctor', 'lab', 'pharmacy', 'reception']}>
              <Doctors />
            </ProtectedRoute>
          } 
        />
        
        {/* CRITICAL FIX: Dynamic Route for Service Specific Doctors */}
        {/* This handles /services/ivf/doctors, /services/iui/doctors, etc. */}
        <Route 
          path="/services/:serviceId/doctors" 
          element={
            <ProtectedRoute allowedRoles={['user', 'doctor', 'lab', 'pharmacy', 'reception']}>
              <Doctors />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/appointment" 
          element={
            <ProtectedRoute allowedRoles={['user', 'doctor', 'lab', 'pharmacy', 'reception']} requireAuth={true}>
              <Appointment />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/appointment/success" 
          element={
            <ProtectedRoute allowedRoles={['user', 'doctor', 'lab', 'pharmacy', 'reception']} requireAuth={true}>
              <AppointmentSuccess />
            </ProtectedRoute>
          } 
        />
        
        {/* Lab Reports Page - Protected from admin, requires auth */}
        <Route 
          path="/lab-reports" 
          element={
            <ProtectedRoute allowedRoles={['user', 'doctor', 'lab', 'pharmacy', 'reception']} requireAuth={true}>
              <LabReports />
            </ProtectedRoute>
          } 
        />
        
        {/* Dashboard Page - Protected from admin, requires auth */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['user', 'doctor', 'lab', 'pharmacy', 'reception']} requireAuth={true}>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Pharmacy Page - Protected from admin, requires auth */}
        <Route 
          path="/pharmacy" 
          element={
            <ProtectedRoute allowedRoles={['user', 'doctor', 'lab', 'pharmacy', 'reception']} requireAuth={true}>
              <Pharmacy />
            </ProtectedRoute>
          } 
        />
        
        {/* Authentication Pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Administration Authentication Pages */}
        <Route path="/administrator/login" element={<AdminLogin />} />
        <Route path="/administrator/signup" element={<AdminSignup />} />
        
        {/* Administrator Dashboard - Protected for administrator only */}
        <Route 
          path="/administrator" 
          element={
            <ProtectedRoute allowedRoles={['administrator']}>
              <Administrator />
            </ProtectedRoute>
          } 
        />
        
        {/* Admin Dashboard - Protected for admin only */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Admin />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/doctors" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDoctors />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/labs" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLabs />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/pharmacy" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminPharmacy />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/reception" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminReception />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/services" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminServices />
            </ProtectedRoute>
          } 
        />
        
        {/* Doctor Dashboard - Protected for doctor only */}
        <Route 
          path="/doctor/patients" 
          element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <Patient />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
};