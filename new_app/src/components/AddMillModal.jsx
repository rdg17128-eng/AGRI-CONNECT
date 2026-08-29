import React, { useState } from 'react';
import { supabase } from '../utils/supabase';
import MapModal from './MapModal';

export default function AddMillModal({ user, onClose, onMillAdded }) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Form Details
    const [millName, setMillName] = useState('');
    const [millType, setMillType] = useState('Rice Mill');
    const [capacity, setCapacity] = useState('');
    const [requirements, setRequirements] = useState('');
    const [selectedCrops, setSelectedCrops] = useState([]);
    const [location, setLocation] = useState({ name: '', lat: null, lng: null });
    const [hasColdStorage, setHasColdStorage] = useState(false);

    const [isMapOpen, setIsMapOpen] = useState(false);

    const cropCategories = [
        {
            name: 'Cereals / Grains',
            icon: 'fa-wheat-awn',
            crops: ['Paddy (Rice)', 'Maize', 'Wheat']
        },
        {
            name: 'Pulses',
            icon: 'fa-seedling',
            crops: ['Red Gram', 'Green Gram']
        },
        {
            name: 'Oilseeds',
            icon: 'fa-sun',
            crops: ['Groundnut', 'Sunflower']
        },
        {
            name: 'Commercial',
            icon: 'fa-shirt',
            crops: ['Cotton']
        }
    ];

    const handleToggleCrop = (crop) => {
        if (selectedCrops.includes(crop)) {
            setSelectedCrops(selectedCrops.filter(c => c !== crop));
        } else {
            setSelectedCrops([...selectedCrops, crop]);
        }
    };

    const handleLocationConfirm = (name, lat, lng) => {
        setLocation({ name, lat, lng });
        setIsMapOpen(false);
    };

    const handleSubmit = async () => {
        if (!millName || !location.lat || selectedCrops.length === 0) {
            alert('Please complete all required fields.');
            return;
        }

        setLoading(true);
        try {
            const millData = {
                owner_phone: user.phone,
                mill_name: millName,
                mill_type: millType,
                capacity: capacity ? parseFloat(capacity) : null,
                requirements,
                selectedCrops: selectedCrops,
                location_name: location.name,
                latitude: location.lat,
                longitude: location.lng,
                has_cold_storage: hasColdStorage,
                status: 'verified',
                created_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from('mills')
                .insert(millData);

            if (error) throw error;

            alert('Mill registered successfully! It is now pending verification.');
            onMillAdded();
            onClose();
        } catch (error) {
            console.error("Error adding mill:", error);
            alert('Failed to register mill.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-modal" style={{ display: 'flex', zIndex: 1100 }}>
            <div className="auth-content" style={{ maxWidth: '500px', padding: '2.5rem' }}>
                <span className="close-btn" onClick={onClose}><i className="fa-solid fa-xmark"></i></span>

                <h2 style={{ marginBottom: '0.5rem', color: 'var(--text-main)' }}>Register Your Mill 🏭</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Step {step} of 2 - {step === 1 ? 'Mill Details' : 'Buying Requirements'}</p>

                {step === 1 ? (
                    <div className="step-content">
                        <div className="input-field" style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Mill Name *</label>
                            <div className="input-group">
                                <i className="fa-solid fa-industry"></i>
                                <input type="text" placeholder="e.g. Sri Krishna Rice Mill" value={millName} onChange={e => setMillName(e.target.value)} />
                            </div>
                        </div>

                        <div className="input-field" style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Mill Type *</label>
                            <div className="input-group">
                                <i className="fa-solid fa-gears"></i>
                                <select value={millType} onChange={e => setMillType(e.target.value)} style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text-main)', outline: 'none' }}>
                                    <option value="Rice Mill" style={{ color: '#000' }}>Rice Mill</option>
                                    <option value="Flour Mill" style={{ color: '#000' }}>Flour Mill</option>
                                    <option value="Oil Mill" style={{ color: '#000' }}>Oil Mill</option>
                                    <option value="Pulse Mill" style={{ color: '#000' }}>Pulse Mill</option>
                                </select>
                            </div>
                        </div>

                        <div className="input-field" style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Location *</label>
                            <button onClick={() => setIsMapOpen(true)} className="input-group" style={{ width: '100%', textAlign: 'left', cursor: 'pointer', background: 'var(--bg-dark)' }}>
                                <i className="fa-solid fa-location-dot" style={{ color: location.lat ? 'var(--primary)' : 'var(--text-muted)' }}></i>
                                <span style={{ color: location.lat ? 'var(--text-main)' : 'var(--text-muted)' }}>
                                    {location.name || 'Select Location on Map'}
                                </span>
                            </button>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-dark)', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Cold Storage Facility</span>
                            <div
                                onClick={() => setHasColdStorage(!hasColdStorage)}
                                style={{ width: '40px', height: '20px', background: hasColdStorage ? 'var(--primary)' : '#333', borderRadius: '10px', position: 'relative', cursor: 'pointer', transition: '0.3s' }}
                            >
                                <div style={{ width: '14px', height: '14px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '3px', left: hasColdStorage ? '23px' : '3px', transition: '0.3s' }}></div>
                            </div>
                        </div>

                        <button className="primary-btn" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setStep(2)}>Next Step</button>
                    </div>
                ) : (
                    <div className="step-content">
                        <div className="input-field" style={{ marginBottom: '1.25rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.8rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Link your mill to specific crops: *</label>

                            <div style={{ maxHeight: '250px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                                {cropCategories.map(category => (
                                    <div key={category.name} style={{ marginBottom: '1.25rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            <i className={`fa-solid ${category.icon}`}></i>
                                            {category.name}
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                            {category.crops.map(crop => (
                                                <button
                                                    key={crop}
                                                    onClick={() => handleToggleCrop(crop)}
                                                    style={{
                                                        padding: '0.4rem 0.8rem',
                                                        borderRadius: '2rem',
                                                        fontSize: '0.8rem',
                                                        border: '1px solid var(--border-color)',
                                                        background: selectedCrops.includes(crop) ? 'var(--primary)' : 'rgba(255,255,255,0.03)',
                                                        color: selectedCrops.includes(crop) ? '#000' : 'var(--text-muted)',
                                                        transition: '0.3s',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    {crop}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontStyle: 'italic' }}>
                                    Your mill listings will be visible to farmers growing these specific crops.
                                </div>
                            </div>
                        </div>

                        <div className="input-field" style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Daily Capacity (Tons)</label>
                            <div className="input-group">
                                <i className="fa-solid fa-scale-balanced"></i>
                                <input type="number" placeholder="e.g. 50" value={capacity} onChange={e => setCapacity(e.target.value)} />
                            </div>
                        </div>

                        <div className="input-field" style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Mill Requirements / QC Policy</label>
                            <textarea
                                placeholder="e.g. Moisture content < 12%, No dust..."
                                style={{ width: '100%', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: '0.75rem', padding: '1rem', color: 'var(--text-main)', outline: 'none', minHeight: '80px', fontFamily: 'inherit' }}
                                value={requirements}
                                onChange={e => setRequirements(e.target.value)}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="primary-btn" style={{ flex: 1, background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }} onClick={() => setStep(1)}>Back</button>
                            <button className="primary-btn" style={{ flex: 2, justifyContent: 'center' }} onClick={handleSubmit} disabled={loading}>
                                {loading ? 'Registering...' : 'Complete Registration'}
                            </button>
                        </div>
                    </div>
                )}

                {isMapOpen && (
                    <MapModal
                        onClose={() => setIsMapOpen(false)}
                        onConfirm={handleLocationConfirm}
                    />
                )}
            </div>
        </div>
    );
}
