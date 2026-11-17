// Daily Logo history, kept in this browser only (localStorage). Every access is
// wrapped: private windows, blocked storage and old browsers just mean no
// streak is remembered; the game itself still works.

const KEY = "cw-daily-logo-v1";

export type DayStatus = "playing" | "won" | "lost";

export interface DayRecord {
  /** Teams guessed, in order. */
  g: string[];
  s: DayStatus;
}

export type History = Record<string, DayRecord>;

export const MAX_GUESSES = 3;

export function loadHistory(): History {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && parsed.days && typeof parsed.days === "object" ? parsed.days : {};
  } catch {
    return {};
  }
}

export function saveDay(day: number, rec: DayRecord): History {
  const h = { ...loadHistory(), [day]: rec };
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ v: 1, days: h }));
  } catch {
    // Storage blocked or full: play on without saving.
  }
  return h;
}

export interface Stats {
  played: number;
  wins: number;
  winPct: number;
  current: number;
  best: number;
}

export function computeStats(h: History, today: number): Stats {
  const done = Object.entries(h)
    .filter(([, r]) => r && (r.s === "won" || r.s === "lost"))
    .map(([d, r]) => ({ d: Number(d), won: r.s === "won" }))
    .filter((x) => Number.isFinite(x.d))
    .sort((a, b) => a.d - b.d);
  const won = new Set(done.filter((x) => x.won).map((x) => x.d));
  const wins = won.size;

  // Current streak: wins on consecutive days ending today, or ending yesterday
  // while today is still unplayed.
  let current = 0;
  let d = h[today]?.s === "won" ? today : h[today]?.s === "lost" ? -1 : today - 1;
  while (d > 0 && won.has(d)) {
    current++;
    d--;
  }

  let best = 0;
  let run = 0;
  let prev = -2;
  for (const x of done) {
    if (x.won && x.d === prev + 1) run++;
    else run = x.won ? 1 : 0;
    best = Math.max(best, run);
    prev = x.won ? x.d : -2;
  }

  return {
    played: done.length,
    wins,
    winPct: done.length ? Math.round((wins / done.length) * 100) : 0,
    current,
    best: Math.max(best, current),
  };
}
