create extension if not exists pgcrypto;

create type public.app_role as enum ('admin', 'editor', 'viewer');
create type public.match_status as enum ('Pendiente', 'Confirmado', 'Realizado');

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role public.app_role not null default 'viewer',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.people (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text,
  email text,
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null
);

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text not null default 'Produccion',
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  competition text,
  production_mode text,
  status public.match_status not null default 'Pendiente',
  home_team text not null,
  away_team text not null,
  venue text,
  kickoff_at timestamptz not null,
  duration_minutes integer not null default 150 check (duration_minutes > 0),
  timezone text not null default 'America/Bogota',
  owner_id uuid references public.people(id) on delete set null,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null
);

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete restrict,
  person_id uuid references public.people(id) on delete set null,
  confirmed boolean not null default false,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  constraint assignments_match_role_unique unique (match_id, role_id)
);

create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  table_name text not null,
  record_id uuid not null,
  match_id uuid references public.matches(id) on delete cascade,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  changed_by uuid references public.profiles(id) on delete set null,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists matches_kickoff_idx on public.matches (kickoff_at);
create index if not exists matches_owner_idx on public.matches (owner_id);
create index if not exists assignments_match_idx on public.assignments (match_id);
create index if not exists assignments_person_idx on public.assignments (person_id);
create index if not exists audit_log_match_idx on public.audit_log (match_id, created_at desc);

create or replace function public.set_row_metadata()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    new.created_at = coalesce(new.created_at, timezone('utc', now()));
    new.created_by = coalesce(new.created_by, auth.uid());
  end if;

  new.updated_at = timezone('utc', now());
  new.updated_by = auth.uid();
  return new;
end;
$$;

create or replace function public.log_audit_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_id uuid;
  related_match uuid;
  before_payload jsonb;
  after_payload jsonb;
  row_payload jsonb;
begin
  if tg_op = 'DELETE' then
    row_payload = to_jsonb(old);
    target_id = old.id;
    related_match = case
      when tg_table_name = 'assignments' then nullif(row_payload ->> 'match_id', '')::uuid
      when tg_table_name = 'matches' then old.id
      else null
    end;
    before_payload = row_payload;
    after_payload = null;
  else
    row_payload = to_jsonb(new);
    target_id = new.id;
    related_match = case
      when tg_table_name = 'assignments' then nullif(row_payload ->> 'match_id', '')::uuid
      when tg_table_name = 'matches' then new.id
      else null
    end;
    before_payload = case when tg_op = 'UPDATE' then to_jsonb(old) else null end;
    after_payload = row_payload;
  end if;

  insert into public.audit_log (
    table_name,
    record_id,
    match_id,
    action,
    changed_by,
    before,
    after
  )
  values (
    tg_table_name,
    target_id,
    related_match,
    tg_op,
    auth.uid(),
    before_payload,
    after_payload
  );

  return coalesce(new, old);
end;
$$;

create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role from public.profiles where id = auth.uid()),
    'viewer'::public.app_role
  );
$$;

create or replace function public.can_read()
returns boolean
language sql
stable
as $$
  select auth.role() = 'authenticated';
$$;

create or replace function public.can_edit()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_app_role() in ('admin', 'editor');
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

drop trigger if exists people_metadata on public.people;
create trigger people_metadata
  before insert or update on public.people
  for each row execute procedure public.set_row_metadata();

drop trigger if exists roles_metadata on public.roles;
create trigger roles_metadata
  before insert or update on public.roles
  for each row execute procedure public.set_row_metadata();

drop trigger if exists matches_metadata on public.matches;
create trigger matches_metadata
  before insert or update on public.matches
  for each row execute procedure public.set_row_metadata();

drop trigger if exists assignments_metadata on public.assignments;
create trigger assignments_metadata
  before insert or update on public.assignments
  for each row execute procedure public.set_row_metadata();

drop trigger if exists people_audit on public.people;
create trigger people_audit
  after insert or update or delete on public.people
  for each row execute procedure public.log_audit_event();

drop trigger if exists roles_audit on public.roles;
create trigger roles_audit
  after insert or update or delete on public.roles
  for each row execute procedure public.log_audit_event();

