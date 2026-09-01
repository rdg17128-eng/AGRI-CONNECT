import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { kisanService } from '../services/kisanService';
import KisanLogo from './KisanLogo';

export default function QrScannerModal({ loggedInMill, onClose, onVerificationSuccess }) {
    const [scanState, setScanState] = useState('scanning'); // 'scanning' | 'verifying' | 'result'
    const [scanError, setScanError] = useState(null);
    const [manualCode, setManualCode] = useState('');
    const [verificationResult, setVerificationResult] = useState(null);
    const [isConfirmingLoad, setIsConfirmingLoad] = useState(false);
    const [isReceiving, setIsReceiving] = useState(false);
    const [loadReceivedSuccess, setLoadReceivedSuccess] = useState(false);

    const scannerRef = useRef(null);
    const qrRegionId = "kisan-qr-reader-viewport";

    const stopCamera = async () => {
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop();
                scannerRef.current.clear();
            } catch (err) {
                console.debug("Camera stop notice:", err);
            }
        }
    };

    const handleQrDetected = async (code) => {
        await stopCamera();
        setScanState('verifying');
        setScanError(null);

        try {
            const result = await kisanService.verifyScannedQr(code, loggedInMill);
            setVerificationResult(result);
            setScanState('result');
        } catch (err) {
            console.error("Verification error:", err);
            setScanError("Failed to verify QR with database. Please try again.");
            setScanState('scanning');
        }
    };

    useEffect(() => {
        let html5QrCode = null;

        const startScanner = async () => {
            try {
                html5QrCode = new Html5Qrcode(qrRegionId);
                scannerRef.current = html5QrCode;

                const config = {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0
                };

                await html5QrCode.start(
                    { facingMode: "environment" },
                    config,
                    (decodedText) => {
                        handleQrDetected(decodedText);
                    },
                    () => {
                        // Suppress background frame parsing errors
                    }
                );
            } catch (err) {
                console.warn("Camera start failed, fallback to file/manual:", err);
                setScanError("Camera access unavailable. You can enter the Enquiry ID manually or upload a QR image.");
            }
        };

        if (scanState === 'scanning') {
            startScanner();
        }

        return () => {
            if (scannerRef.current) {
                try {
                    scannerRef.current.stop().then(() => scannerRef.current.clear()).catch(() => {});
                } catch (err) {
                    console.debug("Cleanup notice:", err);
                }
            }
        };
    }, [scanState]);

    const handleManualSubmit = (e) => {
        e.preventDefault();
        if (!manualCode.trim()) return;
        handleQrDetected(manualCode.trim());
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const html5QrCode = new Html5Qrcode(qrRegionId);
            const decodedText = await html5QrCode.scanFile(file, true);
            handleQrDetected(decodedText);
        } catch (err) {
            alert("Could not detect a valid QR code in this image.");
        }
    };

    const handleConfirmLoadReceived = async () => {
        if (!verificationResult?.enquiry?.enquiry_code) return;
        setIsReceiving(true);
        try {
            const loadRecord = await kisanService.acceptLoad(
                verificationResult.enquiry.enquiry_code,
                loggedInMill
            );
            setIsReceiving(false);
            setIsConfirmingLoad(false);
            setLoadReceivedSuccess(true);
            if (onVerificationSuccess) {
                onVerificationSuccess(loadRecord);
            }
        } catch (err) {
            console.error("Error receiving load:", err);
            alert("Failed to confirm load. Please try again.");
            setIsReceiving(false);
        }
    };

    const eq = verificationResult?.enquiry;

    return (
        <div className="modal-overlay" style={{ zIndex: 9999, animation: 'fadeIn 0.25s ease-out' }}>
            <div 
                className="modal-content bento-card" 
                style={{ 
                    maxWidth: '560px', 
                    width: '92%', 
                    maxHeight: '92vh',
                    overflowY: 'auto',
                    padding: '2rem 1.75rem',
                    background: 'var(--card-bg)',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 35px rgba(16, 185, 129, 0.15)'
                }}
            >
                {/* Modal Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <i className="fa-solid fa-qrcode" style={{ color: 'var(--primary)', fontSize: '1.3rem' }}></i>
                        <h3 style={{ margin: 0, fontSize: '1.25rem' }}>
                            {scanState === 'result' ? 'Load Verification Result' : 'Scan Farmer Crop QR'}
                        </h3>
                    </div>
                    <button className="action-btn text-btn" onClick={onClose}>
                        <i className="fa-solid fa-xmark" style={{ fontSize: '1.2rem' }}></i>
                    </button>
                </div>

                {/* ================================================= */}
                {/* STATE 1: SCANNING (Camera + File + Manual Fallback) */}
                {/* ================================================= */}
                {scanState === 'scanning' && (
                    <div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem', textAlign: 'center' }}>
                            Point camera at the farmer's QR code to verify crop authorization
                        </p>

                        {/* Viewport for html5-qrcode video */}
                        <div 
                            style={{ 
                                background: '#000', 
                                borderRadius: '1rem', 
                                overflow: 'hidden', 
                                border: '2px solid rgba(16, 185, 129, 0.4)',
                                position: 'relative',
                                minHeight: '260px'
                            }}
                        >
                            <div id={qrRegionId} style={{ width: '100%' }}></div>
                            
                            {/* Scanning Guide Frame Overlay */}
                            <div style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                width: '200px',
                                height: '200px',
                                border: '2px dashed #10b981',
                                borderRadius: '16px',
                                pointerEvents: 'none',
                                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.35)'
                            }}></div>
                        </div>

                        {scanError && (
                            <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '0.75rem', marginTop: '1rem', color: '#fca5a5', fontSize: '0.85rem' }}>
                                <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '0.5rem' }}></i>
                                {scanError}
                            </div>
                        )}

                        {/* File Upload or Manual Entry Alternative */}
                        <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                <span style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></span>
                                <span>OR ENTER ENQUIRY CODE</span>
                                <span style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></span>
                            </div>

                            <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
                                <input 
                                    type="text" 
                                    placeholder="e.g. KC-2026-000123"
                                    value={manualCode}
                                    onChange={(e) => setManualCode(e.target.value)}
                                    style={{
                                        flex: 1,
                                        padding: '0.75rem 1rem',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '0.75rem',
                                        color: 'var(--text-main)',
                                        fontFamily: 'monospace',
                                        fontSize: '0.95rem'
                                    }}
                                />
                                <button type="submit" className="primary-btn" style={{ padding: '0.75rem 1.25rem', borderRadius: '0.75rem' }}>
                                    Verify
                                </button>
                            </form>

                            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.7rem', background: 'rgba(255, 255, 255, 0.04)', border: '1px dashed rgba(255, 255, 255, 0.2)', borderRadius: '0.75rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                <i className="fa-solid fa-image"></i>
                                <span>Upload QR Image File</span>
                                <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                            </label>
                        </div>
                    </div>
                )}

                {/* ================================================= */}
                {/* STATE 2: VERIFYING LOADER */}
                {/* ================================================= */}
                {scanState === 'verifying' && (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                        <i className="fa-solid fa-spinner fa-spin fa-3x" style={{ color: 'var(--primary)', marginBottom: '1rem' }}></i>
                        <h4>Verifying with KisanConnect Supabase...</h4>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Authenticating digital load manifest and mill matching rules</p>
                    </div>
                )}

                {/* ================================================= */}
                {/* STATE 3: VERIFICATION RESULT */}
                {/* ================================================= */}
                {scanState === 'result' && (
                    <div>
                        {!verificationResult?.success ? (
                            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '1.8rem' }}>
                                    <i className="fa-solid fa-xmark"></i>
                                </div>
                                <h3 style={{ color: '#ef4444', marginBottom: '0.5rem' }}>Invalid or Unrecognized QR</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                                    {verificationResult?.message || "No matching enquiry could be found."}
                                </p>
                                <button className="primary-btn" onClick={() => setScanState('scanning')} style={{ margin: '0 auto' }}>
                                    Scan Another Code
                                </button>
                            </div>
                        ) : (
                            <div>
                                {/* Status Banner: VERIFIED MATCH vs NOT MATCHED */}
                                <div 
                                    style={{ 
                                        padding: '1rem', 
                                        borderRadius: '1rem', 
                                        marginBottom: '1.5rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        background: verificationResult.isMatch 
                                            ? 'rgba(16, 185, 129, 0.15)' 
                                            : 'rgba(239, 68, 68, 0.15)',
                                        border: `1px solid ${verificationResult.isMatch ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`
                                    }}
                                >
                                    <div style={{ 
                                        width: '40px', 
                                        height: '40px', 
                                        borderRadius: '50%', 
                                        background: verificationResult.isMatch ? '#10b981' : '#ef4444', 
                                        color: '#fff', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        fontSize: '1.2rem',
                                        flexShrink: 0 
                                    }}>
                                        <i className={`fa-solid ${verificationResult.isMatch ? 'fa-check' : 'fa-ban'}`}></i>
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 800, fontSize: '1rem', color: verificationResult.isMatch ? '#10b981' : '#ef4444' }}>
                                            {verificationResult.isMatch ? '🟢 VERIFIED MATCH TO THIS MILL' : '🔴 NOT MATCHED TO THIS MILL'}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            {verificationResult.isMatch 
                                                ? 'This load is fully authorized and routed to your mill facility.' 
                                                : `Warning: This enquiry is assigned to "${eq?.mill_name || 'Another Mill'}". You are not authorized to accept it.`}
                                        </div>
                                    </div>
                                </div>

                                {loadReceivedSuccess ? (
                                    <div style={{ textAlign: 'center', padding: '2rem 1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '1rem', border: '1px solid var(--primary)', marginBottom: '1.5rem' }}>
                                        <i className="fa-solid fa-circle-check fa-3x" style={{ color: 'var(--primary)', marginBottom: '1rem' }}></i>
                                        <h3 style={{ color: 'var(--primary)', margin: '0 0 0.5rem 0' }}>Load Successfully Received!</h3>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
                                            Transaction permanently recorded in KisanConnect ledger. The farmer has been notified in real time.
                                        </p>
                                    </div>
                                ) : (
                                    /* Verified Crop Details Grid */
                                    <div 
                                        style={{ 
                                            background: 'rgba(255, 255, 255, 0.03)', 
                                            borderRadius: '1rem', 
                                            padding: '1.25rem', 
                                            marginBottom: '1.5rem',
                                            border: '1px solid rgba(255, 255, 255, 0.08)'
                                        }}
                                    >
                                        <h4 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', color: 'var(--primary)' }}>
                                            <i className="fa-solid fa-clipboard-check"></i>
                                            Farmer Load Verification Sheet
                                        </h4>

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.85rem', fontSize: '0.85rem' }}>
                                            <div>
                                                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Enquiry ID</span>
                                                <strong style={{ color: 'var(--accent-gold)', fontFamily: 'monospace' }}>{eq?.enquiry_code}</strong>
                                            </div>
                                            <div>
                                                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Farmer Name</span>
                                                <strong>{eq?.farmer_name}</strong>
                                            </div>
                                            <div>
                                                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Farmer Contact</span>
                                                <span>{eq?.farmer_phone}</span>
                                            </div>
                                            <div>
                                                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Crop Type</span>
                                                <strong>{eq?.crop_name}</strong>
                                            </div>
                                            <div>
                                                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Quantity / Acreage</span>
                                                <strong>{eq?.quantity || (eq?.acres ? `${eq.acres * 2} Tons` : '10 Tons')} ({eq?.acres || 'N/A'} Acres)</strong>
                                            </div>
                                            <div>
                                                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Offered Price</span>
                                                <strong style={{ color: 'var(--primary)' }}>₹{eq?.offered_price || eq?.expected_price || 'Market Rate'}</strong>
                                            </div>
                                            <div>
                                                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Farmer Location</span>
                                                <span>{eq?.farmer_location_name || 'Farm Coordinates'}</span>
                                            </div>
                                            <div>
                                                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Transport Option</span>
                                                <span>{eq?.transport_required ? 'KisanConnect Fleet' : 'Farmer Self-Arranged'}</span>
                                            </div>
                                            <div>
                                                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Enquiry Date</span>
                                                <span>{new Date(eq?.created_at).toLocaleDateString('en-IN')}</span>
                                            </div>
                                            <div>
                                                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Acceptance Date</span>
                                                <span>{eq?.accepted_at ? new Date(eq.accepted_at).toLocaleDateString('en-IN') : 'Confirmed'}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                {!loadReceivedSuccess && (
                                    <div>
                                        {isConfirmingLoad ? (
                                            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '1rem', border: '1px solid var(--primary)', marginBottom: '1rem', textAlign: 'center' }}>
                                                <p style={{ fontWeight: 700, margin: '0 0 0.75rem 0', fontSize: '0.95rem' }}>
                                                    Confirm that this crop/load has been received by the mill?
                                                </p>
                                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                                    <button 
                                                        className="text-btn" 
                                                        onClick={() => setIsConfirmingLoad(false)}
                                                        style={{ flex: 1, justifyContent: 'center' }}
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button 
                                                        className="primary-btn"
                                                        onClick={handleConfirmLoadReceived}
                                                        disabled={isReceiving}
                                                        style={{ flex: 1, justifyContent: 'center' }}
                                                    >
                                                        {isReceiving ? 'Confirming...' : 'Confirm Load Received'}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                                <button 
                                                    className="action-btn"
                                                    onClick={() => setScanState('scanning')}
                                                    style={{ flex: 1, justifyContent: 'center', padding: '0.85rem' }}
                                                >
                                                    <i className="fa-solid fa-redo"></i>
                                                    Scan Another
                                                </button>

                                                {verificationResult.isMatch && (
                                                    <button 
                                                        className="primary-btn"
                                                        onClick={() => setIsConfirmingLoad(true)}
                                                        disabled={eq?.load_status === 'LOAD_RECEIVED'}
                                                        style={{ 
                                                            flex: 2, 
                                                            justifyContent: 'center', 
                                                            padding: '0.85rem',
                                                            background: eq?.load_status === 'LOAD_RECEIVED' ? '#4b5563' : 'var(--primary)'
                                                        }}
                                                    >
                                                        <i className="fa-solid fa-truck-ramp-box"></i>
                                                        {eq?.load_status === 'LOAD_RECEIVED' ? 'Already Received' : 'Accept Load'}
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {loadReceivedSuccess && (
                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                        <button 
                                            className="primary-btn" 
                                            onClick={onClose}
                                            style={{ flex: 1, justifyContent: 'center', padding: '0.85rem' }}
                                        >
                                            Done
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
