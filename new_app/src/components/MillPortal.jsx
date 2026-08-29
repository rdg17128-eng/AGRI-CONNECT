import React, { useState, useEffect } from 'react';
import { doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

export default function MillPortal({ user, onLogout }) {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Profile States
    const [profileName, setProfileName] = useState(user.name || '');
    const [profileAltPhone, setProfileAltPhone] = useState(user.altPhone || '');
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    const [newPhone, setNewPhone] = useState(user.phone || '');
    const [newPin, setNewPin] = useState(user.pin || '');

    const [millType, setMillType] = useState(user.millType || '');
    const [hasColdStorage, setHasColdStorage] = useState(user.hasColdStorage || false);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const handleUpdateProfile = async () => {
        setIsSavingProfile(true);
        try {
            const userRef = doc(db, `${user.role}s`, user.phone);
            await setDoc(userRef, {
                name: profileName,
                altPhone: profileAltPhone,
                millType: millType,
                hasColdStorage: hasColdStorage
            }, { merge: true });
            alert('Profile and Mill information updated successfully!');
        } catch (error) {
            console.error(error);
            alert('Failed to update profile');
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleUpdateSecurity = async () => {
        if (!newPhone || newPhone.length !== 10 || isNaN(newPhone)) return alert("Please enter a valid 10-digit phone number.");
        if (!newPin || newPin.length !== 6 || isNaN(newPin)) return alert("Please enter a valid 6-digit PIN.");

        try {
            const oldRef = doc(db, `${user.role}s`, user.phone);
            const isPhoneChanged = newPhone !== user.phone;

            if (isPhoneChanged) {
                const newRef = doc(db, `${user.role}s`, newPhone);
                const newSnap = await getDoc(newRef);
                if (newSnap.exists()) {
                    return alert("This phone number is already registered.");
                }
                const newUserData = { ...user, phone: newPhone, pin: newPin, name: profileName, altPhone: profileAltPhone };
                await setDoc(newRef, newUserData);
                await deleteDoc(oldRef);
                alert("Changed successfully! Please login again.");
                onLogout();
            } else {
                await setDoc(oldRef, { pin: newPin }, { merge: true });
                alert("PIN updated!");
                user.pin = newPin;
            }
        } catch (error) {
            console.error(error);
            alert("Update failed.");
        }
    };

    return (
        <div className="app-container" style={{ display: 'flex' }}>
            {/* Sidebar Overlay for Mobile */}
            {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>}

            <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="logo">
                    <i className="fa-solid fa-leaf"></i>
                    <span>AgriConnect</span>
                </div>
                <nav className="nav-menu">
                    <a className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}>
                        <i className="fa-solid fa-house"></i>
                        <span>Dashboard</span>
                    </a>
                    <a className={`nav-item ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => { setActiveTab('inventory'); setIsSidebarOpen(false); }}>
                        <i className="fa-solid fa-warehouse"></i>
                        <span>Inventory</span>
                    </a>
                    <a className={`nav-item ${activeTab === 'processing' ? 'active' : ''}`} onClick={() => { setActiveTab('processing'); setIsSidebarOpen(false); }}>
                        <i className="fa-solid fa-gears"></i>
                        <span>Processing</span>
                    </a>
                    <a className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => { setActiveTab('profile'); setIsSidebarOpen(false); }}>
                        <i className="fa-solid fa-user-gear"></i>
                        <span>Profile</span>
                    </a>
                </nav>
                <div className="sidebar-bottom">
                    <div style={{ padding: '1rem', background: 'rgba(0, 255, 136, 0.05)', borderRadius: '12px', marginBottom: '1rem', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Mill Type</div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 600 }}>{millType || 'Not Set'}</div>
                        <div style={{ fontSize: '0.7rem', color: millType ? 'var(--text-main)' : 'var(--text-muted)', marginTop: '0.5rem' }}>
                            <i className={`fa-solid ${hasColdStorage ? 'fa-snowflake' : 'fa-circle-xmark'}`} style={{ marginRight: '5px' }}></i>
                            {hasColdStorage ? 'Has Cold Storage' : 'No Cold Storage'}
                        </div>
                    </div>
                    <a className="nav-item logout" onClick={onLogout}>
                        <i className="fa-solid fa-arrow-right-from-bracket"></i>
                        <span>Logout</span>
                    </a>
                </div>
            </aside>

            <main className="main-content">
                <header className="top-header">
                    <div className="header-left">
                        <button className="menu-toggle" onClick={() => setIsSidebarOpen(true)}>
                            <i className="fa-solid fa-bars"></i>
                        </button>
                        <button className="action-btn back-btn" onClick={onLogout}>
                            <i className="fa-solid fa-arrow-left"></i>
                        </button>
                        <div className="search-bar">
                            <i className="fa-solid fa-search"></i>
                            <input type="text" placeholder="Search orders, stock..." />
                        </div>
                    </div>

                    <div className="header-actions" style={{ alignItems: 'center' }}>
                        <div style={{ textAlign: 'right', marginRight: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text)' }}>
                                {currentTime.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })}
                            </div>
                            <div>{currentTime.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</div>
                        </div>
                        <div className="user-profile">
                            <div className="profile-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', color: 'var(--primary)', fontSize: '1.5rem', width: '45px', height: '45px', borderRadius: '50%' }}>
                                <i className="fa-solid fa-industry"></i>
                            </div>
                            <div className="user-info">
                                <h4>{profileName || user.phone}</h4>
                                <p>Verified {user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
                            </div>
                        </div>
                    </div>
                </header>

                {activeTab === 'dashboard' && (
                    <div className="dashboard view-section" style={{ display: 'block' }}>
                        <div className="welcome-section">
                            <div>
                                <h1>Mill Dashboard 🏭</h1>
                                <p>Manage your processing units and raw material stock.</p>
                            </div>
                        </div>

                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-icon revenue"><i className="fa-solid fa-scale-balanced"></i></div>
                                <div className="stat-details">
                                    <h3>Raw Stock</h3>
                                    <h2>0 Tons</h2>
                                    <span className="trend neutral">Update inventory</span>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon crops"><i className="fa-solid fa-microchip"></i></div>
                                <div className="stat-details">
                                    <h3>Unit Efficiency</h3>
                                    <h2>-- %</h2>
                                    <span className="trend neutral">Idle state</span>
                                </div>
                            </div>
                        </div>

                        <div className="bento-grid">
                            <div className="bento-card" style={{ gridColumn: 'span 12', textAlign: 'center', padding: '3rem' }}>
                                <i className="fa-solid fa-screwdriver-wrench" style={{ fontSize: '3rem', color: 'var(--primary)', marginBottom: '1rem', opacity: 0.3 }}></i>
                                <h3>No Active Runs</h3>
                                <p style={{ color: 'var(--text-muted)' }}>Start a new processing batch to see real-time analytics here.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Profile section logic omitted for brevity in this scratch create tool, same as others */}
                {activeTab === 'profile' && (
                    <div className="dashboard view-section" style={{ display: 'block' }}>
                        <div className="welcome-section">
                            <div>
                                <h1>Mill & Profile Settings ⚙️</h1>
                                <p>Manage your business profile and processing capabilities.</p>
                            </div>
                        </div>
                        <div className="bento-grid">
                            <div className="bento-card" style={{ gridColumn: 'span 12', maxWidth: '600px', margin: '0 auto' }}>
                                <div className="card-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                                    <h3>Personal & Business Info</h3>
                                </div>
                                <div className="input-field" style={{ marginBottom: '1.25rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Business/Owner Name</label>
                                    <div className="input-group">
                                        <i className="fa-solid fa-user"></i>
                                        <input type="text" placeholder="Enter name" value={profileName} onChange={e => setProfileName(e.target.value)} />
                                    </div>
                                </div>
                                <div className="input-field" style={{ marginBottom: '1.25rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Alternate Phone</label>
                                    <div className="input-group">
                                        <i className="fa-solid fa-phone"></i>
                                        <input type="tel" placeholder="10-digit number" maxLength="10" value={profileAltPhone} onChange={e => setProfileAltPhone(e.target.value)} />
                                    </div>
                                </div>

                                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
                                    <div className="card-header" style={{ marginBottom: '1rem' }}>
                                        <h3>Mill Configuration</h3>
                                    </div>
                                    <div className="input-field" style={{ marginBottom: '1.25rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Primary Processed Crop (Mill Type)</label>
                                        <div className="input-group">
                                            <i className="fa-solid fa-wheat-awn"></i>
                                            <select
                                                value={millType}
                                                onChange={e => setMillType(e.target.value)}
                                                style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text-main)', outline: 'none', cursor: 'pointer' }}
                                            >
                                                <option value="" style={{ color: '#000' }}>Select Crop Type</option>
                                                <option value="Rice Mill" style={{ color: '#000' }}>Rice Mill</option>
                                                <option value="Dhal Mill (Pulses)" style={{ color: '#000' }}>Dhal Mill (Pulses)</option>
                                                <option value="Flour Mill" style={{ color: '#000' }}>Flour Mill</option>
                                                <option value="Oil Mill" style={{ color: '#000' }}>Oil Mill</option>
                                                <option value="Cotton Ginning" style={{ color: '#000' }}>Cotton Ginning</option>
                                                <option value="Sugar Mill" style={{ color: '#000' }}>Sugar Mill</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg-dark)', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <i className="fa-solid fa-snowflake" style={{ color: hasColdStorage ? 'var(--primary)' : 'var(--text-muted)', fontSize: '1.2rem' }}></i>
                                            <div>
                                                <div style={{ fontWeight: 600 }}>Cold Storage Facility</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Does your mill contain refrigeration units?</div>
                                            </div>
                                        </div>
                                        <div
                                            onClick={() => setHasColdStorage(!hasColdStorage)}
                                            style={{
                                                width: '50px',
                                                height: '26px',
                                                background: hasColdStorage ? 'var(--primary)' : '#333',
                                                borderRadius: '13px',
                                                position: 'relative',
                                                cursor: 'pointer',
                                                transition: '0.3s'
                                            }}
                                        >
                                            <div style={{
                                                width: '20px',
                                                height: '20px',
                                                background: '#fff',
                                                borderRadius: '50%',
                                                position: 'absolute',
                                                top: '3px',
                                                left: hasColdStorage ? '27px' : '3px',
                                                transition: '0.3s'
                                            }}></div>
                                        </div>
                                    </div>
                                </div>

                                <button onClick={handleUpdateProfile} className="primary-btn" style={{ width: '100%', justifyContent: 'center' }} disabled={isSavingProfile}>
                                    {isSavingProfile ? 'Saving Information...' : 'Save All Changes'}
                                </button>
                            </div>

                            <div className="bento-card" style={{ gridColumn: 'span 12', maxWidth: '600px', margin: '1rem auto' }}>
                                <div className="card-header" style={{ marginBottom: '1rem' }}>
                                    <h3>Login Security</h3>
                                </div>
                                <div className="input-group" style={{ marginBottom: '1rem' }}>
                                    <i className="fa-solid fa-mobile-screen"></i>
                                    <input type="tel" placeholder="Change Login Phone" maxLength="10" value={newPhone} onChange={e => setNewPhone(e.target.value)} />
                                </div>
                                <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                                    <i className="fa-solid fa-lock"></i>
                                    <input type="password" placeholder="New 6-digit PIN" maxLength="6" value={newPin} onChange={e => setNewPin(e.target.value)} />
                                </div>
                                <button onClick={handleUpdateSecurity} className="primary-btn" style={{ width: '100%', justifyContent: 'center', background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)' }}>
                                    Update Security Credentials
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
