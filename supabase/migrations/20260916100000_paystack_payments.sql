-- Payment records are written only by the server-side Paystack functions.
-- Signed-in users may inspect only their own payment history. Earlier
-- deployments created this table with only id/created_at, so add the full
-- payment shape in place instead of replacing that existing table.
alter table public.payments
  add column if not exists listing_id uuid references public.listings(id) on delete set null,
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists plan text,
  add column if not exists amount integer,
  add column if not exists provider text,
  add column if not exists provider_response jsonb,
  add column if not exists reference text,
  add column if not exists status text default 'PENDING',
  add column if not exists verified_at timestamptz;

alter table public.payments enable row level security;

drop policy if exists "Users can view their own payments" on public.payments;
create policy "Users can view their own payments"
  on public.payments for select
  to authenticated
  using (auth.uid() = user_id);

create index if not exists payments_user_created_idx
  on public.payments(user_id, created_at desc);

create index if not exists payments_listing_created_idx
  on public.payments(listing_id, created_at desc);

create unique index if not exists payments_reference_key
  on public.payments(reference);
