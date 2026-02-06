const CACHE_NAME = 'crousz-v1';
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/calendar',
  '/groups',
];

const API_CACHE_NAME = 'crousz-api-v1';
const API_BASE = '/api';

// Install: pre-cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== API_CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests — queue them for offline sync
  if (request.method !== 'GET') {
    event.respondWith(
      fetch(request).catch(() => {
        // Store failed mutations in IndexedDB for later sync
        return saveOfflineRequest(request.clone()).then(() => {
          return new Response(
            JSON.stringify({ offline: true, queued: true }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        });
      })
    );
    return;
  }

  // API requests: network-first, fallback to cache
  if (url.pathname.startsWith(API_BASE) || url.origin !== self.location.origin) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(API_CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            return cached || new Response(
              JSON.stringify({ offline: true, error: 'No cached data' }),
              { status: 503, headers: { 'Content-Type': 'application/json' } }
            );
          });
        })
    );
    return;
  }

  // Static assets: cache-first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      }).catch(() => {
        // Fallback for navigation requests
        if (request.mode === 'navigate') {
          return caches.match('/');
        }
        return new Response('Offline', { status: 503 });
      });
    })
  );
});

// IndexedDB helpers for offline request queue
function openOfflineDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('crousz-offline', 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('requests')) {
        db.createObjectStore('requests', { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveOfflineRequest(request) {
  try {
    const db = await openOfflineDB();
    const body = await request.text();
    const tx = db.transaction('requests', 'readwrite');
    tx.objectStore('requests').add({
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body,
      timestamp: Date.now(),
    });
    return new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = reject;
    });
  } catch (e) {
    console.error('Failed to save offline request:', e);
  }
}

async function replayOfflineRequests() {
  try {
    const db = await openOfflineDB();
    const tx = db.transaction('requests', 'readonly');
    const store = tx.objectStore('requests');
    const allReqs = await new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    for (const saved of allReqs) {
      try {
        await fetch(saved.url, {
          method: saved.method,
          headers: saved.headers,
          body: saved.method !== 'GET' ? saved.body : undefined,
        });
        // Remove from queue on success
        const delTx = db.transaction('requests', 'readwrite');
        delTx.objectStore('requests').delete(saved.id);
      } catch (e) {
        // Still offline for this request, keep in queue
        break;
      }
    }
  } catch (e) {
    console.error('Failed to replay offline requests:', e);
  }
}

// Listen for online event to replay queued requests
self.addEventListener('message', (event) => {
  if (event.data === 'SYNC_OFFLINE') {
    replayOfflineRequests();
  }
});
