// Service Worker for Banter & Brats PWA
// Ensures every deploy updates instantly with no stale cache

// Use timestamp-based cache name to ensure every build gets a unique cache
// Note: Date.now() is evaluated when the SW script is first parsed/executed.
// Since Render serves a new sw.js on each deploy, this creates a unique cache
// per deployment, not per page load. The browser caches sw.js itself and only
// re-fetches it when it detects changes (byte-for-byte comparison).
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
            // For other requests, return a descriptive error
            throw new Error(`Failed to fetch ${url.pathname}: network unavailable and no cached version exists. Please check your internet connection.`);
          });
      })
  );
});

// Push notification handler
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  
  const options = {
    body: data.body || 'New message',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    tag: data.tag || 'default',
    data: {
      url: data.url || '/',
      timestamp: Date.now()
    },
    actions: data.actions || [],
    vibrate: [200, 100, 200],
    requireInteraction: data.requireInteraction || false
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Banter & Brats', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if window is already open
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Background sync for offline messages
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-messages') {
    event.waitUntil(syncOfflineMessages());
  }
});

async function syncOfflineMessages() {
  const cache = await caches.open('offline-messages');
  const requests = await cache.keys();
  
  for (const request of requests) {
    try {
      await fetch(request.clone());
      await cache.delete(request);
    } catch (err) {
      console.error('Failed to sync message:', err);
    }
  }
}
