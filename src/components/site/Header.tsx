import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";
import { Menu, ShoppingBag, Search, X, Heart } from "lucide-react";

const NAV = [
  { label: "Novidades", href: "/" },
  { label: "Meias & Tights", href: "/" },
  { label: "Lookbook", href: "/#lookbook" },
  { label: "Sobre", href: "/" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <div className="bg-primary text-primary-foreground text-[11px] tracking-luxe uppercase py-2 overflow-hidden">
        <div className="flex w-max animate-marquee whitespace-nowrap">
          {[0, 1].map((k) => (
            <div key={k} className="flex shrink-0 items-center">
              {[
                "Frete grátis acima de R$ 199",
                "Entrega para todo Brasil",
                "60% Off nesse inverno",
              ].map((msg) => (
                <span key={`${k}-${msg}`} className="flex items-center px-8">
                  {msg}
                  <span className="ml-16 opacity-50">·</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
      <motion.header
        initial={false}
        animate={{
          backgroundColor: scrolled ? "oklch(0.985 0.008 80 / 0.78)" : "oklch(0.985 0.008 80 / 0)",
          borderColor: scrolled ? "oklch(0.9 0.012 75 / 1)" : "oklch(0.9 0.012 75 / 0)",
        }}
        className={`sticky top-0 z-40 ${scrolled ? "glass" : ""} border-b transition-all`}
      >
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-6 px-5 md:h-20 md:px-10">
          <button
            onClick={() => setOpen(true)}
            className="lg:hidden -ml-2 p-2 text-foreground"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" strokeWidth={1.5} />
          </button>

          <nav className="hidden lg:flex items-center gap-9 text-[13px] font-medium text-foreground/80">
            {NAV.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className="relative hover:text-foreground transition-colors after:absolute after:left-0 after:-bottom-1 after:h-px after:w-0 after:bg-foreground after:transition-all hover:after:w-full"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <Link
            to="/"
            className="absolute left-1/2 -translate-x-1/2 font-display text-2xl md:text-[28px] tracking-[0.2em] uppercase text-foreground"
          >
            Lumière
          </Link>

          <div className="flex items-center gap-1 md:gap-3 text-foreground/80">
            <button className="hidden md:inline-flex p-2 hover:text-foreground" aria-label="Buscar">
              <Search className="h-[18px] w-[18px]" strokeWidth={1.5} />
            </button>
            <button className="hidden md:inline-flex p-2 hover:text-foreground" aria-label="Favoritos">
              <Heart className="h-[18px] w-[18px]" strokeWidth={1.5} />
            </button>
            <button className="relative p-2 hover:text-foreground" aria-label="Carrinho">
              <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.5} />
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-foreground px-1 text-[10px] font-medium text-background">
                1
              </span>
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/30"
            onClick={() => setOpen(false)}
          >
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
              className="h-full w-[82%] max-w-sm bg-background p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-10">
                <span className="font-display text-xl tracking-[0.2em] uppercase">Lumière</span>
                <button onClick={() => setOpen(false)} aria-label="Fechar">
                  <X className="h-5 w-5" strokeWidth={1.5} />
                </button>
              </div>
              <nav className="flex flex-col gap-5">
                {NAV.map((n) => (
                  <Link
                    key={n.label}
                    to={n.href}
                    onClick={() => setOpen(false)}
                    className="font-display text-3xl text-foreground"
                  >
                    {n.label}
                  </Link>
                ))}
              </nav>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
