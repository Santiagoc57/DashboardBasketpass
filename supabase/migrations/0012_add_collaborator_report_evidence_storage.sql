insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'collaborator-report-evidence',
  'collaborator-report-evidence',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "collaborator_report_evidence_select_authenticated" on storage.objects;
create policy "collaborator_report_evidence_select_authenticated"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'collaborator-report-evidence'
    and public.can_read()
  );

drop policy if exists "collaborator_report_evidence_insert_editors" on storage.objects;
create policy "collaborator_report_evidence_insert_editors"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'collaborator-report-evidence'
    and public.can_edit()
  );

drop policy if exists "collaborator_report_evidence_update_editors" on storage.objects;
create policy "collaborator_report_evidence_update_editors"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'collaborator-report-evidence'
    and public.can_edit()
  )
  with check (
    bucket_id = 'collaborator-report-evidence'
    and public.can_edit()
  );

drop policy if exists "collaborator_report_evidence_delete_editors" on storage.objects;
create policy "collaborator_report_evidence_delete_editors"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'collaborator-report-evidence'
    and public.can_edit()
  );
