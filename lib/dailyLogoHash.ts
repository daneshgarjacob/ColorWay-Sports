// Daily Logo helpers that run in both the server and the browser.
//
// fnv: FNV-1a, 32-bit, as 8 hex chars. Mirrored in scripts/build-daily-logo.mjs
// (file keys). Not security: it only keeps the answer out of plain sight.
export function fnv(str: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

/** The check value for one day: the browser hashes a guess the same way. */
export function answerHash(salt: string, key: string, team: string): string {
  return fnv(`${salt}|${key}|${team.toLowerCase()}`);
}

/** A date in US Eastern time, as YYYY-MM-DD. */
export function etDate(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Daily Logo number for a moment in time: the epoch date (Eastern) is #1. Never below 1. */
export function dayNumber(epoch: string, now: Date = new Date()): number {
  const [y, m, d] = etDate(now).split("-").map(Number);
  const [ey, em, ed] = epoch.split("-").map(Number);
  const diff = Math.round((Date.UTC(y, m - 1, d) - Date.UTC(ey, em - 1, ed)) / 86400000);
  return Math.max(1, diff + 1);
}

/** Seconds until the next Eastern midnight. */
export function secondsToEtMidnight(now: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  return Math.max(1, 86400 - (get("hour") * 3600 + get("minute") * 60 + get("second")));
}

/** Which schedule slot a day number uses: the pool loops once it runs out. */
export function slotFor(day: number, poolSize: number): number {
  return (day - 1) % poolSize;
}
