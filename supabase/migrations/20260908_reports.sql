-- Listing reports and admin moderation.
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete cascade,
  reported_user_id uuid references auth.users(id) on delete set null,
  reason text not null check (char_length(trim(reason)) > 0),
  description text,
  status text not null default 'OPEN' check (status in ('OPEN', 'REVIEWING', 'RESOLVED', 'DISMISSED')),
  created_at timestamptz not null default now()
);

alter table public.reports enable row level security;

drop policy if exists "Users can create reports" on public.reports;
create policy "Users can create reports"
  on public.reports for insert to authenticated
  with check (auth.uid() = reporter_id);

drop policy if exists "Users can view their reports" on public.reports;
create policy "Users can view their reports"
  on public.reports for select to authenticated
  using (auth.uid() = reporter_id);

drop policy if exists "Admins can view reports" on public.reports;
create policy "Admins can view reports"
  on public.reports for select to authenticated
  using (exists (select 1 from public.user_roles where user_roles.user_id = auth.uid() and user_roles.role = 'admin'::public.app_role));

drop policy if exists "Admins can update reports" on public.reports;
create policy "Admins can update reports"
  on public.reports for update to authenticated
  using (exists (select 1 from public.user_roles where user_roles.user_id = auth.uid() and user_roles.role = 'admin'::public.app_role))
  with check (exists (select 1 from public.user_roles where user_roles.user_id = auth.uid() and user_roles.role = 'admin'::public.app_role));

create index if not exists reports_status_created_idx on public.reports(status, created_at desc);
