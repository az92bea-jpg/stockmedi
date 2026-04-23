import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/main.css';
import App from './App';

// ========== RENDU REACT ==========
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);

// ========== SERVICE WORKER AVEC MISE À JOUR ==========
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register('/service-worker.js')
            .then((registration) => {
                console.log('✅ Service Worker enregistré:', registration.scope);
                
                // Vérifier si une mise à jour est déjà en attente
                if (registration.waiting) {
                    console.log('🆕 Mise à jour en attente détectée au chargement');
                    window.dispatchEvent(new CustomEvent('pwaUpdateAvailable', { 
                        detail: { registration } 
                    }));
                }
                
                // Détection de nouvelle mise à jour
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    if (!newWorker) return;
                    
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('🆕 Nouvelle version disponible !');
                            
                            window.dispatchEvent(new CustomEvent('pwaUpdateAvailable', { 
                                detail: { registration } 
                            }));
                        }
                    });
                });
                
                // Recharger quand le nouveau Service Worker prend le contrôle
                navigator.serviceWorker.addEventListener('controllerchange', () => {
                    console.log('🔄 Nouveau contrôleur actif, rechargement...');
                    window.location.reload();
                });
                
                // Vérifier les mises à jour toutes les heures
                setInterval(() => {
                    console.log('🔄 Vérification de mise à jour...');
                    registration.update();
                }, 60 * 60 * 1000);
                
            })
            .catch((error) => {
                console.error('❌ Erreur Service Worker:', error);
            });
    });
}