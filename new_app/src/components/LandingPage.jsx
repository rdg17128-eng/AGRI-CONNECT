import React, { useState } from 'react';
import AuthModal from './AuthModal';
import KisanLogo from './KisanLogo';

export default function LandingPage({ onLogin }) {
    const [selectedRole, setSelectedRole] = useState(null);

    const roles = [
        {
            id: 'farmers',
            icon: 'fa-tractor',
            title: 'Farmer Portal',
            subtitle: 'Empower Your Yield',
            desc: 'Real-time weather, dynamic prices, direct mill enquiries, and instant verification QR.'
        },
        {
            id: 'buyers',
            icon: 'fa-industry',
            title: 'Mill & Buyer Portal',
            subtitle: 'Direct Grain Procurement',
            desc: 'Review farmer enquiries, scan verification QR, receive verified loads, and manage mills.'
        },
        {
            id: 'transporters',
            icon: 'fa-truck-moving',
            title: 'Transport Provider',
            subtitle: 'Smart Agro-Logistics',
            desc: 'Match vehicle capacity with farmer haulage requests, quote prices, and track dispatches.'
        },
    ];

    return (
        <div className="landing-page relative bg-neutral-900 font-sans text-neutral-50 selection:bg-green-500 selection:text-white">
            {/* ========================================= */}
            {/* BACKGROUND LAYER */}
            {/* ========================================= */}
            <div className="fixed inset-0 z-0">
                {/* Base Image: High quality agriculture field */}
                <img
                    src="/landing-bg.jpg"
                    alt="Agriculture Field at Sunset"
                    className="w-full h-full object-cover"
                />

                {/* Gradient Overlay 1: Dark earth tones at the bottom, transparent at top */}
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-900/70 to-transparent"></div>

                {/* Gradient Overlay 2: Subtle green tint across the whole image */}
                <div className="absolute inset-0 bg-green-900/30 mix-blend-multiply"></div>

                {/* Vignette effect for dramatic lighting */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)]"></div>
            </div>

            <div className="landing-content" style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%', padding: '0 2rem' }}>
                <header style={{ marginBottom: '1.5rem', animation: 'fadeInDown 0.8s ease-out', textAlign: 'center' }}>
                    <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <KisanLogo size="lg" />
                    </div>
                    <h1 style={{ marginBottom: '0.75rem', fontSize: 'clamp(2rem, 4.5vw, 3.2rem)', fontWeight: 900, lineHeight: 1.2 }}>
                        Agriculture Reimagined <br />
                        <span style={{ color: 'var(--accent-gold)' }}>For The Digital Era</span>
                    </h1>
                    <p style={{ fontSize: '1rem', maxWidth: '800px', margin: '0 auto', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                        India's most advanced unified agricultural ecosystem connecting producers, processors,
                        and transporters through QR verification, real-time technology, and transparent logistics.
                    </p>
                </header>

                <div className="role-cards" style={{ marginTop: '1.5rem', gap: '1.5rem' }}>
                    {roles.map((role, idx) => (
                        <div
                            key={role.id}
                            className="role-card"
                            onClick={() => setSelectedRole(role)}
                            style={{ animationDelay: `${idx * 0.15}s`, minHeight: '310px', borderRadius: '1.5rem', padding: '1.75rem 1.25rem' }}
                        >
                            <div className="role-tag" style={{ position: 'absolute', top: '1rem', right: '1rem', fontSize: '0.6rem', fontWeight: 800, color: 'var(--accent-gold)', letterSpacing: '1px', opacity: 0.7 }}>
                                CONNECTED
                            </div>
                            <div className="role-icon" style={{ width: '65px', height: '65px', fontSize: '2.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '1.25rem' }}>
                                <i className={`fa-solid ${role.icon}`}></i>
                            </div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--accent-gold)', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '0.25rem', display: 'block' }}>
                                {role.subtitle}
                            </span>
                            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', fontWeight: 700 }}>{role.title}</h2>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{role.desc}</p>

                            <div className="card-footer" style={{ marginTop: 'auto', paddingTop: '1rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--accent-gold)', fontWeight: 600, fontSize: '0.8rem' }}>
                                Enter Portal <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.7rem' }}></i>
                            </div>
                        </div>
                    ))}
                </div>

                <footer style={{ marginTop: '2.25rem', opacity: 0.6, fontSize: '0.75rem' }}>
                    <p>© 2026 KisanConnect Unified Ecosystem • Technology Empowering Nature</p>
                </footer>
            </div>

            {selectedRole && (
                <AuthModal
                    role={selectedRole}
                    onClose={() => setSelectedRole(null)}
                    onLoginSuccess={(user) => onLogin(user, selectedRole.id)}
                />
            )}
        </div>
    );
}
