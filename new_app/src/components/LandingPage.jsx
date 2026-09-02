import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';
import RolePickerModal from './RolePickerModal';
import KisanLogo from './KisanLogo';

export default function LandingPage() {
    const [selectedRole, setSelectedRole] = useState(null);
    const { user, role, needsRoleSelection, assignRoleToGoogleUser } = useAuth();
    const navigate = useNavigate();
    const { roleId } = useParams();

    // If user is already authenticated and has a role, redirect to their portal
    React.useEffect(() => {
        if (user && role) {
            const dest = role === 'farmers'
                ? '/farmer/dashboard'
                : role === 'buyers'
                    ? '/buyer/dashboard'
                    : '/transport/dashboard';
            navigate(dest, { replace: true });
        } else if (user && !role && roleId) {
            // Auto-assign role from URL parameter
            assignRoleToGoogleUser(roleId).then(() => {
                const dest = roleId === 'farmers'
                    ? '/farmer/dashboard'
                    : roleId === 'buyers'
                        ? '/buyer/dashboard'
                        : '/transport/dashboard';
                navigate(dest, { replace: true });
            });
        }
    }, [user, role, roleId, navigate, assignRoleToGoogleUser]);

    const roles = [
        {
            id: 'farmers',
            icon: 'fa-tractor',
            title: 'Farmer Portal',
            subtitle: 'Empower Your Yield',
            desc: 'Real-time weather, market rates, direct mill enquiries, and crop verification QR.',
            route: '/farmer/dashboard'
        },
        {
            id: 'buyers',
            icon: 'fa-industry',
            title: 'Mills',
            subtitle: 'Grain Procurement',
            desc: 'Review farmer loads, scan gate QR codes, verify intake batches, and set mill prices.',
            route: '/buyer/dashboard'
        },
        {
            id: 'transporters',
            icon: 'fa-truck-moving',
            title: 'Transport Provider',
            subtitle: 'Smart Agro-Logistics',
            desc: 'Smart truck capacity matching, haulage bids, trip progress, and freight payouts.',
            route: '/transport/dashboard'
        },
    ];

    const handleRoleClick = (roleItem) => {
        setSelectedRole(roleItem);
    };

    const handleLoginSuccess = (authenticatedUser) => {
        setSelectedRole(null);
        const dest = authenticatedUser.role === 'farmers'
            ? '/farmer/dashboard'
            : authenticatedUser.role === 'buyers'
                ? '/buyer/dashboard'
                : '/transport/dashboard';
        navigate(dest);
    };

    return (
        <div className="landing-page relative bg-neutral-900 font-sans text-neutral-50 selection:bg-green-500 selection:text-white" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Background Layer */}
            <div className="fixed inset-0 z-0">
                <img
                    src="/landing-bg.jpg"
                    alt="Agriculture Field at Sunset"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-900/75 to-transparent"></div>
                <div className="absolute inset-0 bg-green-950/40 mix-blend-multiply"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.65)_100%)]"></div>
            </div>

            <div className="landing-content" style={{
                position: 'relative',
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                width: '100%',
                maxWidth: '1100px',
                margin: '0 auto',
                padding: '2rem 1.25rem'
            }}>
                {/* Header */}
                <header style={{ marginBottom: '1.5rem', animation: 'fadeInDown 0.6s ease-out', textAlign: 'center' }}>
                    <div style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <KisanLogo size="lg" />
                    </div>
                    <h1 style={{ marginBottom: '0.4rem', fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 800, lineHeight: 1.2 }}>
                        Unified Agricultural Ecosystem
                    </h1>
                    <p style={{ fontSize: '0.92rem', maxWidth: '680px', margin: '0 auto', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                        Empowering Indian farmers, mill operators, and transport fleets with QR-verified intake, live pricing, and transparent digital logistics.
                    </p>
                </header>

                {/* ======================================================== */}
                {/* 1. THREE PORTALS — COMPACT SINGLE ROW ON DESKTOP */}
                {/* ======================================================== */}
                <div className="role-cards-container" style={{ width: '100%', marginBottom: '1.5rem' }}>
                    <div className="role-cards-grid">
                        {roles.map((roleItem, idx) => (
                            <div
                                key={roleItem.id}
                                className="compact-role-card"
                                onClick={() => handleRoleClick(roleItem)}
                                style={{ animationDelay: `${idx * 0.1}s` }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                    <div className="compact-role-icon">
                                        <i className={`fa-solid ${roleItem.icon}`}></i>
                                    </div>
                                    <span style={{ fontSize: '0.68rem', color: 'var(--accent-gold)', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                                        {roleItem.subtitle}
                                    </span>
                                </div>

                                <h2 style={{ fontSize: '1.12rem', fontWeight: 800, marginBottom: '0.35rem', color: 'var(--text-main)' }}>
                                    {roleItem.title}
                                </h2>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.45, marginBottom: '1rem', flex: 1 }}>
                                    {roleItem.desc}
                                </p>

                                <div className="card-enter-btn">
                                    <span>Enter Portal</span>
                                    <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.75rem', transition: 'transform 0.2s' }}></i>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <footer style={{ marginTop: '1.75rem', opacity: 0.6, fontSize: '0.75rem', textAlign: 'center' }}>
                    <p>© 2026 KisanConnect Ecosystem • Built with React, Supabase & Leaflet</p>
                </footer>
            </div>

            {selectedRole && (
                <AuthModal
                    role={selectedRole}
                    onClose={() => setSelectedRole(null)}
                    onLoginSuccess={handleLoginSuccess}
                />
            )}

            {needsRoleSelection && (
                <RolePickerModal />
            )}
        </div>
    );
}
