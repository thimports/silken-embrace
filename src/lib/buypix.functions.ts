import { createServerFn } from "@tanstack/react-start";

type Item = { title: string; unitPrice: number; quantity: number; tangible: boolean };

type CustomerInput = {
  name: string;
  email: string;
  phone: string;
  document: string;
};

type AddressInput = {
  street: string;
  streetNumber: string;
  complement?: string;
  zipCode: string;
  neighborhood?: string;
  city: string;
  state: string;
};

const API_BASE = "https://buypix.me/api/v1";

function authHeaders(extra?: Record<string, string>) {
  const key = process.env.BUYPIX_API_KEY;
  if (!key) throw new Error("BUYPIX_API_KEY não configurada");
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    ...(extra ?? {}),
  };
}

async function buypixRequest(path: string, init: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, init);
  const text = await res.text();
  let data: any;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!res.ok) {
    const message = data?.message || data?.error || `Erro BuyPix (${res.status})`;
    throw new Error(typeof message === "string" ? message : JSON.stringify(message));
  }
  return data;
}

function mapStatus(s?: string): string {
  if (!s) return "pending";
  if (s === "depix_sent" || s === "completed") return "paid";
  return s;
}

// Mantém a mesma assinatura do antigo primecash.createPixTransaction
// (amount em centavos, customer, items, address) para minimizar mudanças no checkout/upsell.
export const createPixTransaction = createServerFn({ method: "POST" })
  .inputValidator((input: {
    amount: number;
    customer: CustomerInput;
    items: Item[];
    address?: AddressInput;
  }) => input)
  .handler(async ({ data }) => {
    const amountBrl = Math.round(data.amount) / 100;
    const body: Record<string, unknown> = { amount: amountBrl };

    const res = await buypixRequest("/deposits", {
      method: "POST",
      headers: authHeaders({ "X-Idempotency-Key": crypto.randomUUID() }),
      body: JSON.stringify(body),
    });
    const tx = res?.data ?? res;
    const qrcode = tx?.pix_qr_code || tx?.qrcode || null;
    const expiresAt = tx?.expires_at || null;

    if (!qrcode || !tx?.id) {
      console.error("BuyPix retornou sem QR code:", JSON.stringify(tx).slice(0, 2000));
      throw new Error("Pagamento PIX indisponível no momento. Tente novamente em instantes.");
    }

    return {
      id: String(tx.id),
      secureId: String(tx.id),
      status: mapStatus(tx.status),
      amount: Math.round(Number(tx.amount ?? amountBrl) * 100),
      pix: { qrcode: String(qrcode), expirationDate: expiresAt },
    };
  });

// BuyPix não processa cartão — mantido como stub para compatibilidade.
// O fluxo de cartão no checkout apenas registra a tentativa no "baú" (recordCardAttempt).
export const createCardTransaction = createServerFn({ method: "POST" })
  .inputValidator((input: {
    amount: number;
    installments: number;
    customer: CustomerInput;
    items: Item[];
    address?: AddressInput;
    card: {
      number: string;
      holderName: string;
      expirationMonth: number;
      expirationYear: number;
      cvv: string;
    };
  }) => input)
  .handler(async () => {
    throw new Error("Pagamento por cartão indisponível. Use PIX.");
  });

export const getTransactionStatus = createServerFn({ method: "GET" })
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data }) => {
    const res = await buypixRequest(`/deposits/${encodeURIComponent(data.id)}`, {
      method: "GET",
      headers: authHeaders(),
    });
    const tx = res?.data ?? res;
    const status = mapStatus(tx?.status);
    const paidAt = status === "paid" ? (tx?.completed_at || tx?.updated_at || null) : null;
    return { id: String(tx?.id ?? data.id), status, paidAt };
  });
