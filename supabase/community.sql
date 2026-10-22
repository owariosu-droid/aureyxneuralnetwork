-- Run in the SQL editor of the Supabase project dedicated to Nox.
begin;
create table if not exists public.community_tracks (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 title text not null check (length(trim(title)) between 1 and 200),
 artist text not null check (length(trim(artist)) between 1 and 150),
 genre text not null check (genre in ('Ambient','Electronic','Experimental','Instrumental','Other')),
 description text not null default '' check (length(description)<=2000),
 storage_path text not null unique,
 sha256 text not null check (sha256 ~ '^[a-f0-9]{64}$'),
 created_at timestamptz not null default now()
);
alter table public.community_tracks enable row level security;
revoke all on public.community_tracks from anon, authenticated;
grant select on public.community_tracks to anon,authenticated;
grant insert(user_id,title,artist,genre,description,storage_path,sha256) on public.community_tracks to authenticated;
grant delete on public.community_tracks to authenticated;
create policy "public reads explicitly published tracks" on public.community_tracks for select using (true);
create policy "members publish only in their own folder" on public.community_tracks for insert to authenticated with check (user_id=(select auth.uid()) and storage_path like (select auth.uid())::text || '/%');
create policy "members remove only their own posts" on public.community_tracks for delete to authenticated using(user_id=(select auth.uid()));
create index if not exists community_tracks_newest on public.community_tracks(created_at desc,id desc);
create index if not exists community_tracks_owner on public.community_tracks(user_id);
create table if not exists public.community_reports (
 id uuid primary key default gen_random_uuid(),
 track_id uuid not null references public.community_tracks(id) on delete cascade,
 reporter_id uuid not null references auth.users(id) on delete cascade,
 reason text not null check(length(reason) between 20 and 1000),
 created_at timestamptz not null default now(),
 unique(track_id,reporter_id)
);
alter table public.community_reports enable row level security;
revoke all on public.community_reports from anon,authenticated;
grant insert(track_id,reporter_id,reason) on public.community_reports to authenticated;
create policy "signed in members can report once" on public.community_reports for insert to authenticated with check(reporter_id=(select auth.uid()));
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('community-audio','community-audio',true,52428800,array['audio/wav','audio/x-wav','audio/mpeg','audio/flac','audio/ogg','audio/mp4','audio/webm','audio/aac'])
on conflict(id) do nothing;
create policy "members upload to their own public folder" on storage.objects for insert to authenticated with check(bucket_id='community-audio' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "members inspect their own public audio" on storage.objects for select to authenticated using(bucket_id='community-audio' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "members delete only their own public audio" on storage.objects for delete to authenticated using(bucket_id='community-audio' and (storage.foldername(name))[1]=(select auth.uid())::text);
commit;
-- This bucket deliberately contains PUBLIC release copies, not private masters.
-- No authenticated user is granted access to another user's offline vault.
-- Before an open launch, configure signup limits, abuse controls and moderation.
