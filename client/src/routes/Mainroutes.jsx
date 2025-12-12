import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Home from '../pages/Home';
import Services from '../pages/user/Services';
import Doctors from '../pages/user/Doctors';
import Appointment from '../pages/user/Appointment';


export const MainRoutes = () => {
  return (
    <Router>
      <Routes>
       
        <Route path="/" element={<Home />} />
        <Route path="/services" element={<Services />} />
        <Route path="/doctors" element={<Doctors />} />
        <Route path="/appointment" element={<Appointment />} />
      </Routes>
    </Router>
  );
};
