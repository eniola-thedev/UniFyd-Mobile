-- Saved listings for authenticated marketplace users.
create table if not exists public.saved_listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, listing_id)
);

alter table public.saved_listings enable row level security;

create policy "Users can view their saved listings"
  on public.saved_listings for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can save listings for themselves"
  on public.saved_listings for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can remove their saved listings"
  on public.saved_listings for delete
  to authenticated
  using (auth.uid() = user_id);

create index if not exists saved_listings_user_id_idx
  on public.saved_listings(user_id);

create index if not exists saved_listings_listing_id_idx
  on public.saved_listings(listing_id);
