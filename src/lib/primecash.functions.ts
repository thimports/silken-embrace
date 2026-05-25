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

const API_BASE = "https://api.primecashbrasil.com/v1";

const onlyDigits = (s?: string | null) => (s ?? "").replace(/\D/g, "");

function authHeaders(extra?: Record<string, string>) {
  const key = process.env.PRIMECASH_SECRET_KEY;
  if (!key) throw new Error("PRIMECASH_SECRET_KEY não configurada");
  const basic = Buffer.from(`${key}:x`).toString("base64");
  return {
    Authorization: `Basic ${basic}`,
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(extra ?? {}),
  };
}

async function primecashRequest(path: string, init: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, init);
  const text = await res.text();
  let data: any;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!res.ok) {
    const message =
      data?.message ||
      data?.error ||
      (Array.isArray(data?.errors) ? data.errors.map((e: any) => e?.message || JSON.stringify(e)).join("; ") : null) ||
      `Erro PrimeCash (${res.status})`;
    throw new Error(typeof message === "string" ? message : JSON.stringify(message));
  }
  return data;
}

function mapStatus(s?: string): string {
  if (!s) return "pending";
  if (s === "paid" || s === "approved") return "paid";
  return s;
}

function buildCustomer(c: CustomerInput) {
  const doc = onlyDigits(c.document);
  return {
    name: c.name,
    email: c.email,
    phone: onlyDigits(c.phone),
    document: { number: doc, type: doc.length === 14 ? "cnpj" : "cpf" },
  };
}

function buildItems(items: Item[]) {
  return items.map((i) => ({
    title: i.title,
    unitPrice: Math.round(i.unitPrice),
    quantity: i.quantity,
    tangible: i.tangible,
  }));
}

export const createPixTransaction = createServerFn({ method: "POST" })
  .inputValidator((input: {
    amount: number;
    customer: CustomerInput;
    items: Item[];
    address?: AddressInput;
  }) => input)
  .handler(async ({ data }) => {
    const body: Record<string, unknown> = {
      amount: Math.round(data.amount),
      paymentMethod: "pix",
      customer: buildCustomer(data.customer),
      items: buildItems(data.items),
    };

    const tx = await primecashRequest("/transactions", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });

    const qrcode = tx?.pix?.qrcode || null;
    if (!qrcode || !tx?.id) {
      console.error("PrimeCash retornou sem QR code:", JSON.stringify(tx).slice(0, 2000));
      throw new Error("Pagamento PIX indisponível no momento. Tente novamente em instantes.");
    }

    return {
      id: String(tx.id),
      secureId: String(tx.secureId ?? tx.id),
      status: mapStatus(tx.status),
      amount: Number(tx.amount ?? data.amount),
      pix: { qrcode: String(qrcode), expirationDate: tx.pix?.expirationDate ?? null },
    };
  });

// Cartão: mantém-se como stub. O fluxo de checkout já registra a tentativa no "baú".
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
    const tx = await primecashRequest(`/transactions/${encodeURIComponent(data.id)}`, {
      method: "GET",
      headers: authHeaders(),
    });
    const status = mapStatus(tx?.status);
    const paidAt = status === "paid" ? (tx?.paidAt || tx?.updatedAt || null) : null;
    return { id: String(tx?.id ?? data.id), status, paidAt };
  });
