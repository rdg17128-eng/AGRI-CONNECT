import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

export default function ConsumerPortal({ user, onLogout }) {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="app-container" style={{ display: 'flex' }}>
            <aside className="sidebar">
                <div className="logo">
                    <i className="fa-solid fa-leaf"></i>
                    <span>AgriConnect</span>
                </div>
                <nav className="nav-menu">
                    <a className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
                        <i className="fa-solid fa-house"></i>
                        <span>Home</span>
                    </a>
                    <a className={`nav-item ${activeTab === 'shop' ? 'active' : ''}`} onClick={() => setActiveTab('shop')}>
                        <i className="fa-solid fa-cart-shopping"></i>
                        <span>Shop Fresh</span>
                    </a>
                    <a className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
                        <i className="fa-solid fa-receipt"></i>
                        <span>My Orders</span>
                    </a>
                    <a className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
                        <i className="fa-solid fa-user"></i>
                        <span>Account</span>
                    </a>
                </nav>
                <div className="sidebar-bottom">
                    <a className="nav-item logout" onClick={onLogout}>
                        <i className="fa-solid fa-arrow-right-from-bracket"></i>
                        <span>Logout</span>
                    </a>
                </div>
            </aside>

            <main className="main-content">
                <header className="top-header">
                    <div className="header-left">
                        <button className="action-btn back-btn" onClick={onLogout}>
                            <i className="fa-solid fa-arrow-left"></i>
                        </button>
                        <div className="search-bar">
                            <i className="fa-solid fa-search"></i>
                            <input type="text" placeholder="Search rice, grains, vegetables..." />
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
                                <i className="fa-solid fa-basket-shopping"></i>
                            </div>
                            <div className="user-info">
                                <h4>{user.phone}</h4>
                                <p>Verified {user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
                            </div>
                        </div>
                    </div>
                </header>

                {activeTab === 'dashboard' && (
                    <div className="dashboard view-section" style={{ display: 'block' }}>
                        <div className="welcome-section">
                            <div>
                                <h1>Fresh from Farm to You! 🍎</h1>
                                <p>Quality assurance and direct-from-source pricing.</p>
                            </div>
                        </div>

                        <div className="bento-grid">
                            <div className="bento-card" style={{ gridColumn: 'span 12', padding: '4rem 0', textAlign: 'center' }}>
                                <i className="fa-solid fa-truck-ramp-box" style={{ fontSize: '3.5rem', color: 'var(--primary)', marginBottom: '1.5rem', opacity: 0.4 }}></i>
                                <h2>Direct Marketplace Coming Soon</h2>
                                <p style={{ color: 'var(--text-muted)' }}>We are onboarding local farms to bring you the freshest produce at the best prices.</p>
                                <button className="primary-btn" style={{ margin: '1.5rem auto 0 auto' }}>Notify Me</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
