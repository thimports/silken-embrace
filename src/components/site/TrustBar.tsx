import { Truck, Shield, RotateCcw, Lock } from "lucide-react";

const ITEMS = [
  { I: Truck, t: "Frete rápido", s: "Envio em 24h" },
  { I: Shield, t: "Garantia", s: "30 dias" },
  { I: RotateCcw, t: "Troca grátis", s: "Sem burocracia" },
  { I: Lock, t: "Compra segura", s: "SSL 256-bit" },
];

export function TrustBar() {
  return (
    <section className="bg-background border-t border-border/60">
      <div className="mx-auto max-w-[1100px] px-5 md:px-10 py-12 lg:py-16">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {ITEMS.map(({ I, t, s }) => (
            <div key={t} className="text-center">
              <I className="h-6 w-6 mx-auto text-foreground/70" strokeWidth={1.25} />
              <div className="mt-3 text-[13px] font-medium">{t}</div>
              <div className="text-[12px] text-muted-foreground">{s}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
