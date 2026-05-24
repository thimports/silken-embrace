import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { ChevronLeft, Lock, ShieldCheck, Truck, Sparkles, Check, Loader2, X } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { createPixTransaction } from "@/lib/buypix.functions";
import { sendFbEvent } from "@/lib/fb-capi.functions";

import { fbTrack, getFbp, getFbc, newEventId } from "@/lib/fbpixel";
import { getUtms } from "@/lib/utm";
import { recordOrder, markOrderPaid } from "@/lib/tracking.functions";
import { getSessionId } from "@/hooks/use-tracking";
import { PixPayment } from "@/components/checkout/PixPayment";
import { PaymentConfirmed } from "@/components/checkout/PaymentConfirmed";
import scarfCamel from "@/assets/scarf-camel.png";
import scarfBeige from "@/assets/scarf-beige.png";
import scarfCaramel from "@/assets/scarf-caramel.png";
import scarfBlack from "@/assets/scarf-black.png";

export const Route = createFileRoute("/upsell")({
  head: () => ({
    meta: [
      { title: "Oferta Especial · Lumière" },
      { name: "description", content: "Oferta exclusiva: leve junto o Cachecol Inverno Lenço Pashmina." },
    ],
  }),
  component: UpsellPage,
});

const COLORS = [
  { id: "caramelo", name: "Caramelo", hex: "#C59567", img: scarfCamel },
  { id: "bege", name: "Bege", hex: "#CDAF95", img: scarfBeige },
  { id: "marrom", name: "Marrom", hex: "#5F4129", img: scarfCaramel },
  { id: "preto", name: "Preto", hex: "#0E0E10", img: scarfBlack },
] as const;

const PRICE = 39.9;
const PRODUCT_ID = "lumiere-cachecol-pashmina";
const PRODUCT_TITLE = "Cachecol Inverno Lenço Pashmina";

type Saved = {
  customer: { name: string; email: string; phone: string; document: string };
  address: { street: string; streetNumber: string; complement?: string; zipCode: string; city: string; state: string };
};


