/* ANIME VOID — service worker: установка как приложение + офлайн-режим */

const CORE_CACHE = "av-AV-core-v17";
const IMAGE_CACHE = "av-AV-images-v2";
const IMAGE_CACHE_LIMIT = 300;

const CORE_FILES = [
  "./visual-studio.js?v=17.4",
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
  "./profile-studio.js?v=17.4",
  "./profile-catalog.json?v=17.3",
  "./studio-config.js?v=17.0",
  "./av-safety.js?v=9",
  "./av-titles.js?v=20261030-2",
  "./av-state.js?v=16",
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
  "./void-custom.js?v=17.4",
  "./void-social.js?v=17.4",
  "./void-social.css?v=17.4",
  "./community-rules.html"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CORE_CACHE)
      .then((cache) => Promise.all(
        CORE_FILES.map((file) => cache.add(file).catch(() => null))
      ))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names
          .filter((name) => (name.startsWith("av-AV-") || ["av-core-v1", "av-images-v1"].includes(name)) && name !== CORE_CACHE && name !== IMAGE_CACHE)
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
      const cache = await caches.open(CORE_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request, { ignoreSearch: true });
    if (cached) return cached;
    return Response.error();
  }
}

async function imageCacheFirst(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && (response.ok || response.type === "opaque")) {
      cache.put(request, response.clone()).then(() => trimImageCache(cache));
    }
    return response;
  } catch (error) {
    return Response.error();
  }
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
