// Service Worker for Banter & Brats PWA
// Provides offline support and asset caching

const CACHE_VERSION = 'banter-brats-v2';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/app.js',
  '/theme-init.js',
  '/styles.css',
  '/manifest.json',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Service worker installed');
        return self.skipWaiting();
      })
      .catch((err) => {
        console.error('[SW] Installation failed:', err);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith('banter-brats-') && name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Skip WebSocket connections
  if (url.pathname.startsWith('/socket.io/')) {
    return;
  }

  // Skip API requests (they need to be fresh)
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Handle static assets with cache-first strategy
  if (STATIC_ASSETS.some(asset => url.pathname === asset || url.pathname.startsWith('/uploads/'))) {
    event.respondWith(
      caches.match(request)
        .then((cached) => {
          if (cached) {
            return cached;
          }
          return fetch(request)
            .then((response) => {
              if (response.ok) {
                const clone = response.clone();
                caches.open(STATIC_CACHE)
                  .then((cache) => cache.put(request, clone));
              }
              return response;
            });
        })
        .catch(() => {
          // If offline and not cached, return a basic offline page
          if (request.mode === 'navigate') {
            return new Response(
              '<html><body><h1>Offline</h1><p>You are currently offline. Please check your connection.</p></body></html>',
              { headers: { 'Content-Type': 'text/html' } }
            );
          }
        })
    );
    return;
  }

  // For other requests, use network-first with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(DYNAMIC_CACHE)
            .then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => {
        return caches.match(request)
          .then((cached) => {
            if (cached) {
              return cached;
            }
            // Return offline page for navigation requests
            if (request.mode === 'navigate') {
              return new Response(
                '<html><body><h1>Offline</h1><p>You are currently offline. Please check your connection.</p></body></html>',
                { headers: { 'Content-Type': 'text/html' } }
              );
            }
          });
      })
  );
});

// Message event - allow clients to control the SW
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});
