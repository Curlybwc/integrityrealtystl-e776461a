insert into public.user_roles (user_id, role)
select id, 'investor' from auth.users;

insert into public.user_roles (user_id, role)
select id, 'partner' from auth.users;

insert into public.user_roles (user_id, role)
select id, 'admin' from auth.users;
