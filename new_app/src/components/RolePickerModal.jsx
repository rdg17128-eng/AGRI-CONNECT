import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import KisanLogo from './KisanLogo';

export default function RolePickerModal() {
    const { googleUser, assignRoleToGoogleUser, logout } = useAuth();
    const [selectedRole, setSelectedRole] = useState(null);
    const [phone, setPhone] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const roles = [
        {
            id: 'farmers',
            route: '/farmer/dashboard',
            icon: 'fa-tractor',
            title: 'Farmer',
            subtitle: 'Empower Your Yield',
            desc: 'List crops, request mill purchase, generate verification QR, and arrange transport.'
        },
        {
            id: 'buyers',
            route: '/buyer/dashboard',
            icon: 'fa-industry',
            title: 'Mill',
            subtitle: 'Direct Grain Intake',
            desc: 'Review farmer enquiries, scan gate QR codes, verify crop loads, and set mill prices.'
        },
        {
            id: 'transporters',
            route: '/transport/dashboard',
            icon: 'fa-truck-moving',
            title: 'Transport Provider',
            subtitle: 'Smart Agro-Logistics',
            desc: 'Match vehicle capacity with farmer haulage requests, quote bids, and haul produce.'
        }
    ];

    const handleConfirm = async () => {
        if (!selectedRole) {
            setError('Please select an account type.');
            return;
        }

        setError('');
        setSubmitting(true);
        try {
            await assignRoleToGoogleUser(selectedRole.id, {
                phone: phone || undefined
            });
            navigate(selectedRole.route);
        } catch (err) {
            console.error("Failed to set role:", err);
            setError(err.message || 'Failed to complete profile. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="auth-modal-overlay" style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(3, 10, 6, 0.85)',
            backdropFilter: 'blur(8px)',
            padding: '1rem'
        }}>
            <div className="auth-modal-card" style={{
                background: 'rgba(8, 22, 14, 0.95)',
                border: '1px solid var(--border-highlight)',
                borderRadius: '1.25rem',
                maxWidth: '640px',
                width: '100%',
                padding: '1.75rem',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(245, 158, 11, 0.15)',
                animation: 'growIn 0.3s ease-out'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
                        <KisanLogo size="md" />
                    </div>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 0.35rem 0' }}>
                        Welcome to KisanConnect!
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', margin: 0 }}>
                        {googleUser?.email ? `Signed in as ${googleUser.email}. ` : ''}Please select your primary role to configure your portal workspace:
                    </p>
                </div>

                {error && (
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#f87171',
                        padding: '0.6rem 0.85rem',
                        borderRadius: '0.5rem',
                        fontSize: '0.8rem',
                        marginBottom: '1rem'
                    }}>
                        {error}
                    </div>
                )}

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                    gap: '0.75rem',
                    marginBottom: '1.25rem'
                }}>
                    {roles.map(r => {
                        const isSelected = selectedRole?.id === r.id;
                        return (
                            <div
                                key={r.id}
                                onClick={() => setSelectedRole(r)}
                                style={{
                                    border: isSelected ? '2px solid var(--accent-gold)' : '1px solid rgba(255, 255, 255, 0.08)',
                                    background: isSelected ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                                    borderRadius: '0.85rem',
                                    padding: '1rem 0.75rem',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    transition: 'var(--transition)',
                                    transform: isSelected ? 'translateY(-2px)' : 'none'
                                }}
                            >
                                <div style={{
                                    width: '38px',
                                    height: '38px',
                                    borderRadius: '10px',
                                    background: isSelected ? 'var(--accent-gold)' : 'rgba(16, 185, 129, 0.15)',
                                    color: isSelected ? '#000' : 'var(--primary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.1rem',
                                    margin: '0 auto 0.6rem auto'
                                }}>
                                    <i className={`fa-solid ${r.icon}`}></i>
                                </div>
                                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                                    {r.title}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                                    {r.subtitle}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                        Mobile Phone Number (Optional for SMS / Gate QR verification)
                    </label>
                    <input
                        type="tel"
                        placeholder="10-digit mobile number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        style={{
                            width: '100%',
                            padding: '0.65rem 0.85rem',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '0.5rem',
                            color: '#fff',
                            fontSize: '0.88rem'
                        }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    <button
                        className="action-btn"
                        onClick={logout}
                        disabled={submitting}
                        style={{ padding: '0.65rem 1.15rem', fontSize: '0.85rem' }}
                    >
                        Sign Out
                    </button>
                    <button
                        className="primary-btn"
                        onClick={handleConfirm}
                        disabled={submitting || !selectedRole}
                        style={{ padding: '0.65rem 1.4rem', fontSize: '0.88rem' }}
                    >
                        {submitting ? 'Setting up...' : 'Confirm & Open Portal →'}
                    </button>
                </div>
            </div>
        </div>
    );
}
