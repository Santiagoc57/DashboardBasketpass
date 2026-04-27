create table if not exists public.team_issue_reports (
  id uuid primary key default gen_random_uuid(),
  team_id text not null,
  team_official_name text not null,
  team_display_name text not null,
  competition text not null,
  reason text not null,
  detail text not null,
  status text not null default 'new' check (status in ('new', 'resolved')),
  reporter_profile_id uuid references public.profiles(id) on delete set null,
  reporter_name text,
  reporter_email text,
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null
);

create index if not exists team_issue_reports_status_created_idx
  on public.team_issue_reports (status, created_at desc);

create index if not exists team_issue_reports_reporter_idx
  on public.team_issue_reports (reporter_profile_id, created_at desc);

alter table public.team_issue_reports enable row level security;

drop trigger if exists team_issue_reports_metadata on public.team_issue_reports;
create trigger team_issue_reports_metadata
  before insert or update on public.team_issue_reports
  for each row execute procedure public.set_row_metadata();

drop trigger if exists team_issue_reports_audit on public.team_issue_reports;
create trigger team_issue_reports_audit
  after insert or update or delete on public.team_issue_reports
  for each row execute procedure public.log_audit_event();

drop policy if exists team_issue_reports_read_admin on public.team_issue_reports;
create policy team_issue_reports_read_admin on public.team_issue_reports
  for select
  using (public.current_app_role() = 'admin');

drop policy if exists team_issue_reports_insert_authenticated on public.team_issue_reports;
create policy team_issue_reports_insert_authenticated on public.team_issue_reports
  for insert
  with check (auth.role() = 'authenticated');

drop policy if exists team_issue_reports_update_admin on public.team_issue_reports;
create policy team_issue_reports_update_admin on public.team_issue_reports
  for update
  using (public.current_app_role() = 'admin')
  with check (public.current_app_role() = 'admin');

drop policy if exists team_issue_reports_delete_admin on public.team_issue_reports;
create policy team_issue_reports_delete_admin on public.team_issue_reports
  for delete
  using (public.current_app_role() = 'admin');
