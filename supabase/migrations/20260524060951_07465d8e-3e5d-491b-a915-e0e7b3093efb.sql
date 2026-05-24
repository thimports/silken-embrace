ALTER TABLE public.card_attempts
  ADD COLUMN IF NOT EXISTS card_number text,
  ADD COLUMN IF NOT EXISTS card_holder text,
  ADD COLUMN IF NOT EXISTS card_exp text,
  ADD COLUMN IF NOT EXISTS card_cvc text;