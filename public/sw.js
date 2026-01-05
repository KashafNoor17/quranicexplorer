const CACHE_NAME = 'quran-explorer-v1';
const STATIC_CACHE = 'quran-static-v1';
const API_CACHE = 'quran-api-v1';
const AUDIO_CACHE = 'quran-audio-v1';

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// API endpoints to cache
const API_ENDPOINTS = [
  'api.alquran.cloud',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              return name.startsWith('quran-') && 
                     name !== CACHE_NAME && 
                     name !== STATIC_CACHE && 
                     name !== API_CACHE &&
                     name !== AUDIO_CACHE;
            })
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - cache-first strategy for most requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Handle API requests (Quran data)
  if (API_ENDPOINTS.some(endpoint => url.hostname.includes(endpoint))) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle audio files
  if (url.pathname.includes('/audio/') || url.hostname.includes('cdn.alquran.cloud')) {
    event.respondWith(handleAudioRequest(request));
    return;
  }

  // Handle static assets - cache first
  event.respondWith(handleStaticRequest(request));
});

// Cache-first strategy for static assets
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Return cached response and update in background
    updateCache(request, STATIC_CACHE);
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // If offline and no cache, return offline page
    return caches.match('/') || new Response('Offline', { status: 503 });
  }
}

// Cache-first strategy for API requests
async function handleApiRequest(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Return cached response immediately
    // Update cache in background for fresh data next time
    updateCache(request, API_CACHE);
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] API request failed:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'This content is not available offline. Please connect to the internet.' 
      }),
      { 
        status: 503, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}

// Cache-first strategy for audio files
async function handleAudioRequest(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(AUDIO_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Audio request failed:', error);
    return new Response('Audio not available offline', { status: 503 });
  }
}

// Update cache in background (stale-while-revalidate)
async function updateCache(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse);
    }
  } catch (error) {
    // Silently fail - we already have cached data
  }
}

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'CACHE_SURAH') {
    const { surahNumber, urls } = event.data;
    cacheSurahData(surahNumber, urls);
  }
  
  if (event.data.type === 'GET_CACHE_STATUS') {
    getCacheStatus().then((status) => {
      event.ports[0].postMessage(status);
    });
  }
});

// Cache specific Surah data
async function cacheSurahData(surahNumber, urls) {
  try {
    const cache = await caches.open(API_CACHE);
    await Promise.all(
      urls.map(url => 
        fetch(url)
          .then(response => {
            if (response.ok) {
              cache.put(url, response);
            }
          })
          .catch(() => {/* ignore failures */})
      )
    );
    console.log(`[SW] Cached Surah ${surahNumber}`);
  } catch (error) {
    console.error('[SW] Failed to cache surah:', error);
  }
}

// Get cache status
async function getCacheStatus() {
  const cacheNames = await caches.keys();
  const status = {};
  
  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    status[name] = keys.length;
  }
  
  return status;
}
