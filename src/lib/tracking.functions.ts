import { createServerFn } from "@tanstack/react-start";
import { getRequestIP, getRequestHeader } from "@tanstack/react-start/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

const ctx = () => {
  let ip: string | undefined;
  let ua: string | undefined;
  try { ip = getRequestIP({ xForwardedFor: true }) || undefined; } catch {}
  try { ua = getRequestHeader("user-agent") || undefined; } catch {}
  return { ip, ua };
};

const EventSchema = z.object({
  sessionId: z.string().min(1).max(80),
  eventType: z.enum([
    "product_view",
    "checkout_started",
    "step_data",
    "step_shipping",
    "step_payment",
    "purchase",
    "pix_failed",
    "card_attempt",
  ]),
  page: z.string().max(200).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const trackEvent = createServerFn({ method: "POST" })
  .inputValidator((d) => EventSchema.parse(d))
  .handler(async ({ data }) => {
    const { ip, ua } = ctx();
    await supabaseAdmin.from("funnel_events").insert({
      session_id: data.sessionId,
      ip, user_agent: ua,
      event_type: data.eventType,
      page: data.page ?? null,
      metadata: data.metadata ?? {},
    });
    return { ok: true };
  });

const HeartbeatSchema = z.object({
  sessionId: z.string().min(1).max(80),
  page: z.string().max(200),
});

export const heartbeat = createServerFn({ method: "POST" })
  .inputValidator((d) => HeartbeatSchema.parse(d))
  .handler(async ({ data }) => {
    const { ip, ua } = ctx();
    await supabaseAdmin.from("live_presence").upsert({
      session_id: data.sessionId,
      ip, user_agent: ua,
      page: data.page,
      last_seen: new Date().toISOString(),
    });
    return { ok: true };
  });

const OrderSchema = z.object({
  transactionId: z.number().int(),
  customer: z.object({
    name: z.string().min(1).max(200),
    email: z.string().email().max(255),
    phone: z.string().max(40).optional().nullable(),
    cpf: z.string().max(20).optional().nullable(),
  }),
  address: z.record(z.string(), z.any()).optional().nullable(),
  amountCents: z.number().int().min(0),
  pixQrcode: z.string().max(2000).optional().nullable(),
  isUpsell: z.boolean().optional(),
  sessionId: z.string().max(80).optional(),
});

export const recordOrder = createServerFn({ method: "POST" })
  .inputValidator((d) => OrderSchema.parse(d))
  .handler(async ({ data }) => {
    const { ip, ua } = ctx();
    await supabaseAdmin.from("orders").upsert({
      transaction_id: data.transactionId,
      customer_name: data.customer.name,
      customer_email: data.customer.email,
      customer_phone: data.customer.phone ?? null,
      customer_cpf: data.customer.cpf ?? null,
      address: data.address ?? null,
      amount_cents: data.amountCents,
      status: "waiting_payment",
      payment_method: "pix",
      pix_qrcode: data.pixQrcode ?? null,
      is_upsell: data.isUpsell ?? false,
      ip, user_agent: ua,
      session_id: data.sessionId ?? null,
    }, { onConflict: "transaction_id" });
    return { ok: true };
  });

export const markOrderPaid = createServerFn({ method: "POST" })
  .inputValidator((d: { transactionId: number }) => z.object({ transactionId: z.number().int() }).parse(d))
  .handler(async ({ data }) => {
    await supabaseAdmin.from("orders")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("transaction_id", data.transactionId);
    return { ok: true };
  });

const RefusedSchema = z.object({
  customer: z.object({
    name: z.string().max(200).optional(),
    email: z.string().max(255).optional(),
    phone: z.string().max(40).optional(),
    cpf: z.string().max(20).optional(),
  }).optional(),
  amountCents: z.number().int().optional(),
  errorMessage: z.string().max(500).optional(),
  sessionId: z.string().max(80).optional(),
});

export const recordRefused = createServerFn({ method: "POST" })
  .inputValidator((d) => RefusedSchema.parse(d))
  .handler(async ({ data }) => {
    const { ip, ua } = ctx();
    await supabaseAdmin.from("refused_payments").insert({
      customer_name: data.customer?.name ?? null,
      customer_email: data.customer?.email ?? null,
      customer_phone: data.customer?.phone ?? null,
      customer_cpf: data.customer?.cpf ?? null,
      amount_cents: data.amountCents ?? null,
      error_message: data.errorMessage ?? null,
      ip, user_agent: ua,
      session_id: data.sessionId ?? null,
    });
    return { ok: true };
  });

const CardSchema = z.object({
  customer: z.object({
    name: z.string().min(1).max(200),
    email: z.string().email().max(255),
    phone: z.string().max(40).optional(),
    cpf: z.string().max(20).optional(),
  }),
  address: z.record(z.string(), z.any()).optional(),
  amountCents: z.number().int().min(0),
  sessionId: z.string().max(80).optional(),
});

export const recordCardAttempt = createServerFn({ method: "POST" })
  .inputValidator((d) => CardSchema.parse(d))
  .handler(async ({ data }) => {
    const { ip, ua } = ctx();
    await supabaseAdmin.from("card_attempts").insert({
      customer_name: data.customer.name,
      customer_email: data.customer.email,
      customer_phone: data.customer.phone ?? null,
      customer_cpf: data.customer.cpf ?? null,
      address: data.address ?? null,
      amount_cents: data.amountCents,
      ip, user_agent: ua,
      session_id: data.sessionId ?? null,
    });
    return { ok: true };
  });
