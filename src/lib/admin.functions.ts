import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { ADMIN_PASSWORD, ADMIN_SESSION_CONFIG } from "./admin-auth.server";
import { z } from "zod";

type AdminSession = { authed?: boolean };

async function requireAdmin() {
  const session = await useSession<AdminSession>(ADMIN_SESSION_CONFIG);
  if (!session.data.authed) {
    throw new Error("UNAUTHORIZED");
  }
}

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string }) =>
    z.object({ password: z.string().min(1).max(100) }).parse(d))
  .handler(async ({ data }) => {
    if (data.password !== ADMIN_PASSWORD) {
      // small artificial delay to slow brute force
      await new Promise((r) => setTimeout(r, 400));
      return { ok: false as const };
    }
    const session = await useSession<AdminSession>(ADMIN_SESSION_CONFIG);
    await session.update({ authed: true });
    return { ok: true as const };
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  const session = await useSession<AdminSession>(ADMIN_SESSION_CONFIG);
  await session.clear();
  return { ok: true };
});

export const adminCheck = createServerFn({ method: "GET" }).handler(async () => {
  const session = await useSession<AdminSession>(ADMIN_SESSION_CONFIG);
  return { authed: Boolean(session.data.authed) };
});

// ---------- Data queries ----------

export const adminDashboard = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [evRes, ordersRes, refusedRes, cardsRes] = await Promise.all([
    supabaseAdmin.from("funnel_events").select("event_type,session_id").gte("created_at", since),
    supabaseAdmin.from("orders").select("amount_cents,status,created_at,paid_at,is_upsell").gte("created_at", since),
    supabaseAdmin.from("refused_payments").select("id").gte("created_at", since),
    supabaseAdmin.from("card_attempts").select("id,amount_cents").gte("created_at", since),
  ]);

  const events = evRes.data ?? [];
  const orders = ordersRes.data ?? [];
  const refusedCount = refusedRes.data?.length ?? 0;
  const cardAttempts = cardsRes.data ?? [];

  const uniqSessions = (type: string) =>
    new Set(events.filter((e) => e.event_type === type).map((e) => e.session_id)).size;

  const funnel = {
    product_view: uniqSessions("product_view"),
    checkout_started: uniqSessions("checkout_started"),
    step_data: uniqSessions("step_data"),
    step_shipping: uniqSessions("step_shipping"),
    step_payment: uniqSessions("step_payment"),
    purchase: uniqSessions("purchase"),
  };

  const paidOrders = orders.filter((o) => o.status === "paid");
  const revenueCents = paidOrders.reduce((acc, o) => acc + (o.amount_cents || 0), 0);
  const waitingCount = orders.filter((o) => o.status === "waiting_payment").length;
  const pixPaidPct = orders.length
    ? Math.round((paidOrders.length / orders.length) * 100)
    : 0;
  const cardAttemptValueCents = cardAttempts.reduce((a, c) => a + (c.amount_cents || 0), 0);

  // last 14 days revenue series
  const days: { date: string; revenueCents: number; orders: number }[] = [];
  const dayMap = new Map<string, { revenueCents: number; orders: number }>();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    dayMap.set(key, { revenueCents: 0, orders: 0 });
  }
  for (const o of paidOrders) {
    const key = (o.paid_at || o.created_at || "").slice(0, 10);
    const e = dayMap.get(key);
    if (e) { e.revenueCents += o.amount_cents || 0; e.orders += 1; }
  }
  for (const [date, v] of dayMap) days.push({ date, ...v });

  return {
    kpis: {
      revenueCents,
      ordersPaid: paidOrders.length,
      ordersWaiting: waitingCount,
      ordersTotal: orders.length,
      pixPaidPct,
      cardAttempts: cardAttempts.length,
      cardAttemptValueCents,
      refusedCount,
      upsellPaid: paidOrders.filter((o) => o.is_upsell).length,
    },
    funnel,
    series: days,
  };
});

export const adminOrders = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const { data } = await supabaseAdmin
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  return { rows: data ?? [] };
});

export const adminRefused = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const { data } = await supabaseAdmin
    .from("refused_payments")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  return { rows: data ?? [] };
});

export const adminCards = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const { data } = await supabaseAdmin
    .from("card_attempts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  return { rows: data ?? [] };
});

export const adminLive = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const cutoff = new Date(Date.now() - 30 * 1000).toISOString();
  const { data } = await supabaseAdmin
    .from("live_presence")
    .select("*")
    .gte("last_seen", cutoff)
    .order("last_seen", { ascending: false })
    .limit(500);
  const rows = data ?? [];
  // Group by page
  const byPage: Record<string, number> = {};
  const byIp = new Set<string>();
  for (const r of rows) {
    const p = (r.page || "/").split("?")[0];
    byPage[p] = (byPage[p] || 0) + 1;
    if (r.ip) byIp.add(r.ip);
  }
  return { rows, byPage, uniqueIps: byIp.size, total: rows.length };
});
