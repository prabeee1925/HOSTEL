// Service worker: makes the app work offline and handles taps on notifications
const CACHE = "hostel-power-shared-v9-prabi-example";
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./firebase-config.js"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Try the network first so updates arrive; fall back to the cache when offline
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const u = new URL(e.request.url);
  if (u.origin !== location.origin && u.hostname !== "www.gstatic.com") return;   // database traffic goes straight to the network
  e.respondWith(
    fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(e.request).then(hit => hit || (e.request.mode === "navigate" ? caches.match("./index.html") : Response.error())))
  );
});

// Tapping a notification (or its "Already OFF" button) opens the app
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const quick = e.action === "off";
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if ("focus" in c) {
          if (quick) c.postMessage({ type: "quickoff" });
          return c.focus();
        }
      }
      return self.clients.openWindow("./index.html" + (quick ? "#quickoff" : ""));
    })
  );
});
