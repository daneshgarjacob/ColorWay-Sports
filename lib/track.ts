// Small, safe GA4 event helper (11/20). The site loads gtag.js in app/layout.tsx
// with strategy="afterInteractive", so a component's first effect can run
// before window.gtag exists. trackEvent waits briefly (up to ~10 s) for it and
// then gives up quietly: no new dependency, never throws, nothing personal sent.
// Browser-only; call it from effects or click handlers.

type Params = Record<string, string | number | boolean>;
type Gtag = (cmd: "event", name: string, params?: Params) => void;

export function trackEvent(name: string, params: Params = {}, tries = 20): void {
  if (typeof window === "undefined") return;
  const gtag = (window as unknown as { gtag?: Gtag }).gtag;
  if (typeof gtag === "function") {
    try {
      gtag("event", name, params);
    } catch {
      // Analytics must never break the page.
    }
    return;
  }
  if (tries > 0) window.setTimeout(() => trackEvent(name, params, tries - 1), 500);
}

/** Microsoft Clarity custom tag, so recordings can be filtered by it. No-op until Clarity loads. */
export function clarityTag(key: string, value: string, tries = 20): void {
  if (typeof window === "undefined") return;
  const clarity = (window as unknown as { clarity?: (cmd: "set", k: string, v: string) => void }).clarity;
  if (typeof clarity === "function") {
    try {
      clarity("set", key, value);
    } catch {}
    return;
  }
  if (tries > 0) window.setTimeout(() => clarityTag(key, value, tries - 1), 1000);
}
