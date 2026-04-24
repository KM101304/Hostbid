alter table public.profiles
  add column if not exists stripe_onboarding_complete boolean not null default false,
  add column if not exists stripe_charges_enabled boolean not null default false,
  add column if not exists stripe_payouts_enabled boolean not null default false,
  add column if not exists stripe_requirements_currently_due text[] not null default '{}',
  add column if not exists stripe_requirements_disabled_reason text;
