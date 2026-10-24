-- 0006_storage.sql
-- Storage bucket and Row Level Security policies for startup images
-- Self-contained and re-runnable

-- 1. Create or update public-read bucket 'startup-images' with 2MB limit and allowed MIME types
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'startup-images',
  'startup-images',
  true,
  2097152, -- 2 MB in bytes
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;


-- 3. Public Read: Anyone can view images in 'startup-images'
DROP POLICY IF EXISTS "startup_images_public_select" ON storage.objects;
CREATE POLICY "startup_images_public_select" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'startup-images');

-- 4. Authenticated Insert:
-- - Must be verified email (is_verified())
-- - First path segment must match auth.uid()
-- - Where metadata is provided, reject wrong mime and oversize at database level
DROP POLICY IF EXISTS "startup_images_auth_insert" ON storage.objects;
CREATE POLICY "startup_images_auth_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'startup-images'
    AND public.is_verified()
    AND split_part(name, '/', 1) = auth.uid()::text
    AND (
      metadata IS NULL
      OR (
        (metadata->>'mimetype' IS NULL OR metadata->>'mimetype' IN ('image/png', 'image/jpeg', 'image/webp'))
        AND (metadata->>'size' IS NULL OR (metadata->>'size')::bigint <= 2097152)
      )
    )
  );

-- 5. Authenticated Update:
-- - Must be verified email
-- - First path segment must match auth.uid()
DROP POLICY IF EXISTS "startup_images_auth_update" ON storage.objects;
CREATE POLICY "startup_images_auth_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'startup-images'
    AND public.is_verified()
    AND split_part(name, '/', 1) = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'startup-images'
    AND public.is_verified()
    AND split_part(name, '/', 1) = auth.uid()::text
  );

-- 6. Authenticated Delete:
-- - Can only delete own objects (first path segment = auth.uid())
DROP POLICY IF EXISTS "startup_images_auth_delete" ON storage.objects;
CREATE POLICY "startup_images_auth_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'startup-images'
    AND split_part(name, '/', 1) = auth.uid()::text
  );
