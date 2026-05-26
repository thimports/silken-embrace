import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { adminRefused } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/refused")({
  component: RefusedPage,
});

const fmtBRL = (c: number | null) => c == null ? "—" : (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (s: string) => new Date(s).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

function RefusedPage() {
  const fn = useServerFn(adminRefused);
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    const load = () => fn({}).then((r) => setRows(r.rows)).catch(() => {});
    load();
    const i = setInterval(load, 20000);
    return () => clearInterval(i);
  }, [fn]);

  return (
    <div className="p-8 max-w-[1400px]">
      <h1 className="text-2xl font-semibold text-neutral-900">Recusados</h1>
      <p className="text-sm text-neutral-500 mt-0.5 mb-6">Tentativas de gerar PIX que falharam ({rows.length})</p>

      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr className="text-left text-xs uppercase tracking-wider text-neutral-500">
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Contato</th>
                <th className="px-4 py-3">CPF</th>
                <th className="px-4 py-3 text-right">Valor</th>
                <th className="px-4 py-3">Erro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {rows.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-neutral-400">Nenhuma falha registrada.</td></tr>
              )}
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3 text-neutral-700 whitespace-nowrap">{fmtDate(r.created_at)}</td>
                  <td className="px-4 py-3 font-medium text-neutral-900">{r.customer_name || "—"}</td>
                  <td className="px-4 py-3 text-neutral-600">
                    <div>{r.customer_email || "—"}</div>
                    <div className="text-xs text-neutral-500">{r.customer_phone}</div>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{r.customer_cpf || "—"}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">{fmtBRL(r.amount_cents)}</td>
                  <td className="px-4 py-3 text-xs text-red-600 max-w-md truncate">{r.error_message || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
