// Service worker de Fest'Breizh
// Rôle : rendre l'app installable et disponible hors-ligne, SANS jamais
// bloquer les utilisateurs sur une ancienne version. Stratégie : réseau en
// priorité, le cache ne sert que de secours si la connexion est coupée.

const CACHE_NAME = "fest-breizh-v2"; // ⚠️ à incrémenter à chaque changement de stratégie du SW
const APP_SHELL = [
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (key) { return key !== CACHE_NAME; })
          .map(function (key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function (event) {
  var url = event.request.url;

  // Les appels aux API d'événements ne passent jamais par le cache.
  var isApiCall = url.indexOf("api.datatourisme.fr") !== -1 ||
    url.indexOf("public.opendatasoft.com") !== -1;
  if (isApiCall) return;

  // La page HTML (et toute navigation) : toujours réseau en premier, pour
  // ne jamais rester bloqué sur une ancienne version après un déploiement.
  // Le cache ne sert que si le réseau échoue (mode hors-ligne).
  if (event.request.mode === "navigate" || url.indexOf("index.html") !== -1) {
    event.respondWith(
      fetch(event.request).catch(function () {
        return caches.match(event.request);
      })
    );
    return;
  }

  // Le reste (icônes, manifest) : cache d'abord, réseau en secours.
  event.respondWith(
    caches.match(event.request).then(function (cached) {
      return cached || fetch(event.request);
    })
  );
});
