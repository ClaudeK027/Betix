-- Enable RLS on objects table (if not already enabled)
alter table storage.objects enable row level security;

-- Create policy to allow authenticated users to upload their own avatar
create policy "Users can upload their own avatar"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'Users' and
  (storage.foldername(name))[1] = 'Avatars' and
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Create policy to allow authenticated users to update their own avatar
create policy "Users can update their own avatar"
on storage.objects for update
to authenticated
using (
  bucket_id = 'Users' and
  (storage.foldername(name))[1] = 'Avatars' and
  (storage.foldername(name))[2] = auth.uid()::text
)
with check (
  bucket_id = 'Users' and
  (storage.foldername(name))[1] = 'Avatars' and
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Create policy to allow everyone to view avatars (public read)
create policy "Anyone can view avatars"
on storage.objects for select
to public
using ( bucket_id = 'Users' );

-- Create policy to allow users to delete their own avatar
create policy "Users can delete their own avatar"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'Users' and
  (storage.foldername(name))[1] = 'Avatars' and
  (storage.foldername(name))[2] = auth.uid()::text
);
