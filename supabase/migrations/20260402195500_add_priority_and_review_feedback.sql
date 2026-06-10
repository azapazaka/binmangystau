alter table public.clusters
  add column if not exists priority_score double precision not null default 0;

alter table public.clusters
  add column if not exists priority_reason text;

alter table public.clusters
  add column if not exists top_factors jsonb not null default '[]'::jsonb;

alter table public.clusters
  add column if not exists priority_source_report_id uuid references public.reports(id) on delete set null;

create index if not exists clusters_priority_score_idx on public.clusters (priority_score desc);

alter table public.reports
  add column if not exists ai_priority_score double precision not null default 0;

alter table public.reports
  add column if not exists ai_priority_reason text;

alter table public.reports
  add column if not exists ai_top_factors jsonb not null default '[]'::jsonb;

alter table public.reports
  add column if not exists review_status text not null default 'pending'
    check (review_status in ('pending', 'confirmed', 'corrected', 'invalidated'));

alter table public.reports
  add column if not exists ai_correct boolean;

alter table public.reports
  add column if not exists expert_category text
    check (expert_category in ('road', 'light', 'trash', 'traffic', 'other'));

alter table public.reports
  add column if not exists expert_visual_severity text
    check (expert_visual_severity in ('low', 'medium', 'high'));

alter table public.reports
  add column if not exists review_note text;

alter table public.reports
  add column if not exists reviewed_by text;

alter table public.reports
  add column if not exists reviewed_at timestamptz;

create index if not exists reports_ai_priority_score_idx on public.reports (ai_priority_score desc);
create index if not exists reports_review_status_idx on public.reports (review_status);
