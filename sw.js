const CACHE = "gangsta-rapper-v10";
const ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];
// Install: always fetch fresh copies (skip the browser HTTP cache), then take over at once.
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(ASSETS.map((u) => fetch(new Request(u, { cache: "reload" })).then((r) => (r.ok ? c.put(u, r) : undefined))))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
const isPage = (req) => req.mode === "navigate" || /\/(index\.html)?$/.test(new URL(req.url).pathname);
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  if (isPage(req) || /sw\.js$/.test(req.url)) {
    // The app page: network first, so a new version shows up straight away. Offline: the saved copy.
    e.respondWith(fetch(req, { cache: "no-store" }).then((res) => {
      if (res && res.ok && isPage(req)) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put("./index.html", copy)); }
      return res;
    }).catch(() => caches.match("./index.html").then((hit) => hit || caches.match("./"))));
    return;
  }
  // Icons and manifest: cache first.
  e.respondWith(caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req).then((res) => {
    if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
    return res;
  })));
});
