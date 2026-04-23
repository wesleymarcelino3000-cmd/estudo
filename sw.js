const CACHE_NAME = "acfjson-v1";
const ASSETS = ["./","./index.html","./style.css","./app.js","./config.js","./manifest.json","./icons/icon-192.png","./icons/icon-512.png","./data/acf_biblia_ptbr.json"];
self.addEventListener("install", e => e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)).catch(()=>{})));
self.addEventListener("fetch", e => e.respondWith(caches.match(e.request).then(r => r || fetch(e.request))));
