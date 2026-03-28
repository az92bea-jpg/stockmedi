/* eslint-disable no-restricted-globals */
/* eslint-disable no-undef */

/**
 * STOCKMEDI - SERVICE WORKER
 * Gestion du cache hors ligne
 */

const CACHE_NAME = 'stockmedi-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    '/favicon.ico',
    '/logo192.png',
    '/logo512.png'
];

// Installation
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 Cache ouvert');
                return cache.addAll(urlsToCache);
            })
            .catch((err) => console.error('Erreur cache:', err))
    );
    self.skipWaiting();
});

// Interception des requêtes
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }
                return fetch(event.request)
                    .then((networkResponse) => {
                        // Ne pas mettre en cache les requêtes API
                        if (!event.request.url.includes('/api/')) {
                            const responseToCache = networkResponse.clone();
                            caches.open(CACHE_NAME)
                                .then((cache) => {
                                    cache.put(event.request, responseToCache);
                                });
                        }
                        return networkResponse;
                    });
            })
    );
});

// Activation
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('🗑️ Ancien cache supprimé:', cache);
                        return caches.delete(cache);
                    }
                    return null;
                })
            );
        })
    );
    self.clients.claim();
});