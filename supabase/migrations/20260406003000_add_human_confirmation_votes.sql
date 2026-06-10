create table if not exists public.report_human_votes (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  verdict text not null check (verdict in ('real', 'fake')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (report_id, user_id)
);

create index if not exists report_human_votes_report_id_idx
  on public.report_human_votes (report_id);

create index if not exists report_human_votes_user_id_idx
  on public.report_human_votes (user_id);

alter table public.reports
  add column if not exists human_real_votes integer not null default 0;

alter table public.reports
  add column if not exists human_fake_votes integer not null default 0;

alter table public.reports
  add column if not exists human_votes_total integer not null default 0;

alter table public.reports
  add column if not exists human_confirmation_status text not null default 'pending'
    check (human_confirmation_status in ('pending', 'confirmed_real', 'confirmed_fake', 'disputed'));

alter table public.reports
  add column if not exists human_last_voted_at timestamptz;

drop trigger if exists set_report_human_votes_updated_at on public.report_human_votes;
create trigger set_report_human_votes_updated_at
before update on public.report_human_votes
for each row execute function public.set_updated_at();

alter table public.report_human_votes enable row level security;

create policy "Authenticated users can read human votes"
  on public.report_human_votes
  for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can insert own human votes"
  on public.report_human_votes
  for insert
  with check (auth.role() = 'authenticated' and auth.uid() = user_id);

create policy "Authenticated users can update own human votes"
  on public.report_human_votes
  for update
  using (auth.role() = 'authenticated' and auth.uid() = user_id)
  with check (auth.role() = 'authenticated' and auth.uid() = user_id);
