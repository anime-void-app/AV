# ANIME VOID V81 — playback loading recovery

## What changed
- The official Kodik bridge checks AVTitles, a local verified AniList/MyAnimeList identity registry, before contacting graphql.anilist.co. This avoids a remote dependency for known titles.
- On an unknown title, a seven-second fallback looks up AniList idMal and uses an exact, unambiguous catalog name match only when possible.
- When metadata fails, the watch page still shows a verified local title, without inventing episode counts or watch confirmations.
- Removes the second, empty native-player placeholder while Kodik is mounted and displays explicit timeout/failure diagnostics with a link to the Kodik catalog.
- PWA cache bumped to V81; no account/database migrations.

## Manual acceptance tests still required
1. On two phones without VPN, open https://animevoid.ru/watch.html?id=101922&episode=1 and https://animevoid.ru/watch.html?id=1535&episode=1. Verify title, translation selection, iframe and video playback.
2. Try a title not in AVTitles. It should load through bounded AniList fallback or show a clear message.
3. Temporarily block graphql.anilist.co: known titles should still use local MAL identity.
4. Temporarily block Kodik: user must see explicit failure rather than infinite spinner; provider availability is not guaranteed.
5. Visit https://animevoid.ru/watch.html?id=4224&episode=1 (special case) and test the original player.
6. Verify PWA, playback history, progress, account login and party sync using actual devices.

## Provider limit
This change repairs website-side lookup logic, not provider-side connectivity, licensing, or regional availability. Do not use unauthorized video proxies or bypass provider access rules.

## Rollback
Restore backup/pre-v81-player-recovery-20261120.
