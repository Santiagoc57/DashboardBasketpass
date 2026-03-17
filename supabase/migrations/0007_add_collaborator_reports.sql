create table if not exists public.collaborator_reports (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  match_id uuid not null references public.matches(id) on delete cascade,
  reporter_profile_id uuid references public.profiles(id) on delete set null,
  incident_level text not null check (incident_level in ('sin', 'baja', 'alta', 'critica')),
  paid boolean not null default false,
  feed_detected boolean not null default false,
  signal_label text not null,
  apto_lineal boolean not null default false,
  test_time text,
  test_check boolean not null default false,
  start_check boolean not null default false,
  graphics_check boolean not null default false,
  speedtest_value text,
  ping_value text,
  gpu_value text,
  technical_observations text,
  building_observations text,
  general_observations text,
  other_flag boolean not null default false,
  st_flag boolean not null default false,
  club_flag boolean not null default false,
  other_observation text,
  st_observation text,
  club_observation text,
  problems jsonb not null default '{}'::jsonb,
  attachments jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  constraint collaborator_reports_assignment_unique unique (assignment_id)
);

create index if not exists collaborator_reports_match_idx
  on public.collaborator_reports (match_id, submitted_at desc);

create index if not exists collaborator_reports_reporter_idx
  on public.collaborator_reports (reporter_profile_id, submitted_at desc);

drop trigger if exists collaborator_reports_metadata on public.collaborator_reports;
create trigger collaborator_reports_metadata
  before insert or update on public.collaborator_reports
  for each row execute procedure public.set_row_metadata();

drop trigger if exists collaborator_reports_audit on public.collaborator_reports;
create trigger collaborator_reports_audit
  after insert or update or delete on public.collaborator_reports
  for each row execute procedure public.log_audit_event();

alter table public.collaborator_reports enable row level security;

drop policy if exists "collaborator_reports_select_authenticated" on public.collaborator_reports;
create policy "collaborator_reports_select_authenticated"
  on public.collaborator_reports for select
  using (public.can_read());

drop policy if exists "collaborator_reports_insert_editors" on public.collaborator_reports;
create policy "collaborator_reports_insert_editors"
  on public.collaborator_reports for insert
  with check (public.can_edit());

drop policy if exists "collaborator_reports_update_editors" on public.collaborator_reports;
create policy "collaborator_reports_update_editors"
  on public.collaborator_reports for update
  using (public.can_edit())
  with check (public.can_edit());

drop policy if exists "collaborator_reports_delete_editors" on public.collaborator_reports;
create policy "collaborator_reports_delete_editors"
  on public.collaborator_reports for delete
  using (public.can_edit());
