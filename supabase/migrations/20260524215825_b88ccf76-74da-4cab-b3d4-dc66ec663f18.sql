-- Migrate orders.transaction_id from bigint to text to support BuyPix UUIDs
ALTER TABLE public.orders
  ALTER COLUMN transaction_id TYPE text USING transaction_id::text;