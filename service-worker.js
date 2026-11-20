/* ANIME VOID — service worker: установка как приложение + офлайн-режим */

const CORE_CACHE = "av-AV-core-v81.0";
const STUDIO_CACHE = "av-AV-studio-v79.0";
const STUDIO_CACHE_LIMIT = 96;
const IMAGE_CACHE = "av-AV-images-v3";
const IMAGE_CACHE_LIMIT = 80;
const AUDIO_CACHE = "av-AV-audio-v1";
const LICENSED_AUDIO = {"audio/japan-rain-v18.mp3": "e8adbedb517c7c30837ac4046dd9d1df3bfc6f98b53e6730af3b07d45b6e9220", "audio/night-forest-v18.mp3": "97a6b3e8973636796c9dd5821b827c94ddcdf6bf33f997ad639e2f6fad3d674b", "audio/train-v18.mp3": "c9dd82787d3846c17cde46b2f8d7b0dba4055d12c35557d26a830f88e483bfe1", "audio/hokkaido-v18.mp3": "8e1678c2f3b594303658e9d60e208cd8be90a5256f948ed1b205457ac53a04ea", "audio/rain-wind-v18.mp3": "f8250ba7c86da6a1acdda757b099beb01e37e1ec64b68f2fa33fc17e8f1028fb", "audio/stream-v18.mp3": "ecbf0faa79d994eb2e975a65684e346d5b428b94e0a91f8735bacf93cf521e68", "audio/forest-water-v18.mp3": "d46547199952e9d64c32a42db23a49511f8d45b3cffad2a6165b2395e31bd8f7", "audio/river-v21.mp3": "67d7d1552ba3221d1e63d58f57f502ac912db40e4ddf2ed126b10d53d4a68e19", "audio/window-v21.mp3": "8b7a8e3b680e45c8a166f04892ec72cebcbe096fcdd61b906896d5a30d961e86", "audio/distant-train-v21.mp3": "c7834558523fd5b1fcbe867b2c3495d8c269ca106fa33529086b76e43d039844", "audio/rail-rain-v21.mp3": "0de84d6f79ebe042e6a2e7004f9f25221b056d959a068f35bc3d8c6054296f62", "audio/carefree-v21.mp3": "76adb4b946dac28afe5df1b2d21b743bc4bb4ce5ed1c77daf4aba4b8f9f63948", "audio/guitar-sun-v21.mp3": "c5977e14b4b829915c12ef05638debc3298ba06a64ee5b6c9cbe5a7febbef2c1", "audio/easy-lemon-v21.mp3": "6ff9bece34d27492e63b5f9bd7a0ad272e8f63e51ff2deb547ba415288115b80", "audio/guitar-night-v21.mp3": "fbb509100709795ad6c6e920b791f67bfb876e710bc9e0e5bb7857530412b519"};


const NEW_CORE = [
  "index.html",
  "offline.html",
  "watch.html",
  "kodik-bridge.js?v=81.0",
  "kodik-data-client.js?v=24.13",
  "app.webmanifest?v=77.0",
  "icon-192.png",
  "icon-512.png",
  "void-i18n-24.js?v=24.29",
  "av-enhancements.css?v=1",
  "av-enhancements.js?v=55.0",
  "av-safety.js?v=24.45",
  "av-state.js?v=24.40",
  "void-display-charts.js?v=58.0",
  "void-display-charts.css?v=18.1",
  "av-progress.js?v=18.1",
  "av-progress.css?v=18.1",
  "void-achievements-22.js?v=22",
  "av-rewards.js?v=22",
  "av-titles.js?v=20261030-2",
  "av-design.css?v=17.0",
  "av-design.js?v=17.0",
  "av-atmosphere.css?v=24.29",
  "av-atmosphere.js?v=25.3",
  "visual-studio.css?v=17.4",
  "visual-studio.js?v=24.40",
  "banner-atelier.css?v=17.3",
  "banner-atelier.js?v=54.0",
  "void-social.css?v=18.1",
  "supabase-client.js?v=2.69.1",
  "av-account.js?v=73.0",
  "void-custom.js?v=17.4.1",
  "void-social.js?v=24.29",
  "void-interface.css?v=24.29",
  "void-interface.js?v=24.29",
  "void-journal.js?v=18.1",
  "void-dashboard.css?v=18.1",
  "void-dashboard.js?v=18.1",
  "void-tv.css?v=18.1",
  "void-tv.js?v=18.1",
  "void-title-accent.css?v=18.1",
  "void-title-accent.js?v=18.1",
  "void-title-scene.css?v=18.1",
  "void-title-scene.js?v=18.1",
  "void-daily-card.css?v=18.1",
  "void-daily-card.js?v=18.1",
  "void-catalog-view.js?v=18.1",
  "void-festivals.css?v=18.1",
  "void-festivals.js?v=18.1",
  "void-profile-next.css?v=19",
  "av-shell.js?v=21",
  "void-profile-next.js?v=24",
  "void-vip-23.js?v=24.29",
  "void-vip-23.css?v=23",
  "void-refresh-24.css?v=24.29",
  "av-player.css?v=24.36",
  "av-player-home.js?v=24.36",
  "player-sources.js?v=24.36",
  "site-polish.css?v=47.0",
  "av-dashboard-46.js?v=67.0",
  "av-watch-ledger.js?v=47.0",
  "av-recent-48.css?v=63.0",
  "av-recent-48.js?v=67.0",
  "av-layout-51.css?v=62.0",
  "av-layout-51.js?v=68.0",
  "av-home-53.css?v=62.0",
  "av-home-53.js?v=68.0",
  "av-home-77.js?v=77.0",
  "av-global-67.css?v=67.0",
  "av-home-77.css?v=77.0",
  "av-app-78.css?v=78.0",
  "av-app-78.js?v=78.0",
  "av-update-79.css?v=79.0",
  "av-update-79.js?v=79.0",
  "void-profile-20.css?v=20",
  "void-profile-20.js?v=24.29",
  "void-messenger-21.css?v=21",
  "void-people-21.js?v=24.29",
  "kodik-home.js?v=24.40"
];

