alter table public.clusters
add column if not exists ai_validation_status text not null default 'unavailable'
  check (ai_validation_status in ('valid', 'invalid', 'uncertain', 'unavailable'));
