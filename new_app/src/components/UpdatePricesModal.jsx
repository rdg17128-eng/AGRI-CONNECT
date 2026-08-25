import React, { useState } from 'react';
import { db } from '../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export default function UpdatePricesModal({ mill, onClose, onUpdated }) {
    const [prices, setPrices] = useState(mill.cropPrices || {});
    const [isSaving, setIsSaving] = useState(false);

    const handlePriceChange = (crop, value) => {
        setPrices({ ...prices, [crop]: value });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await updateDoc(doc(db, 'mills', mill.id), { cropPrices: prices });
            alert("Prices updated successfully!");
            onUpdated();
            onClose();
        } catch (error) {
            console.error("Error updating prices", error);
            alert("Failed to update prices.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content bento-card" style={{ maxWidth: '400px', width: '90%' }}>
                <div className="card-header" style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <i className="fa-solid fa-tags" style={{ color: 'var(--primary)' }}></i>
                        Update Prices
                    </h3>
                    <button type="button" className="action-btn text-btn" onClick={onClose}><i className="fa-solid fa-xmark"></i></button>
                </div>

                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '-1rem' }}>Set your buying prices for the crops in {mill.millName}</p>

                    {mill.selectedCrops?.map(crop => (
                        <div key={crop}>
                            <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-main)', fontSize: '0.9rem' }}>{crop} Price (₹/Quintal)</label>
                            <div className="input-group">
                                <i className="fa-solid fa-indian-rupee-sign"></i>
                                <input
                                    type="number"
                                    placeholder="Enter price..."
                                    value={prices[crop] || ''}
                                    onChange={(e) => handlePriceChange(crop, parseInt(e.target.value) || '')}
                                    min="0"
                                />
                            </div>
                        </div>
                    ))}

                    {(!mill.selectedCrops || mill.selectedCrops.length === 0) && (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No crops registered for this mill.</p>
                    )}

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" className="text-btn" onClick={onClose} style={{ flex: 1, padding: '1rem', justifyContent: 'center' }}>Cancel</button>
                        <button type="submit" className="primary-btn" disabled={isSaving} style={{ flex: 1, justifyContent: 'center', padding: '1rem' }}>
                            {isSaving ? 'Saving...' : 'Save Prices'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
