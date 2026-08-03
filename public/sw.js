const CACHE_NAME = 'grocery-manager-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/icon.png',
  '/icon.svg',
  '/manifest.json'
];

// Install Event - caches core assets
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force active immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// Activate Event - cleans up older caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing Old Cache', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control of all pages immediately
  );
});

// Fetch Event - Smart Caching Strategy
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Bypass Cache for Firebase, Developer API, and cloud services
  if (
    url.hostname.includes('firebase') || 
    url.hostname.includes('googleapis') || 
    req.url.includes('/api/barcode/') ||
    req.method !== 'GET'
  ) {
    return; // Let standard network handle it directly
  }

  // Strategy 1: Network-First for HTML Document & Page Root
  // This guarantees the user always gets the latest version of the app instantly when online
  if (req.mode === 'navigate' || url.pathname === '/' || url.pathname === '/index.html') {
    event.respondWith(
      fetch(req)
        .then((networkResponse) => {
          // Keep a copy in cache
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(req, responseClone);
          });
          return networkResponse;
        })
        .catch(() => {
          // If offline, serve cached version
          return caches.match(req);
        })
    );
    return;
  }

  // Strategy 2: Stale-While-Revalidate for Static Assets (JS, CSS, images, JSON)
  // Serve from cache instantly, but fetch update in the background for next load
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      const fetchPromise = fetch(req)
        .then((networkResponse) => {
          if (networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => null); // Silent fail if offline

      return cachedResponse || fetchPromise;
    })
  );
});
