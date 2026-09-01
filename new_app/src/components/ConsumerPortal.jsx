import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import KisanLogo from './KisanLogo';
import { supabase } from '../utils/supabase';

export default function ConsumerPortal() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [crops, setCrops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cart, setCart] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Derive active tab from URL path: /consumer/products, /consumer/orders, /consumer/profile
    const pathParts = location.pathname.split('/');
    const activeTab = pathParts[2] || 'products';

    const handleTabChange = (tab) => {
        navigate(`/consumer/${tab}`);
        setIsSidebarOpen(false);
    };

    const handleBack = () => {
        if (window.history.state && window.history.state.idx > 0) {
            navigate(-1);
        } else {
            navigate('/consumer/products');
        }
    };

    useEffect(() => {
        const fetchProduce = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase.from('crops').select('*').limit(20);
                if (data && data.length > 0) {
                    setCrops(data);
                } else {
                    // Realistic fallback demo items
                    setCrops([
                        { id: '1', crop_name: 'Organic BPT Rice', acres: 5, location_name: 'Warangal Agri Farm', price_per_kg: 58, farmer_name: 'Ramesh Reddy' },
                        { id: '2', crop_name: 'Fresh Sweet Corn', acres: 3, location_name: 'Karimnagar Field 2', price_per_kg: 24, farmer_name: 'Suresh Rao' },
                        { id: '3', crop_name: 'Cold-Pressed Groundnut', acres: 4, location_name: 'Nalgonda Cluster', price_per_kg: 140, farmer_name: 'Mallesh Goud' },
                        { id: '4', crop_name: 'Pesticide-Free Red Gram (Tur Dal)', acres: 6, location_name: 'Adilabad Hills', price_per_kg: 165, farmer_name: 'Kavitha Devi' }
                    ]);
                }
            } catch (err) {
                console.warn("Produce fetch notice:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProduce();
    }, []);

    const filteredCrops = crops.filter(c =>
        c.crop_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.location_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="portal-container">
            {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>}

            {/* Sidebar */}
            <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="logo" style={{ marginBottom: '1.75rem' }}>
                    <KisanLogo size="md" />
                </div>

                <nav className="nav-menu">
                    <a className={`nav-item ${activeTab === 'products' ? 'active' : ''}`} onClick={() => handleTabChange('products')}>
                        <i className="fa-solid fa-basket-shopping"></i>
                        <span>Fresh Produce</span>
                    </a>
                    <a className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => handleTabChange('orders')}>
                        <i className="fa-solid fa-receipt"></i>
                        <span>My Orders</span>
                        {cart.length > 0 && (
                            <span className="badge" style={{ marginLeft: 'auto', background: 'var(--primary)', color: '#000', padding: '0.1rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 800 }}>
                                {cart.length}
                            </span>
                        )}
                    </a>
                    <a className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => handleTabChange('profile')}>
                        <i className="fa-solid fa-user-gear"></i>
                        <span>Profile & Address</span>
                    </a>
                </nav>

                <div className="sidebar-bottom">
                    <a className="nav-item logout" onClick={logout}>
                        <i className="fa-solid fa-arrow-right-from-bracket"></i>
                        <span>Logout</span>
                    </a>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <header className="top-header">
                    <div className="header-left">
                        <button className="menu-toggle" onClick={() => setIsSidebarOpen(true)}>
                            <i className="fa-solid fa-bars"></i>
                        </button>
                        <button className="action-btn back-btn" onClick={handleBack} title="Back to Previous Page">
                            <i className="fa-solid fa-arrow-left"></i>
                        </button>
                        <div className="search-bar">
                            <i className="fa-solid fa-search"></i>
                            <input
                                type="text"
                                placeholder="Search fresh grains, pulses, location..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="header-actions">
                        <button className="action-btn back-btn" onClick={logout} title="Sign Out">
                            <i className="fa-solid fa-arrow-right-from-bracket"></i>
                        </button>
                    </div>
                </header>

                <div className="dashboard">
                    <div className="welcome-section">
                        <div>
                            <h1>Farm-Fresh Direct Marketplace 🌾</h1>
                            <p>Direct farm-to-table traceability powered by KisanConnect QR verification</p>
                        </div>
                    </div>

                    {activeTab === 'products' && (
                        <div>
                            <div className="stats-grid">
                                <div className="stat-card">
                                    <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--primary)' }}>
                                        <i className="fa-solid fa-leaf"></i>
                                    </div>
                                    <div className="stat-details">
                                        <h3>Fresh Harvests</h3>
                                        <h2>{crops.length} Listed</h2>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-gold)' }}>
                                        <i className="fa-solid fa-certificate"></i>
                                    </div>
                                    <div className="stat-details">
                                        <h3>Certified Origin</h3>
                                        <h2>100% Direct</h2>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
                                {filteredCrops.map(crop => (
                                    <div key={crop.id} className="bento-card" style={{ display: 'flex', flexDirection: 'column' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                            <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-main)' }}>{crop.crop_name}</h3>
                                            <span className="badge-green">Verified</span>
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                                            <i className="fa-solid fa-location-dot" style={{ marginRight: '0.35rem', color: 'var(--accent-gold)' }}></i>
                                            {crop.location_name || 'Agri Cluster'}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                                            Farmer: <strong>{crop.farmer_name || crop.user_phone || 'Verified Farmer'}</strong>
                                        </div>
                                        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-gold)' }}>
                                                ₹{crop.price_per_kg || 45} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/ kg</span>
                                            </div>
                                            <button
                                                className="primary-btn"
                                                style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem' }}
                                                onClick={() => {
                                                    setCart([...cart, crop]);
                                                    alert(`Added ${crop.crop_name} to cart!`);
                                                }}
                                            >
                                                Order Now
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'orders' && (
                        <div className="bento-card">
                            <h3 style={{ marginBottom: '1rem' }}>Your Orders ({cart.length})</h3>
                            {cart.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)' }}>No active orders. Browse fresh produce to place an order!</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {cart.map((item, idx) => (
                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                                            <div>
                                                <strong>{item.crop_name}</strong>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Direct from {item.location_name}</div>
                                            </div>
                                            <div style={{ fontWeight: 700, color: 'var(--primary)' }}>
                                                ₹{item.price_per_kg || 45}/kg
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'profile' && (
                        <div className="bento-card" style={{ maxWidth: '600px' }}>
                            <h3 style={{ marginBottom: '1.25rem' }}>Consumer Profile</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Account: {user?.email || user?.phone}</p>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Name: {user?.name}</p>
                            <button className="primary-btn" onClick={logout} style={{ marginTop: '1rem' }}>
                                Sign Out
                            </button>
                        </div>
                    )}
                </div>

                {/* Mobile Bottom Navigation */}
                <div className="mobile-nav-bar">
                    <button className={`mobile-nav-btn ${activeTab === 'products' ? 'active' : ''}`} onClick={() => handleTabChange('products')}>
                        <i className="fa-solid fa-basket-shopping"></i>
                        <span>Produce</span>
                    </button>
                    <button className={`mobile-nav-btn ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => handleTabChange('orders')}>
                        <i className="fa-solid fa-receipt"></i>
                        <span>Orders</span>
                    </button>
                    <button className={`mobile-nav-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => handleTabChange('profile')}>
                        <i className="fa-solid fa-user-gear"></i>
                        <span>Profile</span>
                    </button>
                </div>
            </main>
        </div>
    );
}
