const CACHE_NAME = 'black-pwa-v1';
const OFFLINE_URL = 'index.html';
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll([OFFLINE_URL]))
  );
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
self.addEventListener('fetch', (event) => {
  // network-first for API, cache-first for others
  const req = event.request;
  if(req.method !== 'GET') return;
  if(req.url.includes('/api/')){
    event.respondWith(fetch(req).catch(()=> caches.match(req)));
  } else {
    event.respondWith(caches.match(req).then(r => r || fetch(req)));
  }
});
self.addEventListener('push', (event) => {
  let data = {title: 'Black', message: 'You have a notification'};
  try{ data = event.data.json(); }catch(e){}
  const options = {
    body: data.message,
    icon: 'assets/pwa/icons/icon-192.png',
    badge: 'assets/pwa/icons/icon-192.png',
    data: data
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});