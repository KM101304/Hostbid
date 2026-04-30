alter table public.profiles
  add column if not exists stripe_identity_session_id text,
  add column if not exists verification_provider text not null default 'none'
    check (verification_provider in ('none', 'stripe_identity', 'manual'));

create unique index if not exists profiles_stripe_identity_session_id_idx
  on public.profiles (stripe_identity_session_id)
  where stripe_identity_session_id is not null;

create index if not exists profiles_verification_status_idx
  on public.profiles (verification_status, is_verified);
