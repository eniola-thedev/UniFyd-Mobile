create table if not exists public.user_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('GENERAL', 'FEATURE_REQUEST', 'BUG_REPORT')),
  message text not null check (char_length(trim(message)) between 10 and 2000),
  created_at timestamptz not null default now()
);

alter table public.user_feedback enable row level security;

drop policy if exists "Users can submit their own feedback" on public.user_feedback;
create policy "Users can submit their own feedback"
  on public.user_feedback for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Admins can view user feedback" on public.user_feedback;
create policy "Admins can view user feedback"
  on public.user_feedback for select
  to authenticated
  using (
    exists (
      select 1
      from public.user_roles
      where user_roles.user_id = auth.uid()
        and user_roles.role = 'admin'::public.app_role
    )
  );

create index if not exists user_feedback_created_idx
  on public.user_feedback(created_at desc);