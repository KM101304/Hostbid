alter table public.profiles
  add column if not exists location_city text,
  add column if not exists location_province text,
  add column if not exists location_country text;

alter table public.experiences
  add column if not exists location_city text,
  add column if not exists location_province text,
  add column if not exists location_country text;

update storage.buckets
set
  file_size_limit = 8388608,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'profile-photos';
