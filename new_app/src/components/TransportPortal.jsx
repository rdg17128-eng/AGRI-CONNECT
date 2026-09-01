import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { kisanService } from '../services/kisanService';
import KisanLogo from './KisanLogo';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
    iconRetinaUrl,
    iconUrl,
    shadowUrl,
});

const FLEET_DRIVERS = [
    { phone: '9876500001', name: 'Kisan Gati Logistics', vehicle_number: 'TS 09 EA 4421', vehicle_type: 'Truck', capacity: 15, price_per_km: 42, location: 'Warangal Agri Hub' },
    { phone: '9876500002', name: 'Balaji Agro Freight', vehicle_number: 'TS 08 UB 7712', vehicle_type: 'Mini Truck', capacity: 5, price_per_km: 28, location: 'Karimnagar Bypass' },
    { phone: '9876500003', name: 'Annapurna Heavy Haulers', vehicle_number: 'AP 16 TZ 9980', vehicle_type: 'Lorry', capacity: 25, price_per_km: 65, location: 'Khammam Mandi' },
    { phone: '9876500004', name: 'Gramin Kisan Express', vehicle_number: 'TS 07 TC 1109', vehicle_type: 'Truck', capacity: 10, price_per_km: 35, location: 'Nizamabad Yard' }
];

