create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  with profile_role as (
    select role
    from public.profiles
    where id = auth.uid()
  )
  select coalesce(
    case
      when lower(coalesce(auth.jwt() -> 'app_metadata' ->> 'bp_access_role', '')) = 'collaborator'
        and coalesce((select role from profile_role), 'viewer'::public.app_role)
          not in ('admin', 'editor', 'coordinator')
      then 'collaborator'::public.app_role
      else null
    end,
    (select role from profile_role),
    'viewer'::public.app_role
  );
$$;

create or replace function public.can_edit()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_app_role() in ('admin', 'editor', 'coordinator');
$$;

create or replace function public.current_user_display_name()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select nullif(
    trim(
      coalesce(
        (select full_name from public.profiles where id = auth.uid()),
        auth.jwt() -> 'user_metadata' ->> 'full_name',
        split_part(coalesce(auth.jwt() ->> 'email', ''), '@', 1)
      )
    ),
    ''
  );
$$;

create or replace function public.current_linked_person_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  with identity as (
    select
      nullif(lower(auth.jwt() ->> 'email'), '') as email,
      public.current_user_display_name() as display_name
  )
  select people.id
  from public.people, identity
  where people.active = true
    and (
      (identity.email is not null and lower(coalesce(people.email, '')) = identity.email)
      or (identity.display_name is not null and people.full_name = identity.display_name)
    )
  order by
    case
      when identity.email is not null and lower(coalesce(people.email, '')) = identity.email
      then 0
      else 1
    end,
    people.created_at asc
  limit 1;
$$;

create or replace function public.can_operate_assignment(target_assignment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.current_app_role() in ('admin', 'editor', 'coordinator')
    or (
      public.current_app_role() = 'collaborator'
      and exists (
        select 1
        from public.assignments
        where id = target_assignment_id
          and person_id = public.current_linked_person_id()
      )
    );
$$;

create or replace function public.attachment_assignment_id(object_name text)
returns uuid
language sql
stable
as $$
  select case
    when split_part(object_name, '/', 1) = 'matches'
      and split_part(object_name, '/', 3) = 'assignments'
      and split_part(object_name, '/', 4) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    then split_part(object_name, '/', 4)::uuid
    else null
  end;
$$;

create or replace function public.can_operate_attachment_path(object_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.current_app_role() in ('admin', 'editor', 'coordinator')
    or (
      public.current_app_role() = 'collaborator'
      and public.attachment_assignment_id(object_name) is not null
      and public.can_operate_assignment(public.attachment_assignment_id(object_name))
    );
$$;

create or replace function public.confirm_collaborator_assignment(target_assignment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.can_operate_assignment(target_assignment_id) then
    raise exception 'No tienes acceso a esta asignacion.'
      using errcode = '42501';
  end if;

  update public.assignments
  set confirmed = true
  where id = target_assignment_id;
end;
$$;

drop policy if exists "collaborator_reports_select_authenticated" on public.collaborator_reports;
drop policy if exists "collaborator_reports_select_scoped" on public.collaborator_reports;
create policy "collaborator_reports_select_scoped"
  on public.collaborator_reports for select
  using (
    public.current_app_role() in ('admin', 'editor', 'coordinator')
    or (
      public.current_app_role() = 'collaborator'
      and (
        reporter_profile_id = auth.uid()
        or public.can_operate_assignment(assignment_id)
      )
    )
  );

drop policy if exists "collaborator_reports_insert_editors" on public.collaborator_reports;
drop policy if exists "collaborator_reports_insert_scoped" on public.collaborator_reports;
create policy "collaborator_reports_insert_scoped"
  on public.collaborator_reports for insert
  with check (
    public.current_app_role() in ('admin', 'editor', 'coordinator')
    or (
      public.current_app_role() = 'collaborator'
      and reporter_profile_id = auth.uid()
      and public.can_operate_assignment(assignment_id)
    )
  );

drop policy if exists "collaborator_reports_update_editors" on public.collaborator_reports;
drop policy if exists "collaborator_reports_update_scoped" on public.collaborator_reports;
create policy "collaborator_reports_update_scoped"
  on public.collaborator_reports for update
  using (
    public.current_app_role() in ('admin', 'editor', 'coordinator')
    or (
      public.current_app_role() = 'collaborator'
      and reporter_profile_id = auth.uid()
      and public.can_operate_assignment(assignment_id)
    )
  )
  with check (
    public.current_app_role() in ('admin', 'editor', 'coordinator')
    or (
      public.current_app_role() = 'collaborator'
      and reporter_profile_id = auth.uid()
      and public.can_operate_assignment(assignment_id)
    )
  );

drop policy if exists "collaborator_reports_delete_editors" on public.collaborator_reports;
drop policy if exists "collaborator_reports_delete_backoffice" on public.collaborator_reports;
create policy "collaborator_reports_delete_backoffice"
  on public.collaborator_reports for delete
  using (public.current_app_role() in ('admin', 'editor', 'coordinator'));

drop policy if exists "collaborator_report_evidence_select_authenticated" on storage.objects;
drop policy if exists "collaborator_report_evidence_select_scoped" on storage.objects;
create policy "collaborator_report_evidence_select_scoped"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'collaborator-report-evidence'
    and public.can_operate_attachment_path(name)
  );

drop policy if exists "collaborator_report_evidence_insert_editors" on storage.objects;
drop policy if exists "collaborator_report_evidence_insert_scoped" on storage.objects;
create policy "collaborator_report_evidence_insert_scoped"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'collaborator-report-evidence'
    and public.can_operate_attachment_path(name)
  );

drop policy if exists "collaborator_report_evidence_update_editors" on storage.objects;
drop policy if exists "collaborator_report_evidence_update_scoped" on storage.objects;
create policy "collaborator_report_evidence_update_scoped"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'collaborator-report-evidence'
    and public.can_operate_attachment_path(name)
  )
  with check (
    bucket_id = 'collaborator-report-evidence'
    and public.can_operate_attachment_path(name)
  );

drop policy if exists "collaborator_report_evidence_delete_editors" on storage.objects;
drop policy if exists "collaborator_report_evidence_delete_scoped" on storage.objects;
create policy "collaborator_report_evidence_delete_scoped"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'collaborator-report-evidence'
    and public.can_operate_attachment_path(name)
  );
