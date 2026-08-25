import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import FarmerPortal from './components/FarmerPortal';
import BuyerPortal from './components/BuyerPortal';
import MillPortal from './components/MillPortal';
import ConsumerPortal from './components/ConsumerPortal';
import './index.css'; // Make sure the old styling applies

function App() {
  const [user, setUser] = useState(null);
  const [portal, setPortal] = useState(null); // e.g. 'farmers', 'buyers', etc.

  const handleLogin = (userData, selectedPortal) => {
    setUser(userData);
    setPortal(selectedPortal);
  };

  const handleLogout = () => {
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
