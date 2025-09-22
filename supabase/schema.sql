-- Storage bucket for resumes (create in Supabase dashboard or via SQL)
-- Note: Supabase dashboard preferred for storage bucket creation.
-- insert into storage.buckets (id, name, public) values ('resumes', 'resumes', true);

create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'Pending',
  score int,
  notes text,
  file_url text not null,
  created_at timestamptz not null default now()
);

-- Minimal profile table for onboarding state
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  onboarded boolean not null default false,
  employment_status text,
  -- Student fields
  student_university text,
  student_degree text,
  student_graduation_year int,
  desired_job_title text,
  desired_location text,
  -- Employed fields
  current_role text,
  years_experience int,
  industry text,
  looking_for text,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='Profiles are self accessible'
  ) then
    create policy "Profiles are self accessible" on public.profiles
      for select using (auth.uid() = id);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='Profiles self upsert'
  ) then
    create policy "Profiles self upsert" on public.profiles
      for insert with check (auth.uid() = id);
    create policy "Profiles self update" on public.profiles
      for update using (auth.uid() = id) with check (auth.uid() = id);
  end if;
end $$;

-- Optional leaderboard materialization (simple view)
create or replace view public.leaderboard as
  select user_id, max(score) as best_score
  from public.resumes
  where score is not null
  group by user_id
  order by best_score desc nulls last;

-- RLS policies
alter table public.resumes enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='resumes' and policyname='Users can view their resumes'
  ) then
    create policy "Users can view their resumes" on public.resumes
      for select using (auth.uid() = user_id);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='resumes' and policyname='Users can insert their resumes'
  ) then
    create policy "Users can insert their resumes" on public.resumes
      for insert with check (auth.uid() = user_id);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='resumes' and policyname='Admins can update resumes'
  ) then
    create policy "Admins can update resumes" on public.resumes
      for update using (
        auth.email() = any (string_to_array(coalesce(current_setting('app.admin_emails', true), ''), ','))
      );
  end if;
end $$;


