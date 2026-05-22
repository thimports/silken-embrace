import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Star, Minus, Plus, Shield, Truck, RotateCcw, Lock, Eye, Flame } from "lucide-react";
import hero from "@/assets/hero.webp";
import p1 from "@/assets/product-1.webp";
import p2 from "@/assets/product-2.webp";
import look from "@/assets/lookbook-2.webp";

const IMAGES = [hero, p1, p2, look];
const SIZES = ["PP", "P", "M", "G", "GG", "G1", "G2"];
const COLORS = [
  { name: "Nude", value: "oklch(0.82 0.04 65)" },
  { name: "Café", value: "oklch(0.42 0.04 50)" },
  { name: "Preto", value: "oklch(0.22 0.005 50)" },
];

export function ProductSection() {
  const [img, setImg] = useState(0);
  const [size, setSize] = useState(SIZES[0]);
  const [color, setColor] = useState(COLORS[0].name);
  const [qty, setQty] = useState(1);
  const [viewers, setViewers] = useState(22);
  const [stock, setStock] = useState(11);

  useEffect(() => {
    setViewers(14 + Math.floor(Math.random() * 22));
    setStock(8 + Math.floor(Math.random() * 7));
  }, []);

  return (
    <section id="detalhes" className="border-t border-border/60 bg-background">
      <div className="mx-auto max-w-[1400px] grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-10 lg:gap-16 px-5 md:px-10 pt-4 pb-16 lg:pt-12 lg:pb-24">
        {/* Gallery */}
        <div className="grid grid-cols-1 lg:grid-cols-[72px_1fr] gap-4 md:gap-6">
          <motion.div
            key={img}
            initial={{ opacity: 0, scale: 1.01 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="order-1 lg:order-2 relative w-full aspect-square lg:aspect-[4/5] overflow-hidden rounded-2xl lg:rounded-none bg-secondary/60 group flex items-center justify-center p-3 sm:p-5 lg:p-0"
          >
            <img
              src={IMAGES[img]}
              alt="Meia-calça forrada térmica translúcida"
              className="relative max-h-full max-w-full w-auto h-auto object-contain lg:h-full lg:w-full lg:object-cover transition-transform duration-700 group-hover:lg:scale-105"
              loading="eager"
              decoding="async"
            />
          </motion.div>

          <div className="flex lg:flex-col gap-3 order-2 lg:order-1 overflow-x-auto no-scrollbar lg:overflow-visible -mx-1 px-1">
            {IMAGES.map((src, i) => (
              <button
                key={i}
                onClick={() => setImg(i)}
                className={`relative shrink-0 aspect-square w-[64px] sm:w-[72px] overflow-hidden rounded-lg border bg-secondary/60 flex items-center justify-center p-1.5 transition-all ${
                  img === i ? "border-foreground" : "border-border/60 opacity-70 hover:opacity-100"
                }`}
              >
                <img src={src} alt="" className="max-h-full max-w-full object-contain" loading="lazy" />
              </button>
            ))}
          </div>
        </div>


        {/* Buy box */}
        <div id="comprar" className="lg:pt-4">
          <div className="text-[11px] tracking-luxe uppercase text-muted-foreground">Lumière · Inverno '26</div>
          <h2 className="mt-2 font-display text-xl lg:text-[26px] leading-tight">
            Meia-Calça Forrada Térmica<br />Translúcida · Lã Peluciada
          </h2>
          <div className="mt-3 flex items-center gap-3 text-sm">
            <div className="flex items-center gap-0.5 text-caramel">
              {[...Array(5)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" strokeWidth={0} />)}
            </div>
            <span className="text-muted-foreground">4.9 · 2.847 avaliações verificadas</span>
          </div>

          <div className="mt-7 flex items-end gap-3">
            <span className="font-display text-4xl text-foreground">R$ 79<span className="text-xl">,90</span></span>
            <span className="text-muted-foreground line-through text-base mb-1">R$ 179,90</span>
            <span className="mb-1 bg-foreground text-background text-[11px] tracking-luxe uppercase px-2 py-1">-50%</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            ou <span className="text-foreground font-medium">12x de R$ 7,90</span> sem juros · 
            <span className="text-foreground font-medium"> R$ 75,91</span> no PIX (5% off)
          </p>

          <div className="mt-7 flex items-center gap-2 text-[13px] text-foreground/80 bg-secondary/50 border border-border/60 px-4 py-3">
            <Eye className="h-4 w-4 text-caramel" strokeWidth={1.5} />
            <span><strong className="text-foreground">{viewers} pessoas</strong> estão vendo este produto agora</span>
          </div>

          {/* Color */}
          <div className="mt-7">
            <div className="flex items-center justify-between text-[12px] tracking-luxe uppercase text-muted-foreground">
              <span>Cor</span>
              <span className="text-foreground normal-case tracking-normal">{color}</span>
            </div>
            <div className="mt-3 flex gap-3">
              {COLORS.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setColor(c.name)}
                  className={`size-10 rounded-full border transition-all ${color === c.name ? "border-foreground ring-2 ring-foreground/10 ring-offset-2 ring-offset-background" : "border-border"}`}
                  style={{ background: c.value }}
                  aria-label={c.name}
                />
              ))}
            </div>
          </div>

          {/* Size */}
          <div className="mt-7">
            <div className="flex items-center justify-between text-[12px] tracking-luxe uppercase text-muted-foreground">
              <span>Tamanho</span>
              <a href="#" className="text-foreground normal-case tracking-normal underline underline-offset-4">Guia de medidas</a>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {SIZES.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`min-w-[44px] px-3 py-2 text-xs tracking-wide border transition-all ${size === s ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground/60"}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>


          {/* Quantity + CTA */}
          <div className="mt-6 flex flex-col gap-3">
            <a
              href="/checkout"
              className="w-full inline-flex items-center justify-center bg-foreground text-background py-4 text-[13px] tracking-luxe uppercase hover:bg-foreground/90 transition-all"
            >
              Comprar agora
            </a>
            <button className="w-full border border-foreground/20 py-4 text-[13px] tracking-luxe uppercase hover:bg-foreground hover:text-background transition-all">
              Adicionar à sacola
            </button>
          </div>

          {/* Trust */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-border/60">
            {[
              { I: Truck, t: "Frete rápido", s: "Envio em 24h" },
              { I: Shield, t: "Garantia", s: "30 dias" },
              { I: RotateCcw, t: "Troca grátis", s: "Sem burocracia" },
              { I: Lock, t: "Compra segura", s: "SSL 256-bit" },
            ].map(({ I, t, s }) => (
              <div key={t} className="text-center">
                <I className="h-5 w-5 mx-auto text-foreground/70" strokeWidth={1.25} />
                <div className="mt-2 text-[12px] font-medium">{t}</div>
                <div className="text-[11px] text-muted-foreground">{s}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
