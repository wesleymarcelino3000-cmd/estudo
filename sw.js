const CACHE_NAME="biblia-acf-melhorada-v1";
const ASSETS=["./","./index.html","./manifest.json","./sw.js","./icons/icon-192.png","./icons/icon-512.png","./data/acf_biblia_ptbr.json"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(ASSETS)).catch(()=>{})));
self.addEventListener("fetch",e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
