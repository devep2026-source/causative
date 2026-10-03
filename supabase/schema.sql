-- ============================================================
-- Causative · Supabase schema
-- Run this in:  Supabase Dashboard -> SQL Editor -> New query -> Run
-- ============================================================
-- Accounts:
--   * Students create their own account with their school email and the
--     ACCESS CODE the teacher gave them (the code is their password).
--   * Enable "Confirm email" in Authentication -> Sign in / Providers -> Email
--     so nobody can take over a student's address.
--   * After you create your own account, run step 6 to become the teacher.
-- ============================================================

create extension if not exists pgcrypto;

-- 1. PROFILES ------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text not null default '',
  role text not null default 'student' check (role in ('student', 'teacher')),
  created_at timestamptz not null default now()
);

-- security definer: avoids the RLS recursion you get when a policy
-- queries the very same table it protects.
create or replace function public.is_teacher()
returns boolean
language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher') $$;

-- profile row is created automatically at signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), new.email))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. PROGRESS (one row per student) --------------------------
create table if not exists public.progress (
  student_id uuid primary key references public.profiles (id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  points integer not null default 0,
  updated_at timestamptz not null default now()
);

-- 3. ASSIGNMENTS (extra activities sent by the teacher) ------
create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  floor text not null default '',
  title text not null,
  body text not null default '',
  source text not null default 'manual' check (source in ('manual', 'auto')),
  status text not null default 'assigned' check (status in ('assigned', 'done')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists assignments_student_idx on public.assignments (student_id, status);
create index if not exists progress_updated_idx on public.progress (updated_at desc);

-- a student may only tick an assignment as done; only the teacher edits content
create or replace function public.guard_assignment()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if public.is_teacher() then
    return new;
  end if;
  if new.student_id is distinct from old.student_id
     or new.title    is distinct from old.title
     or new.body     is distinct from old.body
     or new.floor    is distinct from old.floor
     or new.source   is distinct from old.source
     or new.status not in ('assigned', 'done') then
    raise exception 'students may only mark assignments as done';
  end if;
  if new.status = 'done' and old.status <> 'done' then
    new.completed_at := now();
  end if;
  return new;
end $$;

drop trigger if exists guard_assignment_t on public.assignments;
create trigger guard_assignment_t
  before update on public.assignments
  for each row execute function public.guard_assignment();

-- 4. ROW LEVEL SECURITY --------------------------------------
alter table public.profiles enable row level security;
alter table public.progress enable row level security;
alter table public.assignments enable row level security;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_teacher());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated
  using (public.is_teacher()) with check (public.is_teacher());

drop policy if exists progress_select on public.progress;
create policy progress_select on public.progress for select to authenticated
  using (student_id = auth.uid() or public.is_teacher());

drop policy if exists progress_insert on public.progress;
create policy progress_insert on public.progress for insert to authenticated
  with check (student_id = auth.uid());

drop policy if exists progress_update on public.progress;
create policy progress_update on public.progress for update to authenticated
  using (student_id = auth.uid()) with check (student_id = auth.uid());

drop policy if exists assignments_select on public.assignments;
create policy assignments_select on public.assignments for select to authenticated
  using (student_id = auth.uid() or public.is_teacher());

drop policy if exists assignments_write on public.assignments;
create policy assignments_write on public.assignments for insert to authenticated
  with check (public.is_teacher());

drop policy if exists assignments_update on public.assignments;
create policy assignments_update on public.assignments for update to authenticated
  using (student_id = auth.uid() or public.is_teacher())
  with check (student_id = auth.uid() or public.is_teacher());

drop policy if exists assignments_delete on public.assignments;
create policy assignments_delete on public.assignments for delete to authenticated
  using (public.is_teacher());

-- 5. default: nobody is a teacher yet ------------------------
-- profiles.role defaults to 'student'.

-- 6. RUN THIS ONCE for your own account (use your login email):
-- update public.profiles set role = 'teacher' where email = 'you@school.com';
