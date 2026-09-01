import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './components/LandingPage';
import FarmerPortal from './components/FarmerPortal';
import BuyerPortal from './components/BuyerPortal';
import TransportPortal from './components/TransportPortal';
import RolePickerModal from './components/RolePickerModal';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Landing & Portal Selection */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LandingPage />} />
          <Route path="/login/:roleId" element={<LandingPage />} />
          <Route path="/choose-role" element={<RolePickerModal />} />

          {/* Protected Farmer Portal */}
          <Route
            path="/farmer/*"
            element={
              <ProtectedRoute requiredRole="farmers">
                <FarmerPortal />
              </ProtectedRoute>
            }
          />

          {/* Protected Buyer / Mill Portal */}
          <Route
            path="/buyer/*"
            element={
              <ProtectedRoute requiredRole="buyers">
                <BuyerPortal />
              </ProtectedRoute>
            }
          />

          {/* Protected Transport Provider Portal */}
          <Route
            path="/transport/*"
            element={
              <ProtectedRoute requiredRole="transporters">
                <TransportPortal />
              </ProtectedRoute>
            }
          />

          {/* Fallback to Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
