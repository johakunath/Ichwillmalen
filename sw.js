/* An atomic app shell and a complete local picture library, isolated by scope. */
const PREFIX = "ichwillmalen:" + self.registration.scope + ":";
const CACHE = PREFIX + "studio-v2";
const SHELL = [
  "./",
  "index.html",
  "free.html",
  "water.html",
  "coloring.html",
  "stickers.html",
  "puzzle.html",
  "find.html",
  "pixel.html",
  "trace.html",
  "pbn.html",
  "styles.css",
  "studio.css",
  "drawing.css",
  "painting.css",
  "play.css",
  "discovery.css",
  "theme.js",
  "gallery.js",
  "js/icons.js",
  "js/art.js",
  "js/storage.js",
  "js/studio.js",
  "js/tablet.js",
  "js/home.js",
  "js/drawing.js",
  "js/drag.js",
  "js/stickers.js",
  "js/puzzle.js",
  "js/flood-fill.js",
  "js/coloring.js",
  "js/water.js",
  "js/find.js",
  "js/pbn.js",
  "js/pixel.js",
  "js/legacy-chrome.js",
  "icon.svg",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "templates/manifest.json",
  "manifest.webmanifest",
];
let caching;
function cacheLibrary() {
  if (caching) return caching;
  caching = (async () => {
    const cache = await caches.open(CACHE);
    const response = await cache.match("templates/manifest.json");
    const manifest = await response.json();
    const files = [
      ...new Set(
        Object.values(manifest)
          .flat()
          .map((item) => item.file),
      ),
    ];
    let cursor = 0,
      complete = true;
    // Four workers avoid flooding a tablet's radio or decoding queue.
    await Promise.all(
      Array.from({ length: 4 }, async () => {
        while (cursor < files.length) {
          const file = files[cursor++];
          try {
            if (!(await cache.match(file))) await cache.add(file);
          } catch (_) {
            complete = false;
          }
        }
      }),
    );
    await cache.put("offline-ready", new Response(complete ? "yes" : "no"));
    return complete;
  })()
    .catch(() => false)
    .finally(() => {
      caching = null;
    });
  return caching;
}
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(cacheLibrary),
  );
  // Existing open sessions keep their version until they close; no mid-drawing reload.
});
self.addEventListener("activate", (event) =>
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(PREFIX) && key !== CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  ),
);
self.addEventListener("message", (event) => {
  if (
    event.data?.type === "CACHE_STATUS" ||
    event.data?.type === "CACHE_LIBRARY"
  ) {
    event.waitUntil(
      cacheLibrary().then((ready) =>
        event.source?.postMessage({ type: "CACHE_STATUS", ready }),
      ),
    );
  }
});
self.addEventListener("fetch", (event) => {
  const request = event.request,
    url = new URL(request.url),
    scope = new URL(self.registration.scope);
  if (
    request.method !== "GET" ||
    url.origin !== scope.origin ||
    !url.pathname.startsWith(scope.pathname)
  )
    return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      // Queries select local artwork or bypass the old worker during upgrade.
      const key = url.pathname;
      const hit = await cache.match(key);
      if (hit) return hit;
      try {
        const response = await fetch(request);
        if (response.ok) await cache.put(key, response.clone());
        return response;
      } catch (_) {
        if (request.mode === "navigate") return await cache.match("index.html");
        return new Response("Offline", { status: 503 });
      }
    })(),
  );
});
