CREATE OR REPLACE FUNCTION public.admin_get_overview_metrics()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  result JSONB;
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' THEN
    RAISE EXCEPTION 'Service role required'
      USING ERRCODE = '42501';
  END IF;

  SELECT jsonb_build_object(
    'totalRevenue',
    COALESCE(SUM(total_amount) FILTER (
      WHERE payment_status = 'paid' AND status <> 'cancelled'
    ), 0),
    'paidOrderCount',
    COUNT(*) FILTER (
      WHERE payment_status = 'paid' AND status <> 'cancelled'
    ),
    'orders',
    jsonb_build_object(
      'total', COUNT(*),
      'pending', COUNT(*) FILTER (WHERE status = 'pending'),
      'processing', COUNT(*) FILTER (WHERE status = 'processing'),
      'shipped', COUNT(*) FILTER (WHERE status = 'shipped'),
      'delivered', COUNT(*) FILTER (WHERE status = 'delivered'),
      'cancelled', COUNT(*) FILTER (WHERE status = 'cancelled')
    )
  )
  INTO result
  FROM public.orders;

  result := result || jsonb_build_object(
    'products',
    (
      SELECT jsonb_build_object(
        'total', COUNT(*),
        'active', COUNT(*) FILTER (WHERE is_active),
        'inactive', COUNT(*) FILTER (WHERE NOT is_active),
        'lowStock', COUNT(*) FILTER (WHERE stock_quantity <= 5)
      )
      FROM public.products
    ),
    'registeredCustomers',
    (
      SELECT COUNT(*)
      FROM public.profiles
      WHERE role = 'customer'
    ),
    'recentOrders',
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', recent.id,
            'orderNumber', recent.order_number,
            'customerName', CASE WHEN recent.user_id IS NULL THEN 'Guest' ELSE recent.customer_name END,
            'customerType', CASE WHEN recent.user_id IS NULL THEN 'guest' ELSE 'registered' END,
            'totalAmount', recent.total_amount,
            'status', recent.status,
            'paymentStatus', recent.payment_status,
            'createdAt', recent.created_at
          )
          ORDER BY recent.created_at DESC
        )
        FROM (
          SELECT id, order_number, user_id, customer_name, total_amount, status, payment_status, created_at
          FROM public.orders
          ORDER BY created_at DESC
          LIMIT 5
        ) AS recent
      ),
      '[]'::JSONB
    )
  );

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_get_overview_metrics() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_overview_metrics() TO service_role;
