/* sw.js - offline app shell. Bump CACHE when any shell file changes. */
var CACHE = 'expense-tracker-v20';
var SHELL = [
  './',
  'index.html',
  'privacy.html',
  'css/styles.css',
  'js/i18n.js',
  'js/currencies.js',
  'js/store.js',
  'js/calc.js',
  'js/charts.js',
  'js/app.js',
  'manifest.webmanifest',
  'icons/icon-64.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'img/welcome-banner.jpg'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(SHELL);
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        return k === CACHE ? null : caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Navigations go to the network first, so other pages in scope (privacy.html,
  // store/*) are served as themselves; only when offline do we fall back to the
  // cached copy, and finally to the app shell.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then(function (res) {
        if (res && res.ok && res.type === 'basic') {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () {
        return caches.match(req).then(function (hit) {
          return hit || caches.match('index.html').then(function (shell) {
            return shell || caches.match('./');
          });
        });
      })
    );
    return;
  }

  // Everything else: cache first, then network (and keep a copy).
  event.respondWith(
    caches.match(req).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (res) {
        if (res && res.ok && res.type === 'basic') {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () { return hit; });
    })
  );
});
