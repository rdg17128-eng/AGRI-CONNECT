import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet marker icons in React
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
    iconRetinaUrl,
    iconUrl,
    shadowUrl,
});

function MapEvents({ setPosition }) {
    useMapEvents({
        click(e) {
            setPosition(e.latlng);
        }
    });
    return null;
}

export default function MapModal({ onClose, onConfirm }) {
    const [position, setPosition] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);

    // Initial center (India approx)
    const initCenter = [20.5937, 78.9629];
    const mapRef = React.useRef();

    const handleSearch = async () => {
        if (!searchQuery) return;
        setLoading(true);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
            const data = await res.json();
            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);
                setPosition({ lat, lng: lon });
                if (mapRef.current) {
                    mapRef.current.setView([lat, lon], 12);
                }
            } else {
                alert('Location not found.');
            }
        } catch (err) {
            console.error("Search failed:", err);
            alert("Error searching location.");
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async () => {
        if (!position) return;
        setLoading(true);
        let placeName = "Selected Location";
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.lat}&lon=${position.lng}`);
            const data = await res.json();
            if (data.address) {
                placeName = data.address.city || data.address.town || data.address.village || data.address.county || data.address.state;
            }
        } catch (err) {
            console.error("Geocoding failed", err);
            placeName = `${position.lat.toFixed(2)}, ${position.lng.toFixed(2)}`;
        } finally {
            setLoading(false);
            onConfirm(placeName, position.lat, position.lng);
        }
    };

    return (
        <div className="auth-modal" style={{ display: 'flex', zIndex: 3000 }}>
            <div className="auth-content" style={{ maxWidth: '650px', padding: '1.5rem' }}>
                <span className="close-btn" onClick={onClose}><i className="fa-solid fa-xmark"></i></span>
                <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-main)' }}>Select Crop Location</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>Search for a location or click on the map to drop a pin.</p>

                <div className="input-group" style={{ marginBottom: '1rem', position: 'relative' }}>
                    <i className="fa-solid fa-magnifying-glass"></i>
                    <input type="text" placeholder="Search for your city, village, or town..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
                    <button className="primary-btn" style={{ position: 'absolute', right: '4px', padding: '0.4rem 1rem', fontSize: '0.8rem', borderRadius: '0.5rem', boxShadow: 'none' }} onClick={handleSearch} disabled={loading}>
                        {loading ? '...' : 'Search'}
                    </button>
                </div>

                <div style={{ width: '100%', height: '350px', borderRadius: '1rem', marginBottom: '1.5rem', zIndex: 1, overflow: 'hidden' }}>
                    <MapContainer center={initCenter} zoom={5} style={{ height: '100%', width: '100%' }} ref={mapRef}>
                        <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <MapEvents setPosition={setPosition} />
                        {position && <Marker position={position} />}
                    </MapContainer>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button className="text-btn" onClick={onClose} disabled={loading}>Cancel</button>
                    <button className="primary-btn" onClick={handleConfirm} disabled={!position || loading}>{loading ? 'Confirming...' : 'Confirm Location'}</button>
                </div>
            </div>
        </div>
    );
}
