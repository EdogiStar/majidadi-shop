CREATE TABLE public.carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (cart_id, product_id)
);

CREATE INDEX cart_items_cart_id_idx ON public.cart_items (cart_id);
CREATE INDEX cart_items_product_id_idx ON public.cart_items (product_id);

CREATE TRIGGER carts_set_updated_at
  BEFORE UPDATE ON public.carts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER cart_items_set_updated_at
  BEFORE UPDATE ON public.cart_items
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY carts_select_own
  ON public.carts
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY carts_insert_own
  ON public.carts
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY carts_update_own
  ON public.carts
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY carts_delete_own
  ON public.carts
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY cart_items_select_own
  ON public.cart_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.carts
      WHERE carts.id = cart_items.cart_id
        AND carts.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY cart_items_insert_own
  ON public.cart_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.carts
      WHERE carts.id = cart_items.cart_id
        AND carts.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY cart_items_update_own
  ON public.cart_items
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.carts
      WHERE carts.id = cart_items.cart_id
        AND carts.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.carts
      WHERE carts.id = cart_items.cart_id
        AND carts.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY cart_items_delete_own
  ON public.cart_items
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.carts
      WHERE carts.id = cart_items.cart_id
        AND carts.user_id = (SELECT auth.uid())
    )
  );

CREATE OR REPLACE FUNCTION public.add_cart_item(
  p_user_id UUID,
  p_product_id UUID,
  p_quantity INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_cart_id UUID;
  v_stock_quantity INTEGER;
BEGIN
  IF p_quantity < 1 OR p_quantity > 100 THEN
    RAISE EXCEPTION 'Cart quantity must be between 1 and 100'
      USING ERRCODE = '22023';
  END IF;

  SELECT stock_quantity INTO v_stock_quantity
  FROM public.products
  WHERE id = p_product_id AND is_active = TRUE
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cart product is unavailable'
      USING ERRCODE = 'P0002';
  END IF;

  IF p_quantity > v_stock_quantity THEN
    RAISE EXCEPTION 'Insufficient product stock'
      USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.carts (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW()
  RETURNING id INTO v_cart_id;

  INSERT INTO public.cart_items (cart_id, product_id, quantity)
  VALUES (v_cart_id, p_product_id, p_quantity)
  ON CONFLICT (cart_id, product_id) DO UPDATE
  SET quantity = public.cart_items.quantity + EXCLUDED.quantity,
      updated_at = NOW()
  WHERE public.cart_items.quantity + EXCLUDED.quantity <= v_stock_quantity;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient product stock'
      USING ERRCODE = 'P0001';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.add_cart_item(UUID, UUID, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.add_cart_item(UUID, UUID, INTEGER) TO service_role;
