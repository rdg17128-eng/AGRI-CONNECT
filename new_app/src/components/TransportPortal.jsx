import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { kisanService } from '../services/kisanService';
import KisanLogo from './KisanLogo';

export default function TransportPortal({ user: propUser, onLogout }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { user: authUser, logout: authLogout } = useAuth();
    const user = propUser || authUser || {};
    const handleLogout = onLogout || authLogout;

    const pathToTab = {
        '': 'dashboard',
        'dashboard': 'dashboard',
        'requests': 'requests',
        'active': 'active',
        'quotes': 'quotes',
        'completed': 'completed',
        'history': 'history',
        'vehicles': 'vehicle',
        'vehicle': 'vehicle',
        'profile': 'profile'
    };
    const currentSubPath = location.pathname.replace(/^\/transport\/?/, '').split('/')[0];
    const activeTab = pathToTab[currentSubPath] || 'requests';

    const setActiveTab = (tab) => {
        const tabToPath = {
            'dashboard': '/transport/dashboard',
            'requests': '/transport/requests',
            'active': '/transport/active',
            'quotes': '/transport/quotes',
            'completed': '/transport/completed',
            'history': '/transport/history',
            'vehicle': '/transport/vehicles',
            'profile': '/transport/profile'
        };
        navigate(tabToPath[tab] || `/transport/${tab}`);
        setIsSidebarOpen(false);
    };

    // CRITICAL BACK BUTTON FIX: Stays inside Transport Portal workspace
    const handleBack = () => {
        if (window.history.state && window.history.state.idx > 0) {
            navigate(-1);
        } else {
            navigate('/transport/dashboard');
        }
    };

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [transportRequests, setTransportRequests] = useState([]);
    const [myQuotes, setMyQuotes] = useState([]);
    const [tripHistory, setTripHistory] = useState([]);
    const [historyFilter, setHistoryFilter] = useState('ALL');
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [quotePrice, setQuotePrice] = useState('');
    const [quoteTime, setQuoteTime] = useState('2.5 Hours');
    const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);
    const [providerInfo, setProviderInfo] = useState(() => {
        return {
            name: user?.name || 'Kisan Gati Logistics',
            phone: user?.phone || '9876500001',
            vehicle_number: user?.vehicle_number || 'TS 09 EA 4421',
            vehicle_type: user?.vehicle_type || 'Truck',
            capacity: Number(user?.capacity) || 15,
            price_per_km: Number(user?.price_per_km) || 40,
            availability: 'AVAILABLE',
            location: 'Warangal Agri Hub'
        };
    });

    const refreshData = () => {
        const allReqs = kisanService.getTransportRequests();
        setTransportRequests(allReqs);
        const quotes = kisanService.getQuotesForRequest('');
        setMyQuotes(quotes.filter(q => q.provider_phone === providerInfo.phone || q.provider_id === providerInfo.phone));
        const hist = kisanService.getTransporterHistory(providerInfo.phone);
        setTripHistory(hist);
    };

    useEffect(() => {
        refreshData();
        const unsub = kisanService.subscribe(() => {
            refreshData();
        });
        return () => unsub();
    }, [providerInfo.phone]);

    // Smart truck matching: Only show available requests where truck capacity >= required capacity
    const suitableRequests = transportRequests.filter(req => {
        const reqCap = Number(req.required_capacity || req.quantity || 10);
        return providerInfo.capacity >= reqCap && (req.status === 'SEARCHING' || req.status === 'QUOTED');
    });

    const activeTrips = transportRequests.filter(req => 
        (req.assigned_provider_id === providerInfo.phone || req.assigned_provider_phone === providerInfo.phone) &&
        req.status !== 'DELIVERED'
    );

    const completedTrips = transportRequests.filter(req => 
        (req.assigned_provider_id === providerInfo.phone || req.assigned_provider_phone === providerInfo.phone) &&
        req.status === 'DELIVERED'
    );

    const handleSendQuote = (e) => {
        e.preventDefault();
        if (!selectedRequest || !quotePrice || isNaN(quotePrice)) {
            return alert("Please enter a valid quote price in ₹.");
        }

        setIsSubmittingQuote(true);
        try {
            kisanService.submitTransportQuote(
                selectedRequest.transport_code,
                providerInfo,
                Number(quotePrice),
                quoteTime
            );
            alert(`Quote of ₹${quotePrice} sent successfully for ${selectedRequest.transport_code}!`);
            setSelectedRequest(null);
            setQuotePrice('');
            refreshData();
        } catch (err) {
            console.error("Quote error:", err);
            alert("Failed to submit quote.");
        } finally {
            setIsSubmittingQuote(false);
        }
    };

    const handleUpdateTripStatus = (transportCode, nextStatus) => {
        kisanService.updateTransportStatus(transportCode, nextStatus);
        refreshData();
    };

    return (
        <div className="portal-container">
            {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>}

            {/* Sidebar */}
            <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="logo" style={{ marginBottom: '2rem' }}>
                    <KisanLogo size="md" />
                </div>

                <div style={{ padding: '0 1rem 1.25rem 1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Fleet Operator</div>
                    <strong style={{ fontSize: '1rem', color: 'var(--accent-gold)' }}>{providerInfo.name}</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: '0.2rem' }}>
                        <i className="fa-solid fa-truck"></i> {providerInfo.vehicle_number} ({providerInfo.capacity}T)
                    </div>
                </div>

                <nav className="nav-menu">
                    <a className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}>
                        <i className="fa-solid fa-house"></i>
                        <span>Dashboard</span>
                    </a>
                    <a className={`nav-item ${activeTab === 'requests' ? 'active' : ''}`} onClick={() => { setActiveTab('requests'); setIsSidebarOpen(false); }}>
                        <i className="fa-solid fa-clipboard-list"></i>
                        <span>Available Requests</span>
                        {suitableRequests.length > 0 && (
                            <span className="badge" style={{ marginLeft: 'auto', background: 'var(--primary)', color: '#000', padding: '0.1rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 800 }}>
                                {suitableRequests.length}
                            </span>
                        )}
                    </a>
                    <a className={`nav-item ${activeTab === 'active' ? 'active' : ''}`} onClick={() => { setActiveTab('active'); setIsSidebarOpen(false); }}>
                        <i className="fa-solid fa-route"></i>
                        <span>Active Deliveries</span>
                        {activeTrips.length > 0 && (
                            <span className="badge" style={{ marginLeft: 'auto', background: 'var(--accent-gold)', color: '#000', padding: '0.1rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 800 }}>
                                {activeTrips.length}
                            </span>
                        )}
                    </a>
                    <a className={`nav-item ${activeTab === 'quotes' ? 'active' : ''}`} onClick={() => { setActiveTab('quotes'); setIsSidebarOpen(false); }}>
                        <i className="fa-solid fa-tags"></i>
                        <span>My Quotes</span>
                    </a>
                    <a className={`nav-item ${activeTab === 'completed' ? 'active' : ''}`} onClick={() => { setActiveTab('completed'); setIsSidebarOpen(false); }}>
                        <i className="fa-solid fa-circle-check"></i>
                        <span>Completed Deliveries</span>
                    </a>
                    <a className={`nav-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => { setActiveTab('history'); setIsSidebarOpen(false); }}>
                        <i className="fa-solid fa-clock-rotate-left"></i>
                        <span>Trip History & Earnings</span>
                    </a>
                    <a className={`nav-item ${activeTab === 'vehicle' ? 'active' : ''}`} onClick={() => { setActiveTab('vehicle'); setIsSidebarOpen(false); }}>
                        <i className="fa-solid fa-truck-ramp-box"></i>
                        <span>Vehicle & Rates</span>
                    </a>
                </nav>

                <div className="sidebar-bottom">
                    <a className="nav-item logout" onClick={handleLogout}>
                        <i className="fa-solid fa-arrow-right-from-bracket"></i>
                        <span>Logout</span>
                    </a>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="main-content">
                {/* Header */}
                <header className="top-header">
                    <div className="header-left">
                        <button className="menu-toggle" onClick={() => setIsSidebarOpen(true)}>
                            <i className="fa-solid fa-bars"></i>
                        </button>
                        <button className="action-btn back-btn" onClick={handleBack} title="Back to Previous Page">
                            <i className="fa-solid fa-arrow-left"></i>
                        </button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span className="role-tag" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-gold)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '0.3rem 0.8rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 700 }}>
                                <i className="fa-solid fa-truck-moving" style={{ marginRight: '0.4rem' }}></i>
                                Transport Provider Portal
                            </span>
                        </div>
                    </div>

                    <div className="header-actions">
                        <button className="action-btn back-btn" onClick={handleLogout} title="Sign Out">
                            <i className="fa-solid fa-arrow-right-from-bracket"></i>
                        </button>
                    </div>
                </header>

                <div className="dashboard-content" style={{ padding: '2rem 1.5rem' }}>

                    {/* ======================================================== */}
                    {/* TAB: DASHBOARD OVERVIEW */}
                    {/* ======================================================== */}
                    {activeTab === 'dashboard' && (
                        <div>
                            <div className="bento-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                                <div className="bento-card">
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Available Matches</div>
                                    <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--primary)' }}>{suitableRequests.length}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Matching your {providerInfo.capacity}T capacity</div>
                                </div>
                                <div className="bento-card">
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Active Trips</div>
                                    <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--accent-gold)' }}>{activeTrips.length}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Currently in transit / scheduled</div>
                                </div>
                                <div className="bento-card">
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Quotes Sent</div>
                                    <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#38bdf8' }}>{myQuotes.length}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Bids placed on farmer loads</div>
                                </div>
                                <div className="bento-card">
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Delivered Loads</div>
                                    <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#a855f7' }}>{completedTrips.length}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Verified delivered at mills</div>
                                </div>
                            </div>

                            {/* Smart Matching Banner */}
                            <div className="bento-card" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(245, 158, 11, 0.1) 100%)', border: '1px solid rgba(16, 185, 129, 0.3)', marginBottom: '2rem', padding: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                                    <div>
                                        <h3 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                            <i className="fa-solid fa-network-wired" style={{ color: 'var(--primary)' }}></i>
                                            KisanConnect Smart Truck Matching Active
                                        </h3>
                                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                            Your vehicle ({providerInfo.vehicle_number}, {providerInfo.capacity} Ton capacity) is automatically filtered for loads requiring ≤ {providerInfo.capacity} Tons.
                                        </p>
                                    </div>
                                    <button className="primary-btn" onClick={() => setActiveTab('requests')}>
                                        Browse Available Requests ({suitableRequests.length})
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ======================================================== */}
                    {/* TAB: AVAILABLE TRANSPORT REQUESTS */}
                    {/* ======================================================== */}
                    {activeTab === 'requests' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Available Transport Requests</h2>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
                                        Verified farmer loads requiring haulage matching your truck capacity
                                    </p>
                                </div>
                                <button className="action-btn" onClick={refreshData}>
                                    <i className="fa-solid fa-rotate-right"></i> Refresh
                                </button>
                            </div>

                            {suitableRequests.length === 0 ? (
                                <div className="bento-card" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
                                    <i className="fa-solid fa-truck-clock fa-3x" style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}></i>
                                    <h3>No Active Requests Matching Your Capacity</h3>
                                    <p style={{ color: 'var(--text-muted)', maxWidth: '500px', margin: '0.5rem auto 0' }}>
                                        New transport requests generated from accepted farmer enquiries will automatically appear here.
                                    </p>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
                                    {suitableRequests.map(req => {
                                        const alreadyQuoted = myQuotes.some(q => q.transport_code === req.transport_code);
                                        const estPrice = Math.round((req.distance || 40) * providerInfo.price_per_km);

                                        return (
                                            <div key={req.id || req.transport_code} className="bento-card" style={{ border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                                                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent-gold)', fontSize: '0.95rem' }}>
                                                        {req.transport_code}
                                                    </span>
                                                    <span className="status-badge" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}>
                                                        {req.status}
                                                    </span>
                                                </div>

                                                <div style={{ marginBottom: '1rem', flex: 1 }}>
                                                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.15rem' }}>
                                                        {req.crop_name} • <span style={{ color: 'var(--primary)' }}>{req.quantity} Tons</span>
                                                    </h3>

                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                        <div>
                                                            <strong style={{ color: 'var(--text-main)' }}>Pickup:</strong> {req.pickup_address}
                                                        </div>
                                                        <div>
                                                            <strong style={{ color: 'var(--text-main)' }}>Delivery:</strong> {req.delivery_address} ({req.mill_name})
                                                        </div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.3rem' }}>
                                                            <span>Distance: <strong style={{ color: 'var(--text-main)' }}>~{req.distance || 40} km</strong></span>
                                                            <span>Date: <strong style={{ color: 'var(--text-main)' }}>{req.pickup_date || 'Flexible'}</strong></span>
                                                        </div>
                                                        <div>
                                                            <span>Associated Enquiry: <strong style={{ fontFamily: 'monospace', color: 'var(--accent-gold)' }}>{req.enquiry_code}</strong></span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div>
                                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Base Estimate</div>
                                                        <strong style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>₹{estPrice.toLocaleString()}</strong>
                                                    </div>

                                                    {alreadyQuoted ? (
                                                        <span style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.85rem' }}>
                                                            ✓ Quote Submitted
                                                        </span>
                                                    ) : (
                                                        <button 
                                                            className="primary-btn" 
                                                            onClick={() => {
                                                                setSelectedRequest(req);
                                                                setQuotePrice(String(estPrice));
                                                            }}
                                                            style={{ padding: '0.6rem 1.1rem', fontSize: '0.85rem' }}
                                                        >
                                                            <i className="fa-solid fa-paper-plane"></i>
                                                            Send Quote
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ======================================================== */}
                    {/* TAB: ACTIVE DELIVERIES & LIFECYCLE */}
                    {/* ======================================================== */}
                    {activeTab === 'active' && (
                        <div>
                            <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem' }}>Active Haulage Deliveries</h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                                Real-time dispatch, pickup confirmation, transit updates, and gate arrival
                            </p>

                            {activeTrips.length === 0 ? (
                                <div className="bento-card" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
                                    <i className="fa-solid fa-route fa-3x" style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}></i>
                                    <h3>No Deliveries In Progress</h3>
                                    <p style={{ color: 'var(--text-muted)' }}>When a farmer accepts your transport quote, the delivery will activate here.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    {activeTrips.map(trip => {
                                        // Lifecycle: ASSIGNED -> PICKUP_STARTED -> CROP_PICKED_UP -> IN_TRANSIT -> ARRIVED_AT_MILL -> DELIVERED
                                        const statuses = ['ASSIGNED', 'PICKUP_STARTED', 'CROP_PICKED_UP', 'IN_TRANSIT', 'ARRIVED_AT_MILL', 'DELIVERED'];
                                        const currentIndex = statuses.indexOf(trip.status);

                                        return (
                                            <div key={trip.transport_code} className="bento-card" style={{ border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                    <div>
                                                        <span style={{ fontFamily: 'monospace', color: 'var(--accent-gold)', fontWeight: 800, fontSize: '1.1rem' }}>
                                                            {trip.transport_code}
                                                        </span>
                                                        <span style={{ marginLeft: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                            Enquiry: <strong style={{ color: 'var(--text-main)' }}>{trip.enquiry_code}</strong>
                                                        </span>
                                                    </div>
                                                    <span className="status-badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: 'var(--primary)' }}>
                                                        {trip.status}
                                                    </span>
                                                </div>

                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem', background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '0.75rem' }}>
                                                    <div>
                                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Cargo / Quantity</div>
                                                        <strong>{trip.crop_name} ({trip.quantity} Tons)</strong>
                                                    </div>
                                                    <div>
                                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Farmer Contact</div>
                                                        <strong>{trip.farmer_name} ({trip.farmer_phone})</strong>
                                                    </div>
                                                    <div>
                                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Destination Mill</div>
                                                        <strong>{trip.mill_name}</strong>
                                                    </div>
                                                    <div>
                                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Agreed Haulage Fee</div>
                                                        <strong style={{ color: 'var(--primary)' }}>₹{trip.final_price?.toLocaleString()}</strong>
                                                    </div>
                                                </div>

                                                {/* Visual Transport Progress Stepper */}
                                                <div style={{ marginBottom: '1.5rem', overflowX: 'auto', padding: '0.5rem 0' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', minWidth: '600px' }}>
                                                        {statuses.slice(0, 5).map((st, idx) => {
                                                            const isDone = currentIndex >= idx;
                                                            const isCurrent = currentIndex === idx;

                                                            return (
                                                                <React.Fragment key={st}>
                                                                    <div style={{ textAlign: 'center', flex: 1 }}>
                                                                        <div style={{
                                                                            width: '32px',
                                                                            height: '32px',
                                                                            borderRadius: '50%',
                                                                            margin: '0 auto 0.4rem',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            background: isDone ? 'var(--primary)' : 'rgba(255, 255, 255, 0.1)',
                                                                            color: isDone ? '#000' : 'var(--text-muted)',
                                                                            fontWeight: 800,
                                                                            fontSize: '0.8rem',
                                                                            boxShadow: isCurrent ? '0 0 15px var(--primary-glow)' : 'none'
                                                                        }}>
                                                                            {isDone ? <i className="fa-solid fa-check"></i> : idx + 1}
                                                                        </div>
                                                                        <div style={{ fontSize: '0.7rem', color: isDone ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: isCurrent ? 700 : 400 }}>
                                                                            {st.replace(/_/g, ' ')}
                                                                        </div>
                                                                    </div>
                                                                    {idx < 4 && (
                                                                        <div style={{ flex: 1, height: '3px', background: currentIndex > idx ? 'var(--primary)' : 'rgba(255, 255, 255, 0.1)', margin: '0 -10px 1.2rem' }}></div>
                                                                    )}
                                                                </React.Fragment>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                {/* Progression Control Action Buttons */}
                                                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                                    {trip.status === 'ASSIGNED' && (
                                                        <button className="primary-btn" onClick={() => handleUpdateTripStatus(trip.transport_code, 'PICKUP_STARTED')}>
                                                            <i className="fa-solid fa-truck-fast"></i> Start Journey to Farm
                                                        </button>
                                                    )}
                                                    {trip.status === 'PICKUP_STARTED' && (
                                                        <button className="primary-btn" onClick={() => handleUpdateTripStatus(trip.transport_code, 'CROP_PICKED_UP')}>
                                                            <i className="fa-solid fa-box"></i> Confirm Crop Picked Up
                                                        </button>
                                                    )}
                                                    {trip.status === 'CROP_PICKED_UP' && (
                                                        <button className="primary-btn" onClick={() => handleUpdateTripStatus(trip.transport_code, 'IN_TRANSIT')}>
                                                            <i className="fa-solid fa-road"></i> In Transit to Mill
                                                        </button>
                                                    )}
                                                    {trip.status === 'IN_TRANSIT' && (
                                                        <button className="primary-btn" onClick={() => handleUpdateTripStatus(trip.transport_code, 'ARRIVED_AT_MILL')}>
                                                            <i className="fa-solid fa-warehouse"></i> Arrived at Mill Gate
                                                        </button>
                                                    )}
                                                    {trip.status === 'ARRIVED_AT_MILL' && (
                                                        <button className="primary-btn" onClick={() => handleUpdateTripStatus(trip.transport_code, 'DELIVERED')}>
                                                            <i className="fa-solid fa-circle-check"></i> Complete Delivery
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ======================================================== */}
                    {/* TAB: MY QUOTES */}
                    {/* ======================================================== */}
                    {activeTab === 'quotes' && (
                        <div>
                            <h2 style={{ margin: '0 0 1.25rem 0', fontSize: '1.5rem' }}>Quotes Submitted</h2>
                            {myQuotes.length === 0 ? (
                                <div className="bento-card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                                    <p style={{ color: 'var(--text-muted)' }}>You haven't submitted any quotes yet.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                                    {myQuotes.map(q => (
                                        <div key={q.id} className="bento-card">
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                                <strong style={{ fontFamily: 'monospace', color: 'var(--accent-gold)' }}>{q.transport_code}</strong>
                                                <span className="status-badge" style={{ background: q.status === 'ACCEPTED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(234, 179, 8, 0.2)', color: q.status === 'ACCEPTED' ? 'var(--primary)' : '#fbbf24' }}>
                                                    {q.status}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.5rem' }}>
                                                ₹{q.price?.toLocaleString()}
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                Vehicle: {q.vehicle_number} • Est. Time: {q.estimated_time}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ======================================================== */}
                    {/* TAB: TRIP HISTORY & EARNINGS */}
                    {/* ======================================================== */}
                    {activeTab === 'history' && (
                        <div className="history-container">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Trip History & Freight Earnings 🚛</h2>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
                                        Complete archive of completed farm pickups, mill drop-offs, and earnings payouts
                                    </p>
                                </div>
                                <button className="action-btn" onClick={refreshData} style={{ fontSize: '0.85rem' }}>
                                    <i className="fa-solid fa-rotate-right"></i> Refresh History
                                </button>
                            </div>

                            {/* Summary Metric Cards */}
                            <div className="history-summary-grid">
                                <div className="history-stat-card">
                                    <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                                        <i className="fa-solid fa-circle-check"></i>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Trips Completed</div>
                                        <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary)' }}>
                                            {tripHistory.filter(t => t.status === 'COMPLETED').length} Loads
                                        </div>
                                    </div>
                                </div>
                                <div className="history-stat-card">
                                    <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                                        <i className="fa-solid fa-weight-hanging"></i>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cargo Moved</div>
                                        <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-gold)' }}>
                                            {tripHistory.reduce((acc, t) => acc + (Number(t.quantity) || 0), 0)} Tons
                                        </div>
                                    </div>
                                </div>
                                <div className="history-stat-card">
                                    <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                                        <i className="fa-solid fa-wallet"></i>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Freight Earnings</div>
                                        <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
                                            ₹{tripHistory.reduce((acc, t) => acc + (Number(t.earnings) || 0), 0).toLocaleString('en-IN')}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Filter Chips */}
                            <div className="history-filters">
                                {[
                                    { label: 'All Trips', val: 'ALL' },
                                    { label: 'Completed', val: 'COMPLETED' },
                                    { label: 'In Transit', val: 'IN_TRANSIT' }
                                ].map(f => (
                                    <button
                                        key={f.val}
                                        className={`history-filter-btn ${historyFilter === f.val ? 'active' : ''}`}
                                        onClick={() => setHistoryFilter(f.val)}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>

                            {/* Trip History Feed */}
                            {tripHistory.filter(t => historyFilter === 'ALL' || t.status === historyFilter).length === 0 ? (
                                <div className="bento-card" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
                                    <i className="fa-solid fa-truck-moving fa-3x" style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}></i>
                                    <h3>No Trip History Recorded</h3>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No trips matching the "{historyFilter}" filter.</p>
                                </div>
                            ) : (
                                <div className="history-feed">
                                    {tripHistory
                                        .filter(t => historyFilter === 'ALL' || t.status === historyFilter)
                                        .map(trip => (
                                            <div key={trip.id} className="history-card">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '220px' }}>
                                                    <div style={{
                                                        width: '42px',
                                                        height: '42px',
                                                        borderRadius: '50%',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        background: trip.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                                        color: trip.status === 'COMPLETED' ? 'var(--primary)' : 'var(--accent-gold)'
                                                    }}>
                                                        <i className={`fa-solid ${trip.status === 'COMPLETED' ? 'fa-circle-check' : 'fa-truck-fast'}`}></i>
                                                    </div>
                                                    <div>
                                                        <div style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--accent-gold)', fontSize: '0.95rem' }}>
                                                            {trip.transport_code}
                                                        </div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                            {new Date(trip.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div style={{ flex: 1, minWidth: '220px' }}>
                                                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                                                        {trip.crop_name} Delivery ({trip.quantity} Tons)
                                                    </div>
                                                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                                        <span>From: <strong>{trip.pickup}</strong></span> ➔ <span>To: <strong>{trip.delivery}</strong></span>
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                                                        Vehicle: <strong>{trip.vehicle_number}</strong> • Enquiry: <span style={{ fontFamily: 'monospace' }}>{trip.enquiry_code}</span>
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Payout Earned</div>
                                                        <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.15rem' }}>
                                                            ₹{Number(trip.earnings).toLocaleString('en-IN')}
                                                        </div>
                                                    </div>
                                                    <span className={trip.status === 'COMPLETED' ? 'badge-green' : 'badge-gold'}>
                                                        {trip.status}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ======================================================== */}
                    {/* TAB: VEHICLE & RATES */}
                    {/* ======================================================== */}
                    {activeTab === 'vehicle' && (
                        <div className="bento-card" style={{ maxWidth: '600px' }}>
                            <h3 style={{ margin: '0 0 1.25rem 0' }}>Vehicle Profile & Haulage Rates</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Vehicle Registration</label>
                                    <input 
                                        type="text" 
                                        value={providerInfo.vehicle_number} 
                                        onChange={(e) => setProviderInfo({ ...providerInfo, vehicle_number: e.target.value })}
                                        style={{ width: '100%', padding: '0.75rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'inherit' }}
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Capacity (Tons)</label>
                                        <input 
                                            type="number" 
                                            value={providerInfo.capacity} 
                                            onChange={(e) => setProviderInfo({ ...providerInfo, capacity: Number(e.target.value) })}
                                            style={{ width: '100%', padding: '0.75rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'inherit' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Rate (₹ / km)</label>
                                        <input 
                                            type="number" 
                                            value={providerInfo.price_per_km} 
                                            onChange={(e) => setProviderInfo({ ...providerInfo, price_per_km: Number(e.target.value) })}
                                            style={{ width: '100%', padding: '0.75rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'inherit' }}
                                        />
                                    </div>
                                </div>
                                <button className="primary-btn" onClick={() => alert("Vehicle profile updated successfully!")} style={{ marginTop: '1rem', justifyContent: 'center' }}>
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    )}

                </div>

                {/* Mobile Bottom Navigation */}
                <div className="mobile-nav-bar">
                    <button className={`mobile-nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
                        <i className="fa-solid fa-house"></i>
                        <span>Home</span>
                    </button>
                    <button className={`mobile-nav-btn ${activeTab === 'requests' ? 'active' : ''}`} onClick={() => setActiveTab('requests')}>
                        <i className="fa-solid fa-clipboard-list"></i>
                        <span>Loads</span>
                    </button>
                    <button className={`mobile-nav-btn ${activeTab === 'active' ? 'active' : ''}`} onClick={() => setActiveTab('active')}>
                        <i className="fa-solid fa-route"></i>
                        <span>Active</span>
                    </button>
                    <button className={`mobile-nav-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
                        <i className="fa-solid fa-clock-rotate-left"></i>
                        <span>History</span>
                    </button>
                    <button className="mobile-nav-btn" onClick={() => setIsSidebarOpen(true)}>
                        <i className="fa-solid fa-bars"></i>
                        <span>More</span>
                    </button>
                </div>
            </main>

            {/* SEND QUOTE MODAL */}
            {selectedRequest && (
                <div className="modal-overlay" style={{ zIndex: 9999 }}>
                    <div className="modal-content bento-card" style={{ maxWidth: '460px', width: '92%', padding: '2rem 1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <h3 style={{ margin: 0 }}>Send Transport Quote</h3>
                            <button className="action-btn text-btn" onClick={() => setSelectedRequest(null)}>
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>

                        <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                            <div>Request ID: <strong style={{ color: 'var(--accent-gold)' }}>{selectedRequest.transport_code}</strong></div>
                            <div>Crop: <strong>{selectedRequest.crop_name} ({selectedRequest.quantity} Tons)</strong></div>
                            <div>Distance: <strong>~{selectedRequest.distance || 40} km</strong></div>
                        </div>

                        <form onSubmit={handleSendQuote} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Quote Price (₹)</label>
                                <input 
                                    type="number"
                                    value={quotePrice}
                                    onChange={(e) => setQuotePrice(e.target.value)}
                                    placeholder="Enter quote amount"
                                    required
                                    style={{ width: '100%', padding: '0.75rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'inherit', fontSize: '1.1rem', fontWeight: 700 }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Estimated Delivery Time</label>
                                <input 
                                    type="text"
                                    value={quoteTime}
                                    onChange={(e) => setQuoteTime(e.target.value)}
                                    placeholder="e.g. 2.5 Hours"
                                    style={{ width: '100%', padding: '0.75rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'inherit' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                                <button type="button" className="text-btn" onClick={() => setSelectedRequest(null)} style={{ flex: 1, justifyContent: 'center' }}>
                                    Cancel
                                </button>
                                <button type="submit" className="primary-btn" disabled={isSubmittingQuote} style={{ flex: 1.5, justifyContent: 'center' }}>
                                    {isSubmittingQuote ? 'Sending...' : 'Submit Quote'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
