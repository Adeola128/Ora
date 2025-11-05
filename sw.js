const CACHE_NAME = 'oratora-cache-v1';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/index.tsx',
  '/manifest.json', // Added manifest to cache
  'https://cdn.tailwindcss.com?plugins=forms,container-queries',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&family=Poppins:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;700;800;900&display=swap',
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined',
  'https://js.paystack.co/v1/inline.js',
  'https://esm.sh/react@18.2.0',
  'https://esm.sh/react-dom@18.2.0/client',
  'https://esm.sh/react@18.2.0/jsx-runtime',
  'https://esm.sh/@google/genai',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
];

// Install event: cache core application shell assets.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        // Cache resources individually to be more resilient to network failures.
        const cachePromises = URLS_TO_CACHE.map(url => {
            return cache.add(url).catch(err => {
                console.warn(`Failed to cache ${url}:`, err);
            });
        });
        return Promise.all(cachePromises);
      })
      .then(() => self.skipWaiting()) // Force the waiting service worker to become the active service worker.
  );
});

// Activate event: clean up old caches to remove outdated data.
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control of all open clients once activated.
  );
});


// Fetch event: Apply caching strategy to serve assets.
self.addEventListener('fetch', event => {
  // We only cache GET requests. Other requests (POST, etc.) are passed through.
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Strategy: Network-first for navigation requests (HTML pages).
  // This ensures the user gets the latest app shell if online, with an offline fallback.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // If fetch is successful, cache the new response and return it.
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // If the network fails, serve the cached version as a fallback.
          return caches.match(event.request);
        })
    );
    return;
  }

  // Strategy: Cache-first for all other assets (JS, CSS, fonts, etc.).
  // This serves assets from the cache immediately for speed and offline availability.
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // If the response is in the cache, return it.
        if (cachedResponse) {
          return cachedResponse;
        }

        // If not in cache, fetch from the network.
        return fetch(event.request).then(
          networkResponse => {
            // Check if we received a valid response.
            if (!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }

            // Clone the response because it's a stream that can only be consumed once.
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                // Cache the newly fetched response for future requests.
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          }
        ).catch(error => {
            console.log('Fetch failed; error:', error);
            // You could optionally return a fallback offline asset here (e.g., a placeholder image).
        });
      })
  );
});