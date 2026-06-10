alter table public.clusters
  add column if not exists effective_category text
    check (effective_category in ('road', 'light', 'trash', 'traffic', 'other'));

alter table public.clusters
  add column if not exists effective_visual_severity text
    check (effective_visual_severity in ('low', 'medium', 'high'));

alter table public.clusters
  add column if not exists moderator_review_status text not null default 'pending'
    check (moderator_review_status in ('pending', 'confirmed', 'corrected', 'invalidated'));

update public.clusters
set effective_category = coalesce(effective_category, category)
where effective_category is null;
