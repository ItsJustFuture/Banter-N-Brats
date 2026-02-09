// Service Worker for Banter & Brats PWA
// Ensures every deploy updates instantly with no stale cache

// Use timestamp-based cache name to ensure every build gets a unique cache
const CACHE_NAME = `banter-brats-${Date.now()}`;

// Minimal shell files to cache (network-first strategy)
const SHELL_FILES = [
  '/',
  '/index.html'
];

// Install event - skip waiting immediately to activate new version
self.addEventListener('install', (event) => {
  console.log('[SW] Installing new service worker with cache:', CACHE_NAME);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching minimal shell files');
        return cache.addAll(SHELL_FILES);
      })
      .then(() => {
        console.log('[SW] Install complete, skipping waiting');
        // Force this service worker to become active immediately
        return self.skipWaiting();
      })
      .catch((err) => {
        console.error('[SW] Installation failed:', err);
        throw err;
      })
  );
});

// Activate event - delete ALL old caches and take control immediately
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating new service worker');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        // Delete all caches except the current one
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] All old caches deleted');
        // Take control of all clients immediately (no waiting for refresh)
        return self.clients.claim();
      })
      .then(() => {
        console.log('[SW] Service worker activated and claimed all clients');
      })
  );
});

// Fetch event - network-first strategy with cache fallback
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

  // Skip API requests (always fetch fresh)
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Network-first strategy: always try network first, fall back to cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses for offline fallback
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => cache.put(request, clone))
            .catch((err) => console.warn('[SW] Cache put failed:', err));
        }
        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(request)
          .then((cached) => {
            if (cached) {
              console.log('[SW] Serving from cache (offline):', url.pathname);
              return cached;
            }
            // No cache available, return offline page for navigation
            if (request.mode === 'navigate') {
              return new Response(
                '<html><body><h1>Offline</h1><p>You are currently offline. Please check your connection.</p></body></html>',
                { headers: { 'Content-Type': 'text/html' } }
              );
            }
            // For other requests, let it fail
            throw new Error('No cache available');
          });
      })
  );
});
