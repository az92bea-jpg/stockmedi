import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/main.css';
import App from './App';

// ========== GESTION PWA - INSTALLATION ==========
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    console.log('✅ PWA peut être installée');
    window.dispatchEvent(new CustomEvent('pwa-ready', { detail: deferredPrompt }));
});

window.addEventListener('appinstalled', () => {
    console.log('✅ PWA installée avec succès');
    deferredPrompt = null;
});

// ========== RENDU REACT ==========
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);

// ========== SERVICE WORKER AVEC DÉTECTION DE MISE À JOUR ==========
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register('/service-worker.js')
            .then((registration) => {
                console.log('✅ Service Worker enregistré:', registration.scope);
                
                // ⭐ Détection de mise à jour
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    if (!newWorker) return;
                    
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('🆕 Nouvelle version disponible !');
                            
                            // ⭐ Émettre l'événement pour le bandeau
                            window.dispatchEvent(new CustomEvent('pwaUpdateAvailable', { 
                                detail: { registration } 
                            }));
                        }
                    });
                });
                
                // ⭐ Vérifier périodiquement les mises à jour (toutes les 4 heures)
                setInterval(() => {
                    console.log('🔄 Vérification de mise à jour...');
                    registration.update();
                }, 4 * 60 * 60 * 1000); // 4 heures
                
            })
            .catch((error) => {
                console.error('❌ Erreur Service Worker:', error);
            });
    });
}