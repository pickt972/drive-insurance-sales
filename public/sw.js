const CACHE_NAME = 'aloelocation-v2';
const STATIC_CACHE = 'aloelocation-static-v2';
const API_CACHE = 'aloelocation-api-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.png',
  '/app-icon-192.png',
  '/app-icon-512.png',
];

const SUPABASE_DOMAIN = 'supabase.co';

// Install - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== CACHE_NAME && key !== API_CACHE)
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

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other non-http
  if (!url.protocol.startsWith('http')) return;

  // API calls (Supabase) - Network first, cache fallback
  if (url.hostname.includes(SUPABASE_DOMAIN)) {
    event.respondWith(networkFirstStrategy(request, API_CACHE));
    return;
  }

  // Static assets (JS, CSS, images, fonts) - Cache first
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirstStrategy(request, CACHE_NAME));
    return;
  }

  // Navigation requests - Network first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(navigationStrategy(request));
    return;
  }

  // Everything else - Network first
  event.respondWith(networkFirstStrategy(request, CACHE_NAME));
});

function isStaticAsset(pathname) {
  return /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)(\?.*)?$/.test(pathname);
}

async function cacheFirstStrategy(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirstStrategy(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function navigationStrategy(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match('/index.html');
    if (cached) return cached;
    return new Response(offlineHTML(), {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    });
  }
}

function offlineHTML() {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aloe Location - Hors ligne</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f8fafc; color: #1e293b; text-align: center; padding: 2rem; }
    .container { max-width: 400px; }
    .icon { font-size: 4rem; margin-bottom: 1.5rem; }
    h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.75rem; }
    p { color: #64748b; margin-bottom: 1.5rem; line-height: 1.6; }
    button { background: #3b82f6; color: white; border: none; padding: 0.75rem 2rem; border-radius: 0.5rem; font-size: 1rem; font-weight: 600; cursor: pointer; }
    button:hover { background: #2563eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">📡</div>
    <h1>Vous êtes hors ligne</h1>
    <p>Vérifiez votre connexion internet et réessayez. Les données consultées précédemment sont peut-être encore disponibles.</p>
    <button onclick="location.reload()">Réessayer</button>
  </div>
</body>
</html>`;
}
