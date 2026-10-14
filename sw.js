/* 321社交生活 Service Worker */
var V = 'sl321-1.0.202610050829-gx10141435';
var SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './apple-touch-icon.png', './hero-s.jpg', './c-zh-s1.json', './t-zh.json'];
self.addEventListener('install', function (e) { self.skipWaiting(); e.waitUntil(caches.open(V).then(function (c) { return c.addAll(SHELL); })['catch'](function () { })); });
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== V; }).map(function (k) { return caches['delete'](k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var r = e.request; if (r.method !== 'GET') return;
  var u = new URL(r.url); if (u.origin !== self.location.origin) return;
  if (/version\.json$/.test(u.pathname)) { e.respondWith(fetch(r, { cache: 'no-store' })['catch'](function () { return new Response('{}'); })); return; }
  var key = u.pathname.match(/\.json$/) ? new Request(u.origin + u.pathname) : r;
  e.respondWith(fetch(r).then(function (resp) {
    if (resp && resp.ok) { var cp = resp.clone(); caches.open(V).then(function (c) { c.put(key, cp); }); }
    return resp;
  })['catch'](function () { return caches.match(key).then(function (h) { return h || caches.match(r, { ignoreSearch: true }).then(function (h2) { return h2 || caches.match('./index.html'); }); }); }));
});
