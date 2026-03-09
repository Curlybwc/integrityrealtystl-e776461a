create or replace function public.assign_first_user_all_roles()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.user_roles limit 1) then
    insert into public.user_roles (user_id, role)
    values
      (new.id, 'admin'),
      (new.id, 'investor'),
      (new.id, 'partner'),
      (new.id, 'wholesaler');
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_assign_first_user_roles on auth.users;

create trigger on_auth_user_created_assign_first_user_roles
after insert on auth.users
for each row execute procedure public.assign_first_user_all_roles();
