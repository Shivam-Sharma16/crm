// client/src/App.jsx
import React, { useEffect } from 'react';
import { MainRoutes } from './routes/Mainroutes';
import Lenis from 'lenis';
import './App.css';

function App() {
  
  useEffect(() => {
    // Initialize Lenis for global smooth scrolling
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Custom easing for "professional" feel
      direction: 'vertical',
      smooth: true,
      smoothTouch: false, // Default is false, set to true if you want smooth scroll on mobile touch
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    // Cleanup on unmount
    return () => {
      lenis.destroy();
    };
  }, []);

  return (
    <div className="App">
      <MainRoutes />
    </div>
  );
}

export default App;