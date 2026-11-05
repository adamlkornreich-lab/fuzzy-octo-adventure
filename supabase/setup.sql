-- Run once in your Supabase project: SQL Editor → New query → paste → Run.
-- Creates the members-only posts table. Row-level security lets only
-- signed-in members read it; posts are added from the Supabase dashboard
-- (Table Editor → member_posts → Insert row).

create table if not exists public.member_posts (
  id bigint generated always as identity primary key,
  title text not null,
  body text,
  created_at timestamptz not null default now()
);

alter table public.member_posts enable row level security;

drop policy if exists "Members can read posts" on public.member_posts;
create policy "Members can read posts"
  on public.member_posts for select
  to authenticated
  using (true);

-- No insert/update/delete policies: only the dashboard (service role) can write.

insert into public.member_posts (title, body)
select 'Welcome aboard', 'This is the members-only page. Add crew news from the Supabase dashboard.'
where not exists (select 1 from public.member_posts);
