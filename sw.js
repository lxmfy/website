const CACHE_NAME = 'lxmfy-website-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/documentation.html',
  '/style.css',
  '/_includes/header.html',
  '/_includes/footer.html',
  '/assets/logo.svg',
  '/assets/logo-192.png',
  '/assets/logo-512.png',
  '/vendor/prism/prism-tomorrow.min.css',
  '/vendor/prism/prism.min.js',
  '/vendor/prism/prism-python.min.js',
  '/vendor/clipboard/clipboard.min.js',
  '/vendor/marked/marked.min.js',
  'https://raw.githubusercontent.com/lxmfy/LXMFy/main/docs/quick-start.md',
  'https://raw.githubusercontent.com/lxmfy/LXMFy/main/docs/creating-bots.md',
  'https://raw.githubusercontent.com/lxmfy/LXMFy/main/docs/api.md'
];

self.addEventListener('install', event => {
  console.log('[ServiceWorker] Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[ServiceWorker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('[ServiceWorker] Failed to cache app shell:', error);
      })
  );
});

self.addEventListener('activate', event => {
  console.log('[ServiceWorker] Activate');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim(); 
});

self.addEventListener('fetch', event => {
  console.log('[ServiceWorker] Fetch', event.request.url);
  
  // For API requests (like GitHub version check), always fetch from network
  if (event.request.url.includes('api.github.com')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // For GitHub raw content, use network-first strategy
  if (event.request.url.includes('raw.githubusercontent.com')) {
    event.respondWith(
      fetch(event.request)
        .then(networkResponse => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }
          
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              console.log('[ServiceWorker] Caching GitHub content', event.request.url);
              cache.put(event.request, responseToCache);
            });
          
          return networkResponse;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          // Serve from cache
          console.log('[ServiceWorker] Found in cache', event.request.url);
          return response;
        }
        // Not in cache, fetch from network
        console.log('[ServiceWorker] Not in cache, fetching', event.request.url);
        return fetch(event.request).then(
          networkResponse => {
            // Check if we received a valid response
            if(!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // IMPORTANT: Clone the response. A response is a stream
            // and because we want the browser to consume the response
            // as well as the cache consuming the response, we need
            // to clone it so we have two streams.
            var responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                console.log('[ServiceWorker] Caching new resource', event.request.url);
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          }
        ).catch(error => {
           console.error('[ServiceWorker] Fetch failed; returning offline page instead.', error);
           // Optionally return a fallback offline page:
           // return caches.match('/offline.html');
        });
      })
  );
}); 