ALTER TABLE public.orders
  ALTER COLUMN user_id DROP NOT NULL,
  ALTER COLUMN delivery_address DROP NOT NULL;

ALTER TABLE public.orders
  ADD COLUMN delivery_method TEXT NOT NULL DEFAULT 'delivery',
  ADD COLUMN delivery_city TEXT,
  ADD COLUMN delivery_state TEXT,
  ADD COLUMN payment_transaction_id BIGINT UNIQUE,
  ADD CONSTRAINT orders_delivery_method_check
    CHECK (delivery_method IN ('delivery', 'pickup'));
