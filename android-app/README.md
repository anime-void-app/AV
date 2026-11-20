# ANIME VOID — Android edition / RuStore preparation

## What this project includes
- Android Java native shell with AnimeVoid web catalog and player;
- an **offline on-device anime diary** (private, stored in SharedPreferences);
- local scheduled viewing reminders (notification permission requested only when needed, restored after reboot);
- native share sheet, page shortcuts, Android back navigation, file-picker for avatar uploads, fullscreen HTML video;
- HTTPS only, no JavaScript bridge, no hidden proxy or video redistribution;
- branded icon, navigation, dark theme, Android 8.0+ (API 26), target SDK 35.

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
- RuStore reports monetization requires an eligible developer aged **18+**. No payments, pricing, fake checkout or unlock logic are present in this app.
- Avoid disruptive ads in the video player. Respect paid-user rights and provide clear purchase/refund terms.

## Do not delete Supabase tables from earlier party versions without an explicit data-deletion decision
The UI and scripts for rooms were retired on the website; tables remain unused so users' legacy records are not destroyed by a frontend deploy.
