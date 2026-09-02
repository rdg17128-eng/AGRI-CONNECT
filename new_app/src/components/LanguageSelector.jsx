import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function LanguageSelector({ variant = 'dropdown', style = {} }) {
    const { language, setLanguage, languages } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
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

    const filteredLanguages = languages.filter(l => {
        if (!searchTerm) return true;
        const q = searchTerm.toLowerCase();
        return (
            l.name.toLowerCase().includes(q) ||
            l.native.toLowerCase().includes(q) ||
            (l.region && l.region.toLowerCase().includes(q))
        );
    });

    // Cards variant for Profile Preferences section
    if (variant === 'cards') {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', ...style }}>
                {/* Search Bar for 20 Languages */}
                <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
                    <i className="fa-solid fa-search" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.85rem' }}></i>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Search 20 Indian languages (e.g. Telugu, Hindi, Tamil, Marathi)..."
                        style={{
                            width: '100%',
                            padding: '0.6rem 1rem 0.6rem 2.4rem',
                            borderRadius: '0.65rem',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            color: 'var(--text-main)',
                            fontSize: '0.82rem'
                        }}
                    />
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={() => setSearchTerm('')}
                            style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                        >
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                    )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(145px, 1fr))', gap: '0.75rem', maxHeight: '360px', overflowY: 'auto', paddingRight: '0.35rem' }}>
                    {filteredLanguages.map(l => {
                        const isSelected = l.code === language;
                        return (
                            <div
                                key={l.code}
                                onClick={() => setLanguage(l.code)}
                                style={{
                                    padding: '0.85rem 0.65rem',
                                    borderRadius: '0.75rem',
                                    border: `1.5px solid ${isSelected ? 'var(--primary)' : 'rgba(255, 255, 255, 0.08)'}`,
                                    background: isSelected ? 'rgba(16, 185, 129, 0.14)' : 'rgba(255, 255, 255, 0.02)',
                                    cursor: 'pointer',
                                    textAlign: 'center',
                                    transition: 'all 0.2s ease',
                                    boxShadow: isSelected ? '0 0 12px rgba(16, 185, 129, 0.25)' : 'none'
                                }}
                            >
                                <div style={{ fontSize: '1.35rem', marginBottom: '0.2rem' }}>{l.flag}</div>
                                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: isSelected ? 'var(--primary)' : 'var(--text-main)' }}>
                                    {l.native}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                                    {l.name}
                                </div>
                                <div style={{ fontSize: '0.62rem', color: isSelected ? 'var(--primary-light)' : 'rgba(255,255,255,0.4)', marginTop: '0.2rem' }}>
                                    {l.region}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // Default compact dropdown (for top headers) with quick-search
    return (
        <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block', ...style }}>
            <button
                type="button"
                onClick={() => {
                    setIsOpen(!isOpen);
                    setSearchTerm('');
                }}
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
                <span style={{ fontWeight: 700 }}>{activeLang.flag} {activeLang.native}</span>
                <i className="fa-solid fa-chevron-down" style={{ fontSize: '0.65rem', opacity: 0.7, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}></i>
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    right: 0,
                    width: '260px',
                    maxHeight: '380px',
                    background: '#102117',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    borderRadius: '0.85rem',
                    boxShadow: '0 12px 35px rgba(0,0,0,0.65)',
                    padding: '0.5rem',
                    zIndex: 99999,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem'
                }}>
                    {/* Search Input for 20 Languages */}
                    <div style={{ position: 'relative', padding: '0.2rem' }}>
                        <i className="fa-solid fa-search" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.75rem' }}></i>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Find your language..."
                            autoFocus
                            style={{
                                width: '100%',
                                padding: '0.45rem 0.6rem 0.45rem 1.8rem',
                                borderRadius: '0.5rem',
                                background: 'rgba(255, 255, 255, 0.06)',
                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                color: '#fff',
                                fontSize: '0.78rem'
                            }}
                        />
                    </div>

                    {/* Scrollable Language List */}
                    <div style={{ overflowY: 'auto', maxHeight: '280px', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                        {filteredLanguages.length === 0 ? (
                            <div style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                No language matching "{searchTerm}"
                            </div>
                        ) : (
                            filteredLanguages.map(l => {
                                const isSelected = l.code === language;
                                return (
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
                                            padding: '0.5rem 0.65rem',
                                            border: 'none',
                                            background: isSelected ? 'rgba(16, 185, 129, 0.22)' : 'transparent',
                                            color: isSelected ? 'var(--primary)' : 'var(--text-main)',
                                            borderRadius: '0.5rem',
                                            fontSize: '0.82rem',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            transition: 'background 0.15s ease'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                            <span style={{ fontSize: '1.1rem' }}>{l.flag}</span>
                                            <div>
                                                <div style={{ fontWeight: isSelected ? 800 : 600, fontSize: '0.84rem' }}>{l.native}</div>
                                                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{l.name} • {l.region}</div>
                                            </div>
                                        </div>
                                        {isSelected && <i className="fa-solid fa-check" style={{ fontSize: '0.75rem', color: 'var(--primary)' }}></i>}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
