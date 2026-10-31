/* ANIME VOID — service worker: установка как приложение + офлайн-режим */

const CORE_CACHE = "av-AV-core-v18.1.1";
const IMAGE_CACHE = "av-AV-images-v3";
const IMAGE_CACHE_LIMIT = 80;
const AUDIO_CACHE = "av-AV-audio-v1";
const LICENSED_AUDIO = {"audio/japan-rain-v18.mp3": "e8adbedb517c7c30837ac4046dd9d1df3bfc6f98b53e6730af3b07d45b6e9220", "audio/night-forest-v18.mp3": "97a6b3e8973636796c9dd5821b827c94ddcdf6bf33f997ad639e2f6fad3d674b", "audio/train-v18.mp3": "c9dd82787d3846c17cde46b2f8d7b0dba4055d12c35557d26a830f88e483bfe1", "audio/hokkaido-v18.mp3": "8e1678c2f3b594303658e9d60e208cd8be90a5256f948ed1b205457ac53a04ea", "audio/rain-wind-v18.mp3": "f8250ba7c86da6a1acdda757b099beb01e37e1ec64b68f2fa33fc17e8f1028fb", "audio/stream-v18.mp3": "ecbf0faa79d994eb2e975a65684e346d5b428b94e0a91f8735bacf93cf521e68", "audio/forest-water-v18.mp3": "d46547199952e9d64c32a42db23a49511f8d45b3cffad2a6165b2395e31bd8f7"};


