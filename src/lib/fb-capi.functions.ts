import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";
import { createHash } from "crypto";

const PIXEL_ID = "727370486717272";
const GRAPH_URL = `https://graph.facebook.com/v19.0/${PIXEL_ID}/events`;

function sha256(v?: string) {
  if (!v) return undefined;
  return createHash("sha256").update(v.trim().toLowerCase()).digest("hex");
}

function onlyDigits(s?: string) {
  return (s || "").replace(/\D/g, "");
}

type CapiInput = {
  eventName: "Purchase" | "InitiateCheckout" | "AddToCart" | "PageView";
  eventId: string;
  eventSourceUrl?: string;
  value?: number;
  currency?: string;
  fbp?: string;
  fbc?: string;
  user?: {
    email?: string;
    phone?: string;
    name?: string;
    cpf?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  customData?: Record<string, any>;
};

export const sendFbEvent = createServerFn({ method: "POST" })
  .inputValidator((input: CapiInput) => input)
  .handler(async ({ data }) => {
    const token = process.env.FB_CAPI_ACCESS_TOKEN;
    if (!token) {
      console.error("FB_CAPI_ACCESS_TOKEN não configurado");
      return { ok: false, error: "missing_token" };
    }

    const ip = (() => {
      try { return getRequestIP({ xForwardedFor: true }); } catch { return undefined; }
    })();
    let userAgent: string | undefined;
    try { userAgent = getRequestHeader("user-agent"); } catch { /* ignore */ }

    const [firstName, ...rest] = (data.user?.name || "").trim().split(/\s+/);
    const lastName = rest.join(" ");

    const user_data: Record<string, any> = {
      em: data.user?.email ? [sha256(data.user.email)] : undefined,
      ph: data.user?.phone ? [sha256(onlyDigits("55" + onlyDigits(data.user.phone).replace(/^55/, "")))] : undefined,
      fn: firstName ? [sha256(firstName)] : undefined,
      ln: lastName ? [sha256(lastName)] : undefined,
      ct: data.user?.city ? [sha256(data.user.city)] : undefined,
      st: data.user?.state ? [sha256(data.user.state)] : undefined,
      zp: data.user?.zip ? [sha256(onlyDigits(data.user.zip))] : undefined,
      country: [sha256("br")],
      external_id: data.user?.cpf ? [sha256(onlyDigits(data.user.cpf))] : undefined,
      client_ip_address: ip,
      client_user_agent: userAgent,
      fbp: data.fbp,
      fbc: data.fbc,
    };
    // strip undefined
    Object.keys(user_data).forEach((k) => user_data[k] === undefined && delete user_data[k]);

    const event: any = {
      event_name: data.eventName,
      event_time: Math.floor(Date.now() / 1000),
      event_id: data.eventId,
      action_source: "website",
      event_source_url: data.eventSourceUrl,
      user_data,
    };

    if (data.value !== undefined) {
      event.custom_data = {
        currency: data.currency || "BRL",
        value: data.value,
        ...(data.customData || {}),
      };
    } else if (data.customData) {
      event.custom_data = data.customData;
    }

    try {
      const res = await fetch(GRAPH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: [event], access_token: token }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error("FB CAPI error", res.status, out);
        return { ok: false, error: out };
      }
      return { ok: true, response: out };
    } catch (e: any) {
      console.error("FB CAPI request failed", e?.message);
      return { ok: false, error: e?.message };
    }
  });
