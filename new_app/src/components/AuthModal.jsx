import React, { useState } from 'react';
import { supabase } from '../utils/supabase';
import KisanLogo from './KisanLogo';

export default function AuthModal({ role, onClose, onLoginSuccess }) {
    const [step, setStep] = useState('action'); // 'action' | 'form'
    const [action, setAction] = useState('login'); // 'login' | 'signup'
    const [phone, setPhone] = useState('');
    const [pin, setPin] = useState('');
    const [name, setName] = useState('');
    const [vehicleNumber, setVehicleNumber] = useState('');
    const [capacity, setCapacity] = useState('15');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const tableName = role.id === 'transporters' ? 'transport_providers' : role.id;

    const handleActionChoice = (type) => {
        setAction(type);
        setStep('form');
        setError('');
    };

    const handleSubmit = async () => {
        if (phone.length !== 10 || isNaN(phone)) {
            setError('Please enter a valid 10-digit phone number.');
            return;
        }
        if (pin.length < 4 || isNaN(pin)) {
            setError('Please enter a valid 4 to 6-digit PIN.');
            return;
        }

        setError('');
        setLoading(true);

        try {
            let userData = null;

            // Attempt Supabase fetch
            try {
                const { data, error: fetchError } = await supabase
                    .from(tableName)
                    .select('*')
                    .eq('phone', phone)
                    .maybeSingle();

                if (!fetchError) {
                    userData = data;
                }
            } catch (supaErr) {
                console.warn("Supabase auth fallback check:", supaErr);
            }

            // Check local fallback storage if not found in Supabase
            if (!userData) {
                const localUsers = JSON.parse(localStorage.getItem(`kisan_users_${tableName}`) || '[]');
                userData = localUsers.find(u => u.phone === phone);
            }

            // Also check default seed providers if logging in as transporter
            if (!userData && role.id === 'transporters') {
                const seedProviders = JSON.parse(localStorage.getItem('kisan_transport_providers') || '[]');
                userData = seedProviders.find(p => p.phone === phone);
            }

            if (action === 'login') {
                if (userData) {
                    if (userData.pin === pin) {
                        onLoginSuccess({ phone, ...userData });
                    } else {
                        setError('Wrong PIN. Please try again.');
                    }
                } else {
                    // Provide quick demo bypass option or prompt signup
                    setError('Account not found. Please sign up or check your credentials.');
                }
            } else if (action === 'signup') {
                if (userData) {
                    setError('Account already exists with this phone number. Please login.');
                } else {
                    const newUser = {
                        phone: phone,
                        pin: pin,
                        name: name || (role.id === 'transporters' ? 'Agro Logistics' : 'Kisan Member'),
                        role: role.id,
                        vehicle_number: vehicleNumber || (role.id === 'transporters' ? 'TS 09 EA 4421' : null),
                        capacity: Number(capacity) || 15,
                        created_at: new Date().toISOString(),
                    };

                    // Try Supabase insert
                    try {
                        await supabase.from(tableName).insert(newUser);
                    } catch (insErr) {
                        console.warn("Supabase insert fallback to local:", insErr);
                    }

                    // Save to local backup
                    const localUsers = JSON.parse(localStorage.getItem(`kisan_users_${tableName}`) || '[]');
                    localUsers.push(newUser);
                    localStorage.setItem(`kisan_users_${tableName}`, JSON.stringify(localUsers));

                    if (role.id === 'transporters') {
                        const seedProviders = JSON.parse(localStorage.getItem('kisan_transport_providers') || '[]');
                        seedProviders.push(newUser);
                        localStorage.setItem('kisan_transport_providers', JSON.stringify(seedProviders));
                    }

                    onLoginSuccess(newUser);
                }
            }
        } catch (err) {
            console.error(err);
            setError(err.message || 'Error processing authentication. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-modal" style={{ display: 'flex' }}>
            <div className="auth-content" style={{ maxWidth: '440px' }}>
                <span className="close-btn" onClick={onClose}><i className="fa-solid fa-xmark"></i></span>
                
                <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'center' }}>
                    <KisanLogo size="md" />
                </div>

                {step === 'action' ? (
                    <div id="action-step">
                        <h2 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>{role.title}</h2>
                        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Login or Sign Up to continue</p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
                            <button className="primary-btn" style={{ flex: 1, justifyContent: 'center' }} onClick={() => handleActionChoice('login')}>
                                Login
                            </button>
                            <button className="primary-btn" style={{ flex: 1, justifyContent: 'center', background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)', boxShadow: 'none' }} onClick={() => handleActionChoice('signup')}>
                                Sign Up
                            </button>
                        </div>
                    </div>
                ) : (
                    <div id="auth-form-step">
                        <h2 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>
                            {role.title} {action === 'login' ? 'Login' : 'Sign Up'}
                        </h2>
                        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                            {action === 'login' ? 'Enter your 10-digit mobile number and PIN' : 'Create an account to access the ecosystem'}
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                            {action === 'signup' && (
                                <div className="input-group">
                                    <i className="fa-solid fa-user"></i>
                                    <input 
                                        type="text" 
                                        placeholder="Full Name / Company Name" 
                                        value={name} 
                                        onChange={e => setName(e.target.value)} 
                                    />
                                </div>
                            )}

                            <div className="input-group">
                                <i className="fa-solid fa-phone"></i>
                                <input 
                                    type="tel" 
                                    placeholder="10-digit Phone Number" 
                                    maxLength="10" 
                                    value={phone} 
                                    onChange={e => setPhone(e.target.value)} 
                                />
                            </div>

                            <div className="input-group">
                                <i className="fa-solid fa-lock"></i>
                                <input 
                                    type="password" 
                                    placeholder="PIN (4-6 digits)" 
                                    maxLength="6" 
                                    value={pin} 
                                    onChange={e => setPin(e.target.value)} 
                                />
                            </div>

                            {action === 'signup' && role.id === 'transporters' && (
                                <>
                                    <div className="input-group">
                                        <i className="fa-solid fa-truck"></i>
                                        <input 
                                            type="text" 
                                            placeholder="Vehicle Number (e.g. TS 09 EA 4421)" 
                                            value={vehicleNumber} 
                                            onChange={e => setVehicleNumber(e.target.value)} 
                                        />
                                    </div>
                                    <div className="input-group">
                                        <i className="fa-solid fa-weight-hanging"></i>
                                        <input 
                                            type="number" 
                                            placeholder="Truck Capacity in Tons (e.g. 15)" 
                                            value={capacity} 
                                            onChange={e => setCapacity(e.target.value)} 
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        {error && (
                            <div className="error-msg" style={{ color: 'var(--danger)', fontSize: '0.85rem', textAlign: 'center', marginTop: '0.75rem' }}>
                                {error}
                            </div>
                        )}

                        <button className="primary-btn" style={{ width: '100%', justifyContent: 'center', marginTop: '1.25rem' }} onClick={handleSubmit} disabled={loading}>
                            {loading ? 'Processing...' : (action === 'login' ? 'Login' : 'Sign Up')}
                        </button>
                        <button className="text-btn" style={{ width: '100%', marginTop: '0.75rem', textAlign: 'center', display: 'block' }} onClick={() => setStep('action')} disabled={loading}>
                            Back
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
