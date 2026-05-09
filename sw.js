const CACHE_NAME = 'mangata-v1-core';

// Assets to cache offline aggressively
const STATIC_ASSETS = [
    '/',
    '/login.html',
    '/dashboard.html',
    '/shop.html',
    '/assets/css/style.css',
    '/assets/js/auth.js',
    '/assets/js/dashboard.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
});

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // CRITICAL: NEVER cache read.php streams or chapter blobs!
    // As per strictly mandated requirements.
    if (url.pathname.includes('/api/mangas/read.php') || url.pathname.includes('/uploads/chapters/')) {
        event.respondWith(fetch(event.request));
        return; // Halt service worker logic here completely mapped directly to network
    }

    // Dynamic API caching restriction - skip POST requests entirely
    if (event.request.method !== 'GET') {
        event.respondWith(fetch(event.request));
        return;
    }

    // Default Cache Strategy: Stale-While-Revalidate for UI responsiveness
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            const fetchPromise = fetch(event.request).then(networkResponse => {
                // If the response is good and isn't dynamic user JSON, cache it.
                if (networkResponse.ok && !url.pathname.includes('/api/')) {
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse.clone()));
                }
                return networkResponse;
            }).catch(() => {
                // Return fallback if offline
            });

            return cachedResponse || fetchPromise;
        })
    );
});
