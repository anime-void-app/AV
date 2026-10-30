/* ANIME VOID — service worker: установка как приложение + офлайн-режим */

const CORE_CACHE = "av-AV-core-v4";
const IMAGE_CACHE = "av-AV-images-v2";
const IMAGE_CACHE_LIMIT = 300;

const CORE_FILES = [
  "./",
  "./index.html",
  "./anime.html",
  "./watch.html",
  "./profile.html",
  "./av-safety.js?v=1",
  "./av-titles.js?v=20261030-2",
  "./av-state.js?v=16",
  "./av-design.css?v=16.1",
  "./av-design.js?v=16.1",
  "./updates.html",
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

  /* страницы сайта: сначала интернет, без интернета — из кеша */
  if (request.mode === "navigate") {
    event.respondWith(networkFirstPage(request));
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
