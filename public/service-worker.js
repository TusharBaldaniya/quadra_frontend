const CACHE_NAME = 'quadra-cache-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/dummy.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only intercept GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Avoid intercepting API calls, let the API client manage offline database fallbacks
  if (url.pathname.startsWith('/api/') || url.pathname.includes('/auth/')) {
    return;
  }

  // Handle static assets (JS, CSS, images, google fonts) dynamically using stale-while-revalidate
  const isStatic = url.pathname.includes('/static/') || 
                   url.pathname.endsWith('.png') || 
                   url.pathname.endsWith('.svg') || 
                   url.pathname.endsWith('.ico') ||
                   url.pathname.endsWith('.json') ||
                   url.host.includes('fonts.googleapis.com') ||
                   url.host.includes('fonts.gstatic.com');

  if (isStatic) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          const fetchPromise = fetch(event.request).then((networkResponse) => {
            if (networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => null);

          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // Handle HTML navigation routing offline fallback
  if (event.request.mode === 'navigate' || url.pathname === '/') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => {
          return caches.match('/index.html') || caches.match('/');
        })
    );
    return;
  }

  // Default fallback: Network first, with cache backup
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

self.addEventListener('push', (event) => {
  let data = { title: 'AI Eisenhower Coach', body: 'Let\'s check in on your productivity!' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'AI Eisenhower Coach', body: event.data.text() };
    }
  }

  const options = {
    body: data.body,
    icon: '/dummy.png',
    badge: '/dummy.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '2'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus if window already open
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
