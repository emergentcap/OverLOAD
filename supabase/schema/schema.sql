
-- Enable extensions often available by default
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- Profiles (linked to auth.users)
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

-- Programs
create table if not exists public.programs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  start_date date,
  meso_weeks int default 5,
  include_deload boolean default true,
  priorities jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  unique(user_id, name)
);

-- Weeks (targets per muscle; deload flag)
create table if not exists public.weeks (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  week_number int not null,
  targets jsonb not null, -- e.g., {"Chest":10, "Back":10, ...}
  deload boolean default false,
  created_at timestamptz default now(),
  unique(program_id, week_number)
);

-- Sessions
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  week_number int not null,
  day text not null, -- 'Sat','Sun','Mon','Tue','Wed','Thu','Fri'
  started_at timestamptz default now()
);

-- Sets
create table if not exists public.sets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  exercise text,
  muscle text,
  weight numeric,
  reps int,
  rir numeric,
  notes text
);

-- Adjustments (audit how next week targets were computed)
create table if not exists public.adjustments (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  from_week int not null,
  to_week int not null,
  rules jsonb,
  created_at timestamptz default now()
);

-- RLS
alter table public.profiles enable row level security;
alter table public.programs enable row level security;
alter table public.weeks enable row level security;
alter table public.sessions enable row level security;
alter table public.sets enable row level security;
alter table public.adjustments enable row level security;

-- Helpers
create or replace function public.is_owner_program(pid uuid)
returns boolean language sql stable as $$
  select exists(
    select 1 from programs p
    where p.id = pid and p.user_id = auth.uid()
  );
$$;

-- Policies
create policy "profiles are self-owned" on public.profiles
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "programs owned" on public.programs
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "weeks via program ownership" on public.weeks
  for all using (public.is_owner_program(program_id)) with check (public.is_owner_program(program_id));

create policy "sessions via program ownership" on public.sessions
  for all using (public.is_owner_program(program_id)) with check (public.is_owner_program(program_id));

create policy "sets via session->program ownership" on public.sets
  for all using (exists(
    select 1 from public.sessions s
    join public.programs p on p.id = s.program_id
    where s.id = sets.session_id and p.user_id = auth.uid()
  ))
  with check (exists(
    select 1 from public.sessions s
    join public.programs p on p.id = s.program_id
    where s.id = sets.session_id and p.user_id = auth.uid()
  ));

create policy "adjustments via program ownership" on public.adjustments
  for all using (public.is_owner_program(program_id)) with check (public.is_owner_program(program_id));
