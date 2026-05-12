create table if not exists public.production_workbooks (
  id uuid primary key default gen_random_uuid(),
  period_label text not null,
  original_filename text not null,
  original_storage_path text,
  export_storage_path text,
  status text not null default 'draft' check (status in ('draft', 'applied', 'archived')),
  snapshot jsonb not null,
  column_mapping jsonb not null default '{}'::jsonb,
  base_row_versions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null
);

create table if not exists public.production_workbook_revisions (
  id bigint generated always as identity primary key,
  workbook_id uuid not null references public.production_workbooks(id) on delete cascade,
  snapshot jsonb not null,
  column_mapping jsonb not null default '{}'::jsonb,
  action text not null check (action in ('upload', 'draft', 'refresh', 'apply', 'export')),
  created_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles(id) on delete set null
);

create index if not exists production_workbooks_updated_idx
  on public.production_workbooks (updated_at desc);

create index if not exists production_workbook_revisions_workbook_idx
  on public.production_workbook_revisions (workbook_id, created_at desc);

drop trigger if exists production_workbooks_metadata on public.production_workbooks;
create trigger production_workbooks_metadata
  before insert or update on public.production_workbooks
  for each row execute procedure public.set_row_metadata();

alter table public.production_workbooks enable row level security;
alter table public.production_workbook_revisions enable row level security;

drop policy if exists "production_workbooks_select_authenticated" on public.production_workbooks;
create policy "production_workbooks_select_authenticated"
  on public.production_workbooks for select
  using (public.can_read());

drop policy if exists "production_workbooks_insert_editors" on public.production_workbooks;
create policy "production_workbooks_insert_editors"
  on public.production_workbooks for insert
  with check (public.can_edit());

drop policy if exists "production_workbooks_update_editors" on public.production_workbooks;
create policy "production_workbooks_update_editors"
  on public.production_workbooks for update
  using (public.can_edit())
  with check (public.can_edit());

drop policy if exists "production_workbook_revisions_select_authenticated" on public.production_workbook_revisions;
create policy "production_workbook_revisions_select_authenticated"
  on public.production_workbook_revisions for select
  using (public.can_read());

drop policy if exists "production_workbook_revisions_insert_editors" on public.production_workbook_revisions;
create policy "production_workbook_revisions_insert_editors"
  on public.production_workbook_revisions for insert
  with check (public.can_edit());

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'production-workbooks',
  'production-workbooks',
  false,
  52428800,
  array[
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/octet-stream'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "production_workbooks_storage_select_authenticated" on storage.objects;
create policy "production_workbooks_storage_select_authenticated"
  on storage.objects for select
  using (
    bucket_id = 'production-workbooks'
    and public.can_read()
  );

drop policy if exists "production_workbooks_storage_insert_editors" on storage.objects;
create policy "production_workbooks_storage_insert_editors"
  on storage.objects for insert
  with check (
    bucket_id = 'production-workbooks'
    and public.can_edit()
  );

drop policy if exists "production_workbooks_storage_update_editors" on storage.objects;
create policy "production_workbooks_storage_update_editors"
  on storage.objects for update
  using (
    bucket_id = 'production-workbooks'
    and public.can_edit()
  )
  with check (
    bucket_id = 'production-workbooks'
    and public.can_edit()
  );
