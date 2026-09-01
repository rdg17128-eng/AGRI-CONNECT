import React from 'react';

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("KisanConnect runtime error caught by boundary:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#050d09',
                    color: '#f0f8f4',
                    padding: '2rem',
                    textAlign: 'center',
                    fontFamily: 'system-ui, sans-serif'
                }}>
                    <i className="fa-solid fa-seedling" style={{ fontSize: '3rem', color: '#10b981', marginBottom: '1.5rem' }}></i>
                    <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', fontWeight: 800 }}>KisanConnect Workspace</h2>
                    <p style={{ color: '#8ba699', maxWidth: '480px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                        Session updated. Click below to continue.
                    </p>
                    <button
                        onClick={() => {
                            window.location.href = '/';
                        }}
                        style={{
                            background: 'linear-gradient(135deg, #10b981, #047857)',
                            border: '1px solid #34d399',
                            color: '#022013',
                            padding: '0.75rem 1.75rem',
                            borderRadius: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            fontSize: '0.95rem'
                        }}
                    >
                        Return to Dashboard
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}
