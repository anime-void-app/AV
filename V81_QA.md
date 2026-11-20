# ANIME VOID V81 — desktop/mobile cinema journey

## Changes
- av-cinema-81.css: additive responsive visual layer on 17 key pages.
- av-journey-81.js: homepage quick links and profile Cinema Rank + 6 visual emblems based on measured playback; read-only.
- av-native-watch-81.js: observes native HTML5 video and uses existing AVWatchAutoComplete only after 90% unique observed coverage and >=95% position.
- Existing Kodik tracking, legacy ranks, achievement rights, purchases, logins, sync and watch parties unchanged.
- Service worker includes new homepage assets and rotates cache.

## Verification
1. Run: node --test tests/v80-offline-pwa.cjs tests/v81-responsive-journey.cjs
2. Check 320/390/768/1440px screens, themes, reduced motion and keyboard focus.
3. Seek, open page and ad playback must not auto-complete Kodik episodes.
4. For configured native HTML5 source, observe >=90% unique footage and reach >=95% position before marking.
5. Compare signed-in backups, manual marks, old achievements and purchases.
6. Confirm PWA install and offline fallback, without refreshing active videos.

## Limits
- Cinema rank and six new emblems are local visual achievements, not redeemable or server-authoritative.
- Only native HTML5 playback or provider telemetry can establish actual time; unsupported embeds are excluded.
- Cloud transfer requires sign-in and successful existing sync.
- RuStore APK/AAB building and store publication are a separate release.

## Rollback
Revert V81 PR; existing data schema remains unchanged.