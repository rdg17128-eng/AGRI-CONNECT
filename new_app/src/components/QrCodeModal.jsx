import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import KisanLogo from './KisanLogo';

export default function QrCodeModal({ enquiry, onClose }) {
    const [qrDataUrl, setQrDataUrl] = useState('');
    const [copied, setCopied] = useState(false);

    const enquiryCode = enquiry?.enquiry_code || enquiry?.id || 'KC-2026-000000';

    useEffect(() => {
        if (!enquiryCode) return;
        // The QR code contains ONLY the secure identifier
        QRCode.toDataURL(enquiryCode, {
            width: 320,
            margin: 2,
            color: {
                dark: '#022c22', // Deep forest emerald
                light: '#ffffff'  // Clean white
            },
            errorCorrectionLevel: 'H'
        })
            .then(url => setQrDataUrl(url))
            .catch(err => console.error("QR Code generation error:", err));
    }, [enquiryCode]);

    const handleDownload = () => {
        if (!qrDataUrl) return;
        const link = document.createElement('a');
        link.href = qrDataUrl;
        link.download = `KisanConnect-QR-${enquiryCode}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                // If possible, create file from dataUrl for sharing
                const res = await fetch(qrDataUrl);
                const blob = await res.blob();
                const file = new File([blob], `KisanConnect-QR-${enquiryCode}.png`, { type: 'image/png' });

                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        title: `Crop Verification QR - ${enquiryCode}`,
                        text: `KisanConnect Verification QR for Enquiry ${enquiryCode} (${enquiry.crop_name} - ${enquiry.quantity || enquiry.acres} Tons).`,
                        files: [file]
                    });
                    return;
                }

                await navigator.share({
                    title: `Crop Verification QR - ${enquiryCode}`,
                    text: `KisanConnect Verification QR Code: ${enquiryCode} for ${enquiry.crop_name} to ${enquiry.mill_name || 'Mill'}.`,
                    url: window.location.href
                });
            } catch (err) {
                if (err.name !== 'AbortError') {
                    fallbackCopy();
                }
            }
        } else {
            fallbackCopy();
        }
    };

    const fallbackCopy = () => {
        navigator.clipboard.writeText(`KisanConnect Crop Verification ID: ${enquiryCode} | Crop: ${enquiry.crop_name} | Quantity: ${enquiry.quantity || enquiry.acres} Tons | Mill: ${enquiry.mill_name}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
    };

    return (
        <div className="modal-overlay" style={{ zIndex: 9999, animation: 'fadeIn 0.25s ease-out' }}>
            <div 
                className="modal-content bento-card" 
                style={{ 
                    maxWidth: '480px', 
                    width: '92%', 
                    padding: '2rem 1.75rem',
                    textAlign: 'center',
                    background: 'var(--card-bg)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(16, 185, 129, 0.15)'
                }}
            >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <KisanLogo size="sm" />
                    <button className="action-btn text-btn" onClick={onClose} style={{ padding: '0.4rem' }}>
                        <i className="fa-solid fa-xmark" style={{ fontSize: '1.2rem' }}></i>
                    </button>
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.9rem', borderRadius: '2rem', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                        <i className="fa-solid fa-circle-check"></i>
                        <span>Enquiry Accepted</span>
                    </div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0.25rem 0' }}>Crop Verification QR</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                        Show this QR code to the mill gate operator upon delivery
                    </p>
                </div>

                {/* QR Code Container with High-Contrast Frame */}
                <div 
                    style={{
                        background: '#ffffff',
                        padding: '1.25rem',
                        borderRadius: '1.25rem',
                        display: 'inline-block',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.35)',
                        border: '3px solid var(--primary)',
                        marginBottom: '1.25rem',
                        position: 'relative'
                    }}
                >
                    {qrDataUrl ? (
                        <img 
                            src={qrDataUrl} 
                            alt={`QR for ${enquiryCode}`} 
                            style={{ width: '220px', height: '220px', display: 'block' }}
                        />
                    ) : (
                        <div style={{ width: '220px', height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                            <i className="fa-solid fa-spinner fa-spin fa-2x"></i>
                        </div>
                    )}
                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', fontWeight: 700, color: '#064e3b', letterSpacing: '1px' }}>
                        SCAN TO VERIFY LOAD
                    </div>
                </div>

                {/* Enquiry Details Badge */}
                <div 
                    style={{ 
                        background: 'rgba(255, 255, 255, 0.04)', 
                        borderRadius: '1rem', 
                        padding: '1rem', 
                        marginBottom: '1.5rem',
                        textAlign: 'left',
                        fontSize: '0.85rem',
                        border: '1px solid rgba(255, 255, 255, 0.06)'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Enquiry ID:</span>
                        <strong style={{ color: 'var(--accent-gold)', fontFamily: 'monospace', fontSize: '0.95rem' }}>{enquiryCode}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Crop & Quantity:</span>
                        <strong style={{ color: 'var(--text-main)' }}>{enquiry?.crop_name} ({enquiry?.quantity || (enquiry?.acres ? `${enquiry.acres * 2} Tons` : '10 Tons')})</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Assigned Mill:</span>
                        <strong style={{ color: 'var(--text-main)' }}>{enquiry?.mill_name || 'Authorized Mill'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Transport:</span>
                        <span style={{ color: enquiry?.transport_required ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 600 }}>
                            {enquiry?.transport_required ? '✓ KisanConnect Logistics' : 'Self Arranged'}
                        </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                        <span className="status-badge" style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.2)', color: 'var(--primary)' }}>
                            {enquiry?.load_status || enquiry?.status || 'ACCEPTED'}
                        </span>
                    </div>
                </div>

                {/* Actions: Download & Share */}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button 
                        className="action-btn"
                        onClick={handleShare}
                        style={{ 
                            flex: 1, 
                            justifyContent: 'center', 
                            padding: '0.85rem',
                            background: 'rgba(255, 255, 255, 0.08)',
                            color: 'var(--text-main)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: '0.75rem',
                            fontWeight: 600
                        }}
                    >
                        <i className="fa-solid fa-share-nodes"></i>
                        {copied ? 'Copied Details!' : 'Share QR'}
                    </button>

                    <button 
                        className="primary-btn"
                        onClick={handleDownload}
                        style={{ 
                            flex: 1, 
                            justifyContent: 'center', 
                            padding: '0.85rem',
                            borderRadius: '0.75rem',
                            fontWeight: 600
                        }}
                    >
                        <i className="fa-solid fa-download"></i>
                        Download QR
                    </button>
                </div>
            </div>
        </div>
    );
}
