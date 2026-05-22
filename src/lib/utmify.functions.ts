import { createServerFn } from "@tanstack/react-start";
import { getRequestIP } from "@tanstack/react-start/server";

const ENDPOINT = "https://api.utmify.com.br/api-credentials/orders";

type Customer = {
  name: string;
  email: string;
  phone?: string | null;
  document?: string | null;
  country?: string;
  ip?: string;
};

type Product = {
  id: string;
  name: string;
  planId?: string | null;
  planName?: string | null;
  quantity: number;
  priceInCents: number;
};

type TrackingParameters = {
  src: string | null;
  sck: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
  utm_medium: string | null;
  utm_content: string | null;
  utm_term: string | null;
};

type Commission = {
  totalPriceInCents: number;
  gatewayFeeInCents: number;
  userCommissionInCents: number;
  currency?: "BRL" | "USD" | "EUR";
};

type UtmifyInput = {
  orderId: string;
  paymentMethod: "credit_card" | "pix" | "boleto" | "paypal" | "free_price";
  status: "waiting_payment" | "paid" | "refused" | "refunded" | "chargedback";
  createdAt: string; // 'YYYY-MM-DD HH:MM:SS' UTC
  approvedDate?: string | null;
  refundedAt?: string | null;
  customer: Customer;
  products: Product[];
  trackingParameters: TrackingParameters;
  commission: Commission;
  isTest?: boolean;
};

export const sendUtmifyOrder = createServerFn({ method: "POST" })
  .inputValidator((input: UtmifyInput) => input)
  .handler(async ({ data }) => {
    const token = process.env.UTMIFY_API_TOKEN;
    if (!token) {
      console.error("UTMIFY_API_TOKEN não configurado");
      return { ok: false, error: "missing_token" };
    }

    // Enrich customer with server IP if not provided
    let ip = data.customer.ip;
    if (!ip) {
      try { ip = getRequestIP({ xForwardedFor: true }) || undefined; } catch { /* ignore */ }
    }

    const payload = {
      orderId: data.orderId,
      platform: "Lumiere",
      paymentMethod: data.paymentMethod,
      status: data.status,
      createdAt: data.createdAt,
      approvedDate: data.approvedDate ?? null,
      refundedAt: data.refundedAt ?? null,
      customer: {
        name: data.customer.name,
        email: data.customer.email,
        phone: data.customer.phone || null,
        document: data.customer.document || null,
        country: data.customer.country || "BR",
        ip,
      },
      products: data.products,
      trackingParameters: data.trackingParameters,
      commission: data.commission,
      isTest: data.isTest ?? false,
    };

    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-token": token,
        },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      let out: any;
      try { out = JSON.parse(text); } catch { out = { raw: text }; }
      if (!res.ok) {
        console.error("Utmify API error", res.status, out);
        return { ok: false, error: out };
      }
      return { ok: true, response: out };
    } catch (e: any) {
      console.error("Utmify request failed", e?.message);
      return { ok: false, error: e?.message };
    }
  });
