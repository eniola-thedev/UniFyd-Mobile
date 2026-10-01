alter table public.profiles
  add column if not exists message_notifications_enabled boolean not null default true;