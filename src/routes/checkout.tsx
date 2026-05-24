import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, ChevronLeft, Lock, Shield, Truck, CreditCard, QrCode, RotateCcw, Loader2, AlertCircle } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { createPixTransaction, createCardTransaction } from "@/lib/primecash.functions";
import { sendFbEvent } from "@/lib/fb-capi.functions";
import { sendUtmifyOrder } from "@/lib/utmify.functions";
import { recordOrder, recordRefused, recordCardAttempt } from "@/lib/tracking.functions";
import { track, getSessionId } from "@/hooks/use-tracking";
import { fbTrack, getFbp, getFbc, newEventId } from "@/lib/fbpixel";
import { getUtms } from "@/lib/utm";
import { PixPayment } from "@/components/checkout/PixPayment";
import { PaymentConfirmed } from "@/components/checkout/PaymentConfirmed";
import hero from "@/assets/hero.webp";
import pixLogo from "@/assets/pix-logo.png";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout · Lumière" },
      { name: "description", content: "Finalize sua compra com segurança." },
    ],
  }),
  component: CheckoutPage,
});

const STEPS = ["Dados", "Entrega", "Pagamento"] as const;

function mask(v: string, m: (s: string) => string) { return m(v); }
const onlyDigits = (s: string) => s.replace(/\D/g, "");
const maskPhone = (s: string) => {
  const d = onlyDigits(s).slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{0,2})(\d{0,4})(\d{0,4}).*/, (_, a, b, c) => [a && `(${a}`, a && a.length === 2 ? ") " : "", b, c && `-${c}`].filter(Boolean).join(""));
  return d.replace(/(\d{2})(\d{5})(\d{0,4}).*/, "($1) $2-$3");
};
const maskCpf = (s: string) => onlyDigits(s).slice(0, 11).replace(/(\d{3})(\d{0,3})(\d{0,3})(\d{0,2}).*/, (_, a, b, c, d) => [a, b && `.${b}`, c && `.${c}`, d && `-${d}`].filter(Boolean).join(""));
const maskCep = (s: string) => onlyDigits(s).slice(0, 8).replace(/(\d{5})(\d{0,3}).*/, (_, a, b) => b ? `${a}-${b}` : a);
const maskCard = (s: string) => onlyDigits(s).slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
const maskExp = (s: string) => onlyDigits(s).slice(0, 4).replace(/(\d{2})(\d{0,2}).*/, (_, a, b) => b ? `${a}/${b}` : a);

function Field({ label, ...p }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block">
      <span className="text-[11px] tracking-luxe uppercase text-muted-foreground">{label}</span>
      <input
        {...p}
        className="mt-2 w-full bg-background border border-border focus:border-foreground outline-none px-4 py-3.5 text-[15px] transition-colors"
      />
    </label>
  );
}

function CheckoutPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [pay, setPay] = useState<"pix" | "card">("pix");
  const [cepLoading, setCepLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pixTx, setPixTx] = useState<{ id: number; amount: number; pix: { qrcode: string; expirationDate?: string } } | null>(null);
  const [cardResult, setCardResult] = useState<{ status: string; refusedReason?: any } | null>(null);
  const [paid, setPaid] = useState(false);
  const [showPix, setShowPix] = useState(false);
  const [prewarming, setPrewarming] = useState(false);
  const finalizedRef = useRef(false);
  const lastSigRef = useRef<string>("");
  const firedTxRef = useRef<Set<number>>(new Set());
  const pixPromiseRef = useRef<Promise<{ id: number; amount: number; pix: { qrcode: string; expirationDate?: string } } | null> | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [step]);

  const SHIPPING = [
    { id: "free", label: "Frete Grátis", speed: "7-8 dias úteis", price: 0 },
    { id: "express", label: "Loggi Express", speed: "3-4 dias úteis", price: 15 },
  ] as const;
  const [shippingId, setShippingId] = useState<string>("free");
  const shipping = SHIPPING.find((s) => s.id === shippingId)?.price ?? 0;

  const pixFn = useServerFn(createPixTransaction);
  const cardFn = useServerFn(createCardTransaction);
  const capiFn = useServerFn(sendFbEvent);
  const utmifyFn = useServerFn(sendUtmifyOrder);
  const recordOrderFn = useServerFn(recordOrder);
  const recordRefusedFn = useServerFn(recordRefused);
  const recordCardFn = useServerFn(recordCardAttempt);
  const [orderCtx, setOrderCtx] = useState<{ orderId: string; createdAt: string } | null>(null);

  // Fire InitiateCheckout once on mount
  useEffect(() => {
    track("checkout_started");
    const eventId = newEventId();
    fbTrack("InitiateCheckout", { value: 79.9, currency: "BRL", content_ids: ["lumiere-meia-2pk"], content_type: "product" }, { eventID: eventId });
    capiFn({ data: {
      eventName: "InitiateCheckout",
      eventId,
      eventSourceUrl: typeof window !== "undefined" ? window.location.href : undefined,
      value: 79.9,
      currency: "BRL",
      fbp: getFbp(),
      fbc: getFbc(),
    }}).catch(() => {});
  }, [capiFn]);
  const [f, setF] = useState({
    name: "", email: "", phone: "", cpf: "",
    cep: "", street: "", number: "", complement: "", city: "", state: "",
    cardNum: "", cardName: "", cardExp: "", cardCvc: "", installments: "1",
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const next = () => {
    setStep((s) => {
      const ns = Math.min(2, s + 1);
      if (ns === 1) track("step_data");
      if (ns === 2) { track("step_shipping"); track("step_payment"); }
      return ns;
    });
  };
  const back = () => setStep((s) => Math.max(0, s - 1));

  const subtotal = 79.9;
  const discount = pay === "pix" ? subtotal * 0.05 : 0;
  const total = subtotal + shipping - discount;
  const PRODUCT_TITLE = "2 Meia-Calça Forrada Térmica Translúcida · Lã Peluciada Plus";
  const PRODUCT_META = "Cor: Nude · Tam. Único · Qtd: 1";

  const buildCustomer = () => ({ name: f.name, email: f.email, phone: f.phone, document: f.cpf });
  const buildAddress = () => ({
    street: f.street, streetNumber: f.number, complement: f.complement,
    zipCode: f.cep, city: f.city, state: f.state,
  });
  const buildItems = () => ([{ title: PRODUCT_TITLE, unitPrice: Math.round(subtotal * 100), quantity: 1, tangible: true }]);

  const utcNow = () => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
  };

  const buildUtmifyOrder = (opts: {
    orderId: string;
    createdAt: string;
    status: "waiting_payment" | "paid" | "refused" | "refunded" | "chargedback";
    paymentMethod: "pix" | "credit_card";
    approvedDate: string | null;
    refundedAt?: string | null;
  }) => {
    const totalCents = Math.round(total * 100);
    return {
      orderId: opts.orderId,
      paymentMethod: opts.paymentMethod,
      status: opts.status,
      createdAt: opts.createdAt,
      approvedDate: opts.approvedDate,
      refundedAt: opts.refundedAt ?? null,
      customer: {
        name: f.name,
        email: f.email,
        phone: onlyDigits(f.phone) || null,
        document: onlyDigits(f.cpf) || null,
        country: "BR",
      },
      products: [{
        id: "lumiere-meia-2pk",
        name: PRODUCT_TITLE,
        planId: null,
        planName: null,
        quantity: 1,
        priceInCents: Math.round(subtotal * 100),
      }],
      trackingParameters: getUtms(),
      commission: {
        totalPriceInCents: totalCents,
        gatewayFeeInCents: 0,
        userCommissionInCents: totalCents,
        currency: "BRL" as const,
      },
    };
  };

  // Retry helper with exponential backoff
  const withRetry = async <T,>(fn: () => Promise<T>, attempts = 3, baseMs = 700): Promise<T> => {
    let lastErr: any;
    for (let i = 0; i < attempts; i++) {
      try { return await fn(); } catch (e) {
        lastErr = e;
        if (i < attempts - 1) await new Promise((r) => setTimeout(r, baseMs * Math.pow(2, i)));
      }
    }
    throw lastErr;
  };

  // Signature of current inputs — invalidates prewarmed PIX if user edits
  const pixSig = useMemo(() => JSON.stringify({
    amt: Math.round(total * 100),
    n: f.name.trim(), em: f.email.trim(),
    cpf: onlyDigits(f.cpf), ph: onlyDigits(f.phone),
    cep: onlyDigits(f.cep), st: f.street.trim(), num: f.number.trim(),
    ct: f.city.trim(), uf: f.state.trim(),
  }), [total, f.name, f.email, f.cpf, f.phone, f.cep, f.street, f.number, f.city, f.state]);

  // Background pre-generation of PIX while user fills the address
  useEffect(() => {
    if (finalizedRef.current || pay !== "pix") return;
    const ready = f.name && f.email && f.cpf.replace(/\D/g, "").length >= 11
      && f.phone.replace(/\D/g, "").length >= 10
      && f.cep && f.street && f.number && f.city && f.state;
    if (!ready) return;
    if (pixTx && lastSigRef.current === pixSig) return;
    if (pixTx && lastSigRef.current !== pixSig) setPixTx(null);
    if (prewarming) return;

    let cancelled = false;
    const t = setTimeout(() => {
      setPrewarming(true);
      const p = withRetry(() => pixFn({ data: {
        amount: Math.round(total * 100),
        customer: buildCustomer(),
        items: buildItems(),
        address: buildAddress(),
      }}), 3, 600)
        .then((tx) => {
          if (cancelled) return null;
          if (tx?.pix?.qrcode) {
            const out = { id: tx.id, amount: tx.amount, pix: tx.pix };
            setPixTx(out);
            lastSigRef.current = pixSig;
            // Purchase é disparado só quando o cliente clicar em finalizar (handleFinish)
            return out;
          }
          return null;
        })
        .catch(() => null)
        .finally(() => { if (!cancelled) setPrewarming(false); });
      pixPromiseRef.current = p;
    }, 700);

    return () => { cancelled = true; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pixSig, pay]);

  const firePixTracking = (tx: { id: number; amount: number; pix: { qrcode: string } }) => {
    if (firedTxRef.current.has(tx.id)) return;
    firedTxRef.current.add(tx.id);
    const createdAt = utcNow();
    const orderId = String(tx.id);
    setOrderCtx({ orderId, createdAt });

    track("purchase", { orderId, amount: tx.amount });
    recordOrderFn({ data: {
      transactionId: tx.id,
      customer: { name: f.name, email: f.email, phone: f.phone, cpf: f.cpf },
      address: buildAddress(),
      amountCents: tx.amount,
      pixQrcode: tx.pix.qrcode,
      isUpsell: false,
      sessionId: getSessionId(),
    }}).catch(() => {});

    const eventId = `purchase-pix-${tx.id}`;
    fbTrack("Purchase", { value: total, currency: "BRL", content_ids: ["lumiere-meia-2pk"], content_type: "product", order_id: orderId }, { eventID: eventId });
    capiFn({ data: {
      eventName: "Purchase",
      eventId,
      eventSourceUrl: typeof window !== "undefined" ? window.location.href : undefined,
      value: total,
      currency: "BRL",
      fbp: getFbp(),
      fbc: getFbc(),
      user: { email: f.email, phone: f.phone, name: f.name, cpf: f.cpf, city: f.city, state: f.state, zip: f.cep },
      customData: { order_id: orderId, payment_method: "pix" },
    }}).catch(() => {});

    utmifyFn({ data: buildUtmifyOrder({
      orderId, createdAt, status: "waiting_payment", paymentMethod: "pix",
      approvedDate: null,
    }) }).catch(() => {});
  };

  const handleFinish = async () => {
    setError(null);
    if (!f.name || !f.email || !f.cpf || !f.phone) {
      setStep(0); setError("Preencha seus dados antes de pagar."); return;
    }
    if (!f.cep || !f.street || !f.number || !f.city || !f.state) {
      setStep(1); setError("Preencha o endereço de entrega."); return;
    }
    setSubmitting(true);
    try {
      if (pay === "pix") {
        // 1) Reuse pre-warmed PIX if signature still matches
        let tx = (pixTx && lastSigRef.current === pixSig) ? pixTx : null;
        // 2) Otherwise, wait for in-flight prewarm
        if (!tx && pixPromiseRef.current) {
          const pending = await pixPromiseRef.current.catch(() => null);
          if (pending && lastSigRef.current === pixSig) tx = pending;
        }
        // 3) Last resort: generate now with retry
        if (!tx) {
          const fresh = await withRetry(() => pixFn({ data: {
            amount: Math.round(total * 100),
            customer: buildCustomer(),
            items: buildItems(),
            address: buildAddress(),
          }}), 3, 600);
          if (!fresh?.pix?.qrcode) throw new Error("Não recebemos o código PIX. Tente novamente.");
          tx = { id: fresh.id, amount: fresh.amount, pix: fresh.pix };
          setPixTx(tx);
          lastSigRef.current = pixSig;
        }
        finalizedRef.current = true;
        setShowPix(true);
        firePixTracking(tx);
      } else {
        // Cartão: NÃO processa — salva tentativa no baú e instrui usar PIX.
        track("card_attempt", { amount: Math.round(total * 100) });
        await recordCardFn({ data: {
          customer: { name: f.name, email: f.email, phone: f.phone, cpf: f.cpf },
          address: buildAddress(),
          amountCents: Math.round(total * 100),
          sessionId: getSessionId(),
        }}).catch(() => {});
        setCardResult({ status: "pending_review" });
        setError("Pagamento por cartão em análise. Para liberação imediata, use o PIX.");
        setPay("pix");
      }
    } catch (e: any) {
      const msg = e?.message || "Erro ao processar pagamento. Tente novamente.";
      setError(msg);
      if (pay === "pix") {
        track("pix_failed", { error: msg });
        recordRefusedFn({ data: {
          customer: { name: f.name, email: f.email, phone: f.phone, cpf: f.cpf },
          amountCents: Math.round(total * 100),
          errorMessage: msg,
          sessionId: getSessionId(),
        }}).catch(() => {});
      }
    } finally {
      setSubmitting(false);
    }
  };

  const lookupCep = async (rawCep: string) => {
    const digits = onlyDigits(rawCep);
    if (digits.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setF((prev) => ({
          ...prev,
          street: data.logradouro || prev.street,
          complement: prev.complement || data.complemento || "",
          city: data.localidade || prev.city,
          state: data.uf || prev.state,
        }));
      }
    } catch {
      // ignore — usuário pode preencher manualmente
    } finally {
      setCepLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      {/* slim header */}
      <header className="border-b border-border bg-background">
        <div className="mx-auto max-w-[1280px] px-4 md:px-10 h-14 md:h-16 flex items-center justify-between gap-3">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs md:text-sm text-muted-foreground hover:text-foreground shrink-0">
            <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
            <span className="hidden sm:inline">Continuar comprando</span>
            <span className="sm:hidden">Voltar</span>
          </Link>
          <div className="font-display text-base md:text-xl tracking-[0.2em] uppercase truncate">Lumière</div>
          <div className="hidden md:inline-flex items-center gap-2 text-xs text-muted-foreground shrink-0">
            <Lock className="h-3.5 w-3.5" strokeWidth={1.5} /> Pagamento 100% seguro
          </div>
          <div className="md:hidden inline-flex items-center text-muted-foreground shrink-0">
            <Lock className="h-4 w-4" strokeWidth={1.5} />
          </div>
        </div>
      </header>

      {paid ? (
        <div className="mx-auto max-w-[1280px] px-4 md:px-10 py-8 md:py-12">
          <PaymentConfirmed />
        </div>
      ) : showPix && pixTx ? (
        <div className="mx-auto max-w-[1280px] px-4 md:px-10 py-8 md:py-12">
          <PixPayment transaction={pixTx} productTitle={PRODUCT_TITLE} productMeta={PRODUCT_META} onPaid={() => {
            if (orderCtx) {
              utmifyFn({ data: buildUtmifyOrder({
                orderId: orderCtx.orderId,
                createdAt: orderCtx.createdAt,
                status: "paid",
                paymentMethod: "pix",
                approvedDate: utcNow(),
              }) }).catch(() => {});
            }
            // Salva dados para o upsell e redireciona (apenas após PIX pago)
            try {
              const payload = JSON.stringify({
                customer: buildCustomer(),
                address: buildAddress(),
              });
              localStorage.setItem("lumiere_upsell", payload);
              sessionStorage.setItem("lumiere_upsell", payload);
              localStorage.setItem("lumiere_upsell_paid", "1");
              sessionStorage.setItem("lumiere_upsell_paid", "1");
            } catch {}
            navigate({ to: "/upsell" });
          }} />
        </div>
      ) : (
      <>



      <div className="mx-auto max-w-[1280px] grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-8 lg:gap-10 px-4 md:px-10 py-6 md:py-10 lg:py-16">
        {/* Steps + content */}
        <div>
          {/* progress */}
          <div className="flex items-center gap-2 sm:gap-3 mb-6 md:mb-10">
            {STEPS.map((s, i) => {
              const done = i < step;
              const active = i === step;
              return (
                <div key={s} className="flex items-center gap-2 sm:gap-3 flex-1 last:flex-none min-w-0">
                  <div className={`grid place-items-center size-7 sm:size-8 rounded-full text-[12px] shrink-0 transition-all ${done ? "bg-caramel text-background" : active ? "bg-foreground text-background" : "bg-secondary text-muted-foreground"}`}>
                    {done ? <Check className="h-4 w-4" strokeWidth={2} /> : i + 1}
                  </div>
                  <span className={`text-[10px] sm:text-[11px] tracking-luxe uppercase truncate ${active ? "text-foreground" : "text-muted-foreground"}`}>{s}</span>
                  {i < STEPS.length - 1 && <div className={`hidden sm:block flex-1 h-px ${i < step ? "bg-caramel" : "bg-border"}`} />}
                </div>
              );
            })}
          </div>


          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="bg-background border border-border p-5 md:p-10 shadow-soft"
            >
              {step === 0 && (
                <div className="space-y-5">
                  <h2 className="font-display text-2xl md:text-3xl">Seus dados</h2>
                  <Field label="Nome completo" value={f.name} onChange={set("name")} placeholder="Maria Silva" />
                  <Field label="Email" type="email" value={f.email} onChange={set("email")} placeholder="maria@exemplo.com" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Celular" type="tel" inputMode="numeric" value={f.phone} onChange={(e) => setF({ ...f, phone: mask(e.target.value, maskPhone) })} placeholder="(11) 99999-0000" />
                    <Field label="CPF" inputMode="numeric" value={f.cpf} onChange={(e) => setF({ ...f, cpf: mask(e.target.value, maskCpf) })} placeholder="000.000.000-00" />
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-5">
                  <h2 className="font-display text-2xl md:text-3xl">Endereço de entrega</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-4">
                    <Field label={cepLoading ? "CEP · buscando..." : "CEP"} inputMode="numeric" value={f.cep} onChange={(e) => { const v = mask(e.target.value, maskCep); setF({ ...f, cep: v }); if (onlyDigits(v).length === 8) lookupCep(v); }} onBlur={(e) => lookupCep(e.target.value)} placeholder="00000-000" />
                    <Field label="Endereço" value={f.street} onChange={set("street")} placeholder="Rua, Avenida..." />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Número" value={f.number} onChange={set("number")} placeholder="123" />
                    <Field label="Complemento" value={f.complement} onChange={set("complement")} placeholder="Apto 12" />
                  </div>
                  <div className="grid grid-cols-[1fr_120px] gap-4">
                    <Field label="Cidade" value={f.city} onChange={set("city")} placeholder="São Paulo" />
                    <Field label="Estado" value={f.state} onChange={set("state")} placeholder="SP" />
                  </div>

                  <div className="pt-2">
                    <span className="text-[11px] tracking-luxe uppercase text-muted-foreground">Opção de frete</span>
                    <div className="mt-3 space-y-2">
                      {SHIPPING.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setShippingId(s.id)}
                          className={`w-full flex items-center gap-3 p-4 border transition-all text-left ${shippingId === s.id ? "border-foreground bg-foreground/[0.03]" : "border-border"}`}
                        >
                          <div className={`size-5 rounded-full border-2 grid place-items-center shrink-1 ${shippingId === s.id ? "border-foreground" : "border-border"}`}>
                            {shippingId === s.id && <div className="size-2.5 rounded-full bg-foreground" />}
                          </div>
                          <div className="flex-1 min-w-1">
                            <div className="text-[13px] font-medium">{s.label}</div>
                            <div className="text-[11px] text-muted-foreground">{s.speed}</div>
                          </div>
                          <div className={`text-sm font-medium whitespace-nowrap ${s.price === 0 ? "text-caramel" : ""}`}>
                            {s.price === 0 ? "Grátis" : `R$ ${s.price.toFixed(2).replace(".", ",")}`}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <h2 className="font-display text-2xl md:text-3xl">Pagamento</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button onClick={() => setPay("pix")} className={`flex items-center gap-3 p-4 border transition-all ${pay === "pix" ? "border-foreground bg-foreground/[0.03]" : "border-border"}`}>
                      <img src={pixLogo} alt="PIX" className="h-5 w-5 shrink-0 object-contain" />
                      <div className="text-left min-w-0">
                        <div className="text-sm font-medium">PIX</div>
                        <div className="text-[11px] text-caramel">5% off</div>
                      </div>
                    </button>
                    <button onClick={() => setPay("card")} className={`flex items-center gap-3 p-4 border transition-all ${pay === "card" ? "border-foreground bg-foreground/[0.03]" : "border-border"}`}>
                      <CreditCard className="h-5 w-5 shrink-0" strokeWidth={1.5} />
                      <div className="text-left min-w-0">
                        <div className="text-sm font-medium truncate">Cartão de crédito</div>
                        <div className="text-[11px] text-muted-foreground">até 12x sem juros</div>
                      </div>
                    </button>
                  </div>


                  <AnimatePresence mode="wait">
                    {pay === "pix" ? (
                      <motion.div key="pix" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="border border-border p-5 bg-secondary/40 text-sm text-foreground/80">
                        Ao finalizar, geraremos um QR Code PIX para você pagar no app do seu banco. A confirmação é instantânea.
                      </motion.div>
                    ) : (
                      <motion.div key="card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                        <Field label="Número do cartão" value={f.cardNum} onChange={(e) => setF({ ...f, cardNum: mask(e.target.value, maskCard) })} placeholder="0000 0000 0000 0000" />
                        <Field label="Nome impresso no cartão" value={f.cardName} onChange={set("cardName")} placeholder="MARIA SILVA" />
                        <div className="grid grid-cols-2 gap-4">
                          <Field label="Validade" value={f.cardExp} onChange={(e) => setF({ ...f, cardExp: mask(e.target.value, maskExp) })} placeholder="MM/AA" />
                          <Field label="CVC" value={f.cardCvc} onChange={(e) => setF({ ...f, cardCvc: onlyDigits(e.target.value).slice(0, 4) })} placeholder="000" />
                        </div>
                        <label className="block">
                          <span className="text-[11px] tracking-luxe uppercase text-muted-foreground">Parcelamento</span>
                          <select value={f.installments} onChange={(e) => setF({ ...f, installments: e.target.value })} className="mt-2 w-full bg-background border border-border focus:border-foreground outline-none px-4 py-3.5 text-[15px]">
                            {[1,2,3,4,6,10,12].map((n) => (
                              <option key={n} value={n}>{n}x de R$ {(total / n).toFixed(2).replace(".", ",")} sem juros</option>
                            ))}
                          </select>
                        </label>
                        {cardResult && cardResult.status !== "paid" && (
                          <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/30 text-destructive p-3 text-sm">
                            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                            <span>Pagamento recusado{cardResult.refusedReason?.message ? `: ${cardResult.refusedReason.message}` : ". Verifique os dados do cartão."}</span>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {error && (
            <div className="mt-4 flex items-start gap-2 bg-destructive/10 border border-destructive/30 text-destructive p-3 text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between gap-3">
            <button onClick={back} disabled={step === 0 || submitting} className="inline-flex items-center gap-1.5 px-2 sm:px-4 py-3 text-[12px] tracking-luxe uppercase text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed shrink-0">
              <ChevronLeft className="h-4 w-4" strokeWidth={1.5} /> Voltar
            </button>
            {step < 2 ? (
              <button onClick={next} className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-foreground text-background px-6 sm:px-8 py-4 text-[12px] tracking-luxe uppercase hover:bg-foreground/90">
                Continuar
              </button>
            ) : (
              <button onClick={handleFinish} disabled={submitting} className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-foreground text-background px-6 sm:px-8 py-4 text-[12px] tracking-luxe uppercase hover:bg-foreground/90 disabled:opacity-60">
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Processando…</> : <><Lock className="h-4 w-4" strokeWidth={1.5} /> {pay === "pix" ? "Gerar PIX" : "Finalizar compra"}</>}
              </button>
            )}
          </div>


          <div className="mt-8 grid grid-cols-3 gap-4 text-center text-[11px] tracking-luxe uppercase text-muted-foreground">
            <div className="flex flex-col items-center gap-2"><RotateCcw className="h-4 w-4" strokeWidth={1.5} /> Devolução em 7d</div>
            <div className="flex flex-col items-center gap-2"><Shield className="h-4 w-4" strokeWidth={1.5} /> Garantia 30d</div>
            <div className="flex flex-col items-center gap-2"><Truck className="h-4 w-4" strokeWidth={1.5} /> Envio em 24h</div>
          </div>
        </div>

        {/* Order summary */}
        <aside className="lg:sticky lg:top-8 self-start">
          <div className="bg-background border border-border p-5 md:p-8 shadow-soft">
            <div className="text-[11px] tracking-luxe uppercase text-muted-foreground">Seu pedido</div>
            <div className="mt-5 flex gap-3 sm:gap-4">
              <div className="size-16 sm:size-20 shrink-0 overflow-hidden bg-secondary">
                <img src={hero} alt="" className="h-full w-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium leading-snug">2 Meia-Calça Forrada Térmica Translúcida · Lã Peluciada Plus</div>
                <div className="mt-1 text-xs text-muted-foreground">Cor: Nude · Tam. Único · Qtd: 1</div>
              </div>
              <div className="font-display text-sm sm:text-base whitespace-nowrap shrink-0">R$ 79,90</div>
            </div>


            <div className="mt-6 pt-6 border-t border-border space-y-2.5 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>R$ {subtotal.toFixed(2).replace(".", ",")}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Frete</span><span className={shipping === 0 ? "text-caramel" : ""}>{shipping === 0 ? "Grátis" : `R$ ${shipping.toFixed(2).replace(".", ",")}`}</span></div>
              {discount > 0 && (
                <div className="flex justify-between"><span className="text-muted-foreground">Desconto PIX (5%)</span><span className="text-caramel">- R$ {discount.toFixed(2).replace(".", ",")}</span></div>
              )}
            </div>

            <div className="mt-5 pt-5 border-t border-border flex items-end justify-between">
              <span className="text-[11px] tracking-luxe uppercase text-muted-foreground">Total</span>
              <div className="text-right">
                <div className="font-display text-3xl">R$ {total.toFixed(2).replace(".", ",")}</div>
                {pay === "card" && <div className="text-xs text-muted-foreground">em até 12x sem juros</div>}
              </div>
            </div>

            <div className="mt-6 flex items-start gap-2 bg-secondary/60 p-3 text-[12px] text-foreground/80">
              <Shield className="h-4 w-4 mt-0.5 text-caramel shrink-0" strokeWidth={1.5} />
              <span>Compra protegida. Reembolso garantido em até 30 dias se não amar.</span>
            </div>
          </div>
        </aside>
      </div>
      </>
      )}
    </div>
  );
}
