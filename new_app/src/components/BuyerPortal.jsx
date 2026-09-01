import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabase';
import { kisanService } from '../services/kisanService';
import AddMillModal from './AddMillModal';
import UpdatePricesModal from './UpdatePricesModal';
import QrScannerModal from './QrScannerModal';
import QrCodeModal from './QrCodeModal';
import KisanLogo from './KisanLogo';

export default function BuyerPortal({ user: propUser, onLogout }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { user: authUser, logout: authLogout } = useAuth();
    const user = propUser || authUser || {};
    const handleLogout = onLogout || authLogout;

    const pathToTab = {
        '': 'dashboard',
        'dashboard': 'dashboard',
        'enquiries': 'enquiries',
        'scan-qr': 'scanqr',
        'scanqr': 'scanqr',
        'loads': 'loads',
        'transport': 'transport',
        'pricing': 'mills',
        'mills': 'mills',
        'history': 'history',
        'profile': 'profile'
    };
    const currentSubPath = location.pathname.replace(/^\/buyer\/?/, '').split('/')[0];
    const activeTab = pathToTab[currentSubPath] || 'dashboard';

    const setActiveTab = (tab) => {
        const tabToPath = {
            'dashboard': '/buyer/dashboard',
            'enquiries': '/buyer/enquiries',
            'scanqr': '/buyer/scan-qr',
            'loads': '/buyer/loads',
            'transport': '/buyer/transport',
            'mills': '/buyer/pricing',
            'history': '/buyer/history',
            'profile': '/buyer/profile'
        };
        navigate(tabToPath[tab] || `/buyer/${tab}`);
        setIsSidebarOpen(false);
    };

    // CRITICAL BACK BUTTON FIX: Stays inside Buyer Portal workspace
    const handleBack = () => {
        if (window.history.state && window.history.state.idx > 0) {
            navigate(-1);
        } else {
            navigate('/buyer/dashboard');
        }
    };

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Profile States
    const [profileName, setProfileName] = useState(user.name || '');
    const [profileAltPhone, setProfileAltPhone] = useState(user.altPhone || '');
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    // Buyer Specific Details
    const [gstNumber, setGstNumber] = useState(user.gstNumber || '');
    const [businessType, setBusinessType] = useState(user.businessType || 'Retailer');
    const [buyingCapacity, setBuyingCapacity] = useState(user.buyingCapacity || '');

    // Security States
    const [newPhone, setNewPhone] = useState(user.phone || '');
    const [newPin, setNewPin] = useState(user.pin || '');
    const [isUpdatingSecurity, setIsUpdatingSecurity] = useState(false);

    // Mill States
    const [isAddMillOpen, setIsAddMillOpen] = useState(false);
    const [mills, setMills] = useState([]);
    const [loadingMills, setLoadingMills] = useState(true);
    const [selectedMillForPricing, setSelectedMillForPricing] = useState(null);

    // Enquiry, Load & History States
    const [enquiries, setEnquiries] = useState([]);
    const [loadingEnquiries, setLoadingEnquiries] = useState(true);
    const [loadsReceived, setLoadsReceived] = useState([]);
    const [transportRequests, setTransportRequests] = useState([]);
    const [millHistory, setMillHistory] = useState([]);
    const [historyFilter, setHistoryFilter] = useState('ALL');
    
    // Modal States
    const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
    const [selectedEnquiryForQr, setSelectedEnquiryForQr] = useState(null);
    const [enquiryFilter, setEnquiryFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'ACCEPTED' | 'LOAD_RECEIVED'

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        
        const init = async () => {
            const loadedMills = await fetchMills();
            await refreshAllData(loadedMills);
        };
        init();

        const unsub = kisanService.subscribe(() => {
            refreshAllData();
        });

        return () => {
            clearInterval(timer);
            unsub();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const refreshAllData = async (passedMills) => {
        await Promise.all([
            fetchEnquiries(passedMills),
            fetchLoadsReceived(),
            fetchTransportRequests(),
            fetchHistoryData(passedMills)
        ]);
    };

    const fetchHistoryData = async (passedMills) => {
        try {
            const currentMills = passedMills || mills;
            const hist = await kisanService.getMillHistory(currentMills[0]?.id || user.phone, user.phone);
            setMillHistory(hist);
        } catch (err) {
            console.error("History fetch error:", err);
        }
    };

    const fetchMills = async () => {
        setLoadingMills(true);
        try {
            const { data, error } = await supabase
                .from('mills')
                .select('*')
                .eq('owner_phone', user.phone);

            if (error) throw error;

            const mappedMills = (data || []).map(m => ({
                id: m.id,
                ownerPhone: m.owner_phone,
                millName: m.mill_name,
                millType: m.mill_type,
                capacity: m.capacity,
                requirements: m.requirements,
                selectedCrops: m.selectedCrops,
                locationName: m.location_name,
                latitude: m.latitude,
                longitude: m.longitude,
                hasColdStorage: m.has_cold_storage,
                prices: m.prices,
                status: m.status,
                addedAt: m.created_at
            }));
            setMills(mappedMills);
            return mappedMills;
        } catch (error) {
            console.error("Error fetching mills:", error);
            return [];
        } finally {
            setLoadingMills(false);
        }
    };

    const fetchEnquiries = async (passedMills) => {
        setLoadingEnquiries(true);
        try {
            const currentMills = passedMills || mills;
            const myMillIds = currentMills.map(m => m.id).filter(Boolean);
            const list = await kisanService.getEnquiries({ 
                buyerPhone: user.phone,
                millIds: myMillIds.length > 0 ? myMillIds : undefined
            });
            setEnquiries(list);
        } catch (error) {
            console.error("Error fetching enquiries:", error);
        } finally {
            setLoadingEnquiries(false);
        }
    };

    const fetchLoadsReceived = async () => {
        try {
            const loads = await kisanService.getLoadsReceived({ buyerPhone: user.phone });
            setLoadsReceived(loads);
        } catch (error) {
            console.error("Error fetching loads:", error);
        }
    };

    const fetchTransportRequests = async () => {
        try {
            const reqs = kisanService.getTransportRequests();
            setTransportRequests(reqs);
        } catch (error) {
            console.error("Error fetching transport:", error);
        }
    };

    const handleAcceptEnquiry = async (enquiry) => {
        const targetId = enquiry.id || enquiry.enquiry_code;
        if (!window.confirm(`Accept enquiry ${enquiry.enquiry_code || targetId} from ${enquiry.farmer_name}?`)) return;

        try {
            // Optimistically update local state immediately so user sees the change with 0 delay!
            setEnquiries(prev => prev.map(e => (e.id === targetId || e.enquiry_code === targetId) ? { ...e, status: 'ACCEPTED' } : e));
            setEnquiryFilter('ACCEPTED');

            const accepted = await kisanService.acceptEnquiry(targetId, {
                name: profileName || user.phone,
                phone: user.phone,
                id: mills[0]?.id || user.phone,
                millName: mills[0]?.millName || 'KisanConnect Mill'
            });

            if (accepted) {
                await refreshAllData();
            }
        } catch (error) {
            console.error("Error accepting enquiry:", error);
            alert("Failed to accept enquiry. Please try again.");
            await refreshAllData();
        }
    };

    const handleRejectEnquiry = async (enquiry) => {
        const targetId = enquiry.id || enquiry.enquiry_code;
        const reason = window.prompt("Please provide a reason for rejecting this enquiry (optional):", "Price negotiation / Capacity limit");
        if (reason === null) return;

        try {
            // Optimistically update local state immediately
            setEnquiries(prev => prev.map(e => (e.id === targetId || e.enquiry_code === targetId) ? { ...e, status: 'REJECTED', reject_reason: reason } : e));
            setEnquiryFilter('REJECTED');

            await kisanService.rejectEnquiry(targetId, reason);
            await refreshAllData();
        } catch (error) {
            console.error("Error rejecting enquiry:", error);
            await refreshAllData();
        }
    };

    const handleUpdateProfile = async () => {
        setIsSavingProfile(true);
        try {
            const { error } = await supabase
                .from('buyers')
                .update({
                    name: profileName,
                    altPhone: profileAltPhone,
                    gstNumber,
                    businessType,
                    buyingCapacity
                })
                .eq('phone', user.phone);

            if (error) throw error;
            alert('Buyer profile synchronized successfully!');
        } catch (error) {
            console.error(error);
            alert('Failed to update profile.');
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleUpdateSecurity = async () => {
        if (newPhone.length !== 10 || isNaN(newPhone)) return alert('Phone must be 10 digits');
        if (newPin.length < 4 || isNaN(newPin)) return alert('PIN must be 4 to 6 digits');

        setIsUpdatingSecurity(true);
        try {
            await supabase.from('buyers').update({ pin: newPin }).eq('phone', user.phone);
            alert('Security PIN updated successfully!');
        } catch (e) {
            alert('Error updating PIN');
        } finally {
            setIsUpdatingSecurity(false);
        }
    };

    const filteredEnquiries = enquiries.filter(eq => {
        if (enquiryFilter === 'ALL') return true;
        return (eq.status || '').toUpperCase() === enquiryFilter.toUpperCase();
    });

    const activeMill = mills[0] || {
        id: user.phone,
        millName: profileName || 'KisanConnect Processing Mill',
        ownerPhone: user.phone
    };

    return (
        <div className="portal-container">
            {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>}

            {/* Sidebar */}
            <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="logo" style={{ marginBottom: '2rem' }}>
                    <KisanLogo size="md" />
                </div>

                <nav className="nav-menu">
                    <a className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}>
                        <i className="fa-solid fa-house"></i>
                        <span>Dashboard</span>
                    </a>
                    <a className={`nav-item ${activeTab === 'enquiries' ? 'active' : ''}`} onClick={() => { setActiveTab('enquiries'); setIsSidebarOpen(false); }}>
                        <i className="fa-solid fa-inbox"></i>
                        <span>Farmer Enquiries</span>
                        {enquiries.filter(e => (e.status || '').toUpperCase() === 'PENDING').length > 0 && (
                            <span className="badge" style={{ marginLeft: 'auto', background: 'var(--primary)', color: '#000', padding: '0.1rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 800 }}>
                                {enquiries.filter(e => (e.status || '').toUpperCase() === 'PENDING').length}
                            </span>
                        )}
                    </a>
                    <a className={`nav-item ${activeTab === 'scanqr' ? 'active' : ''}`} onClick={() => { setIsQrScannerOpen(true); setIsSidebarOpen(false); }}>
                        <i className="fa-solid fa-qrcode" style={{ color: 'var(--primary)' }}></i>
                        <span style={{ color: 'var(--primary)', fontWeight: 700 }}>Scan Farmer QR</span>
                    </a>
                    <a className={`nav-item ${activeTab === 'loads' ? 'active' : ''}`} onClick={() => { setActiveTab('loads'); setIsSidebarOpen(false); }}>
                        <i className="fa-solid fa-truck-ramp-box"></i>
                        <span>Loads Received</span>
                        {loadsReceived.length > 0 && (
                            <span className="badge" style={{ marginLeft: 'auto', background: 'var(--accent-gold)', color: '#000', padding: '0.1rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 800 }}>
                                {loadsReceived.length}
                            </span>
                        )}
                    </a>
                    <a className={`nav-item ${activeTab === 'transport' ? 'active' : ''}`} onClick={() => { setActiveTab('transport'); setIsSidebarOpen(false); }}>
                        <i className="fa-solid fa-truck-fast"></i>
                        <span>Transport Fleet</span>
                    </a>
                    <a className={`nav-item ${activeTab === 'mills' ? 'active' : ''}`} onClick={() => { setActiveTab('mills'); setIsSidebarOpen(false); }}>
                        <i className="fa-solid fa-industry"></i>
                        <span>My Mills & Pricing</span>
                    </a>
                    <a className={`nav-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => { setActiveTab('history'); setIsSidebarOpen(false); }}>
                        <i className="fa-solid fa-clock-rotate-left"></i>
                        <span>Procurement History</span>
                    </a>
                    <a className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => { setActiveTab('profile'); setIsSidebarOpen(false); }}>
                        <i className="fa-solid fa-user-gear"></i>
                        <span>Profile & Settings</span>
                    </a>
                </nav>

                <div className="sidebar-bottom">
                    <div style={{ padding: '0.8rem', background: 'rgba(16, 185, 129, 0.06)', borderRadius: '12px', marginBottom: '1rem', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Authorized Facility</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 700 }}>{activeMill.millName}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>Buyer: {businessType}</div>
                    </div>
                    <a className="nav-item logout" onClick={handleLogout}>
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
                            <input type="text" placeholder="Search enquiry ID, farmer, crop..." />
                        </div>
                    </div>

                    <div className="header-actions" style={{ alignItems: 'center', gap: '1rem' }}>
                        {/* Prominent Scan Farmer QR CTA Button */}
                        <button 
                            className="primary-btn pulse-glow"
                            onClick={() => setIsQrScannerOpen(true)}
                            style={{ 
                                padding: '0.6rem 1.1rem', 
                                fontSize: '0.85rem',
                                borderRadius: '0.75rem',
                                boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)' 
                            }}
                        >
                            <i className="fa-solid fa-qrcode" style={{ fontSize: '1rem' }}></i>
                            <span>Scan Farmer QR</span>
                        </button>

                        <div className="header-datetime">
                            <div style={{ fontWeight: 600, color: 'var(--text)' }}>
                                {currentTime.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })}
                            </div>
                            <div>{currentTime.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</div>
                        </div>

                        <div className="user-profile">
                            <div className="profile-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', color: 'var(--primary)', fontSize: '1.4rem', width: '42px', height: '42px', borderRadius: '50%' }}>
                                <i className="fa-solid fa-user"></i>
                            </div>
                            <div className="user-info">
                                <h4>{profileName || user.phone}</h4>
                                <p>Verified Mill Operator</p>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="dashboard-content" style={{ padding: '2rem 1.5rem' }}>

                    {/* ======================================================== */}
                    {/* TAB: DASHBOARD */}
                    {/* ======================================================== */}
                    {activeTab === 'dashboard' && (
                        <div>
                            <div className="welcome-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                                <div>
                                    <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>Welcome, {profileName || 'Mill Partner'}! 🌾</h1>
                                    <p style={{ color: 'var(--text-muted)', margin: '0.35rem 0 0 0' }}>KisanConnect Direct Mill Procurement & QR Gate Verification</p>
                                </div>
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <button className="primary-btn" onClick={() => setIsQrScannerOpen(true)}>
                                        <i className="fa-solid fa-qrcode"></i> Scan Crop QR
                                    </button>
                                    <button className="action-btn" onClick={() => setIsAddMillOpen(true)}>
                                        <i className="fa-solid fa-plus"></i> Add Mill
                                    </button>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="stats-grid" style={{ marginBottom: '2rem' }}>
                                <div className="stat-card">
                                    <div className="stat-icon orders"><i className="fa-solid fa-inbox"></i></div>
                                    <div className="stat-details">
                                        <h3>Pending Enquiries</h3>
                                        <h2>{enquiries.filter(e => e.status === 'PENDING').length}</h2>
                                        <span className="trend up">Awaiting your review</span>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon crops"><i className="fa-solid fa-qrcode"></i></div>
                                    <div className="stat-details">
                                        <h3>Accepted QRs Active</h3>
                                        <h2>{enquiries.filter(e => e.status === 'ACCEPTED').length}</h2>
                                        <span className="trend neutral">In transit to mill gate</span>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon revenue"><i className="fa-solid fa-truck-ramp-box"></i></div>
                                    <div className="stat-details">
                                        <h3>Loads Verified & Received</h3>
                                        <h2>{loadsReceived.length}</h2>
                                        <span className="trend up">Officially registered</span>
                                    </div>
                                </div>
                            </div>

                            {/* Fast Action Banner */}
                            <div className="bento-card" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(245, 158, 11, 0.1) 100%)', border: '1px solid rgba(16, 185, 129, 0.3)', marginBottom: '2rem', padding: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                                    <div>
                                        <h3 style={{ margin: '0 0 0.4rem 0', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                            <i className="fa-solid fa-shield-halved"></i>
                                            Secure Crop Verification Station
                                        </h3>
                                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '650px' }}>
                                            Farmers arrive with their generated KisanConnect QR code. Click <strong>Scan Farmer QR</strong> to verify crop origin, acreage, quantity, and confirm load receipt in 1 tap.
                                        </p>
                                    </div>
                                    <button className="primary-btn" onClick={() => setIsQrScannerOpen(true)} style={{ padding: '0.8rem 1.4rem' }}>
                                        <i className="fa-solid fa-camera"></i> Launch Camera Scanner
                                    </button>
                                </div>
                            </div>

                            {/* Recent Enquiries Table Preview */}
                            <div className="bento-card" style={{ marginBottom: '2rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                                    <h3 style={{ margin: 0 }}>Recent Farmer Enquiries</h3>
                                    <button className="text-btn" onClick={() => setActiveTab('enquiries')}>View All</button>
                                </div>
                                {enquiries.length === 0 ? (
                                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>No incoming farmer enquiries yet.</p>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="orders-table" style={{ width: '100%', textAlign: 'left' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                    <th style={{ padding: '0.75rem 1rem' }}>Enquiry ID</th>
                                                    <th style={{ padding: '0.75rem 1rem' }}>Farmer</th>
                                                    <th style={{ padding: '0.75rem 1rem' }}>Crop & Qty</th>
                                                    <th style={{ padding: '0.75rem 1rem' }}>Offered Price</th>
                                                    <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                                                    <th style={{ padding: '0.75rem 1rem' }}>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {enquiries.slice(0, 4).map(eq => (
                                                    <tr key={eq.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                        <td style={{ padding: '1rem', fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent-gold)' }}>
                                                            {eq.enquiry_code}
                                                        </td>
                                                        <td style={{ padding: '1rem' }}>
                                                            <strong>{eq.farmer_name}</strong>
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{eq.farmer_phone}</div>
                                                        </td>
                                                        <td style={{ padding: '1rem' }}>
                                                            <strong>{eq.crop_name}</strong>
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{eq.quantity || (eq.acres * 2)} Tons ({eq.acres} Acres)</div>
                                                        </td>
                                                        <td style={{ padding: '1rem', color: 'var(--primary)', fontWeight: 700 }}>
                                                            ₹{eq.offered_price || eq.expected_price || 'Market'}
                                                        </td>
                                                        <td style={{ padding: '1rem' }}>
                                                            <span className="status-badge" style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}>
                                                                {eq.status}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: '1rem' }}>
                                                            {eq.status === 'PENDING' ? (
                                                                <button className="primary-btn" onClick={() => handleAcceptEnquiry(eq)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                                                                    Accept
                                                                </button>
                                                            ) : (
                                                                <button className="action-btn text-btn" onClick={() => setSelectedEnquiryForQr(eq)} style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>
                                                                    View QR
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ======================================================== */}
                    {/* TAB: FARMER ENQUIRIES */}
                    {/* ======================================================== */}
                    {activeTab === 'enquiries' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '1.6rem' }}>Farmer Enquiries 📬</h2>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
                                        Review incoming crop supply proposals, accept for instant QR generation, or decline
                                    </p>
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {[
                                        { key: 'ALL', label: 'ALL' },
                                        { key: 'PENDING', label: 'PENDING' },
                                        { key: 'ACCEPTED', label: 'ACCEPTED' },
                                        { key: 'REJECTED', label: 'REJECTED' },
                                        { key: 'LOAD_RECEIVED', label: 'LOAD RECEIVED' }
                                    ].map(item => {
                                        const count = item.key === 'ALL' 
                                            ? enquiries.length 
                                            : enquiries.filter(e => (e.status || '').toUpperCase() === item.key).length;
                                        const isActive = enquiryFilter === item.key;
                                        return (
                                            <button 
                                                key={item.key} 
                                                className={`action-btn ${isActive ? 'active' : ''}`}
                                                onClick={() => setEnquiryFilter(item.key)}
                                                style={{ 
                                                    fontSize: '0.8rem', 
                                                    padding: '0.5rem 0.9rem', 
                                                    background: isActive ? 'var(--primary)' : 'rgba(255,255,255,0.05)', 
                                                    color: isActive ? '#000' : 'inherit',
                                                    fontWeight: 700,
                                                    borderRadius: '0.5rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.45rem',
                                                    border: isActive ? 'none' : '1px solid var(--border-color)',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <span>{item.label}</span>
                                                <span style={{ 
                                                    background: isActive ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.1)', 
                                                    color: isActive ? '#000' : 'var(--text-muted)', 
                                                    padding: '0.1rem 0.45rem', 
                                                    borderRadius: '1rem', 
                                                    fontSize: '0.72rem',
                                                    fontWeight: 800
                                                }}>
                                                    {count}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {filteredEnquiries.length === 0 ? (
                                <div className="bento-card" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                                    <i className="fa-solid fa-inbox fa-3x" style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}></i>
                                    <h3>No Enquiries Found</h3>
                                    <p style={{ color: 'var(--text-muted)' }}>No farmer enquiries matching the selected filter ({enquiryFilter}).</p>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.25rem' }}>
                                    {filteredEnquiries.map(enq => (
                                        <div key={enq.id} className="bento-card" style={{ border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column' }}>
                                            {/* Header */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                                                <div>
                                                    <span style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--accent-gold)', fontSize: '1rem' }}>
                                                        {enq.enquiry_code}
                                                    </span>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                                        {new Date(enq.created_at).toLocaleDateString('en-IN')}
                                                    </div>
                                                </div>

                                                <span className="status-badge" style={{
                                                    background: (enq.status || '').toUpperCase() === 'ACCEPTED' ? 'rgba(16, 185, 129, 0.15)' : (enq.status || '').toUpperCase() === 'REJECTED' ? 'rgba(239, 68, 68, 0.15)' : (enq.status || '').toUpperCase() === 'LOAD_RECEIVED' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                                                    color: (enq.status || '').toUpperCase() === 'ACCEPTED' ? 'var(--primary)' : (enq.status || '').toUpperCase() === 'REJECTED' ? '#ef4444' : (enq.status || '').toUpperCase() === 'LOAD_RECEIVED' ? '#38bdf8' : '#fbbf24',
                                                    padding: '0.25rem 0.65rem',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 700,
                                                    borderRadius: '0.5rem',
                                                    textTransform: 'uppercase'
                                                }}>
                                                    {(enq.status || 'PENDING').toUpperCase()}
                                                </span>
                                            </div>

                                            {/* Body */}
                                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ color: 'var(--text-muted)' }}>Farmer:</span>
                                                    <strong>{enq.farmer_name} ({enq.farmer_phone})</strong>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ color: 'var(--text-muted)' }}>Crop:</span>
                                                    <strong style={{ color: 'var(--primary)' }}>{enq.crop_name}</strong>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ color: 'var(--text-muted)' }}>Quantity & Acres:</span>
                                                    <strong>{enq.quantity || (enq.acres * 2)} Tons • {enq.acres} Acres</strong>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ color: 'var(--text-muted)' }}>Farm Location:</span>
                                                    <span>{enq.farmer_location_name || 'Coordinates Listed'}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ color: 'var(--text-muted)' }}>Distance:</span>
                                                    <span>~{Number(enq.distance || 35).toFixed(1)} km</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ color: 'var(--text-muted)' }}>Offered Price:</span>
                                                    <strong style={{ color: 'var(--accent-gold)' }}>₹{enq.offered_price || enq.expected_price || 'Market Rate'}</strong>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ color: 'var(--text-muted)' }}>Transport:</span>
                                                    <span style={{ color: enq.transport_required ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 600 }}>
                                                        {enq.transport_required ? `Yes (${enq.vehicle_capacity || '10 Ton'} ${enq.vehicle_type || 'Truck'})` : 'No (Self Arranged)'}
                                                    </span>
                                                </div>

                                                {enq.message && (
                                                    <div style={{ 
                                                        background: 'rgba(16, 185, 129, 0.08)', 
                                                        border: '1px solid rgba(16, 185, 129, 0.25)', 
                                                        padding: '0.65rem 0.85rem', 
                                                        borderRadius: '0.6rem', 
                                                        marginTop: '0.5rem' 
                                                    }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', fontWeight: 700, fontSize: '0.75rem', marginBottom: '0.25rem', letterSpacing: '0.5px' }}>
                                                            <i className="fa-solid fa-message"></i> FARMER MESSAGE / TERMS:
                                                        </div>
                                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontStyle: 'italic', wordBreak: 'break-word', lineHeight: 1.4 }}>
                                                            "{enq.message}"
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Footer Actions */}
                                            <div style={{ marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '0.6rem' }}>
                                                {(enq.status || '').toUpperCase() === 'PENDING' ? (
                                                    <>
                                                        <button 
                                                            className="text-btn" 
                                                            onClick={() => handleRejectEnquiry(enq)}
                                                            style={{ flex: 1, justifyContent: 'center', padding: '0.65rem', color: 'var(--danger)' }}
                                                        >
                                                            <i className="fa-solid fa-xmark" style={{ marginRight: '0.35rem' }}></i>
                                                            Reject
                                                        </button>
                                                        <button 
                                                            className="primary-btn" 
                                                            onClick={() => handleAcceptEnquiry(enq)}
                                                            style={{ flex: 1.5, justifyContent: 'center', padding: '0.65rem' }}
                                                        >
                                                            <i className="fa-solid fa-circle-check"></i>
                                                            Accept Enquiry
                                                        </button>
                                                    </>
                                                ) : (enq.status || '').toUpperCase() === 'ACCEPTED' ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600 }}>
                                                            <i className="fa-solid fa-circle-check"></i>
                                                            <span>Accepted • Ready for Gate Delivery</span>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                            <button 
                                                                className="action-btn" 
                                                                onClick={() => setIsQrScannerOpen(true)}
                                                                style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem', background: 'rgba(255, 255, 255, 0.08)' }}
                                                            >
                                                                <i className="fa-solid fa-qrcode"></i>
                                                                Scan QR
                                                            </button>
                                                            <button 
                                                                className="primary-btn" 
                                                                onClick={async () => {
                                                                    if (window.confirm(`Confirm gate receipt of ${enq.crop_name} (${enq.quantity || (enq.acres * 2)} Tons) from Farmer ${enq.farmer_name}?`)) {
                                                                        await kisanService.acceptLoad(enq.enquiry_code || enq.id, loggedInMill);
                                                                        fetchData();
                                                                    }
                                                                }}
                                                                style={{ padding: '0.5rem 0.9rem', fontSize: '0.8rem' }}
                                                            >
                                                                <i className="fa-solid fa-circle-check"></i>
                                                                Accept Load
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (enq.status || '').toUpperCase() === 'REJECTED' ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#ef4444', fontSize: '0.85rem', fontWeight: 600 }}>
                                                            <i className="fa-solid fa-circle-xmark"></i>
                                                            <span>Enquiry Rejected / Declined</span>
                                                        </div>
                                                        {enq.reject_reason && (
                                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'rgba(239,68,68,0.1)', padding: '0.2rem 0.5rem', borderRadius: '0.3rem', border: '1px solid rgba(239,68,68,0.2)' }}>
                                                                {enq.reject_reason}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', width: '100%', textAlign: 'center', padding: '0.35rem 0' }}>
                                                        Status: <strong style={{ color: 'var(--text-main)' }}>{(enq.status || '').toUpperCase()}</strong>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ======================================================== */}
                    {/* TAB: LOADS RECEIVED */}
                    {/* ======================================================== */}
                    {activeTab === 'loads' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '1.6rem' }}>Loads Received & Verified 🚚</h2>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
                                        Complete audit log of all crops verified through digital QR scanning and accepted at gate
                                    </p>
                                </div>
                                <button className="primary-btn" onClick={() => setIsQrScannerOpen(true)}>
                                    <i className="fa-solid fa-qrcode"></i> Scan Another Load
                                </button>
                            </div>

                            {loadsReceived.length === 0 ? (
                                <div className="bento-card" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                                    <i className="fa-solid fa-truck-ramp-box fa-3x" style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}></i>
                                    <h3>No Loads Recorded Yet</h3>
                                    <p style={{ color: 'var(--text-muted)', maxWidth: '450px', margin: '0.5rem auto 1.5rem' }}>
                                        Once a farmer brings their harvest to the mill, scan their Crop Verification QR to authenticate and confirm receipt.
                                    </p>
                                    <button className="primary-btn" onClick={() => setIsQrScannerOpen(true)}>
                                        Open QR Scanner
                                    </button>
                                </div>
                            ) : (
                                <div className="bento-card">
                                    <div className="table-responsive">
                                        <table className="orders-table" style={{ width: '100%', textAlign: 'left' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                    <th style={{ padding: '1rem' }}>Enquiry ID</th>
                                                    <th style={{ padding: '1rem' }}>Farmer</th>
                                                    <th style={{ padding: '1rem' }}>Crop & Quantity</th>
                                                    <th style={{ padding: '1rem' }}>Acreage</th>
                                                    <th style={{ padding: '1rem' }}>Transport Method</th>
                                                    <th style={{ padding: '1rem' }}>Received At</th>
                                                    <th style={{ padding: '1rem' }}>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {loadsReceived.map(load => (
                                                    <tr key={load.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                        <td style={{ padding: '1rem', fontFamily: 'monospace', fontWeight: 800, color: 'var(--accent-gold)' }}>
                                                            {load.enquiry_code}
                                                        </td>
                                                        <td style={{ padding: '1rem' }}>
                                                            <strong>{load.farmer_name}</strong>
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{load.farmer_id}</div>
                                                        </td>
                                                        <td style={{ padding: '1rem' }}>
                                                            <strong style={{ color: 'var(--primary)' }}>{load.crop_name}</strong>
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{load.quantity} Tons</div>
                                                        </td>
                                                        <td style={{ padding: '1rem' }}>
                                                            {load.acres || '5'} Acres
                                                        </td>
                                                        <td style={{ padding: '1rem' }}>
                                                            {load.transport_method}
                                                        </td>
                                                        <td style={{ padding: '1rem', fontSize: '0.85rem' }}>
                                                            {new Date(load.received_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                                                        </td>
                                                        <td style={{ padding: '1rem' }}>
                                                            <span className="status-badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: 'var(--primary)', fontWeight: 700 }}>
                                                                <i className="fa-solid fa-circle-check" style={{ marginRight: '0.3rem' }}></i>
                                                                RECEIVED
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ======================================================== */}
                    {/* TAB: TRANSPORT FLEET */}
                    {/* ======================================================== */}
                    {activeTab === 'transport' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '1.6rem' }}>Inbound Transport Fleet 🚛</h2>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
                                        Real-time tracking of contracted trucks delivering verified crops to your mill
                                    </p>
                                </div>
                            </div>

                            {transportRequests.length === 0 ? (
                                <div className="bento-card" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
                                    <i className="fa-solid fa-truck-moving fa-3x" style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}></i>
                                    <h3>No Active Transport Dispatches</h3>
                                    <p style={{ color: 'var(--text-muted)' }}>When accepted farmer enquiries have transport enabled, vehicle tracking will show here.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
                                    {transportRequests.map(tr => (
                                        <div key={tr.id} className="bento-card">
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                                <strong style={{ fontFamily: 'monospace', color: 'var(--accent-gold)' }}>{tr.transport_code}</strong>
                                                <span className="status-badge" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>{tr.status}</span>
                                            </div>
                                            <h4>{tr.crop_name} ({tr.quantity} Tons)</h4>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                                <div>From: {tr.pickup_address}</div>
                                                <div>Vehicle: <strong>{tr.vehicle_number || 'Dispatching Provider'}</strong></div>
                                                <div>Assigned Hauler: <strong>{tr.assigned_provider_name || 'Searching Fleet'}</strong></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ======================================================== */}
                    {/* TAB: MY MILLS & PRICING */}
                    {/* ======================================================== */}
                    {activeTab === 'mills' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '1.6rem' }}>My Registered Mills 🏭</h2>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
                                        Manage your processing capacity, geo-location, and dynamic buying rates
                                    </p>
                                </div>
                                <button className="primary-btn" onClick={() => setIsAddMillOpen(true)}>
                                    <i className="fa-solid fa-plus"></i> Add New Mill
                                </button>
                            </div>

                            <div className="bento-card">
                                <div className="table-responsive">
                                    <table className="orders-table" style={{ width: '100%', textAlign: 'left' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                <th style={{ padding: '1rem' }}>Mill Name</th>
                                                <th style={{ padding: '1rem' }}>Location</th>
                                                <th style={{ padding: '1rem' }}>Buying Crops</th>
                                                <th style={{ padding: '1rem' }}>Capability</th>
                                                <th style={{ padding: '1rem' }}>Status</th>
                                                <th style={{ padding: '1rem' }}>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {loadingMills ? (
                                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Loading mills...</td></tr>
                                            ) : mills.length === 0 ? (
                                                <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>You haven't added any mills yet.</td></tr>
                                            ) : mills.map(mill => (
                                                <tr key={mill.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                    <td style={{ padding: '1rem', fontWeight: 600 }}>{mill.millName}</td>
                                                    <td style={{ padding: '1rem', color: 'var(--text-muted)' }}><i className="fa-solid fa-location-dot"></i> {mill.locationName}</td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                                            {mill.selectedCrops?.map(crop => (
                                                                <span key={crop} style={{ fontSize: '0.7rem', padding: '2px 6px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--primary)', borderRadius: '4px' }}>{crop}</span>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>{mill.capacity} TPD</td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <span className="status-badge" style={{ textTransform: 'capitalize' }}>
                                                            {mill.status}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <button
                                                            className="primary-btn"
                                                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                                                            onClick={() => setSelectedMillForPricing(mill)}
                                                        >
                                                            <i className="fa-solid fa-tags"></i> Set Prices
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ======================================================== */}
                    {/* TAB: PROCUREMENT HISTORY & AUDIT LEDGER */}
                    {/* ======================================================== */}
                    {activeTab === 'history' && (
                        <div className="history-container">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Procurement Audit Ledger 📜</h2>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
                                        Complete historical record of all gate-verified crop batches, farmer proposals, and intake receipts
                                    </p>
                                </div>
                                <button className="action-btn" onClick={refreshAllData} style={{ fontSize: '0.85rem' }}>
                                    <i className="fa-solid fa-rotate-right"></i> Refresh Audit Log
                                </button>
                            </div>

                            {/* Summary Metric Cards */}
                            <div className="history-summary-grid">
                                <div className="history-stat-card">
                                    <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                                        <i className="fa-solid fa-weight-hanging"></i>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Procured Intake</div>
                                        <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary)' }}>
                                            {millHistory.filter(h => h.category === 'LOAD_VERIFIED').reduce((acc, h) => acc + (Number(h.quantity) || 0), 0)} Tons
                                        </div>
                                    </div>
                                </div>
                                <div className="history-stat-card">
                                    <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                                        <i className="fa-solid fa-qrcode"></i>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>QR Gate Scans</div>
                                        <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-gold)' }}>
                                            {millHistory.filter(h => h.category === 'LOAD_VERIFIED').length} Verified
                                        </div>
                                    </div>
                                </div>
                                <div className="history-stat-card">
                                    <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                                        <i className="fa-solid fa-file-shield"></i>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Entries</div>
                                        <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
                                            {millHistory.length} Logged
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Filter Chips */}
                            <div className="history-filters">
                                {[
                                    { label: 'All History', val: 'ALL' },
                                    { label: 'Verified Loads', val: 'LOAD_VERIFIED' },
                                    { label: 'Accepted Enquiries', val: 'ENQUIRY_ACCEPTED' },
                                    { label: 'Declined', val: 'ENQUIRY_REJECTED' }
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

                            {/* Ledger Table */}
                            {millHistory.filter(h => historyFilter === 'ALL' || h.category === historyFilter).length === 0 ? (
                                <div className="bento-card" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
                                    <i className="fa-solid fa-clock-rotate-left fa-3x" style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}></i>
                                    <h3>No Records Found</h3>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No procurement history records matching "{historyFilter}".</p>
                                </div>
                            ) : (
                                <div className="bento-card" style={{ padding: '1.25rem' }}>
                                    <div className="table-responsive">
                                        <table className="orders-table" style={{ width: '100%', textAlign: 'left' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                    <th style={{ padding: '0.8rem 1rem' }}>Enquiry Code</th>
                                                    <th style={{ padding: '0.8rem 1rem' }}>Farmer</th>
                                                    <th style={{ padding: '0.8rem 1rem' }}>Commodity & Qty</th>
                                                    <th style={{ padding: '0.8rem 1rem' }}>Verification Time</th>
                                                    <th style={{ padding: '0.8rem 1rem' }}>Logged By</th>
                                                    <th style={{ padding: '0.8rem 1rem' }}>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {millHistory
                                                    .filter(h => historyFilter === 'ALL' || h.category === historyFilter)
                                                    .map(item => (
                                                        <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.86rem' }}>
                                                            <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', fontWeight: 800, color: 'var(--accent-gold)' }}>
                                                                {item.enquiry_code}
                                                            </td>
                                                            <td style={{ padding: '0.85rem 1rem' }}>
                                                                <strong>{item.farmer_name}</strong>
                                                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.farmer_phone}</div>
                                                            </td>
                                                            <td style={{ padding: '0.85rem 1rem' }}>
                                                                <strong style={{ color: 'var(--primary)' }}>{item.crop_name}</strong>
                                                                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{item.quantity} Tons ({item.acres} Acres)</div>
                                                            </td>
                                                            <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                                {item.date ? new Date(item.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Pending'}
                                                            </td>
                                                            <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem' }}>
                                                                {item.operator || 'Mill Procurement'}
                                                            </td>
                                                            <td style={{ padding: '0.85rem 1rem' }}>
                                                                <span className={item.category === 'LOAD_VERIFIED' || item.category === 'ENQUIRY_ACCEPTED' ? 'badge-green' : 'badge-gold'}>
                                                                    {item.status}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ======================================================== */}
                    {/* TAB: PROFILE & SETTINGS */}
                    {/* ======================================================== */}
                    {activeTab === 'profile' && (
                        <div className="bento-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
                            <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                                Mill Operator Profile
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Company / Owner Name</label>
                                    <input 
                                        type="text" 
                                        value={profileName} 
                                        onChange={e => setProfileName(e.target.value)}
                                        style={{ width: '100%', padding: '0.75rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'inherit' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>GST Number</label>
                                    <input 
                                        type="text" 
                                        value={gstNumber} 
                                        onChange={e => setGstNumber(e.target.value)}
                                        style={{ width: '100%', padding: '0.75rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'inherit' }}
                                    />
                                </div>
                                <button className="primary-btn" onClick={handleUpdateProfile} disabled={isSavingProfile} style={{ justifyContent: 'center', marginTop: '0.5rem' }}>
                                    {isSavingProfile ? 'Saving...' : 'Save Profile Changes'}
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
                    <button className={`mobile-nav-btn ${activeTab === 'enquiries' ? 'active' : ''}`} onClick={() => setActiveTab('enquiries')}>
                        <i className="fa-solid fa-inbox"></i>
                        <span>Enquiries</span>
                    </button>
                    <button className="mobile-nav-btn" onClick={() => setIsQrScannerOpen(true)} style={{ color: 'var(--primary)' }}>
                        <i className="fa-solid fa-qrcode"></i>
                        <span style={{ fontWeight: 700 }}>Scan QR</span>
                    </button>
                    <button className={`mobile-nav-btn ${activeTab === 'loads' ? 'active' : ''}`} onClick={() => setActiveTab('loads')}>
                        <i className="fa-solid fa-truck-ramp-box"></i>
                        <span>Loads</span>
                    </button>
                    <button className={`mobile-nav-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
                        <i className="fa-solid fa-clock-rotate-left"></i>
                        <span>History</span>
                    </button>
                </div>
            </main>

            {/* MODALS */}
            {isAddMillOpen && (
                <AddMillModal
                    user={user}
                    onClose={() => setIsAddMillOpen(false)}
                    onMillAdded={fetchMills}
                />
            )}

            {selectedMillForPricing && (
                <UpdatePricesModal
                    mill={selectedMillForPricing}
                    onClose={() => setSelectedMillForPricing(null)}
                    onUpdated={fetchMills}
                />
            )}

            {/* QR SCANNER MODAL */}
            {isQrScannerOpen && (
                <QrScannerModal
                    loggedInMill={activeMill}
                    onClose={() => setIsQrScannerOpen(false)}
                    onVerificationSuccess={() => {
                        refreshAllData();
                        setActiveTab('loads');
                    }}
                />
            )}

            {/* QR CODE MODAL FOR ACCEPTED ENQUIRIES */}
            {selectedEnquiryForQr && (
                <QrCodeModal
                    enquiry={selectedEnquiryForQr}
                    onClose={() => setSelectedEnquiryForQr(null)}
                />
            )}
        </div>
    );
}
