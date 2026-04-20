-- Initial schema: create a profiles table linked to auth.users
create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    username text unique not null,
    full_name text,
    avatar_url text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

comment on table public.profiles is 'User profile information for GitHub Arena users.';

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- Anyone can read public profiles
create policy "Profiles are viewable by everyone"
    on public.profiles
    for select
    using (true);

-- Users can insert their own profile
create policy "Users can insert their own profile"
    on public.profiles
    for insert
    with check (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update their own profile"
    on public.profiles
    for update
    using (auth.uid() = id);

-- Keep updated_at fresh on every update
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger profiles_set_updated_at
    before update on public.profiles
    for each row
    execute function public.set_updated_at();
