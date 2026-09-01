import React from 'react';

export default function KisanLogo({ size = 'md', showText = true, className = '', style = {} }) {
    // Sizes: sm (28px icon), md (38px icon), lg (52px icon), xl (68px icon)
    const iconSizes = {
        sm: { width: 28, height: 28, fontSize: '1.25rem' },
        md: { width: 38, height: 38, fontSize: '1.65rem' },
        lg: { width: 52, height: 52, fontSize: '2.2rem' },
        xl: { width: 68, height: 68, fontSize: '2.8rem' }
    };

    const current = iconSizes[size] || iconSizes.md;

    return (
        <div 
            className={`kisan-logo-container ${className}`} 
            style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: size === 'sm' ? '0.5rem' : size === 'lg' ? '0.9rem' : '0.75rem',
                userSelect: 'none',
                ...style 
            }}
        >
            <div 
                className="kisan-logo-icon-wrap"
                style={{
                    width: `${current.width}px`,
                    height: `${current.height}px`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    filter: 'drop-shadow(0 0 12px rgba(16, 185, 129, 0.45))',
                    transition: 'transform 0.3s ease, filter 0.3s ease'
                }}
            >
                <img 
                    src="/kisanconnect-logo.svg" 
                    alt="KisanConnect Logo" 
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
            </div>

            {showText && (
                <span 
                    className="kisan-logo-text"
                    style={{ 
                        fontSize: current.fontSize, 
                        fontWeight: 800, 
                        letterSpacing: '-0.03em',
                        display: 'flex',
                        alignItems: 'center',
                        lineHeight: 1
                    }}
                >
                    <span className="logo-kisan">Kisan</span>
                    <span className="logo-connect">Connect</span>
                </span>
            )}
        </div>
    );
}
