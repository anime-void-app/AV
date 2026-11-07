# ANIME VOID 67.0 — QA and rollback

Release scope: homepage, profile, watch page, watch history, account mobile layout, offline asset versioning.

## Automated checks

From a repository checkout: `node --test tests/v67-smoke.cjs`. These static checks do not validate real video playback or third-party OAuth.

## Manual acceptance cases

1. Open a title from catalog and search, check that it opens `watch.html?id=...&episode=1`.
2. On a configured player, switch episode through next/previous, choose episode directly, reload and verify the correct URL and current episode.
3. Switch a native player's audio/video source: retain episode number when also available on the new source, fall back to the first available episode otherwise. Verify the provider's actual stream still plays.
4. Open a series without a provider. Confirm an accurate unavailable message, not a fake playable episode.
5. After opening an episode, check the homepage 'Last opened episode' link and profile/recent cards; opening alone must not count as measured playback or award anything.
6. Mark and unmark an episode. Confirm summaries/history refresh; verify cloud and offline data persist after refresh, without mixing manual marks with measured time.
7. Test login with email/password and Google OAuth using real accounts on `animevoid.ru`; check session after page reload and in a second tab, including one mobile browser.
8. Check layout at 320, 360, 390, 768, 1024 and 1440 CSS px for navigation, history cards, dialogs, forms, buttons and overflowing content.
9. Test full keyboard navigation, reduced-motion setting and focus visibility.
10. With cached resources, refresh while offline and ensure pages either work or show an explicit offline fallback.

No database migrations, account deletions or entitlement changes are part of this release.

## Safe rollback

Branch `backup/pre-v67-global-20261107` points to the exact pre-release main head. Revert the release commit via a follow-up commit or restore from the branch after confirming that no newer production updates need preservation. Do not force-push over later changes.

## Limits

GitHub Pages deployment success confirms publication, not full live playback, OAuth provider configuration, cross-device sync or browser rendering. These require the listed manual tests.
