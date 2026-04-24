alter table public.bids
  alter column payment_intent_id drop not null;

alter table public.profiles
  add column if not exists verification_status text not null default 'not_started'
    check (verification_status in ('not_started', 'pending', 'verified', 'rejected')),
  add column if not exists verification_selfie_url text,
  add column if not exists verification_submitted_at timestamptz,
  add column if not exists verification_reviewed_at timestamptz;

create table if not exists public.location_shares (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  token text not null unique,
  is_active boolean not null default true,
  expires_at timestamptz not null,
  last_latitude double precision,
  last_longitude double precision,
  last_accuracy_meters double precision,
  last_seen_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists location_shares_user_active_idx
  on public.location_shares (user_id, is_active, expires_at desc);

create index if not exists location_shares_token_idx
  on public.location_shares (token)
  where is_active = true;

drop trigger if exists location_shares_updated_at on public.location_shares;
create trigger location_shares_updated_at before update on public.location_shares
for each row execute function public.handle_updated_at();

alter table public.location_shares enable row level security;

create policy "users can manage own location shares"
on public.location_shares for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "open experiences are visible" on public.experiences;
create policy "open experiences are visible to authenticated users"
on public.experiences for select
to authenticated
using (
  status = 'open'
  or user_id = auth.uid()
  or winner_user_id = auth.uid()
);
