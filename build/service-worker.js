// public/service-worker.js
// Kaduuka PWA Service Worker
// Strategy: Cache-first for static assets, Network-first for API with offline queue for sales

const CACHE_NAME = "kaduuka-v1";
const OFFLINE_SALE_QUEUE = "kaduuka-offline-sales";

// Static assets to cache on install
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/static/js/main.chunk.js",
  "/static/js/bundle.js",
  "/static/css/main.chunk.css",
];

// ── Install: cache static shell ───────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

// ── Activate: clean old caches ────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// ── Fetch: smart routing ──────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // ── API calls: network-first, fallback to cache ──────────────────────────
  if (url.pathname.startsWith("/api/")) {
    // POST /api/sales — queue if offline
    if (request.method === "POST" && url.pathname === "/api/sales") {
      event.respondWith(handleSaleRequest(request));
      return;
    }
    // All other API calls: network first
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache GET responses from API for offline use
          if (request.method === "GET" && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request)),
    );
    return;
  }

  // ── Static assets: cache-first ────────────────────────────────────────────
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        }),
    ),
  );
});

// ── Offline sale queue handler ────────────────────────────────────────────────
async function handleSaleRequest(request) {
  try {
    const response = await fetch(request.clone());
    return response;
  } catch (err) {
    // Network failed — queue the sale in IndexedDB for later sync
    const body = await request.clone().json();
    await queueOfflineSale(body);
    // Return a synthetic "queued" response so the UI can show optimistic success
    return new Response(
      JSON.stringify({
        id: "offline-" + Date.now(),
        message: "Sale queued offline — will sync when back online",
        offline: true,
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

// ── IndexedDB helpers for offline queue ──────────────────────────────────────
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("kaduuka-offline", 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("sales_queue")) {
        db.createObjectStore("sales_queue", {
          keyPath: "id",
          autoIncrement: true,
        });
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

async function queueOfflineSale(saleData) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("sales_queue", "readwrite");
    tx.objectStore("sales_queue").add({
      ...saleData,
      queued_at: new Date().toISOString(),
    });
    tx.oncomplete = resolve;
    tx.onerror = (e) => reject(e.target.error);
  });
}

async function getQueuedSales() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("sales_queue", "readonly");
    const req = tx.objectStore("sales_queue").getAll();
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

async function clearQueuedSale(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("sales_queue", "readwrite");
    tx.objectStore("sales_queue").delete(id);
    tx.oncomplete = resolve;
    tx.onerror = (e) => reject(e.target.error);
  });
}

// ── Background sync: flush queued sales when back online ─────────────────────
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-sales") {
    event.waitUntil(syncQueuedSales());
  }
});

// Also sync on network recovery
self.addEventListener("message", (event) => {
  if (event.data === "sync-now") {
    syncQueuedSales();
  }
});

async function syncQueuedSales() {
  const queued = await getQueuedSales();
  for (const sale of queued) {
    try {
      const { id, queued_at, ...saleData } = sale;
      // Get auth token from cache (stored by the app)
      const token = await getStoredToken();
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(saleData),
      });
      if (response.ok) {
        await clearQueuedSale(id);
        // Notify all clients that a queued sale was synced
        const clients = await self.clients.matchAll();
        clients.forEach((client) =>
          client.postMessage({ type: "SALE_SYNCED", saleData }),
        );
      }
    } catch (err) {
      // Still offline — will retry on next sync event
      break;
    }
  }
}

async function getStoredToken() {
  // Read from cache storage where the app stores it
  const cache = await caches.open(CACHE_NAME);
  const tokenResponse = await cache.match("/sw-token");
  if (tokenResponse) return tokenResponse.text();
  return null;
}
