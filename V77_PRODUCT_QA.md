# V77 ANIME VOID — review, production and rollback

## Product brief
Improve existing product quality and navigation for Android/PWA, iPhone Safari and desktop. No duplicate catalog, calendar, recommendation feed, achievements or watch-party app. Use responsive layouts, accessible focus states, optimized images and no private profile inference. Preserve working Supabase auth, player, progress, purchase and rewards code. New features have their own files and tests; update main only after staging and backup.

## Deliverables
- New dual-viewer Anime Match from manually selected genres (1–3 each). Shareable query parameters; bounded safe ranking; AniList on explicit action, fallback to local catalog; link to watch party only for provider-supported title.
- Compact cinematic home card links to Match; main navigation and mobile five-tab bar untouched.
- Correct PWA app.webmanifest on major routes, stable id and start URL, app shortcuts and conditional Android install prompt; original manifest.json preserved as Kodik metadata.
- Versioned V77 CSS/JS and service worker cache; native lazy loading for offscreen anime poster images.
- Extra public page SEO and sitemap entry. Profile, account and video state behavior unchanged.

## Manual browser QA still required
1. Android Chrome 320/360/390/430: test nav overlay, keyboard, genre max 3, sharing, results, status and poster cards.
2. Desktop 768/1024/1440: layout, focus/Tab, hover, search/filter, hero visibility and no side-panel overlap.
3. Match: default picks; remove all, choose 3, click disabled fourth; parse a shared link; try no network to exercise local fallback; check card links.
4. Test language RU/EN, theme presets, reduced-motion, large fonts / 200% zoom.
5. PWA: verify HTTPS returns JSON mime for app.webmanifest, install to Android home screen, offline shell navigation. On iOS Safari use Share -> Add to Home Screen.
6. Existing: account Google login/email, profile, lists, cloud backup, achievements, watch.html, Kodik, party join/chat/voice, service worker updates.
7. Kodik commands remain provider dependent; 2-user real-time confirmation is not included in static tests.
8. Content eligibility: users must have their own video source; no download or transcoding.

## Test
node --test tests/v77-product-refresh.cjs
Important: available in-chat tests are source-level / pure JS only. They do not replace real device or browser QA.

## Rollback
Backup branch: backup/pre-v77-product-refresh-20261120 (V76).
Revert V77 commits without force-pushing; verify GitHub Pages deployment. No database schema or cloud migrations were performed.
