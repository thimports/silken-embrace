// Server-only helper to dispatch orders to Utmify.
// Importable from other server fns (e.g. recordOrder, markOrderPaid).
const ENDPOINT = "https://api.utmify.com.br/api-credentials/orders";

export type UtmifyPayload = {
  orderId: string;
  paymentMethod: "credit_card" | "pix" | "boleto" | "paypal" | "free_price";
  status: "waiting_payment" | "paid" | "refused" | "refunded" | "chargedback";
  createdAt: string;
  approvedDate?: string | null;
  refundedAt?: string | null;
  customer: {
    name: string;
    email: string;
    phone?: string | null;
    document?: string | null;
    country?: string;
    ip?: string;
  };
  products: Array<{
    id: string;
    name: string;
    planId?: string | null;
    planName?: string | null;
    quantity: number;
    priceInCents: number;
  }>;
  trackingParameters: {
    src: string | null;
    sck: string | null;
    utm_source: string | null;
    utm_campaign: string | null;
    utm_medium: string | null;
    utm_content: string | null;
    utm_term: string | null;
  };
  commission: {
    totalPriceInCents: number;
    gatewayFeeInCents: number;
    userCommissionInCents: number;
    currency?: "BRL" | "USD" | "EUR";
  };
  isTest?: boolean;
};

export async function dispatchUtmify(payload: UtmifyPayload): Promise<{ ok: boolean; error?: any }> {
  const token = process.env.UTMIFY_API_TOKEN;
  if (!token) {
    console.error("UTMIFY_API_TOKEN não configurado");
    return { ok: false, error: "missing_token" };
  }

  const body = {
    ...payload,
    platform: "Lumiere",
    customer: {
      ...payload.customer,
      country: payload.customer.country || "BR",
    },
    isTest: payload.isTest ?? false,
  };

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-token": token },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("Utmify API error", res.status, text);
      return { ok: false, error: text };
    }
    return { ok: true };
  } catch (e: any) {
    console.error("Utmify request failed", e?.message);
    return { ok: false, error: e?.message };
  }
}
