alter table public.reports
add column if not exists submitted_by text;
