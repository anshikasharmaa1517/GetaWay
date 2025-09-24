-- Storage buckets (create in Supabase dashboard or via SQL)
-- Note: Supabase dashboard preferred for storage bucket creation.
-- insert into storage.buckets (id, name, public) values ('resumes', 'resumes', true);
-- insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);

create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'Pending',
  review_status text check (review_status in ('Approved', 'Needs Revision')),
  score int,
  notes text,
  file_url text not null,
  reviewer_slug text,
  created_at timestamptz not null default now()
);

-- User profiles table with role support
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user' check (role in ('user', 'reviewer', 'admin')),
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
  -- Profile metadata
  avatar_url text,
  created_at timestamptz not null default now(),
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
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='Reviewers can view profiles of users who shared resumes'
  ) then
    create policy "Reviewers can view profiles of users who shared resumes" on public.profiles
      for select using (
        id in (
          select user_id from public.resumes 
          where reviewer_slug is not null and 
          reviewer_slug in (
            select slug from public.reviewers where user_id = auth.uid()
          )
        )
      );
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

-- Note: User roles are determined dynamically in the application
-- based on whether a user has a reviewer profile or not.
-- No need for a role column in profiles table or triggers.

-- Reviews table for storing reviewer feedback
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  reviewer_id uuid not null references public.reviewers(id) on delete cascade,
  resume_id uuid not null references public.resumes(id) on delete cascade,
  score int not null check (score >= 1 and score <= 10),
  feedback text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(reviewer_id, resume_id)
);

-- Add updated_at trigger for reviews
do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'set_updated_at' and tgrelid = 'public.reviews'::regclass) then
    create trigger set_updated_at
      before update on public.reviews
      for each row execute function public.set_updated_at();
  end if;
end $$;

-- Enable RLS for reviews
alter table public.reviews enable row level security;

-- Reviewer ratings table for users to rate reviewers
create table if not exists public.reviewer_ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reviewer_id uuid not null references public.reviewers(id) on delete cascade,
  resume_id uuid not null references public.resumes(id) on delete cascade,
  rating int not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, reviewer_id, resume_id)
);

-- Add updated_at trigger for reviewer_ratings
do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'set_updated_at_reviewer_ratings' and tgrelid = 'public.reviewer_ratings'::regclass) then
    create trigger set_updated_at_reviewer_ratings
      before update on public.reviewer_ratings
      for each row execute function public.set_updated_at();
  end if;
end $$;

-- Enable RLS for reviewer_ratings
alter table public.reviewer_ratings enable row level security;

-- Users can manage their own ratings
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='reviewer_ratings' and policyname='Users can manage their own ratings'
  ) then
    create policy "Users can manage their own ratings" on public.reviewer_ratings
      for all using (auth.uid() = user_id);
  end if;
end $$;

-- Reviewers can view ratings they received
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='reviewer_ratings' and policyname='Reviewers can view their ratings'
  ) then
    create policy "Reviewers can view their ratings" on public.reviewer_ratings
      for select using (
        reviewer_id in (
          select id from public.reviewers where user_id = auth.uid()
        )
      );
  end if;
end $$;

-- Function to update reviewer's average rating
create or replace function public.update_reviewer_rating()
returns trigger as $$
begin
  -- Calculate new average rating for the reviewer
  update public.reviewers
  set 
    rating = (
      select round(avg(rating)::numeric, 2)
      from public.reviewer_ratings
      where reviewer_id = coalesce(new.reviewer_id, old.reviewer_id)
    ),
    reviews = (
      select count(*)
      from public.reviewer_ratings
      where reviewer_id = coalesce(new.reviewer_id, old.reviewer_id)
    ),
    updated_at = now()
  where id = coalesce(new.reviewer_id, old.reviewer_id);
  
  return coalesce(new, old);
end;
$$ language plpgsql;

-- Trigger to update reviewer rating when ratings change
do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'update_reviewer_rating_trigger' and tgrelid = 'public.reviewer_ratings'::regclass) then
    create trigger update_reviewer_rating_trigger
      after insert or update or delete on public.reviewer_ratings
      for each row execute function public.update_reviewer_rating();
  end if;
end $$;

