create extension if not exists "pgcrypto";

create type experience_status as enum ('open', 'closed', 'completed', 'cancelled');
create type bid_status as enum ('active', 'selected', 'refunded', 'capture_failed');
create type report_status as enum ('open', 'reviewed', 'actioned');
create type moderation_status as enum ('queued', 'reviewing', 'resolved');
create type moderation_priority as enum ('low', 'normal', 'high');

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  age int check (age is null or age >= 18),
  bio text,
  location text,
  avatar_url text,
  photo_urls text[] not null default '{}',
  is_verified boolean not null default false,
  quality_score int not null default 0,
  stripe_customer_id text,
  stripe_connect_account_id text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.experiences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null,
  vibe_summary text,
  location text not null,
  date_window_start timestamptz,
  date_window_end timestamptz,
  budget_min_cents int,
  budget_max_cents int,
  expires_at timestamptz,
  safety_preferences text[] not null default '{}',
  selected_bid_id uuid,
  winner_user_id uuid references public.profiles(id) on delete set null,
  chat_unlocked_at timestamptz,
  status experience_status not null default 'open',
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.bids (
  id uuid primary key default gen_random_uuid(),
  experience_id uuid not null references public.experiences(id) on delete cascade,
  bidder_id uuid not null references public.profiles(id) on delete cascade,
  amount_cents int not null check (amount_cents > 0),
  pitch text not null,
  payment_intent_id text not null unique,
  status bid_status not null default 'active',
  captured_at timestamptz,
  refunded_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.experiences
  add constraint experiences_selected_bid_id_fkey
  foreign key (selected_bid_id) references public.bids(id) on delete set null;

create unique index if not exists bids_one_live_offer_per_bidder
  on public.bids (experience_id, bidder_id)
  where status in ('active', 'selected');

create table if not exists public.threads (
  id uuid primary key default gen_random_uuid(),
  experience_id uuid not null unique references public.experiences(id) on delete cascade,
  poster_id uuid not null references public.profiles(id) on delete cascade,
  bidder_id uuid not null references public.profiles(id) on delete cascade,
  unlocked_at timestamptz not null default timezone('utc'::text, now()),
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.threads(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reported_user_id uuid references public.profiles(id) on delete set null,
  experience_id uuid references public.experiences(id) on delete set null,
  bid_id uuid references public.bids(id) on delete set null,
  reason text not null,
  details text,
  status report_status not null default 'open',
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique (blocker_id, blocked_id)
);

create table if not exists public.moderation_queue (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null unique references public.reports(id) on delete cascade,
  assigned_to uuid references public.profiles(id) on delete set null,
  priority moderation_priority not null default 'normal',
  status moderation_status not null default 'queued',
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists experiences_feed_idx on public.experiences (status, created_at desc);
create index if not exists experiences_open_expiry_idx on public.experiences (status, expires_at, created_at desc);
create index if not exists experiences_location_idx on public.experiences (location, status);
create index if not exists experiences_user_idx on public.experiences (user_id, status);
create index if not exists bids_experience_status_idx on public.bids (experience_id, status, amount_cents desc, created_at desc);
create index if not exists bids_bidder_status_idx on public.bids (bidder_id, status, created_at desc);
create index if not exists threads_participants_idx on public.threads (poster_id, bidder_id, created_at desc);
create index if not exists threads_poster_created_idx on public.threads (poster_id, created_at desc);
create index if not exists threads_bidder_created_idx on public.threads (bidder_id, created_at desc);
create index if not exists messages_thread_created_idx on public.messages (thread_id, created_at asc);
create index if not exists reports_status_idx on public.reports (status, created_at desc);
create index if not exists reports_reporter_created_idx on public.reports (reporter_id, created_at desc);
create index if not exists moderation_queue_status_idx on public.moderation_queue (status, priority, created_at desc);

create trigger profiles_updated_at before update on public.profiles
for each row execute function public.handle_updated_at();

create trigger experiences_updated_at before update on public.experiences
for each row execute function public.handle_updated_at();

create trigger bids_updated_at before update on public.bids
for each row execute function public.handle_updated_at();

create trigger moderation_queue_updated_at before update on public.moderation_queue
for each row execute function public.handle_updated_at();

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.create_profile_for_new_user();

alter table public.profiles enable row level security;
alter table public.experiences enable row level security;
alter table public.bids enable row level security;
alter table public.threads enable row level security;
alter table public.messages enable row level security;
alter table public.reports enable row level security;
alter table public.blocks enable row level security;
alter table public.moderation_queue enable row level security;

create policy "profiles are visible to authenticated users"
on public.profiles for select
to authenticated
using (true);

create policy "users can update own profile"
on public.profiles for all
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "open experiences are visible"
on public.experiences for select
to authenticated
using (
  status = 'open'
  or user_id = auth.uid()
  or winner_user_id = auth.uid()
);

create policy "users can create experiences"
on public.experiences for insert
to authenticated
with check (auth.uid() = user_id);

create policy "owners can update experiences"
on public.experiences for update
to authenticated
using (auth.uid() = user_id);

create policy "owners and bidders can view bids"
on public.bids for select
to authenticated
using (
  bidder_id = auth.uid()
  or exists (
    select 1 from public.experiences
    where experiences.id = bids.experience_id
      and experiences.user_id = auth.uid()
  )
);

create policy "bidders can insert bids"
on public.bids for insert
to authenticated
with check (auth.uid() = bidder_id);

create policy "thread participants can read"
on public.threads for select
to authenticated
using (auth.uid() = poster_id or auth.uid() = bidder_id);

create policy "thread participants can read messages"
on public.messages for select
to authenticated
using (
  exists (
    select 1 from public.threads
    where threads.id = messages.thread_id
      and (threads.poster_id = auth.uid() or threads.bidder_id = auth.uid())
  )
);

create policy "thread participants can send messages"
on public.messages for insert
to authenticated
with check (
  auth.uid() = sender_id
  and exists (
    select 1 from public.threads
    where threads.id = messages.thread_id
      and (threads.poster_id = auth.uid() or threads.bidder_id = auth.uid())
  )
);

create policy "users can submit reports"
on public.reports for insert
to authenticated
with check (auth.uid() = reporter_id);

create policy "reporters can see their own reports"
on public.reports for select
to authenticated
using (auth.uid() = reporter_id);

create policy "users can manage their blocks"
on public.blocks for all
to authenticated
using (auth.uid() = blocker_id)
with check (auth.uid() = blocker_id);
