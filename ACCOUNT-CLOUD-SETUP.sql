-- ANIME VOID: private, versioned account backups. Run as project owner in Supabase SQL Editor.
-- Additive only: no existing profiles, gifts, wallets or grants are changed.
-- These self-reported snapshots are NOT authoritative payment/VIP/role records.
begin;
create table if not exists public.av_account_documents (
 user_id uuid primary key references auth.users(id) on delete cascade,
 revision bigint not null check (revision>0),
 document jsonb not null check (jsonb_typeof(document)='object'),
 updated_at timestamptz not null default now()
);
create table if not exists public.av_account_document_history (
 user_id uuid not null references auth.users(id) on delete cascade,
 revision bigint not null, document jsonb not null, saved_at timestamptz not null default now(),
 primary key (user_id,revision)
);
alter table public.av_account_documents enable row level security;
alter table public.av_account_document_history enable row level security;
revoke all on public.av_account_documents,public.av_account_document_history from anon,authenticated;
grant select on public.av_account_documents,public.av_account_document_history to authenticated;
drop policy if exists av_account_document_read_self on public.av_account_documents;
create policy av_account_document_read_self on public.av_account_documents for select to authenticated using (user_id=auth.uid());
drop policy if exists av_account_history_read_self on public.av_account_document_history;
create policy av_account_history_read_self on public.av_account_document_history for select to authenticated using (user_id=auth.uid());
create or replace function public.av_account_save(p_expected_revision bigint,p_document jsonb,p_expected_user uuid)
returns table(revision bigint,updated_at timestamptz)
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); old_doc public.av_account_documents%rowtype; k text; v jsonb; stamp timestamptz:=clock_timestamp(); n bigint;
begin
 if uid is null then raise exception using errcode='42501',message='Sign-in required'; end if;
 if p_expected_user is null or p_expected_user<>uid then raise exception using errcode='42501',message='Account changed; save cancelled'; end if;
 if p_expected_revision is null or p_expected_revision<0 or p_expected_revision>9007199254740990 then raise exception 'Invalid revision'; end if;
 if p_document is null or jsonb_typeof(p_document)<>'object' or octet_length(p_document::text)>12582912 then raise exception 'Invalid or oversized document'; end if;
 if (select count(*) from jsonb_object_keys(p_document))>30000 then raise exception 'Too many keys'; end if;
 for k,v in select * from jsonb_each(p_document) loop
  if length(k)>180 or k !~ '^(animeVoid[A-Za-z0-9_-]*|watched_(anilist-)?[0-9]+|duration_[A-Za-z0-9_-]+|progress_[A-Za-z0-9_-]+)$' or jsonb_typeof(v)<>'string' then raise exception 'Invalid document field'; end if;
 end loop;
 -- Serializes first insert as well as updates; no caller-supplied user_id is accepted.
 perform pg_advisory_xact_lock(hashtextextended(uid::text,17424));
 select * into old_doc from public.av_account_documents d where d.user_id=uid for update;
 if coalesce(old_doc.revision,0)<>p_expected_revision then raise exception using errcode='40001',message='Cloud revision conflict'; end if;
 n:=coalesce(old_doc.revision,0)+1;
 if old_doc.user_id is not null then
  insert into public.av_account_document_history(user_id,revision,document,saved_at) values(uid,old_doc.revision,old_doc.document,old_doc.updated_at);
 end if;
 insert into public.av_account_documents(user_id,revision,document,updated_at) values(uid,n,p_document,stamp)
 on conflict(user_id) do update set revision=excluded.revision,document=excluded.document,updated_at=excluded.updated_at;
 delete from public.av_account_document_history h where h.user_id=uid and h.revision<n-3;
 return query select n,stamp;
end $$;
revoke all on function public.av_account_save(bigint,jsonb,uuid) from public,anon,authenticated;
grant execute on function public.av_account_save(bigint,jsonb,uuid) to authenticated;
comment on table public.av_account_documents is 'Private app-state backup only. Never derive payments, moderator, founder or VIP grants from its document.';
commit;
