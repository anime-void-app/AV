/* ANIME VOID — service worker: установка как приложение + офлайн-режим */

const CORE_CACHE = "av-AV-core-v15";
const IMAGE_CACHE = "av-AV-images-v2";
const IMAGE_CACHE_LIMIT = 300;

const CORE_FILES = [
  "./studio/cinema/clouds-thumb.jpg",
  "./studio/cinema/balcony-thumb.jpg",
  "./studio/cinema/beach-thumb.jpg",
  "./studio/cinema/shrine-thumb.jpg",
  "./studio/cinema/city-thumb.jpg",
  "./studio/cinema/crossing-thumb.jpg",
  "./studio/cinema/lake-thumb.jpg",
  "./studio/cinema/alley-thumb.jpg",
  "./studio/cinema/bridge-thumb.jpg",
  "./studio/cinema/konbini-thumb.jpg",
  "./studio/cinema/spring-thumb.jpg",
  "./studio/cinema/rooftop-thumb.jpg",
  "./studio/cinema/torii-thumb.jpg",
  "./studio/cinema/station-thumb.jpg",
  "./studio/cinema/paddy-thumb.jpg",
  "./studio/cinema/railway-thumb.jpg",
  "./studio/cinema/sakura-thumb.jpg",
  "./studio/cinema/sea-thumb.jpg",
  "./studio/cinema/temple-thumb.jpg",
  "./studio/cinema/bamboo-thumb.jpg",
  "./studio/cinema/gazebo-thumb.jpg",
  "./studio/cinema/snowlamp-thumb.jpg",
  "./studio/cinema/stairs-thumb.jpg",
  "./studio/cinema/cafe-thumb.jpg",

  "./visual-studio.js?v=17.2",
  "./visual-studio.css?v=17.2",
  "./visual-gallery.json",
  "./visual-avatars.json",
  "./studio/cinema/eclipse.svg",
  "./studio/cinema/clouds.webp",
  "./studio/cinema/balcony.webp",
  "./studio/cinema/beach.webp",
  "./studio/cinema/shrine.webp",
  "./studio/cinema/city.webp",
  "./studio/cinema/crossing.webp",
  "./studio/cinema/lake.webp",
  "./studio/cinema/alley.webp",
  "./studio/cinema/bridge.webp",
  "./studio/cinema/glacier.svg",
  "./studio/cinema/singularity.svg",
  "./studio/cinema/konbini.webp",
  "./studio/cinema/emerald.svg",
  "./studio/cinema/spring.webp",
  "./studio/cinema/rooftop.webp",
  "./studio/cinema/torii.webp",
  "./studio/cinema/station.webp",
  "./studio/cinema/synthwave.svg",
  "./studio/cinema/paddy.webp",
  "./studio/cinema/railway.webp",
  "./studio/cinema/sakura.webp",
  "./studio/cinema/sea.webp",
  "./studio/cinema/inferno.svg",
  "./studio/cinema/celestial.svg",
  "./studio/cinema/temple.webp",
  "./studio/cinema/bamboo.webp",
  "./studio/cinema/matrix.svg",
  "./studio/cinema/gazebo.webp",
  "./studio/cinema/snowlamp.webp",
  "./studio/cinema/stairs.webp",
  "./studio/cinema/cafe.webp",
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
  "./profile-studio.js?v=17.2",
  "./profile-catalog.json?v=17.2",
  "./studio-config.js?v=17.0",
  "./studio/void.svg",
  "./studio/city.svg",
  "./studio/sakura.svg",
  "./studio/orbit.svg",
  "./studio/shrine.svg",
  "./studio/forest.svg",
  "./studio/ocean.svg",
  "./studio/aurora.svg",
  "./studio/library.svg",
  "./studio/banners/neon-heart.svg",
  "./studio/banners/moon-witch.svg",
  "./studio/banners/sakura-muse.svg",
  "./studio/banners/red-ronin.svg",
  "./studio/banners/star-promise.svg",
  "./studio/banners/sky-dragon.svg",
  "./studio/banners/ocean-singer.svg",
  "./studio/banners/ember-knight.svg",
  "./studio/banners/cosmic-pilot.svg",
  "./studio/banners/autumn-letter.svg",
  "./studio/banners/lantern-road.svg",
  "./studio/banners/rainy-window.svg",
  "./studio/banners/dusk-duo.webp",
  "./studio/banners/immortal-promise.webp",


  "./av-safety.js?v=5",
  "./av-safety.js?v=6",
  "./av-safety.js?v=7",
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
  "./icon-512.png"
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
  if (url.pathname.includes("/api/")) return;

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
