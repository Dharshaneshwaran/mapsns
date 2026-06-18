// Placeholder service worker to avoid /sw.js 404s until a real PWA setup is added.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", () => self.clients.claim());

