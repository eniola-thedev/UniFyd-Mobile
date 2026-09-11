-- Admin-only access for reviewing seller verifications and private student IDs.
alter table public.verifications enable row level security;

drop policy if exists "Admins can view verifications" on public.verifications;
create policy "Admins can view verifications"
  on public.verifications for select
  to authenticated
  using (
    exists (
      select 1
      from public.user_roles
      where user_roles.user_id = auth.uid()
        and user_roles.role = 'admin'::public.app_role
    )
  );

drop policy if exists "Admins can review verifications" on public.verifications;
create policy "Admins can review verifications"
  on public.verifications for update
  to authenticated
  using (
    exists (
      select 1
      from public.user_roles
      where user_roles.user_id = auth.uid()
        and user_roles.role = 'admin'::public.app_role
    )
  )
  with check (
    exists (
      select 1
      from public.user_roles
      where user_roles.user_id = auth.uid()
        and user_roles.role = 'admin'::public.app_role
    )
  );

drop policy if exists "Admins can view student ID files" on storage.objects;
create policy "Admins can view student ID files"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'student-ids'
    and exists (
      select 1
      from public.user_roles
      where user_roles.user_id = auth.uid()
        and user_roles.role = 'admin'::public.app_role
    )
  );
