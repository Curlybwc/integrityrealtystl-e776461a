create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  role text not null,
  created_at timestamp with time zone default now()
);

create index if not exists user_roles_user_id_idx on public.user_roles (user_id);
