const CACHE_NAME = 'borj-elnoor-pwa-v13';
const APP_SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-192x192.png',
  '/pwa-maskable-512x512.png',
  '/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL_ASSETS).catch(() => {
        // Ignore individual asset precache failures in dev
      });
    })
  );
});

self.addEventListener('message', (event) => {
  if (!event.data) return;
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data.type === 'CLEAR_PWA_CACHE' || event.data.type === 'PREPARE_LATEST_INSTALL') {
    self.skipWaiting();
    event.waitUntil(
      caches.keys().then((keys) =>
        Promise.all(keys.map((k) => caches.delete(k)))
      ).then(() =>
        caches.open(CACHE_NAME).then((cache) =>
          cache.addAll(APP_SHELL_ASSETS).catch(() => {})
        )
      )
    );
  }
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME && key.startsWith('borj-elnoor-pwa-')) {
              return caches.delete(key);
            }
            return Promise.resolve();
          })
        )
      )
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // Never intercept binary .apk downloads — always let the browser download directly from the server
  if (url.pathname.toLowerCase().endsWith('.apk')) {
    return;
  }

  // Skip Vite HMR / internal dev requests and unbundled dev source files
  if (
    url.pathname.startsWith('/@vite') ||
    url.pathname.startsWith('/@react-refresh') ||
    url.pathname.startsWith('/node_modules') ||
    url.pathname.startsWith('/src/') ||
    url.pathname.endsWith('.tsx') ||
    url.pathname.endsWith('.ts')
  ) {
    return;
  }

  // Network-first with cache fallback for HTML navigation and app resources
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          (url.origin === self.location.origin || url.hostname.includes('fonts.g'))
        ) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone).catch(() => {});
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (request.mode === 'navigate') {
            return caches.match('/index.html') || caches.match('/');
          }
          return new Response('', { status: 503, statusText: 'Offline' });
        });
      })
  );
});
