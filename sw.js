importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

workbox.core.skipWaiting();
workbox.core.clientsClaim();

if (workbox) {
  console.log('Workbox is loaded');
  workbox.precaching.precacheAndRoute([
    { url: '/pi/index.html', revision: '4' },
    { url: '/pi/manifest.json', revision: '3' },
    { url: '/pi/icon2.png', revision: '2' },
  ]);

  // Bypass cache for requests to local Pi host to always check network
  workbox.routing.registerRoute(
    ({ url }) => url.origin === 'http://sameer-desktop.local',
    new workbox.strategies.NetworkOnly()
  );

  // Cache images with StaleWhileRevalidate strategy
  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'image',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'image-cache',
    })
  );

  // Cache CSS and JS with CacheFirst (7 days)
  workbox.routing.registerRoute(
    ({ url }) =>
      url.origin === self.location.origin &&
      (url.pathname.endsWith('.css') || url.pathname.endsWith('.js')),
    new workbox.strategies.CacheFirst({
      cacheName: 'static-resources',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxAgeSeconds: 7 * 24 * 60 * 60,
        }),
      ],
    })
  );

  // Network-first for navigation (pages)
  workbox.routing.registerRoute(
    ({ request }) => request.mode === 'navigate',
    new workbox.strategies.NetworkFirst({
      cacheName: 'pages-cache',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
        }),
      ],
    })
  );
} else {
  console.log('Workbox failed to load');
}

// Clean up old caches on activate
self.addEventListener('activate', event => {
  const currentCaches = [
    workbox.core.cacheNames.precache,
    'image-cache',
    'static-resources',
    'pages-cache',
  ];
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames.map(cacheName => {
          if (!currentCaches.includes(cacheName)) {
            console.log('[Service Worker] Deleting outdated cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      )
    )
  );
});
