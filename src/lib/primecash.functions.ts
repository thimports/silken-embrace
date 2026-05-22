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

function authHeader() {
  const key = process.env.PRIMECASH_SECRET_KEY;
  if (!key) throw new Error("PRIMECASH_SECRET_KEY não configurada");
  const token = Buffer.from(`${key}:x`).toString("base64");
  return `Basic ${token}`;
}

function onlyDigits(s: string) {
  return (s || "").replace(/\D/g, "");
}

function buildCustomer(c: CustomerInput) {
  const doc = onlyDigits(c.document);
  return {
    name: c.name,
    email: c.email,
    phone: onlyDigits(c.phone),
    document: {
      number: doc,
      type: doc.length === 14 ? "cnpj" : "cpf",
    },
  };
}

function buildShipping(a: AddressInput | undefined) {
  if (!a || !a.zipCode) return undefined;
  return {
    fee: 0,
    address: {
      street: a.street,
      streetNumber: a.streetNumber || "S/N",
      complement: a.complement || undefined,
      zipCode: onlyDigits(a.zipCode),
      neighborhood: a.neighborhood || "Centro",
      city: a.city,
      state: a.state?.toUpperCase(),
      country: "br",
    },
  };
}

async function callPrimecash(body: unknown) {
  const res = await fetch(`${API_BASE}/transactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader(),
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data: any;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!res.ok) {
    const message = data?.message || data?.error || `Erro Prime Cash (${res.status})`;
    throw new Error(typeof message === "string" ? message : JSON.stringify(message));
  }
  return data;
}

export const createPixTransaction = createServerFn({ method: "POST" })
  .inputValidator((input: {
    amount: number;
    customer: CustomerInput;
    items: Item[];
    address?: AddressInput;
  }) => input)
  .handler(async ({ data }) => {
    const body = {
      amount: Math.round(data.amount),
      paymentMethod: "pix",
      customer: buildCustomer(data.customer),
      items: data.items,
      shipping: buildShipping(data.address),
      pix: { expiresInDays: 1 },
    };
    const tx = await callPrimecash(body);
    const pix = tx?.pix || tx?.pixData || {};
    const qrcode =
      pix.qrcode || pix.qrCode || pix.qr_code ||
      pix.emv || pix.copyPaste || pix.copy_paste ||
      pix.payload || tx?.qrcode || tx?.qrCode || null;
    const expirationDate =
      pix.expirationDate || pix.expiration_date || pix.expiresAt || pix.expires_at || null;

    if (!qrcode) {
      console.error("Prime Cash retornou sem QR code:", JSON.stringify(tx).slice(0, 2000));
      throw new Error("Pagamento PIX indisponível no momento. Tente novamente em instantes.");
    }

    return {
      id: tx.id,
      secureId: tx.secureId,
      status: tx.status,
      amount: tx.amount,
      pix: { qrcode, expirationDate },
    };
  });

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
  .handler(async ({ data }) => {
    const body = {
      amount: Math.round(data.amount),
      paymentMethod: "credit_card",
      installments: data.installments,
      customer: buildCustomer(data.customer),
      items: data.items,
      shipping: buildShipping(data.address),
      card: {
        number: onlyDigits(data.card.number),
        holderName: data.card.holderName,
        expirationMonth: data.card.expirationMonth,
        expirationYear: data.card.expirationYear,
        cvv: data.card.cvv,
      },
    };
    const tx = await callPrimecash(body);
    return {
      id: tx.id,
      status: tx.status as string,
      secureId: tx.secureId as string,
      refusedReason: tx.refusedReason ?? null,
    };
  });

export const getTransactionStatus = createServerFn({ method: "GET" })
  .inputValidator((input: { id: number }) => input)
  .handler(async ({ data }) => {
    const res = await fetch(`${API_BASE}/transactions/${data.id}`, {
      headers: { Authorization: authHeader() },
    });
    if (!res.ok) throw new Error(`Erro ao buscar transação (${res.status})`);
    const tx = await res.json();
    return { id: tx.id, status: tx.status as string, paidAt: tx.paidAt as string | null };
  });
