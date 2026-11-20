/* ANIME VOID — service worker: установка как приложение + офлайн-режим */

const CORE_CACHE = "av-AV-core-v79.0";
const STUDIO_CACHE = "av-AV-studio-v79.0";
const STUDIO_CACHE_LIMIT = 96;
const IMAGE_CACHE = "av-AV-images-v3";
const IMAGE_CACHE_LIMIT = 80;
const AUDIO_CACHE = "av-AV-audio-v1";
const LICENSED_AUDIO = {"audio/japan-rain-v18.mp3": "e8adbedb517c7c30837ac4046dd9d1df3bfc6f98b53e6730af3b07d45b6e9220", "audio/night-forest-v18.mp3": "97a6b3e8973636796c9dd5821b827c94ddcdf6bf33f997ad639e2f6fad3d674b", "audio/train-v18.mp3": "c9dd82787d3846c17cde46b2f8d7b0dba4055d12c35557d26a830f88e483bfe1", "audio/hokkaido-v18.mp3": "8e1678c2f3b594303658e9d60e208cd8be90a5256f948ed1b205457ac53a04ea", "audio/rain-wind-v18.mp3": "f8250ba7c86da6a1acdda757b099beb01e37e1ec64b68f2fa33fc17e8f1028fb", "audio/stream-v18.mp3": "ecbf0faa79d994eb2e975a65684e346d5b428b94e0a91f8735bacf93cf521e68", "audio/forest-water-v18.mp3": "d46547199952e9d64c32a42db23a49511f8d45b3cffad2a6165b2395e31bd8f7", "audio/river-v21.mp3": "67d7d1552ba3221d1e63d58f57f502ac912db40e4ddf2ed126b10d53d4a68e19", "audio/window-v21.mp3": "8b7a8e3b680e45c8a166f04892ec72cebcbe096fcdd61b906896d5a30d961e86", "audio/distant-train-v21.mp3": "c7834558523fd5b1fcbe867b2c3495d8c269ca106fa33529086b76e43d039844", "audio/rail-rain-v21.mp3": "0de84d6f79ebe042e6a2e7004f9f25221b056d959a068f35bc3d8c6054296f62", "audio/carefree-v21.mp3": "76adb4b946dac28afe5df1b2d21b743bc4bb4ce5ed1c77daf4aba4b8f9f63948", "audio/guitar-sun-v21.mp3": "c5977e14b4b829915c12ef05638debc3298ba06a64ee5b6c9cbe5a7febbef2c1", "audio/easy-lemon-v21.mp3": "6ff9bece34d27492e63b5f9bd7a0ad272e8f63e51ff2deb547ba415288115b80", "audio/guitar-night-v21.mp3": "fbb509100709795ad6c6e920b791f67bfb876e710bc9e0e5bb7857530412b519"};


