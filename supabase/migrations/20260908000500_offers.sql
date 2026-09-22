-- Buyer offers with seller-controlled status changes.
alter table public.offers enable row level security;

drop policy if exists "Users can view related offers" on public.offers;
create policy "Users can view related offers"
  on public.offers for select to authenticated
  using (
    auth.uid() = buyer_id
    or exists (select 1 from public.listings where listings.id = offers.listing_id and listings.seller_id = auth.uid())
  );

drop policy if exists "Buyers can create their own offers" on public.offers;
create policy "Buyers can create their own offers"
  on public.offers for insert to authenticated
  with check (auth.uid() = buyer_id);

drop policy if exists "Sellers can update listing offers" on public.offers;
create policy "Sellers can update listing offers"
  on public.offers for update to authenticated
  using (exists (select 1 from public.listings where listings.id = offers.listing_id and listings.seller_id = auth.uid()))
  with check (exists (select 1 from public.listings where listings.id = offers.listing_id and listings.seller_id = auth.uid()));

create index if not exists offers_listing_status_idx on public.offers(listing_id, status, created_at desc);
create index if not exists offers_buyer_idx on public.offers(buyer_id, created_at desc);
