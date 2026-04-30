alter table public.profiles
  add column if not exists location_place_id text,
  add column if not exists location_latitude double precision,
  add column if not exists location_longitude double precision,
  add column if not exists location_city text,
  add column if not exists location_province text,
  add column if not exists location_country text;

alter table public.experiences
  add column if not exists location_place_id text,
  add column if not exists location_latitude double precision,
  add column if not exists location_longitude double precision,
  add column if not exists location_city text,
  add column if not exists location_province text,
  add column if not exists location_country text;

create index if not exists profiles_location_place_id_idx
  on public.profiles (location_place_id)
  where location_place_id is not null;

create index if not exists experiences_location_place_id_idx
  on public.experiences (location_place_id)
  where location_place_id is not null;

update storage.buckets
set
  file_size_limit = 8388608,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'profile-photos';
