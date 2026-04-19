/**
 * SERVICE WORKER - StockMedi PWA
 * Stratégie Network First pour toujours avoir la dernière version
 */

import { clientsClaim } from 'workbox-core';
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';

//  Récupérer le scope global du service worker
// eslint-disable-next-line no-restricted-globals
const sw = self;

clientsClaim();

// Précacher les assets générés par webpack
precacheAndRoute(sw.__WB_MANIFEST);
//  Écouter le message SKIP_WAITING
sw.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        sw.skipWaiting();
    }
});

// Stratégie Network First pour les assets (toujours chercher la dernière version)
registerRoute(
    ({ request }) => request.destination === 'script' || 
                     request.destination === 'style' || 
                     request.destination === 'document',
    new NetworkFirst({
        cacheName: 'dynamic-cache',
        networkTimeoutSeconds: 5,
        plugins: []
    })
);

// Stratégie StaleWhileRevalidate pour les images (mise à jour en arrière-plan)
registerRoute(
    ({ request }) => request.destination === 'image',
    new StaleWhileRevalidate({
        cacheName: 'image-cache',
        plugins: []
    })
);

//  Forcer l'activation immédiate
sw.addEventListener('install', () => {
    sw.skipWaiting();
});

sw.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            clientsClaim(),
            // Nettoyer les anciens caches
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((cacheName) => !cacheName.includes('precache') && !cacheName.includes('dynamic'))
                        .map((cacheName) => caches.delete(cacheName))
                );
            })
        ])
    );
});