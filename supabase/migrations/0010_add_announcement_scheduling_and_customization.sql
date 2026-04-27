alter table public.announcements
  add column if not exists eyebrow_label text,
  add column if not exists dismiss_label text,
  add column if not exists starts_at timestamptz,
  add column if not exists ends_at timestamptz;

update public.announcements
set dismiss_label = coalesce(nullif(dismiss_label, ''), 'Entendido')
where dismiss_label is distinct from coalesce(nullif(dismiss_label, ''), 'Entendido');

alter table public.announcements
  drop constraint if exists announcements_schedule_window_check;

alter table public.announcements
  add constraint announcements_schedule_window_check
  check (ends_at is null or starts_at is null or ends_at >= starts_at);

create index if not exists announcements_schedule_idx
  on public.announcements (active, starts_at, ends_at, updated_at desc);
