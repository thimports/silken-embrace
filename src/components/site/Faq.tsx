import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus } from "lucide-react";

const ITEMS = [
  { q: "É realmente quente?", a: "Sim. O forro interno de lã peluciada cria uma camada térmica que conserva o calor corporal — testada em temperaturas abaixo de 10°C." },
  { q: "Marca o corpo?", a: "Não. O tecido tem alta elasticidade e cintura confortável, modelando suavemente sem apertar ou deixar marcas." },
  { q: "Tem transparência elegante?", a: "Sim — o efeito translúcido natural lembra meias finas, mas com o conforto e calor de uma peça forrada." },
  { q: "Qual tamanho serve?", a: "Trabalhamos com P/M, G/GG e XG Plus (até 110kg). Consulte nosso guia de medidas para a referência exata da sua altura e quadril." },
  { q: "Como lavar?", a: "Lavagem à mão ou na máquina em ciclo delicado, água fria, dentro de saquinho de lavagem. Secar à sombra, sem torcer." },
  { q: "Pode usar no inverno intenso?", a: "Sim. É perfeita para o inverno brasileiro intenso e funciona excepcionalmente bem sob vestidos, saias e shorts." },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="bg-secondary/40 border-y border-border/60">
      <div className="mx-auto max-w-[900px] px-5 md:px-10 py-20 lg:py-28">
        <div className="text-center">
          <span className="text-[11px] tracking-luxe uppercase text-muted-foreground">Perguntas frequentes</span>
          <h2 className="mt-3 font-display text-4xl lg:text-5xl">Tudo que você precisa saber.</h2>
        </div>

        <div className="mt-12 border-t border-border/70">
          {ITEMS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q} className="border-b border-border/70">
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-6 py-6 text-left"
                >
                  <span className="font-display text-xl md:text-2xl">{item.q}</span>
                  <motion.span animate={{ rotate: isOpen ? 45 : 0 }} transition={{ duration: 0.3 }}>
                    <Plus className="h-5 w-5 shrink-0" strokeWidth={1.2} />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="pb-6 pr-12 text-[15px] leading-relaxed text-muted-foreground">{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
