/**
 * SERVICEWORKER REGISTRATION
 * ⭐ Détection automatique des mises à jour PWA
 * ⭐ Skip waiting pour activation immédiate
 */

// Vérifier les mises à jour toutes les 4 heures
const UPDATE_CHECK_INTERVAL = 4 * 60 * 60 * 1000; // 4 heures en ms

export function register(config) {
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
        const publicUrl = new URL(process.env.PUBLIC_URL, window.location.href);
        if (publicUrl.origin !== window.location.origin) {
            return;
        }

        window.addEventListener('load', () => {
            const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

            registerValidSW(swUrl, config);
            
            // ⭐ Vérification périodique des mises à jour (toutes les 4h)
            setInterval(() => {
                checkForUpdates();
            }, UPDATE_CHECK_INTERVAL);
        });
    }
}

/**
 * Vérifier si une mise à jour est disponible
 */
async function checkForUpdates() {
    if (!navigator.serviceWorker) return;
    
    try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
            await registration.update();
            console.log('🔄 [PWA] Vérification de mise à jour silencieuse...');
        }
    } catch (error) {
        console.error('❌ [PWA] Erreur vérification mise à jour:', error);
    }
}

/**
 * Enregistrer un service worker valide
 */
function registerValidSW(swUrl, config) {
    navigator.serviceWorker
        .register(swUrl)
        .then((registration) => {
            console.log('✅ [PWA] Service Worker enregistré');
            
            // Détecter les mises à jour
            registration.onupdatefound = () => {
                const installingWorker = registration.installing;
                if (installingWorker == null) return;
                
                installingWorker.onstatechange = () => {
                    if (installingWorker.state === 'installed') {
                        if (navigator.serviceWorker.controller) {
                            console.log('🆕 [PWA] Nouvelle version disponible !');
                            
                            // ⭐ Émettre un événement personnalisé pour App.js
                            window.dispatchEvent(new CustomEvent('pwaUpdateAvailable', { 
                                detail: { registration } 
                            }));
                            
                            // Appeler le callback onUpdate si fourni
                            if (config && config.onUpdate) {
                                config.onUpdate(registration);
                            }
                        } else {
                            console.log('📦 [PWA] Contenu mis en cache pour utilisation hors ligne');
                            if (config && config.onSuccess) {
                                config.onSuccess(registration);
                            }
                        }
                    }
                };
            };
            
            // Forcer l'activation immédiate du nouveau service worker
            if (registration.waiting) {
                registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            }
            
        })
        .catch((error) => {
            console.error('❌ [PWA] Erreur enregistrement Service Worker:', error);
        });
    
    // Écouter les messages du service worker (skip waiting)
    navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SKIP_WAITING') {
            navigator.serviceWorker.ready.then(registration => {
                if (registration.waiting) {
                    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                }
            });
        }
    });
    
    // Rafraîchir la page quand le nouveau service worker prend le contrôle
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
            refreshing = true;
            console.log('🔄 [PWA] Nouveau contrôleur activé, rechargement...');
            window.location.reload();
        }
    });
}

/**
 * Désenregistrer le service worker
 */
export function unregister() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready
            .then((registration) => {
                registration.unregister();
            })
            .catch((error) => {
                console.error('❌ [PWA] Erreur désenregistrement:', error.message);
            });
    }
}