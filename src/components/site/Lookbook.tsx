import { motion } from "motion/react";
import l1 from "@/assets/lookbook-1.webp";
import l2 from "@/assets/lookbook-2.webp";
import l3 from "@/assets/lookbook-3.webp";

const LOOKS = [
  { src: l1, t: "Rues de Paris", s: "Casaco camel + booties caramelo" },
  { src: l2, t: "Soirée Calme", s: "Knit dress + tights nude" },
  { src: l3, t: "Détails", s: "Caramelo + tons quentes" },
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

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {LOOKS.map((l, i) => (
            <motion.figure
              key={l.t}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.8, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              className="group"
            >
              <div className="relative aspect-square overflow-hidden bg-background">
                <img
                  src={l.src}
                  alt={l.t}
                  className="h-full w-full object-cover transition-transform duration-[1.4s] group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <figcaption className="mt-4 flex items-baseline justify-between">
                <span className="font-display text-xl">{l.t}</span>
                <span className="text-xs text-muted-foreground">{l.s}</span>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
