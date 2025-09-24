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
