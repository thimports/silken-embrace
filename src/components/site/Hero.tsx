import { motion } from "motion/react";
import { Star, ArrowRight } from "lucide-react";
import hero from "@/assets/hero.webp";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 px-5 md:px-10 pt-10 pb-16 lg:pt-20 lg:pb-28 items-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="order-2 lg:order-1"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3.5 py-1.5 text-[11px] tracking-luxe uppercase text-foreground/80">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Mais vendido do inverno
          </span>

          <h1 className="mt-6 font-display text-[44px] leading-[1.02] sm:text-6xl lg:text-[80px] lg:leading-[0.98] tracking-tight text-foreground">
            Aqueça seus<br />
            dias frios com<br />
            <em className="italic text-caramel">elegância.</em>
          </h1>

          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-muted-foreground">
            Meia-calça forrada com lã peluciada, translúcida e modeladora.
            Conforto térmico premium para mulheres que não abrem mão do refinamento.
          </p>

          <div className="mt-6 flex items-center gap-3">
            <div className="flex items-center gap-0.5 text-caramel">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-current" strokeWidth={0} />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">4.9 · 2.847 avaliações</span>
          </div>

          <div className="mt-9 flex flex-col sm:flex-row gap-3">
            <a
              href="#comprar"
              className="group inline-flex items-center justify-center gap-2 bg-foreground text-background px-8 py-4 text-[13px] tracking-luxe uppercase hover:bg-foreground/90 transition-all"
            >
              Comprar agora
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={1.5} />
            </a>
            <a
              href="#detalhes"
              className="inline-flex items-center justify-center gap-2 border border-foreground/20 px-8 py-4 text-[13px] tracking-luxe uppercase hover:bg-foreground hover:text-background transition-all"
            >
              Ver detalhes
            </a>
          </div>

          <div className="mt-10 grid grid-cols-3 max-w-md gap-6 text-[11px] tracking-luxe uppercase text-muted-foreground">
            <div><div className="font-display text-2xl text-foreground normal-case tracking-tight">+50k</div>clientes</div>
            <div><div className="font-display text-2xl text-foreground normal-case tracking-tight">12h</div>frete express</div>
            <div><div className="font-display text-2xl text-foreground normal-case tracking-tight">30d</div>garantia</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="order-1 lg:order-2 relative"
        >
          <div className="relative aspect-[4/5] overflow-hidden bg-gradient-warm">
            <img
              src={hero}
              alt="Modelo vestindo meia-calça térmica translúcida em tom nude"
              className="h-full w-full object-cover"
              width={1080}
              height={1350}
            />
            <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
              <div className="glass rounded-sm px-4 py-3">
                <div className="text-[10px] tracking-luxe uppercase text-muted-foreground">Coleção</div>
                <div className="font-display text-lg leading-none mt-1">Hiver '26</div>
              </div>
              <div className="glass rounded-sm px-4 py-3 text-right">
                <div className="text-[10px] tracking-luxe uppercase text-muted-foreground">A partir de</div>
                <div className="font-display text-lg leading-none mt-1">R$ 89</div>
              </div>
            </div>
          </div>
          <div className="absolute -top-4 -right-4 hidden md:block size-24 rounded-full bg-accent/20 blur-2xl" />
        </motion.div>
      </div>
    </section>
  );
}
