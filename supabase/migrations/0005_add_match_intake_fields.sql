alter table public.matches
  add column if not exists external_match_id text,
  add column if not exists production_code text,
  add column if not exists commentary_plan text,
  add column if not exists transport text;

create index if not exists matches_external_match_id_idx
  on public.matches (external_match_id);

create index if not exists matches_production_code_idx
  on public.matches (production_code);

insert into public.roles (name, category, sort_order)
values ('Operador de Grafica', 'Produccion', 35)
on conflict (name) do update set
  category = excluded.category,
  sort_order = excluded.sort_order,
  active = true;
