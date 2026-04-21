import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/main.css';  // ⭐ AJOUTER CETTE LIGNE
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

// ========== SERVICE WORKER PAR DÉFAUT (CRA) ==========
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register('/service-worker.js')
            .then((registration) => {
                console.log('✅ Service Worker enregistré:', registration.scope);
            })
            .catch((error) => {
                console.error('❌ Erreur Service Worker:', error);
            });
    });
}