function TripRouteMap({ pickupLat, pickupLng, deliveryLat, deliveryLng, pickupAddress, deliveryAddress, millName }) {
    const pLat = Number(pickupLat) || 17.0916;
    const pLng = Number(pickupLng) || 80.0210;
    const dLat = Number(deliveryLat) || 17.1033;
    const dLng = Number(deliveryLng) || 80.0536;

    const center = [(pLat + dLat) / 2, (pLng + dLng) / 2];
    const polyline = [[pLat, pLng], [dLat, dLng]];

    return (
        <div style={{ height: '340px', width: '100%', borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid rgba(16, 185, 129, 0.3)', position: 'relative', marginTop: '0.75rem' }}>
            <MapContainer center={center} zoom={11} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
                <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[pLat, pLng]}>
                    <Popup>
                        <div style={{ color: '#000', fontSize: '0.85rem' }}>
                            <strong>🚜 Farm Harvest Pickup</strong><br />
                            {pickupAddress}
                        </div>
                    </Popup>
                </Marker>
                <Marker position={[dLat, dLng]}>
                    <Popup>
                        <div style={{ color: '#000', fontSize: '0.85rem' }}>
                            <strong>🏭 Mill Destination</strong><br />
                            {millName}<br />
                            {deliveryAddress}
                        </div>
                    </Popup>
                </Marker>
                <Polyline positions={polyline} color="#10b981" weight={6} opacity={0.85} dashArray="8, 8" />
            </MapContainer>
        </div>
    );
}

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

    // Smart truck matching & Assigned requests
    const assignedRequests = transportRequests.filter(req => 
        (req.assigned_provider_id === providerInfo.phone || req.assigned_provider_phone === providerInfo.phone) &&
        (req.status === 'ASSIGNED' || req.transport_status === 'PENDING')
    );

    const suitableRequests = transportRequests.filter(req => {
        const reqCap = Number(req.required_capacity || req.quantity || 10);
        return providerInfo.capacity >= reqCap && (req.status === 'SEARCHING' || req.status === 'QUOTED');
    });

    const activeTrips = transportRequests.filter(req => 
        (req.assigned_provider_id === providerInfo.phone || req.assigned_provider_phone === providerInfo.phone) &&
        req.status !== 'DELIVERED' && req.status !== 'REJECTED' && req.transport_status !== 'REJECTED'
    );

    const allFleetActiveTrips = transportRequests.filter(req => 
        req.status && req.status !== 'DELIVERED' && req.status !== 'SEARCHING' && req.status !== 'QUOTED' && req.status !== 'REJECTED'
    );

    const completedTrips = transportRequests.filter(req => 
        (req.assigned_provider_id === providerInfo.phone || req.assigned_provider_phone === providerInfo.phone) &&
        req.status === 'DELIVERED'
    );

    const handleAcceptDirectLoad = async (req) => {
        try {
            await kisanService.acceptTransportLoad(req.enquiry_code || req.enquiry_id, providerInfo);
            refreshData();
            setActiveTab('active');
        } catch (err) {
            console.error("Error accepting load:", err);
            alert("Failed to accept load. Please try again.");
        }
    };

    const handleRejectDirectLoad = async (req) => {
        const reason = window.prompt("Reason for declining this load (optional):", "Vehicle unavailable / route conflict");
        if (reason === null) return;
        try {
            await kisanService.rejectTransportLoad(req.enquiry_code || req.enquiry_id, reason);
            refreshData();
        } catch (err) {
            console.error("Error rejecting load:", err);
        }
    };

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
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Fleet Driver</div>
                    <select
                        value={providerInfo.phone}
                        onChange={(e) => {
                            const chosen = FLEET_DRIVERS.find(d => d.phone === e.target.value);
                            if (chosen) setProviderInfo(chosen);
                        }}
                        style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'var(--accent-gold)', fontWeight: 700, padding: '0.4rem 0.5rem', borderRadius: '0.4rem', marginTop: '0.25rem', cursor: 'pointer' }}
                    >
                        {FLEET_DRIVERS.map(d => (
                            <option key={d.phone} value={d.phone} style={{ background: '#111', color: '#fff' }}>
                                {d.name} ({d.capacity}T)
                            </option>
                        ))}
                    </select>
                    <div style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: '0.35rem' }}>
                        <i className="fa-solid fa-truck"></i> {providerInfo.vehicle_number} ({providerInfo.capacity}T {providerInfo.vehicle_type})
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
                            <span className="nav-badge" style={{ marginLeft: 'auto', background: 'var(--primary)', color: '#000', padding: '0.1rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 800 }}>
                                {suitableRequests.length}
                            </span>
                        )}
                    </a>
                    <a className={`nav-item ${activeTab === 'active' ? 'active' : ''}`} onClick={() => { setActiveTab('active'); setIsSidebarOpen(false); }}>
                        <i className="fa-solid fa-route"></i>
                        <span>Active Deliveries</span>
                        {activeTrips.length > 0 && (
                            <span className="nav-badge" style={{ marginLeft: 'auto', background: 'var(--accent-gold)', color: '#000', padding: '0.1rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 800 }}>
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

                            {/* Active Dispatch Hero Banner (if trip assigned) */}
                            {activeTrips.length > 0 && (
                                <div className="bento-card" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(245, 158, 11, 0.15) 100%)', border: '1px solid var(--primary)', marginBottom: '2rem', padding: '1.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                                        <div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                                                <i className="fa-solid fa-truck-fast"></i> Active Harvest Dispatch
                                            </div>
                                            <h3 style={{ margin: '0.35rem 0', fontSize: '1.3rem' }}>
                                                {activeTrips[0].crop_name} • {activeTrips[0].quantity} Tons ({activeTrips[0].acres} Acres)
                                            </h3>
                                            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                                Pickup: <strong>{activeTrips[0].pickup_address}</strong> (Farmer: {activeTrips[0].farmer_name}, {activeTrips[0].farmer_phone})
                                            </p>
                                        </div>
                                        <button className="primary-btn" onClick={() => setActiveTab('active')} style={{ fontSize: '0.9rem', padding: '0.75rem 1.25rem' }}>
                                            <i className="fa-solid fa-location-arrow"></i> Open Trip & Navigate
                                        </button>
                                    </div>
                                </div>
                            )}

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
                                    <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Transport Enquiries & Requests</h2>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
                                        Direct farmer load assignments and open haulage matching your {providerInfo.capacity}T vehicle
                                    </p>
                                </div>
                                <button className="action-btn" onClick={refreshData}>
                                    <i className="fa-solid fa-rotate-right"></i> Refresh
                                </button>
                            </div>

                            {/* SECTION 1: DIRECT ASSIGNED LOAD REQUESTS */}
                            {assignedRequests.length > 0 && (
                                <div style={{ marginBottom: '2rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--primary)', fontWeight: 800, fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        <i className="fa-solid fa-bell"></i> Assigned to You ({assignedRequests.length})
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
                                        {assignedRequests.map(req => (
                                            <div key={req.id || req.transport_code} className="bento-card" style={{ border: '2px solid rgba(16, 185, 129, 0.4)', display: 'flex', flexDirection: 'column', background: 'rgba(16, 185, 129, 0.04)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                                                    <div>
                                                        <span style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--accent-gold)', fontSize: '1rem' }}>
                                                            {req.enquiry_code || req.transport_code}
                                                        </span>
                                                        <div style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 700 }}>
                                                            DIRECT DRIVER ASSIGNMENT
                                                        </div>
                                                    </div>
                                                    <span className="status-badge" style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#fbbf24', padding: '0.2rem 0.6rem', fontSize: '0.75rem', fontWeight: 700 }}>
                                                        AWAITING ACCEPTANCE
                                                    </span>
                                                </div>

                                                <div style={{ marginBottom: '1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.85rem' }}>
                                                    <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '1.2rem', color: 'var(--text-main)' }}>
                                                        {req.crop_name} • <span style={{ color: 'var(--primary)' }}>{req.quantity} Tons</span>
                                                    </h3>

                                                    <div><span style={{ color: 'var(--text-muted)' }}>👨‍🌾 Farmer:</span> <strong>{req.farmer_name} ({req.farmer_phone})</strong></div>
                                                    <div><span style={{ color: 'var(--text-muted)' }}>📍 Pickup:</span> <strong>{req.pickup_address}</strong></div>
                                                    <div><span style={{ color: 'var(--text-muted)' }}>🏭 Destination:</span> <strong>{req.delivery_address} ({req.mill_name})</strong></div>
                                                    <div><span style={{ color: 'var(--text-muted)' }}>🗓️ Transport Date:</span> <strong style={{ color: 'var(--primary)' }}>{req.pickup_date || 'Prompt'}</strong></div>
                                                    <div><span style={{ color: 'var(--text-muted)' }}>🚛 Truck:</span> <strong style={{ fontFamily: 'monospace' }}>{providerInfo.vehicle_number}</strong> ({providerInfo.capacity}T {providerInfo.vehicle_type})</div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(0,0,0,0.3)', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', marginTop: '0.35rem' }}>
                                                        <span>Distance: <strong>~{req.distance || 35} KM</strong></span>
                                                        <span>Agreed Rate: <strong>₹{providerInfo.price_per_km || 35}/KM</strong></span>
                                                    </div>
                                                </div>

                                                <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Estimated Earnings:</span>
                                                        <strong style={{ fontSize: '1.2rem', color: 'var(--accent-gold)' }}>₹{Number(req.final_price || Math.round((req.distance || 35) * (providerInfo.price_per_km || 35))).toLocaleString()}</strong>
                                                    </div>

                                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                                        <button 
                                                            className="text-btn" 
                                                            onClick={() => handleRejectDirectLoad(req)}
                                                            style={{ flex: 1, justifyContent: 'center', padding: '0.65rem', color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '0.5rem' }}
                                                        >
                                                            <i className="fa-solid fa-xmark" style={{ marginRight: '0.3rem' }}></i> Reject
                                                        </button>
                                                        <button 
                                                            className="primary-btn" 
                                                            onClick={() => handleAcceptDirectLoad(req)}
                                                            style={{ flex: 1.5, justifyContent: 'center', padding: '0.65rem', fontWeight: 800 }}
                                                        >
                                                            <i className="fa-solid fa-truck-fast"></i> Accept Load
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* SECTION 2: OPEN FLEET REQUESTS */}
                            <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-main)' }}>
                                Open Fleet Load Inquiries ({suitableRequests.length})
                            </div>

                            {suitableRequests.length === 0 && assignedRequests.length === 0 ? (
                                <div className="bento-card" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
                                    <i className="fa-solid fa-truck-clock fa-3x" style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}></i>
                                    <h3>No Active Requests Matching Your Capacity</h3>
                                    <p style={{ color: 'var(--text-muted)', maxWidth: '500px', margin: '0.5rem auto 0' }}>
                                        New transport requests generated from farmer enquiries will automatically appear here.
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

                            {/* Auto-Switch Driver Alert Banner if trip assigned to another fleet driver */}
                            {activeTrips.length === 0 && allFleetActiveTrips.length > 0 && (
                                <div className="bento-card" style={{ background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                                    <div>
                                        <div style={{ fontWeight: 800, color: '#fbbf24', fontSize: '1rem' }}>
                                            <i className="fa-solid fa-truck-ramp-box"></i> Active Dispatch Assigned to Fleet Driver
                                        </div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                                            Trip <strong>{allFleetActiveTrips[0].transport_code}</strong> ({allFleetActiveTrips[0].crop_name}, {allFleetActiveTrips[0].quantity}T) was assigned to <strong>{allFleetActiveTrips[0].assigned_provider_name}</strong> ({allFleetActiveTrips[0].assigned_provider_phone}).
                                        </div>
                                    </div>
                                    <button 
                                        className="primary-btn"
                                        onClick={() => {
                                            const matched = FLEET_DRIVERS.find(d => d.phone === allFleetActiveTrips[0].assigned_provider_phone || d.phone === allFleetActiveTrips[0].assigned_provider_id);
                                            if (matched) {
                                                setProviderInfo(matched);
                                            } else {
                                                setProviderInfo({
                                                    phone: allFleetActiveTrips[0].assigned_provider_phone,
                                                    name: allFleetActiveTrips[0].assigned_provider_name,
                                                    vehicle_number: allFleetActiveTrips[0].vehicle_number || 'TS 09 EA 4421',
                                                    vehicle_type: allFleetActiveTrips[0].vehicle_type || 'Truck',
                                                    capacity: allFleetActiveTrips[0].required_capacity || 15,
                                                    price_per_km: 35
                                                });
                                            }
                                        }}
                                        style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                                    >
                                        Switch to This Driver
                                    </button>
                                </div>
                            )}

                            {activeTrips.length === 0 ? (
                                <div className="bento-card" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
                                    <i className="fa-solid fa-route fa-3x" style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}></i>
                                    <h3>No Deliveries In Progress for {providerInfo.name}</h3>
                                    <p style={{ color: 'var(--text-muted)' }}>When an enquiry is accepted with transport, the assigned driver will receive the trip here.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    {activeTrips.map(trip => {
                                        const statuses = ['ASSIGNED', 'PICKUP_STARTED', 'CROP_PICKED_UP', 'IN_TRANSIT', 'ARRIVED_AT_MILL', 'DELIVERED'];
                                        const currentIndex = statuses.indexOf(trip.status);
                                        const isPrePickup = trip.status === 'ASSIGNED' || trip.status === 'PICKUP_STARTED';
                                        const isPostPickup = trip.status === 'CROP_PICKED_UP' || trip.status === 'IN_TRANSIT' || trip.status === 'ARRIVED_AT_MILL';
                                        const cleanFarmerPhone = (trip.farmer_phone || '').replace(/\D/g, '');

                                        const pLat = Number(trip.pickup_lat) || 17.0916;
                                        const pLng = Number(trip.pickup_lng) || 80.0210;
                                        const dLat = Number(trip.delivery_lat) || 17.1033;
                                        const dLng = Number(trip.delivery_lng) || 80.0536;
                                        const googleMapsNavUrl = `https://www.google.com/maps/dir/?api=1&origin=${pLat},${pLng}&destination=${dLat},${dLng}&travelmode=driving`;

                                        return (
                                            <div key={trip.transport_code} className="bento-card" style={{ border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                                                {/* Card Header */}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                    <div>
                                                        <span style={{ fontFamily: 'monospace', color: 'var(--accent-gold)', fontWeight: 800, fontSize: '1.1rem' }}>
                                                            {trip.transport_code}
                                                        </span>
                                                        <span style={{ marginLeft: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                            Enquiry: <strong style={{ color: 'var(--text-main)' }}>{trip.enquiry_code}</strong>
                                                        </span>
                                                    </div>
                                                    <span className="status-badge" style={{ background: isPostPickup ? 'rgba(16, 185, 129, 0.2)' : 'rgba(234, 179, 8, 0.2)', color: isPostPickup ? 'var(--primary)' : '#fbbf24' }}>
                                                        {trip.status.replace(/_/g, ' ')}
                                                    </span>
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

                                                {/* ======================================================== */}
                                                {/* PHASE 1: BEFORE PICKUP (FARM PICKUP & FARMER CONTACT) */}
                                                {/* ======================================================== */}
                                                {isPrePickup && (
                                                    <div style={{ background: 'rgba(234, 179, 8, 0.08)', border: '1px solid rgba(234, 179, 8, 0.3)', borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '1.25rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fbbf24', fontWeight: 800, fontSize: '0.95rem', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                            <i className="fa-solid fa-map-pin"></i> STEP 1: GO TO FARM & PICK UP HARVEST
                                                        </div>

                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                                                            {/* Farm Pickup Location */}
                                                            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '0.85rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>📍 Farm Pickup Location</div>
                                                                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                                                                    {trip.pickup_address}
                                                                </div>
                                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                                                                    Distance: ~{trip.distance || 38.5} km from Mill
                                                                </div>
                                                                <a 
                                                                    href={`https://www.google.com/maps/search/?api=1&query=${pLat},${pLng}`} 
                                                                    target="_blank" 
                                                                    rel="noreferrer"
                                                                    className="action-btn"
                                                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.5rem', padding: '0.35rem 0.75rem', fontSize: '0.8rem', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--primary)' }}
                                                                >
                                                                    <i className="fa-solid fa-location-dot"></i> View Farm on Map
                                                                </a>
                                                            </div>

                                                            {/* Farmer Contact Card */}
                                                            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '0.85rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>👨‍🌾 Farmer Contact</div>
                                                                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-gold)', marginTop: '0.2rem' }}>
                                                                    {trip.farmer_name}
                                                                </div>
                                                                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                                                                    📞 {trip.farmer_phone}
                                                                </div>
                                                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                                                                    <a 
                                                                        href={`tel:${trip.farmer_phone}`} 
                                                                        className="primary-btn"
                                                                        style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', textDecoration: 'none' }}
                                                                    >
                                                                        <i className="fa-solid fa-phone"></i> Call Farmer
                                                                    </a>
                                                                    {cleanFarmerPhone && (
                                                                        <a 
                                                                            href={`https://wa.me/${cleanFarmerPhone}`} 
                                                                            target="_blank" 
                                                                            rel="noreferrer"
                                                                            className="secondary-btn"
                                                                            style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', textDecoration: 'none', background: 'rgba(37, 211, 102, 0.15)', color: '#25D366', border: '1px solid rgba(37, 211, 102, 0.3)' }}
                                                                        >
                                                                            <i className="fa-brands fa-whatsapp"></i> WhatsApp
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Load Summary based on land and crop */}
                                                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem 1rem', borderRadius: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                            <div>
                                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Harvest Load: </span>
                                                                <strong style={{ color: 'var(--primary)' }}>{trip.crop_name} • {trip.quantity} Tons ({trip.acres || Math.round(trip.quantity / 2)} Acres)</strong>
                                                            </div>
                                                            <div>
                                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Delivery To: </span>
                                                                <strong>{trip.mill_name}</strong>
                                                            </div>
                                                            <div>
                                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Agreed Fee: </span>
                                                                <strong style={{ color: 'var(--accent-gold)' }}>₹{trip.final_price?.toLocaleString()}</strong>
                                                            </div>
                                                        </div>

                                                        {/* Action Button */}
                                                        <div style={{ marginTop: '1rem' }}>
                                                            {trip.status === 'ASSIGNED' ? (
                                                                <button 
                                                                    className="primary-btn" 
                                                                    onClick={() => handleUpdateTripStatus(trip.transport_code, 'PICKUP_STARTED')}
                                                                    style={{ width: '100%', justifyContent: 'center', padding: '0.85rem', fontSize: '1rem', fontWeight: 800 }}
                                                                >
                                                                    <i className="fa-solid fa-truck-fast"></i> 1. Start Journey to Farm
                                                                </button>
                                                            ) : (
                                                                <button 
                                                                    className="primary-btn" 
                                                                    onClick={() => handleUpdateTripStatus(trip.transport_code, 'CROP_PICKED_UP')}
                                                                    style={{ width: '100%', justifyContent: 'center', padding: '0.85rem', fontSize: '1rem', fontWeight: 800, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                                                                >
                                                                    <i className="fa-solid fa-box-open"></i> 2. Confirm Crop Picked Up / Load Loaded
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* ======================================================== */}
                                                {/* PHASE 2: AFTER PICKUP (LIVE ROUTE MAP & NAVIGATION) */}
                                                {/* ======================================================== */}
                                                {isPostPickup && (
                                                    <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '1.25rem' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: 800, fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                                <i className="fa-solid fa-route"></i> STEP 2: HARVEST LOADED • LIVE NAVIGATION TO MILL
                                                            </div>
                                                            <span style={{ fontSize: '0.8rem', background: 'rgba(16, 185, 129, 0.2)', color: 'var(--primary)', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontWeight: 700 }}>
                                                                {trip.status.replace(/_/g, ' ')}
                                                            </span>
                                                        </div>

                                                        {/* Live Route Map */}
                                                        <TripRouteMap 
                                                            pickupLat={pLat}
                                                            pickupLng={pLng}
                                                            deliveryLat={dLat}
                                                            deliveryLng={dLng}
                                                            pickupAddress={trip.pickup_address}
                                                            deliveryAddress={trip.delivery_address}
                                                            millName={trip.mill_name}
                                                        />

                                                        {/* Route Stats & Mill Info */}
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', margin: '1rem 0' }}>
                                                            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📍 From Farm:</div>
                                                                <strong style={{ fontSize: '0.85rem' }}>{trip.pickup_address}</strong>
                                                            </div>
                                                            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>🏭 Destination Mill:</div>
                                                                <strong style={{ fontSize: '0.85rem', color: 'var(--primary)' }}>{trip.mill_name} ({trip.delivery_address})</strong>
                                                            </div>
                                                            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>⏱️ Distance & Drive Time:</div>
                                                                <strong style={{ fontSize: '0.85rem', color: 'var(--accent-gold)' }}>~{trip.distance || 38.5} km • ~{Math.round((trip.distance || 38.5) * 1.5)} mins</strong>
                                                            </div>
                                                        </div>

                                                        {/* One-Click Google Maps Turn-by-Turn GPS Navigation Button */}
                                                        <a 
                                                            href={googleMapsNavUrl}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="primary-btn"
                                                            style={{ 
                                                                background: 'linear-gradient(135deg, #4285F4 0%, #1a73e8 100%)', 
                                                                color: '#fff', 
                                                                padding: '0.9rem 1.5rem', 
                                                                width: '100%', 
                                                                justifyContent: 'center', 
                                                                fontSize: '1rem', 
                                                                fontWeight: 800,
                                                                borderRadius: '0.75rem', 
                                                                textDecoration: 'none', 
                                                                display: 'flex', 
                                                                alignItems: 'center', 
                                                                gap: '0.6rem', 
                                                                boxShadow: '0 4px 14px rgba(66, 133, 244, 0.4)',
                                                                marginBottom: '1rem'
                                                            }}
                                                        >
                                                            <i className="fa-solid fa-location-arrow"></i> Open Turn-by-Turn GPS Navigation in Google Maps
                                                        </a>

                                                        {/* Next Stage Delivery Actions */}
                                                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                                            {trip.status === 'CROP_PICKED_UP' && (
                                                                <button 
                                                                    className="primary-btn" 
                                                                    onClick={() => handleUpdateTripStatus(trip.transport_code, 'IN_TRANSIT')}
                                                                    style={{ flex: 1, justifyContent: 'center', padding: '0.85rem', fontSize: '0.95rem', fontWeight: 700 }}
                                                                >
                                                                    <i className="fa-solid fa-road"></i> Start Transit to Mill Gate
                                                                </button>
                                                            )}
                                                            {trip.status === 'IN_TRANSIT' && (
                                                                <button 
                                                                    className="primary-btn" 
                                                                    onClick={() => handleUpdateTripStatus(trip.transport_code, 'ARRIVED_AT_MILL')}
                                                                    style={{ flex: 1, justifyContent: 'center', padding: '0.85rem', fontSize: '0.95rem', fontWeight: 700 }}
                                                                >
                                                                    <i className="fa-solid fa-warehouse"></i> Arrived at Mill Gate
                                                                </button>
                                                            )}
                                                            {trip.status === 'ARRIVED_AT_MILL' && (
                                                                <button 
                                                                    className="primary-btn" 
                                                                    onClick={() => handleUpdateTripStatus(trip.transport_code, 'DELIVERED')}
                                                                    style={{ flex: 1, justifyContent: 'center', padding: '0.85rem', fontSize: '0.95rem', fontWeight: 800, background: 'var(--accent-gold)', color: '#000' }}
                                                                >
                                                                    <i className="fa-solid fa-circle-check"></i> Complete Unload & Gate Delivery
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
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
