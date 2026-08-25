import React, { useState, useEffect } from 'react';
import AuthModal from './AuthModal';

// --- Particle Animation Component ---
// Creates floating, glowing dots to represent seeds, pollen, or data points
const FloatingParticles = () => {
    const [particles, setParticles] = useState([]);

    useEffect(() => {
        // Generate random particles
        const particleCount = 25;
        const newParticles = Array.from({ length: particleCount }).map((_, i) => ({
            id: i,
            x: Math.random() * 100, // percentage
            y: Math.random() * 100, // percentage
            size: Math.random() * 4 + 2, // 2px to 6px
            duration: Math.random() * 20 + 10, // 10s to 30s
            delay: Math.random() * 5, // 0s to 5s
            opacity: Math.random() * 0.5 + 0.2,
        }));
        setParticles(newParticles);
    }, []);

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
          10% { opacity: ${Math.random() * 0.5 + 0.3}; }
          90% { opacity: ${Math.random() * 0.5 + 0.3}; }
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
        <div className="landing-page relative min-h-screen bg-neutral-900 font-sans text-neutral-50 overflow-x-hidden selection:bg-green-500 selection:text-white" style={{ height: 'auto', minHeight: '100vh', padding: '4rem 0' }}>
            {/* ========================================= */}
            {/* BACKGROUND LAYER (The core of the request) */}
            {/* ========================================= */}
            <div className="fixed inset-0 z-0">
                {/* Base Image: High quality agriculture field */}
                <img
                    src="https://images.unsplash.com/photo-1586771107445-d3ca888129ff?q=80&w=2072&auto=format&fit=crop"
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

            <div className="landing-content" style={{ position: 'relative', zIndex: 10 }}>
                <header style={{ marginBottom: '4rem', animation: 'fadeInDown 0.8s ease-out' }}>
                    <div className="logo landing-logo" style={{ marginBottom: '1.5rem' }}>
                        <i className="fa-solid fa-leaf"></i>
                        <span style={{ fontSize: '2.5rem' }}>AgriConnect</span>
                    </div>
                    <h1 style={{ marginBottom: '1.5rem' }}>
                        Agriculture Reimagined <br />
                        <span style={{ color: 'var(--primary)' }}>For The Digital Era</span>
                    </h1>
                    <p style={{ fontSize: '1.2rem', maxWidth: '900px', margin: '0 auto', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                        India's most advanced unified agricultural ecosystem connecting producers, processors,
                        and consumers through real-time technology and logistics.
                    </p>
                </header>

                <div className="role-cards">
                    {roles.map((role, idx) => (
                        <div
                            key={role.id}
                            className="role-card"
                            onClick={() => setSelectedRole(role)}
                            style={{ animationDelay: `${idx * 0.15}s` }}
                        >
                            <div className="role-tag" style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', fontSize: '0.65rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '2px', opacity: 0.6 }}>ACTIVE PORTAL</div>
                            <div className="role-icon" style={{ width: '80px', height: '80px', fontSize: '3rem', marginBottom: '2rem' }}>
                                <i className={`fa-solid ${role.icon}`}></i>
                            </div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>{role.subtitle}</span>
                            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{role.title}</h2>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>{role.desc}</p>

                            <div className="card-footer" style={{ marginTop: 'auto', paddingTop: '1.5rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: 600, fontSize: '0.85rem' }}>
                                Enter Portal <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.75rem' }}></i>
                            </div>
                        </div>
                    ))}
                </div>

                <footer style={{ marginTop: '5rem', opacity: 0.4, fontSize: '0.8rem' }}>
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

