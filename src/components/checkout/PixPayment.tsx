import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Copy, CheckCircle2, Clock, ShieldCheck, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { getTransactionStatus } from "@/lib/primecash.functions";
import { getMetaPixStatus } from "@/lib/pix-meta.functions";
import hero from "@/assets/product-1.webp";

type Props = {
  transaction: {
    id: string;
    amount: number;
    pix: { qrcode: string; expirationDate?: string };
  };
  productTitle: string;
  productMeta: string;
  onPaid?: () => void;
};

export function PixPayment({ transaction, productTitle, productMeta, onPaid }: Props) {
  const [qrSrc, setQrSrc] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<"waiting" | "paid">("waiting");
  const checkPrimecash = useServerFn(getTransactionStatus);
  const checkMeta = useServerFn(getMetaPixStatus);
  const isMeta = transaction.id.startsWith("meta-");
  const polling = useRef<number | null>(null);

  const amountBR = (transaction.amount / 100).toFixed(2).replace(".", ",");

  useEffect(() => {
    QRCode.toDataURL(transaction.pix.qrcode, { margin: 1, width: 320 }).then(setQrSrc).catch(() => {});
  }, [transaction.pix.qrcode]);

  useEffect(() => {
    const tick = async () => {
      try {
        const r = isMeta
          ? await checkMeta({ data: { id: transaction.id } })
          : await checkPrimecash({ data: { id: transaction.id } });
        if (r.status === "paid") {
          setStatus("paid");
          if (polling.current) window.clearInterval(polling.current);
          onPaid?.();
        }
      } catch {
        // ignore
      }
    };
    polling.current = window.setInterval(tick, 5000);
    return () => { if (polling.current) window.clearInterval(polling.current); };
  }, [transaction.id, isMeta, checkMeta, checkPrimecash, onPaid]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(transaction.pix.qrcode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="mx-auto max-w-xl w-full space-y-5">
      <div className="text-center">
        <div className="mx-auto size-12 rounded-full bg-foreground/[0.04] border border-border grid place-items-center mb-3">
          <ShieldCheck className="h-5 w-5 text-caramel" strokeWidth={1.5} />
        </div>
        <h2 className="font-display text-2xl md:text-3xl">PIX gerado com sucesso!</h2>
        <p className="text-sm text-muted-foreground mt-2">Escaneie o QR Code ou copie o código abaixo</p>
      </div>

      <div className="bg-background border border-border shadow-soft">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-secondary/40">
          <span className="text-[11px] tracking-luxe uppercase text-muted-foreground">Valor a pagar</span>
          <span className="font-display text-xl">R$ {amountBR}</span>
        </div>

        <div className="p-6 flex flex-col items-center gap-4">
          <div className="bg-background border border-border p-3">
            {qrSrc ? (
              <img src={qrSrc} alt="QR Code PIX" className="size-56 block" />
            ) : (
              <div className="size-56 grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            )}
          </div>

          <div className="w-full flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[10px] tracking-luxe uppercase text-muted-foreground">ou copie o código</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="w-full font-mono text-[12px] text-foreground/80 bg-secondary/50 border border-border px-3 py-2.5 truncate">
            {transaction.pix.qrcode}
          </div>

          <button
            onClick={copy}
            className="w-full inline-flex items-center justify-center gap-2 bg-foreground text-background px-6 py-4 text-[12px] tracking-luxe uppercase hover:bg-foreground/90 transition-colors"
          >
            {copied ? <><CheckCircle2 className="h-4 w-4" strokeWidth={1.5} /> Código copiado</> : <><Copy className="h-4 w-4" strokeWidth={1.5} /> Copiar código PIX</>}
          </button>
        </div>
      </div>

      <div className="bg-background border border-border p-4 flex items-center gap-3">
        <div className="size-12 shrink-0 overflow-hidden bg-secondary">
          <img src={hero} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-medium leading-snug truncate">{productTitle}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5 truncate">{productMeta}</div>
        </div>
        <div className="font-display text-sm whitespace-nowrap">R$ {amountBR}</div>
      </div>

      <div className="bg-background border border-border p-5">
        <div className="text-sm font-medium mb-4">Como pagar com PIX</div>
        <ol className="space-y-3">
          {[
            ["Abra o app do seu banco", "Acesse o aplicativo do banco ou instituição financeira de sua preferência."],
            ["Selecione a opção PIX", "No menu do app, procure por \"Pix\" ou \"Pagar com Pix\"."],
            ["Escaneie o QR Code ou cole o código", "Aponte a câmera para o QR Code acima ou escolha \"Pix Copia e Cola\" e cole o código copiado."],
            ["Confirme o pagamento", "Verifique o valor e confirme. A aprovação é instantânea!"],
          ].map(([t, d], i) => (
            <li key={i} className="flex gap-3">
              <div className="size-6 shrink-0 rounded-full bg-foreground text-background grid place-items-center text-[11px] font-medium">{i + 1}</div>
              <div className="min-w-0">
                <div className="text-[13px] font-medium">{t}</div>
                <div className="text-[12px] text-muted-foreground leading-snug">{d}</div>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className={`flex items-center gap-2 px-4 py-3 text-[12px] border ${status === "paid" ? "bg-caramel/10 border-caramel text-foreground" : "bg-secondary/60 border-border text-foreground/80"}`}>
        {status === "paid" ? (
          <><CheckCircle2 className="h-4 w-4 text-caramel" strokeWidth={1.5} /> Pagamento confirmado! Você receberá um e-mail com os detalhes.</>
        ) : (
          <><Clock className="h-4 w-4 animate-pulse" strokeWidth={1.5} /> Aguardando confirmação do pagamento…</>
        )}
      </div>
    </div>
  );
}