function UpsellPage() {
  const navigate = useNavigate();
  const [saved, setSaved] = useState<Saved | null>(null);
  const [colorId, setColorId] = useState<(typeof COLORS)[number]["id"]>("caramelo");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preloadedPix, setPreloadedPix] = useState<{ id: string; amount: number; pix: { qrcode: string; expirationDate?: string } } | null>(null);
  const [preloading, setPreloading] = useState(false);
  const [pixTx, setPixTx] = useState<{ id: string; amount: number; pix: { qrcode: string; expirationDate?: string } } | null>(null);
  const [paid, setPaid] = useState(false);
  const [declined, setDeclined] = useState(false);

  const pixFn = useServerFn(createPixTransaction);
  const capiFn = useServerFn(sendFbEvent);
  
  const recordOrderFn = useServerFn(recordOrder);
  const markPaidFn = useServerFn(markOrderPaid);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("lumiere_upsell") || sessionStorage.getItem("lumiere_upsell");
      if (raw) setSaved(JSON.parse(raw));
    } catch {
      /* ignore — mantém a tela do upsell mesmo sem dados salvos */
    }
  }, []);

  // ViewContent on mount
  useEffect(() => {
    const eventId = newEventId();
    fbTrack("ViewContent", { value: PRICE, currency: "BRL", content_ids: [PRODUCT_ID], content_type: "product" }, { eventID: eventId });
  }, []);

  const color = useMemo(() => COLORS.find((c) => c.id === colorId)!, [colorId]);

  // Pre-generate PIX in background as soon as we have customer data — only show after user clicks
  useEffect(() => {
    if (!saved || preloadedPix || preloading) return;
    let cancelled = false;
    setPreloading(true);
    (async () => {
      try {
        const tx = await pixFn({
          data: {
            amount: Math.round(PRICE * 100),
            customer: saved.customer,
            items: [{ title: PRODUCT_TITLE, unitPrice: Math.round(PRICE * 100), quantity: 1, tangible: true }],
            address: saved.address,
          },
        });
        if (cancelled) return;
        if (tx?.pix?.qrcode) {
          setPreloadedPix({ id: tx.id, amount: tx.amount, pix: tx.pix });
        }
      } catch {
        /* silencioso — usuário pode tentar via botão */
      } finally {
        if (!cancelled) setPreloading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [saved, preloadedPix, preloading, pixFn]);

  const fireTracking = (tx: { id: string; amount: number; pix: { qrcode: string } }, data: Saved) => {
    const orderId = String(tx.id);
    const eventId = `purchase-pix-upsell-${tx.id}`;
    recordOrderFn({ data: {
      transactionId: tx.id,
      customer: { name: data.customer.name, email: data.customer.email, phone: data.customer.phone, cpf: data.customer.document },
      address: data.address,
      amountCents: tx.amount,
      pixQrcode: tx.pix.qrcode,
      isUpsell: true,
      sessionId: getSessionId(),
      utm: getUtms(),
      products: [{
        id: PRODUCT_ID,
        name: `${PRODUCT_TITLE} · ${color.name}`,
        quantity: 1,
        priceInCents: Math.round(PRICE * 100),
      }],
    }}).catch(() => {});
    fbTrack("Purchase", { value: PRICE, currency: "BRL", content_ids: [PRODUCT_ID], content_type: "product", order_id: orderId }, { eventID: eventId });
    capiFn({
      data: {
        eventName: "Purchase",
        eventId,
        eventSourceUrl: typeof window !== "undefined" ? window.location.href : undefined,
        value: PRICE,
        currency: "BRL",
        fbp: getFbp(),
        fbc: getFbc(),
        user: {
          email: data.customer.email,
          phone: data.customer.phone,
          name: data.customer.name,
          cpf: data.customer.document,
          city: data.address.city,
          state: data.address.state,
          zip: data.address.zipCode,
        },
        customData: { order_id: orderId, payment_method: "pix", upsell: true },
      },
    }).catch(() => {});
    // Utmify (waiting_payment + paid) é disparada server-side dentro de recordOrder/markOrderPaid.
  };


  const acceptOffer = async () => {
    setError(null);
    setSubmitting(true);
    try {
      let data = saved;
      if (!data) {
        try {
          const raw = localStorage.getItem("lumiere_upsell") || sessionStorage.getItem("lumiere_upsell");
          if (raw) {
            data = JSON.parse(raw) as Saved;
            setSaved(data);
          }
        } catch { /* ignore */ }
      }
      if (!data) throw new Error("Não encontramos seus dados. Recarregue a página do checkout.");

      if (preloadedPix) {
        setPixTx(preloadedPix);
        fireTracking(preloadedPix, data);
        return;
      }

      const tx = await pixFn({
        data: {
          amount: Math.round(PRICE * 100),
          customer: data.customer,
          items: [{ title: `${PRODUCT_TITLE} · ${color.name}`, unitPrice: Math.round(PRICE * 100), quantity: 1, tangible: true }],
          address: data.address,
        },
      });
      if (!tx?.pix?.qrcode) throw new Error("Não recebemos o código PIX. Tente novamente.");
      const out = { id: tx.id, amount: tx.amount, pix: tx.pix };
      setPixTx(out);
      fireTracking(out, data);
    } catch (e: any) {
      setError(e?.message || "Erro ao gerar PIX. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  // Confirmation screen
  if (paid) {
    return (
      <div className="min-h-screen bg-cream">
        <SlimHeader />
        <div className="mx-auto max-w-[1280px] px-4 md:px-10 py-8 md:py-12">
          <PaymentConfirmed />
        </div>
      </div>
    );
  }

  // PIX screen
  if (pixTx) {
    return (
      <div className="min-h-screen bg-cream">
        <SlimHeader />
        <div className="mx-auto max-w-[1280px] px-4 md:px-10 py-8 md:py-12">
          <PixPayment
            transaction={pixTx}
            productTitle={`${PRODUCT_TITLE} · ${color.name}`}
            productMeta={`Cor: ${color.name} · Tam. Único · Qtd: 1`}
            onPaid={async () => {
              // Aguarda markOrderPaid (dispara Utmify "paid" no servidor) antes de mudar a UI
              try { await markPaidFn({ data: { transactionId: pixTx.id } }); } catch { /* segue */ }
              setPaid(true);
            }}

          />
        </div>
      </div>
    );
  }

  // Declined → confirmation of original purchase
  if (declined) {
    return (
      <div className="min-h-screen bg-cream">
        <SlimHeader />
        <div className="mx-auto max-w-[1280px] px-4 md:px-10 py-8 md:py-12">
          <PaymentConfirmed />
        </div>
      </div>
    );
  }

  // Offer screen
  return (
    <div className="min-h-screen bg-cream">
      <SlimHeader />

      <div className="mx-auto max-w-3xl lg:max-w-6xl px-4 md:px-10 py-6 md:py-12">
        {/* Top banner */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-foreground text-background px-4 py-2.5 text-center text-[11px] tracking-luxe uppercase flex items-center justify-center gap-2"
        >
          <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} /> Oferta exclusiva · 1x por pedido
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="text-center mt-6 md:mt-8"
        >
          <div className="inline-flex items-center gap-2 text-[11px] tracking-luxe uppercase text-caramel mb-3">
            <Check className="h-3.5 w-3.5" strokeWidth={2} /> Pagamento confirmado
          </div>
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl leading-tight">
            Espere! Adicione ao seu pedido por um preço imperdível
          </h1>
          <p className="mt-3 text-sm md:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto">
            Aproveite agora: o <strong className="text-foreground">Cachecol Inverno Lenço Pashmina</strong> com{" "}
            <strong className="text-foreground">49% de desconto</strong>, exclusivo para clientes que acabaram de comprar.
          </p>
        </motion.div>

        {/* Product card — 2 cols on desktop */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-8 lg:mt-10 bg-background border border-border shadow-soft overflow-hidden grid grid-cols-1 lg:grid-cols-2"
        >
          <div className="relative aspect-[4/3] lg:aspect-auto bg-secondary overflow-hidden">
            <motion.img
              key={color.id}
              src={color.img}
              alt={`${PRODUCT_TITLE} ${color.name}`}
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35 }}
              className="h-full w-full object-cover"
            />
            <div className="absolute top-3 left-3 bg-caramel text-background text-[10px] tracking-luxe uppercase px-2.5 py-1">
              -49% OFF
            </div>
            <div className="absolute top-3 right-3 bg-background/90 backdrop-blur text-foreground text-[10px] tracking-luxe uppercase px-2.5 py-1 border border-border">
              Edição Limitada
            </div>
          </div>

          <div className="p-5 md:p-7 lg:p-10 flex flex-col justify-center">
            <h2 className="font-display text-xl md:text-2xl lg:text-3xl">{PRODUCT_TITLE}</h2>
            <p className="text-[12px] lg:text-sm text-muted-foreground mt-1">
              Toque Pashmina · 100% antialérgico · 180×65cm · com franjas
            </p>

            {/* Price */}
            <div className="mt-4 lg:mt-6 flex items-end gap-3">
              <span className="font-display text-3xl md:text-4xl lg:text-5xl">R$ 39,90</span>
              <span className="text-sm lg:text-base text-muted-foreground line-through pb-1">R$ 79,90</span>
              <span className="text-[11px] lg:text-xs tracking-luxe uppercase text-caramel pb-1.5">Economize R$ 40</span>
            </div>

            {/* Color selection */}
            <div className="mt-6 lg:mt-8">
              <div className="flex items-center justify-between">
                <span className="text-[11px] tracking-luxe uppercase text-muted-foreground">Cor</span>
                <span className="text-[12px] lg:text-sm font-medium">{color.name}</span>
              </div>
              <div className="mt-3 flex items-center gap-3">
                {COLORS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setColorId(c.id)}
                    aria-label={c.name}
                    className={`relative size-10 lg:size-12 rounded-full border-2 transition-all ${colorId === c.id ? "border-foreground scale-110 shadow-soft" : "border-border hover:border-foreground/40"}`}
                    style={{ backgroundColor: c.hex }}
                  >
                    {colorId === c.id && (
                      <Check className="absolute inset-0 m-auto h-4 w-4 lg:h-5 lg:w-5" strokeWidth={2.5} style={{ color: c.hex === "#0E0E10" || c.hex === "#5F4129" ? "#fff" : "#000" }} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Benefits */}
            <div className="mt-6 lg:mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { icon: Truck, label: "Vai junto sem custo extra" },
                { icon: ShieldCheck, label: "Garantia 30 dias" },
                { icon: Sparkles, label: "Toque cashmere" },
              ].map(({ icon: Icon, label }, i) => (
                <div key={i} className="flex items-center gap-2 text-[12px] bg-secondary/50 border border-border px-3 py-2.5">
                  <Icon className="h-4 w-4 text-caramel shrink-0" strokeWidth={1.5} />
                  <span className="leading-snug">{label}</span>
                </div>
              ))}
            </div>

            {error && (
              <div className="mt-5 flex items-center gap-2 text-[12px] text-destructive bg-destructive/5 border border-destructive/30 px-3 py-2.5">
                <X className="h-4 w-4 shrink-0" strokeWidth={1.5} /> {error}
              </div>
            )}

            {/* CTA */}
            <button
              onClick={acceptOffer}
              disabled={submitting}
              className="mt-6 lg:mt-8 w-full inline-flex items-center justify-center gap-2 bg-caramel text-background px-6 py-5 text-[13px] tracking-luxe uppercase hover:bg-caramel/90 transition-colors disabled:opacity-60"
            >
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} /> Gerando PIX…</>
              ) : (
                <>Sim! Levar junto também · R$ 39,90</>
              )}
            </button>

            <button
              onClick={() => setDeclined(true)}
              className="mt-3 w-full text-center text-[12px] text-muted-foreground hover:text-foreground underline underline-offset-4"
            >
              Não, obrigado. Continuar sem o cachecol
            </button>

            <div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
              <Lock className="h-3.5 w-3.5" strokeWidth={1.5} /> Pagamento 100% seguro · Mesma entrega do pedido anterior
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function SlimHeader() {
  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto max-w-[1280px] px-4 md:px-10 h-14 md:h-16 flex items-center justify-between gap-3">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs md:text-sm text-muted-foreground hover:text-foreground shrink-0">
          <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
          <span className="hidden sm:inline">Voltar para a loja</span>
          <span className="sm:hidden">Voltar</span>
        </Link>
        <div className="font-display text-base md:text-xl tracking-[0.2em] uppercase truncate">Lumière</div>
        <div className="hidden md:inline-flex items-center gap-2 text-xs text-muted-foreground shrink-0">
          <Lock className="h-3.5 w-3.5" strokeWidth={1.5} /> Compra segura
        </div>
        <div className="md:hidden inline-flex items-center text-muted-foreground shrink-0">
          <Lock className="h-4 w-4" strokeWidth={1.5} />
        </div>
      </div>
    </header>
  );
}
