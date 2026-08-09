self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          return caches.delete(cache);
        })
      );
    }).then(() => {
      self.clients.claim();
      self.registration.unregister();
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Do nothing, let network handle it
});
