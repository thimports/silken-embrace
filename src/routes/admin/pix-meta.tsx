import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  adminListMetaPix,
  adminAddMetaPix,
  adminMarkMetaPixPaid,
  adminReleaseMetaPix,
  adminDeleteMetaPix,
  adminDeleteExpiredMetaPix,
  adminCheckMetaPixAtPsp,
} from "@/lib/pix-meta.functions";
import { Copy, Trash2, CheckCircle2, RotateCcw, Plus, AlertTriangle, Clock, CircleDollarSign, CircleCheckBig, Search } from "lucide-react";

export const Route = createFileRoute("/admin/pix-meta")({
  component: PixMetaPage,
});

type Row = {
  id: string;
  code: string;
  amount_cents: number;
  status: "available" | "in_use" | "paid" | "expired";
  position: number;
  expires_at: string;
  assigned_at: string | null;
  paid_at: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  created_at: string;
};

const fmtBRL = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (s: string | null) => (s ? new Date(s).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "—");

function PixMetaPage() {
  const list = useServerFn(adminListMetaPix);
  const add = useServerFn(adminAddMetaPix);
  const mark = useServerFn(adminMarkMetaPixPaid);
  const release = useServerFn(adminReleaseMetaPix);
  const del = useServerFn(adminDeleteMetaPix);
  const delExpired = useServerFn(adminDeleteExpiredMetaPix);
  const checkPsp = useServerFn(adminCheckMetaPixAtPsp);

  const [rows, setRows] = useState<Row[]>([]);
  const [counts, setCounts] = useState({ available: 0, in_use: 0, paid: 0, expired: 0 });
  const [codesText, setCodesText] = useState("");
  const [amountReais, setAmountReais] = useState("75.91");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = async () => {
    try {
      const r = await list({});
      setRows(r.rows as Row[]);
      setCounts(r.counts);
    } catch (e: any) {
      setMsg(e?.message || "Erro ao carregar");
    }
  };

  useEffect(() => {
    load();
    const i = setInterval(load, 15000);
    return () => clearInterval(i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const codeCount = useMemo(
    () => codesText.split("\n").map((s) => s.trim()).filter((s) => s.length > 20).length,
    [codesText]
  );

  const onAdd = async () => {
    setMsg(null);
    const codes = codesText.split("\n").map((s) => s.trim()).filter((s) => s.length > 20);
    if (codes.length === 0) return setMsg("Cole pelo menos 1 código PIX.");
    const cents = Math.round(parseFloat(amountReais.replace(",", ".")) * 100);
    if (!cents || cents <= 0) return setMsg("Valor inválido.");
    setBusy(true);
    try {
      const r = await add({ data: { codes, amountCents: cents, expiresInDays: 7 } });
      setMsg(`${r.inserted} PIX adicionados à fila.`);
      setCodesText("");
      await load();
    } catch (e: any) {
      setMsg(e?.message || "Falha ao adicionar.");
    } finally {
      setBusy(false);
    }
  };

  const onMark = async (id: string) => { await mark({ data: { id } }); await load(); };
  const onRelease = async (id: string) => { await release({ data: { id } }); await load(); };
  const onDelete = async (id: string) => {
    if (!confirm("Excluir este PIX da fila?")) return;
    await del({ data: { id } }); await load();
  };
  const onDeleteExpired = async () => {
    if (!confirm(`Excluir ${counts.expired} PIX expirados?`)) return;
    const r = await delExpired({});
    setMsg(`${r.deleted} expirados removidos.`);
    await load();
  };

  const copy = (s: string) => navigator.clipboard.writeText(s).catch(() => {});

  return (
    <div className="p-8 max-w-[1400px]">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-neutral-900">PIX Meta Ads</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Fila de PIX pré-gerados (R$ 75,91 cada) usada quando o cliente compra <b>somente a Meia-Calça</b>.
          O pagamento cai direto na sua conta do Meta Ads. Marque como pago manualmente quando confirmar no Gerenciador.
        </p>
      </div>

      {msg && (
        <div className="mb-4 px-3 py-2 text-sm rounded-md bg-amber-50 border border-amber-200 text-amber-800">{msg}</div>
      )}

      <div className="flex gap-3 mb-6 flex-wrap">
        <button
          onClick={async () => {
            setMsg(null);
            setBusy(true);
            try {
              const r = await checkPsp({});
              setMsg(`Verificados ${r.checked} · ${r.paid} marcados como pagos.`);
              await load();
            } catch (e: any) {
              setMsg(e?.message || "Falha na verificação.");
            } finally { setBusy(false); }
          }}
          disabled={busy || counts.in_use === 0}
          className="inline-flex items-center gap-2 px-3 py-2 text-xs rounded-md bg-white border border-neutral-300 text-neutral-800 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Search className="h-3.5 w-3.5" /> Verificar status no PSP ({counts.in_use} em uso)
        </button>
        <button
          onClick={onDeleteExpired}
          disabled={counts.expired === 0}
          className="inline-flex items-center gap-2 px-3 py-2 text-xs rounded-md bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Trash2 className="h-3.5 w-3.5" /> Excluir expirados ({counts.expired})
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Disponível", value: counts.available, color: "text-emerald-600", Icon: CircleCheckBig },
          { label: "Em uso", value: counts.in_use, color: "text-amber-600", Icon: Clock },
          { label: "Pago", value: counts.paid, color: "text-sky-600", Icon: CircleDollarSign },
          { label: "Expirado", value: counts.expired, color: "text-rose-600", Icon: AlertTriangle },
        ].map(({ label, value, color, Icon }) => (
          <div key={label} className="bg-white border border-neutral-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-neutral-500">
              <Icon className={`h-3.5 w-3.5 ${color}`} /> {label}
            </div>
            <div className={`text-3xl font-semibold mt-1 ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-neutral-200 rounded-lg p-5 mb-6">
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <div className="font-medium">Adicionar PIX à fila</div>
            <div className="text-xs text-neutral-500">Cole 1 código por linha. Eles entram como "Disponível" no fim da fila.</div>
          </div>
          <label className="flex items-center gap-2 text-xs text-neutral-600">
            Valor R$
            <input
              value={amountReais}
              onChange={(e) => setAmountReais(e.target.value)}
              className="w-24 px-2 py-1 border border-neutral-200 rounded text-right"
            />
          </label>
        </div>
        <textarea
          value={codesText}
          onChange={(e) => setCodesText(e.target.value)}
          rows={4}
          placeholder="00020101021226870014br.gov.bcb.pix..."
          className="w-full px-3 py-2 border border-neutral-200 rounded-md text-xs font-mono"
        />
        <div className="flex items-center justify-between mt-2">
          <div className="text-xs text-neutral-500">{codeCount} código(s) detectado(s)</div>
          <button
            onClick={onAdd}
            disabled={busy || codeCount === 0}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs rounded-md bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5" /> Adicionar à fila
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {rows.length === 0 && (
          <div className="text-center text-sm text-neutral-400 py-10 border border-dashed border-neutral-200 rounded-lg">
            Fila vazia.
          </div>
        )}
        {rows.map((r) => (
          <div key={r.id} className="bg-white border border-neutral-200 rounded-lg p-4 flex items-start gap-4">
            <div className="w-10 shrink-0 text-center">
              <div className="text-xs text-neutral-400">#</div>
              <div className="font-semibold text-neutral-700">{r.position}</div>
            </div>
            <div className="shrink-0">
              <StatusPill status={r.status} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-mono text-[11px] text-neutral-600 truncate">{r.code}</div>
              <div className="text-xs text-neutral-500 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                <span><b className="text-neutral-700">Valor:</b> {fmtBRL(r.amount_cents)}</span>
                {r.customer_name && <span><b className="text-neutral-700">Cliente:</b> {r.customer_name}</span>}
                {r.assigned_at && <span><b className="text-neutral-700">Gerado:</b> {fmtDate(r.assigned_at)}</span>}
                {r.paid_at && <span className="text-sky-600"><b>Pago:</b> {fmtDate(r.paid_at)}</span>}
                {r.status !== "paid" && <span><b className="text-neutral-700">Expira:</b> {fmtDate(r.expires_at)}</span>}
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button onClick={() => copy(r.code)} title="Copiar código" className="p-1.5 rounded hover:bg-neutral-100 text-neutral-600">
                <Copy className="h-4 w-4" />
              </button>
              {r.status === "in_use" && (
                <button onClick={() => onMark(r.id)} title="Marcar pago" className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-sky-600 text-white hover:bg-sky-700">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Marcar pago
                </button>
              )}
              {(r.status === "in_use" || r.status === "expired") && (
                <button onClick={() => onRelease(r.id)} title="Liberar de volta para disponível" className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded border border-neutral-200 text-neutral-700 hover:bg-neutral-50">
                  <RotateCcw className="h-3.5 w-3.5" /> Liberar
                </button>
              )}
              <button onClick={() => onDelete(r.id)} title="Excluir" className="p-1.5 rounded hover:bg-rose-50 text-rose-600 border border-rose-200">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: Row["status"] }) {
  const map: Record<Row["status"], { label: string; cls: string }> = {
    available: { label: "Disponível", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    in_use: { label: "Em uso", cls: "bg-amber-50 text-amber-700 border-amber-200" },
    paid: { label: "Pago", cls: "bg-sky-50 text-sky-700 border-sky-200" },
    expired: { label: "Expirado", cls: "bg-rose-50 text-rose-700 border-rose-200" },
  };
  const { label, cls } = map[status];
  return <span className={`inline-block text-[11px] px-2 py-0.5 rounded-full border ${cls}`}>{label}</span>;
}
