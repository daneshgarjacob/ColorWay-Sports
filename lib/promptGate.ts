// One sign-up prompt per visit.
//
// The 10/13 site audit caught three things on a phone at once: OneSignal's push
// slidedown, the full-screen newsletter modal and Mediavine's video ad. Readers
// who land from Google and get stacked prompts leave, and Google's intrusive
// interstitial guidance penalises pages that cover content on mobile landings.
//
// Rules (Jake approved 10/13):
//   - Each browser session gets ONE owner: the newsletter ("email") or web push
//     ("push"). The other never shows in that session.
//   - A reader the newsletter can still ask (not subscribed, not dismissed in
//     the last 7 days) gets "email". Everyone else gets "push", so push keeps
//     asking the readers the newsletter has stopped asking.
//   - The newsletter never shows on the first page view of a session (the
//     Google landing). See components/EmailCapture.tsx.
//
// Browser-only. Every storage call is wrapped: private mode and blocked site
// data throw, and the site has to work without any of this.

export type PromptOwner = "email" | "push";

const OWNER_KEY = "cw-prompt-owner";
const PV_KEY = "cw-pv";
const PV_PATH_KEY = "cw-pv-path";
export const EMAIL_DISMISSED_KEY = "cw-email-dismissed";
export const EMAIL_SUBSCRIBED_KEY = "cw-email-subscribed";
const DISMISS_MS = 7 * 24 * 60 * 60 * 1000;

function get(store: "local" | "session", key: string): string | null {
  try {
    return (store === "local" ? window.localStorage : window.sessionStorage).getItem(key);
  } catch {
    return null;
  }
}

export function setStored(store: "local" | "session", key: string, value: string): void {
  try {
    (store === "local" ? window.localStorage : window.sessionStorage).setItem(key, value);
  } catch {
    /* storage blocked: the prompt just behaves as a first visit next time */
  }
}

/** The newsletter may still ask this reader: not subscribed, no recent dismiss. */
export function emailEligible(): boolean {
  if (get("local", EMAIL_SUBSCRIBED_KEY)) return false;
  const dismissed = parseInt(get("local", EMAIL_DISMISSED_KEY) ?? "", 10);
  return !(dismissed && Date.now() - dismissed < DISMISS_MS);
}

/** Who owns this session's prompt. Decided once, on the first call. */
export function sessionPromptOwner(): PromptOwner {
  const stored = get("session", OWNER_KEY);
  if (stored === "email" || stored === "push") return stored;
  const owner: PromptOwner = emailEligible() ? "email" : "push";
  setStored("session", OWNER_KEY, owner);
  return owner;
}

/**
 * Count a page view for this session and return the running total (1 = the
 * landing page). Counting by path means a re-render or a reload of the same
 * page is not a second page view.
 */
export function countPageView(path: string): number {
  const n = parseInt(get("session", PV_KEY) ?? "0", 10) || 0;
  if (get("session", PV_PATH_KEY) === path && n > 0) return n;
  setStored("session", PV_KEY, String(n + 1));
  setStored("session", PV_PATH_KEY, path);
  return n + 1;
}
