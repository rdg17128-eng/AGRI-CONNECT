import React, { useState } from 'react';
import MapModal from './MapModal';

export default function AddCropModal({ onClose, onSaveCrop }) {
    const [crop, setCrop] = useState('');
    const [customCrop, setCustomCrop] = useState('');
    const [locationInput, setLocationInput] = useState('');
    const [coords, setCoords] = useState(null);
    const [acres, setAcres] = useState('');
    const [isMapOpen, setIsMapOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleConfirmLocation = (placeName, lat, lng) => {
        setLocationInput(placeName);
        setCoords({ lat, lng });
        setIsMapOpen(false);
    };

    const handleSave = async () => {
        const finalCrop = crop === 'Other' ? customCrop : crop;
        if (!finalCrop) return alert("Please select or enter a crop.");
        const finalCoords = coords || { lat: 17.9689, lng: 79.5941 };
        const finalLocation = locationInput || 'Warangal Agri Farm Plot';
        if (!acres || isNaN(acres) || acres <= 0) return alert("Please enter valid acres.");

        setLoading(true);
        await onSaveCrop({
            cropName: finalCrop,
            locationName: finalLocation,
            latitude: finalCoords.lat,
            longitude: finalCoords.lng,
            acres: parseFloat(acres)
        });
        setLoading(false);
        onClose();
    };

    return (
        <>
            <div className="auth-modal" style={{ display: 'flex' }}>
                <div className="auth-content">
                    <span className="close-btn" onClick={onClose}><i className="fa-solid fa-xmark"></i></span>
                    <div className="logo modal-logo" style={{ marginBottom: '1.25rem', justifyContent: 'center' }}>
                        <i className="fa-solid fa-seedling"></i>
                        <span>Add Crop</span>
                    </div>

                    <h2 style={{ marginBottom: '0.5rem', textAlign: 'center', fontSize: '1.4rem' }}>New Crop Entry</h2>
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '1.25rem', fontSize: '0.85rem' }}>Select your crop from the list below</p>

                    <div className="input-group" style={{ marginBottom: '1rem', borderColor: 'var(--primary)' }}>
                        <select style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', padding: '0', fontFamily: 'inherit', fontSize: '0.95rem', color: 'inherit', cursor: 'pointer' }} value={crop} onChange={(e) => setCrop(e.target.value)}>
                            <option value="" disabled style={{ color: '#000', background: '#fff' }}>Select a Crop</option>
                            <optgroup label="🌾 Cereals / Grains" style={{ color: '#000', background: '#fff' }}>
                                <option value="Paddy (Rice)" style={{ color: '#000', background: '#fff' }}>Paddy (Rice)</option>
                                <option value="Maize" style={{ color: '#000', background: '#fff' }}>Maize</option>
                                <option value="Wheat" style={{ color: '#000', background: '#fff' }}>Wheat</option>
                            </optgroup>
                            <optgroup label="🌱 Pulses" style={{ color: '#000', background: '#fff' }}>
                                <option value="Red Gram" style={{ color: '#000', background: '#fff' }}>Red Gram</option>
                                <option value="Green Gram" style={{ color: '#000', background: '#fff' }}>Green Gram</option>
                            </optgroup>
                            <optgroup label="🌻 Oilseeds" style={{ color: '#000', background: '#fff' }}>
                                <option value="Groundnut" style={{ color: '#000', background: '#fff' }}>Groundnut</option>
                                <option value="Sunflower" style={{ color: '#000', background: '#fff' }}>Sunflower</option>
                            </optgroup>
                            <optgroup label="🧵 Commercial" style={{ color: '#000', background: '#fff' }}>
                                <option value="Cotton" style={{ color: '#000', background: '#fff' }}>Cotton</option>
                            </optgroup>
                            <option value="Other" style={{ color: '#000', background: '#fff' }}>Other (Type custom name)</option>
                        </select>
                    </div>

                    {crop === 'Other' && (
                        <div className="input-group" style={{ marginBottom: '1rem' }}>
                            <i className="fa-solid fa-pen"></i>
                            <input type="text" placeholder="Enter custom crop name" value={customCrop} onChange={e => setCustomCrop(e.target.value)} />
                        </div>
                    )}

                    <p style={{ textAlign: 'left', color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Crop Location</p>
                    <div className="input-group" style={{ marginBottom: '1rem' }}>
                        <i className="fa-solid fa-location-dot"></i>
                        <input type="text" placeholder="Select location on map" readOnly value={locationInput} onClick={() => setIsMapOpen(true)} style={{ cursor: 'pointer', background: 'transparent' }} />
                        <button className="text-btn" style={{ padding: '0 0.5rem' }} onClick={() => setIsMapOpen(true)}><i className="fa-solid fa-map"></i> Map</button>
                    </div>

                    <div className="input-group" style={{ marginBottom: '1rem' }}>
                        <i className="fa-solid fa-layer-group"></i>
                        <input type="number" placeholder="Number of Acres" min="0.1" step="any" value={acres} onChange={e => setAcres(e.target.value)} />
                    </div>

                    <button className="primary-btn" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }} onClick={handleSave} disabled={loading}>
                        {loading ? 'Saving...' : 'Save Crop'}
                    </button>
                </div>
            </div>

            {isMapOpen && <MapModal onClose={() => setIsMapOpen(false)} onConfirm={handleConfirmLocation} />}
        </>
    );
}
