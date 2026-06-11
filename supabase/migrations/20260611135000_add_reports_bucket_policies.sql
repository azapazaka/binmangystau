drop policy if exists "Report images are publicly readable" on storage.objects;
create policy "Report images are publicly readable"
  on storage.objects
  for select
  using (bucket_id = 'reports');

drop policy if exists "Authenticated users can upload report images" on storage.objects;
create policy "Authenticated users can upload report images"
  on storage.objects
  for insert
  with check (
    bucket_id = 'reports'
    and auth.role() = 'authenticated'
  );
