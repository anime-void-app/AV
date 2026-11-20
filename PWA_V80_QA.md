# ANIME VOID V80 — release verification

## Scope
V80 upgrades only the service worker installation reliability and offline fallback; no database migrations, account/data writes, or player changes.

- Precache actual current homepage HTML/linked JS/CSS and app icon/manifest, avoiding obsolete historical scripts and unnecessary secondary pages.
- Concurrency-limited, per-file fault-tolerant precache.
- The worker cannot replace an existing healthy installation unless both `index.html` and `offline.html` were cached.
- Visited secondary pages/scripts continue to be stored on demand by the unchanged network-first handlers.
- Separate branded, responsive offline page for unvisited routes when offline.

## Checks
`node --test tests/v80-offline-pwa.cjs`

## Manual QA
1. Open in Android Chrome and iOS Safari, verify home, card grid, catalog, profile and player (connected).
2. Install PWA. Force offline. Previously visited pages should use cache; an unvisited page should show branded offline.html.
3. Disable network during the service worker install request for one nonessential asset. The installation should finish.
4. Disable network during `offline.html` preload. Update should fail and the prior installed worker should remain active.
5. Check sign-in with Google/email, watch history, voice and two-person watch-room sync manually on two devices. V80 does not alter these features.
6. Check desktop and 320px screen for offline fallback accessibility.

## Rollback
`backup/pre-v80-offline-reliability-20261120` preserves V79.
