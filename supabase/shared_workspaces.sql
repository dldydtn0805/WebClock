create table if not exists public.shared_workspaces (
    access_code text primary key,
    payload jsonb not null default '{}'::jsonb,
    updated_at timestamptz not null default timezone('utc', now())
);

alter table public.shared_workspaces enable row level security;

drop policy if exists "anon can read shared workspaces" on public.shared_workspaces;
create policy "anon can read shared workspaces"
on public.shared_workspaces
for select
to anon
using (true);

drop policy if exists "anon can insert shared workspaces" on public.shared_workspaces;
create policy "anon can insert shared workspaces"
on public.shared_workspaces
for insert
to anon
with check (true);

drop policy if exists "anon can update shared workspaces" on public.shared_workspaces;
create policy "anon can update shared workspaces"
on public.shared_workspaces
for update
to anon
using (true)
with check (true);
