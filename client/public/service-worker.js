/* eslint-disable no-restricted-globals, no-undef */

// Service Worker pour StockMedi - Avec détection de mise à jour
const CACHE_NAME = 'stockmedi-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json'
];

// Installation
self.addEventListener('install', (event) => {
    console.log('📦 [SW] Installation...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
            .then(() => self.skipWaiting())
    );
});

// Activation - Nettoyer les anciens caches
self.addEventListener('activate', (event) => {
    console.log('✅ [SW] Activé');
    event.waitUntil(
        Promise.all([
            clients.claim(),
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((cacheName) => cacheName !== CACHE_NAME)
                        .map((cacheName) => {
                            console.log('🗑️ [SW] Suppression ancien cache:', cacheName);
                            return caches.delete(cacheName);
                        })
                );
            })
        ])
    );
});

// Stratégie Network First (toujours chercher la dernière version)
self.addEventListener('fetch', (event) => {
    // Ignorer les requêtes API
    if (event.request.url.includes('/api/')) {
        return;
    }
    
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Mettre en cache la nouvelle version
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseClone);
                });
                return response;
            })
            .catch(() => {
                // Fallback sur le cache
                return caches.match(event.request);
            })
    );
});

// Écouter les messages SKIP_WAITING
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        console.log('⏩ [SW] Skip waiting...');
        self.skipWaiting();
    }
});