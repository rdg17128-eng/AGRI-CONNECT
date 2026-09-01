import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import RolePickerModal from './RolePickerModal';

export default function ProtectedRoute({ requiredRole, children }) {
    const { user, role, loading, needsRoleSelection } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div style={{
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg-deep)',
                color: 'var(--primary)'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <i className="fa-solid fa-seedling fa-spin fa-2x" style={{ color: 'var(--primary)', marginBottom: '1rem' }}></i>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Authenticating KisanConnect session...</p>
                </div>
            </div>
        );
    }

    // If a Google user is authenticated but needs to select their role
    if (needsRoleSelection) {
        return <RolePickerModal />;
    }

    // If unauthenticated, redirect to login/landing
    if (!user) {
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    // Role-based protection: User cannot access a portal of another role
    if (requiredRole && role && role !== requiredRole) {
        console.warn(`Unauthorized portal access attempt: user is ${role}, tried to access ${requiredRole}`);
        const defaultRoute = role === 'farmers'
            ? '/farmer/dashboard'
            : role === 'buyers'
            ? '/buyer/dashboard'
            : role === 'transporters'
            ? '/transport/dashboard'
            : '/';
        return <Navigate to={defaultRoute} replace />;
    }

    return children;
}
