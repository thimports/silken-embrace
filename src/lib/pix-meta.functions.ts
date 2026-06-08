import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { ADMIN_SESSION_CONFIG } from "./admin-auth.server";
import { z } from "zod";

type AdminSession = { authed?: boolean };

async function requireAdmin() {
  const session = await useSession<AdminSession>(ADMIN_SESSION_CONFIG);
  if (!session.data.authed) throw new Error("UNAUTHORIZED");
}

// Marca expirados automaticamente
async function autoExpire() {
  await supabaseAdmin
    .from("pix_meta_ads")
    .update({ status: "expired" })
    .lt("expires_at", new Date().toISOString())
    .in("status", ["available", "in_use"]);
}

// --- Público: usado pelo checkout para "puxar" o próximo PIX da fila ---
export const claimMetaPix = createServerFn({ method: "POST" })
  .inputValidator((d: {
    amountCents: number;
    customer: { name: string; email: string; phone: string; cpf: string };
  }) =>
    z.object({
      amountCents: z.number().int().positive(),
      customer: z.object({
        name: z.string().min(1).max(200),
        email: z.string().email().max(200),
        phone: z.string().min(1).max(40),
        cpf: z.string().min(1).max(20),
      }),
    }).parse(d)
  )
  .handler(async ({ data }) => {
    await autoExpire();

    // Pega o próximo PIX disponível, com o mesmo valor, ordenado por position
    const { data: candidate, error: selErr } = await supabaseAdmin
      .from("pix_meta_ads")
      .select("id, code, amount_cents, position, expires_at")
      .eq("status", "available")
      .eq("amount_cents", data.amountCents)
      .gt("expires_at", new Date().toISOString())
      .order("position", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (selErr) throw new Error(selErr.message);
    if (!candidate) {
      throw new Error("Sem PIX disponível no momento. Tente novamente em instantes.");
    }

    // Reivindica de forma atômica (CAS por status)
    const { data: claimed, error: updErr } = await supabaseAdmin
      .from("pix_meta_ads")
      .update({
        status: "in_use",
        assigned_at: new Date().toISOString(),
        customer_name: data.customer.name,
        customer_email: data.customer.email,
        customer_phone: data.customer.phone,
        customer_cpf: data.customer.cpf,
      })
      .eq("id", candidate.id)
      .eq("status", "available")
      .select("id, code, amount_cents, expires_at, position")
      .maybeSingle();

    if (updErr) throw new Error(updErr.message);
    if (!claimed) {
      // race — tenta de novo uma vez
      return claimMetaPix({ data });
    }

    return {
      id: `meta-${claimed.id}`,
      amount: claimed.amount_cents,
      pix: { qrcode: claimed.code, expirationDate: claimed.expires_at },
      position: claimed.position,
    };
  });

// Status check usado pelo PixPayment polling. Devolve "paid" se o admin marcou.
export const getMetaPixStatus = createServerFn({ method: "GET" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    const id = data.id.replace(/^meta-/, "");
    const { data: row } = await supabaseAdmin
      .from("pix_meta_ads")
      .select("id,status,paid_at")
      .eq("id", id)
      .maybeSingle();
    return {
      id: data.id,
      status: row?.status === "paid" ? "paid" : "pending",
      paidAt: row?.paid_at ?? null,
    };
  });

// --- Admin ---

export const adminListMetaPix = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  await autoExpire();
  const { data, error } = await supabaseAdmin
    .from("pix_meta_ads")
    .select("*")
    .order("position", { ascending: true });
  if (error) throw new Error(error.message);

  const counts = { available: 0, in_use: 0, paid: 0, expired: 0 };
  for (const r of data || []) {
    counts[r.status as keyof typeof counts]++;
  }
  return { rows: data || [], counts };
});

export const adminAddMetaPix = createServerFn({ method: "POST" })
  .inputValidator((d: { codes: string[]; amountCents: number; expiresInDays?: number }) =>
    z.object({
      codes: z.array(z.string().min(20).max(2000)).min(1).max(100),
      amountCents: z.number().int().positive(),
      expiresInDays: z.number().int().min(1).max(60).optional(),
    }).parse(d)
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const { data: last } = await supabaseAdmin
      .from("pix_meta_ads")
      .select("position")
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();
    let nextPos = (last?.position ?? 0) + 1;
    const days = data.expiresInDays ?? 7;
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

    const rows = data.codes.map((code) => ({
      code: code.trim(),
      amount_cents: data.amountCents,
      status: "available" as const,
      position: nextPos++,
      expires_at: expires,
    }));

    const { error, count } = await supabaseAdmin
      .from("pix_meta_ads")
      .insert(rows, { count: "exact" });
    if (error) throw new Error(error.message);
    return { ok: true, inserted: count ?? rows.length };
  });

export const adminMarkMetaPixPaid = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await requireAdmin();
    const { error } = await supabaseAdmin
      .from("pix_meta_ads")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminReleaseMetaPix = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await requireAdmin();
    const { error } = await supabaseAdmin
      .from("pix_meta_ads")
      .update({
        status: "available",
        released_at: new Date().toISOString(),
        assigned_at: null,
        customer_name: null,
        customer_email: null,
        customer_phone: null,
        customer_cpf: null,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteMetaPix = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await requireAdmin();
    const { error } = await supabaseAdmin
      .from("pix_meta_ads")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteExpiredMetaPix = createServerFn({ method: "POST" }).handler(async () => {
  await requireAdmin();
  const { error, count } = await supabaseAdmin
    .from("pix_meta_ads")
    .delete({ count: "exact" })
    .eq("status", "expired");
  if (error) throw new Error(error.message);
  return { ok: true, deleted: count ?? 0 };
});
