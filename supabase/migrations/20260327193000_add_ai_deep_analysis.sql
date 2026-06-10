alter table public.reports
  add column if not exists ai_visual_severity text
    check (ai_visual_severity in ('low', 'medium', 'high'));

alter table public.reports
  add column if not exists ai_deep_analysis jsonb;

alter table public.reports
  add column if not exists ai_deep_analyzed_at timestamptz;
