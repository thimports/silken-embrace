import { motion } from "motion/react";
import { Flame, Sparkles, Move, Scissors, Heart, Snowflake, Feather, Wind } from "lucide-react";
import boxesImg from "@/assets/lumiere-boxes.png";


const ITEMS = [
  { I: Flame, t: "Forro térmico macio", d: "Lã peluciada interna que aquece sem aumentar volume." },
  { I: Sparkles, t: "Translúcido elegante", d: "Aparência de meia fina com calor de uma forrada." },
  { I: Move, t: "Alta elasticidade", d: "Tecido que acompanha cada movimento com leveza." },
  { I: Heart, t: "Modela o corpo", d: "Compressão suave que valoriza a silhueta naturalmente." },
  { I: Scissors, t: "Costura reforçada", d: "Acabamento premium que resiste ao uso diário." },
  { I: Snowflake, t: "Ideal para inverno", d: "Conforto térmico mesmo nos dias mais frios." },
  { I: Feather, t: "Toque macio", d: "Sensação aveludada em contato com a pele." },
  { I: Wind, t: "Respirável", d: "Mantém a temperatura sem reter umidade." },
];

export function Benefits() {
  return (
    <section className="bg-secondary/40 border-y border-border/60">
      <div className="mx-auto max-w-[1400px] px-5 md:px-10 py-20 lg:py-28">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12 lg:mb-16 overflow-hidden aspect-[4/3] sm:aspect-[16/9] lg:aspect-[21/9]"
        >
          <img
            src={boxesImg}
            alt="Embalagens Lumière empilhadas com cartão da marca"
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </motion.div>
        <div className="max-w-2xl">
          <span className="text-[11px] tracking-luxe uppercase text-muted-foreground">Os detalhes</span>
          <h2 className="mt-3 font-display text-4xl lg:text-6xl leading-[1.05]">
            Cada fio pensado para envolver você em <em className="italic text-caramel">conforto</em>.
          </h2>
        </div>

        <div className="mt-14 grid grid-cols-2 lg:grid-cols-4 gap-px bg-border/60">
          {ITEMS.map(({ I, t, d }, i) => (
            <motion.div
              key={t}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              className="bg-background p-7 lg:p-9 group hover:bg-cream transition-colors"
            >
              <I className="h-7 w-7 text-foreground/70 group-hover:text-caramel transition-colors" strokeWidth={1.2} />
              <h3 className="mt-6 font-display text-xl">{t}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{d}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
