create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key,
  email text unique not null,
  full_name text,
  role text not null default 'operator' check (role in ('operator', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.clusters (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('road', 'light', 'trash', 'traffic', 'other')),
  lat double precision not null,
  lng double precision not null,
  address text,
  district text,
  zone_key text,
  zone_coefficient double precision not null default 1,
  report_count integer not null default 1,
  severity double precision not null default 0,
  status text not null default 'open' check (status in ('open', 'in_progress', 'closed')),
  representative_photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists clusters_category_idx on public.clusters (category);
create index if not exists clusters_status_idx on public.clusters (status);
create index if not exists clusters_created_at_idx on public.clusters (created_at desc);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  cluster_id uuid references public.clusters(id) on delete set null,
  user_category text not null check (user_category in ('road', 'light', 'trash', 'traffic', 'other')),
  description text,
  photo_url text not null,
  lat double precision not null,
  lng double precision not null,
  address text,
  district text,
  severity double precision not null default 0,
  status text not null default 'open' check (status in ('open', 'in_progress', 'closed')),
  ai_category text check (ai_category in ('road', 'light', 'trash', 'traffic', 'other')),
  ai_confidence double precision,
  ai_tags jsonb not null default '[]'::jsonb,
  ai_validation_status text not null default 'unavailable'
    check (ai_validation_status in ('valid', 'invalid', 'uncertain', 'unavailable')),
  ai_needs_review boolean not null default false,
  ai_reason text,
  ai_raw jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reports_cluster_id_idx on public.reports (cluster_id);
create index if not exists reports_user_category_idx on public.reports (user_category);
create index if not exists reports_created_at_idx on public.reports (created_at desc);
create index if not exists reports_status_idx on public.reports (status);
create index if not exists reports_ai_validation_status_idx on public.reports (ai_validation_status);

create table if not exists public.status_history (
  id uuid primary key default gen_random_uuid(),
  cluster_id uuid not null references public.clusters(id) on delete cascade,
  old_status text check (old_status in ('open', 'in_progress', 'closed')),
  new_status text not null check (new_status in ('open', 'in_progress', 'closed')),
  changed_by uuid references public.users(id) on delete set null,
  changed_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_clusters_updated_at on public.clusters;
create trigger set_clusters_updated_at
before update on public.clusters
for each row execute function public.set_updated_at();

drop trigger if exists set_reports_updated_at on public.reports;
create trigger set_reports_updated_at
before update on public.reports
for each row execute function public.set_updated_at();

alter table public.reports enable row level security;
alter table public.clusters enable row level security;
alter table public.status_history enable row level security;
alter table public.users enable row level security;

create policy "Reports are publicly readable"
  on public.reports
  for select
  using (true);

create policy "Anonymous users can create reports"
  on public.reports
  for insert
  with check (true);

create policy "Authenticated users can update reports"
  on public.reports
  for update
  using (auth.role() = 'authenticated');

create policy "Clusters are publicly readable"
  on public.clusters
  for select
  using (true);

create policy "Authenticated users can manage clusters"
  on public.clusters
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can read status history"
  on public.status_history
  for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can insert status history"
  on public.status_history
  for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can read users"
  on public.users
  for select
  using (auth.role() = 'authenticated');
