import React, { useState } from 'react';
import { supabase } from '../utils/supabase';

export default function SendEnquiryModal({ onClose, mill, crop, user }) {
    const [acres, setAcres] = useState(crop?.acres || '');
    const [withTransport, setWithTransport] = useState(false);
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!acres || isNaN(acres) || acres <= 0) {
            return alert("Please enter a valid number of acres.");
        }

        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('enquiries')
                .insert({
                    mill_id: mill.id,
                    mill_name: mill.millName,
                    buyer_phone: mill.ownerPhone,
                    farmer_phone: user.phone,
                    farmer_name: user.name || user.phone,
                    crop_name: crop?.cropName || 'Unknown Crop',
                    acres: Number(acres),
                    with_transport: withTransport,
                    message: message,
                    status: 'pending',
                    created_at: new Date().toISOString(),
                    farmer_lat: crop?.latitude || null,
                    farmer_lng: crop?.longitude || null,
                    farmer_location_name: crop?.locationName || '',
                    mill_lat: mill?.latitude || null,
                    mill_lng: mill?.longitude || null,
                    mill_location_name: mill?.locationName || '',
                    distance: mill?.distance || 0,
                });

            if (error) throw error;

            alert('Enquiry sent successfully!');
            onClose();
        } catch (error) {
            console.error("Error sending enquiry:", error);
            alert("Failed to send enquiry. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content bento-card" style={{ maxWidth: '500px', width: '90%' }}>
                <div className="card-header" style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <i className="fa-solid fa-paper-plane" style={{ color: 'var(--primary)' }}></i>
                        Send Enquiry to {mill.millName}
                    </h3>
                    <button className="action-btn text-btn" onClick={onClose}><i className="fa-solid fa-xmark"></i></button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Crop Type</label>
                        <div className="input-group">
                            <i className="fa-solid fa-seedling"></i>
                            <input type="text" value={crop?.cropName || ''} disabled style={{ backgroundColor: 'transparent', color: 'var(--text-main)' }} />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Quantity in Acres</label>
                        <div className="input-group">
                            <i className="fa-solid fa-chart-area"></i>
                            <input
                                type="number"
                                placeholder="Enter acres"
                                value={acres}
                                onChange={(e) => setAcres(e.target.value)}
                                required
                                min="0.1"
                                step="0.1"
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Transport Option</label>
                        <div style={{ display: 'flex', gap: '1.5rem', padding: '0.5rem 0' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-main)' }}>
                                <input
                                    type="radio"
                                    name="transport"
                                    checked={!withTransport}
                                    onChange={() => setWithTransport(false)}
                                />
                                Without Transport
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-main)' }}>
                                <input
                                    type="radio"
                                    name="transport"
                                    checked={withTransport}
                                    onChange={() => setWithTransport(true)}
                                />
                                With Transport
                            </label>
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Additional Message (Optional)</label>
                        <div className="input-group" style={{ alignItems: 'flex-start' }}>
                            <i className="fa-solid fa-message" style={{ marginTop: '0.8rem' }}></i>
                            <textarea
                                placeholder="Any specific details you want to share..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows="3"
                                style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text)', outline: 'none', resize: 'vertical' }}
                            ></textarea>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" className="text-btn" onClick={onClose} style={{ flex: 1, padding: '1rem', justifyContent: 'center' }}>Cancel</button>
                        <button type="submit" className="primary-btn" disabled={isSubmitting} style={{ flex: 1, justifyContent: 'center', padding: '1rem' }}>
                            {isSubmitting ? 'Sending...' : 'Send Enquiry'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
