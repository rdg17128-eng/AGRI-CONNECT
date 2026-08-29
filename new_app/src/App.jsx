import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import FarmerPortal from './components/FarmerPortal';
import BuyerPortal from './components/BuyerPortal';
import MillPortal from './components/MillPortal';
import ConsumerPortal from './components/ConsumerPortal';
import './index.css'; // Make sure the old styling applies

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('agri_user');
    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      console.error("Error parsing saved user session:", e);
      return null;
    }
  });
  const [portal, setPortal] = useState(() => {
    return localStorage.getItem('agri_portal') || null;
  });

  const handleLogin = (userData, selectedPortal) => {
    localStorage.setItem('agri_user', JSON.stringify(userData));
    localStorage.setItem('agri_portal', selectedPortal);
    localStorage.setItem('agri_active_tab', 'dashboard');
    setUser(userData);
    setPortal(selectedPortal);
  };

  const handleLogout = () => {
    localStorage.removeItem('agri_user');
    localStorage.removeItem('agri_portal');
    localStorage.removeItem('agri_active_tab');
    setUser(null);
    setPortal(null);
  };

  return (
    <>
      {!user ? (
        <LandingPage onLogin={handleLogin} />
      ) : (
        portal === 'farmers' ? (
          <FarmerPortal user={user} onLogout={handleLogout} />
        ) : portal === 'buyers' ? (
          <BuyerPortal user={user} onLogout={handleLogout} />
        ) : portal === 'mills' ? (
          <MillPortal user={user} onLogout={handleLogout} />
        ) : portal === 'consumers' ? (
          <ConsumerPortal user={user} onLogout={handleLogout} />
        ) : (
          <FarmerPortal user={user} onLogout={handleLogout} />
        )
      )}
    </>
  );
}

export default App;
