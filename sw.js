// Service worker: l'app si apre anche senza rete.
const VERSION = "giappone-v1";
const SHELL = ["./", "index.html", "app.js", "seed.js", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Dati in diretta (meteo, cambio, Gemini, Firestore): sempre dalla rete, l'app tiene la sua copia.
  if (/open-meteo|frankfurter|generativelanguage|firestore|googleapis\.com\/google\.firestore/.test(url.host + url.pathname)) return;
  const cacheable = url.origin === location.origin || /gstatic\.com|fonts\.googleapis\.com/.test(url.host);
  if (!cacheable) return;
  // Prima la copia salvata, poi aggiorna in background.
  e.respondWith(caches.open(VERSION).then(async cache => {
    const hit = await cache.match(req, { ignoreSearch: url.origin === location.origin });
    const net = fetch(req).then(res => { if (res && (res.ok || res.type === "opaque")) cache.put(req, res.clone()); return res; }).catch(() => hit);
    return hit || net;
  }));
});
