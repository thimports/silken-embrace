import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { adminOrders } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/orders")({
  component: OrdersPage,
});

const fmtBRL = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (s: string) => new Date(s).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

function OrdersPage() {
  const fn = useServerFn(adminOrders);
  const [rows, setRows] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | "paid" | "waiting_payment">("all");
  const [gateway, setGateway] = useState<"all" | "primecash" | "buypix">("all");

  const gatewayOf = (txId?: string | null): "primecash" | "buypix" | "unknown" => {
    if (!txId) return "unknown";
    if (/^[0-9]+$/.test(txId)) return "buypix";
    if (/^[0-9a-f]{8}-/i.test(txId)) return "primecash";
    return "unknown";
  };

  useEffect(() => {
    const load = () => fn({}).then((r) => setRows(r.rows)).catch(() => {});
    load();
    const i = setInterval(load, 20000);
    return () => clearInterval(i);
  }, [fn]);

  const filtered = rows.filter((r) => {
    const okStatus = filter === "all" || r.status === filter;
    const okGateway = gateway === "all" || gatewayOf(r.transaction_id) === gateway;
    return okStatus && okGateway;
  });

  const countBuypix = rows.filter((r) => gatewayOf(r.transaction_id) === "buypix").length;
  const countPrimecash = rows.filter((r) => gatewayOf(r.transaction_id) === "primecash").length;

  return (
    <div className="p-8 max-w-[1400px]">
      <div className="flex items-baseline justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Pedidos</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            {rows.length} no total · {countPrimecash} PrimeCash · {countBuypix} BuyPix
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="flex gap-1 bg-white border border-neutral-200 rounded-md p-1">
            {(["all", "primecash", "buypix"] as const).map((g) => (
              <button key={g} onClick={() => setGateway(g)}
                className={`px-3 py-1.5 text-xs rounded ${gateway === g ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100"}`}>
                {g === "all" ? "Todos gateways" : g === "primecash" ? "PrimeCash" : "BuyPix"}
              </button>
            ))}
          </div>
          <div className="flex gap-1 bg-white border border-neutral-200 rounded-md p-1">
            {(["all", "paid", "waiting_payment"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs rounded ${filter === f ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100"}`}>
                {f === "all" ? "Todos" : f === "paid" ? "Pagos" : "Aguardando"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr className="text-left text-xs uppercase tracking-wider text-neutral-500">
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Contato</th>
                <th className="px-4 py-3">CPF</th>
                <th className="px-4 py-3">Cidade/UF</th>
                <th className="px-4 py-3 text-right">Valor</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Gateway</th>
                <th className="px-4 py-3">Tx ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-neutral-400">Nenhum pedido ainda.</td></tr>
              )}
              {filtered.map((r) => {
                const gw = gatewayOf(r.transaction_id);
                return (
                <tr key={r.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3 text-neutral-700 whitespace-nowrap">{fmtDate(r.created_at)}</td>
                  <td className="px-4 py-3 font-medium text-neutral-900">{r.customer_name}{r.is_upsell && <span className="ml-2 text-[10px] uppercase bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">Upsell</span>}</td>
                  <td className="px-4 py-3 text-neutral-600">
                    <div>{r.customer_email}</div>
                    <div className="text-xs text-neutral-500">{r.customer_phone}</div>
                  </td>
                  <td className="px-4 py-3 text-neutral-600 whitespace-nowrap">{r.customer_cpf}</td>
                  <td className="px-4 py-3 text-neutral-600">
                    {r.address?.city ? `${r.address.city}/${r.address.state ?? ""}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-neutral-900 whitespace-nowrap">{fmtBRL(r.amount_cents)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${
                      r.status === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {r.status === "paid" ? "Pago" : "Aguardando"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${
                      gw === "primecash" ? "bg-indigo-100 text-indigo-700" :
                      gw === "buypix" ? "bg-sky-100 text-sky-700" :
                      "bg-neutral-100 text-neutral-600"
                    }`}>
                      {gw === "primecash" ? "PrimeCash" : gw === "buypix" ? "BuyPix" : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-500 font-mono">{r.transaction_id}</td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
