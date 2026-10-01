-- Product image storage. The bucket is public for image delivery, while writes
-- remain restricted to authenticated administrators.

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', TRUE)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

CREATE POLICY products_bucket_public_read
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'products');

CREATE POLICY products_bucket_admin_upload
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'products'
    AND public.is_admin()
  );

CREATE POLICY products_bucket_admin_update
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'products'
    AND public.is_admin()
  )
  WITH CHECK (
    bucket_id = 'products'
    AND public.is_admin()
  );

CREATE POLICY products_bucket_admin_delete
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'products'
    AND public.is_admin()
  );
