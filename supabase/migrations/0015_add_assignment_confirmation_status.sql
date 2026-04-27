alter table public.assignments
  add column if not exists confirmation_status text not null default 'pending',
  add column if not exists confirmation_token text,
  add column if not exists confirmation_responded_at timestamptz;

update public.assignments
set confirmation_status = case
    when confirmed then 'accepted'
    else 'pending'
  end
where confirmation_status is null
   or confirmation_status not in ('pending', 'accepted', 'declined');

update public.assignments
set confirmation_token = encode(gen_random_bytes(18), 'hex')
where confirmation_token is null;

alter table public.assignments
  alter column confirmation_token set default encode(gen_random_bytes(18), 'hex');

alter table public.assignments
  add constraint assignments_confirmation_status_check
  check (confirmation_status in ('pending', 'accepted', 'declined'));

create unique index if not exists assignments_confirmation_token_key
  on public.assignments (confirmation_token)
  where confirmation_token is not null;
