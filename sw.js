/* Drawing Playground service worker — makes every mode work offline.
   Strategy:
   - HTML pages: network-first (so updates show when online), fall back to cache.
   - Everything else same-origin (templates, svg, json, manifest, icon): cache-first,
     then network, and store the response so it's available offline next time.
   No analytics, no external requests — purely a local cache. */
var CACHE = "drawing-playground-v6";
var SHELL = [
  ".", "index.html", "free.html", "water.html",
  "coloring.html", "pixel.html", "pbn.html",
  "trace.html", "find.html",
  "styles.css", "gallery.js", "theme.js", "icon.svg",
  "templates/manifest.json", "manifest.webmanifest"
];

self.addEventListener("install", function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){
    return Promise.all(SHELL.map(function(u){
      return c.add(u).catch(function(){ /* ignore a missing shell file */ });
    }));
  }));
});

self.addEventListener("activate", function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.map(function(k){ if(k!==CACHE) return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});

function isHTML(req){
  return req.mode === "navigate" ||
    (req.headers.get("accept") || "").indexOf("text/html") !== -1;
}

function cacheResponse(req, res){
  if(!res || !res.ok) return;
  return caches.open(CACHE).then(function(cache){
    return cache.put(req, res.clone());
  });
}

self.addEventListener("fetch", function(e){
  var req = e.request;
  if(req.method !== "GET") return;
  var url = new URL(req.url);
  if(url.origin !== self.location.origin) return;   // never touch cross-origin

  if(isHTML(req)){
    var network = fetch(req);
    e.waitUntil(network.then(function(res){
      return cacheResponse(req, res);
    }).catch(function(){ /* network/cache failure is handled by respondWith */ }));
    e.respondWith(
      network.catch(function(){
        return caches.match(req).then(function(m){ return m || caches.match("index.html"); });
      })
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(function(hit){
      if(hit) return hit;
      return fetch(req).then(function(res){
        return Promise.resolve(cacheResponse(req, res)).catch(function(){
          /* a cache failure must not fail the request */
        }).then(function(){ return res; });
      });
    })
  );
});
