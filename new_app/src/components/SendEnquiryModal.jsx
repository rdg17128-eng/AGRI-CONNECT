import React, { useState } from 'react';
import { kisanService, calculateDistance } from '../services/kisanService';
import KisanLogo from './KisanLogo';

export default function SendEnquiryModal({ onClose, mill, crop, user, onEnquiryCreated }) {
    const [acres, setAcres] = useState(crop?.acres || '5');
    const defaultPrice = (mill?.prices && crop?.cropName && mill.prices[crop.cropName])
        ? String(mill.prices[crop.cropName])
        : '2450';
    const [expectedPrice, setExpectedPrice] = useState(defaultPrice);
    const [withTransport, setWithTransport] = useState(false);
    
    // Transport specific details
    const [vehicleCapacity, setVehicleCapacity] = useState('10 Ton');
    const [vehicleType, setVehicleType] = useState('Truck');
    const [pickupDate, setPickupDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 2);
        return d.toISOString().split('T')[0];
    });
    const [pickupLocation, setPickupLocation] = useState(crop?.locationName || 'Farmer Farm Location');
    const [deliveryLocation, setDeliveryLocation] = useState(mill?.locationName || mill?.millName || 'Mill Processing Gate');
    const [transportInstructions, setTransportInstructions] = useState('');
    const [message, setMessage] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [createdEnquiry, setCreatedEnquiry] = useState(null);

    const distanceKm = mill?.distance || calculateDistance(
        crop?.latitude, crop?.longitude, mill?.latitude, mill?.longitude
    ) || 38.5;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!acres || isNaN(acres) || Number(acres) <= 0) {
            return alert("Please enter a valid acreage.");
        }
        if (!quantityTons || isNaN(quantityTons) || Number(quantityTons) <= 0) {
            return alert("Please enter a valid crop quantity in tons.");
        }

        setIsSubmitting(true);
        try {
            const enquiryPayload = {
                mill_id: mill.id,
                mill_name: mill.millName,
                buyer_phone: mill.ownerPhone || mill.phone,
                buyer_name: mill.ownerName || mill.millName,
                farmer_phone: user.phone,
                farmer_name: user.name || `Farmer (${user.phone})`,
                crop_id: crop?.id || null,
                crop_name: crop?.cropName || 'Paddy (Rice)',
                acres: Number(acres),
                quantity: Number(quantityTons),
                expected_price: Number(expectedPrice),
                offered_price: Number(expectedPrice),
                total_price: Number(expectedPrice) * Number(quantityTons) * 10, // quintals to tons approx
                transport_required: withTransport,
                vehicle_capacity: withTransport ? vehicleCapacity : null,
                vehicle_type: withTransport ? vehicleType : null,
                pickup_location: pickupLocation,
                delivery_location: deliveryLocation,
                pickup_date: withTransport ? pickupDate : null,
                transport_instructions: withTransport ? transportInstructions : '',
                message: message,
                farmer_lat: crop?.latitude || null,
                farmer_lng: crop?.longitude || null,
                farmer_location_name: crop?.locationName || 'Farm Plot',
                mill_lat: mill?.latitude || null,
                mill_lng: mill?.longitude || null,
                mill_location_name: mill?.locationName || mill?.millName || '',
                distance: distanceKm
            };

            const created = await kisanService.createEnquiry(enquiryPayload);
            setCreatedEnquiry(created);
            if (onEnquiryCreated) {
                onEnquiryCreated(created);
            }
        } catch (error) {
            console.error("Error creating enquiry:", error);
            alert("Failed to submit enquiry. Please verify details and try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" style={{ zIndex: 9999, animation: 'fadeIn 0.25s ease-out' }}>
            <div 
                className="modal-content bento-card" 
                style={{ 
                    maxWidth: '540px', 
                    width: '92%', 
                    maxHeight: '90vh', 
                    overflowY: 'auto',
                    padding: '2rem 1.75rem',
                    background: 'var(--card-bg)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)'
                }}
            >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <i className="fa-solid fa-paper-plane" style={{ color: 'var(--primary)', fontSize: '1.2rem' }}></i>
                        <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Send Enquiry to {mill.millName}</h3>
                    </div>
                    <button className="action-btn text-btn" onClick={onClose}>
                        <i className="fa-solid fa-xmark" style={{ fontSize: '1.2rem' }}></i>
                    </button>
                </div>

                {/* SUCCESS STATE */}
                {createdEnquiry ? (
                    <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                        <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', fontSize: '2rem' }}>
                            <i className="fa-solid fa-circle-check"></i>
                        </div>

                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: 'var(--primary)' }}>
                            Enquiry Sent Successfully!
                        </h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                            Your enquiry has been dispatched to {mill.millName}. Once accepted, your secure Crop Verification QR code will be generated instantly.
                        </p>

                        <div style={{ background: 'rgba(255, 255, 255, 0.04)', borderRadius: '1rem', padding: '1.25rem', textAlign: 'left', marginBottom: '1.5rem', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Permanent Enquiry ID:</span>
                                <strong style={{ color: 'var(--accent-gold)', fontFamily: 'monospace', fontSize: '1.1rem' }}>
                                    {createdEnquiry.enquiry_code}
                                </strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Crop / Quantity:</span>
                                <strong>{createdEnquiry.crop_name} ({createdEnquiry.quantity} Tons)</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Transport Required:</span>
                                <span style={{ color: createdEnquiry.transport_required ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 600 }}>
                                    {createdEnquiry.transport_required ? 'Yes (KisanConnect Logistics)' : 'No (Self Arranged)'}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Current Status:</span>
                                <span className="status-badge" style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#fbbf24', padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}>
                                    PENDING MILL ACCEPTANCE
                                </span>
                            </div>
                        </div>

                        <button className="primary-btn" onClick={onClose} style={{ width: '100%', justifyContent: 'center', padding: '0.85rem' }}>
                            View in My Enquiries
                        </button>
                    </div>
                ) : (
                    /* FORM INPUT */
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                        {/* Mill Summary Box */}
                        <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.75rem 1rem', borderRadius: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                            <div>
                                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Target Mill & Distance</span>
                                <strong>{mill.millName}</strong>
                            </div>
                            <span style={{ color: 'var(--primary)', fontWeight: 700 }}>~{distanceKm} km away</span>
                        </div>

                        {/* Crop and Acreage */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Crop Type</label>
                                <div className="input-group">
                                    <i className="fa-solid fa-seedling"></i>
                                    <input type="text" value={crop?.cropName || 'Paddy (Rice)'} disabled style={{ background: 'transparent' }} />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Acreage (Acres)</label>
                                <div className="input-group">
                                    <i className="fa-solid fa-chart-area"></i>
                                    <input
                                        type="number"
                                        value={acres}
                                        onChange={(e) => {
                                            setAcres(e.target.value);
                                            setQuantityTons(String(Number(e.target.value || 0) * 2));
                                        }}
                                        min="0.1"
                                        step="0.1"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Quantity and Expected Price */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Total Quantity (Tons)</label>
                                <div className="input-group">
                                    <i className="fa-solid fa-weight-hanging"></i>
                                    <input
                                        type="number"
                                        value={quantityTons}
                                        onChange={(e) => setQuantityTons(e.target.value)}
                                        min="0.5"
                                        step="0.5"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Expected Price (₹/Quintal)</label>
                                <div className="input-group">
                                    <i className="fa-solid fa-indian-rupee-sign"></i>
                                    <input
                                        type="number"
                                        value={expectedPrice}
                                        onChange={(e) => setExpectedPrice(e.target.value)}
                                        min="100"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Transport Required Option */}
                        <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
                                Transport Required?
                            </label>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                                    <input
                                        type="radio"
                                        name="transport_opt"
                                        checked={!withTransport}
                                        onChange={() => setWithTransport(false)}
                                    />
                                    <span>No (I will arrange transport)</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                                    <input
                                        type="radio"
                                        name="transport_opt"
                                        checked={withTransport}
                                        onChange={() => setWithTransport(true)}
                                    />
                                    <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Yes (Request Logistics)</span>
                                </label>
                            </div>

                            {/* Conditional Transport Details */}
                            {withTransport && (
                                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px dashed rgba(255, 255, 255, 0.1)', display: 'flex', flexDirection: 'column', gap: '0.85rem', animation: 'fadeIn 0.2s ease-out' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Vehicle Capacity</label>
                                            <select
                                                value={vehicleCapacity}
                                                onChange={(e) => setVehicleCapacity(e.target.value)}
                                                style={{ width: '100%', padding: '0.7rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'inherit' }}
                                            >
                                                <option value="5 Ton" style={{ color: '#000' }}>5 Ton</option>
                                                <option value="10 Ton" style={{ color: '#000' }}>10 Ton</option>
                                                <option value="15 Ton" style={{ color: '#000' }}>15 Ton</option>
                                                <option value="20 Ton" style={{ color: '#000' }}>20 Ton</option>
                                                <option value="Custom" style={{ color: '#000' }}>Custom / Heavy</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Vehicle Type</label>
                                            <select
                                                value={vehicleType}
                                                onChange={(e) => setVehicleType(e.target.value)}
                                                style={{ width: '100%', padding: '0.7rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'inherit' }}
                                            >
                                                <option value="Mini Truck" style={{ color: '#000' }}>Mini Truck (Eicher/Tata Ace)</option>
                                                <option value="Truck" style={{ color: '#000' }}>Standard Truck</option>
                                                <option value="Lorry" style={{ color: '#000' }}>Heavy Multi-Axle Lorry</option>
                                                <option value="Other" style={{ color: '#000' }}>Other Special Vehicle</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Preferred Pickup Date</label>
                                        <input
                                            type="date"
                                            value={pickupDate}
                                            onChange={(e) => setPickupDate(e.target.value)}
                                            style={{ width: '100%', padding: '0.7rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'inherit' }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Pickup Farm Coordinates / Address</label>
                                        <input
                                            type="text"
                                            value={pickupLocation}
                                            onChange={(e) => setPickupLocation(e.target.value)}
                                            placeholder="Enter farm land location or landmark"
                                            style={{ width: '100%', padding: '0.7rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'inherit' }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Additional Transport Instructions</label>
                                        <input
                                            type="text"
                                            value={transportInstructions}
                                            onChange={(e) => setTransportInstructions(e.target.value)}
                                            placeholder="e.g. Tarpaulin cover required, narrow access road"
                                            style={{ width: '100%', padding: '0.7rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'inherit' }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Additional Farmer Message */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Message to Mill (Optional)</label>
                            <div className="input-group" style={{ alignItems: 'flex-start' }}>
                                <i className="fa-solid fa-message" style={{ marginTop: '0.8rem' }}></i>
                                <textarea
                                    placeholder="Enter any quality specifications, moisture level, or negotiable terms..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    rows="2"
                                    style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text-main)', outline: 'none', resize: 'vertical' }}
                                ></textarea>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                            <button type="button" className="text-btn" onClick={onClose} style={{ flex: 1, padding: '0.85rem', justifyContent: 'center' }}>
                                Cancel
                            </button>
                            <button type="submit" className="primary-btn" disabled={isSubmitting} style={{ flex: 1.5, justifyContent: 'center', padding: '0.85rem' }}>
                                {isSubmitting ? (
                                    <>
                                        <i className="fa-solid fa-spinner fa-spin"></i>
                                        <span>Generating Enquiry...</span>
                                    </>
                                ) : (
                                    <>
                                        <i className="fa-solid fa-paper-plane"></i>
                                        <span>Send Enquiry</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