const NEW_CORE = ["./void-legacy-layout.css?v=18.1","./void-title-layout.css?v=18.1","./void-watch-layout.css?v=18.1","./void-community-layout.css?v=18.1","./void-profile-layout.css?v=18.1","./void-display-charts.js?v=18.1","./void-display-charts.css?v=18.1","./eras.html","./void-eras.js?v=18.1","./void-eras.css?v=18.1","./collections.html","./void-collections.js?v=18.1","./void-collections.css?v=18.1","./void-evolution.js?v=18.1","./void-evolution.css?v=18.1","./taste.html","./void-taste.js?v=18.1","./void-taste.css?v=18.1","./explore.html","./void-explore.js?v=18.1","./void-explore.css?v=18.1","./secrets.html","./void-secrets.js?v=18.1","./void-secrets.css?v=18.1","./festivals.html","./void-festivals.js?v=18.1","./void-festivals.css?v=18.1","./studios.html","./void-studios.js?v=18.1","./void-studios-data.js?v=18.1","./void-studios.css?v=18.1","./music.html","./void-music.js?v=18.1","./void-music.css?v=18.1","./story-dna.html","./void-story-dna.js?v=18.1","./void-story-dna.css?v=18.1","./anime-a-silent-voice.html","./anime-attack-on-titan.html","./anime-bakemonogatari.html","./anime-death-note.html","./anime-demon-slayer.html","./anime-hunter-x-hunter.html","./anime-jujutsu-kaisen.html","./anime-my-hero-academia.html","./anime-one-piece.html","./anime-one-punch-man.html","./void-catalog-view.js?v=18.1","./void-daily-card.js?v=18.1","./void-daily-card.css?v=18.1","./void-title-scene.js?v=18.1","./void-title-scene.css?v=18.1","./void-title-accent.js?v=18.1","./void-title-accent.css?v=18.1","./void-tv.js?v=18.1","./void-tv.css?v=18.1","./av-atmosphere.js?v=16.6","./av-atmosphere.css?v=16.6","./audio-sources.html","./field-recordings-v18.json","./void-reading-stats.js?v=18.1","./void-reading-stats.css?v=18.1","./av-progress.js?v=18.1","./av-progress.css?v=18.1","./void-reader-bookmarks.js?v=18.1","./void-lexicon.js?v=18.1","./quotes.html","./void-quotes.js?v=18.1","./void-quotes.css?v=18.1","./av-rewards.js?v=18.1","./profile-studio.js?v=18.1","./av-state.js?v=18.1","./void-social.js?v=18.1","./void-social.css?v=18.1","./void-dashboard.js?v=18.1","./void-dashboard.css?v=18.1","./journal.html","./void-journal.js?v=18.1","./void-journal.css?v=18.1","./reading.html","./reading.css","./reading.js","./vendor/fflate.js","./void-interface.js?v=18.1","./void-interface.css?v=18.1","./av-safety.js?v=18.1"];
const CORE_FILES = [
  ...NEW_CORE,
  "./visual-studio.js?v=17.4.1",
  "./visual-studio.css?v=17.4",
  "./visual-gallery.json",
  "./visual-avatars.json",
  "./studio/avatars/dusk-her.webp",
  "./studio/avatars/cosmic-pilot.svg",
  "./studio/avatars/ocean-singer.svg",
  "./studio/avatars/autumn-letter.svg",
  "./studio/avatars/immortal-him.webp",
  "./studio/avatars/neon-heart.svg",
  "./studio/avatars/dusk-him.webp",
  "./studio/avatars/sakura-muse.svg",
  "./studio/avatars/ember-knight.svg",
  "./studio/avatars/moon-witch.svg",
  "./studio/avatars/red-ronin.svg",
  "./studio/avatars/immortal-her.webp",
  "./",
  "./index.html",
  "./anime.html",
  "./watch.html",
  "./profile.html",
  "./profile-studio.css?v=17.2",
  "./profile-studio.js?v=18.1",
  "./profile-catalog.json?v=17.3",
  "./studio-config.js?v=17.0",
  "./av-safety.js?v=9",
  "./av-titles.js?v=20261030-2",
  "./av-state.js?v=18.1",
  "./av-atmosphere.js?v=16.6",
  "./av-atmosphere.css?v=16.6",
  "./av-design.css?v=17.0",
  "./av-design.js?v=17.0",
  "./updates.html",
  "./universe.html",
  "./universe.js?v=16.7",
  "./universe.css?v=16.7",
  "./universe-data.json?v=16.7",
  "./poster-unavailable.svg",
  "./audio-sources.html",
  "./av-enhancements.js?v=1",
  "./av-enhancements.css?v=1",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./banner-atelier.js?v=17.3",
  "./banner-atelier.css?v=17.3",
  "./atelier-catalog.json",
  "./art-credits.html",
  "./supabase-client.js?v=2.49.8",
  "./studio/atelier/healer.webp",
  "./studio/atelier/healer-thumb.webp",
  "./studio/atelier/savepoint.webp",
  "./studio/atelier/savepoint-thumb.webp",
  "./studio/atelier/rain.webp",
  "./studio/atelier/rain-thumb.webp",
  "./studio/atelier/horizon.webp",
  "./studio/atelier/horizon-thumb.webp",
  "./studio/atelier/raincity.webp",
  "./studio/atelier/raincity-thumb.webp",
  "./studio/atelier/dream.webp",
  "./studio/atelier/dream-thumb.webp",
  "./studio/atelier/council.webp",
  "./studio/atelier/council-thumb.webp",
  "./studio/atelier/market.webp",
  "./studio/atelier/market-thumb.webp",
  "./studio/atelier/temple.webp",
  "./studio/atelier/temple-thumb.webp",
  "./studio/atelier/treasure.webp",
  "./studio/atelier/treasure-thumb.webp",
  "./studio/atelier/cottage.webp",
  "./studio/atelier/cottage-thumb.webp",
  "./studio/atelier/fairytree.webp",
  "./studio/atelier/fairytree-thumb.webp",
  "./studio/atelier/autumn.webp",
  "./studio/atelier/autumn-thumb.webp",
  "./studio/atelier/sunrise.webp",
  "./studio/atelier/sunrise-thumb.webp",
  "./studio/atelier/unity.webp",
  "./studio/atelier/unity-thumb.webp",
  "./studio/atelier/storm.webp",
  "./studio/atelier/storm-thumb.webp",
  "./studio/atelier/moon.webp",
  "./studio/atelier/moon-thumb.webp",
  "./studio/atelier/forest.webp",
  "./studio/atelier/forest-thumb.webp",
  "./studio/atelier/komona.webp",
  "./studio/atelier/komona-thumb.webp",
  "./studio/atelier/meeting.webp",
  "./studio/atelier/meeting-thumb.webp",
  "./studio/atelier/micro.webp",
  "./studio/atelier/micro-thumb.webp",
  "./studio/atelier/pepper.webp",
  "./studio/atelier/pepper-thumb.webp",
  "./studio/atelier/snow.webp",
  "./studio/atelier/snow-thumb.webp",
  "./studio/atelier/shichimi.webp",
  "./studio/atelier/shichimi-thumb.webp",
  "./community.html",
  "./void-custom.js?v=17.4.1",
  "./void-social.js?v=18.1",
  "./void-social.css?v=18.1",
  "./community-rules.html"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CORE_CACHE)
      .then(async (cache) => {await cache.addAll(NEW_CORE);await Promise.all(CORE_FILES.filter(file=>!NEW_CORE.includes(file)).map(file=>cache.add(file).catch(()=>null)));})
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names
          .filter((name) => (name.startsWith("av-AV-") || ["av-core-v1", "av-images-v1"].includes(name)) && name !== CORE_CACHE && name !== IMAGE_CACHE && name !== AUDIO_CACHE)
          .map((name) => caches.delete(name))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Account, inventory and payment responses must NEVER enter a shared service-worker cache.
  if (url.pathname.includes("/api/") || url.pathname.includes("/auth/v1/") || url.pathname.includes("/rest/v1/") || url.pathname.includes("/storage/v1/")) return;

  /* страницы сайта: сначала интернет, без интернета — из кеша */
  if (request.mode === "navigate") {
    event.respondWith(networkFirstPage(request));
    return;
  }

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
    const cached = await caches.match(request, { ignoreSearch: true });
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

async function trimImageCache(cache) {
  try {
    const keys = await cache.keys();
    if (keys.length > IMAGE_CACHE_LIMIT) {
      await Promise.all(
        keys.slice(0, keys.length - IMAGE_CACHE_LIMIT).map((key) => cache.delete(key))
      );
    }
  } catch (error) { /* ничего страшного */ }
}

async function studioArtCacheFirst(request) {
  const cache = await caches.open(CORE_CACHE);
  const cached = await cache.match(request, { ignoreSearch: true });
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && response.ok) await cache.put(request, response.clone());
    return response;
  } catch (error) { return Response.error(); }
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
