import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import FarmerPortal from './components/FarmerPortal';
import BuyerPortal from './components/BuyerPortal';
import TransportPortal from './components/TransportPortal';
import './index.css';

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('kisan_user') || localStorage.getItem('agri_user');
    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      console.error("Error parsing saved user session:", e);
      return null;
    }
  });

  const [portal, setPortal] = useState(() => {
    return localStorage.getItem('kisan_portal') || localStorage.getItem('agri_portal') || null;
  });

  const handleLogin = (userData, selectedPortal) => {
    localStorage.setItem('kisan_user', JSON.stringify(userData));
    localStorage.setItem('kisan_portal', selectedPortal);
    localStorage.setItem('kisan_active_tab', 'dashboard');
    // Also keep legacy keys for backwards compatibility
    localStorage.setItem('agri_user', JSON.stringify(userData));
    localStorage.setItem('agri_portal', selectedPortal);
    localStorage.setItem('agri_active_tab', 'dashboard');
    setUser(userData);
    setPortal(selectedPortal);
  };

  const handleLogout = () => {
    localStorage.removeItem('kisan_user');
    localStorage.removeItem('kisan_portal');
    localStorage.removeItem('kisan_active_tab');
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
      ) : portal === 'farmers' ? (
        <FarmerPortal user={user} onLogout={handleLogout} />
      ) : portal === 'transporters' ? (
        <TransportPortal user={user} onLogout={handleLogout} />
      ) : (
        <BuyerPortal user={user} onLogout={handleLogout} />
      )}
    </>
  );
}

export default App;
