// Zenith — Service Worker
// Versão: mude este número sempre que atualizar o app
const CACHE = 'zenith-v1';

const PRECACHE = [
  './',
  './index.html',
  'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap',
];

// Instala e pré-cacheia os arquivos essenciais
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(PRECACHE).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

// Remove caches antigos ao ativar
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Estratégia: Network first para o HTML, Cache first para tudo mais
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Ignora requests que não são http/https
  if (!url.protocol.startsWith('http')) return;

  // HTML principal — network first (garante versão atualizada)
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(r => {
          const clone = r.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return r;
        })
        .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
    );
    return;
  }

  // Fontes e assets — cache first, fallback network
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(r => {
        if (r && r.status === 200 && r.type !== 'opaque') {
          const clone = r.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return r;
      }).catch(() => cached);
    })
  );
});
