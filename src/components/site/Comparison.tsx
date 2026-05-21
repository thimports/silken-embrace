import { Check, X } from "lucide-react";
import { motion } from "motion/react";

const ROWS = [
  { f: "Resistência", us: "Premium reforçada", them: "Rasga com facilidade" },
  { f: "Elasticidade", us: "Acompanha o corpo", them: "Marca e aperta" },
  { f: "Conforto térmico", us: "Forro peluciado interno", them: "Sem isolamento" },
  { f: "Aparência", us: "Translúcida natural", them: "Brilho artificial" },
  { f: "Durabilidade", us: "Centenas de usos", them: "Poucas semanas" },
  { f: "Costura", us: "Reforçada plana", them: "Áspera e visível" },
  { f: "Bolinhas", us: "Não forma", them: "Forma rapidamente" },
];

export function Comparison() {
  return (
    <section className="bg-background">
      <div className="mx-auto max-w-[1400px] px-5 md:px-10 py-20 lg:py-28">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-[11px] tracking-luxe uppercase text-muted-foreground">Por que Lumière</span>
          <h2 className="mt-3 font-display text-4xl lg:text-5xl">
            Por que escolher <em className="italic text-caramel">nossa</em> meia-calça?
          </h2>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mt-12 grid grid-cols-[1.2fr_1fr_1fr] overflow-hidden border border-border shadow-soft"
        >
          <div className="bg-secondary p-5 md:p-7 text-[11px] tracking-luxe uppercase text-muted-foreground">
            Características
          </div>
          <div className="bg-foreground text-background p-5 md:p-7 text-center">
            <div className="font-display text-lg md:text-xl">Lumière</div>
            <div className="text-[10px] tracking-luxe uppercase opacity-70 mt-0.5">Nossa meia</div>
          </div>
          <div className="bg-secondary p-5 md:p-7 text-center">
            <div className="font-display text-lg md:text-xl text-foreground/60">Comuns</div>
            <div className="text-[10px] tracking-luxe uppercase text-muted-foreground mt-0.5">Outras marcas</div>
          </div>

          {ROWS.map((r, i) => (
            <div key={r.f} className="contents">
              <div className={`p-5 md:p-6 text-sm font-medium border-t border-border ${i % 2 ? "bg-cream" : "bg-background"}`}>{r.f}</div>
              <div className={`p-5 md:p-6 text-sm text-center border-t border-border flex items-center justify-center gap-2 ${i % 2 ? "bg-cream" : "bg-background"}`}>
                <Check className="h-4 w-4 text-caramel" strokeWidth={2} />
                <span>{r.us}</span>
              </div>
              <div className={`p-5 md:p-6 text-sm text-center border-t border-border text-muted-foreground flex items-center justify-center gap-2 ${i % 2 ? "bg-cream" : "bg-background"}`}>
                <X className="h-4 w-4 text-destructive/60" strokeWidth={2} />
                <span>{r.them}</span>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
