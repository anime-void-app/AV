# ANIME VOID V78 — app-first navigation QA

## Goal
Unify the experience across Android PWA, iOS Safari and desktop without duplicating existing Anime Match, watch parties, calendar, lists, search, or profile systems.

## Changed
- New responsive five-tab mobile navigation across nine primary pages; desktop keeps its established header.
- Existing home page gains a concise quick-access hub. Continue and schedule tiles only appear if those sections actually contain data.
- The homepage search tab focuses the existing search input rather than creating a second search state.
- Safe-area padding, reduced-motion support, keyboard focus, top button, and opt-in install guidance.
- Watch-party iframe embed skips navigation. No changes to account, provider, watch progress, voice, RLS or catalog storage.
- PWA cache version bumped so updated assets replace the previous cached shell.

## Manual verification needed
1. Desktop 1440px: header remains intact, hub fits in three columns, no bottom dock.
2. Android 360px/390px: five tabs usable, footer never overlaps player/chat controls, keyboard search focus works, browser back works.
3. iPhone 320px and safe-area: labels don't clip, dock stays above the home indicator.
4. Party: two logged-in users; join room and test chat, voice, play/pause and video sync. The embedded watch.html?party=1 must not show a dock.
5. Existing features: continue, favorites, calendar, anime pages, history, profiles, Google/email sign-in, installed PWA, offline fallback.
6. Browser install: on supported Android browsers native V77 install button remains. iOS help is available via the home hub details element.

## Rollback
Restore backup/pre-v78-app-navigation-20261120. No database migrations.
