-- Two-sided deal confirmation: after a seller accepts an offer, both parties
-- must confirm the deal was completed before the listing is marked sold/removed.
alter table public.offers
  add column if not exists buyer_confirmed boolean not null default false,
  add column if not exists seller_confirmed boolean not null default false,
  add column if not exists deal_confirmed_at timestamptz;

-- Sellers already control status; allow buyers to confirm a deal from their side.
drop policy if exists "Buyers can confirm accepted offers" on public.offers;
create policy "Buyers can confirm accepted offers"
  on public.offers for update
  to authenticated
  using (auth.uid() = buyer_id and status = 'ACCEPTED')
  with check (auth.uid() = buyer_id);