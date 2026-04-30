alter type bid_status add value if not exists 'pending_payment';
alter type bid_status add value if not exists 'host_accepted';

alter table public.bids
  add column if not exists host_accepted_at timestamptz,
  add column if not exists bidder_confirmed_at timestamptz;