const NEW_CORE = [
 "av-update-79.js?v=79.0", "av-update-79.css?v=79.0",
 "av-app-78.css?v=78.0", "av-app-78.js?v=78.0",
 "app.webmanifest?v=77.0", "match.html", "av-match-core-77.js?v=77.0", "av-match-77.js?v=77.0", "av-match-77.css?v=77.0",
 "av-home-77.js?v=77.0", "av-home-77.css?v=77.0",
 "av-account.js?v=73.0", "account-page.js?v=73.0", "av-auth-73.css?v=73.0",
 "av-party-sync-76.js?v=76.0", "av-party-76.js?v=76.0", "av-party-76.css?v=76.0",
 "av-party-75.js?v=75.0", "av-party-75.css?v=75.0",
 "av-kodik-player.js?v=76.0",
 "av-party-74.js?v=74.0", "av-party-74.css?v=74.0",
 "av-account.js?v=72.0", "account-page.js?v=72.0",
 "av-party-72.js?v=72.0",
 "av-party-71.js?v=71.0", "av-party-71.css?v=71.0",
 "av-download-policy-70.js?v=70.0", "av-download-70.js?v=70.0", "av-download-70.css?v=70.0",
 "av-download-policy-69.js?v=69.0", "av-download-69.js?v=69.0", "av-download-69.css?v=69.0",
 "./party.html", "party.html", "av-party-68.css?v=68.0", "av-party-68.js?v=68.0",
 "av-watch-57.js?v=68.0", "av-layout-51.js?v=68.0",
 "av-global-67.css?v=67.0",
 "av-kodik-test.js?v=67.0", "av-player.js?v=67.0",
 "av-recent-48.js?v=67.0", "av-dashboard-46.js?v=67.0", "av-history-46.js?v=67.0",
 "av-watch-57.js?v=66.0", "av-watch-57.css?v=66.0",
 "av-dashboard-46.js?v=63.0", "av-recent-48.js?v=63.0", "av-recent-48.css?v=63.0",
 "av-layout-51.js?v=62.0", "av-layout-51.css?v=62.0", "av-home-53.js?v=62.0", "av-home-53.css?v=62.0", "av-profile-54.css?v=62.0",
 "av-history-46.js?v=61.0", "av-history-46.css?v=61.0",
 "account-page.js?v=65.0",
 "av-recent-48.js?v=59.0",
 "av-profile-charts-58.css?v=58.0", "void-display-charts.js?v=58.0",
 "av-watch-57.css?v=57.0", "av-watch-57.js?v=57.0",
 "movies.html", "movies-data.json", "av-watch-ledger.js?v=24.40", "av-watch-tracker.js?v=24.40", "site-polish.css?v=24.40",
 "anime-comments.js?v=24.15", "anime-comments.css?v=24.15",
 "kodik.html", "kodik-catalog.css?v=24.13", "kodik-data-client.js?v=24.13", "kodik-catalog.js?v=24.40", "kodik-home.js?v=24.40", "kodik-bridge.js?v=24.40",
 'av-kodik-player.css?v=24.36',
 'av-kodik-test.js?v=24.40',
 'av-kodik-player.js?v=24.40',
 'av-source-loader.js?v=24.36',
 'vendor/hls.light-1.6.15.min.js?v=24.31',
 'player-sources.js?v=24.36','av-player.js?v=24.36','av-player-home.js?v=24.36','av-player.css?v=24.36',
  'account.html','av-account.js?v=60.0','account-page.js?v=24.29',"./404.html", "./anime-a-silent-voice.html", "./anime-attack-on-titan.html", "./anime-bakemonogatari.html", "./anime-death-note.html", "./anime-demon-slayer.html", "./anime-hunter-x-hunter.html", "./anime-jujutsu-kaisen.html", "./anime-my-hero-academia.html", "./anime-one-piece.html", "./anime-one-punch-man.html", "./anime.html", "./art-credits.html", "./art-sources.json?v=24.29", "./atelier-catalog.json?v=24.29", "./audio-sources.html", "./av-atmosphere.css?v=24.29", "./av-atmosphere.js?v=25.3", "./av-design.css?v=24.29", "./av-design.js?v=24.29", "./av-enhancements.css?v=24.29", "./av-enhancements.js?v=55.0", "./av-progress.css?v=24.29", "./av-progress.js?v=24.29", "./av-rewards.js?v=24.29", "./av-safety.js?v=24.40", "./av-shell.js?v=24.29", "./av-state.js?v=24.40", "./av-titles.js?v=24.29", "./banner-atelier.css?v=24.29", "./banner-atelier.js?v=24.29", "./character-quotes-23.json?v=24.29", "./collections.html", "./community-rules.html", "./community.html", "./eras.html", "./explore.html", "./festivals.html", "./field-recordings-v18.json?v=24.29", "./google2c8f216ee8b4f66e.html", "./index.html", "./journal.html", "./manga-catalog-23.json?v=24.29", "./manga.html", "./manifest.json?v=24.29", "./messages.html", "./monogatari-order.html", "./music.html", "./profile-catalog.json?v=24.29", "./profile-studio.css?v=24.29", "./profile-studio.js?v=24.29", "./profile.html", "./quotes.html", "./reading.css?v=24.29", "./reading.html", "./reading.js?v=24.29", "./secrets.html", "./story-dna.html", "./studio-config.js?v=24.29", "./studios.html", "./supabase-client.js?v=24.29", "./taste.html", "./universe-data.json?v=24.29", "./universe.css?v=24.29", "./universe.html", "./universe.js?v=24.29", "./updates.html", "./visual-avatars.json?v=24.29", "./visual-gallery.json?v=24.29", "./visual-studio.css?v=24.29", "./visual-studio.js?v=24.40", "./void-achievements-22.css?v=24.29", "./void-achievements-22.js?v=24.29", "./void-catalog-view.js?v=24.29", "./void-collections.css?v=24.29", "./void-collections.js?v=24.29", "./void-community-layout.css?v=24.29", "./void-custom.js?v=24.29", "./void-daily-card.css?v=24.29", "./void-daily-card.js?v=24.29", "./void-dashboard.css?v=24.29", "./void-dashboard.js?v=24.29", "./void-display-charts.css?v=24.29", "./void-display-charts.js?v=24.29", "./void-eras.css?v=24.29", "./void-eras.js?v=24.29", "./void-evolution.css?v=24.29", "./void-evolution.js?v=24.29", "./void-explore.css?v=24.29", "./void-explore.js?v=24.29", "./void-festivals.css?v=24.29", "./void-festivals.js?v=24.29", "./void-i18n-24.js?v=24.29", "./void-interface.css?v=24.29", "./void-interface.js?v=24.29", "./void-journal.css?v=24.29", "./void-journal.js?v=24.29", "./void-legacy-layout.css?v=24.29", "./void-lexicon.js?v=24.29", "./void-library-23.css?v=24.29", "./void-manga-23.js?v=24.29", "./void-messages.css?v=24.29", "./void-messages.js?v=24.29", "./void-messenger-21.css?v=24.29", "./void-music.css?v=24.29", "./void-music.js?v=24.29", "./void-people-21.js?v=24.29", "./void-profile-20.css?v=24.29", "./void-profile-20.js?v=24.29", "./void-profile-layout.css?v=24.29", "./void-profile-next.css?v=24.29", "./void-profile-next.js?v=24.29", "./void-quotes-23.js?v=24.29", "./void-quotes.css?v=24.29", "./void-quotes.js?v=24.29", "./void-reader-23.js?v=24.29", "./void-reader-bookmarks.js?v=24.29", "./void-reading-stats.css?v=24.29", "./void-reading-stats.js?v=24.29", "./void-refresh-24.css?v=24.29", "./void-secrets.css?v=24.29", "./void-secrets.js?v=24.29", "./void-social.css?v=24.29", "./void-social.js?v=24.29", "./void-story-dna.css?v=24.29", "./void-story-dna.js?v=24.29", "./void-studios-data.js?v=24.29", "./void-studios.css?v=24.29", "./void-studios.js?v=24.29", "./void-taste.css?v=24.29", "./void-taste.js?v=24.29", "./void-title-accent.css?v=24.29", "./void-title-accent.js?v=24.29", "./void-title-layout.css?v=24.29", "./void-title-scene.css?v=24.29", "./void-title-scene.js?v=24.29", "./void-tv.css?v=24.29", "./void-tv.js?v=24.29", "./void-vip-23.css?v=24.29", "./void-vip-23.js?v=24.29", "./void-watch-layout.css?v=24.29", "./watch.html", "./vendor/fflate.js"];
// Optional studio art is cached on demand, not prefetched on install.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CORE_CACHE)
      .then((cache) => cache.addAll(NEW_CORE))
      .then(() => self.skipWaiting())
  );
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
