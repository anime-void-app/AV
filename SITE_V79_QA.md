# ANIME VOID V79 — Quality and performance pass

Scope: website/PWA only, no Android APK or RuStore release.

- PWA installs core assets only (~6 MB) instead of 440 eager resources (~30 MB).
- Studio artwork is cached on-demand with 96-item cap.
- Update banner asks before reloading; active players are never reloaded automatically.
- Existing auth, Anime Match, rooms, voice, and watch provider code unchanged.
- QA: GitHub Actions smoke suite. Manual end-to-end testing is still required.

Manual checks: Android Chrome 360px, iPhone Safari / home-screen installation, desktop 1440px, OAuth return session, two-device playback+voice, offline-first return visit, PWA update banner.

Rollback: backup/pre-v79-site-qa-20261120. No schema changes.
