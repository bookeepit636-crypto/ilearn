const CACHE_NAME = 'bookkeepit-pwa-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  try {
    const url = new URL(event.request.url);

    // Skip non-http/https requests (e.g. chrome-extension://)
    if (!url.protocol.startsWith('http')) return;

    // Skip live video classroom, WebRTC, and external media streams
    if (
      url.pathname.startsWith('/live') ||
      url.pathname.startsWith('/api/live') ||
      url.hostname.includes('meet.jit.si') ||
      url.hostname.includes('8x8.vc') ||
      url.hostname.includes('jitsi') ||
      url.hostname.includes('cloudinary.com') ||
      url.hostname.includes('youtube.com') ||
      url.hostname.includes('supabase.co') ||
      url.hostname.includes('gravatar.com')
    ) {
      return;
    }

    event.respondWith(
      fetch(event.request).catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        return new Response('Network unavailable', {
          status: 503,
          headers: { 'Content-Type': 'text/plain' }
        });
      })
    );
  } catch {
    // If URL parsing fails, pass through
    return;
  }
});

