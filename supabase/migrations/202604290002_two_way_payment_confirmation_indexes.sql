drop index if exists bids_one_live_offer_per_bidder;

create unique index if not exists bids_one_live_offer_per_bidder
  on public.bids (experience_id, bidder_id)
  where status in ('pending_payment', 'active', 'host_accepted', 'selected');

create index if not exists bids_payment_intent_idx
  on public.bids (payment_intent_id)
  where payment_intent_id is not null;

create index if not exists bids_confirmation_status_idx
  on public.bids (status, host_accepted_at, bidder_confirmed_at);
