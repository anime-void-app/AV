-- ANIME VOID V74: server side code invitations already deployed.
-- Apply once after WATCH_PARTY_V68_SETUP.sql in other environments.
alter table public.av_watch_party_rooms add column if not exists invite_code text;
update public.av_watch_party_rooms
 set invite_code=upper(substr(replace(gen_random_uuid()::text,'-',''),1,8))
 where invite_code is null;
alter table public.av_watch_party_rooms alter column invite_code
 set default upper(substr(replace(gen_random_uuid()::text,'-',''),1,8));
alter table public.av_watch_party_rooms alter column invite_code set not null;
create unique index if not exists av_watch_party_room_invite_unique
 on public.av_watch_party_rooms(invite_code);
create table if not exists public.av_watch_party_join_limits(
 user_id uuid primary key references auth.users(id) on delete cascade,
 window_start timestamptz not null default now(),
 attempts integer not null default 0
);
alter table public.av_watch_party_join_limits enable row level security;
revoke all on public.av_watch_party_join_limits from anon, authenticated;
create or replace function public.av_party_join_by_code(p_code text)
returns uuid language plpgsql security definer set search_path=''
as $$
declare caller uuid := (select auth.uid());normalized text;tries integer;selected uuid;
begin
 if caller is null then return null; end if;
 normalized:=pg_catalog.upper(pg_catalog.btrim(coalesce(p_code,'')));
 insert into public.av_watch_party_join_limits as l(user_id,window_start,attempts)
 values(caller,now(),1)
 on conflict(user_id) do update
 set attempts=case when l.window_start<now()-interval '5 minutes' then 1 else l.attempts+1 end,
 window_start=case when l.window_start<now()-interval '5 minutes' then now() else l.window_start end
 returning attempts into tries;
 if tries>8 then return null; end if;
 if normalized !~ '^[0-9A-F]{8}$' then return null; end if;
 select id into selected from public.av_watch_party_rooms where invite_code=normalized;
 if selected is null then return null; end if;
 insert into public.av_watch_party_members(room_id,user_id) values(selected,caller)
 on conflict(room_id,user_id) do nothing;
 return selected;
end;
$$;
revoke all on function public.av_party_join_by_code(text) from public,anon;
grant execute on function public.av_party_join_by_code(text) to authenticated;
