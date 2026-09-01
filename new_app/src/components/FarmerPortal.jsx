import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { kisanService } from '../services/kisanService';
import { fetchWeatherByCoords, fetchWeatherByCity, getWeatherIcon } from '../services/weather';
import AddCropModal from './AddCropModal';
import SendEnquiryModal from './SendEnquiryModal';
import QrCodeModal from './QrCodeModal';
import KisanLogo from './KisanLogo';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

export default function FarmerPortal({ user, onLogout }) {
    const [activeTab, setActiveTabState] = useState(() => {
        return localStorage.getItem('kisan_active_tab') || localStorage.getItem('agri_active_tab') || 'dashboard';
    });
    const setActiveTab = (tab) => {
        localStorage.setItem('kisan_active_tab', tab);
        localStorage.setItem('agri_active_tab', tab);
        setActiveTabState(tab);
    };
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isAddCropOpen, setIsAddCropOpen] = useState(false);

    // Profile States
    const [profileName, setProfileName] = useState(user.name || '');
    const [profileAltPhone, setProfileAltPhone] = useState(user.altPhone || '');
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    // Security States
    const [newPhone, setNewPhone] = useState(user.phone || '');
    const [newPin, setNewPin] = useState(user.pin || '');
    const [isUpdatingSecurity, setIsUpdatingSecurity] = useState(false);

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

    // Enquiry, QR, Transport & History States
    const [enquiries, setEnquiries] = useState([]);
    const [transportRequests, setTransportRequests] = useState([]);
    const [selectedEnquiryForQr, setSelectedEnquiryForQr] = useState(null);
    const [loadingEnquiries, setLoadingEnquiries] = useState(false);
    const [historyList, setHistoryList] = useState([]);
    const [historyFilter, setHistoryFilter] = useState('ALL');

    // Orders State (legacy compatibility)
    const [orders, setOrders] = useState([]);
    const [expandedMapOrderId, setExpandedMapOrderId] = useState(null);

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

                // Set initial weather location to latest crop
                const lastCrop = mappedCrops[mappedCrops.length - 1];
                setSelectedWeatherLocation(lastCrop);
            } else {
                setCrops([]);
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

    const fetchOrders = async () => {
        try {
            const { data: list, error } = await supabase
                .from('enquiries')
                .select('*')
                .eq('farmer_phone', user.phone)
                .eq('status', 'accepted');

            if (error) throw error;

            const mappedOrders = (list || []).map(o => ({
                id: o.id,
                millId: o.mill_id,
                buyerPhone: o.buyer_phone,
                buyerName: o.buyer_name,
                farmerPhone: o.farmer_phone,
                farmerName: o.farmer_name,
                cropName: o.crop_name,
                quantity: o.quantity,
                status: o.status,
                pricePerQuintal: o.price_per_quintal,
                totalPrice: o.total_price,
                cropId: o.crop_id,
                createdAt: o.created_at,
                updatedAt: o.updated_at
            })).sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));

            setOrders(mappedOrders);
        } catch (error) {
            console.error("Error fetching orders:", error);
        }
    };

    useEffect(() => {
        fetchCrops();
        fetchOrders();
        fetchEnquiriesData();

        const unsub = kisanService.subscribe(() => {
            fetchEnquiriesData();
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

    const handleUpdateProfile = async () => {
        setIsSavingProfile(true);
        try {
            const { error } = await supabase
                .from(`${user.role}s`)
                .update({ name: profileName, altPhone: profileAltPhone })
                .eq('phone', user.phone);

            if (error) throw error;
            alert('Profile updated successfully!');
        } catch (error) {
            console.error(error);
            alert('Failed to update profile');
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleUpdateSecurity = async () => {
        if (newPhone.length !== 10 || isNaN(newPhone)) {
            return alert("Phone number must be exactly 10 digits.");
        }
        if (newPin.length < 4 || isNaN(newPin)) {
            return alert("PIN must be 4 to 6 digits.");
        }

        setIsUpdatingSecurity(true);
        try {
            const { error } = await supabase
                .from(`${user.role}s`)
                .update({ phone: newPhone, pin: newPin })
                .eq('phone', user.phone);

            if (error) throw error;
            alert("Security credentials updated! Please log in with your new phone.");
            onLogout();
        } catch (error) {
            console.error(error);
            alert("Error updating security settings");
        } finally {
            setIsUpdatingSecurity(false);
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

    // Filter accepted enquiries with QR codes available
    const acceptedEnquiries = enquiries.filter(e => e.status === 'ACCEPTED' || e.status === 'LOAD_RECEIVED');

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
                            <span className="badge" style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '0.1rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem' }}>
                                {enquiries.length}
                            </span>
                        )}
                    </a>
                    <a className={`nav-item ${activeTab === 'qrcodes' ? 'active' : ''}`} onClick={() => { setActiveTab('qrcodes'); setIsSidebarOpen(false); }}>
                        <i className="fa-solid fa-qrcode" style={{ color: 'var(--primary)' }}></i>
                        <span style={{ color: 'var(--primary)', fontWeight: 700 }}>My QR Codes</span>
                        {acceptedEnquiries.length > 0 && (
                            <span className="badge" style={{ marginLeft: 'auto', background: 'var(--primary)', color: '#000', padding: '0.1rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 800 }}>
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
                    <a className="nav-item logout" onClick={onLogout}>
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
                        <button className="action-btn back-btn" onClick={onLogout}>
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

                        <div className="user-profile">
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

                                <div className="bento-card market-prices">
                                    <div className="card-header">
                                        <h3>Live Market Rates</h3>
                                        <button className="text-btn" onClick={() => setActiveTab('market')}>View All</button>
                                    </div>
                                    <div className="prices-list" style={{ marginTop: '1rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.8rem 0', borderBottom: '1px solid var(--border-color)' }}>
                                            <span>Paddy (Rice)</span>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontWeight: 600 }}>₹2,250</div>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>+2.5%</span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.8rem 0', borderBottom: '1px solid var(--border-color)' }}>
                                            <span>Maize</span>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontWeight: 600 }}>₹1,960</div>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>-1.2%</span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.8rem 0' }}>
                                            <span>Cotton</span>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontWeight: 600 }}>₹7,100</div>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>+0.8%</span>
                                            </div>
                                        </div>
                                    </div>
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
                                    {enquiries.map(enq => (
                                        <div key={enq.id} className="bento-card" style={{ border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                                                <span style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--accent-gold)' }}>
                                                    {enq.enquiry_code}
                                                </span>
                                                <span className="status-badge" style={{
                                                    background: enq.status === 'ACCEPTED' ? 'rgba(16, 185, 129, 0.15)' : enq.status === 'LOAD_RECEIVED' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                                                    color: enq.status === 'ACCEPTED' ? 'var(--primary)' : enq.status === 'LOAD_RECEIVED' ? '#38bdf8' : '#fbbf24'
                                                }}>
                                                    {enq.status}
                                                </span>
                                            </div>

                                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
                                                <div>Mill: <strong>{enq.mill_name}</strong></div>
                                                <div>Crop: <strong style={{ color: 'var(--primary)' }}>{enq.crop_name}</strong></div>
                                                <div>Quantity: <strong>{enq.quantity || (enq.acres * 2)} Tons ({enq.acres} Acres)</strong></div>
                                                <div>Expected Price: <strong>₹{enq.expected_price || 'Market'}</strong></div>
                                                <div>Transport: <span>{enq.transport_required ? '✓ Requested' : 'Self Arranged'}</span></div>
                                                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Sent: {new Date(enq.created_at).toLocaleDateString('en-IN')}</div>
                                            </div>

                                            <div style={{ marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                                                {enq.status === 'ACCEPTED' || enq.status === 'LOAD_RECEIVED' ? (
                                                    <button 
                                                        className="primary-btn" 
                                                        onClick={() => setSelectedEnquiryForQr(enq)}
                                                        style={{ width: '100%', justifyContent: 'center', padding: '0.65rem' }}
                                                    >
                                                        <i className="fa-solid fa-qrcode"></i>
                                                        View Verification QR
                                                    </button>
                                                ) : (
                                                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                                        <i className="fa-solid fa-clock"></i> Awaiting Mill Decision
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
                            <div style={{ marginBottom: '1.5rem' }}>
                                <h2 style={{ margin: 0, fontSize: '1.6rem' }}>Load Status & Traceability 📈</h2>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
                                    Full end-to-end audit lifecycle from initial farmer enquiry to gate verification and mill receipt
                                </p>
                            </div>

                            {enquiries.length === 0 ? (
                                <div className="bento-card" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
                                    <p style={{ color: 'var(--text-muted)' }}>No loads initiated yet. Send an enquiry to a mill to start.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    {enquiries.map(enq => {
                                        // Lifecycle stages:
                                        // 1. PENDING (Enquiry Sent)
                                        // 2. ACCEPTED (Mill Accepted)
                                        // 3. QR_GENERATED (QR Generated)
                                        // 4. QR_SCANNED (QR Scanned & Verified)
                                        // 5. LOAD_RECEIVED (Load Received at Mill)
                                        const isPending = enq.status === 'PENDING';
                                        const isAccepted = enq.status === 'ACCEPTED' || enq.status === 'LOAD_RECEIVED';
                                        const isQrReady = isAccepted;
                                        const isReceived = enq.status === 'LOAD_RECEIVED' || enq.load_status === 'LOAD_RECEIVED';

                                        const stages = [
                                            { label: 'Enquiry Sent', done: true, time: enq.created_at },
                                            { label: 'Mill Accepted', done: isAccepted, time: enq.accepted_at },
                                            { label: 'QR Generated', done: isQrReady, time: enq.accepted_at },
                                            { label: 'QR Scanned', done: isReceived, time: enq.received_at },
                                            { label: 'Load Received', done: isReceived, time: enq.received_at }
                                        ];

                                        return (
                                            <div key={enq.id} className="bento-card" style={{ border: `1px solid ${isReceived ? 'var(--primary)' : 'rgba(255,255,255,0.1)'}` }}>
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

                                                {/* Action Bar */}
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
                                                    {isAccepted && (
                                                        <button className="primary-btn" onClick={() => setSelectedEnquiryForQr(enq)} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                                                            <i className="fa-solid fa-qrcode"></i> View QR
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
                            <div className="welcome-section">
                                <div>
                                    <h1>Live Market Prices 📈</h1>
                                    <p>Stay updated with the latest crop prices in major markets.</p>
                                </div>
                            </div>
                            <div className="bento-card">
                                <div className="table-responsive">
                                    <table className="orders-table" style={{ width: '100%', textAlign: 'left' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                <th style={{ padding: '1rem' }}>Commodity</th>
                                                <th style={{ padding: '1rem' }}>Market</th>
                                                <th style={{ padding: '1rem' }}>Price (per Quintal)</th>
                                                <th style={{ padding: '1rem' }}>Trend</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                <td style={{ padding: '1rem', fontWeight: 600 }}>Paddy (Rice)</td>
                                                <td style={{ padding: '1rem' }}>Warangal</td>
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
                                        </tbody>
                                    </table>
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
                        <div className="bento-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
                            <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                                Farmer Profile Settings
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Full Name</label>
                                    <input 
                                        type="text" 
                                        value={profileName} 
                                        onChange={e => setProfileName(e.target.value)}
                                        style={{ width: '100%', padding: '0.75rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'inherit' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Alternate Phone</label>
                                    <input 
                                        type="tel" 
                                        value={profileAltPhone} 
                                        onChange={e => setProfileAltPhone(e.target.value)}
                                        style={{ width: '100%', padding: '0.75rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'inherit' }}
                                    />
                                </div>
                                <button className="primary-btn" onClick={handleUpdateProfile} disabled={isSavingProfile} style={{ justifyContent: 'center' }}>
                                    {isSavingProfile ? 'Saving...' : 'Save Profile Changes'}
                                </button>

                                <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
                                    <h4 style={{ margin: '0 0 1rem 0' }}>Security PIN</h4>
                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                        <input 
                                            type="password"
                                            value={newPin}
                                            onChange={e => setNewPin(e.target.value)}
                                            placeholder="Enter new 4-6 digit PIN"
                                            maxLength="6"
                                            style={{ flex: 1, padding: '0.75rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'inherit' }}
                                        />
                                        <button className="primary-btn" onClick={handleUpdateSecurity} disabled={isUpdatingSecurity}>
                                            Update PIN
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

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
                    onEnquiryCreated={(newEnquiry) => {
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
