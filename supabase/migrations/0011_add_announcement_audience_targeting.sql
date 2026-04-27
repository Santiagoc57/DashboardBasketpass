alter table public.announcements
  add column if not exists audience_type text not null default 'all',
  add column if not exists target_role_names text[] not null default '{}',
  add column if not exists target_person_ids uuid[] not null default '{}';

update public.announcements
set audience_type = coalesce(nullif(audience_type, ''), 'all');

alter table public.announcements
  drop constraint if exists announcements_audience_type_check;

alter table public.announcements
  add constraint announcements_audience_type_check
  check (audience_type in ('all', 'photographers', 'roles', 'people'));

create index if not exists announcements_target_person_ids_gin_idx
  on public.announcements using gin (target_person_ids);

create index if not exists announcements_target_role_names_gin_idx
  on public.announcements using gin (target_role_names);
