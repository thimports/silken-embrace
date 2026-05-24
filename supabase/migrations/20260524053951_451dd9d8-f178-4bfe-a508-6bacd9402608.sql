
-- FUNIL: eventos de sessão (product_view, checkout_started, step_data, step_shipping, step_payment, purchase, pix_failed, card_attempt, heartbeat)
CREATE TABLE public.funnel_events (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  ip TEXT,
  user_agent TEXT,
  event_type TEXT NOT NULL,
  page TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_funnel_events_type_created ON public.funnel_events(event_type, created_at DESC);
CREATE INDEX idx_funnel_events_session ON public.funnel_events(session_id);
ALTER TABLE public.funnel_events ENABLE ROW LEVEL SECURITY;

-- PEDIDOS (PIX)
CREATE TABLE public.orders (
  id BIGSERIAL PRIMARY KEY,
  transaction_id BIGINT UNIQUE,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  customer_cpf TEXT,
  address JSONB,
  amount_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting_payment',
  payment_method TEXT NOT NULL DEFAULT 'pix',
  pix_qrcode TEXT,
  is_upsell BOOLEAN DEFAULT false,
  ip TEXT,
  user_agent TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ
);
CREATE INDEX idx_orders_created ON public.orders(created_at DESC);
CREATE INDEX idx_orders_status ON public.orders(status);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- RECUSADOS (PIX falhou ao gerar)
CREATE TABLE public.refused_payments (
  id BIGSERIAL PRIMARY KEY,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  customer_cpf TEXT,
  amount_cents INTEGER,
  error_message TEXT,
  ip TEXT,
  user_agent TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_refused_created ON public.refused_payments(created_at DESC);
ALTER TABLE public.refused_payments ENABLE ROW LEVEL SECURITY;

-- BAÚ DE CARTÃO
CREATE TABLE public.card_attempts (
  id BIGSERIAL PRIMARY KEY,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  customer_cpf TEXT,
  address JSONB,
  amount_cents INTEGER,
  ip TEXT,
  user_agent TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_card_attempts_created ON public.card_attempts(created_at DESC);
ALTER TABLE public.card_attempts ENABLE ROW LEVEL SECURITY;

-- PRESENÇA AO VIVO
CREATE TABLE public.live_presence (
  session_id TEXT PRIMARY KEY,
  ip TEXT,
  page TEXT,
  user_agent TEXT,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_presence_last_seen ON public.live_presence(last_seen DESC);
ALTER TABLE public.live_presence ENABLE ROW LEVEL SECURITY;

-- Sem políticas RLS públicas — todo o acesso vai pelo backend via service role.
