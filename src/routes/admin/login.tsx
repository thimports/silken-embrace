import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { adminLogin } from "@/lib/admin.functions";
import { Lock, Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const login = useServerFn(adminLogin);
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); setLoading(true);
    try {
      const r = await login({ data: { password: pwd } });
      if (r.ok) navigate({ to: "/admin" });
      else setErr("Senha incorreta");
    } catch {
      setErr("Erro ao entrar. Tente novamente.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-neutral-50 px-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-white border border-neutral-200 rounded-lg p-8 shadow-sm">
        <div className="size-10 rounded-full bg-neutral-900 text-white grid place-items-center mb-5">
          <Lock className="h-4 w-4" strokeWidth={1.75} />
        </div>
        <h1 className="text-xl font-semibold text-neutral-900">Painel Lumière</h1>
        <p className="text-sm text-neutral-500 mt-1">Acesso restrito.</p>

        <label className="block mt-6">
          <span className="text-xs font-medium text-neutral-700">Senha</span>
          <input
            type="password"
            autoFocus
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            className="mt-1.5 w-full border border-neutral-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900"
            placeholder="••••••"
          />
        </label>

        {err && <div className="mt-3 text-sm text-red-600">{err}</div>}

        <button
          type="submit"
          disabled={loading || !pwd}
          className="mt-5 w-full inline-flex items-center justify-center gap-2 bg-neutral-900 text-white text-sm font-medium py-2.5 rounded-md hover:bg-neutral-800 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Entrar
        </button>
      </form>
    </div>
  );
}
