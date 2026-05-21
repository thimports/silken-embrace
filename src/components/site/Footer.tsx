import { Instagram, Lock, Shield } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-foreground text-background">
      <div className="mx-auto max-w-[1400px] px-5 md:px-10 py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-10">
          <div>
            <div className="font-display text-3xl tracking-[0.2em] uppercase">Lumière</div>
            <p className="mt-4 max-w-xs text-sm text-background/70 leading-relaxed">
              Moda íntima e legwear premium para mulheres que escolhem o conforto sem abrir mão da elegância.
            </p>
            <div className="mt-6 flex items-center gap-4 text-background/70">
              <a href="#" aria-label="Instagram"><Instagram className="h-4 w-4" strokeWidth={1.5} /></a>
            </div>
          </div>
          {[
            { t: "Loja", l: ["Novidades", "Mais vendidos", "Meias térmicas", "Plus size"] },
            { t: "Ajuda", l: ["Contato", "Trocas & devoluções", "Frete & entrega", "Guia de medidas"] },
            { t: "Institucional", l: ["Sobre", "Sustentabilidade", "Termos", "Privacidade"] },
          ].map((s) => (
            <div key={s.t}>
              <div className="text-[11px] tracking-luxe uppercase text-background/50">{s.t}</div>
              <ul className="mt-4 space-y-2.5 text-sm text-background/85">
                {s.l.map((x) => <li key={x}><a href="#" className="hover:text-background">{x}</a></li>)}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 pt-6 border-t border-background/10 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] tracking-luxe uppercase text-background/50">
          <span>© 2026 Lumière · Todos os direitos reservados</span>
          <div className="flex items-center gap-5">
            <span className="inline-flex items-center gap-2"><Lock className="h-3.5 w-3.5" strokeWidth={1.5} /> SSL seguro</span>
            <span className="inline-flex items-center gap-2"><Shield className="h-3.5 w-3.5" strokeWidth={1.5} /> Garantia 30 dias</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
