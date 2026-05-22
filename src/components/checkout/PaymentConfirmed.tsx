import { motion } from "motion/react";
import { Check } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function PaymentConfirmed() {
  return (
    <div className="mx-auto max-w-xl w-full py-10 md:py-16 text-center">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 18 }}
        className="mx-auto size-20 rounded-full bg-caramel/15 grid place-items-center mb-6"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 260, damping: 16 }}
          className="size-14 rounded-full bg-caramel grid place-items-center"
        >
          <Check className="h-7 w-7 text-background" strokeWidth={2.5} />
        </motion.div>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.3 }}
        className="font-display text-3xl md:text-4xl"
      >
        Pagamento confirmado
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.3 }}
        className="mt-4 text-sm text-muted-foreground leading-relaxed"
      >
        Seu código de rastreio chegará em até 12 horas no seu e-mail.
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.3 }}
        className="mt-10"
      >
        <Link
          to="/"
          className="inline-flex items-center justify-center px-8 py-4 text-[12px] tracking-luxe uppercase border border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors"
        >
          Voltar para a loja
        </Link>
      </motion.div>
    </div>
  );
}
