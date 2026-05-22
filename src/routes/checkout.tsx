import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, ChevronLeft, Lock, Shield, Truck, CreditCard, QrCode, Copy, CheckCircle2, RotateCcw } from "lucide-react";
import hero from "@/assets/hero.webp";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout · Lumière" },
      { name: "description", content: "Finalize sua compra com segurança." },
    ],
    links: [
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&display=swap",
      },
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
  const [step, setStep] = useState(0);
  const [pay, setPay] = useState<"pix" | "card">("pix");
  const [copied, setCopied] = useState(false);

  // form state
  const [f, setF] = useState({
    name: "", email: "", phone: "", cpf: "",
    cep: "", street: "", number: "", complement: "", city: "", state: "",
    cardNum: "", cardName: "", cardExp: "", cardCvc: "", installments: "1",
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const next = () => setStep((s) => Math.min(2, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  const subtotal = 79.9;
  const shipping = 0;
  const discount = pay === "pix" ? subtotal * 0.05 : 0;
  const total = subtotal + shipping - discount;

  const copyPix = () => {
    navigator.clipboard.writeText("00020126360014BR.GOV.BCB.PIX0114lumiere@pix5204000053039865406" + total.toFixed(2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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


          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.35 }}
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
                    <Field label="CEP" value={f.cep} onChange={(e) => setF({ ...f, cep: mask(e.target.value, maskCep) })} placeholder="00000-000" />
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
                  <div className="flex items-center gap-3 bg-secondary/60 p-4 text-sm">
                    <Truck className="h-4 w-4 text-caramel" strokeWidth={1.5} />
                    <span><strong>Frete grátis</strong> · entrega em 5-8 dias úteis</span>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <h2 className="font-display text-2xl md:text-3xl">Pagamento</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button onClick={() => setPay("pix")} className={`flex items-center gap-3 p-4 border transition-all ${pay === "pix" ? "border-foreground bg-foreground/[0.03]" : "border-border"}`}>
                      <QrCode className="h-5 w-5 shrink-0" strokeWidth={1.5} />
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
                      <motion.div key="pix" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="border border-border p-6 text-center">
                        <div className="mx-auto size-48 grid place-items-center bg-cream border border-border">
                          <QrCode className="h-32 w-32 text-foreground" strokeWidth={1} />
                        </div>
                        <p className="mt-4 text-sm text-muted-foreground">Escaneie o QR code ou copie o código abaixo</p>
                        <button onClick={copyPix} className="mt-3 inline-flex items-center gap-2 border border-border px-4 py-2.5 text-xs tracking-luxe uppercase hover:bg-foreground hover:text-background transition-all">
                          {copied ? <><CheckCircle2 className="h-4 w-4" strokeWidth={1.5} /> Copiado</> : <><Copy className="h-4 w-4" strokeWidth={1.5} /> Copiar código</>}
                        </button>
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
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-6 flex items-center justify-between gap-3">
            <button onClick={back} disabled={step === 0} className="inline-flex items-center gap-1.5 px-2 sm:px-4 py-3 text-[12px] tracking-luxe uppercase text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed shrink-0">
              <ChevronLeft className="h-4 w-4" strokeWidth={1.5} /> Voltar
            </button>
            {step < 2 ? (
              <button onClick={next} className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-foreground text-background px-6 sm:px-8 py-4 text-[12px] tracking-luxe uppercase hover:bg-foreground/90">
                Continuar
              </button>
            ) : (
              <button className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-foreground text-background px-6 sm:px-8 py-4 text-[12px] tracking-luxe uppercase hover:bg-foreground/90">
                <Lock className="h-4 w-4" strokeWidth={1.5} /> Finalizar compra
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
              <div className="flex justify-between"><span className="text-muted-foreground">Frete</span><span className="text-caramel">Grátis</span></div>
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
    </div>
  );
}
