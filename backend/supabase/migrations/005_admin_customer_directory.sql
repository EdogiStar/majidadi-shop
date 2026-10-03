CREATE OR REPLACE FUNCTION public.admin_list_customers(
  p_search TEXT DEFAULT NULL,
  p_role TEXT DEFAULT NULL,
  p_page INTEGER DEFAULT 1,
  p_page_size INTEGER DEFAULT 20
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  result JSONB;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Service role required'
      USING ERRCODE = '42501';
  END IF;

  IF p_page < 1 OR p_page_size < 1 OR p_page_size > 100
    OR (p_role IS NOT NULL AND p_role NOT IN ('customer', 'admin')) THEN
    RAISE EXCEPTION 'Invalid customer directory filters'
      USING ERRCODE = '22023';
  END IF;

  WITH matching_profiles AS (
    SELECT
      profiles.id,
      profiles.full_name,
      users.email,
      profiles.phone,
      profiles.role,
      profiles.created_at,
      profiles.updated_at
    FROM public.profiles AS profiles
    INNER JOIN auth.users AS users ON users.id = profiles.id
    WHERE (p_role IS NULL OR profiles.role = p_role)
      AND (
        p_search IS NULL
        OR profiles.full_name ILIKE '%' || p_search || '%'
        OR profiles.phone ILIKE '%' || p_search || '%'
        OR users.email ILIKE '%' || p_search || '%'
      )
  ),
  paged_profiles AS (
    SELECT *
    FROM matching_profiles
    ORDER BY created_at DESC, id
    OFFSET (p_page - 1) * p_page_size
    LIMIT p_page_size
  )
  SELECT jsonb_build_object(
    'customers',
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', paged_profiles.id,
            'full_name', paged_profiles.full_name,
            'email', paged_profiles.email,
            'phone', paged_profiles.phone,
            'role', paged_profiles.role,
            'created_at', paged_profiles.created_at,
            'updated_at', paged_profiles.updated_at
          )
          ORDER BY paged_profiles.created_at DESC, paged_profiles.id
        )
        FROM paged_profiles
      ),
      '[]'::JSONB
    ),
    'total',
    (SELECT count(*) FROM matching_profiles)
  )
  INTO result;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_customers(TEXT, TEXT, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_customers(TEXT, TEXT, INTEGER, INTEGER) TO service_role;
