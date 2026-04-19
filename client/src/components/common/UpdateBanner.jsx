/**
 * COMPOSANT UPDATE BANNER - Bandeau de mise à jour PWA
 * ⭐ Affiché uniquement quand une nouvelle version est disponible
 * ⭐ Position non intrusive (bas de l'écran)
 */

import React from 'react';
import Icon from '../ui/Icon';
import { useLanguage } from '../../context/LanguageContext';

const UpdateBanner = ({ onUpdate, onDismiss }) => {
    const { t } = useLanguage();

    return (
        <div style={{
            position: 'fixed',
            bottom: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'var(--success, #10B981)',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '40px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            maxWidth: 'calc(100vw - 32px)',
            width: 'auto',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(8px)',
            animation: 'slideUp 0.3s ease-out'
        }}>
            <Icon name="success" category="status" fallback="🔄" style={{ width: '20px', height: '20px', filter: 'brightness(0) invert(1)' }} />
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                {t('update_available') || 'Une nouvelle version est disponible !'}
            </span>
            <button 
                onClick={onUpdate}
                style={{
                    backgroundColor: 'white',
                    color: 'var(--success, #10B981)',
                    border: 'none',
                    padding: '6px 16px',
                    borderRadius: '30px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    marginLeft: '4px'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                    e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.transform = 'scale(1)';
                }}
            >
                {t('update_now') || 'Mettre à jour'}
            </button>
            {onDismiss && (
                <button 
                    onClick={onDismiss}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'rgba(255, 255, 255, 0.7)',
                        cursor: 'pointer',
                        padding: '4px',
                        marginLeft: '-4px',
                        fontSize: '16px',
                        lineHeight: 1
                    }}
                >
                    ✕
                </button>
            )}
        </div>
    );
};

// ⭐ Ajouter l'animation CSS globalement (à mettre dans index.css ou App.css)
const style = document.createElement('style');
style.textContent = `
    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }
`;
if (!document.querySelector('#pwa-animations')) {
    style.id = 'pwa-animations';
    document.head.appendChild(style);
}

export default UpdateBanner;