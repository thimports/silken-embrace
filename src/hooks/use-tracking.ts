import { useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { trackEvent, heartbeat } from "@/lib/tracking.functions";

const SID_KEY = "lumiere_sid";

export function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    let s = sessionStorage.getItem(SID_KEY);
    if (!s) {
      s = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem(SID_KEY, s);
    }
    return s;
  } catch {
    return `${Date.now()}`;
  }
}

let _track: ((args: any) => Promise<any>) | null = null;
let _hb: ((args: any) => Promise<any>) | null = null;

export function track(
  eventType:
    | "product_view"
    | "checkout_started"
    | "step_data"
    | "step_shipping"
    | "step_payment"
    | "purchase"
    | "pix_failed"
    | "card_attempt",
  metadata?: Record<string, any>,
) {
  if (typeof window === "undefined" || !_track) return;
  _track({ data: {
    sessionId: getSessionId(),
    eventType,
    page: window.location.pathname,
    metadata: metadata ?? {},
  }}).catch(() => {});
}

export function useTrackingBootstrap() {
  const trackFn = useServerFn(trackEvent);
  const hbFn = useServerFn(heartbeat);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    _track = trackFn;
    _hb = hbFn;

    const beat = () => {
      if (typeof window === "undefined" || !_hb) return;
      // avoid heartbeat on admin pages
      if (window.location.pathname.startsWith("/admin")) return;
      _hb({ data: {
        sessionId: getSessionId(),
        page: window.location.pathname,
      }}).catch(() => {});
    };
    beat();
    const id = window.setInterval(beat, 15000);
    const onVis = () => { if (!document.hidden) beat(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [trackFn, hbFn]);
}
