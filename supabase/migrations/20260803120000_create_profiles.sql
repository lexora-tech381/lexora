-- Lexora billing profile (source of truth for Polar plan sync)
-- Apply in Supabase SQL editor or via CLI migration.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  plan text not null default 'free'
    check (plan in ('free', 'silver', 'gold', 'premium')),
  subscription_status text,
  subscription_id text,
  customer_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists profiles_email_idx on public.profiles (lower(email));
create index if not exists profiles_customer_id_idx on public.profiles (customer_id);
create index if not exists profiles_subscription_id_idx on public.profiles (subscription_id);

alter table public.profiles enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Keep service-role webhook writes working (service role bypasses RLS).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, plan)
  values (
    new.id,
    lower(new.email),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'free'
  )
  on conflict (id) do update
    set
      email = excluded.email,
      full_name = coalesce(nullif(excluded.full_name, ''), public.profiles.full_name),
      updated_at = timezone('utc', now());

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Backfill existing auth users into profiles.
insert into public.profiles (id, email, full_name, plan)
select
  u.id,
  lower(u.email),
  coalesce(u.raw_user_meta_data ->> 'full_name', ''),
  'free'
from auth.users u
on conflict (id) do nothing;
