create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null
);

create index if not exists announcements_active_updated_idx
  on public.announcements (active, updated_at desc);

alter table public.announcements enable row level security;

drop trigger if exists announcements_metadata on public.announcements;
create trigger announcements_metadata
  before insert or update on public.announcements
  for each row execute procedure public.set_row_metadata();

drop trigger if exists announcements_audit on public.announcements;
create trigger announcements_audit
  after insert or update or delete on public.announcements
  for each row execute procedure public.log_audit_event();

drop policy if exists announcements_read on public.announcements;
create policy announcements_read on public.announcements
  for select
  using (public.can_read());

drop policy if exists announcements_insert_admin on public.announcements;
create policy announcements_insert_admin on public.announcements
  for insert
  with check (public.current_app_role() = 'admin');

drop policy if exists announcements_update_admin on public.announcements;
create policy announcements_update_admin on public.announcements
  for update
  using (public.current_app_role() = 'admin')
  with check (public.current_app_role() = 'admin');

drop policy if exists announcements_delete_admin on public.announcements;
create policy announcements_delete_admin on public.announcements
  for delete
  using (public.current_app_role() = 'admin');
