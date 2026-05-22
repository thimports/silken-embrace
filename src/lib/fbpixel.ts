// Facebook Pixel client helper
export const FB_PIXEL_ID = "727370486717272";

declare global {
  interface Window {
    fbq?: any;
    _fbq?: any;
  }
}

export function initFbPixel() {
  if (typeof window === "undefined") return;
  if (window.fbq) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (function (f: any, b: Document, e: string, v: string) {
    let n: any;
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = "2.0";
    n.queue = [];
    const t = b.createElement(e) as HTMLScriptElement;
    t.async = !0;
    t.src = v;
    const s = b.getElementsByTagName(e)[0];
    s.parentNode?.insertBefore(t, s);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
  window.fbq("init", FB_PIXEL_ID);
  window.fbq("track", "PageView");
}

export function fbTrack(event: string, params?: Record<string, any>, options?: { eventID?: string }) {
  if (typeof window === "undefined" || !window.fbq) return;
  if (options?.eventID) window.fbq("track", event, params || {}, { eventID: options.eventID });
  else window.fbq("track", event, params || {});
}

export function getFbp(): string | undefined {
  if (typeof document === "undefined") return;
  const m = document.cookie.match(/(?:^|;\s*)_fbp=([^;]+)/);
  return m?.[1];
}

export function getFbc(): string | undefined {
  if (typeof document === "undefined") return;
  const m = document.cookie.match(/(?:^|;\s*)_fbc=([^;]+)/);
  if (m) return m[1];
  // build _fbc from fbclid in URL
  const url = new URL(window.location.href);
  const fbclid = url.searchParams.get("fbclid");
  if (fbclid) return `fb.1.${Date.now()}.${fbclid}`;
  return undefined;
}

export function newEventId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
