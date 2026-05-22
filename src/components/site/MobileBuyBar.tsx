import { Link } from "@tanstack/react-router";

export function MobileBuyBar() {
  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 glass border-t border-border px-4 py-3 flex items-center gap-3">
      <div className="flex-1">
        <div className="text-[10px] tracking-luxe uppercase text-muted-foreground">Hoje por</div>
        <div className="font-display text-lg leading-none mt-0.5">
          R$ 79,90 <span className="text-xs text-muted-foreground line-through">R$ 179,90</span>
        </div>
      </div>
      <Link
        to="/checkout"
        className="inline-flex items-center justify-center bg-foreground text-background px-6 py-3.5 text-[12px] tracking-luxe uppercase"
      >
        Comprar agora
      </Link>
    </div>
  );
}