drop trigger if exists matches_audit on public.matches;
create trigger matches_audit
  after insert or update or delete on public.matches
  for each row execute procedure public.log_audit_event();

drop trigger if exists assignments_audit on public.assignments;
create trigger assignments_audit
  after insert or update or delete on public.assignments
  for each row execute procedure public.log_audit_event();

alter table public.profiles enable row level security;
alter table public.people enable row level security;
alter table public.roles enable row level security;
alter table public.matches enable row level security;
alter table public.assignments enable row level security;
alter table public.audit_log enable row level security;

drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated"
  on public.profiles for select
  using (public.can_read());

drop policy if exists "profiles_insert_self_or_admin" on public.profiles;
create policy "profiles_insert_self_or_admin"
  on public.profiles for insert
  with check (auth.uid() = id or public.current_app_role() = 'admin');

drop policy if exists "profiles_update_self_or_admin" on public.profiles;
create policy "profiles_update_self_or_admin"
  on public.profiles for update
  using (auth.uid() = id or public.current_app_role() = 'admin')
  with check (auth.uid() = id or public.current_app_role() = 'admin');

drop policy if exists "domain_select_authenticated" on public.people;
create policy "domain_select_authenticated"
  on public.people for select
  using (public.can_read());

drop policy if exists "domain_insert_editors_people" on public.people;
create policy "domain_insert_editors_people"
  on public.people for insert
  with check (public.can_edit());

drop policy if exists "domain_update_editors_people" on public.people;
create policy "domain_update_editors_people"
  on public.people for update
  using (public.can_edit())
  with check (public.can_edit());

drop policy if exists "domain_delete_editors_people" on public.people;
create policy "domain_delete_editors_people"
  on public.people for delete
  using (public.can_edit());

drop policy if exists "domain_select_authenticated_roles" on public.roles;
create policy "domain_select_authenticated_roles"
  on public.roles for select
  using (public.can_read());

drop policy if exists "domain_insert_editors_roles" on public.roles;
create policy "domain_insert_editors_roles"
  on public.roles for insert
  with check (public.can_edit());

drop policy if exists "domain_update_editors_roles" on public.roles;
create policy "domain_update_editors_roles"
  on public.roles for update
  using (public.can_edit())
  with check (public.can_edit());

drop policy if exists "domain_delete_editors_roles" on public.roles;
create policy "domain_delete_editors_roles"
  on public.roles for delete
  using (public.can_edit());

drop policy if exists "domain_select_authenticated_matches" on public.matches;
create policy "domain_select_authenticated_matches"
  on public.matches for select
  using (public.can_read());

drop policy if exists "domain_insert_editors_matches" on public.matches;
create policy "domain_insert_editors_matches"
  on public.matches for insert
  with check (public.can_edit());

drop policy if exists "domain_update_editors_matches" on public.matches;
create policy "domain_update_editors_matches"
  on public.matches for update
  using (public.can_edit())
  with check (public.can_edit());

drop policy if exists "domain_delete_editors_matches" on public.matches;
create policy "domain_delete_editors_matches"
  on public.matches for delete
  using (public.can_edit());

drop policy if exists "domain_select_authenticated_assignments" on public.assignments;
create policy "domain_select_authenticated_assignments"
  on public.assignments for select
  using (public.can_read());

drop policy if exists "domain_insert_editors_assignments" on public.assignments;
create policy "domain_insert_editors_assignments"
  on public.assignments for insert
  with check (public.can_edit());

drop policy if exists "domain_update_editors_assignments" on public.assignments;
create policy "domain_update_editors_assignments"
  on public.assignments for update
  using (public.can_edit())
  with check (public.can_edit());

drop policy if exists "domain_delete_editors_assignments" on public.assignments;
create policy "domain_delete_editors_assignments"
  on public.assignments for delete
  using (public.can_edit());

drop policy if exists "audit_select_authenticated" on public.audit_log;
create policy "audit_select_authenticated"
  on public.audit_log for select
  using (public.can_read());

drop policy if exists "audit_insert_editors" on public.audit_log;
create policy "audit_insert_editors"
  on public.audit_log for insert
  with check (public.can_edit());
