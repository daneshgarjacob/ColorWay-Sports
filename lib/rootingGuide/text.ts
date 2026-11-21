// Small wording helpers shared by the NFL and college rules. Every day and
// time is printed in US Eastern: ESPN dates are UTC, so a night game would
// otherwise land on the next calendar day.

import type { Level, SlimGame } from "./types";

const TZ = "America/New_York";

const part = (d: Date, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-US", { timeZone: TZ, ...o }).format(d);

/** AP month style: "Nov.", "Sept.", "March". */
function apMonth(d: Date): string {
  const m = part(d, { month: "long" });
  const short: Record<string, string> = { January: "Jan.", February: "Feb.", August: "Aug.", September: "Sept.", October: "Oct.", November: "Nov.", December: "Dec." };
  return short[m] ?? m;
}

export const etDay = (iso: string) => part(new Date(iso), { weekday: "long" });
export const etDateKey = (ms: number) => new Date(ms).toLocaleDateString("en-CA", { timeZone: TZ });

/** "4:05 PM ET" */
function etTime(iso: string): string {
  return `${part(new Date(iso), { hour: "numeric", minute: "2-digit", hour12: true })} ET`;
}

const TV: Record<string, string> = {
  BTN: "Big Ten Network",
  SECN: "SEC Network",
  "SECN+": "SEC Network+",
  ACCN: "ACC Network",
  "ACCNX": "ACC Network Extra",
  "USA Net": "USA Network",
  CBSSN: "CBS Sports Network",
  FOX: "Fox",
  ESPNU: "ESPNU",
};

export function tvName(tv: string | undefined): string | undefined {
  if (!tv) return undefined;
  const first = tv.split("/")[0].trim();
  return TV[first] ?? first;
}

/**
 * "Sunday, 4:05 PM ET, Fox" (this week) or "Sunday, Nov. 29, 4:05 PM ET, CBS"
 * (withDate). A kickoff time that is not set yet reads "time not set".
 */
export function whenLine(g: SlimGame, withDate = false): string {
  const d = new Date(g.date);
  const day = part(d, { weekday: "long" });
  const date = withDate ? `, ${apMonth(d)} ${part(d, { day: "numeric" })}` : "";
  if (g.state === "in") return `In progress, ${g.detail}`;
  if (!g.timeValid) return `${day}${date}, time not set`;
  const tv = tvName(g.tv);
  return `${day}${date}, ${etTime(g.date)}${tv ? `, ${tv}` : ""}`;
}

/** "Monday night", "Thursday", "Saturday" for a finished game. */
export function playedWhen(g: SlimGame): string {
  const d = new Date(g.date);
  const hour = Number(part(d, { hour: "numeric", hour12: false }));
  const day = part(d, { weekday: "long" });
  return hour >= 19 && day !== "Thursday" && day !== "Sunday" ? `${day} night` : day;
}

export const ORD = ["", "first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "10th", "11th", "12th", "13th", "14th", "15th", "16th"];
export function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
/** AP style: spell out one through nine. */
export const numWord = (n: number) => (Number.isInteger(n) && n >= 0 && n < 10 ? WORDS[n] : String(n));
export const capFirst = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

/** "1.5 games", "one game", "half a game" */
export function gamesWord(g: number): string {
  if (g === 0.5) return "half a game";
  if (Number.isInteger(g)) return `${numWord(g)} game${g === 1 ? "" : "s"}`;
  return `${g} games`;
}

/** "A, B and C" */
export function andList(xs: string[]): string {
  if (xs.length <= 1) return xs.join("");
  return `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;
}

/** Weight -> level. Below the last step the game does not get a row. */
export function levelOf(w: number): Level | undefined {
  if (w >= 2.5) return "Big";
  if (w >= 1.6) return "Helps";
  if (w >= 0.6) return "A Little";
  return undefined;
}

export const LEVEL_ORDER: Record<Level, number> = { Big: 0, Helps: 1, "A Little": 2 };

/** "Chargers'" / "USC's" */
export const possessive = (s: string) => (/s$/.test(s) ? `${s}'` : `${s}'s`);

/** Rotates through sentence variants so a page does not read like a mail merge. */
export function variant<T>(list: T[], i: number): T {
  return list[((i % list.length) + list.length) % list.length];
}