// V80: only the actual homepage shell is precached; other routes and assets cache on first visit.
const PRELOAD_CONCURRENCY = 6;
async function precacheShell() {
  const cache = await caches.open(CORE_CACHE);
  let next = 0;
  await Promise.all(Array.from({length:Math.min(PRELOAD_CONCURRENCY,NEW_CORE.length)},async()=>{
    while(next < NEW_CORE.length){
      const asset = NEW_CORE[next++];
      try {
        // Individual failures cannot abort a release. A later visit can cache it normally.
        const response = await fetch(asset,{cache:"reload"});
        if(response && response.ok) await cache.put(asset,response);
      }catch(error){ /* Optional resource failed; continue with the others. */ }
    }
  }));
  // Never replace a working offline-capable version with an incomplete shell.
  if(!await cache.match("index.html") || !await cache.match("offline.html"))
    throw new Error("Required offline pages are unavailable");
}
self.addEventListener("install", (event) => {
  event.waitUntil(precacheShell().then(()=>self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names
          .filter((name) => (name.startsWith("av-AV-") || ["av-core-v1", "av-images-v1"].includes(name)) && name !== CORE_CACHE && name !== IMAGE_CACHE && name !== AUDIO_CACHE && name !== STUDIO_CACHE)
          .map((name) => caches.delete(name))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Versioned public catalogue data uses its own browser cache.
  // Download catalogs can carry changing provider URLs: never store those in the offline shell.
  if (url.origin === self.location.origin &&
      (url.pathname.includes("/kodik-data/") || url.pathname.endsWith("/licensed-downloads.json"))) return;

  // Account, inventory and payment responses must NEVER enter a shared service-worker cache.
  if (url.pathname.includes("/api/") || url.pathname.includes("/auth/v1/") || url.pathname.includes("/rest/v1/") || url.pathname.includes("/storage/v1/")) return;

  /* страницы сайта: сначала интернет, без интернета — из кеша */
  if (request.mode === "navigate") {
    event.respondWith(networkFirstPage(request));
    return;
  }

  // Animated banners are optional streamed media; never cache partial Range responses.
  if (url.origin === self.location.origin && url.pathname.includes('/studio/') && /\.(mp4|mp3)$/.test(url.pathname)) return;

  // Bundled decorative art is immutable within this cache version: avoid dozens of
  // redundant network requests and interrupted in-flight images when going offline.
  if (url.origin === self.location.origin && url.pathname.includes('/studio/')) {
    event.respondWith(studioArtCacheFirst(request));
    return;
  }

  const scope = new URL(self.registration.scope);
  const localPath = url.pathname.startsWith(scope.pathname) ? url.pathname.slice(scope.pathname.length) : '';
  if (url.origin === self.location.origin && Object.hasOwn(LICENSED_AUDIO, localPath)) {
    event.respondWith(licensedAudioCacheFirst(request, LICENSED_AUDIO[localPath]));
    return;
  }

  /* свои файлы (иконки, манифест и т.д.): свежие из сети, офлайн — из кеша */
  if (url.origin === self.location.origin) {
    event.respondWith(networkFirstAsset(request));
    return;
  }

  /* картинки AniList: кешируем при просмотре, офлайн показываем из кеша */
  if (request.destination === "image" || /\.(png|jpe?g|webp|gif|svg)$/i.test(url.pathname)) {
    event.respondWith(imageCacheFirst(request));
  }
});

function canonicalPageKey(request) {
  const url = new URL(request.url);
  const scope = new URL(self.registration.scope);
  if (url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return url.href;
  url.hash = "";
  // HTML is a common shell for query-based pages; JS uses the actual URL to select title/episode.
  url.search = "";
  if (url.pathname === scope.pathname) url.pathname += "index.html";
  return url.href;
}

async function networkFirstPage(request) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      await updatePageCache(request, response.clone());
    }
    return response;
  } catch (error) {
    const cache = await caches.open(CORE_CACHE);
    const cached = await cache.match(canonicalPageKey(request));
    if (cached) return cached;
    // A real offline screen beats a partially initialized page for an uncached route.
    const fallback = await cache.match("offline.html");
    if(fallback) return new Response(await fallback.text(), {
      status:503,
      headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store"}
    });
    return new Response(
      '<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>ANIME VOID</title></head>' +
      '<body style="margin:0;background:#090810;color:#f5f3ff;font-family:Arial,sans-serif;text-align:center;padding-top:40vh">' +
      '<h1>Нет соединения</h1><p>Открой ANIME VOID ещё раз, когда появится интернет.</p></body></html>',
      { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
}

async function updatePageCache(request, response) {
  try {
    const cache = await caches.open(CORE_CACHE);
    const key = canonicalPageKey(request);
    await cache.put(key, response.clone());
    if (new URL(request.url).pathname === new URL(self.registration.scope).pathname) {
      await cache.put("./", response.clone());
    }
  } catch (error) { /* ничего страшного */ }
}

async function networkFirstAsset(request) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      try {
        const cache = await caches.open(CORE_CACHE);
        await cache.put(request, response.clone());
      } catch (error) { /* Storage failure must not turn a successful download into a playback failure. */ }
    }
    return response;
  } catch (error) {
    // Versioned scripts must never fall back to older, incompatible code on mobile.
    const assetPath=new URL(request.url).pathname;
    const requireExactVersion=/\.(?:js|css|json|wasm)$/i.test(assetPath);
    const cached = await caches.match(request, { ignoreSearch: !requireExactVersion });
    if (cached) return cached;
    return Response.error();
  }
}

