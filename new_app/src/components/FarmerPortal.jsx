import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabase';
import { kisanService } from '../services/kisanService';
import { fetchWeatherByCoords, fetchWeatherByCity, getWeatherIcon } from '../services/weather';
import AddCropModal from './AddCropModal';
import SendEnquiryModal from './SendEnquiryModal';
import QrCodeModal from './QrCodeModal';
import KisanLogo from './KisanLogo';
import FarmerProfileView from './FarmerProfileView';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

export default function FarmerPortal({ user: propUser, onLogout }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { user: authUser, logout: authLogout } = useAuth();
    const user = propUser || authUser || {};
    const handleLogout = onLogout || authLogout;

    // Derive active tab from URL path
    const pathToTab = {
        '': 'dashboard',
        'dashboard': 'dashboard',
        'crops': 'crops',
        'mills': 'mills',
        'enquiries': 'enquiries',
        'qr': 'qrcodes',
        'qrcodes': 'qrcodes',
        'load-status': 'loadstatus',
        'loadstatus': 'loadstatus',
        'transport': 'transport',
        'history': 'history',
        'market': 'market',
        'profile': 'profile'
    };
    const currentSubPath = location.pathname.replace(/^\/farmer\/?/, '').split('/')[0];
    const activeTab = pathToTab[currentSubPath] || 'dashboard';

    const setActiveTab = (tab) => {
        const tabToPath = {
            'dashboard': '/farmer/dashboard',
            'crops': '/farmer/crops',
            'mills': '/farmer/mills',
            'enquiries': '/farmer/enquiries',
            'qrcodes': '/farmer/qr',
            'loadstatus': '/farmer/load-status',
            'transport': '/farmer/transport',
            'history': '/farmer/history',
            'market': '/farmer/market',
            'profile': '/farmer/profile'
        };
        navigate(tabToPath[tab] || `/farmer/${tab}`);
        setIsSidebarOpen(false);
    };

    // CRITICAL BACK BUTTON FIX: Stays inside Farmer Portal workspace
    const handleBack = () => {
        if (window.history.state && window.history.state.idx > 0) {
            navigate(-1);
        } else {
            navigate('/farmer/dashboard');
        }
    };

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isAddCropOpen, setIsAddCropOpen] = useState(false);

    // Profile States
    const [profileName, setProfileName] = useState(user.name || '');
    const [profileAltPhone, setProfileAltPhone] = useState(user.altPhone || '');

    // Data States
    const [crops, setCrops] = useState([]);
    const [weather, setWeather] = useState(null);
    const [loadingCrops, setLoadingCrops] = useState(true);
    const [selectedWeatherLocation, setSelectedWeatherLocation] = useState(null);

    // Nearby Mills States
    const [nearbyMills, setNearbyMills] = useState([]);
    const [isSearchingMills, setIsSearchingMills] = useState(false);
    const [selectedCropForSearch, setSelectedCropForSearch] = useState(null);
    const [selectedMillForEnquiry, setSelectedMillForEnquiry] = useState(null);

    // All Verified Mills & Price Comparison
    const [allVerifiedMills, setAllVerifiedMills] = useState([]);
    const [selectedRateCrop, setSelectedRateCrop] = useState('ALL');
    const [marketRateMode, setMarketRateMode] = useState('MILL_RATES'); // 'MILL_RATES' or 'APMC'

    // Enquiry, QR, Transport & History States
    const [enquiries, setEnquiries] = useState([]);
    const [transportRequests, setTransportRequests] = useState([]);
    const [selectedEnquiryForQr, setSelectedEnquiryForQr] = useState(null);
    const [loadingEnquiries, setLoadingEnquiries] = useState(false);
    const [historyList, setHistoryList] = useState([]);
    const [historyFilter, setHistoryFilter] = useState('ALL');

    // Watch for location changes and update weather
    useEffect(() => {
        if (selectedWeatherLocation && selectedWeatherLocation.latitude && selectedWeatherLocation.longitude) {
            fetchWeatherByCoords(selectedWeatherLocation.latitude, selectedWeatherLocation.longitude).then(wData => {
                if (wData) {
                    wData.name = selectedWeatherLocation.locationName;
                    setWeather(wData);
                }
            });
        } else if (crops.length === 0) {
            fetchWeatherByCity('Hyderabad').then(wData => {
                if (wData) setWeather(wData);
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedWeatherLocation]);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchCrops = async () => {
        setLoadingCrops(true);
        try {
            const { data: fetchedCrops, error } = await supabase
                .from('crops')
                .select('*')
                .eq('user_phone', user.phone)
                .eq('user_role', user.role);

            if (error) throw error;

            if (fetchedCrops && fetchedCrops.length > 0) {
                const mappedCrops = fetchedCrops.map(c => ({
                    id: c.id,
                    cropName: c.crop_name,
                    locationName: c.location_name,
                    latitude: c.latitude,
                    longitude: c.longitude,
                    acres: c.acres,
                    addedAt: c.added_at
                }));
                setCrops(mappedCrops);
                setSelectedCropForSearch(prev => (prev && !mappedCrops.some(mc => mc.id === prev.id) ? null : prev));

                // Set initial weather location to latest crop
                const lastCrop = mappedCrops[mappedCrops.length - 1];
                setSelectedWeatherLocation(lastCrop);
            } else {
                setCrops([]);
                setSelectedCropForSearch(null);
                setSelectedWeatherLocation(null);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingCrops(false);
        }
    };

    const fetchEnquiriesData = async () => {
        setLoadingEnquiries(true);
        try {
            const list = await kisanService.getEnquiries({ farmerPhone: user.phone });
            setEnquiries(list);
            const reqs = kisanService.getTransportRequests({ farmerPhone: user.phone });
            setTransportRequests(reqs);
            const hist = await kisanService.getFarmerHistory(user.phone);
            setHistoryList(hist);
        } catch (e) {
            console.error("Error fetching farmer enquiries & history:", e);
        } finally {
            setLoadingEnquiries(false);
        }
    };

    const fetchAllVerifiedMills = async () => {
        try {
            const { data, error } = await supabase
                .from('mills')
                .select('*')
                .eq('status', 'verified');
            if (!error && data) {
                const mapped = data.map(m => ({
                    id: m.id,
                    ownerPhone: m.owner_phone,
                    millName: m.mill_name,
                    millType: m.mill_type,
                    capacity: m.capacity,
                    requirements: m.requirements,
                    selectedCrops: m.selectedCrops || [],
                    locationName: m.location_name,
                    latitude: m.latitude,
                    longitude: m.longitude,
                    hasColdStorage: m.has_cold_storage,
                    prices: m.prices || {},
                    status: m.status
                }));
                setAllVerifiedMills(mapped);
            }
        } catch (err) {
            console.error("Error fetching verified mills:", err);
        }
    };

    useEffect(() => {
        fetchCrops();
        fetchEnquiriesData();
        fetchAllVerifiedMills();

        const unsub = kisanService.subscribe((event, payload) => {
            fetchCrops();
            fetchEnquiriesData();
            fetchAllVerifiedMills();

            if (event === 'crop_removed' || event === 'crops_changed') {
                if (payload?.cropId) {
                    setCrops(prev => prev.filter(c => c.id !== payload.cropId));
                    setSelectedCropForSearch(prev => (prev?.id === payload.cropId ? null : prev));
                } else if (payload?.cropName) {
                    setCrops(prev => prev.filter(c => c.cropName !== payload.cropName || (payload.locationName && c.locationName !== payload.locationName)));
                    setSelectedCropForSearch(prev => (prev?.cropName === payload.cropName ? null : prev));
                }
            }
        });

        return () => unsub();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSaveCrop = async (cropData) => {
        try {
            const dataToSave = {
                user_phone: user.phone,
                user_role: user.role,
                crop_name: cropData.cropName,
                location_name: cropData.locationName,
                latitude: cropData.latitude,
                longitude: cropData.longitude,
                acres: cropData.acres,
                added_at: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from('crops')
                .insert(dataToSave)
                .select()
                .single();

            if (error) throw error;

            const mappedNewCrop = {
                id: data.id,
                cropName: data.crop_name,
                locationName: data.location_name,
                latitude: data.latitude,
                longitude: data.longitude,
                acres: data.acres,
                addedAt: data.added_at
            };

            setCrops(prev => [...prev, mappedNewCrop]);
            setSelectedWeatherLocation(mappedNewCrop);
            alert(`Successfully saved crop: ${cropData.cropName} at ${cropData.locationName}`);
        } catch (error) {
            console.error(error);
            alert('Failed to save crop');
        }
    };

    const handleDeleteCrop = async (id) => {
        if (!window.confirm("Are you sure you want to delete this crop?")) return;
        try {
            const { error } = await supabase
                .from('crops')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setCrops(prev => prev.filter(c => c.id !== id));
        } catch (error) {
            console.error(error);
            alert("Error deleting crop");
        }
    };

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const handleSearchMills = async (crop) => {
        setSelectedCropForSearch(crop);
        setIsSearchingMills(true);
        try {
            const { data: allMills, error } = await supabase
                .from('mills')
                .select('*')
                .eq('status', 'verified')
                .contains('selectedCrops', [crop.cropName]);

            if (error) throw error;

            const mappedMills = (allMills || []).map(m => ({
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

            const withDistance = mappedMills.map(mill => ({
                ...mill,
                distance: calculateDistance(crop.latitude, crop.longitude, mill.latitude, mill.longitude)
            })).sort((a, b) => a.distance - b.distance);

            setNearbyMills(withDistance);
        } catch (error) {
            console.error("Error searching mills:", error);
        } finally {
            setIsSearchingMills(false);
        }
    };

    const handleAcceptTransportQuote = (quoteId) => {
        kisanService.acceptTransportQuote(quoteId, 'farmers');
        alert("Transport quote accepted! The hauler has been assigned to your load.");
        fetchEnquiriesData();
    };

    // Filter accepted enquiries with QR codes available (Must be fully confirmed)
    const acceptedEnquiries = enquiries.filter(e => {
        const s = (e.status || '').toUpperCase();
        const os = (e.overall_status || '').toUpperCase();
        if (s === 'LOAD_RECEIVED') return true;
        if (os === 'CONFIRMED') return true;
        const hasTransport = Boolean(e.transport_required || e.with_transport);
        if (!hasTransport && s === 'ACCEPTED') return true;
        if (hasTransport && s === 'ACCEPTED' && (e.transport_status || '').toUpperCase() === 'ACCEPTED') return true;
        return false;
    });

    // Calculate mill rates suitable for farmer crops, sorted with highest price first
    const farmerCropNames = Array.from(new Set(crops.map(c => c.cropName).filter(Boolean)));
    const targetCropsForRates = (farmerCropNames.length > 0)
        ? (selectedRateCrop === 'ALL' ? farmerCropNames : [selectedRateCrop])
        : (selectedRateCrop === 'ALL' ? ['Paddy (Rice)', 'Maize', 'Cotton', 'Red Gram'] : [selectedRateCrop]);

    const millOffersByCrop = targetCropsForRates.map(cropName => {
        const farmerCropObj = crops.find(c => c.cropName === cropName);
        const suitableMills = allVerifiedMills.filter(m => 
            Array.isArray(m.selectedCrops) && m.selectedCrops.includes(cropName)
        );

        const offers = suitableMills.map(mill => {
            const rawPrice = mill.prices?.[cropName];
            const price = Number(rawPrice) || (
                cropName === 'Paddy (Rice)' ? 2450 :
                cropName === 'Cotton' ? 7100 :
                cropName === 'Maize' ? 2100 :
                cropName === 'Red Gram' ? 6800 : 2500
            );
            const dist = (farmerCropObj?.latitude && mill.latitude)
                ? calculateDistance(farmerCropObj.latitude, farmerCropObj.longitude, mill.latitude, mill.longitude)
                : 38.5;

            return {
                mill,
                cropName,
                price,
                isCustomRate: Boolean(rawPrice),
                distance: dist,
                farmerCrop: farmerCropObj || { cropName }
            };
        });

        // Sort HIGHEST PRICE FIRST!
        offers.sort((a, b) => b.price - a.price);

        return {
            cropName,
            farmerCrop: farmerCropObj,
            highestPrice: offers[0]?.price || 0,
            offers
        };
    }).filter(group => group.offers.length > 0);

    const cropCountText = crops.length > 1 ? `${crops.length} Lots` : crops.length === 1 ? crops[0].cropName : '0 Lots';
    const cropLocationText = crops.length > 1 ? `${crops[crops.length - 1].cropName} & more` : crops.length === 1 ? crops[0].locationName : 'Add crops to track';
    const locationStatusClass = crops.length > 0 ? 'trend up' : 'trend neutral';

    return (
        <div className="app-container" style={{ display: 'flex' }}>
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
                    <a className={`nav-item ${activeTab === 'crops' ? 'active' : ''}`} onClick={() => { setActiveTab('crops'); setIsSidebarOpen(false); }}>
                        <i className="fa-solid fa-seedling"></i>
                        <span>My Crops</span>
                    </a>
                    <a className={`nav-item ${activeTab === 'mills' ? 'active' : ''}`} onClick={() => { setActiveTab('mills'); setIsSidebarOpen(false); }}>
                        <i className="fa-solid fa-industry"></i>
                        <span>Nearby Mills</span>
                    </a>
                    <a className={`nav-item ${activeTab === 'enquiries' ? 'active' : ''}`} onClick={() => { setActiveTab('enquiries'); setIsSidebarOpen(false); }}>
                        <i className="fa-solid fa-paper-plane"></i>
                        <span>My Enquiries</span>
                        {enquiries.length > 0 && (
                            <span className="nav-badge" style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '0.1rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem' }}>
                                {enquiries.length}
                            </span>
                        )}
                    </a>
                    <a className={`nav-item ${activeTab === 'qrcodes' ? 'active' : ''}`} onClick={() => { setActiveTab('qrcodes'); setIsSidebarOpen(false); }}>
                        <i className="fa-solid fa-qrcode" style={{ color: 'var(--primary)' }}></i>
                        <span style={{ color: 'var(--primary)', fontWeight: 700 }}>My QR Codes</span>
                        {acceptedEnquiries.length > 0 && (
                            <span className="nav-badge" style={{ marginLeft: 'auto', background: 'var(--primary)', color: '#000', padding: '0.1rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 800 }}>
                                {acceptedEnquiries.length}
                            </span>
                        )}
                    </a>
                    <a className={`nav-item ${activeTab === 'loadstatus' ? 'active' : ''}`} onClick={() => { setActiveTab('loadstatus'); setIsSidebarOpen(false); }}>
                        <i className="fa-solid fa-timeline"></i>
                        <span>Load Status</span>
                    </a>
                    <a className={`nav-item ${activeTab === 'transport' ? 'active' : ''}`} onClick={() => { setActiveTab('transport'); setIsSidebarOpen(false); }}>
                        <i className="fa-solid fa-truck-fast"></i>
                        <span>Transport</span>
                    </a>
                    <a className={`nav-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => { setActiveTab('history'); setIsSidebarOpen(false); }}>
                        <i className="fa-solid fa-clock-rotate-left"></i>
                        <span>History & Ledger</span>
                    </a>
                    <a className={`nav-item ${activeTab === 'market' ? 'active' : ''}`} onClick={() => { setActiveTab('market'); setIsSidebarOpen(false); }}>
                        <i className="fa-solid fa-chart-line"></i>
                        <span>Market Prices</span>
                    </a>
                    <a className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => { setActiveTab('profile'); setIsSidebarOpen(false); }}>
                        <i className="fa-solid fa-user-gear"></i>
                        <span>Profile</span>
                    </a>
                </nav>

                <div className="sidebar-bottom">
                    <a className="nav-item logout" onClick={handleLogout}>
                        <i className="fa-solid fa-arrow-right-from-bracket"></i>
                        <span>Logout</span>
                    </a>
                </div>
            </aside>

            {/* Main Content */}
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
                        <div className="search-bar">
                            <i className="fa-solid fa-search"></i>
                            <input type="text" placeholder="Search crops, prices, enquiries..." />
                        </div>
                    </div>

                    <div className="header-actions" style={{ alignItems: 'center', gap: '1rem' }}>
                        {acceptedEnquiries.length > 0 && (
                            <button 
                                className="primary-btn" 
                                onClick={() => setActiveTab('qrcodes')}
                                style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', borderRadius: '0.75rem' }}
                            >
                                <i className="fa-solid fa-qrcode"></i>
                                View Verification QR ({acceptedEnquiries.length})
                            </button>
                        )}

                        <div className="header-datetime">
                            <div style={{ fontWeight: 600, color: 'var(--text)' }}>
                                {currentTime.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })}
                            </div>
                            <div>{currentTime.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</div>
                        </div>

                        <div className="user-profile" onClick={() => setActiveTab('profile')} style={{ cursor: 'pointer' }} title="View Farmer Profile">
                            <div className="profile-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', color: 'var(--primary)', fontSize: '1.5rem', width: '42px', height: '42px', borderRadius: '50%' }}>
                                <i className="fa-solid fa-user"></i>
                            </div>
                            <div className="user-info">
                                <h4>{profileName || user.phone}</h4>
                                <p>Verified Farmer</p>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="dashboard-content" style={{ padding: '2rem 1.5rem' }}>

                    {/* ======================================================== */}
                    {/* TAB: DASHBOARD */}
                    {/* ======================================================== */}
                    {activeTab === 'dashboard' && (
                        <div className="dashboard view-section" style={{ display: 'block' }}>
                            <div className="welcome-section">
                                <div>
                                    <h1>Good Day, {profileName || 'Kisan'}! 🌾</h1>
                                    <p>Connected directly to mills, transparent grain discovery, and instant QR verification.</p>
                                </div>
                                <button className="primary-btn" onClick={() => setIsAddCropOpen(true)}>
                                    <i className="fa-solid fa-plus"></i> Add New Crop
                                </button>
                            </div>

                            <div className="stats-grid">
                                <div className="stat-card">
                                    <div className="stat-icon crops"><i className="fa-solid fa-wheat-awn"></i></div>
                                    <div className="stat-details">
                                        <h3>Active Crops</h3>
                                        <h2>{cropCountText}</h2>
                                        <span className={locationStatusClass}>{cropLocationText}</span>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon orders"><i className="fa-solid fa-paper-plane"></i></div>
                                    <div className="stat-details">
                                        <h3>Sent Enquiries</h3>
                                        <h2>{enquiries.length}</h2>
                                        <span className="trend neutral">{enquiries.filter(e => e.status === 'ACCEPTED').length} Accepted</span>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon revenue"><i className="fa-solid fa-qrcode"></i></div>
                                    <div className="stat-details">
                                        <h3>Verification QRs</h3>
                                        <h2>{acceptedEnquiries.length} Ready</h2>
                                        <span className="trend up">Scan-ready for delivery</span>
                                    </div>
                                </div>
                            </div>

                            {/* Active QR Quick Access Card */}
                            {acceptedEnquiries.length > 0 && (
                                <div className="bento-card" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(245, 158, 11, 0.1) 100%)', border: '1px solid var(--primary)', marginBottom: '2rem', padding: '1.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                                        <div>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '1px', textTransform: 'uppercase' }}>
                                                GATE DELIVERY READY
                                            </span>
                                            <h3 style={{ margin: '0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <i className="fa-solid fa-qrcode" style={{ color: 'var(--primary)' }}></i>
                                                Enquiry {acceptedEnquiries[0].enquiry_code} Accepted!
                                            </h3>
                                            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                                {acceptedEnquiries[0].mill_name} accepted your {acceptedEnquiries[0].crop_name} load. Present your QR at the mill gate.
                                            </p>
                                        </div>
                                        <button className="primary-btn" onClick={() => setSelectedEnquiryForQr(acceptedEnquiries[0])} style={{ padding: '0.75rem 1.25rem' }}>
                                            <i className="fa-solid fa-qrcode"></i> Show Verification QR
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Weather & Live Prices Grid */}
                            <div className="bento-grid">
                                <div className="bento-card weather-card">
                                    <div className="card-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '1rem' }}>
                                        <h3 style={{ marginBottom: '-0.5rem' }}>Farm Weather</h3>
                                        <div className="location-selector" style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '0.5rem 1rem', borderRadius: '0.5rem' }}>
                                            <i className="fa-solid fa-location-dot" style={{ color: 'var(--primary)' }}></i>
                                            <select
                                                value={selectedWeatherLocation?.id || ''}
                                                onChange={(e) => setSelectedWeatherLocation(crops.find(c => c.id === e.target.value))}
                                                style={{ border: 'none', background: 'transparent', outline: 'none', fontFamily: 'inherit', color: 'var(--text)', flex: 1, cursor: 'pointer', fontSize: '0.95rem' }}
                                            >
                                                {crops.length === 0 ? (
                                                    <option value="" disabled style={{ color: '#000', background: '#fff' }}>Hyderabad (Default)</option>
                                                ) : (
                                                    crops.map(c => (
                                                        <option key={c.id} value={c.id} style={{ color: '#000', background: '#fff' }}>{c.cropName} - {c.locationName}</option>
                                                    ))
                                                )}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="current-weather">
                                        <i className={`fa-solid ${getWeatherIcon(weather?.weather[0]?.id || 800)}`} style={{ fontSize: '3rem', color: '#ffb300' }}></i>
                                        <div className="temp">
                                            <h2>{weather ? `${Math.round(weather.main.temp)}°C` : '--'}</h2>
                                            <p>{weather?.weather[0]?.main || '--'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bento-card market-prices" style={{ display: 'flex', flexDirection: 'column' }}>
                                    {/* Card Header with Mode Toggle and View All */}
                                    <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Live Mill Buying Rates 💰</h3>
                                                <span className="status-badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--primary)', fontSize: '0.7rem', padding: '0.15rem 0.5rem', fontWeight: 800 }}>
                                                    HIGHEST PRICES
                                                </span>
                                            </div>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: '0.2rem 0 0 0' }}>
                                                {farmerCropNames.length > 0 ? 'Mills matched to your crops, ranked by highest offer' : 'Verified mill prices ranked by highest rate'}
                                            </p>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.06)', borderRadius: '0.5rem', padding: '0.15rem' }}>
                                                <button 
                                                    onClick={() => setMarketRateMode('MILL_RATES')}
                                                    style={{ 
                                                        background: marketRateMode === 'MILL_RATES' ? 'var(--primary)' : 'transparent', 
                                                        color: marketRateMode === 'MILL_RATES' ? '#000' : 'var(--text-muted)',
                                                        border: 'none', 
                                                        padding: '0.3rem 0.65rem', 
                                                        borderRadius: '0.4rem', 
                                                        fontSize: '0.75rem', 
                                                        fontWeight: 700, 
                                                        cursor: 'pointer' 
                                                    }}
                                                >
                                                    <i className="fa-solid fa-industry"></i> Mill Rates
                                                </button>
                                                <button 
                                                    onClick={() => setMarketRateMode('APMC')}
                                                    style={{ 
                                                        background: marketRateMode === 'APMC' ? 'var(--primary)' : 'transparent', 
                                                        color: marketRateMode === 'APMC' ? '#000' : 'var(--text-muted)',
                                                        border: 'none', 
                                                        padding: '0.3rem 0.65rem', 
                                                        borderRadius: '0.4rem', 
                                                        fontSize: '0.75rem', 
                                                        fontWeight: 700, 
                                                        cursor: 'pointer' 
                                                    }}
                                                >
                                                    <i className="fa-solid fa-chart-line"></i> APMC
                                                </button>
                                            </div>
                                            <button className="text-btn" onClick={() => setActiveTab('market')} style={{ fontSize: '0.8rem', padding: '0.3rem' }}>
                                                View All
                                            </button>
                                        </div>
                                    </div>

                                    {/* Filter by Farmer's Crops (if farmer has multiple crops) */}
                                    {marketRateMode === 'MILL_RATES' && farmerCropNames.length > 1 && (
                                        <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.4rem', marginBottom: '0.5rem' }}>
                                            <button
                                                onClick={() => setSelectedRateCrop('ALL')}
                                                style={{
                                                    padding: '0.25rem 0.65rem',
                                                    fontSize: '0.75rem',
                                                    borderRadius: '1rem',
                                                    background: selectedRateCrop === 'ALL' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)',
                                                    color: selectedRateCrop === 'ALL' ? 'var(--primary)' : 'var(--text-muted)',
                                                    border: selectedRateCrop === 'ALL' ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                                                    cursor: 'pointer',
                                                    whiteSpace: 'nowrap',
                                                    fontWeight: 700
                                                }}
                                            >
                                                All My Crops ({farmerCropNames.length})
                                            </button>
                                            {farmerCropNames.map(cName => (
                                                <button
                                                    key={cName}
                                                    onClick={() => setSelectedRateCrop(cName)}
                                                    style={{
                                                        padding: '0.25rem 0.65rem',
                                                        fontSize: '0.75rem',
                                                        borderRadius: '1rem',
                                                        background: selectedRateCrop === cName ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)',
                                                        color: selectedRateCrop === cName ? 'var(--primary)' : 'var(--text-muted)',
                                                        border: selectedRateCrop === cName ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                                                        cursor: 'pointer',
                                                        whiteSpace: 'nowrap',
                                                        fontWeight: 700
                                                    }}
                                                >
                                                    {cName}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Content: Best Mill Offers */}
                                    {marketRateMode === 'MILL_RATES' ? (
                                        <div className="prices-list" style={{ marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '380px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                                            {millOffersByCrop.length === 0 ? (
                                                <div style={{ textAlign: 'center', padding: '1.5rem 0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                                    <i className="fa-solid fa-industry fa-2x" style={{ opacity: 0.3, marginBottom: '0.5rem' }}></i>
                                                    <div>No mills currently buying this crop.</div>
                                                    <button className="action-btn" onClick={() => setSelectedRateCrop('ALL')} style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>
                                                        Show All Mills
                                                    </button>
                                                </div>
                                            ) : (
                                                millOffersByCrop.map(group => (
                                                    <div key={group.cropName} style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '0.75rem', padding: '0.85rem' }}>
                                                        {/* Crop Title with Highest Rate Highlight */}
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.5rem', marginBottom: '0.65rem' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                                <span style={{ fontSize: '1.05rem' }}>🌾</span>
                                                                <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>{group.cropName}</strong>
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Top Offer:</span>
                                                                <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '0.95rem' }}>
                                                                    ₹{group.highestPrice.toLocaleString('en-IN')}/Qtl
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Mills list sorted by price descending */}
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                            {group.offers.map((offer, idx) => {
                                                                const isTop = idx === 0;
                                                                return (
                                                                    <div 
                                                                        key={offer.mill.id}
                                                                        style={{ 
                                                                            display: 'flex', 
                                                                            justifyContent: 'space-between', 
                                                                            alignItems: 'center', 
                                                                            padding: '0.6rem 0.75rem', 
                                                                            borderRadius: '0.5rem', 
                                                                            background: isTop ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255,255,255,0.03)',
                                                                            border: isTop ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(255,255,255,0.04)',
                                                                            boxShadow: isTop ? '0 0 12px rgba(16, 185, 129, 0.1)' : 'none'
                                                                        }}
                                                                    >
                                                                        <div style={{ flex: 1, minWidth: 0, marginRight: '0.5rem' }}>
                                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                                                                <strong style={{ fontSize: '0.88rem', color: 'var(--text-main)' }}>
                                                                                    {offer.mill.millName}
                                                                                </strong>
                                                                                {isTop && (
                                                                                    <span style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#000', fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '0.3rem', fontWeight: 800, letterSpacing: '0.3px' }}>
                                                                                        👑 HIGHEST PRICE
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                                                                                <i className="fa-solid fa-location-dot"></i> {offer.mill.locationName || 'Nearby Mill'} • ~{offer.distance.toFixed(1)} km
                                                                            </div>
                                                                        </div>

                                                                        <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                                                            <div>
                                                                                <div style={{ fontWeight: 800, fontSize: '1rem', color: isTop ? 'var(--primary)' : 'var(--accent-gold)' }}>
                                                                                    ₹{offer.price.toLocaleString('en-IN')}
                                                                                </div>
                                                                                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>per quintal</div>
                                                                            </div>

                                                                            <button
                                                                                className="primary-btn"
                                                                                onClick={() => {
                                                                                    setSelectedMillForEnquiry(offer.mill);
                                                                                    setSelectedCropForSearch(offer.farmerCrop);
                                                                                }}
                                                                                style={{ 
                                                                                    padding: '0.4rem 0.75rem', 
                                                                                    fontSize: '0.75rem', 
                                                                                    fontWeight: 700,
                                                                                    background: isTop ? 'var(--primary)' : 'rgba(255,255,255,0.08)',
                                                                                    color: isTop ? '#000' : 'var(--text-main)',
                                                                                    border: isTop ? 'none' : '1px solid rgba(255,255,255,0.1)'
                                                                                }}
                                                                            >
                                                                                Send Enquiry
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    ) : (
                                        /* APMC Mandi Benchmark Rates View */
                                        <div className="prices-list" style={{ marginTop: '0.5rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.8rem 0', borderBottom: '1px solid var(--border-color)' }}>
                                                <div>
                                                    <div style={{ fontWeight: 600 }}>Paddy (Rice)</div>
                                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Khammam APMC</div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>₹2,250</div>
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>+2.5%</span>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.8rem 0', borderBottom: '1px solid var(--border-color)' }}>
                                                <div>
                                                    <div style={{ fontWeight: 600 }}>Maize</div>
                                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Nizamabad Mandi</div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>₹1,960</div>
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>-1.2%</span>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.8rem 0', borderBottom: '1px solid var(--border-color)' }}>
                                                <div>
                                                    <div style={{ fontWeight: 600 }}>Cotton</div>
                                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Adoni APMC</div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>₹7,100</div>
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>+0.8%</span>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.8rem 0' }}>
                                                <div>
                                                    <div style={{ fontWeight: 600 }}>Red Gram</div>
                                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Tandur Mandi</div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>₹7,000</div>
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>+1.5%</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ======================================================== */}
                    {/* TAB: MY CROPS */}
                    {/* ======================================================== */}
                    {activeTab === 'crops' && (
                        <div className="dashboard view-section" style={{ display: 'block' }}>
                            <div className="welcome-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h1>My Crops 🌱</h1>
                                    <p>Manage all your active crops and locations here.</p>
                                </div>
                                <button className="primary-btn" onClick={() => setIsAddCropOpen(true)}>
                                    <i className="fa-solid fa-plus"></i> Add Crop
                                </button>
                            </div>
                            <div className="bento-card">
                                <div className="table-responsive">
                                    <table className="orders-table" style={{ width: '100%', textAlign: 'left' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                <th style={{ padding: '1rem' }}>Crop Name</th>
                                                <th style={{ padding: '1rem' }}>Location</th>
                                                <th style={{ padding: '1rem' }}>Acres</th>
                                                <th style={{ padding: '1rem' }}>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {loadingCrops ? (
                                                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>Loading crops...</td></tr>
                                            ) : crops.length === 0 ? (
                                                <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No crops added yet.</td></tr>
                                            ) : crops.map(c => (
                                                <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                    <td style={{ padding: '1rem', fontWeight: 600 }}>{c.cropName}</td>
                                                    <td style={{ padding: '1rem', color: 'var(--text-muted)' }}><i className="fa-solid fa-location-dot"></i> {c.locationName}</td>
                                                    <td style={{ padding: '1rem' }}>{c.acres} Acres</td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <button className="action-btn text-btn" onClick={() => handleDeleteCrop(c.id)} style={{ color: 'var(--danger)' }}>
                                                            <i className="fa-solid fa-trash"></i>
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
                    {/* TAB: NEARBY MILLS */}
                    {/* ======================================================== */}
                    {activeTab === 'mills' && (
                        <div className="dashboard view-section" style={{ display: 'block' }}>
                            <div className="welcome-section">
                                <div>
                                    <h1>Nearby Mills 🏭</h1>
                                    <p>Select your crop to search verified processing mills and send direct enquiries.</p>
                                </div>
                            </div>

                            <div className="bento-card" style={{ marginBottom: '2rem' }}>
                                <h3 style={{ margin: '0 0 1rem 0' }}>Select Crop to Search Mills</h3>
                                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                    {crops.map(c => (
                                        <button
                                            key={c.id}
                                            className={`primary-btn ${selectedCropForSearch?.id === c.id ? '' : 'text-btn'}`}
                                            style={{
                                                background: selectedCropForSearch?.id === c.id ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                                color: selectedCropForSearch?.id === c.id ? '#000' : 'var(--text-main)',
                                                border: selectedCropForSearch?.id === c.id ? 'none' : '1px solid var(--border-color)'
                                            }}
                                            onClick={() => handleSearchMills(c)}
                                        >
                                            <i className="fa-solid fa-wheat-awn"></i> {c.cropName} ({c.locationName})
                                        </button>
                                    ))}
                                    {crops.length === 0 && <p style={{ color: 'var(--text-muted)' }}>Add a crop first to search matching mills.</p>}
                                </div>
                            </div>

                            {selectedCropForSearch && (
                                <div>
                                    <h3 style={{ marginBottom: '1.25rem' }}>Verified Mills Buying {selectedCropForSearch.cropName}</h3>
                                    {isSearchingMills ? (
                                        <div style={{ padding: '2rem', textAlign: 'center' }}>Searching mills...</div>
                                    ) : nearbyMills.length === 0 ? (
                                        <div className="bento-card" style={{ textAlign: 'center', padding: '3rem' }}>
                                            <p style={{ color: 'var(--text-muted)' }}>No mills currently buying this crop.</p>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                                            {nearbyMills.map(mill => (
                                                <div key={mill.id} className="bento-card" style={{ border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                                        <h3 style={{ margin: 0, fontSize: '1.15rem' }}>{mill.millName}</h3>
                                                        <span style={{ color: 'var(--primary)', fontWeight: 700 }}>~{mill.distance.toFixed(1)} km</span>
                                                    </div>
                                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                                                        <i className="fa-solid fa-location-dot"></i> {mill.locationName}
                                                    </div>
                                                    <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                                                        <div>Capacity: <strong>{mill.capacity} TPD</strong></div>
                                                        <div>Cold Storage: <strong>{mill.hasColdStorage ? 'YES' : 'NO'}</strong></div>
                                                        {mill.prices?.[selectedCropForSearch.cropName] && (
                                                            <div style={{ color: 'var(--primary)', fontWeight: 700, marginTop: '0.3rem' }}>
                                                                Rate: ₹{mill.prices[selectedCropForSearch.cropName]} / Quintal
                                                            </div>
                                                        )}
                                                    </div>
                                                    <button 
                                                        className="primary-btn" 
                                                        onClick={() => setSelectedMillForEnquiry(mill)}
                                                        style={{ width: '100%', justifyContent: 'center' }}
                                                    >
                                                        <i className="fa-solid fa-paper-plane"></i>
                                                        Send Enquiry
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ======================================================== */}
                    {/* TAB: MY ENQUIRIES */}
                    {/* ======================================================== */}
                    {activeTab === 'enquiries' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '1.6rem' }}>My Sent Enquiries 📬</h2>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
                                        Track mill review, acceptance, and generated verification QR codes
                                    </p>
                                </div>
                            </div>

                            {enquiries.length === 0 ? (
                                <div className="bento-card" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                                    <i className="fa-solid fa-inbox fa-3x" style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}></i>
                                    <h3>No Enquiries Sent Yet</h3>
                                    <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 1.5rem' }}>
                                        Search nearby mills and click "Send Enquiry" to propose a harvest sale.
                                    </p>
                                    <button className="primary-btn" onClick={() => setActiveTab('mills')}>
                                        Search Nearby Mills
                                    </button>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
                                    {enquiries.map(enq => {
                                        const millAccepted = (enq.mill_status || enq.status || '').toUpperCase() === 'ACCEPTED' || (enq.status || '').toUpperCase() === 'LOAD_RECEIVED';
                                        const millPending = !millAccepted && (enq.mill_status || enq.status || '').toUpperCase() !== 'REJECTED';
                                        const millRejected = (enq.mill_status || enq.status || '').toUpperCase() === 'REJECTED';

                                        const hasTransport = Boolean(enq.transport_required || enq.with_transport);
                                        const transportAccepted = (enq.transport_status || '').toUpperCase() === 'ACCEPTED';
                                        const transportPending = hasTransport && !transportAccepted && (enq.transport_status || '').toUpperCase() !== 'REJECTED';
                                        const transportRejected = (enq.transport_status || '').toUpperCase() === 'REJECTED';

                                        const isOverallConfirmed = enq.overall_status === 'CONFIRMED' || (!hasTransport && millAccepted) || (hasTransport && millAccepted && transportAccepted) || (enq.status || '').toUpperCase() === 'LOAD_RECEIVED';

                                        return (
                                            <div key={enq.id} className="bento-card" style={{ border: isOverallConfirmed ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column' }}>
                                                {/* Header */}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                                                    <div>
                                                        <span style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--accent-gold)', fontSize: '1rem' }}>
                                                            {enq.enquiry_code}
                                                        </span>
                                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                                            {new Date(enq.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </div>
                                                    </div>

                                                    <span className="status-badge" style={{
                                                        background: isOverallConfirmed ? 'rgba(16, 185, 129, 0.2)' : millRejected || transportRejected ? 'rgba(239, 68, 68, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                                                        color: isOverallConfirmed ? 'var(--primary)' : millRejected || transportRejected ? '#ef4444' : '#fbbf24',
                                                        textTransform: 'uppercase',
                                                        padding: '0.25rem 0.65rem',
                                                        borderRadius: '0.5rem',
                                                        fontWeight: 700,
                                                        fontSize: '0.75rem'
                                                    }}>
                                                        {isOverallConfirmed ? '🟢 CONFIRMED' : millRejected || transportRejected ? '🔴 REJECTED' : '🟡 IN PROGRESS'}
                                                    </span>
                                                </div>

                                                {/* Body */}
                                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.85rem' }}>
                                                    <div><span style={{ color: 'var(--text-muted)' }}>Crop:</span> <strong style={{ color: 'var(--primary)' }}>{enq.crop_name}</strong></div>
                                                    <div><span style={{ color: 'var(--text-muted)' }}>Quantity:</span> <strong>{enq.quantity || (enq.acres * 2)} Tons ({enq.acres} Acres)</strong></div>
                                                    <div><span style={{ color: 'var(--text-muted)' }}>Target Mill:</span> <strong>{enq.mill_name}</strong> (~{Number(enq.distance || 35).toFixed(1)} km)</div>
                                                    <div><span style={{ color: 'var(--text-muted)' }}>Expected Price:</span> <strong style={{ color: 'var(--accent-gold)' }}>₹{enq.expected_price || 'Market'} / Quintal</strong></div>
                                                    
                                                    {/* Transport Logistics Box */}
                                                    <div style={{ background: hasTransport ? 'rgba(16, 185, 129, 0.05)' : 'rgba(0, 0, 0, 0.25)', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: hasTransport ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(255, 255, 255, 0.06)', marginTop: '0.3rem' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: hasTransport ? '0.35rem' : 0 }}>
                                                            <span style={{ fontWeight: 600, color: hasTransport ? 'var(--primary)' : 'var(--text-muted)', fontSize: '0.8rem' }}>
                                                                <i className="fa-solid fa-truck" style={{ marginRight: '0.3rem' }}></i>
                                                                {hasTransport ? 'Logistics Requested' : 'Self Arranged by Farmer'}
                                                            </span>
                                                            {hasTransport && (
                                                                <span style={{ fontSize: '0.72rem', color: transportAccepted ? 'var(--primary)' : '#fbbf24', fontWeight: 700 }}>
                                                                    {transportAccepted ? 'Driver Confirmed ✅' : 'Driver Pending ⏳'}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {hasTransport && (
                                                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem' }}>
                                                                <div>Driver: <strong style={{ color: '#fff' }}>{enq.driver_name || 'Assigned Driver'}</strong></div>
                                                                <div>Vehicle: <strong style={{ color: '#fff' }}>{enq.vehicle_number || enq.vehicle_type || 'Truck'}</strong></div>
                                                                <div>Date: <strong style={{ color: '#fff' }}>{enq.transport_date || enq.pickup_date || 'Flexible'}</strong></div>
                                                                <div>Est. Cost: <strong style={{ color: 'var(--accent-gold)' }}>₹{enq.estimated_transport_cost?.toLocaleString() || 'Calculated'}</strong></div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Status Dual Breakdown */}
                                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.2rem', fontSize: '0.75rem' }}>
                                                        <div style={{ flex: 1, padding: '0.35rem 0.5rem', background: 'rgba(0,0,0,0.3)', borderRadius: '0.4rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                                                            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.68rem' }}>Mill Decision</span>
                                                            <strong style={{ color: millAccepted ? 'var(--primary)' : millRejected ? '#ef4444' : '#fbbf24' }}>
                                                                {millAccepted ? '✅ Accepted' : millRejected ? '❌ Declined' : '⏳ Pending'}
                                                            </strong>
                                                        </div>
                                                        {hasTransport && (
                                                            <div style={{ flex: 1, padding: '0.35rem 0.5rem', background: 'rgba(0,0,0,0.3)', borderRadius: '0.4rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                                                                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.68rem' }}>Driver Decision</span>
                                                                <strong style={{ color: transportAccepted ? 'var(--primary)' : transportRejected ? '#ef4444' : '#fbbf24' }}>
                                                                    {transportAccepted ? '✅ Accepted' : transportRejected ? '❌ Declined' : '⏳ Pending'}
                                                                </strong>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Footer Action */}
                                                <div style={{ marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                                                    {isOverallConfirmed ? (
                                                        <button 
                                                            className="primary-btn" 
                                                            onClick={() => setSelectedEnquiryForQr(enq)}
                                                            style={{ width: '100%', justifyContent: 'center', padding: '0.65rem', fontWeight: 800 }}
                                                        >
                                                            <i className="fa-solid fa-qrcode"></i>
                                                            View Verification QR
                                                        </button>
                                                    ) : millRejected || transportRejected ? (
                                                        <div style={{ textAlign: 'center', color: '#ef4444', fontSize: '0.82rem', fontWeight: 600, padding: '0.35rem 0' }}>
                                                            <i className="fa-solid fa-circle-xmark"></i> {millRejected ? 'Declined by Mill' : 'Declined by Driver'}
                                                        </div>
                                                    ) : (
                                                        <div style={{ textAlign: 'center', color: '#fbbf24', fontSize: '0.8rem', padding: '0.35rem 0', fontWeight: 600, background: 'rgba(234, 179, 8, 0.08)', borderRadius: '0.4rem' }}>
                                                            <i className="fa-solid fa-hourglass-half"></i> {millAccepted ? 'Mill Accepted • Waiting for Driver' : transportAccepted ? 'Driver Accepted • Waiting for Mill' : 'Awaiting Confirmation'}
                                                        </div>
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
                    {/* TAB: MY QR CODES (CROP VERIFICATION QR) */}
                    {/* ======================================================== */}
                    {activeTab === 'qrcodes' && (
                        <div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <h2 style={{ margin: 0, fontSize: '1.6rem' }}>Crop Verification QR Codes 🛡️</h2>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
                                    Authorized digital manifests for gate scanning, load authenticity, and delivery verification
                                </p>
                            </div>

                            {acceptedEnquiries.length === 0 ? (
                                <div className="bento-card" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                                    <i className="fa-solid fa-qrcode fa-3x" style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}></i>
                                    <h3>No Active QR Codes</h3>
                                    <p style={{ color: 'var(--text-muted)', maxWidth: '450px', margin: '0.5rem auto 1.5rem' }}>
                                        Once a mill accepts your enquiry, your secure QR code is automatically generated and permanently saved here.
                                    </p>
                                    <button className="primary-btn" onClick={() => setActiveTab('enquiries')}>
                                        Check Enquiries Status
                                    </button>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                                    {acceptedEnquiries.map(enq => (
                                        <div key={enq.id} className="bento-card" style={{ textAlign: 'center', border: '1px solid rgba(16, 185, 129, 0.35)', padding: '1.75rem 1.5rem' }}>
                                            <div style={{ display: 'inline-block', padding: '0.3rem 0.8rem', borderRadius: '1rem', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                                                {enq.load_status === 'LOAD_RECEIVED' ? '✓ LOAD RECEIVED AT MILL' : 'READY FOR GATE SCAN'}
                                            </div>

                                            <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.2rem' }}>{enq.crop_name}</h3>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 0 1rem 0' }}>
                                                {enq.quantity || (enq.acres * 2)} Tons to {enq.mill_name}
                                            </p>

                                            <div style={{ background: '#fff', padding: '0.75rem', borderRadius: '1rem', display: 'inline-block', marginBottom: '1rem', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }}>
                                                <div style={{ width: '160px', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#022c22', fontWeight: 700 }}>
                                                    <i className="fa-solid fa-qrcode fa-5x"></i>
                                                </div>
                                            </div>

                                            <div style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--accent-gold)', fontSize: '1.05rem', marginBottom: '1rem' }}>
                                                {enq.enquiry_code}
                                            </div>

                                            <button 
                                                className="primary-btn"
                                                onClick={() => setSelectedEnquiryForQr(enq)}
                                                style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}
                                            >
                                                <i className="fa-solid fa-expand"></i>
                                                Open Full QR & Share
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ======================================================== */}
                    {/* TAB: LOAD STATUS LIFECYCLE */}
                    {/* ======================================================== */}
                    {activeTab === 'loadstatus' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '1.6rem' }}>Load Status & Traceability 📈</h2>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
                                        Full end-to-end audit lifecycle from initial farmer enquiry to gate verification and mill receipt
                                    </p>
                                </div>
                                <button className="action-btn" onClick={fetchEnquiriesData} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.9rem' }}>
                                    <i className={`fa-solid fa-rotate-right ${loadingEnquiries ? 'fa-spin' : ''}`}></i> Refresh Status
                                </button>
                            </div>

                            {enquiries.length === 0 ? (
                                <div className="bento-card" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
                                    <p style={{ color: 'var(--text-muted)' }}>No loads initiated yet. Send an enquiry to a mill to start.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    {enquiries.map(enq => {
                                        const statusUpper = (enq.status || '').toUpperCase();
                                        const isPending = statusUpper === 'PENDING';
                                        const isAccepted = statusUpper === 'ACCEPTED' || statusUpper === 'QR_SCANNED' || statusUpper === 'LOAD_RECEIVED';
                                        const hasTransport = Boolean(enq.transport_required || enq.with_transport);
                                        const tr = transportRequests.find(t => t.enquiry_id === enq.id || t.enquiry_code === enq.enquiry_code);

                                        const isTransportAssigned = Boolean(tr && tr.status !== 'REQUESTED');
                                        const isPickedUp = Boolean(tr && (tr.status === 'CROP_PICKED_UP' || tr.status === 'IN_TRANSIT' || tr.status === 'ARRIVED_AT_MILL' || tr.status === 'DELIVERED'));
                                        const isInTransit = Boolean(tr && (tr.status === 'IN_TRANSIT' || tr.status === 'ARRIVED_AT_MILL' || tr.status === 'DELIVERED'));
                                        const isAtMillGate = Boolean(tr && (tr.status === 'ARRIVED_AT_MILL' || tr.status === 'DELIVERED'));
                                        const isQrScanned = Boolean(enq.qr_scanned || statusUpper === 'QR_SCANNED' || statusUpper === 'LOAD_RECEIVED' || isAtMillGate);
                                        const isReceived = Boolean(statusUpper === 'LOAD_RECEIVED' || (enq.load_status || '').toUpperCase() === 'LOAD_RECEIVED' || (tr && tr.status === 'DELIVERED'));

                                        const stages = hasTransport ? [
                                            { label: 'Enquiry Sent', done: true, time: enq.created_at },
                                            { label: 'Mill Accepted', done: isAccepted, time: enq.accepted_at },
                                            { label: 'Driver Dispatched', done: isTransportAssigned, time: tr?.created_at },
                                            { label: isQrScanned ? 'QR Scanned at Gate' : isInTransit ? 'In Transit to Mill' : 'Load Loaded', done: isPickedUp || isInTransit || isQrScanned || isReceived, time: isQrScanned ? (enq.scanned_at || enq.received_at) : tr?.updated_at },
                                            { label: 'Load Received', done: isReceived, time: enq.received_at || tr?.delivered_at }
                                        ] : [
                                            { label: 'Enquiry Sent', done: true, time: enq.created_at },
                                            { label: 'Mill Accepted', done: isAccepted, time: enq.accepted_at },
                                            { label: 'QR Generated', done: isAccepted, time: enq.accepted_at },
                                            { label: 'QR Scanned at Gate', done: isQrScanned || isReceived, time: enq.scanned_at || enq.received_at },
                                            { label: 'Load Received', done: isReceived, time: enq.received_at }
                                        ];

                                        return (
                                            <div key={enq.id} className="bento-card" style={{ border: `1px solid ${isReceived ? 'var(--primary)' : isAccepted ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.1)'}` }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                    <div>
                                                        <span style={{ fontFamily: 'monospace', color: 'var(--accent-gold)', fontWeight: 800, fontSize: '1.1rem' }}>
                                                            {enq.enquiry_code}
                                                        </span>
                                                        <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '1.1rem' }}>
                                                            {enq.crop_name} • {enq.quantity || (enq.acres * 2)} Tons
                                                        </h3>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                            Destination: <strong>{enq.mill_name}</strong>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        {isReceived ? (
                                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.9rem', borderRadius: '2rem', background: 'rgba(16, 185, 129, 0.2)', color: 'var(--primary)', fontWeight: 800, fontSize: '0.85rem' }}>
                                                                <i className="fa-solid fa-circle-check"></i>
                                                                LOAD RECEIVED AT MILL
                                                            </div>
                                                        ) : isQrScanned ? (
                                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.9rem', borderRadius: '2rem', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', fontWeight: 700, fontSize: '0.85rem' }}>
                                                                <i className="fa-solid fa-qrcode"></i>
                                                                QR SCANNED & VERIFIED AT GATE
                                                            </div>
                                                        ) : isInTransit ? (
                                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.9rem', borderRadius: '2rem', background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', fontWeight: 700, fontSize: '0.85rem' }}>
                                                                <i className="fa-solid fa-truck-fast"></i>
                                                                HARVEST IN TRANSIT TO MILL
                                                            </div>
                                                        ) : isTransportAssigned ? (
                                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.9rem', borderRadius: '2rem', background: 'rgba(234, 179, 8, 0.2)', color: '#fbbf24', fontWeight: 700, fontSize: '0.85rem' }}>
                                                                <i className="fa-solid fa-truck"></i>
                                                                DRIVER DISPATCHED • EN ROUTE
                                                            </div>
                                                        ) : isAccepted ? (
                                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.9rem', borderRadius: '2rem', background: 'rgba(245, 158, 11, 0.2)', color: 'var(--accent-gold)', fontWeight: 700, fontSize: '0.85rem' }}>
                                                                <i className="fa-solid fa-qrcode"></i>
                                                                QR READY FOR GATE SCAN
                                                            </div>
                                                        ) : (
                                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.9rem', borderRadius: '2rem', background: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>
                                                                <i className="fa-solid fa-hourglass-half"></i>
                                                                AWAITING MILL ACCEPTANCE
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Stepper Progress View */}
                                                <div style={{ padding: '1rem 0', overflowX: 'auto' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', minWidth: '550px' }}>
                                                        {stages.map((stage, idx) => (
                                                            <React.Fragment key={stage.label}>
                                                                <div style={{ textAlign: 'center', flex: 1 }}>
                                                                    <div style={{
                                                                        width: '34px',
                                                                        height: '34px',
                                                                        borderRadius: '50%',
                                                                        margin: '0 auto 0.4rem',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        background: stage.done ? 'var(--primary)' : 'rgba(255, 255, 255, 0.1)',
                                                                        color: stage.done ? '#000' : 'var(--text-muted)',
                                                                        fontWeight: 800,
                                                                        boxShadow: stage.done ? '0 0 15px var(--primary-glow)' : 'none'
                                                                    }}>
                                                                        {stage.done ? <i className="fa-solid fa-check"></i> : idx + 1}
                                                                    </div>
                                                                    <div style={{ fontSize: '0.75rem', fontWeight: stage.done ? 700 : 400, color: stage.done ? 'var(--text-main)' : 'var(--text-muted)' }}>
                                                                        {stage.label}
                                                                    </div>
                                                                    {stage.time && (
                                                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                                                            {new Date(stage.time).toLocaleDateString('en-IN')}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                {idx < stages.length - 1 && (
                                                                    <div style={{ flex: 1, height: '3px', background: stages[idx + 1].done ? 'var(--primary)' : 'rgba(255, 255, 255, 0.1)', margin: '0 -10px 1.4rem' }}></div>
                                                                )}
                                                            </React.Fragment>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Transporter Details Strip if Transport is Assigned */}
                                                {hasTransport && tr && (
                                                    <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '0.5rem', padding: '0.75rem 1rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem' }}>
                                                        <div style={{ fontSize: '0.85rem' }}>
                                                            <div style={{ fontWeight: 700, color: 'var(--accent-gold)' }}>
                                                                <i className="fa-solid fa-truck-moving"></i> Assigned Transporter: {tr.assigned_provider_name || 'Fleet Driver'}
                                                            </div>
                                                            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.15rem' }}>
                                                                Vehicle: <strong>{tr.vehicle_number || 'TS 09 EA 4421'}</strong> • Status: <strong style={{ color: '#38bdf8' }}>{tr.status.replace(/_/g, ' ')}</strong>
                                                            </div>
                                                        </div>
                                                        {tr.assigned_provider_phone && (
                                                            <a href={`tel:${tr.assigned_provider_phone}`} className="action-btn" style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', textDecoration: 'none', color: 'inherit' }}>
                                                                <i className="fa-solid fa-phone"></i> Call Driver ({tr.assigned_provider_phone})
                                                            </a>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Action Bar */}
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.85rem', flexWrap: 'wrap' }}>
                                                    {isAccepted && (
                                                        <button className="primary-btn" onClick={() => setSelectedEnquiryForQr(enq)} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                                                            <i className="fa-solid fa-qrcode"></i> View QR
                                                        </button>
                                                    )}

                                                    {/* Interactive simulation button for instant testing */}
                                                    {isAccepted && !isReceived && (
                                                        <button 
                                                            className="action-btn"
                                                            onClick={async () => {
                                                                if (window.confirm(`Mark gate receipt of ${enq.crop_name} (${enq.quantity || (enq.acres * 2)} Tons) at ${enq.mill_name}?`)) {
                                                                    await kisanService.acceptLoad(enq.enquiry_code || enq.id, { millName: enq.mill_name, id: enq.mill_id });
                                                                    fetchEnquiriesData();
                                                                }
                                                            }}
                                                            style={{ padding: '0.5rem 0.85rem', fontSize: '0.8rem', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', color: 'var(--primary)' }}
                                                        >
                                                            <i className="fa-solid fa-clipboard-check"></i> Simulate Gate Receipt
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
                    {/* TAB: TRANSPORT */}
                    {/* ======================================================== */}
                    {activeTab === 'transport' && (
                        <div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <h2 style={{ margin: 0, fontSize: '1.6rem' }}>Transport & Haulage Requests 🚛</h2>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
                                    Smart truck capacity matching, incoming transport quotes, and live vehicle tracking
                                </p>
                            </div>

                            {transportRequests.length === 0 ? (
                                <div className="bento-card" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
                                    <i className="fa-solid fa-truck-moving fa-3x" style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}></i>
                                    <h3>No Transport Requests</h3>
                                    <p style={{ color: 'var(--text-muted)' }}>When sending an enquiry, select "Transport Required = YES" to automatically request haulage.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    {transportRequests.map(tr => {
                                        const quotes = kisanService.getQuotesForRequest(tr.transport_code);

                                        return (
                                            <div key={tr.id} className="bento-card" style={{ border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                                                    <div>
                                                        <span style={{ fontFamily: 'monospace', color: 'var(--accent-gold)', fontWeight: 800 }}>{tr.transport_code}</span>
                                                        <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Enquiry: {tr.enquiry_code}</span>
                                                    </div>
                                                    <span className="status-badge" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>{tr.status}</span>
                                                </div>

                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                                                    <div>Cargo: <strong>{tr.crop_name} ({tr.quantity} Tons)</strong></div>
                                                    <div>Required Truck: <strong>{tr.required_capacity} Ton ({tr.vehicle_type || 'Truck'})</strong></div>
                                                    <div>Delivery: <strong>{tr.mill_name}</strong></div>
                                                    <div>Pickup Date: <strong>{tr.pickup_date || 'Flexible'}</strong></div>
                                                </div>

                                                {/* Quotes Section */}
                                                <div>
                                                    <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem' }}>
                                                        Quotes from Suitable Transport Providers ({quotes.length})
                                                    </h4>
                                                    {quotes.length === 0 ? (
                                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Searching for nearby trucks matching your {tr.required_capacity} Ton capacity...</p>
                                                    ) : (
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
                                                            {quotes.map(q => (
                                                                <div key={q.id} style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: '0.75rem', border: `1px solid ${q.status === 'ACCEPTED' ? 'var(--primary)' : 'rgba(255, 255, 255, 0.08)'}` }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                                                                        <strong>{q.provider_name}</strong>
                                                                        <strong style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>₹{q.price?.toLocaleString()}</strong>
                                                                    </div>
                                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                                                                        Vehicle: {q.vehicle_number} ({q.vehicle_capacity}T) • Est: {q.estimated_time}
                                                                    </div>

                                                                    {q.status === 'ACCEPTED' ? (
                                                                        <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.85rem' }}>
                                                                            ✓ Assigned Provider
                                                                        </span>
                                                                    ) : tr.status === 'ASSIGNED' ? (
                                                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Closed</span>
                                                                    ) : (
                                                                        <button 
                                                                            className="primary-btn" 
                                                                            onClick={() => handleAcceptTransportQuote(q.id)}
                                                                            style={{ width: '100%', justifyContent: 'center', padding: '0.5rem', fontSize: '0.8rem' }}
                                                                        >
                                                                            Accept Quote
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
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
                    {/* TAB: MARKET PRICES */}
                    {/* ======================================================== */}
                    {activeTab === 'market' && (
                        <div className="dashboard view-section" style={{ display: 'block' }}>
                            <div className="welcome-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div>
                                    <h1 style={{ margin: 0, fontSize: '1.8rem' }}>Live Mill Rates & Market Benchmark 📈</h1>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
                                        Real-time mill purchase prices compared against APMC Mandi benchmarks. Sell to the highest bidder.
                                    </p>
                                </div>
                                <button className="action-btn" onClick={fetchAllVerifiedMills} style={{ fontSize: '0.85rem', padding: '0.5rem 0.9rem' }}>
                                    <i className="fa-solid fa-rotate-right"></i> Refresh Mill Prices
                                </button>
                            </div>

                            {/* Section 1: Top Paying Mills Leaderboard */}
                            <div style={{ marginBottom: '2rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    <h2 style={{ margin: 0, fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span>🏆 Mill Price Leaderboard (Highest Buying Offers)</span>
                                    </h2>
                                    {farmerCropNames.length > 0 && (
                                        <div style={{ fontSize: '0.8rem', color: 'var(--primary)', background: 'rgba(16, 185, 129, 0.12)', padding: '0.3rem 0.75rem', borderRadius: '1rem', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                                            <i className="fa-solid fa-wheat-awn"></i> Matched to your {farmerCropNames.length} crop{farmerCropNames.length > 1 ? 's' : ''} ({farmerCropNames.join(', ')})
                                        </div>
                                    )}
                                </div>

                                {millOffersByCrop.length === 0 ? (
                                    <div className="bento-card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                                        <i className="fa-solid fa-industry fa-3x" style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}></i>
                                        <h3>No Active Mill Rates</h3>
                                        <p style={{ color: 'var(--text-muted)' }}>Verified mills haven't published rates for these crops yet.</p>
                                    </div>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: '1.25rem' }}>
                                        {millOffersByCrop.flatMap(group => group.offers.map((offer, idx) => {
                                            const isHighest = idx === 0;
                                            return (
                                                <div 
                                                    key={`${offer.mill.id}-${offer.cropName}`} 
                                                    className="bento-card" 
                                                    style={{ 
                                                        border: isHighest ? '1px solid rgba(16, 185, 129, 0.45)' : '1px solid rgba(255, 255, 255, 0.08)',
                                                        boxShadow: isHighest ? '0 10px 25px rgba(16, 185, 129, 0.12)' : 'none',
                                                        display: 'flex',
                                                        flexDirection: 'column'
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                                        <div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                                <span style={{ fontSize: '0.85rem' }}>🌾</span>
                                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{offer.cropName}</span>
                                                            </div>
                                                            <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '1.15rem' }}>{offer.mill.millName}</h3>
                                                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                                                                <i className="fa-solid fa-location-dot"></i> {offer.mill.locationName || 'Location'} • ~{offer.distance.toFixed(1)} km
                                                            </div>
                                                        </div>

                                                        {isHighest ? (
                                                            <span style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#000', fontSize: '0.7rem', padding: '0.2rem 0.55rem', borderRadius: '0.4rem', fontWeight: 800 }}>
                                                                👑 TOP PRICE
                                                            </span>
                                                        ) : (
                                                            <span style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)', fontSize: '0.7rem', padding: '0.2rem 0.55rem', borderRadius: '0.4rem', fontWeight: 600 }}>
                                                                Rank #{idx + 1}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '0.5rem', padding: '0.75rem 1rem', margin: '0.5rem 0 1rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div>
                                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Mill Buying Offer</div>
                                                            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: isHighest ? 'var(--primary)' : 'var(--accent-gold)' }}>
                                                                ₹{offer.price.toLocaleString('en-IN')}
                                                            </div>
                                                        </div>
                                                        <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                            <div>Per Quintal</div>
                                                            <div style={{ color: 'var(--primary)', fontWeight: 600 }}>100 kg</div>
                                                        </div>
                                                    </div>

                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                            Capacity: <strong>{offer.mill.capacity || '500+'} T</strong>
                                                        </div>
                                                        <button
                                                            className="primary-btn"
                                                            onClick={() => {
                                                                setSelectedMillForEnquiry(offer.mill);
                                                                setSelectedCropForSearch(offer.farmerCrop);
                                                            }}
                                                            style={{ 
                                                                padding: '0.45rem 0.85rem', 
                                                                fontSize: '0.8rem',
                                                                background: isHighest ? 'var(--primary)' : 'rgba(255,255,255,0.08)',
                                                                color: isHighest ? '#000' : 'var(--text-main)',
                                                                border: isHighest ? 'none' : '1px solid rgba(255,255,255,0.1)'
                                                            }}
                                                        >
                                                            <i className="fa-solid fa-paper-plane"></i> Send Enquiry
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        }))}
                                    </div>
                                )}
                            </div>

                            {/* Section 2: APMC Mandi Benchmark Rates Table */}
                            <div>
                                <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span>📊 APMC Mandi Benchmark Rates</span>
                                </h2>
                                <div className="bento-card">
                                    <div className="table-responsive">
                                        <table className="orders-table" style={{ width: '100%', textAlign: 'left' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                    <th style={{ padding: '1rem' }}>Commodity</th>
                                                    <th style={{ padding: '1rem' }}>Major Market</th>
                                                    <th style={{ padding: '1rem' }}>Benchmark Price (per Quintal)</th>
                                                    <th style={{ padding: '1rem' }}>Daily Trend</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                    <td style={{ padding: '1rem', fontWeight: 600 }}>Paddy (Rice)</td>
                                                    <td style={{ padding: '1rem' }}>Khammam / Warangal</td>
                                                    <td style={{ padding: '1rem', color: 'var(--primary)', fontWeight: 700 }}>₹2,250</td>
                                                    <td style={{ padding: '1rem' }}><span className="trend up">+2.5%</span></td>
                                                </tr>
                                                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                    <td style={{ padding: '1rem', fontWeight: 600 }}>Maize</td>
                                                    <td style={{ padding: '1rem' }}>Nizamabad</td>
                                                    <td style={{ padding: '1rem', color: 'var(--danger)', fontWeight: 700 }}>₹1,960</td>
                                                    <td style={{ padding: '1rem' }}><span className="trend down">-1.2%</span></td>
                                                </tr>
                                                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                    <td style={{ padding: '1rem', fontWeight: 600 }}>Cotton</td>
                                                    <td style={{ padding: '1rem' }}>Adoni</td>
                                                    <td style={{ padding: '1rem', color: 'var(--primary)', fontWeight: 700 }}>₹7,100</td>
                                                    <td style={{ padding: '1rem' }}><span className="trend up">+0.8%</span></td>
                                                </tr>
                                                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                    <td style={{ padding: '1rem', fontWeight: 600 }}>Red Gram</td>
                                                    <td style={{ padding: '1rem' }}>Tandur</td>
                                                    <td style={{ padding: '1rem', color: 'var(--primary)', fontWeight: 700 }}>₹7,000</td>
                                                    <td style={{ padding: '1rem' }}><span className="trend up">+1.5%</span></td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ======================================================== */}
                    {/* TAB: HISTORY & LEDGER */}
                    {/* ======================================================== */}
                    {activeTab === 'history' && (
                        <div className="history-container">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Harvest & Transaction History 📜</h2>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
                                        Complete chronological audit log of your enquiries, verified gate receipts, and transport trips
                                    </p>
                                </div>
                                <button className="action-btn" onClick={fetchEnquiriesData} style={{ fontSize: '0.85rem' }}>
                                    <i className="fa-solid fa-rotate-right"></i> Refresh Ledger
                                </button>
                            </div>

                            {/* Summary Metric Cards */}
                            <div className="history-summary-grid">
                                <div className="history-stat-card">
                                    <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                                        <i className="fa-solid fa-wheat-awn"></i>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Lifetime Tonnage</div>
                                        <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
                                            {historyList.reduce((acc, h) => acc + (Number(h.quantity) || 0), 0)} Tons
                                        </div>
                                    </div>
                                </div>
                                <div className="history-stat-card">
                                    <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                                        <i className="fa-solid fa-truck-ramp-box"></i>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Verified Loads</div>
                                        <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-gold)' }}>
                                            {historyList.filter(h => h.category === 'LOAD_RECEIVED').length} Delivered
                                        </div>
                                    </div>
                                </div>
                                <div className="history-stat-card">
                                    <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                                        <i className="fa-solid fa-receipt"></i>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Entries</div>
                                        <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
                                            {historyList.length} Logged
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Filter Chips */}
                            <div className="history-filters">
                                {[
                                    { label: 'All History', val: 'ALL' },
                                    { label: 'Loads Received', val: 'LOAD_RECEIVED' },
                                    { label: 'Enquiries', val: 'ENQUIRY' },
                                    { label: 'Transport', val: 'TRANSPORT' }
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

                            {/* History List */}
                            {historyList.filter(h => historyFilter === 'ALL' || h.category === historyFilter).length === 0 ? (
                                <div className="bento-card" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
                                    <i className="fa-solid fa-clock-rotate-left fa-3x" style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}></i>
                                    <h3>No Records Found</h3>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No ledger history found under the "{historyFilter}" filter.</p>
                                </div>
                            ) : (
                                <div className="history-feed">
                                    {historyList
                                        .filter(h => historyFilter === 'ALL' || h.category === historyFilter)
                                        .map(item => (
                                            <div key={item.id} className={`history-card ${item.category === 'LOAD_RECEIVED' ? '' : 'gold-border'}`}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '220px' }}>
                                                    <div style={{
                                                        width: '42px',
                                                        height: '42px',
                                                        borderRadius: '50%',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        background: item.category === 'LOAD_RECEIVED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                                        color: item.category === 'LOAD_RECEIVED' ? 'var(--primary)' : 'var(--accent-gold)'
                                                    }}>
                                                        <i className={`fa-solid ${item.category === 'LOAD_RECEIVED' ? 'fa-circle-check' : item.category === 'TRANSPORT' ? 'fa-truck-moving' : 'fa-file-lines'}`}></i>
                                                    </div>
                                                    <div>
                                                        <div style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--accent-gold)', fontSize: '0.95rem' }}>
                                                            {item.enquiry_code}
                                                        </div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                            {new Date(item.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div style={{ flex: 1, minWidth: '220px' }}>
                                                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                                                        {item.title}
                                                    </div>
                                                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                                        <strong style={{ color: 'var(--primary)' }}>{item.crop_name}</strong> • {item.quantity} Tons {item.acres ? `(${item.acres} Acres)` : ''} • Partner: <strong>{item.partner}</strong>
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem', fontStyle: 'italic' }}>
                                                        {item.details}
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    {item.value && (
                                                        <div style={{ textAlign: 'right' }}>
                                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Value</div>
                                                            <div style={{ fontWeight: 800, color: 'var(--accent-gold)', fontSize: '0.95rem' }}>{item.value}</div>
                                                        </div>
                                                    )}
                                                    <span className={item.category === 'LOAD_RECEIVED' ? 'badge-green' : 'badge-gold'}>
                                                        {item.status}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ======================================================== */}
                    {/* TAB: PROFILE */}
                    {/* ======================================================== */}
                    {activeTab === 'profile' && (
                        <FarmerProfileView 
                            user={{ ...user, name: profileName || user.name, altPhone: profileAltPhone || user.altPhone }}
                            crops={crops}
                            enquiries={enquiries}
                            onProfileUpdated={(updated) => {
                                if (updated.name) setProfileName(updated.name);
                                if (updated.altPhone) setProfileAltPhone(updated.altPhone);
                            }}
                            onLogout={handleLogout}
                        />
                    )}

                </div>

                {/* Mobile Bottom Navigation */}
                <div className="mobile-nav-bar">
                    <button className={`mobile-nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
                        <i className="fa-solid fa-house"></i>
                        <span>Home</span>
                    </button>
                    <button className={`mobile-nav-btn ${activeTab === 'crops' ? 'active' : ''}`} onClick={() => setActiveTab('crops')}>
                        <i className="fa-solid fa-wheat-awn"></i>
                        <span>Crops</span>
                    </button>
                    <button className={`mobile-nav-btn ${activeTab === 'qrcodes' ? 'active' : ''}`} onClick={() => setActiveTab('qrcodes')}>
                        <i className="fa-solid fa-qrcode"></i>
                        <span>QR</span>
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

            {/* MODALS */}
            {isAddCropOpen && <AddCropModal onClose={() => setIsAddCropOpen(false)} onSaveCrop={handleSaveCrop} />}
            
            {selectedMillForEnquiry && (
                <SendEnquiryModal
                    onClose={() => setSelectedMillForEnquiry(null)}
                    mill={selectedMillForEnquiry}
                    crop={selectedCropForSearch}
                    user={user}
                    onEnquiryCreated={() => {
                        fetchEnquiriesData();
                        setActiveTab('enquiries');
                    }}
                />
            )}

            {selectedEnquiryForQr && (
                <QrCodeModal
                    enquiry={selectedEnquiryForQr}
                    onClose={() => setSelectedEnquiryForQr(null)}
                />
            )}
        </div>
    );
}
