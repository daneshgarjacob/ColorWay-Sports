// Grade It: the grade scale and the math behind the fan aggregate. Pure
// functions, shared by the API route (server) and the control (client), so
// the number a reader sees is computed the same way everywhere.
//
// Scale: 13 grades, A+ down to F, scored 12..0. The bar and the hook line
// fold +/- into the five letters; the "Fans" grade is the mean score mapped
// back to the nearest grade.

export const LETTERS = ["A", "B", "C", "D", "F"] as const;
export type Letter = (typeof LETTERS)[number];

export const GRADES = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "F"] as const;
export type Grade = (typeof GRADES)[number];

export const isGrade = (g: unknown): g is Grade => typeof g === "string" && (GRADES as readonly string[]).includes(g);

/** A+ = 12 ... F = 0 */
export const score = (g: Grade): number => 12 - GRADES.indexOf(g);

/** Nearest grade for a mean score on the 0..12 scale. */
export function gradeForScore(mean: number): Grade {
  const i = 12 - Math.min(12, Math.max(0, Math.round(mean)));
  return GRADES[i];
}

export const letterOf = (g: Grade): Letter => g[0] as Letter;

/** "A-" renders with a real minus sign; the data stays ASCII. */
export const pretty = (g: string) => g.replace("-", "−");

export type Counts = Record<Grade, number>;
export type LetterCounts = Record<Letter, number>;

export type Aggregate = {
  item: string;
  /** Total grades on file. */
  count: number;
  /** Grades per letter, +/- folded in (for the bar). */
  letters: LetterCounts;
  /** Mean score mapped back to a grade; null until there is at least one. */
  fans: Grade | null;
  /** Mean on the 0..12 scale, two decimals; null until there is at least one. */
  mean: number | null;
};

/** Below this many grades the page shows "one of the first N" instead of percentages. */
export const MIN_FOR_STATS = 10;

export const emptyCounts = (): Counts =>
  Object.fromEntries(GRADES.map((g) => [g, 0])) as Counts;

/** Build the public aggregate from per-grade counts (what the store returns). */
export function aggregate(item: string, counts: Partial<Counts>): Aggregate {
  let count = 0;
  let total = 0;
  const letters: LetterCounts = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  for (const g of GRADES) {
    const n = Math.max(0, Math.floor(counts[g] ?? 0));
    if (!n) continue;
    count += n;
    total += n * score(g);
    letters[letterOf(g)] += n;
  }
  const mean = count ? Math.round((total / count) * 100) / 100 : null;
  return { item, count, letters, fans: mean === null ? null : gradeForScore(mean), mean };
}

/** Percent of fans per letter, integers that sum to 100 (largest-remainder). */
export function letterPercents(letters: LetterCounts, count: number): LetterCounts {
  const out: LetterCounts = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  if (!count) return out;
  const raw = LETTERS.map((l) => (letters[l] / count) * 100);
  const floors = raw.map(Math.floor);
  let rest = 100 - floors.reduce((a, b) => a + b, 0);
  const order = raw
    .map((v, i) => ({ i, frac: v - floors[i] }))
    .sort((a, b) => b.frac - a.frac);
  for (const { i } of order) {
    if (rest <= 0) break;
    floors[i] += 1;
    rest -= 1;
  }
  LETTERS.forEach((l, i) => (out[l] = floors[i]));
  return out;
}

/**
 * The hook line. "Tougher than" = the share of fans who graded higher than
 * you (plus half of those on your letter), "kinder than" the reverse; the
 * larger side wins. Returns the number and which word, so the UI can set the
 * figure in bold.
 */
export function standing(you: Grade, letters: LetterCounts, count: number): { word: "tougher" | "kinder"; pct: number } {
  const mine = letterOf(you);
  const idx = LETTERS.indexOf(mine);
  let above = 0;
  let below = 0;
  LETTERS.forEach((l, i) => {
    if (i < idx) above += letters[l];
    if (i > idx) below += letters[l];
  });
  const half = letters[mine] / 2;
  const tougher = Math.round(((above + half) / count) * 100);
  const kinder = Math.round(((below + half) / count) * 100);
  return tougher >= kinder ? { word: "tougher", pct: tougher } : { word: "kinder", pct: kinder };
}

/** "Same as ColorWay" / "Kinder than ColorWay by two steps". */
export function versusColorway(you: Grade, cw: Grade): string {
  const d = score(you) - score(cw);
  if (d === 0) return "Same grade as ColorWay.";
  const n = Math.abs(d);
  const steps = n === 1 ? "one step" : n === 2 ? "two steps" : n === 3 ? "three steps" : `${n} steps`;
  return `${d > 0 ? "Kinder" : "Tougher"} than ColorWay by ${steps}.`;
}
