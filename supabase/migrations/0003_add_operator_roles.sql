alter type public.app_role add value if not exists 'coordinator';
alter type public.app_role add value if not exists 'collaborator';

create or replace function public.can_edit()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_app_role() in ('admin', 'editor', 'coordinator');
$$;