-- Create indexes for reviewer_ratings
create index if not exists idx_reviewer_ratings_user_id on public.reviewer_ratings(user_id);
create index if not exists idx_reviewer_ratings_reviewer_id on public.reviewer_ratings(reviewer_id);
create index if not exists idx_reviewer_ratings_resume_id on public.reviewer_ratings(resume_id);

-- Conversations table for user-reviewer communication
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid not null references public.resumes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(resume_id)
);

-- Messages table for conversation threads
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  message text not null,
  message_type text not null default 'text' check (message_type in ('text', 'quick_reply')),
  created_at timestamptz not null default now()
);

-- Reviews RLS policies
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='reviews' and policyname='reviews_read_own'
  ) then
    create policy "reviews_read_own" on public.reviews
      for select using (auth.uid() = reviewer_id);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='reviews' and policyname='reviews_insert_own'
  ) then
    create policy "reviews_insert_own" on public.reviews
      for insert with check (auth.uid() = reviewer_id);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='reviews' and policyname='reviews_update_own'
  ) then
    create policy "reviews_update_own" on public.reviews
      for update using (auth.uid() = reviewer_id) with check (auth.uid() = reviewer_id);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='reviews' and policyname='reviews_read_all'
  ) then
    create policy "reviews_read_all" on public.reviews
      for select using (true);
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
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='resumes' and policyname='Reviewers can view resumes shared with them'
  ) then
    create policy "Reviewers can view resumes shared with them" on public.resumes
      for select using (
        reviewer_slug is not null and 
        reviewer_slug in (
          select slug from public.reviewers where user_id = auth.uid()
        )
      );
  end if;
end $$;

-- Enable RLS for conversations and messages
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- Conversations RLS policies
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='conversations' and policyname='Users can view their conversations'
  ) then
    create policy "Users can view their conversations" on public.conversations
      for select using (auth.uid() = user_id or auth.uid() = reviewer_id);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='conversations' and policyname='Users can create conversations'
  ) then
    create policy "Users can create conversations" on public.conversations
      for insert with check (auth.uid() = user_id);
  end if;
end $$;

-- Messages RLS policies
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='messages' and policyname='Users can view messages in their conversations'
  ) then
    create policy "Users can view messages in their conversations" on public.messages
      for select using (
        conversation_id in (
          select id from public.conversations 
          where user_id = auth.uid() or reviewer_id = auth.uid()
        )
      );
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='messages' and policyname='Users can send messages'
  ) then
    create policy "Users can send messages" on public.messages
      for insert with check (
        auth.uid() = sender_id and
        conversation_id in (
          select id from public.conversations 
          where user_id = auth.uid() or reviewer_id = auth.uid()
        )
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

-- Create experiences table
CREATE TABLE IF NOT EXISTS public.experiences (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  reviewer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  company text NOT NULL,
  employment_type text NOT NULL, -- 'Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'
  location text,
  location_type text, -- 'On-site', 'Remote', 'Hybrid'
  start_date date NOT NULL,
  end_date date,
  currently_working boolean DEFAULT false,
  description text,
  skills text[], -- Array of skills
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create RLS policies for experiences
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;

-- Reviewers can manage their own experiences
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='experiences' and policyname='Reviewers can manage their own experiences'
  ) then
    create policy "Reviewers can manage their own experiences" on public.experiences
      for all using (auth.uid() = reviewer_id);
  end if;
end $$;

-- Anyone can view experiences (for public profiles)
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='experiences' and policyname='Anyone can view experiences'
  ) then
    create policy "Anyone can view experiences" on public.experiences
      for select using (true);
  end if;
end $$;

-- Create trigger for updated_at
do $$ begin
  if not exists (
    select 1 from pg_trigger where tgname = 'set_updated_at_experiences'
  ) then
    create trigger set_updated_at_experiences
      before update on public.experiences
      for each row
      execute function public.set_updated_at();
  end if;
end $$;

-- Create indexes for experiences
CREATE INDEX IF NOT EXISTS idx_experiences_reviewer_id ON public.experiences(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_experiences_company ON public.experiences(company);
CREATE INDEX IF NOT EXISTS idx_experiences_start_date ON public.experiences(start_date DESC);

