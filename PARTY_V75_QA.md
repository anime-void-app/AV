ANIME VOID V75 QA (18 November 2026)
Backup branch: backup/pre-v75-party-ux-20261118. Base V74: 633010231f98df660bc5c5fcab37e58abd40d658
Changed: watch room connection status, clipboard-friendly invite codes, Enter keyboard
actions, voice-tab unread chat badge, navigation, stale-send guard and mobile spacing.
No Supabase schema changes or changes to auth, users, saved progress or provider.
Kodik iframe still cannot guarantee pause/seek synchronization.
Static regression: node --test tests/v75-party-ux.cjs
Manual browser checks needed: Chrome Android, Safari iOS, desktop two-person
join/reconnect/chat/microphone; paste copied code; verify a late chat send can't
appear in a new room; confirm offline badge and mobile layout.
Rollback through a revert of V75 commit; do not reset database or overwrite main.
