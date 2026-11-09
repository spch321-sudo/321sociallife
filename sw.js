/* 321社交生活  Service Worker —— 自動更新版（321 系共用）
   ‧ 每次發佈 VER 都不同 → 瀏覽器偵測到 sw.js 位元組改變就安裝新 SW（註冊時 updateViaCache:'none'）
   ‧ install：skipWaiting；預載用 cache:'reload' 繞過 HTTP 快取（GitHub Pages 會快取 10 分鐘）
   ‧ activate：只清自己前綴（PFX）的舊快取——同一個 github.io 網域的各 App 共用 Cache Storage，不能刪別人的；
     clients.claim 後通知所有頁面（頁面自己判斷空閒才重整）
   ‧ fetch：HTML／JS／JSON／CSS 網路優先（no-cache），離線才用快取；圖片等快取優先；影音與 Range 請求不攔截 */
var PFX = 'sl321-';
var VER = '1.0.202610050829-gx10171750-gxa1019-vp1023-cr1031-ws3-fs1103-xz1103-au1103-xzm1103-rf1105-fw1105h-par1107-cs1109-nv1109';
var V = PFX + VER;
var SHELL = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png", "./hero-s.jpg", "./c-zh-s1.json", "./t-zh.json", "./peerjs.min.js", "./qrcode.js", "./xz2.js", "./xzm.js", "./xzpar.js"];
self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(V).then(function (c) {
    return Promise.all(SHELL.map(function (u) {
      return fetch(new Request(u, { cache: 'reload' })).then(function (r) { if (r && r.ok) return c.put(u, r); })['catch'](function () { });
    }));
  }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k.indexOf(PFX) === 0 && k !== V; }).map(function (k) { return caches['delete'](k); }));
  }).then(function () { return self.clients.claim(); }).then(function () {
    return self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  }).then(function (cs) {
    cs.forEach(function (c) { try { if (c.url.indexOf(self.registration.scope) === 0) c.postMessage({ t: 'sw-updated', v: VER }); } catch (x) { } });
  }));
});
self.addEventListener('message', function (e) { if (e.data === 'skip' || e.data === 'SKIP_WAITING') self.skipWaiting(); });
/* rf1105（互動聖經 v2.58.3）：網路優先，但慢網路（超過 SHELL_WAIT 毫秒沒回）先用完全相同的快取開；網路那份繼續下載並更新快取。
   只有導覽請求才可以退回 index.html（程式檔退回 HTML 會造成 Unexpected token '<'）。 */
var SHELL_WAIT = 1000;
function shellFetch(e, req, key, url, nav) {
  var net = fetch(url, { cache: 'no-cache', credentials: 'same-origin' }).then(function (resp) {
    if (resp && resp.ok) { var cp = resp.clone(); caches.open(V).then(function (c) { c.put(key, cp); }); }
    return resp;
  });
  e.waitUntil(net.then(function () { }, function () { }));
  function fallback() {
    return caches.match(key).then(function (h) { return h || caches.match(req, { ignoreSearch: true }); })
      .then(function (h) { return h || (nav ? caches.match('./index.html') : undefined); });
  }
  return new Promise(function (resolve) {
    var done = false;
    var t = setTimeout(function () { fallback().then(function (h) { if (h && !done) { done = true; resolve(h); } }); }, SHELL_WAIT);
    net.then(function (resp) { if (!done) { done = true; clearTimeout(t); resolve(resp); } }, function () {
      clearTimeout(t);
      if (done) return;
      fallback().then(function (h) { if (!done) { done = true; resolve(h || Response.error()); } });
    });
  });
}
self.addEventListener('fetch', function (e) {
  var r = e.request; if (r.method !== 'GET') return;
  var u = new URL(r.url); if (u.origin !== self.location.origin) return;
  var p = u.pathname;
  if (/\.(mp3|m4a|aac|wav|ogg|opus|mp4|mov|webm)$/i.test(p) || r.headers.get('range')) return;
  if (/version\.json$/.test(p)) {
    e.respondWith(fetch(p + '?t=' + Date.now(), { cache: 'no-store' })['catch'](function () { return new Response('{}', { headers: { 'Content-Type': 'application/json' } }); }));
    return;
  }
  var nav = r.mode === 'navigate' || /\.html$/.test(p) || /\/$/.test(p);
  var key = u.origin + p + (/\/$/.test(p) ? 'index.html' : '');
  if (nav || /\.(json|js|css)$/.test(p)) {
    e.respondWith(shellFetch(e, r, key, r.url, nav));
    return;
  }
  e.respondWith(caches.match(r, { ignoreSearch: true }).then(function (h) {
    return h || fetch(r).then(function (resp) { if (resp && resp.ok) { var cp = resp.clone(); caches.open(V).then(function (c) { c.put(r, cp); }); } return resp; });
  }));
});
