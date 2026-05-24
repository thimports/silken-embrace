import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { adminLive } from "@/lib/admin.functions";
import { Activity } from "lucide-react";

export const Route = createFileRoute("/admin/live")({
  component: LivePage,
});

const fmtTime = (s: string) => {
  const diff = Math.round((Date.now() - new Date(s).getTime()) / 1000);
  if (diff < 5) return "agora";
  if (diff < 60) return `${diff}s atrás`;
  return `${Math.round(diff / 60)}m atrás`;
};

function LivePage() {
  const fn = useServerFn(adminLive);
  const [data, setData] = useState<Awaited<ReturnType<typeof adminLive>> | null>(null);

  useEffect(() => {
    const load = () => fn({}).then(setData).catch(() => {});
    load();
    const i = setInterval(load, 5000);
    return () => clearInterval(i);
  }, [fn]);

  if (!data) return <div className="p-10 text-neutral-500">Carregando…</div>;

  const pageLabel = (p: string) => {
    if (p === "/") return "Página inicial";
    if (p === "/checkout") return "Checkout";
    if (p === "/upsell") return "Upsell";
    return p;
  };

  return (
    <div className="p-8 max-w-[1400px]">
      <div className="flex items-center gap-3 mb-6">
        <div className="relative">
          <Activity className="h-6 w-6 text-emerald-600" strokeWidth={1.75} />
          <span className="absolute -top-0.5 -right-0.5 size-2 bg-emerald-500 rounded-full animate-pulse" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Ao Vivo</h1>
          <p className="text-sm text-neutral-500">Atualiza a cada 5s · sessões ativas nos últimos 30s</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        <div className="bg-white border border-neutral-200 rounded-lg p-5">
          <div className="text-xs uppercase tracking-wider text-neutral-500">Pessoas online</div>
          <div className="text-3xl font-semibold text-emerald-600 mt-2">{data.total}</div>
        </div>
        <div className="bg-white border border-neutral-200 rounded-lg p-5">
          <div className="text-xs uppercase tracking-wider text-neutral-500">IPs únicos</div>
          <div className="text-3xl font-semibold text-neutral-900 mt-2">{data.uniqueIps}</div>
        </div>
        <div className="bg-white border border-neutral-200 rounded-lg p-5">
          <div className="text-xs uppercase tracking-wider text-neutral-500">Páginas ativas</div>
          <div className="text-3xl font-semibold text-neutral-900 mt-2">{Object.keys(data.byPage).length}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-neutral-200 rounded-lg p-5">
          <h2 className="text-sm font-semibold mb-3">Por página</h2>
          <div className="space-y-2">
            {Object.entries(data.byPage).sort((a, b) => b[1] - a[1]).map(([p, n]) => (
              <div key={p} className="flex justify-between text-sm">
                <span className="text-neutral-700">{pageLabel(p)}</span>
                <span className="font-medium text-neutral-900">{n}</span>
              </div>
            ))}
            {Object.keys(data.byPage).length === 0 && (
              <div className="text-sm text-neutral-400">Ninguém online no momento.</div>
            )}
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden lg:col-span-2">
          <div className="px-5 py-3 border-b border-neutral-200">
            <h2 className="text-sm font-semibold">Sessões ativas</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr className="text-left text-xs uppercase tracking-wider text-neutral-500">
                  <th className="px-4 py-2.5">IP</th>
                  <th className="px-4 py-2.5">Página</th>
                  <th className="px-4 py-2.5">Último ping</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {data.rows.length === 0 && (
                  <tr><td colSpan={3} className="px-4 py-10 text-center text-neutral-400">Sem sessões ativas.</td></tr>
                )}
                {data.rows.map((r) => (
                  <tr key={r.session_id}>
                    <td className="px-4 py-2.5 font-mono text-xs text-neutral-700">{r.ip || "—"}</td>
                    <td className="px-4 py-2.5 text-neutral-700">{pageLabel(r.page || "/")}</td>
                    <td className="px-4 py-2.5 text-xs text-neutral-500">{fmtTime(r.last_seen)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
