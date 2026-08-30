import React, { useState } from 'react';
import { supabase } from '../utils/supabase';

export default function AuthModal({ role, onClose, onLoginSuccess }) {
    const [step, setStep] = useState('action'); // 'action' | 'form'
    const [action, setAction] = useState('login'); // 'login' | 'signup'
    const [phone, setPhone] = useState('');
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

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
        if (pin.length !== 6 || isNaN(pin)) {
            setError('Please enter a valid 6-digit PIN.');
            return;
        }

        setError('');
        setLoading(true);

        try {
            const { data: userData, error: fetchError } = await supabase
                .from(role.id)
                .select('*')
                .eq('phone', phone)
                .maybeSingle();

            if (fetchError) throw fetchError;

            if (action === 'login') {
                if (userData) {
                    if (userData.pin === pin) {
                        onLoginSuccess({ phone, ...userData });
                    } else {
                        setError('Wrong PIN. Please try again.');
                    }
                } else {
                    setError('Account not found. Please sign up first.');
                }
            } else if (action === 'signup') {
                if (userData) {
                    setError('Account already exists. Please login instead.');
                } else {
                    const newUser = {
                        phone: phone,
                        pin: pin,
                        role: role.id.slice(0, -1),
                        created_at: new Date().toISOString(),
                    };
                    const { error: insertError } = await supabase
                        .from(role.id)
                        .insert(newUser);

                    if (insertError) throw insertError;
                    onLoginSuccess(newUser);
                }
            }
        } catch (err) {
            console.error(err);
            setError(err.message || 'Error connecting to database. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-modal" style={{ display: 'flex' }}>
            <div className="auth-content">
                <span className="close-btn" onClick={onClose}><i className="fa-solid fa-xmark"></i></span>
                <div className="logo modal-logo" style={{ marginBottom: '1.25rem', justifyContent: 'center' }}>
                    <i className="fa-solid fa-leaf"></i>
                    <span>AgriConnect</span>
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
                        <h2 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>Portal {action === 'login' ? 'Login' : 'Sign Up'}</h2>
                        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                            {action === 'login' ? 'Enter your phone number and PIN' : 'Create an account with your phone number and a new 6-digit PIN'}
                        </p>

                        <div className="input-group">
                            <i className="fa-solid fa-phone"></i>
                            <input type="tel" placeholder="10-digit Phone Number" maxLength="10" value={phone} onChange={e => setPhone(e.target.value)} />
                        </div>

                        <div className="input-group">
                            <i className="fa-solid fa-lock"></i>
                            <input type="password" placeholder="6-digit PIN" maxLength="6" value={pin} onChange={e => setPin(e.target.value)} />
                        </div>

                        {error && (
                            <div className="error-msg" style={{ color: 'var(--danger)', fontSize: '0.85rem', textAlign: 'center', marginTop: '0.75rem' }}>
                                {error}
                            </div>
                        )}

                        <button className="primary-btn" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }} onClick={handleSubmit} disabled={loading}>
                            {loading ? 'Processing...' : (action === 'login' ? 'Login' : 'Sign Up')}
                        </button>
                        <button className="text-btn" style={{ width: '100%', marginTop: '1rem', textAlign: 'center', display: 'block' }} onClick={() => setStep('action')} disabled={loading}>
                            Back
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
