import { motion } from "motion/react";
import { Star } from "lucide-react";

const REVIEWS = [
  { n: "Mariana A.", c: "São Paulo, SP", t: "Apaixonada! Aquece de verdade e fica linda nas pernas. Já comprei nas 3 cores.", i: "MA" },
  { n: "Luiza R.", c: "Curitiba, PR", t: "Salvou meu inverno. Modela super bem e o tecido é luxuoso, parece europeu mesmo.", i: "LR" },
  { n: "Camila S.", c: "Porto Alegre, RS", t: "Translucidez perfeita, conforto absurdo. Não enrola, não marca. Recomendo demais.", i: "CS" },
  { n: "Fernanda T.", c: "Belo Horizonte, MG", t: "Achei que seria mais uma meia, mas é outro nível. Acabamento impecável.", i: "FT" },
  { n: "Beatriz M.", c: "Rio de Janeiro, RJ", t: "Plus size que veste bem é raro. Essa veste perfeitamente e é elegantíssima.", i: "BM" },
  { n: "Patrícia L.", c: "Florianópolis, SC", t: "Já está no meu armário fixo. Comprei pra mim e pra minha mãe — amamos.", i: "PL" },
];

export function Testimonials() {
  return (
    <section className="bg-background">
      <div className="mx-auto max-w-[1400px] px-5 md:px-10 py-20 lg:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-12 items-start">
          <div className="lg:sticky lg:top-28">
            <span className="text-[11px] tracking-luxe uppercase text-muted-foreground">Provas reais</span>
            <h2 className="mt-3 font-display text-4xl lg:text-5xl leading-tight">
              Mulheres que <em className="italic text-caramel">já vivem</em> Lumière.
            </h2>
            <div className="mt-8 flex items-center gap-6">
              <div>
                <div className="font-display text-6xl text-foreground">4,9</div>
                <div className="flex items-center gap-0.5 mt-1 text-caramel">
                  {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" strokeWidth={0} />)}
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Baseado em <strong className="text-foreground">2.847 avaliações</strong><br />verificadas de compradoras.
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {REVIEWS.map((r, i) => (
              <motion.article
                key={r.n}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.55, delay: i * 0.06 }}
                className="border border-border bg-cream p-6 shadow-soft hover:shadow-elegant transition-shadow"
              >
                <div className="flex items-center gap-0.5 text-caramel">
                  {[...Array(5)].map((_, j) => <Star key={j} className="h-3.5 w-3.5 fill-current" strokeWidth={0} />)}
                </div>
                <p className="mt-3 text-[14px] leading-relaxed text-foreground/85">"{r.t}"</p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="size-9 rounded-full bg-gradient-warm grid place-items-center text-[11px] font-medium tracking-wide text-foreground">{r.i}</div>
                  <div>
                    <div className="text-sm font-medium">{r.n}</div>
                    <div className="text-xs text-muted-foreground">{r.c} · compra verificada</div>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
