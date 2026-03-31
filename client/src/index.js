import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';


// Enregistrement du Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('✅ Service Worker enregistré:', registration.scope);
            })
            .catch((error) => {
                console.error('❌ Erreur Service Worker:', error);
            });
    });
}


// ========== GESTION PWA ==========
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    // Empêcher l'affichage automatique
    e.preventDefault();
    // Stocker l'événement
    deferredPrompt = e;
    console.log('✅ PWA peut être installée');
    
    // Afficher une notification personnalisée
    window.dispatchEvent(new CustomEvent('pwa-ready', { detail: deferredPrompt }));
});

// Écouter l'installation
window.addEventListener('appinstalled', () => {
    console.log('✅ PWA installée avec succès');
    deferredPrompt = null;
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);