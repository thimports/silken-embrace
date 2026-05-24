ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS utm jsonb,
  ADD COLUMN IF NOT EXISTS products jsonb,
  ADD COLUMN IF NOT EXISTS created_at_utc text;