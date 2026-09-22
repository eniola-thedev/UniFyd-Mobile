-- Auto-create a profiles row when a new auth user is created.
-- This keeps the app's profile queries (university defaulting, referral claim,
-- verification pre-fill) working without relying on the client to insert it.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb;
  referral_code text;
begin
  meta := coalesce(new.raw_user_meta_data, '{}'::jsonb);

  -- Prefer the referral code stored by the invite landing page; fall back to
  -- the one passed in user metadata (used by the web app's signup flow).
  referral_code := meta->>'referral_code';

  insert into public.profiles (
    id,
    email,
    full_name,
    phone,
    university,
    department,
    level,
    matric_number,
    referral_code,
    bio,
    is_blocked
  )
  values (
    new.id,
    new.email,
    coalesce(meta->>'full_name', ''),
    coalesce(meta->>'phone', null),
    coalesce((meta->>'university')::public.university, 'UNILORIN'::public.university),
    coalesce(meta->>'department', null),
    coalesce(meta->>'level', null),
    coalesce(meta->>'matric_number', null),
    referral_code,
    null,
    false
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert
  on auth.users
  for each row
  execute procedure public.handle_new_user();

revoke all on function public.handle_new_user from public;
grant execute on function public.handle_new_user to postgres, service_role;