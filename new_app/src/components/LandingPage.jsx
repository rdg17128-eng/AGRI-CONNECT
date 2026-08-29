import React, { useState } from 'react';
import AuthModal from './AuthModal';

// --- Particle Animation Component ---
// Creates floating, glowing dots to represent seeds, pollen, or data points
const FloatingParticles = () => {
    const [particles] = useState(() => {
        const particleCount = 25;
        return Array.from({ length: particleCount }).map((_, i) => ({
            id: i,
            x: Math.random() * 100, // percentage
            y: Math.random() * 100, // percentage
            size: Math.random() * 4 + 2, // 2px to 6px
            duration: Math.random() * 20 + 10, // 10s to 30s
            delay: Math.random() * 5, // 0s to 5s
            opacity: Math.random() * 0.5 + 0.2,
        }));
    });

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {particles.map((p) => (
                <div
                    key={p.id}
                    className="absolute rounded-full bg-green-200 blur-[1px]"
                    style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        width: `${p.size}px`,
                        height: `${p.size}px`,
                        opacity: p.opacity,
                        animation: `floatUp ${p.duration}s linear ${p.delay}s infinite`,
                        boxShadow: '0 0 10px 2px rgba(134, 239, 172, 0.5)',
                    }}
                />
            ))}
            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes floatUp {
          0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 0; }
          10% { opacity: 0.8; }
          90% { opacity: 0.8; }
          100% { transform: translateY(-100vh) translateX(20px) rotate(360deg); opacity: 0; }
        }
      `}} />
        </div>
    );
};

export default function LandingPage({ onLogin }) {
    const [selectedRole, setSelectedRole] = useState(null);

    const roles = [
        {
            id: 'farmers',
            icon: 'fa-tractor',
            title: 'Farmer Portal',
            subtitle: 'Empower Your Yield',
            desc: 'Real-time weather, market insights, and direct buyer connections.'
        },
        {
            id: 'buyers',
            icon: 'fa-handshake',
            title: 'Buyer Portal',
            subtitle: 'Source with Confidence',
            desc: 'Access verified produce and manage nationwide procurement.'
        },
        {
            id: 'mills',
            icon: 'fa-industry',
            title: 'Mill Portal',
            subtitle: 'Process Perfection',
            desc: 'Streamline raw material intake and manufacturing workflows.'
        },
        {
            id: 'consumers',
            icon: 'fa-plate-wheat',
            title: 'Consumer Portal',
            subtitle: 'Farm to Fork',
            desc: 'Buy fresh, chemical-free grains directly from local sources.'
        },
    ];

    return (
        <div className="landing-page relative h-screen max-h-screen bg-neutral-900 font-sans text-neutral-50 overflow-hidden selection:bg-green-500 selection:text-white" style={{ height: '100vh', minHeight: '100vh', maxHeight: '100vh', padding: '1.5rem 0', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            {/* ========================================= */}
            {/* BACKGROUND LAYER (The core of the request) */}
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

                {/* Animated Particles */}
                <FloatingParticles />
            </div>

            <div className="landing-content" style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%', padding: '0 2rem' }}>
                <header style={{ marginBottom: '1.5rem', animation: 'fadeInDown 0.8s ease-out', textAlign: 'center' }}>
                    <div className="logo landing-logo" style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                        <i className="fa-solid fa-leaf"></i>
                        <span style={{ fontSize: '2rem' }}>AgriConnect</span>
                    </div>
                    <h1 style={{ marginBottom: '0.75rem', fontSize: '2.5rem', fontWeight: 900, lineHeight: 1.2 }}>
                        Agriculture Reimagined <br />
                        <span style={{ color: 'var(--primary)' }}>For The Digital Era</span>
                    </h1>
                    <p style={{ fontSize: '1rem', maxWidth: '800px', margin: '0 auto', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                        India's most advanced unified agricultural ecosystem connecting producers, processors,
                        and consumers through real-time technology and logistics.
                    </p>
                </header>

                <div className="role-cards" style={{ marginTop: '2rem', gap: '1.5rem' }}>
                    {roles.map((role, idx) => (
                        <div
                            key={role.id}
                            className="role-card"
                            onClick={() => setSelectedRole(role)}
                            style={{ animationDelay: `${idx * 0.15}s`, minHeight: '300px', borderRadius: '1.5rem', padding: '1.75rem 1.25rem' }}
                        >
                            <div className="role-tag" style={{ position: 'absolute', top: '1rem', right: '1rem', fontSize: '0.6rem', fontWeight: 800, color: 'var(--accent-gold)', letterSpacing: '1px', opacity: 0.6 }}>ACTIVE PORTAL</div>
                            <div className="role-icon" style={{ width: '65px', height: '65px', fontSize: '2.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '1.25rem' }}>
                                <i className={`fa-solid ${role.icon}`}></i>
                            </div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--accent-gold)', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '0.25rem', display: 'block' }}>{role.subtitle}</span>
                            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', fontWeight: 700 }}>{role.title}</h2>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{role.desc}</p>

                            <div className="card-footer" style={{ marginTop: 'auto', paddingTop: '1rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--accent-gold)', fontWeight: 600, fontSize: '0.8rem' }}>
                                Enter Portal <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.7rem' }}></i>
                            </div>
                        </div>
                    ))}
                </div>

                <footer style={{ marginTop: '2.25rem', opacity: 0.4, fontSize: '0.75rem' }}>
                    <p>© 2026 AgriConnect Unified Ecosystem • Technology Empowering Nature</p>
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

