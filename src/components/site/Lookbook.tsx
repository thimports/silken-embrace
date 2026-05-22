import { motion } from "motion/react";
import { Thermometer, Sparkles, Heart } from "lucide-react";
import l1 from "@/assets/lookbook-1.webp";
import l2 from "@/assets/lookbook-2.webp";
import l3 from "@/assets/lookbook-3.webp";

const LOOKS = [
  {
    src: l1,
    eyebrow: "Conforto Térmico",
    title: "Lã peluciada interna",
    desc: "O forro felpudo envolve suas pernas como um abraço quente, retendo o calor do corpo mesmo nos dias mais frios. Maciez que você sente no primeiro toque.",
    Icon: Thermometer,
  },
  {
    src: l2,
    eyebrow: "Elasticidade",
    title: "Veste do P ao GG com conforto",
    desc: "Tecido resistente que não marca e não transparenta. Veste todos os corpos com alta elasticidade e conforto o dia todo.",
    Icon: Sparkles,
  },
  {
    src: l3,
    eyebrow: "Visual Natural",
    title: "Efeito translúcido sofisticado",
    desc: "Combina com qualquer look — do casual ao mais elegante. A aparência natural e leve valoriza suas pernas sem abrir mão do conforto no inverno.",
    Icon: Heart,
  },
];

export function Lookbook() {
  return (
    <section id="lookbook" className="bg-secondary/40 border-y border-border/60">
      <div className="mx-auto max-w-[1400px] px-5 md:px-10 py-20 lg:py-28">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <span className="text-[11px] tracking-luxe uppercase text-muted-foreground">Lookbook · Hiver '26</span>
            <h2 className="mt-3 font-display text-4xl lg:text-6xl leading-[1.05] max-w-2xl">
              O inverno europeu <em className="italic text-caramel">redesenhado</em>.
            </h2>
          </div>
          <p className="max-w-sm text-muted-foreground text-sm">
            Inspirado nas ruas de Paris e Milão. Looks atemporais que transformam a estação mais fria em sua favorita.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-6">
          {LOOKS.map((l, i) => (
            <motion.figure
              key={l.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.8, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              className="group flex flex-col"
            >
              <div className="relative aspect-square overflow-hidden bg-background">
                <img
                  src={l.src}
                  alt={l.title}
                  className="h-full w-full object-cover transition-transform duration-[1.4s] group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <figcaption className="mt-5 flex flex-col gap-2.5">
                <div className="flex items-center gap-2">
                  <div className="size-7 shrink-0 rounded-full border border-caramel/40 bg-caramel/10 grid place-items-center">
                    <l.Icon className="h-3.5 w-3.5 text-caramel" strokeWidth={1.5} />
                  </div>
                  <span className="text-[10px] tracking-luxe uppercase text-caramel">{l.eyebrow}</span>
                </div>
                <h3 className="font-display text-xl lg:text-2xl leading-tight">{l.title}</h3>
                <div className="h-px w-10 bg-caramel/50" />
                <p className="text-[13px] leading-relaxed text-muted-foreground">{l.desc}</p>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}

