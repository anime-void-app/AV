# ANIME VOID V76 — Rave-like watch-party controls and limitations

## What changed
- V76 tries to synchronize the same episode, play/pause and seek on two or more independent Kodik players via the existing documented-in-code postMessage commands.
- The nested Kodik player verifies event origin (https://kodikplayer.com) and iframe identity before accepting any provider clock updates.
- Server room updates continue to be restricted to the host by existing Supabase RLS. No Supabase migration or new secret is required.
- The guest receives the host's canonical episode and position, calculates delay and applies throttled seek/play/pause commands. The server is still the source of truth; broadcast is a fast notification with database polling fallback.
- Native HTML5 compatibility remains. Participants now see local readiness and connection status.

## Important limits
- No stream extraction, no proxying or rebroadcasting of media. Each viewer uses their own authorized provider session.
- Browser autoplay restrictions often require each guest to click play inside the Kodik iframe once.
- Kodik might ignore commands or stop sending timing events; then exact synchronization is not available. Never advertise guaranteed frame-accurate Rave parity.
- The start button opens/prepares the existing official embed. It does not defeat autoplay restrictions.
- This patch can be verified statically, but real iOS/Android/desktop two-account network tests are required.

## Test checklist
1. From a logged-in host open party.html?anime=4224 and create a room. Share the eight-character invite code with a second logged-in browser.
2. On both devices press the preparation button and then press ▶ inside the external Kodik player once.
3. Check readiness counter, then have the host play, pause and seek +60s. If the iframe provider emits clock events and handles commands, the guest should follow.
4. With the host paused, guest should also stop and remain at the same position. On resume the guest should catch up, tolerating ~1–3 s transient network drift.
5. Join the room late; start guest player and check it seeks near the ongoing position.
6. If one player refuses provider commands or blocks autoplay, the room must show a pending status without falsely claiming success. The separate-player fallback must remain.
7. Repeat with a licensed native HTML5 source; check same episode, pause, seek and the old manual sync action.
8. Check chat, voice, mobile 320px, account session persistence and previous saved progress.

Static test: node --test tests/v76-watch-sync.cjs
Backup branch: backup/pre-v76-watch-sync-20261118
Rollback via reverting the V76 commit only. V75 main is untouched until verified.
