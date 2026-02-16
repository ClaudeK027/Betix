-- Drop existing policies to avoid conflicts
drop policy if exists "Users can upload their own avatar" on storage.objects;
drop policy if exists "Users can update their own avatar" on storage.objects;
drop policy if exists "Users can delete their own avatar" on storage.objects;
drop policy if exists "Anyone can view avatars" on storage.objects;
drop policy if exists "Allow All Uploads" on storage.objects; -- Remove the debug one if it exists

-- 1. VIEW POLICY (Public)
create policy "Anyone can view avatars"
on storage.objects for select
to public
using ( bucket_id = 'Users' );

-- 2. UPLOAD POLICY (Authenticated Users)
-- We use a simpler text matching approach which is often more reliable than splitting paths
create policy "Users can upload their own avatar"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'Users' and
  name like 'Avatars/' || auth.uid() || '/%'
);

-- 3. UPDATE POLICY
create policy "Users can update their own avatar"
on storage.objects for update
to authenticated
using (
  bucket_id = 'Users' and
  name like 'Avatars/' || auth.uid() || '/%'
)
with check (
  bucket_id = 'Users' and
  name like 'Avatars/' || auth.uid() || '/%'
);

-- 4. DELETE POLICY
create policy "Users can delete their own avatar"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'Users' and
  name like 'Avatars/' || auth.uid() || '/%'
);
