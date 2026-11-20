# ANIME VOID V82 — Mobile navigation QA

Goal: consistent 17-page mobile navigation and fix the narrow watch-header brand shown on Android. No playback, history or account changes, no APK release.

## Delivered
- Shared existing bottom dock on 8 additional major routes, total 17
- Compact phone headers on home, watch, anime details, and profile
- Brand on a separate row in watch header, wrapped controls, full-width home search and scrollable nav links
- Better narrow-screen dock labels and new PWA cache revision

## Manual device verification (not yet executed)
1. Android: Chrome 320 / 360 / 390 / 430 CSS px, landscape. Watch title and brand must not clip.
2. On home: search focus, keyword suggestions, language/theme, horizontal nav. Bottom tabs should be accessible.
3. Go through all 17 routes; verify five tabs, browser back, keyboard focus, content not hidden behind dock.
4. iPhone Safari home indicator, virtual keyboard, installed PWA and offline fallback.
5. Watch one Kodik video and one HTML5 video. An iframe loading does not certify playable video.
6. Watch with two users in party room. Embedded watch.html?party=1 must have no dock.
7. Cloud auth and saved local progress must remain intact; no fake watch hours.

## Rollback
Restore `backup/pre-v82-mobile-navigation-20261120`. There are no database migrations.
