
CREATE TABLE public.pix_meta_ads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  amount_cents INTEGER NOT NULL DEFAULT 7591,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available','in_use','paid','expired')),
  position INTEGER NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  assigned_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  customer_cpf TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX pix_meta_ads_status_position_idx ON public.pix_meta_ads (status, position);

GRANT ALL ON public.pix_meta_ads TO service_role;

ALTER TABLE public.pix_meta_ads ENABLE ROW LEVEL SECURITY;

-- Sem políticas para anon/authenticated: acesso somente via service_role nas server functions.

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_pix_meta_ads_updated_at
BEFORE UPDATE ON public.pix_meta_ads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed inicial: 3 PIX pré-gerados (R$ 75,91, expiram em 7 dias)
INSERT INTO public.pix_meta_ads (code, amount_cents, status, position, expires_at) VALUES
  ('00020101021226870014br.gov.bcb.pix2565qrcode.dlocal.com/qr/25021356/v1/01469f67596941aa957ea4bcb6bc3d135204000053039865802BR5906DLOCAL6009SAO PAULO62070503***6304B8F0', 7591, 'available', 1, now() + interval '7 days'),
  ('00020101021226870014br.gov.bcb.pix2565qrcode.dlocal.com/qr/25021356/v1/4bca67d1c6b042e18729bc0796e13c795204000053039865802BR5906DLOCAL6009SAO PAULO62070503***63042BE4', 7591, 'available', 2, now() + interval '7 days'),
  ('00020101021226870014br.gov.bcb.pix2565qrcode.dlocal.com/qr/25021356/v1/bbad1a12982644deb39cd9639084daf85204000053039865802BR5906DLOCAL6009SAO PAULO62070503***6304C004', 7591, 'available', 3, now() + interval '7 days');
