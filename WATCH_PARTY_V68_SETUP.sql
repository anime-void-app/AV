-- ANIME VOID V68 watch-party server schema; deployed to Supabase on 2026-11-08.
-- For new installations only. Existing deployments must not apply a second time.
-- Rooms are unlisted, but anyone possessing the UUID and a valid account can join.
create table if not exists public.av_watch_party_rooms (
 id uuid primary key default gen_random_uuid(),
 host_id uuid not null references auth.users(id) on delete cascade,
 anime_id text not null check (anime_id ~ '^anilist-[1-9][0-9]{0,9}$'),
 episode integer not null default 1 check (episode between 1 and 10000),
 playhead numeric(10,2) not null default 0 check (playhead between 0 and 43200),
 is_playing boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.av_watch_party_members (
 room_id uuid not null references public.av_watch_party_rooms(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 joined_at timestamptz not null default now(),
 primary key(room_id,user_id)
);
create index if not exists av_watch_party_members_by_user
 on public.av_watch_party_members(user_id,room_id);
create index if not exists av_watch_party_rooms_by_host
 on public.av_watch_party_rooms(host_id,created_at desc);
alter table public.av_watch_party_rooms enable row level security;
alter table public.av_watch_party_members enable row level security;
revoke all on public.av_watch_party_rooms from anon;
revoke all on public.av_watch_party_members from anon;
grant select,insert,update,delete on public.av_watch_party_rooms to authenticated;
grant select,insert,delete on public.av_watch_party_members to authenticated;
create policy av_party_room_read on public.av_watch_party_rooms
 for select to authenticated using (
  host_id=(select auth.uid())
  or exists (
   select 1 from public.av_watch_party_members m
   where m.room_id=id and m.user_id=(select auth.uid())
  )
 );
create policy av_party_room_create on public.av_watch_party_rooms
 for insert to authenticated with check (host_id=(select auth.uid()));
create policy av_party_room_update on public.av_watch_party_rooms
 for update to authenticated using (host_id=(select auth.uid()))
 with check (host_id=(select auth.uid()));
create policy av_party_room_delete on public.av_watch_party_rooms
 for delete to authenticated using (host_id=(select auth.uid()));
create policy av_party_member_own_read on public.av_watch_party_members
 for select to authenticated using (user_id=(select auth.uid()));
create policy av_party_member_self_join on public.av_watch_party_members
 for insert to authenticated with check (user_id=(select auth.uid()));
create policy av_party_member_self_leave on public.av_watch_party_members
 for delete to authenticated using (user_id=(select auth.uid()));
create policy av_party_realtime_receive on realtime.messages
 for select to authenticated using (
  realtime.messages.extension in ('broadcast','presence')
  and left((select realtime.topic()),9)='av-party:'
  and exists (
    select 1 from public.av_watch_party_members m
    where m.room_id::text=substring((select realtime.topic()) from 10)
      and m.user_id=(select auth.uid())
  )
 );
create policy av_party_realtime_send on realtime.messages
 for insert to authenticated with check (
  realtime.messages.extension in ('broadcast','presence')
  and left((select realtime.topic()),9)='av-party:'
  and exists (
    select 1 from public.av_watch_party_members m
    where m.room_id::text=substring((select realtime.topic()) from 10)
      and m.user_id=(select auth.uid())
  )
 );
