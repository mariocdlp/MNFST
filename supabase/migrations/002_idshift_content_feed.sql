-- IDSHIFT — Content feed, generated content, meditations, credits ledger
-- Builds on 001_initial_schema.sql. Run in the Supabase SQL Editor after 001.
--
-- Note: public.videos from 001 is superseded by generated_content (type = 'video').
-- It is left in place so existing rows are not lost; the app no longer writes to it.

-- ---------------------------------------------------------------------------
-- Profile changes: 5 free credits at signup (was 3)
-- ---------------------------------------------------------------------------
alter table public.profiles alter column credits_remaining set default 5;
alter table public.profiles add column if not exists onboarding_completed boolean not null default false;

-- ---------------------------------------------------------------------------
-- Curated content library
-- The canonical copy of this data lives in src/lib/content/library.json so the
-- feed works without a database round trip; this table mirrors it for SQL-side
-- querying and future CMS work. Seed it with supabase/seed/content_library.sql.
-- ---------------------------------------------------------------------------
create table if not exists public.content_library (
  id text primary key,
  type text not null check (type in ('image', 'carousel', 'video', 'meditation', 'affirmation')),
  title text not null,
  content_data jsonb not null,
  benefit_tag text not null,
  science_ref text not null,
  method_tags text[] not null default '{}',
  goal_categories text[] not null default '{}',
  personalization_variables text[] not null default '{}',
  intensity text not null default 'moderate' check (intensity in ('gentle', 'moderate', 'intense')),
  time_of_day_affinity text not null default 'any' check (time_of_day_affinity in ('morning', 'midday', 'evening', 'any')),
  duration_seconds integer,
  is_premium boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- AI-generated + user-created content
-- ---------------------------------------------------------------------------
create table if not exists public.generated_content (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in ('image', 'carousel', 'video', 'meditation', 'affirmation')),
  title text not null,
  content_data jsonb not null default '{}'::jsonb,
  generation_prompt jsonb not null default '{}'::jsonb,
  benefit_tag text not null,
  science_ref text not null,
  method_tags text[] not null default '{}',
  status text not null default 'ready' check (status in ('queued', 'generating', 'ready', 'failed')),
  source text not null default 'system_generated' check (source in ('system_generated', 'user_created')),
  credits_spent integer not null default 0,
  duration_seconds integer,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- The feed itself: an ordered, dated slice of content served to one user
-- ---------------------------------------------------------------------------
create table if not exists public.user_feed (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  content_source text not null check (content_source in ('library', 'generated')),
  library_content_id text references public.content_library(id) on delete cascade,
  generated_content_id uuid references public.generated_content(id) on delete cascade,
  time_slot text not null default 'any' check (time_slot in ('morning', 'midday', 'evening', 'any')),
  feed_date date not null default current_date,
  position integer not null default 0,
  served_at timestamptz not null default now(),
  viewed boolean not null default false,
  viewed_at timestamptz,
  saved boolean not null default false,
  completed boolean not null default false,
  -- exactly one content reference, matching content_source
  constraint user_feed_one_source check (
    (content_source = 'library' and library_content_id is not null and generated_content_id is null)
    or
    (content_source = 'generated' and generated_content_id is not null and library_content_id is null)
  )
);

-- A piece is served to a user at most once per day per slot
create unique index if not exists idx_user_feed_unique_library
  on public.user_feed(user_id, feed_date, time_slot, library_content_id)
  where library_content_id is not null;
create unique index if not exists idx_user_feed_unique_generated
  on public.user_feed(user_id, feed_date, time_slot, generated_content_id)
  where generated_content_id is not null;

-- ---------------------------------------------------------------------------
-- Personal meditation library
-- ---------------------------------------------------------------------------
create table if not exists public.user_meditations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  generated_content_id uuid references public.generated_content(id) on delete cascade,
  title text not null,
  audio_url text,
  duration_seconds integer not null default 300,
  focus_area text not null,
  mood text not null,
  created_at timestamptz not null default now(),
  listen_count integer not null default 0,
  last_listened_at timestamptz
);

