insert into public.clusters (
  id,
  category,
  lat,
  lng,
  address,
  district,
  zone_key,
  zone_coefficient,
  report_count,
  severity,
  status,
  representative_photo_url
)
values
  (
    '0d6d5947-57ff-45d4-b7fb-8d6b331c5ab1',
    'road',
    43.238949,
    76.889709,
    'пр. Абая, 10',
    'Медеуский район',
    'city_center',
    1.5,
    3,
    13.5,
    'open',
    'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=1200&q=80'
  ),
  (
    'fdce5b2e-a5cf-4f74-b43d-56410d930712',
    'light',
    43.222015,
    76.851248,
    'ул. Толе би, 123',
    'Алмалинский район',
    'residential',
    1.2,
    2,
    6,
    'in_progress',
    'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1200&q=80'
  )
on conflict (id) do nothing;

insert into public.reports (
  id,
  cluster_id,
  user_category,
  description,
  photo_url,
  lat,
  lng,
  address,
  district,
  severity,
  status,
  ai_category,
  ai_confidence,
  ai_tags,
  ai_validation_status,
  ai_needs_review,
  ai_reason,
  ai_raw
)
values
  (
    '4f167307-7a1d-4bb0-bf57-f3fb4f1128ce',
    '0d6d5947-57ff-45d4-b7fb-8d6b331c5ab1',
    'road',
    'Большая яма у остановки.',
    'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=1200&q=80',
    43.238949,
    76.889709,
    'пр. Абая, 10',
    'Медеуский район',
    13.5,
    'open',
    'road',
    0.94,
    '["pothole","road_damage"]'::jsonb,
    'valid',
    false,
    'Detected damaged road surface',
    '{"provider":"seed"}'::jsonb
  ),
  (
    'aee51bcb-3857-4f70-a52b-98c106fe3aa7',
    'fdce5b2e-a5cf-4f74-b43d-56410d930712',
    'light',
    'Фонарь не работает уже несколько дней.',
    'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1200&q=80',
    43.222015,
    76.851248,
    'ул. Толе би, 123',
    'Алмалинский район',
    6,
    'in_progress',
    'light',
    0.88,
    '["street_light","night_visibility"]'::jsonb,
    'valid',
    false,
    'Detected broken street lighting',
    '{"provider":"seed"}'::jsonb
  )
on conflict (id) do nothing;
