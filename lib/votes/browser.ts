// Browser-side helpers shared by the vote boxes (components/BracketVote.tsx,
// components/FavoriteVote.tsx). localStorage only; every access is guarded so
// a private window or blocked storage never breaks the page.

export const VOTES_KEY = "cw-votes-v1"; // { [item]: choice } ("A"/"B" or an option key)
export const TALLY_KEY = "cw-vote-tallies-v1"; // { [item]: last tally this browser saw }
export const ANON_KEY = "cw-anon-id"; // shared with Grade It: a random UUID, nothing else
export const GIVEAWAY_ID = "enter-the-breakingt-shirt-giveaway"; // h3 id the post's giveaway box gets
export const HEADER_OFFSET = 110; // matches the vote placeholders' scroll-margin-top

export function readJSON(key: string): Record<string, unknown> {
  try {
    const v = JSON.parse(localStorage.getItem(key) ?? "{}");
    return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export function writeJSON(key: string, item: string, value: unknown) {
  try {
    const all = readJSON(key);
    all[item] = value;
    localStorage.setItem(key, JSON.stringify(all));
  } catch {}
}

export function anonId(): string {
  try {
    const have = localStorage.getItem(ANON_KEY);
    if (have && /^[0-9a-f-]{36}$/i.test(have)) return have;
    const id =
      typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            return (c === "x" ? r : (r & 3) | 8).toString(16);
          });
    localStorage.setItem(ANON_KEY, id);
    return id;
  } catch {
    return "00000000-0000-4000-8000-000000000000";
  }
}

export const votesWord = (n: number) => `${n.toLocaleString("en-US")} ${n === 1 ? "vote" : "votes"}`;

/** "Wednesday at 11:59 p.m." in Eastern time, from a UTC timestamp. */
export function easternDayTime(iso: string): { day: string; date: string; time: string } {
  const when = new Date(iso);
  const day = when.toLocaleDateString("en-US", { weekday: "long", timeZone: "America/New_York" });
  const date = when.toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "America/New_York" });
  const time = when
    .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York" })
    .replace(/\s?AM$/, " a.m.")
    .replace(/\s?PM$/, " p.m.");
  return { day, date, time };
}

/** Scroll to the giveaway box (the .bkt around the giveaway h3), under the sticky header. */
export function jumpToGiveaway(e: { preventDefault(): void }) {
  const target = document.getElementById(GIVEAWAY_ID);
  if (!target) return;
  e.preventDefault();
  const box = (target.closest(".bkt") as HTMLElement | null) ?? target;
  window.scrollTo({ top: box.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET, behavior: "smooth" });
  history.replaceState(null, "", `#${GIVEAWAY_ID}`);
}
