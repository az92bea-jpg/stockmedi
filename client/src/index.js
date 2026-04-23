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

// ========== SERVICE WORKER AVEC MISE À JOUR SILENCIEUSE ==========
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register('/service-worker.js')
            .then((registration) => {
                console.log('✅ Service Worker enregistré:', registration.scope);
                
                // Détection de mise à jour
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    if (!newWorker) return;
                    
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('🆕 Nouvelle version disponible !');
                            
                            // Forcer l'activation immédiate
                            newWorker.postMessage({ type: 'SKIP_WAITING' });
                            
                            // Émettre l'événement pour le bandeau vert
                            window.dispatchEvent(new CustomEvent('pwaUpdateAvailable', { 
                                detail: { registration } 
                            }));
                        }
                    });
                });
                
                // Quand le nouveau Service Worker prend le contrôle, recharger
                navigator.serviceWorker.addEventListener('controllerchange', () => {
                    console.log('🔄 Nouveau contrôleur actif, rechargement...');
                    window.location.reload();
                });
                
                // Vérifier périodiquement les mises à jour (toutes les heures)
                setInterval(() => {
                    console.log('🔄 Vérification de mise à jour...');
                    registration.update();
                }, 60 * 60 * 1000); // 1 heure
                
            })
            .catch((error) => {
                console.error('❌ Erreur Service Worker:', error);
            });
    });
}