import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { adminDashboard } from "@/lib/admin.functions";
import { DollarSign, ShoppingBag, Clock, CreditCard, XCircle, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: DashboardPage,
});

const fmtBRL = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function DashboardPage() {
  const fn = useServerFn(adminDashboard);
  const [data, setData] = useState<Awaited<ReturnType<typeof adminDashboard>> | null>(null);

  useEffect(() => {
    const load = () => fn({}).then(setData).catch(() => {});
    load();
    const i = setInterval(load, 30000);
    return () => clearInterval(i);
  }, [fn]);

  if (!data) return <div className="p-10 text-neutral-500">Carregando…</div>;

  const k = data.kpis;
  const f = data.funnel;
  const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);

  const cards = [
    { label: "Faturamento (30d)", value: fmtBRL(k.revenueCents), icon: DollarSign, accent: "text-emerald-600" },
    { label: "Pedidos pagos", value: k.ordersPaid, icon: ShoppingBag },
    { label: "Aguardando PIX", value: k.ordersWaiting, icon: Clock },
    { label: "% PIX pago", value: `${k.pixPaidPct}%`, icon: TrendingUp },
    { label: "Tentativas cartão", value: k.cardAttempts, icon: CreditCard, sub: fmtBRL(k.cardAttemptValueCents) },
    { label: "Recusados", value: k.refusedCount, icon: XCircle, accent: "text-red-600" },
  ];

  const funnelRows = [
    ["Visitou produto", f.product_view],
    ["Entrou no checkout", f.checkout_started],
    ["Passou dos dados", f.step_shipping],
    ["Chegou na entrega", f.step_shipping],
    ["Chegou no pagamento", f.step_payment],
    ["Comprou (PIX gerado)", f.purchase],
  ] as const;

  const max = Math.max(1, ...funnelRows.map(([, n]) => n as number));
  const maxRev = Math.max(1, ...data.series.map((s) => s.revenueCents));

  return (
    <div className="p-8 max-w-[1400px]">
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Dashboard</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Últimos 30 dias · atualiza a cada 30s</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="bg-white border border-neutral-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500 uppercase tracking-wider">{c.label}</span>
              <c.icon className={`h-4 w-4 ${c.accent ?? "text-neutral-400"}`} strokeWidth={1.75} />
            </div>
            <div className={`mt-2 text-2xl font-semibold ${c.accent ?? "text-neutral-900"}`}>{c.value}</div>
            {c.sub && <div className="text-xs text-neutral-500 mt-1">{c.sub}</div>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-neutral-200 rounded-lg p-5">
          <h2 className="text-sm font-semibold text-neutral-900">Funil de conversão</h2>
          <p className="text-xs text-neutral-500 mb-4">Sessões únicas (30d)</p>
          <div className="space-y-2.5">
            {funnelRows.map(([label, n]) => {
              const v = n as number;
              const w = Math.round((v / max) * 100);
              const conv = pct(v, funnelRows[0][1] as number);
              return (
                <div key={label}>
                  <div className="flex justify-between text-xs text-neutral-600 mb-1">
                    <span>{label}</span>
                    <span><b className="text-neutral-900">{v}</b> · {conv}%</span>
                  </div>
                  <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div className="h-full bg-neutral-900 rounded-full" style={{ width: `${w}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-lg p-5">
          <h2 className="text-sm font-semibold text-neutral-900">Faturamento por dia</h2>
          <p className="text-xs text-neutral-500 mb-4">Últimos 14 dias</p>
          <div className="flex items-end gap-1.5 h-40">
            {data.series.map((s) => {
              const h = Math.max(2, Math.round((s.revenueCents / maxRev) * 100));
              return (
                <div key={s.date} className="flex-1 flex flex-col items-center gap-1.5" title={`${s.date} · ${fmtBRL(s.revenueCents)} · ${s.orders} pedido(s)`}>
                  <div className="w-full bg-emerald-500/80 rounded-t" style={{ height: `${h}%` }} />
                  <div className="text-[9px] text-neutral-400">{s.date.slice(8)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
