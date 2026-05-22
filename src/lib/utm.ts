// UTM capture + retrieval (sessionStorage)
const KEY = "lumiere_utms";

export type Utms = {
  src: string | null;
  sck: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
  utm_medium: string | null;
  utm_content: string | null;
  utm_term: string | null;
};

const EMPTY: Utms = {
  src: null, sck: null,
  utm_source: null, utm_campaign: null, utm_medium: null, utm_content: null, utm_term: null,
};

export function captureUtms() {
  if (typeof window === "undefined") return;
  try {
    const url = new URL(window.location.href);
    const params = url.searchParams;
    const has =
      params.has("utm_source") || params.has("utm_campaign") || params.has("utm_medium") ||
      params.has("utm_content") || params.has("utm_term") || params.has("src") || params.has("sck");
    if (!has) return;
    const data: Utms = {
      src: params.get("src"),
      sck: params.get("sck"),
      utm_source: params.get("utm_source"),
      utm_campaign: params.get("utm_campaign"),
      utm_medium: params.get("utm_medium"),
      utm_content: params.get("utm_content"),
      utm_term: params.get("utm_term"),
    };
    sessionStorage.setItem(KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

export function getUtms(): Utms {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return EMPTY;
    return { ...EMPTY, ...JSON.parse(raw) };
  } catch {
    return EMPTY;
  }
}
