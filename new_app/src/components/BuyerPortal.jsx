import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc, getDoc, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import AddMillModal from './AddMillModal';
import UpdatePricesModal from './UpdatePricesModal';

export default function BuyerPortal({ user, onLogout }) {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [currentTime, setCurrentTime] = useState(new Date());

    // Profile States
    const [profileName, setProfileName] = useState(user.name || '');
    const [profileAltPhone, setProfileAltPhone] = useState(user.altPhone || '');
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    // Buyer Specific Details
    const [gstNumber, setGstNumber] = useState(user.gstNumber || '');
    const [businessType, setBusinessType] = useState(user.businessType || 'Retailer');
    const [buyingCapacity, setBuyingCapacity] = useState(user.buyingCapacity || '');
    const [preferredCrops, setPreferredCrops] = useState(user.preferredCrops || []);

    // Security States
    const [newPhone, setNewPhone] = useState(user.phone || '');
    const [newPin, setNewPin] = useState(user.pin || '');
    const [isUpdatingSecurity, setIsUpdatingSecurity] = useState(false);

    // Mill States
    const [isAddMillOpen, setIsAddMillOpen] = useState(false);
    const [mills, setMills] = useState([]);
    const [loadingMills, setLoadingMills] = useState(true);
    const [selectedMillForPricing, setSelectedMillForPricing] = useState(null);

    // Enquiry States
    const [enquiries, setEnquiries] = useState([]);
    const [loadingEnquiries, setLoadingEnquiries] = useState(true);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        fetchMills();
        fetchEnquiries();
        return () => clearInterval(timer);
    }, []);

    const fetchMills = async () => {
        setLoadingMills(true);
        try {
            const q = query(collection(db, 'mills'), where('ownerPhone', '==', user.phone));
            const snap = await getDocs(q);
            const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMills(list);
        } catch (error) {
            console.error("Error fetching mills:", error);
        } finally {
            setLoadingMills(false);
        }
    };

    const fetchEnquiries = async () => {
        setLoadingEnquiries(true);
        try {
            const q = query(collection(db, 'enquiries'), where('buyerPhone', '==', user.phone));
            const snap = await getDocs(q);
            const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
            setEnquiries(list);
        } catch (error) {
            console.error("Error fetching enquiries:", error);
        } finally {
            setLoadingEnquiries(false);
        }
    };

    const handleAcceptEnquiry = async (enquiryId) => {
        if (!window.confirm('Do you want to accept this order and securely share your accurate mill location with the farmer for logistics?')) return;
        try {
            await setDoc(doc(db, 'enquiries', enquiryId), { status: 'accepted', updatedAt: new Date() }, { merge: true });
            setEnquiries(prev => prev.map(enq => enq.id === enquiryId ? { ...enq, status: 'accepted' } : enq));
            alert('Enquiry accepted successfully! The farmer has been notified.');
        } catch (error) {
            console.error('Error accepting enquiry:', error);
            alert('Failed to accept enquiry.');
        }
    };

    const handleUpdateProfile = async () => {
        setIsSavingProfile(true);
        try {
            const userRef = doc(db, `${user.role}s`, user.phone);
            const buyerData = {
                name: profileName,
                altPhone: profileAltPhone,
                gstNumber: gstNumber,
                businessType: businessType,
                buyingCapacity: buyingCapacity,
                preferredCrops: preferredCrops,
                lastUpdated: new Date()
            };
            await setDoc(userRef, buyerData, { merge: true });
            alert('Buyer profile and records synchronized successfully!');
        } catch (error) {
            console.error(error);
            alert('Failed to update buyer records');
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
                const newSnap = await getDoc(newRef);
                if (newSnap.exists()) {
                    setIsUpdatingSecurity(false);
                    return alert("This new phone number is already registered.");
                }

                const newUserData = {
                    ...user,
                    phone: newPhone,
                    pin: newPin,
                    name: profileName,
                    altPhone: profileAltPhone
                };
                await setDoc(newRef, newUserData);
                await deleteDoc(oldRef);

                alert("Phone number changed successfully! Please log in again.");
                onLogout();
            } else {
                await setDoc(oldRef, { pin: newPin }, { merge: true });
                alert("PIN updated successfully!");
                user.pin = newPin;
            }
        } catch (error) {
            console.error(error);
            alert("Error updating security settings.");
        } finally {
            setIsUpdatingSecurity(false);
        }
    };

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
                        <span>Dashboard</span>
                    </a>
                    <a className={`nav-item ${activeTab === 'browse' ? 'active' : ''}`} onClick={() => setActiveTab('browse')}>
                        <i className="fa-solid fa-magnifying-glass"></i>
                        <span>Browse Crops</span>
                    </a>
                    <a className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
                        <i className="fa-solid fa-box-open"></i>
                        <span>My Purchases</span>
                    </a>
                    <a className={`nav-item ${activeTab === 'enquiries' ? 'active' : ''}`} onClick={() => setActiveTab('enquiries')}>
                        <i className="fa-solid fa-envelope"></i>
                        <span>Enquiries</span>
                    </a>
                    <a className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
                        <i className="fa-solid fa-user-gear"></i>
                        <span>Profile</span>
                    </a>
                </nav>
                <div className="sidebar-bottom">
                    <div style={{ padding: '0.8rem', background: 'rgba(0, 255, 136, 0.05)', borderRadius: '12px', marginBottom: '1rem', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Buyer Type</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>{businessType}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>Capacity: {buyingCapacity || '0'} Tons</div>
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
                        <button className="action-btn back-btn" onClick={onLogout}>
                            <i className="fa-solid fa-arrow-left"></i>
                        </button>
                        <div className="search-bar">
                            <i className="fa-solid fa-search"></i>
                            <input type="text" placeholder="Search crops, regions..." />
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
                                <h1>Welcome, {profileName || 'Buyer'}! 📈</h1>
                                <p>Find the best quality produce directly from local farms.</p>
                            </div>
                            <button className="primary-btn" onClick={() => setIsAddMillOpen(true)}>
                                <i className="fa-solid fa-industry"></i> Add Your Mill
                            </button>
                        </div>

                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-icon revenue"><i className="fa-solid fa-cart-shopping"></i></div>
                                <div className="stat-details">
                                    <h3>Total Spending</h3>
                                    <h2>₹0.00</h2>
                                    <span className="trend neutral">No purchases yet</span>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon crops"><i className="fa-solid fa-truck"></i></div>
                                <div className="stat-details">
                                    <h3>In Transit</h3>
                                    <h2>0 Lots</h2>
                                    <span className="trend neutral">All clear</span>
                                </div>
                            </div>
                        </div>

                        <div className="bento-grid">
                            <div className="bento-card" style={{ gridColumn: 'span 8' }}>
                                <div className="card-header">
                                    <h3>Recent Market Trends</h3>
                                </div>
                                <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                                    <i className="fa-solid fa-chart-area" style={{ fontSize: '3rem', opacity: 0.2 }}></i>
                                    <p style={{ marginLeft: '1rem' }}>Supply trends for this season will appear here.</p>
                                </div>
                            </div>

                            <div className="bento-grid" style={{ marginTop: '1.5rem' }}>
                                <div className="bento-card" style={{ gridColumn: 'span 12' }}>
                                    <div className="card-header">
                                        <h3>My Registered Mills</h3>
                                    </div>
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
                                                                    <span key={crop} style={{ fontSize: '0.7rem', padding: '2px 6px', background: 'rgba(0,255,136,0.1)', color: 'var(--primary)', borderRadius: '4px' }}>{crop}</span>
                                                                ))}
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: '1rem' }}>{mill.capacity} TPD</td>
                                                        <td style={{ padding: '1rem' }}>
                                                            <span className={`status-badge ${mill.status === 'pending' ? 'pending' : 'completed'}`} style={{ textTransform: 'capitalize' }}>
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
                            <div className="bento-card" style={{ gridColumn: 'span 4' }}>
                                <div className="card-header">
                                    <h3>Top Categories</h3>
                                </div>
                                <div style={{ marginTop: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.8rem 0', borderBottom: '1px solid var(--border-color)' }}>
                                        <span>Cereals</span>
                                        <span style={{ color: 'var(--primary)' }}>High Demand</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.8rem 0', borderBottom: '1px solid var(--border-color)' }}>
                                        <span>Oilseeds</span>
                                        <span style={{ color: '#ffb300' }}>Moderate</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.8rem 0' }}>
                                        <span>Pulses</span>
                                        <span style={{ color: 'var(--primary)' }}>In Season</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'browse' && (
                    <div className="dashboard view-section" style={{ display: 'block' }}>
                        <div className="welcome-section">
                            <div>
                                <h1>Browse Available Crops 🕵️‍♂️</h1>
                                <p>Crops listed by verified farmers ready for purchase.</p>
                            </div>
                        </div>
                        <div className="bento-grid">
                            <div className="bento-card" style={{ gridColumn: 'span 12', textAlign: 'center', padding: '4rem 0' }}>
                                <i className="fa-solid fa-layer-group" style={{ fontSize: '3rem', color: 'var(--primary)', marginBottom: '1.5rem', opacity: 0.5 }}></i>
                                <h3>Connecting to Farms...</h3>
                                <p style={{ color: 'var(--text-muted)' }}>We are currently syncing with live farmer listings. Check back in a moment.</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'orders' && (
                    <div className="dashboard view-section" style={{ display: 'block' }}>
                        <div className="welcome-section">
                            <div>
                                <h1>My Purchases 📦</h1>
                                <p>Track your active and history orders.</p>
                            </div>
                        </div>
                        <div className="bento-grid">
                            <div className="bento-card" style={{ gridColumn: 'span 12' }}>
                                <div className="table-responsive">
                                    <table className="orders-table" style={{ width: '100%', textAlign: 'left' }}>
                                        <thead>
                                            <tr>
                                                <th style={{ padding: '1rem' }}>Order ID</th>
                                                <th style={{ padding: '1rem' }}>Farmer</th>
                                                <th style={{ padding: '1rem' }}>Crop</th>
                                                <th style={{ padding: '1rem' }}>Qty</th>
                                                <th style={{ padding: '1rem' }}>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td colSpan="5" style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>No orders found.</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'enquiries' && (
                    <div className="dashboard view-section" style={{ display: 'block' }}>
                        <div className="welcome-section">
                            <div>
                                <h1>Farmer Enquiries 📬</h1>
                                <p>Manage the supply requests sent directly by farmers.</p>
                            </div>
                        </div>
                        <div className="bento-grid">
                            <div className="bento-card" style={{ gridColumn: 'span 12' }}>
                                <div className="table-responsive">
                                    <table className="orders-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                <th style={{ padding: '1rem' }}>Date</th>
                                                <th style={{ padding: '1rem' }}>Farmer</th>
                                                <th style={{ padding: '1rem' }}>Crop</th>
                                                <th style={{ padding: '1rem' }}>Acres</th>
                                                <th style={{ padding: '1rem' }}>Transport</th>
                                                <th style={{ padding: '1rem' }}>Message</th>
                                                <th style={{ padding: '1rem' }}>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {loadingEnquiries ? (
                                                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>Loading enquiries...</td></tr>
                                            ) : enquiries.length === 0 ? (
                                                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>No enquiries found.</td></tr>
                                            ) : enquiries.map(enq => (
                                                <tr key={enq.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                    <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>{enq.createdAt?.toDate ? enq.createdAt.toDate().toLocaleDateString('en-IN') : 'N/A'}</td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <div style={{ fontWeight: 600 }}>{enq.farmerName}</div>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{enq.farmerPhone}</div>
                                                    </td>
                                                    <td style={{ padding: '1rem', fontWeight: 500 }}>{enq.cropName}</td>
                                                    <td style={{ padding: '1rem' }}>{enq.acres} Acres</td>
                                                    <td style={{ padding: '1rem' }}>
                                                        {enq.withTransport ? (
                                                            <span style={{ color: 'var(--primary)', backgroundColor: 'rgba(0,255,136,0.1)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>With Transport</span>
                                                        ) : (
                                                            <span style={{ color: '#ffb300', backgroundColor: 'rgba(255,179,0,0.1)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>No Transport</span>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '1rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={enq.message}>
                                                        {enq.message || '-'}
                                                    </td>
                                                    <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>
                                                        {enq.status === 'accepted' ? (
                                                            <span style={{ color: 'var(--success)', fontWeight: 600 }}><i className="fa-solid fa-check"></i> Purchased</span>
                                                        ) : (
                                                            <button
                                                                className="primary-btn"
                                                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                                                                onClick={() => handleAcceptEnquiry(enq.id)}
                                                            >
                                                                Buy It
                                                            </button>
                                                        )}
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

                                <div className="input-group" style={{ marginBottom: '1.25rem' }}>
                                    <i className="fa-solid fa-user"></i>
                                    <input type="text" placeholder="Owner/Company Name" value={profileName} onChange={e => setProfileName(e.target.value)} />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>GST Number</label>
                                        <div className="input-group" style={{ marginBottom: '1.25rem' }}>
                                            <i className="fa-solid fa-file-contract"></i>
                                            <input type="text" placeholder="15-digit GSTIN" maxLength="15" value={gstNumber} onChange={e => setGstNumber(e.target.value)} />
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Business Type</label>
                                        <div className="input-group" style={{ marginBottom: '1.25rem' }}>
                                            <i className="fa-solid fa-briefcase"></i>
                                            <select value={businessType} onChange={e => setBusinessType(e.target.value)} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', width: '100%', outline: 'none' }}>
                                                <option value="Retailer" style={{ color: '#000' }}>Retailer</option>
                                                <option value="Wholesaler" style={{ color: '#000' }}>Wholesaler</option>
                                                <option value="Exporter" style={{ color: '#000' }}>Exporter</option>
                                                <option value="Broker" style={{ color: '#000' }}>Broker</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Alt. Contact</label>
                                        <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                                            <i className="fa-solid fa-phone"></i>
                                            <input type="tel" placeholder="10-digit number" maxLength="10" value={profileAltPhone} onChange={e => setProfileAltPhone(e.target.value)} />
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Monthly Capacity</label>
                                        <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                                            <i className="fa-solid fa-weight-hanging"></i>
                                            <input type="number" placeholder="in Tons" value={buyingCapacity} onChange={e => setBuyingCapacity(e.target.value)} />
                                        </div>
                                    </div>
                                </div>

                                <button className="primary-btn" style={{ width: '100%', justifyContent: 'center' }} onClick={handleUpdateProfile} disabled={isSavingProfile}>
                                    {isSavingProfile ? 'Syncing with Buyer Log...' : 'Synchronize Buyer Profile'}
                                </button>
                            </div>

                            <div className="bento-card" style={{ gridColumn: 'span 12', maxWidth: '600px', margin: '0 auto 1rem auto' }}>
                                <div className="card-header" style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                                    <h3>Login & Security</h3>
                                </div>
                                <div className="input-group" style={{ marginBottom: '1.25rem' }}>
                                    <i className="fa-solid fa-mobile-screen"></i>
                                    <input type="tel" placeholder="Login Phone" maxLength="10" value={newPhone} onChange={e => setNewPhone(e.target.value)} />
                                </div>
                                <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                                    <i className="fa-solid fa-lock"></i>
                                    <input type="password" placeholder="6-digit PIN" maxLength="6" value={newPin} onChange={e => setNewPin(e.target.value)} />
                                </div>
                                <button className="primary-btn" style={{ width: '100%', justifyContent: 'center', background: 'transparent', color: 'var(--primary)', border: '1px solid var(--primary)' }} onClick={handleUpdateSecurity} disabled={isUpdatingSecurity}>
                                    {isUpdatingSecurity ? 'Updating...' : 'Update Security Settings'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>

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
        </div>
    );
}
