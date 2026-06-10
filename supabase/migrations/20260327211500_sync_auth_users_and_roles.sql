update public.users
set role = 'citizen'
where role = 'operator';

alter table public.users
alter column role set default 'citizen';

alter table public.users
drop constraint if exists users_role_check;

alter table public.users
add constraint users_role_check
check (role in ('citizen', 'admin'));

create or replace function public.sync_public_user_from_auth()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  next_role text;
  next_full_name text;
begin
  next_role := case coalesce(nullif(new.raw_user_meta_data ->> 'role', ''), 'citizen')
    when 'admin' then 'admin'
    else 'citizen'
  end;

  next_full_name := nullif(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '');

  insert into public.users (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, concat(new.id::text, '@citypulse.local')),
    next_full_name,
    next_role
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = excluded.full_name,
    role = excluded.role;

  return new;
end;
$$;

drop trigger if exists sync_public_user_from_auth on auth.users;

create trigger sync_public_user_from_auth
after insert or update on auth.users
for each row execute function public.sync_public_user_from_auth();

insert into public.users (id, email, full_name, role)
select
  auth_user.id,
  coalesce(auth_user.email, concat(auth_user.id::text, '@citypulse.local')),
  nullif(btrim(coalesce(auth_user.raw_user_meta_data ->> 'full_name', '')), ''),
  case coalesce(nullif(auth_user.raw_user_meta_data ->> 'role', ''), 'citizen')
    when 'admin' then 'admin'
    else 'citizen'
  end
from auth.users as auth_user
on conflict (id) do update
set
  email = excluded.email,
  full_name = excluded.full_name,
  role = excluded.role;
