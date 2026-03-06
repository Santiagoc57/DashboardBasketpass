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
