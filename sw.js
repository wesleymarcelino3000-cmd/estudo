const CACHE_NAME="biblia-acf-corrigido-v3";
const ASSETS=["./","./index.html","./manifest.json","./sw.js","./icons/icon-192.png","./icons/icon-512.png","./data/acf_biblia_ptbr.json"];
self.addEventListener("install",e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(ASSETS)).catch(()=>{}));});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>k!==CACHE_NAME?caches.delete(k):null))));self.clients.claim();});
self.addEventListener("fetch",e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
