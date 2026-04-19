/* ===========================
   KAIROS SERVICE WORKER
   Enables offline support + installability on Android, iOS & desktop
   =========================== */

const CACHE_NAME = 'kairos-v1';

const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/dashboard.html',
    '/assignments.html',
    '/planner.html',
    '/settings.html',
    '/analytics.html',
    '/gpa-calculator.html',
    '/cwa-to-gpa.html',
    '/lecture-tools.html',
    '/pdf-tools.html',
    '/timetable.html',
    '/word-editor.html',
    '/excel-editor.html',
    '/powerpoint-editor.html',
    '/signin.html',
    '/signup.html',
    '/css/main.css',
    '/css/components.css',
    '/css/pages/dashboard.css',
    '/css/pages/assignments.css',
    '/css/pages/planner.css',
    '/css/pages/settings.css',
    '/css/pages/analytics.css',
    '/css/pages/auth.css',
    '/js/app.js',
    '/js/storage.js',
    '/js/assignments.js',
    '/js/dashboard.js',
    '/js/planner.js',
    '/js/settings.js',
    '/js/analytics.js',
    '/js/gpa-calculator.js',
    '/1000669890-Photoroom.png',
    '/manifest.json'
];

// Install: pre-cache all static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' })));
        }).catch(() => {})
    );
    self.skipWaiting();
});

// Activate: delete old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// Fetch: cache-first for static assets, network-first for API calls
self.addEventListener('fetch', (event) => {
    const { request } = event;

    // Skip non-GET and cross-origin requests
    if (request.method !== 'GET') return;
    if (!request.url.startsWith(self.location.origin)) return;

    // Skip backend API calls (let them go to network)
    if (request.url.includes('/api/')) return;

    event.respondWith(
        caches.match(request).then((cached) => {
            if (cached) return cached;

            return fetch(request).then((response) => {
                // Cache successful HTML/CSS/JS/image responses
                if (response && response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                }
                return response;
            }).catch(() => {
                // Offline fallback: serve dashboard for navigation requests
                if (request.mode === 'navigate') {
                    return caches.match('/dashboard.html');
                }
            });
        })
    );
});
