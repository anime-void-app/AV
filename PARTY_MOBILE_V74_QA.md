# ANIME VOID V74: room code, player troubleshooting, mobile account V73

Each room has an 8-character uppercase invitation code. An authenticated guest opens party.html, enters the code, and joins without a link. Existing invitation links still work. The lookup RPC is rate-limited to eight attempts per five-minute period per account and unavailable to anonymous roles. Room codes are invitations, not passwords.

A room now has a manual Start/Refresh video control and a separate Open Player link. Native HTML5 sources may start after a user gesture. Kodik and external iframe providers control playback themselves, and video availability is independent for every participant. Do not claim exact pause or seek synchronization for Kodik. When a source for the selected AniList ID is absent, the room explains this instead of pretending it works.

V73 mobile authentication separates verified identity from cloud-saving state. A cloud conflict or unavailable Web Locks API no longer forces the login UI to disappear. The service worker does not silently substitute a stale JavaScript version when a versioned asset is unavailable. Google OAuth must be tested in the same ordinary browser, not in two different embedded-browser storage contexts.

Current provider configuration contains a Kodik source for anilist-4224; current room in the database was configured for anilist-9253. No authorized video source for 9253 is configured in the inspected source files. This is why an episode may not be available for a participant.

## Manual QA

1. Log in on phone Safari/Chrome, refresh twice, visit profile, return to account. Check user remains displayed despite any cloud sync warning.
2. On desktop create a party for 4224, copy the 8-character code; on another signed-in browser join by that code. Verify both appear in online presence.
3. Test wrong code and anonymous access; invite code should not allow unauthorized server read.
4. Press Start/Refresh on viewer device. If Kodik doesn't play inside the room, open the player independently and press its playback button.
5. Create a party for 9253: it must explicitly report the absent source instead of an indefinite spinner.
6. Test two-browser chat, microphone and native HTML5 pause/seek with properly authorized native video.
7. Check mobile 320px and desktop 1440px layouts.

Limitations: real two-device browser testing, external Kodik iframe authorization, autoplay restrictions and WebRTC network conditions are not guaranteed by static unit tests.

Rollback branch: backup/pre-v74-mobile-auth-party-code-20261109. Database migration creates only a room invite code, an invite-rate table, and a limited RPC; original user saves are untouched.
