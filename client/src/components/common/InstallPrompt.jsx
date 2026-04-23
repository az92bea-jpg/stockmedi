/**
 * COMPOSANT INSTALL PROMPT - Bannière d'installation PWA
 * ⭐ Traductions FR/EN complètes
 */

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';

const InstallPrompt = () => {
    const { t } = useLanguage();
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        // Vérifier si déjà installé
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
            return;
        }

        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowPrompt(true);
            console.log('🎯 Bannière prête à afficher');
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstall = () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('✅ ' + t('pwa_accepted'));
                    setShowPrompt(false);
                } else {
                    console.log('❌ ' + t('pwa_declined'));
                    setDismissed(true);
                    setShowPrompt(false);
                }
                setDeferredPrompt(null);
            });
        }
    };

    const handleDismiss = () => {
        setDismissed(true);
        setShowPrompt(false);
    };

    if (isInstalled || dismissed || !showPrompt) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            left: '20px',
            maxWidth: '400px',
            margin: '0 auto',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
            padding: '16px',
            zIndex: 9999,
            animation: 'slideUp 0.3s ease'
        }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span style={{ fontSize: '2rem' }}>💊</span>
                <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, fontSize: '1rem', color: '#111827' }}>
                        {t('install_app_title')}
                    </h4>
                    <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#6B7280' }}>
                        {t('install_app_subtitle')}
                    </p>
                </div>
                <button
                    onClick={handleInstall}
                    style={{
                        backgroundColor: '#0F6B3A',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.875rem'
                    }}
                >
                    {t('install')}
                </button>
                <button
                    onClick={handleDismiss}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1.25rem',
                        color: '#9CA3AF'
                    }}
                >
                    ✕
                </button>
            </div>
            <style>{`
                @keyframes slideUp {
                    from {
                        transform: translateY(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
};

export default InstallPrompt;