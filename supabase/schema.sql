-- Storage buckets (create in Supabase dashboard or via SQL)
-- Note: Supabase dashboard preferred for storage bucket creation.
-- insert into storage.buckets (id, name, public) values ('resumes', 'resumes', true);
-- insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);

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
  "current_role" text,
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

-- Reviewers table
create table if not exists public.reviewers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text,
  photo_url text,
  company text,
  experience_years int default 0,
  headline text,
  country text,
  expertise text[] default '{}',
  rating numeric(3,2) default 0,
  reviews int default 0,
  slug text unique,
  social_link text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add updated_at trigger for reviewers
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create trigger only if it doesn't exist
do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'set_updated_at' and tgrelid = 'public.reviewers'::regclass
  ) then
    create trigger set_updated_at
      before update on public.reviewers
      for each row execute function public.set_updated_at();
  end if;
end $$;

-- Enable RLS for reviewers
alter table public.reviewers enable row level security;

-- Reviewers RLS policies
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='reviewers' and policyname='reviewers_read_all'
  ) then
    create policy "reviewers_read_all" on public.reviewers
      for select using (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='reviewers' and policyname='reviewers_insert_own'
  ) then
    create policy "reviewers_insert_own" on public.reviewers
      for insert with check (auth.uid() = user_id);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='reviewers' and policyname='reviewers_update_own'
  ) then
    create policy "reviewers_update_own" on public.reviewers
      for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='reviewers' and policyname='reviewers_upsert_own'
  ) then
    create policy "reviewers_upsert_own" on public.reviewers
      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;

-- Indexes for reviewers table
create index if not exists reviewers_rating_idx on public.reviewers(rating desc);
create index if not exists reviewers_reviews_idx on public.reviewers(reviews desc);
create index if not exists reviewers_country_idx on public.reviewers(country);
create index if not exists reviewers_headline_trgm_idx on public.reviewers using gin(headline gin_trgm_ops);

-- Follows table
create table if not exists public.follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  reviewer_id uuid not null references public.reviewers(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, reviewer_id)
);

-- Enable RLS for follows
alter table public.follows enable row level security;

-- Follows RLS policies
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='follows' and policyname='users manage own follows'
  ) then
    create policy "users manage own follows" on public.follows
      for all using (auth.uid() = follower_id);
  end if;
end $$;

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

-- Storage policies for avatars bucket
-- Simple policies that allow authenticated users to upload and view avatars
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='Authenticated users can upload avatars'
  ) then
    create policy "Authenticated users can upload avatars" on storage.objects
      for insert with check (
        bucket_id = 'avatars' and
        auth.role() = 'authenticated'
      );
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='Anyone can view avatars'
  ) then
    create policy "Anyone can view avatars" on storage.objects
      for select using (bucket_id = 'avatars');
  end if;
end $$;

