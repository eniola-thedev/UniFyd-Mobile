-- Referral attribution and reward ledger.
alter table public.profiles
  add column if not exists referral_code text unique;

update public.profiles
set referral_code = upper(substr(replace(id::text, '-', ''), 1, 8))
where referral_code is null;

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references auth.users(id) on delete cascade,
  referred_user_id uuid not null unique references auth.users(id) on delete cascade,
  referral_code text not null,
  status text not null default 'REGISTERED' check (status in ('REGISTERED', 'VERIFIED', 'QUALIFIED', 'REWARDED', 'CANCELLED')),
  created_at timestamptz not null default now(),
  verified_at timestamptz,
  qualified_at timestamptz,
  unique (referrer_id, referred_user_id)
);

create table if not exists public.referral_rewards (
  id uuid primary key default gen_random_uuid(),
  referral_id uuid not null unique references public.referrals(id) on delete cascade,
  referrer_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null default 'NGN',
  status text not null default 'PENDING' check (status in ('PENDING', 'APPROVED', 'PAID', 'CANCELLED')),
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

alter table public.referrals enable row level security;
alter table public.referral_rewards enable row level security;

drop policy if exists "Users can view their referrals" on public.referrals;
create policy "Users can view their referrals" on public.referrals for select to authenticated
  using (auth.uid() = referrer_id or auth.uid() = referred_user_id);

drop policy if exists "Users can view their rewards" on public.referral_rewards;
create policy "Users can view their rewards" on public.referral_rewards for select to authenticated
  using (auth.uid() = referrer_id);

create index if not exists referrals_referrer_id_idx on public.referrals(referrer_id);
create index if not exists referral_rewards_referrer_id_idx on public.referral_rewards(referrer_id);

create or replace function public.claim_referral(p_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  referrer uuid;
begin
  if auth.uid() is null or p_code is null or length(trim(p_code)) = 0 then
    return false;
  end if;

  select id into referrer from public.profiles where referral_code = upper(trim(p_code));
  if referrer is null or referrer = auth.uid() then return false; end if;

  insert into public.referrals (referrer_id, referred_user_id, referral_code)
  values (referrer, auth.uid(), upper(trim(p_code)))
  on conflict (referred_user_id) do nothing;
  return found;
end;
$$;

revoke all on function public.claim_referral(text) from public;
grant execute on function public.claim_referral(text) to authenticated;
