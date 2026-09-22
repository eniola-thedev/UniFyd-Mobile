-- Add UNIOSUN when the existing database uses the university enum.
-- Some older deployments store universities as text, where no type change is needed.
do $$
begin
  if exists (
    select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'university'
  ) then
    alter type public.university add value if not exists 'UNIOSUN';
  end if;
end
$$;

-- Supabase Auth already makes email addresses unique. This protects matric
-- numbers too, ignoring accidental casing and surrounding whitespace.
create unique index if not exists profiles_matric_number_unique
  on public.profiles (lower(btrim(matric_number)))
  where matric_number is not null and btrim(matric_number) <> '';
