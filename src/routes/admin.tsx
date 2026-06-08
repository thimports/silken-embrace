import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { adminCheck, adminLogout } from "@/lib/admin.functions";
import { LayoutDashboard, ShoppingBag, XCircle, CreditCard, Activity, LogOut, Loader2, Megaphone } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin · Lumière" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: AdminLayout,
});

function AdminLayout() {
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const check = useServerFn(adminCheck);
  const logout = useServerFn(adminLogout);
  const [state, setState] = useState<"loading" | "ok" | "denied">("loading");

  useEffect(() => {
    if (path === "/admin/login") { setState("ok"); return; }
    check({}).then((r) => {
      if (r.authed) setState("ok");
      else { setState("denied"); navigate({ to: "/admin/login" }); }
    }).catch(() => { setState("denied"); navigate({ to: "/admin/login" }); });
  }, [check, navigate, path]);

  if (path === "/admin/login") return <Outlet />;

  if (state !== "ok") {
    return (
      <div className="min-h-screen grid place-items-center bg-neutral-50">
        <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
      </div>
    );
  }

  const nav = [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin/orders", label: "Pedidos", icon: ShoppingBag },
    { to: "/admin/pix-meta", label: "PIX Meta Ads", icon: Megaphone },
    { to: "/admin/refused", label: "Recusados", icon: XCircle },
    { to: "/admin/cards", label: "Baú de Cartão", icon: CreditCard },
    { to: "/admin/live", label: "Ao Vivo", icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      <aside className="w-60 shrink-0 bg-white border-r border-neutral-200 flex flex-col">
        <div className="px-5 py-5 border-b border-neutral-200">
          <div className="text-xs uppercase tracking-widest text-neutral-500">Admin</div>
          <div className="font-semibold text-lg">Lumière</div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map(({ to, label, icon: Icon }) => {
            const active = to === "/admin" ? path === "/admin" : path.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                  active ? "bg-neutral-900 text-white" : "text-neutral-700 hover:bg-neutral-100"
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={1.75} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-neutral-200">
          <button
            onClick={async () => { await logout({}); navigate({ to: "/admin/login" }); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-neutral-700 hover:bg-neutral-100"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.75} /> Sair
          </button>
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
