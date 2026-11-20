# ANIME VOID V83 — Rave-inspired rooms (test plan and limitations)

## Delivery
- Existing private authenticated rooms, member RLS and server-authorized host row remain unchanged.
- New V83 sync algorithm: rejects malformed provider time, stale host clock, old DB snapshots and redundant polls; keeps a local clock anchor.
- Host controls for HTML5 (play / pause / ±10 seconds), for Kodik sends official API commands **only**. Sends cannot guarantee execution.
- Episode jump (1–10000), native OS share/invite, realtime connection badge and auto reconnect.
- Guest applies HTML5 correction every second. Browser sound autoplay may require one tap from each participant.
- Supabase Presence shows online/ready without streaming media data.
- External Kodik V81 iframe has a verified-origin, party-only readout of current episode, duration and time. If the provider reports trusted clock and implements official commands, best-effort auto-sync can run. Otherwise show **manual mode**; never claim guaranteed sync.
- Existing chat, WebRTC voice, room codes and subscriptions preserved, no SQL migration, no video distribution.

## Quick entry
On an anime detail page, tap **Смотреть вместе**. Party lobby must prefill that title ID; create the room, then share the room link to a second authenticated account.

## QA: two real browsers/two real accounts (required; not simulated by automated tests)
1. Open `https://animevoid.ru/party.html` in two separate authenticated browsers; create room, share link, join with friend.
2. Verify presence count and readiness, chat send/receive, microphone opt-in, mute. On cellular NAT, WebRTC may require TURN.
3. **HTML5** when licensed source is configured: user A plays, pauses, seeks, switches episode. User B clicks play once if browser blocks autoplay, then should follow B's clock. Refresh B, verify recovery.
4. **Kodik 4224**: both explicitly click ▶ within official iframe; compare actual elapsed times and response to remote pause/seek. A postMessage being sent is not proof of execution.
5. **Other Kodik anime**: external V81 bridge should report confirmed provider playback or manual/pending mode, not "no source", if its iframe loads.
6. Disconnect/reconnect mobile Wi-Fi for B, background the tab, return, verify auto reconnect and host state restore.
7. Try invalid invite code, wrong/expired room UUID, host leave (room should close), guest leave (room survives).
8. Recheck Android Chrome widths 320/360/390 px, desktop 1366px, iOS PWA safe area; keyboard must not overlap chat.
9. Confirm no unauthorized guest change to room row (RLS), no spoofed broadcast command accepted as host-authoritative playback.
10. Validate progress/achievements/credential flows unchanged.

## Known limits compared with Rave
Rave has integrations with participating media platforms and can deliver tight synchronization through their supported APIs. Static ANIME VOID on GitHub Pages cannot guarantee exact shared frames for an opaque third-party iframe. For exact sync, each participant needs a legal HTML5 media source whose pause, seek and time events the browser can control; server-based timestamp/RPC improvements may be developed later. Browser autoplay and 3rd-party availability impose additional limits.

## Rollback
Restore `backup/pre-v83-rave-party-20261120` from GitHub to main (no database changes).
