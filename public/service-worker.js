const CACHE_NAME = "biggan-rankar-v1";
const STATIC_ASSETS = ["/", "/manifest.json", "/_next/static/"];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }),
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      );
    }),
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
  // Only handle GET requests
  if (event.request.method !== "GET") return;

  // Skip non-HTTP(S) requests
  if (!event.request.url.startsWith("http")) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((response) => {
          // Don't cache non-successful responses
          if (
            !response ||
            response.status !== 200 ||
            response.type !== "basic"
          ) {
            return response;
          }

          // Cache the new response
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            if (
              event.request.url.match(
                /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff2?|ttf|eot)$/,
              )
            ) {
              cache.put(event.request, responseClone);
            }
          });

          return response;
        })
        .catch(() => {
          // Return a fallback for navigation requests
          if (event.request.mode === "navigate") {
            return caches.match("/");
          }
          return new Response("Network error", { status: 408 });
        });
    }),
  );
});
