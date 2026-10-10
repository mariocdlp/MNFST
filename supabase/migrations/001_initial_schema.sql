-- IDSHIFT Database Schema
-- Run this in the Supabase SQL Editor to set up the database

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users profile table (extends Supabase auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  name text not null default '',
  credits_remaining integer not null default 3,
  credits_used integer not null default 0,
  last_credit_used_at timestamptz,
  created_at timestamptz not null default now()
);

-- Survey responses
create table if not exists public.survey_responses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  response_data jsonb not null,
  created_at timestamptz not null default now()
);

-- User photos for likeness generation
create table if not exists public.user_photos (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  photo_url text not null,
  photo_type text not null check (photo_type in ('face_front', 'face_angle', 'full_body')),
  uploaded_at timestamptz not null default now()
);

-- Generated videos
create table if not exists public.videos (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  survey_response_id uuid references public.survey_responses(id) on delete set null,
  template_id text not null default 'universal_v1',
  vibe_id text not null,
  status text not null default 'queued' check (status in ('queued', 'generating', 'completed', 'failed')),
  video_url text,
  thumbnail_url text,
  generation_log jsonb default '[]'::jsonb,
  generation_started_at timestamptz,
  generation_completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Action pledges
create table if not exists public.action_pledges (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  video_id uuid references public.videos(id) on delete cascade not null,
  action_type text not null check (action_type in ('daily_habit', 'if_then_plan', 'first_step')),
  action_text text not null,
  pledged_at timestamptz not null default now(),
  is_active boolean not null default true
);

-- Daily action completions
create table if not exists public.action_completions (
  id uuid primary key default uuid_generate_v4(),
  pledge_id uuid references public.action_pledges(id) on delete cascade not null,
  date date not null,
  status text not null check (status in ('done', 'skipped', 'partial')),
  reflection_text text,
  completed_at timestamptz not null default now(),
  unique (pledge_id, date)
);

-- Streak tracking
create table if not exists public.streaks (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_completion_date date
);

-- Notifications
create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in ('morning_reminder', 'evening_checkin', 'streak_milestone', 'weekly_summary', 'video_ready')),
  title text not null,
  content text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Notification preferences
create table if not exists public.notification_preferences (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  morning_reminder_time time not null default '07:00',
  evening_checkin_time time not null default '20:00',
  email_morning_reminder boolean not null default true,
  email_evening_checkin boolean not null default true,
  email_weekly_summary boolean not null default true,
  email_video_ready boolean not null default true,
  in_app_morning_reminder boolean not null default true,
  in_app_evening_checkin boolean not null default true,
  in_app_streak_milestone boolean not null default true,
  in_app_weekly_summary boolean not null default true
);

-- Row Level Security policies
alter table public.profiles enable row level security;
alter table public.survey_responses enable row level security;
alter table public.user_photos enable row level security;
alter table public.videos enable row level security;
alter table public.action_pledges enable row level security;
alter table public.action_completions enable row level security;
alter table public.streaks enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_preferences enable row level security;

-- Users can only access their own data
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

drop policy if exists "Users can view own surveys" on public.survey_responses;
create policy "Users can view own surveys" on public.survey_responses for select using (auth.uid() = user_id);
drop policy if exists "Users can insert own surveys" on public.survey_responses;
create policy "Users can insert own surveys" on public.survey_responses for insert with check (auth.uid() = user_id);

drop policy if exists "Users can view own photos" on public.user_photos;
create policy "Users can view own photos" on public.user_photos for select using (auth.uid() = user_id);
drop policy if exists "Users can insert own photos" on public.user_photos;
create policy "Users can insert own photos" on public.user_photos for insert with check (auth.uid() = user_id);
drop policy if exists "Users can delete own photos" on public.user_photos;
create policy "Users can delete own photos" on public.user_photos for delete using (auth.uid() = user_id);

drop policy if exists "Users can view own videos" on public.videos;
create policy "Users can view own videos" on public.videos for select using (auth.uid() = user_id);
drop policy if exists "Users can insert own videos" on public.videos;
create policy "Users can insert own videos" on public.videos for insert with check (auth.uid() = user_id);

drop policy if exists "Users can view own pledges" on public.action_pledges;
create policy "Users can view own pledges" on public.action_pledges for select using (auth.uid() = user_id);
drop policy if exists "Users can insert own pledges" on public.action_pledges;
create policy "Users can insert own pledges" on public.action_pledges for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update own pledges" on public.action_pledges;
create policy "Users can update own pledges" on public.action_pledges for update using (auth.uid() = user_id);

drop policy if exists "Users can view own completions" on public.action_completions;
create policy "Users can view own completions" on public.action_completions for select
  using (exists (select 1 from public.action_pledges where id = pledge_id and user_id = auth.uid()));
drop policy if exists "Users can insert own completions" on public.action_completions;
create policy "Users can insert own completions" on public.action_completions for insert
  with check (exists (select 1 from public.action_pledges where id = pledge_id and user_id = auth.uid()));
drop policy if exists "Users can update own completions" on public.action_completions;
create policy "Users can update own completions" on public.action_completions for update
  using (exists (select 1 from public.action_pledges where id = pledge_id and user_id = auth.uid()));

drop policy if exists "Users can view own streaks" on public.streaks;
create policy "Users can view own streaks" on public.streaks for select using (auth.uid() = user_id);
drop policy if exists "Users can manage own streaks" on public.streaks;
create policy "Users can manage own streaks" on public.streaks for all using (auth.uid() = user_id);

drop policy if exists "Users can view own notifications" on public.notifications;
create policy "Users can view own notifications" on public.notifications for select using (auth.uid() = user_id);
drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications" on public.notifications for update using (auth.uid() = user_id);

drop policy if exists "Users can view own prefs" on public.notification_preferences;
create policy "Users can view own prefs" on public.notification_preferences for select using (auth.uid() = user_id);
drop policy if exists "Users can manage own prefs" on public.notification_preferences;
create policy "Users can manage own prefs" on public.notification_preferences for all using (auth.uid() = user_id);

-- Function to create profile + defaults on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', ''));

  insert into public.streaks (user_id) values (new.id);

  insert into public.notification_preferences (user_id) values (new.id);

  return new;
end;
$$ language plpgsql security definer;

-- Trigger on auth.users insert
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Indexes for common queries
create index if not exists idx_survey_responses_user on public.survey_responses(user_id);
create index if not exists idx_videos_user on public.videos(user_id);
create index if not exists idx_videos_status on public.videos(status);
create index if not exists idx_action_pledges_user on public.action_pledges(user_id);
create index if not exists idx_action_pledges_video on public.action_pledges(video_id);
create index if not exists idx_action_completions_pledge on public.action_completions(pledge_id);
create index if not exists idx_action_completions_date on public.action_completions(date);
create index if not exists idx_notifications_user on public.notifications(user_id, is_read);

-- Storage bucket for user photos (configure in Supabase dashboard)
-- insert into storage.buckets (id, name, public) values ('user-photos', 'user-photos', false);
-- insert into storage.buckets (id, name, public) values ('generated-videos', 'generated-videos', false);
