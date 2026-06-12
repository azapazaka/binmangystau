create table if not exists public.smart_bin_live_state (
  id text primary key check (id = 'smart-bin-live'),
  payload jsonb not null,
  read_at timestamptz,
  updated_at timestamptz not null default timezone('utc', now()),
  last_parsed_format text check (
    last_parsed_format is null
    or last_parsed_format in ('json', 'sensor_log')
  )
);

alter table public.smart_bin_live_state enable row level security;

comment on table public.smart_bin_live_state is
  'Stores the latest uploaded smart-bin sensor snapshot for the deployed admin waste page.';