-- ---------------------------------------------------------------------------
-- Credit ledger — Stripe-ready: purchases become another transaction reason
-- ---------------------------------------------------------------------------
create table if not exists public.credit_transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  amount integer not null,
  reason text not null check (reason in ('signup_bonus', 'meditation_created', 'purchase', 'refund')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Pledges are now derived from the survey, not from a video
-- ---------------------------------------------------------------------------
alter table public.action_pledges alter column video_id drop not null;
alter table public.action_pledges add column if not exists survey_response_id uuid
  references public.survey_responses(id) on delete set null;

-- Notification types for the feed era
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in (
    'morning_reminder', 'evening_checkin', 'streak_milestone', 'weekly_summary',
    'content_ready', 'meditation_ready', 'nudge', 'video_ready'
  ));

alter table public.notification_preferences
  add column if not exists email_content_ready boolean not null default true,
  add column if not exists in_app_content_ready boolean not null default true;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.content_library enable row level security;
alter table public.generated_content enable row level security;
alter table public.user_feed enable row level security;
alter table public.user_meditations enable row level security;
alter table public.credit_transactions enable row level security;

-- The curated library is readable by every signed-in user; writes are seed-only
-- (service role bypasses RLS).
drop policy if exists "Signed-in users can read the library" on public.content_library;
create policy "Signed-in users can read the library" on public.content_library
  for select to authenticated using (true);

drop policy if exists "Users can view own generated content" on public.generated_content;
create policy "Users can view own generated content" on public.generated_content
  for select using (auth.uid() = user_id);
drop policy if exists "Users can insert own generated content" on public.generated_content;
create policy "Users can insert own generated content" on public.generated_content
  for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update own generated content" on public.generated_content;
create policy "Users can update own generated content" on public.generated_content
  for update using (auth.uid() = user_id);

drop policy if exists "Users can manage own feed" on public.user_feed;
create policy "Users can manage own feed" on public.user_feed
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can manage own meditations" on public.user_meditations;
create policy "Users can manage own meditations" on public.user_meditations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can view own credit transactions" on public.credit_transactions;
create policy "Users can view own credit transactions" on public.credit_transactions
  for select using (auth.uid() = user_id);

-- Users can delete their own pledges (unpledging)
drop policy if exists "Users can delete own pledges" on public.action_pledges;
create policy "Users can delete own pledges" on public.action_pledges
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Signup bonus is recorded in the ledger too
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', ''));

  insert into public.streaks (user_id) values (new.id);
  insert into public.notification_preferences (user_id) values (new.id);
  insert into public.credit_transactions (user_id, amount, reason) values (new.id, 5, 'signup_bonus');

  return new;
end;
$$ language plpgsql security definer;

-- ---------------------------------------------------------------------------
-- Credit spend, atomically — returns the new balance, or null when short
-- ---------------------------------------------------------------------------
create or replace function public.spend_credit(p_reason text)
returns integer as $$
declare
  v_remaining integer;
begin
  update public.profiles
     set credits_remaining = credits_remaining - 1,
         credits_used = credits_used + 1,
         last_credit_used_at = now()
   where id = auth.uid() and credits_remaining > 0
  returning credits_remaining into v_remaining;

  if v_remaining is null then
    return null;
  end if;

  insert into public.credit_transactions (user_id, amount, reason)
  values (auth.uid(), -1, p_reason);

  return v_remaining;
end;
$$ language plpgsql security definer;

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index if not exists idx_content_library_type on public.content_library(type);
create index if not exists idx_content_library_time on public.content_library(time_of_day_affinity);
create index if not exists idx_generated_content_user on public.generated_content(user_id, created_at desc);
create index if not exists idx_user_feed_user_date on public.user_feed(user_id, feed_date desc, position);
create index if not exists idx_user_feed_saved on public.user_feed(user_id, saved) where saved;
create index if not exists idx_user_meditations_user on public.user_meditations(user_id, created_at desc);
create index if not exists idx_credit_transactions_user on public.credit_transactions(user_id, created_at desc);

-- Storage buckets (create in the Supabase dashboard, or uncomment here)
-- insert into storage.buckets (id, name, public) values ('user-photos', 'user-photos', false);
-- insert into storage.buckets (id, name, public) values ('generated-content', 'generated-content', true);
