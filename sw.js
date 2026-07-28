// Service worker de Fest'Breizh
// Rôle : rendre l'app installable (condition technique exigée par les
// navigateurs) et permettre l'ouverture même hors connexion (coquille de
// l'app uniquement — les événements, eux, nécessitent toujours une
// connexion pour être à jour, ce qui est voulu).

const CACHE_NAME = "fest-breizh-v1";
const APP_SHELL = [
  "./",
  "./index.html",
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

  // Les appels aux API d'événements (DATAtourisme, OpenAgenda) doivent
  // toujours passer par le réseau : jamais de cache pour ces requêtes,
  // sinon l'app afficherait des données périmées.
  var isApiCall = url.indexOf("api.datatourisme.fr") !== -1 ||
    url.indexOf("public.opendatasoft.com") !== -1;
  if (isApiCall) {
    return; // laisse la requête suivre son cours normal, sans interception
  }

  // Pour le reste (coquille de l'app) : cache d'abord, réseau en secours.
  event.respondWith(
    caches.match(event.request).then(function (cached) {
      return cached || fetch(event.request);
    })
  );
});
