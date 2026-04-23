const CACHE_NAME = "acf-ia-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./config.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./data/acf.pdf"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).catch(() => {}));
});

self.addEventListener("fetch", event => {
  event.respondWith(caches.match(event.request).then(resp => resp || fetch(event.request)));
});