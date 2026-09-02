import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function LanguageSelector({ variant = 'dropdown', style = {} }) {
    const { language, setLanguage, languages } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const activeLang = languages.find(l => l.code === language) || languages[0];

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Cards variant for Profile Preferences section
    if (variant === 'cards') {
        return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', ...style }}>
                {languages.map(l => {
                    const isSelected = l.code === language;
                    return (
                        <div
                            key={l.code}
                            onClick={() => setLanguage(l.code)}
                            style={{
                                padding: '0.85rem 0.75rem',
                                borderRadius: '0.75rem',
                                border: `1.5px solid ${isSelected ? 'var(--primary)' : 'rgba(255, 255, 255, 0.08)'}`,
                                background: isSelected ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                                cursor: 'pointer',
                                textAlign: 'center',
                                transition: 'all 0.2s ease',
                                boxShadow: isSelected ? '0 0 12px rgba(16, 185, 129, 0.25)' : 'none'
                            }}
                        >
                            <div style={{ fontSize: '1.4rem', marginBottom: '0.25rem' }}>{l.flag}</div>
                            <div style={{ fontWeight: 800, fontSize: '0.92rem', color: isSelected ? 'var(--primary)' : 'var(--text-main)' }}>
                                {l.native}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                                {l.name}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    // Pills variant
    if (variant === 'pills') {
        return (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', ...style }}>
                {languages.map(l => {
                    const isSelected = l.code === language;
                    return (
                        <button
                            key={l.code}
                            type="button"
                            onClick={() => setLanguage(l.code)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                padding: '0.4rem 0.8rem',
                                borderRadius: '2rem',
                                border: `1px solid ${isSelected ? 'var(--primary)' : 'rgba(255, 255, 255, 0.1)'}`,
                                background: isSelected ? 'var(--primary)' : 'rgba(255, 255, 255, 0.04)',
                                color: isSelected ? '#000' : 'var(--text-main)',
                                fontWeight: isSelected ? 800 : 500,
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <span>{l.flag}</span>
                            <span>{l.native}</span>
                        </button>
                    );
                })}
            </div>
        );
    }

    // Default compact dropdown (for top headers)
    return (
        <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block', ...style }}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="action-btn"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.45rem 0.85rem',
                    fontSize: '0.82rem',
                    borderRadius: '2rem',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: 'var(--text-main)',
                    cursor: 'pointer'
                }}
            >
                <i className="fa-solid fa-language" style={{ color: 'var(--primary)', fontSize: '1rem' }}></i>
                <span style={{ fontWeight: 700 }}>{activeLang.native}</span>
                <i className="fa-solid fa-chevron-down" style={{ fontSize: '0.65rem', opacity: 0.7, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}></i>
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    right: 0,
                    minWidth: '150px',
                    background: '#13211a',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    borderRadius: '0.75rem',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                    padding: '0.4rem',
                    zIndex: 99999,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.2rem'
                }}>
                    {languages.map(l => (
                        <button
                            key={l.code}
                            type="button"
                            onClick={() => {
                                setLanguage(l.code);
                                setIsOpen(false);
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                width: '100%',
                                padding: '0.5rem 0.75rem',
                                border: 'none',
                                background: l.code === language ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                                color: l.code === language ? 'var(--primary)' : 'var(--text-main)',
                                borderRadius: '0.5rem',
                                fontSize: '0.82rem',
                                fontWeight: l.code === language ? 800 : 500,
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'background 0.15s ease'
                            }}
                        >
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span>{l.flag}</span>
                                <span>{l.native}</span>
                            </span>
                            {l.code === language && <i className="fa-solid fa-check" style={{ fontSize: '0.75rem' }}></i>}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
