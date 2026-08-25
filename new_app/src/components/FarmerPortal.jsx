import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc, getDoc, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import { fetchWeatherByCoords, fetchWeatherByCity, getWeatherIcon } from '../services/weather';
import AddCropModal from './AddCropModal';
import SendEnquiryModal from './SendEnquiryModal';
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
    const [activeTab, setActiveTab] = useState('dashboard');
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

    // Orders State
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
            // fallback
            fetchWeatherByCity('Hyderabad').then(wData => {
                if (wData) setWeather(wData);
            });
        }
    }, [selectedWeatherLocation]);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchCrops = async () => {
        setLoadingCrops(true);
        try {
            const cropsRef = collection(db, `${user.role}s/${user.phone}/crops`);
            const snap = await getDocs(cropsRef);
            if (!snap.empty) {
                const fetchedCrops = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setCrops(fetchedCrops);

                // Set initial weather location to latest crop
                const lastCrop = fetchedCrops[fetchedCrops.length - 1];
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

    useEffect(() => {
        fetchCrops();
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const q = query(collection(db, 'enquiries'), where('farmerPhone', '==', user.phone), where('status', '==', 'accepted'));
            const snap = await getDocs(q);
            const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => (b.updatedAt?.toMillis() || 0) - (a.updatedAt?.toMillis() || 0));
            setOrders(list);
        } catch (error) {
            console.error("Error fetching orders:", error);
        }
    };

    const handleSaveCrop = async (cropData) => {
        try {
            const cropId = `crop_${Date.now()}`;
            const cropRef = doc(db, `${user.role}s/${user.phone}/crops/${cropId}`);
            const dataToSave = { ...cropData, addedAt: new Date() };
            await setDoc(cropRef, dataToSave);

            setCrops(prev => [...prev, { id: cropId, ...dataToSave }]);

            // Update weather dropdown selection to the new crop
            setSelectedWeatherLocation(dataToSave);

            alert(`Successfully saved crop: ${cropData.cropName} at ${cropData.locationName}`);
        } catch (error) {
            console.error(error);
            alert('Failed to save crop');
        }
    };

    const handleDeleteCrop = async (id) => {
        if (!window.confirm("Are you sure you want to delete this crop?")) return;
        try {
            await deleteDoc(doc(db, `${user.role}s/${user.phone}/crops/${id}`));
            setCrops(prev => prev.filter(c => c.id !== id));
        } catch (error) {
            console.error(error);
            alert("Error deleting crop");
        }
    };

    const handleUpdateProfile = async () => {
        setIsSavingProfile(true);
        try {
            const userRef = doc(db, `${user.role}s`, user.phone);
            await setDoc(userRef, { name: profileName, altPhone: profileAltPhone }, { merge: true });
            alert('Profile updated successfully!');
            // Update local user state if needed, though typically one relies on the portal reloading or lifting state up
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

        setIsUpdatingSecurity(true);
        try {
            const oldRef = doc(db, `${user.role}s`, user.phone);
            const isPhoneChanged = newPhone !== user.phone;

            if (isPhoneChanged) {
                const newRef = doc(db, `${user.role}s`, newPhone);
                // Check if new phone already exists
                const newSnap = await getDoc(newRef);
                if (newSnap.exists()) {
                    setIsUpdatingSecurity(false);
                    return alert("This new phone number is already registered.");
                }

                // Create new user doc
                const newUserData = {
                    ...user,
                    phone: newPhone,
                    pin: newPin,
                    name: profileName,
                    altPhone: profileAltPhone
                };
                await setDoc(newRef, newUserData);

                // Migrate crops
                const cropsRef = collection(db, `${user.role}s/${user.phone}/crops`);
                const snap = await getDocs(cropsRef);
                for (const cropDoc of snap.docs) {
                    await setDoc(doc(db, `${user.role}s/${newPhone}/crops/${cropDoc.id}`), cropDoc.data());
                    await deleteDoc(doc(db, `${user.role}s/${user.phone}/crops/${cropDoc.id}`));
                }

                // Delete old user doc
                await deleteDoc(oldRef);

                alert("Phone number changed successfully! Please log in again with your new credentials.");
                onLogout(); // Force logout so they login with new phone
            } else {
                // Just updating PIN
                await setDoc(oldRef, { pin: newPin }, { merge: true });
                alert("PIN updated successfully!");
                user.pin = newPin; // update local ref
            }
        } catch (error) {
            console.error(error);
            alert("Error updating security settings.");
        } finally {
            setIsUpdatingSecurity(false);
        }
    };

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Radius of the earth in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in km
    };

    const handleSearchMills = async (crop) => {
        setSelectedCropForSearch(crop);
        setIsSearchingMills(true);
        try {
            // Find all verified mills that buy this crop
            const q = query(collection(db, 'mills'), where('status', '==', 'verified'), where('selectedCrops', 'array-contains', crop.cropName));
            const snap = await getDocs(q);
            const allMills = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Calculate distance for each and sort
            const withDistance = allMills.map(mill => ({
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

    // Calculate dynamic values
    const cropCountText = crops.length > 1 ? `${crops.length} Lots` : crops.length === 1 ? crops[0].cropName : '0 Lots';
    const cropLocationText = crops.length > 1 ? `${crops[crops.length - 1].cropName} & more` : crops.length === 1 ? crops[0].locationName : 'Add crops to track';
    const locationStatusClass = crops.length > 0 ? 'trend up' : 'trend neutral';

    return (
        <div className="app-container" style={{ display: 'flex' }}>
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="logo">
                    <i className="fa-solid fa-leaf"></i>
                    <span>AgriConnect</span>
                </div>
                <nav className="nav-menu">
                    <a className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
                        <i className="fa-solid fa-house"></i>
                        <span>Dashboard</span>
                    </a>
                    <a className={`nav-item ${activeTab === 'crops' ? 'active' : ''}`} onClick={() => setActiveTab('crops')}>
                        <i className="fa-solid fa-seedling"></i>
                        <span>My Crops</span>
                    </a>
                    <a className={`nav-item ${activeTab === 'market' ? 'active' : ''}`} onClick={() => setActiveTab('market')}>
                        <i className="fa-solid fa-chart-line"></i>
                        <span>Market Prices</span>
                    </a>
                    <a className={`nav-item ${activeTab === 'mills' ? 'active' : ''}`} onClick={() => setActiveTab('mills')}>
                        <i className="fa-solid fa-industry"></i>
                        <span>Mills Near Me</span>
                    </a>
                    <a className={`nav-item ${activeTab === 'logistics' ? 'active' : ''}`} onClick={() => setActiveTab('logistics')}>
                        <i className="fa-solid fa-truck-fast"></i>
                        <span>Logistics</span>
                    </a>
                    <a className={`nav-item ${activeTab === 'finances' ? 'active' : ''}`} onClick={() => setActiveTab('finances')}>
                        <i className="fa-solid fa-file-invoice-dollar"></i>
                        <span>Finances</span>
                    </a>
                    <a className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
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
                        <button className="action-btn back-btn" onClick={onLogout}>
                            <i className="fa-solid fa-arrow-left"></i>
                        </button>
                        <div className="search-bar">
                            <i className="fa-solid fa-search"></i>
                            <input type="text" placeholder="Search crops, prices, alerts..." />
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
                                <i className="fa-solid fa-user"></i>
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
                                <h1>Good Day, {profileName || 'Farmer'}! 🌤️</h1>
                                <p>Here's what's happening on your farm today.</p>
                            </div>
                            <button className="primary-btn" onClick={() => setIsAddCropOpen(true)}>
                                <i className="fa-solid fa-plus"></i> Add New Crop
                            </button>
                        </div>

                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-icon revenue"><i className="fa-solid fa-wallet"></i></div>
                                <div className="stat-details">
                                    <h3>Total Revenue</h3>
                                    <h2>₹0</h2>
                                    <span className="trend neutral">No data yet</span>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon crops"><i className="fa-solid fa-wheat-awn"></i></div>
                                <div className="stat-details">
                                    <h3>Active Crops</h3>
                                    <h2>{cropCountText}</h2>
                                    <span className={locationStatusClass}>{cropLocationText}</span>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon orders"><i className="fa-solid fa-box-open"></i></div>
                                <div className="stat-details">
                                    <h3>Active Orders</h3>
                                    <h2>{orders.length} Orders</h2>
                                    <span className={orders.length > 0 ? "trend up" : "trend neutral"}>
                                        {orders.length > 0 ? "Crops purchased!" : "No recent orders"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bento-grid">
                            {/* Weather Forecast */}
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
                                <div className="weather-details">
                                    <div className="w-detail">
                                        <span>Humidity</span>
                                        <strong>{weather ? `${weather.main.humidity}%` : '--'}</strong>
                                    </div>
                                    <div className="w-detail">
                                        <span>Wind</span>
                                        <strong>{weather ? `${Math.round(weather.wind.speed)} km/h` : '--'}</strong>
                                    </div>
                                </div>
                                {weather?.forecast && (
                                    <div className="forecast" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                                        {weather.forecast.map((day, idx) => (
                                            <div className="f-day" key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                                                <span style={{ color: 'var(--text-muted)' }}>{day.dayName}</span>
                                                <i className={`fa-solid ${getWeatherIcon(day.weathercode)}`} style={{ color: 'var(--text)', fontSize: '1.2rem' }}></i>
                                                <span style={{ fontWeight: 600 }}>{day.tempMax}°</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Market Prices Widget */}
                            <div className="bento-card market-prices">
                                <div className="card-header">
                                    <h3>Live Market Prices</h3>
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

                            {/* Upcoming Tasks Widget */}
                            <div className="bento-card upcoming-tasks">
                                <div className="card-header">
                                    <h3>Upcoming Tasks</h3>
                                    <button className="text-btn">Manage</button>
                                </div>
                                <div className="tasks-list" style={{ marginTop: '1rem' }}>
                                    {orders.length > 0 && orders.map((order, idx) => (
                                        <div key={`order-${idx}`} style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem', background: 'rgba(0,255,136,0.1)', padding: '0.8rem', borderRadius: '0.5rem' }}>
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)' }}></div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--success)' }}>Order Purchased!</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>{order.millName} purchased your {order.cropName}</div>
                                            </div>
                                        </div>
                                    ))}
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)' }}></div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '0.95rem', fontWeight: 500 }}>Harvest paddy from Plot B</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Due in 2 days</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ffb300' }}></div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '0.95rem', fontWeight: 500 }}>Fertilizer application (Maize)</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Scheduled for tomorrow</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--text-muted)' }}></div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '0.95rem', fontWeight: 500 }}>Check market prices for Cotton</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Weekly review</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'crops' && (
                    <div className="dashboard view-section" style={{ display: 'block' }}>
                        <div className="welcome-section">
                            <div>
                                <h1>My Crops 🌱</h1>
                                <p>Manage all your active crops and locations here.</p>
                            </div>
                        </div>
                        <div className="bento-grid">
                            <div className="bento-card" style={{ gridColumn: 'span 12' }}>
                                <div className="card-header">
                                    <h3>Active Crops List</h3>
                                </div>
                                <div className="table-responsive">
                                    <table className="orders-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Crop Name</th>
                                                <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Location</th>
                                                <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Acres</th>
                                                <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Date Added</th>
                                                <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {loadingCrops ? (
                                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem 0' }}>Loading...</td></tr>
                                            ) : crops.length === 0 ? (
                                                <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>You have no active crops. Click "Add New Crop" from the dashboard to get started.</td></tr>
                                            ) : crops.map(c => (
                                                <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                    <td style={{ padding: '1rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(0,255,136,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                                                                <i className="fa-solid fa-leaf"></i>
                                                            </div>
                                                            <span style={{ fontWeight: 500 }}>{c.cropName}</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '1rem', color: 'var(--text-muted)' }}><i className="fa-solid fa-location-dot" style={{ color: 'var(--primary)' }}></i> {c.locationName}</td>
                                                    <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{c.acres} Acres</td>
                                                    <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{c.addedAt?.toDate ? c.addedAt.toDate().toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN')}</td>
                                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
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
                    </div>
                )}

                {activeTab === 'market' && (
                    <div className="dashboard view-section" style={{ display: 'block' }}>
                        <div className="welcome-section">
                            <div>
                                <h1>Live Market Prices 📈</h1>
                                <p>Stay updated with the latest crop prices in major markets.</p>
                            </div>
                        </div>
                        <div className="bento-grid">
                            <div className="bento-card" style={{ gridColumn: 'span 12' }}>
                                <div className="card-header">
                                    <h3>Agricultural Commodity Prices</h3>
                                    <div className="search-bar" style={{ maxWidth: '300px' }}>
                                        <i className="fa-solid fa-filter"></i>
                                        <input type="text" placeholder="Filter by crop..." />
                                    </div>
                                </div>
                                <div className="table-responsive">
                                    <table className="orders-table" style={{ width: '100%', textAlign: 'left' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                <th style={{ padding: '1rem' }}>Commodity</th>
                                                <th style={{ padding: '1rem' }}>Market</th>
                                                <th style={{ padding: '1rem' }}>Price (per Quintal)</th>
                                                <th style={{ padding: '1rem' }}>Trend</th>
                                                <th style={{ padding: '1rem' }}>Last Updated</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                <td style={{ padding: '1rem' }}>Paddy (Rice)</td>
                                                <td style={{ padding: '1rem' }}>Warangal</td>
                                                <td style={{ padding: '1rem' }}>₹2,250</td>
                                                <td style={{ padding: '1rem' }}><span className="trend up"><i className="fa-solid fa-arrow-trend-up"></i> +2.5%</span></td>
                                                <td style={{ padding: '1rem' }}>10 mins ago</td>
                                            </tr>
                                            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                <td style={{ padding: '1rem' }}>Maize</td>
                                                <td style={{ padding: '1rem' }}>Nizamabad</td>
                                                <td style={{ padding: '1rem' }}>₹1,960</td>
                                                <td style={{ padding: '1rem' }}><span className="trend down"><i className="fa-solid fa-arrow-trend-down"></i> -1.2%</span></td>
                                                <td style={{ padding: '1rem' }}>25 mins ago</td>
                                            </tr>
                                            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                <td style={{ padding: '1rem' }}>Cotton</td>
                                                <td style={{ padding: '1rem' }}>Adoni</td>
                                                <td style={{ padding: '1rem' }}>₹7,100</td>
                                                <td style={{ padding: '1rem' }}><span className="trend up"><i className="fa-solid fa-arrow-trend-up"></i> +0.8%</span></td>
                                                <td style={{ padding: '1rem' }}>1 hour ago</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'mills' && (
                    <div className="dashboard view-section" style={{ display: 'block' }}>
                        <div className="welcome-section">
                            <div>
                                <h1>Mills Near Me 🏭</h1>
                                <p>Select your crop to find verified mills for direct selling.</p>
                            </div>
                        </div>

                        <div className="bento-grid">
                            <div className="bento-card" style={{ gridColumn: 'span 12' }}>
                                <div className="card-header">
                                    <h3>Select Your Crop to Search</h3>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                                    {crops.map(c => (
                                        <button
                                            key={c.id}
                                            className={`primary-btn ${selectedCropForSearch?.id === c.id ? '' : 'text-btn'}`}
                                            style={{
                                                background: selectedCropForSearch?.id === c.id ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                                color: selectedCropForSearch?.id === c.id ? '#000' : 'var(--text-main)',
                                                textTransform: 'none',
                                                border: selectedCropForSearch?.id === c.id ? 'none' : '1px solid var(--border-color)'
                                            }}
                                            onClick={() => handleSearchMills(c)}
                                        >
                                            <i className="fa-solid fa-wheat-awn"></i> {c.cropName} ({c.locationName})
                                        </button>
                                    ))}
                                    {crops.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No crops added yet. Please add a crop first.</p>}
                                </div>
                            </div>

                            {selectedCropForSearch && (
                                <div className="bento-card" style={{ gridColumn: 'span 12', animation: 'fadeIn 0.5s ease-out' }}>
                                    <div className="card-header">
                                        <h3>Verified Mills buying {selectedCropForSearch.cropName}</h3>
                                        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Ordered by distance from your plot</span>
                                    </div>
                                    <div className="mills-list" style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                                        {isSearchingMills ? (
                                            <div style={{ padding: '2rem', textAlign: 'center', gridColumn: '1/-1' }}>Searching for nearby mills...</div>
                                        ) : nearbyMills.length === 0 ? (
                                            <div style={{ padding: '2rem', textAlign: 'center', gridColumn: '1/-1', color: 'var(--text-dim)' }}>
                                                <i className="fa-solid fa-circle-info" style={{ fontSize: '2.5rem', marginBottom: '1rem', opacity: 0.3 }}></i>
                                                <p>No verified mills found currently buying {selectedCropForSearch.cropName}.</p>
                                            </div>
                                        ) : nearbyMills.map(mill => (
                                            <div key={mill.id} className="stat-card" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '2rem', gap: '1rem', borderRadius: '2.5rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-start' }}>
                                                    <div className="stat-icon" style={{ background: 'var(--bg-deep)', color: 'var(--primary)', width: '60px', height: '60px' }}><i className="fa-solid fa-industry"></i></div>
                                                    <span style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem', background: 'rgba(0,255,138,0.15)', color: 'var(--primary)', borderRadius: '2rem', fontWeight: 800, letterSpacing: '1px' }}>VERIFIED</span>
                                                </div>
                                                <div className="stat-details" style={{ width: '100%' }}>
                                                    <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '0.4rem' }}>{mill.millName}</h3>
                                                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                                                        <i className="fa-solid fa-location-dot" style={{ color: 'var(--primary)' }}></i> {mill.locationName}
                                                        <span style={{ marginLeft: 'auto', fontWeight: 700, color: 'var(--primary-light)' }}>{mill.distance.toFixed(1)} km</span>
                                                    </div>

                                                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.25rem', borderRadius: '1.5rem', marginBottom: '1.5rem' }}>
                                                        {mill.cropPrices?.[selectedCropForSearch.cropName] && (
                                                            <div style={{ fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed rgba(255,255,255,0.1)', paddingBottom: '0.6rem' }}>
                                                                <span style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Offering Price:</span>
                                                                <span style={{ color: 'var(--success)', fontWeight: 800 }}>₹{mill.cropPrices[selectedCropForSearch.cropName]} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)' }}>/ Quintal</span></span>
                                                            </div>
                                                        )}
                                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                                                            Capacity: <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{mill.capacity} TPD</span>
                                                        </div>
                                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', display: 'flex', justifyContent: 'space-between' }}>
                                                            Cold Storage: <span style={{ color: mill.hasColdStorage ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>{mill.hasColdStorage ? 'YES' : 'NO'}</span>
                                                        </div>
                                                    </div>

                                                    <button
                                                        className="primary-btn"
                                                        style={{ width: '100%', padding: '0.8rem' }}
                                                        onClick={() => setSelectedMillForEnquiry(mill)}
                                                    >
                                                        <i className="fa-solid fa-message"></i> Send Inquiry
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'logistics' && (
                    <div className="dashboard view-section" style={{ display: 'block' }}>
                        <div className="welcome-section">
                            <div>
                                <h1>Logistics & Transport 🚛</h1>
                                <p>Book and track transportation for your harvest.</p>
                            </div>
                            <button className="primary-btn">
                                <i className="fa-solid fa-truck"></i> Book a Truck
                            </button>
                        </div>
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-icon orders"><i className="fa-solid fa-clock-rotate-left"></i></div>
                                <div className="stat-details">
                                    <h3>Pending Deliveries</h3>
                                    <h2>{orders.filter(o => o.withTransport).length}</h2>
                                    <span className="trend neutral">To be delivered</span>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon revenue"><i className="fa-solid fa-route"></i></div>
                                <div className="stat-details">
                                    <h3>Self-Managed Shipments</h3>
                                    <h2>{orders.filter(o => !o.withTransport).length}</h2>
                                    <span className="trend neutral">Buyer arranged prep</span>
                                </div>
                            </div>
                        </div>
                        <div className="bento-grid">
                            {orders.length === 0 ? (
                                <div className="bento-card" style={{ gridColumn: 'span 12', textAlign: 'center', padding: '4rem 0' }}>
                                    <i className="fa-solid fa-truck-moving" style={{ fontSize: '3rem', color: 'var(--primary)', marginBottom: '1.5rem', opacity: 0.5 }}></i>
                                    <h3>No Logistics Records</h3>
                                    <p style={{ color: 'var(--text-muted)' }}>You haven't booked any transport or received accepted orders yet.</p>
                                </div>
                            ) : (
                                orders.map(order => (
                                    <div key={order.id} className="bento-card" style={{ gridColumn: 'span 12', marginBottom: '1.5rem' }}>
                                        <div className="card-header" style={{ marginBottom: '1rem' }}>
                                            <div>
                                                <h3>Delivery to {order.millName}</h3>
                                                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{order.cropName} • {order.acres} Acres • {order.distance?.toFixed(1) || 0} km</p>
                                            </div>
                                            <div>
                                                {order.withTransport ? (
                                                    <span style={{ background: 'rgba(0, 255, 136, 0.1)', color: 'var(--primary)', padding: '0.4rem 0.8rem', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 600 }}>
                                                        <i className="fa-solid fa-truck"></i> Transport Required
                                                    </span>
                                                ) : (
                                                    <span style={{ background: 'rgba(255, 179, 0, 0.1)', color: '#ffb300', padding: '0.4rem 0.8rem', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 600 }}>
                                                        <i className="fa-solid fa-warehouse"></i> Buyer Arranged Transport
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {order.farmerLat && order.millLat && (
                                            <div style={{ marginTop: '1.5rem' }}>
                                                {expandedMapOrderId === order.id ? (
                                                    <div style={{ position: 'relative' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                                            <h4 style={{ margin: 0 }}><i className="fa-solid fa-map-location-dot" style={{ color: 'var(--primary)', marginRight: '0.5rem' }}></i> Map & Directions</h4>
                                                            <button
                                                                className="text-btn"
                                                                style={{ color: 'var(--danger)', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                                                                onClick={() => setExpandedMapOrderId(null)}
                                                            >
                                                                <i className="fa-solid fa-xmark"></i> Close Map
                                                            </button>
                                                        </div>
                                                        <div style={{ height: '350px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                                                            <MapContainer
                                                                bounds={[[order.farmerLat, order.farmerLng], [order.millLat, order.millLng]]}
                                                                style={{ height: '100%', width: '100%' }}
                                                                scrollWheelZoom={false}
                                                            >
                                                                <TileLayer
                                                                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                                                                />
                                                                <Marker position={[order.farmerLat, order.farmerLng]}>
                                                                    <Popup><strong>{order.farmerLocationName}</strong><br />Your Crop Location</Popup>
                                                                </Marker>
                                                                <Marker position={[order.millLat, order.millLng]}>
                                                                    <Popup><strong>{order.millLocationName}</strong><br />{order.millName} Location</Popup>
                                                                </Marker>
                                                                <Polyline
                                                                    positions={[[order.farmerLat, order.farmerLng], [order.millLat, order.millLng]]}
                                                                    color="var(--primary)"
                                                                    dashArray="5, 10"
                                                                    weight={3}
                                                                />
                                                            </MapContainer>
                                                        </div>
                                                        <a
                                                            className="primary-btn"
                                                            style={{ display: 'inline-flex', marginTop: '1rem', width: '100%', justifyContent: 'center', padding: '1rem', textDecoration: 'none' }}
                                                            href={`https://www.google.com/maps/dir/?api=1&origin=${order.farmerLat},${order.farmerLng}&destination=${order.millLat},${order.millLng}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                        >
                                                            <i className="fa-solid fa-location-arrow"></i> Get Turn-by-Turn GPS Directions
                                                        </a>
                                                    </div>
                                                ) : (
                                                    <button
                                                        className="primary-btn"
                                                        style={{ width: '100%', padding: '1rem', background: 'transparent', color: 'var(--primary)', border: '1px solid var(--primary)' }}
                                                        onClick={() => setExpandedMapOrderId(order.id)}
                                                    >
                                                        <i className="fa-solid fa-map-location-dot"></i> View Map & Directions
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'finances' && (
                    <div className="dashboard view-section" style={{ display: 'block' }}>
                        <div className="welcome-section">
                            <div>
                                <h1>Financial Overview 💰</h1>
                                <p>Track your earnings, expenses, and loan applications.</p>
                            </div>
                        </div>
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-icon revenue"><i className="fa-solid fa-money-bill-trend-up"></i></div>
                                <div className="stat-details">
                                    <h3>Total Earnings</h3>
                                    <h2>₹0.00</h2>
                                    <span className="trend neutral">Update bank details</span>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon alerts"><i className="fa-solid fa-hand-holding-dollar"></i></div>
                                <div className="stat-details">
                                    <h3>Pending Payments</h3>
                                    <h2>₹0.00</h2>
                                    <span className="trend neutral">No pending claims</span>
                                </div>
                            </div>
                        </div>
                        <div className="bento-grid">
                            <div className="bento-card" style={{ gridColumn: 'span 12', padding: '2rem' }}>
                                <div className="card-header">
                                    <h3>Payment History</h3>
                                </div>
                                <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
                                    <i className="fa-solid fa-file-invoice" style={{ fontSize: '2.5rem', marginBottom: '1rem', opacity: 0.3 }}></i>
                                    <p>Your financial transaction history will appear here.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'profile' && (
                    <div className="dashboard view-section" style={{ display: 'block' }}>
                        <div className="welcome-section">
                            <div>
                                <h1>Settings & Profile ⚙️</h1>
                                <p>Update your personal information and contact details.</p>
                            </div>
                        </div>
                        <div className="bento-grid">
                            <div className="bento-card" style={{ gridColumn: 'span 12', maxWidth: '600px', margin: '1rem auto' }}>
                                <div className="card-header" style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                                    <h3>Personal Information</h3>
                                </div>

                                <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Full Name</label>
                                <div className="input-group" style={{ marginBottom: '1.25rem' }}>
                                    <i className="fa-solid fa-user"></i>
                                    <input type="text" placeholder="Enter your full name" value={profileName} onChange={e => setProfileName(e.target.value)} />
                                </div>

                                <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Alternate Phone Number</label>
                                <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                                    <i className="fa-solid fa-phone"></i>
                                    <input type="tel" placeholder="10-digit emergency/alternate number" maxLength="10" value={profileAltPhone} onChange={e => setProfileAltPhone(e.target.value)} />
                                </div>

                                <button
                                    className="primary-btn"
                                    style={{ width: '100%', justifyContent: 'center', padding: '1rem' }}
                                    onClick={handleUpdateProfile}
                                    disabled={isSavingProfile}
                                >
                                    {isSavingProfile ? 'Saving...' : 'Save Profile Changes'}
                                </button>
                            </div>

                            <div className="bento-card" style={{ gridColumn: 'span 12', maxWidth: '600px', margin: '0 auto 1rem auto' }}>
                                <div className="card-header" style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                                    <h3>Login & Security</h3>
                                </div>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Update your primary phone number and login PIN here. If you change your phone number, your account data will be safely migrated and you will need to log in again.</p>

                                <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Primary Phone Number (Login ID)</label>
                                <div className="input-group" style={{ marginBottom: '1.25rem' }}>
                                    <i className="fa-solid fa-mobile-screen"></i>
                                    <input type="tel" placeholder="10-digit primary login number" maxLength="10" value={newPhone} onChange={e => setNewPhone(e.target.value)} />
                                </div>

                                <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>6-Digit Account PIN</label>
                                <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                                    <i className="fa-solid fa-lock"></i>
                                    <input type="password" placeholder="6-digit PIN" maxLength="6" value={newPin} onChange={e => setNewPin(e.target.value)} />
                                </div>

                                <button
                                    className="primary-btn"
                                    style={{ width: '100%', justifyContent: 'center', padding: '1rem', background: 'transparent', color: 'var(--primary)', border: '1px solid var(--primary)' }}
                                    onClick={handleUpdateSecurity}
                                    disabled={isUpdatingSecurity}
                                >
                                    {isUpdatingSecurity ? 'Updating Security...' : 'Update Security Settings'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {isAddCropOpen && <AddCropModal onClose={() => setIsAddCropOpen(false)} onSaveCrop={handleSaveCrop} />}
            {selectedMillForEnquiry && (
                <SendEnquiryModal
                    onClose={() => setSelectedMillForEnquiry(null)}
                    mill={selectedMillForEnquiry}
                    crop={selectedCropForSearch}
                    user={user}
                />
            )}
        </div>
    );
}
