import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';
import KisanLogo from './KisanLogo';

export default function LandingPage() {
    const [selectedRole, setSelectedRole] = useState(null);
    const [googleError, setGoogleError] = useState('');
    const { user, role, signInWithGoogle } = useAuth();
    const navigate = useNavigate();

    const handleGlobalGoogleLogin = async () => {
        setGoogleError('');
        try {
            await signInWithGoogle();
        } catch (err) {
            console.error(err);
            setGoogleError("Google sign-in failed. Please try again.");
        }
    };

    // If user is already authenticated and has a role, redirect to their portal
    React.useEffect(() => {
        if (user && role) {
            const dest = role === 'farmers'
                ? '/farmer/dashboard'
                : role === 'buyers'
                ? '/buyer/dashboard'
                : role === 'transporters'
                ? '/transport/dashboard'
                : '/consumer/products';
            navigate(dest, { replace: true });
        }
    }, [user, role, navigate]);

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
            title: 'Mill & Buyer',
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
            : authenticatedUser.role === 'transporters'
            ? '/transport/dashboard'
            : '/consumer/products';
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

                {/* Global Quick Google Sign-In Pill */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem',
                    flexWrap: 'wrap',
                    padding: '0.75rem 1.25rem',
                    background: 'rgba(9, 23, 15, 0.75)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '2rem',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
                }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Fast Access:</span>
                    <button
                        type="button"
                        onClick={handleGlobalGoogleLogin}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--primary-light)',
                            fontWeight: 700,
                            fontSize: '0.84rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.45rem'
                        }}
                    >
                        <svg width="15" height="15" viewBox="0 0 18 18">
                            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.616z" />
                            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" />
                            <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z" />
                            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" />
                        </svg>
                        Continue with Google
                    </button>
                    <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Consumer? <span onClick={() => navigate('/consumer/products')} style={{ color: 'var(--accent-gold)', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}>Browse Fresh Produce</span>
                    </span>
                </div>

                {googleError && (
                    <p style={{ color: 'var(--danger)', fontSize: '0.82rem', marginTop: '0.6rem', textAlign: 'center' }}>
                        {googleError}
                    </p>
                )}

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
        </div>
    );
}