async function imageCacheFirst(request) {
  let cache;
  try { cache = await caches.open(IMAGE_CACHE); const cached = await cache.match(request); if (cached) return cached; } catch {}
  try {
    const response = await fetch(request);
    // Opaque cross-origin images can each consume megabytes of padded quota.
    // Never let automatic remote posters evict core or explicitly downloaded audio.
    if (response && response.ok && response.type !== 'opaque' && cache) {
      try { await cache.put(request, response.clone()); await trimImageCache(cache); } catch {}
    }
    return response;
  } catch { return Response.error(); }
}

async function trimImageCache(cache, limit = IMAGE_CACHE_LIMIT) {
  try {
    const keys = await cache.keys();
    if (keys.length > limit) {
      await Promise.all(
        keys.slice(0, keys.length - limit).map((key) => cache.delete(key))
      );
    }
  } catch (error) { /* ничего страшного */ }
}

async function studioArtCacheFirst(request) {
  let cache;
  try {
    cache=await caches.open(STUDIO_CACHE);
    const cached=await cache.match(request,{ignoreSearch:true});
    if(cached)return cached;
  } catch { /* Rendering continues without persistent cache. */ }
  try {
    const response=await fetch(request);
    if(response&&response.ok&&cache) {
      try{await cache.put(request,response.clone());await trimImageCache(cache,STUDIO_CACHE_LIMIT);}catch{}
    }
    return response;
  } catch {return Response.error();}
}

// Separate bounded cache for the seven explicitly requested licensed recordings.
// Source hash verified both on initial download and cache hit; no synthetic or HTML fallback.
async function licensedAudioCacheFirst(request, expectedHash) {
  async function verified(response) {
    if (!response || !response.ok) return false;
    const bytes = await response.clone().arrayBuffer();
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), n => n.toString(16).padStart(2, '0')).join('');
    return hash === expectedHash;
  }
  let cache;
  try { cache = await caches.open(AUDIO_CACHE); const saved = await cache.match(request, {ignoreSearch:true}); if (await verified(saved)) return saved; if (saved) await cache.delete(request, {ignoreSearch:true}); } catch {}
  try {
    const response = await fetch(request);
    if (!await verified(response)) return Response.error();
    try { if (cache) await cache.put(request, response.clone()); } catch { /* Playback can still work online when persistence is unavailable. */ }
    return response;
  } catch { return Response.error(); }
}
