/**
 * COMPOSANT LOADER - Indicateur de chargement
 */

import React from 'react';

const Loader = ({ size = 'md', fullScreen = false }) => {
    const sizeMap = {
        sm: '20px',
        md: '40px',
        lg: '60px'
    };

    const loaderStyle = {
        width: sizeMap[size],
        height: sizeMap[size],
        border: `3px solid var(--gray-200)`,
        borderTop: `3px solid var(--primary-500)`,
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
    };

    const containerStyle = fullScreen ? {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.9)',
        zIndex: 9999
    } : {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--spacing-8)'
    };

    return (
        <div style={containerStyle}>
            <div style={loaderStyle} />
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default Loader;