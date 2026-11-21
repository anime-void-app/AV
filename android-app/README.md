# ANIME VOID — Android edition / RuStore preparation

## What this project includes
- Android Java native shell with AnimeVoid web catalog and player;
- an **offline on-device anime diary** (private, stored in SharedPreferences);
- local scheduled viewing reminders (notification permission requested only when needed, restored after reboot);
- native share sheet, page shortcuts, Android back navigation, file-picker for avatar uploads, fullscreen HTML video;
- HTTPS only, no JavaScript bridge, no hidden proxy or video redistribution;
- branded icon, navigation, dark theme with three free local accent options, Android 8.0+ (API 26), target SDK 35.

The Android diary is local **and is not cloud-synced with the site's favorites**. Third-party embedded media and Google OAuth may be restricted in Android WebView; test carefully and offer email sign-in / browser fallback. APK does not grant rights to anime videos.

## Build
Open `android-app/` in Android Studio (JDK 17, Gradle 8.11.1, Android SDK 35) or use GitHub Actions **ANIME VOID Android APK**.
The workflow creates a **debug APK** for testing. This is **not** the RuStore release binary.

For a release signed with your permanent keystore, provide GitHub Actions secrets:
- `AV_KEYSTORE_BASE64` — base64 of your **own** .jks keystore;
- `AV_STORE_PASSWORD`, `AV_KEY_ALIAS`, `AV_KEY_PASSWORD`.

Never commit keystores or passwords to Git; keep your own offline backup.
With all four secrets, the workflow uploads `animevoid-rustore-signed-apk`.
The exact applicationId is `ru.animevoid.app`; confirm package availability before the first submission and keep the same certificate for updates.

## RuStore blockers before submission
1. Obtain permission for copyrighted anime episodes, artwork, posters and source embeds, or use properly licensed/authorized content. Check UGC moderation and age rating.
2. Verify authentication on physical Android devices, especially third-party OAuth (not guaranteed in WebView), Kodik playback, video fullscreen and file upload.
3. Test notifications and local diary with network disabled; check reboot rescheduling.
4. Prepare a real privacy policy describing account, third-party media, analytics and local reminders; provide real app screenshots and a support email.
5. Check accessibility (320px+), crash/ANR rate, permissions declaration, copyright, content ratings and link behavior.
6. Only upload a signed release APK; **debug APK and unsigned release are not store-ready**.

## Monetization roadmap — OFF by default
- Cosmetic profile themes, banner packs, frames and optional supporter subscription (no exclusive anime content or copyrighted assets sold).
- Entitlements must be server-verified: RuStore Pay SDK + server-to-server purchase validation + trusted per-user entitlement records/RLS; never unlock paid features by trusting frontend flags.
- As of 2026, RuStore's own developer documentation states **only registered legal entities and individual entrepreneurs (ИП)** may activate RuStore in-app payments; a personal / self-employed account alone is not sufficient. Check current RuStore conditions and legal eligibility before enabling payments. No payments, pricing, fake checkout or unlock logic are present in this app.
- Avoid disruptive ads in the video player. Respect paid-user rights and provide clear purchase/refund terms.

## Do not delete Supabase tables from earlier party versions without an explicit data-deletion decision
The UI and scripts for rooms were retired on the website; tables remain unused so users' legacy records are not destroyed by a frontend deploy.

## V85 Android UI checklist
- Version 1.1.0 / versionCode 2 includes free native jade, amethyst and amber accents; selection is stored locally and does not affect the web player's state.
- Test all three accents, tab switching, video full screen and back navigation on a real phone.
- Check the public app page at https://animevoid.ru/app.html and verify it does not advertise an APK or purchase that is not live.
- Selling cosmetic digital entitlements requires eligibility, RuStore Pay SDK, signed backend purchase verification, refunds and a privacy policy. Do not enable in the client before those systems are verified.

## V86 — native navigation (Android 1.2.0 / versionCode 3)
- Five-tab native interface: Главная, Каталог, Поиск, Моё, Профиль.
- Native landing dashboard, search entry and discovery shortcuts; catalog, accounts and playback still operate through the **existing first-party website** inside the restricted WebView.
- Native search enters a query only on a verified animevoid.ru page and dispatches the site's existing input event; this is NOT a new server-side search implementation.
- A local "last opened anime/watch page" URL is saved in app preferences. It does not claim to sync watch position between devices.
- Local diary and reminders remain functional via Моё and Профиль.
- This is a staged foundation, NOT feature parity with Anixart. Next milestones: native feed backed by documented catalog data, optimized anime detail screens, source/license-aware player, remote push for followed titles, cloud lists with account sign-in, performance/accessibility QA.
- Store distribution remains blocked by rights verification, device QA, final app listing, release signing, and approved developer eligibility.

## V87 — native catalogue (1.3.0, versionCode 4)
- A native Android catalogue replaces the web homepage as the catalogue tab.
- Metadata comes from the **same published static Kodik index** as the site (manifest + generation + index, currently 9,067 entries). No API token or video URL is bundled in the app.
- HTTPS-only network requests, no cross-domain redirects for catalogue JSON, 9 MB read cap, verified title IDs and generation count.
- Background refresh, 24-hour on-device metadata cache, bounded poster cache, safe poster host allowlist and 24-card pagination.
- Native search in both title fields, genre filter, series/standalone filter and sort by year or title.
- Local-only metadata bookmarks (max 300, separate from cloud favorites) under Моё → Сохранено в приложении.
- Opening a title takes the user to `kodik.html?title=<validated id>` within the existing first-party WebView; no video extraction or region bypass.
- Dataset availability is not proof of rights or successful playback; licensed media verification remains mandatory before RuStore submission.
- The app does NOT yet have native video playback, push syncing or complete account integration; device QA is required.

## V90 — Aurora Cinema / Android 2.0.0 (versionCode 5)
- Main UI rebuilt around the same Aurora Cinema colours and card language as the responsive website. Premium **look**, but existing free colours and all other functions stay free.
- Native visual refresh for home, search, five-tab navigation, library, profile and title explorer. Website-linked profile, comments, ranks, achievements and player retain their real backend state rather than fake local clones.
- Native catalogue: tappable title preview with type, genres, translation count and optional detailed description fetched from the original static title chunk; filter chips, random discovery, and preserved bookmarks.
- Performance: first-party WebView no longer preloads the home page before a deep link, in-app page load indicator, normalized search index, 24-card pages, bounded disk poster caching (80-100 files) and 24-hour catalogue cache with an offline fallback to older cached index.
- Native recent-opened titles are stored locally; opening a catalog title updates recent metadata.
- Device QA is still required for memory usage, battery, third-party streaming, sign-in and poster delivery. Copyright licences and store signing are not implied by this test build. No live monetization.

### V90 preview installation and signing
- The test APK uses applicationId `ru.animevoid.app.preview` and is labeled `ANIME VOID V90`. This is deliberate: V87 debug builds were signed with per-run keys, so a direct upgrade could fail and require deletion of private local data. V90 installs **alongside** V87; V87 and V90 do not share app-local data.
- GitHub Actions caches only a **temporary preview signing keystore** between V90 test builds. This is not appropriate for an official RuStore upload. Release APK still requires developer-supplied, securely managed signing secrets.
