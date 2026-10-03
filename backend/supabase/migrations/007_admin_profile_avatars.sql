ALTER TABLE public.profiles
  ADD COLUMN avatar_url TEXT;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-avatars',
  'profile-avatars',
  TRUE,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']::TEXT[]
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY profile_avatars_public_read
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'profile-avatars');

CREATE POLICY profile_avatars_owner_insert
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile-avatars'
    AND name = 'profiles/' || (SELECT auth.uid())::TEXT || '/avatar'
  );

CREATE POLICY profile_avatars_owner_update
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'profile-avatars'
    AND name = 'profiles/' || (SELECT auth.uid())::TEXT || '/avatar'
  )
  WITH CHECK (
    bucket_id = 'profile-avatars'
    AND name = 'profiles/' || (SELECT auth.uid())::TEXT || '/avatar'
  );

CREATE POLICY profile_avatars_owner_delete
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'profile-avatars'
    AND name = 'profiles/' || (SELECT auth.uid())::TEXT || '/avatar'
  );
