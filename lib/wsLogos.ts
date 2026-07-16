// Data for the World Series logo grader (/world-series-logo-grader) and the
// companion post (/stories/world-series-logo-history-1986-2025).
//
// 1986 is the start of the modern uninterrupted run of year-specific World Series
// marks, and it is also where a sourceable logo record begins. It matches the span
// of the NBA Finals logo history post, so the two are comparable era for era.

/** What a reader can pick. Deliberately the 5 plain letters, no +/- pickers. */
export type Grade = "A" | "B" | "C" | "D" | "F";
export const GRADES: Grade[] = ["A", "B", "C", "D", "F"];

/** What ColorWay grades with — finer, so the era board can use +/-. */
export type CwGrade = "A" | "A-" | "B+" | "B" | "B-" | "C+" | "C" | "C-" | "D" | "F";

/** Every grade gets its own colour, brightest at A down to deep red at F. */
export const GRADE_GRADIENT: Record<CwGrade, [string, string]> = {
  "A":  ["#0b8f3f", "#06b36a"],
  "A-": ["#2f9e2f", "#6fce2a"],
  "B+": ["#7fb01a", "#b8d422"],
  "B":  ["#c9a417", "#f2c94c"],
  "B-": ["#e08a12", "#ffb648"],
  "C+": ["#e2760f", "#ffa047"],
  "C":  ["#e2620f", "#ff9147"],
  "C-": ["#d94a12", "#ff7a3d"],
  "D":  ["#c72d1e", "#ff5f45"],
  "F":  ["#8e1220", "#d92b3c"],
};

export type LogoYear = {
  year: number;
  /** "Winner over Loser", or the strike note for 1994. */
  result: string;
  era: string;
  /** ColorWay's own era grade, shown next to the reader's pick. */
  cwGrade: CwGrade;
};

// Jake's grades, set 2026-07-15. Note this board runs against the usual nostalgia
// consensus: the modern navy era tops it and the beloved nineties globe-and-bat era
// sits at B-. That inversion is the spine of the post.
export const ERAS: { name: string; years: [number, number]; grade: CwGrade }[] = [
  { name: "The Standalone Wordmark", years: [1986, 1986], grade: "C" },
  { name: "The Green Diamond Script Era", years: [1987, 1991], grade: "B-" },
  { name: "The Globe and Bat Era", years: [1992, 1997], grade: "B-" },
  { name: "The Y2K Swoosh Era", years: [1998, 2002], grade: "A-" },
  { name: "The Chrome Era", years: [2003, 2007], grade: "A-" },
  { name: "The Fall Classic Era", years: [2008, 2014], grade: "B+" },
  { name: "The Modern Navy Era", years: [2015, 2021], grade: "A" },
  { name: "The Capital One Era", years: [2022, 2025], grade: "D" },
];

/** Fanatics affiliate deep link (SSAID 7169536) for a gear search. */
export const fanaticsSearch = (query: string) =>
  `https://fanatics.93n6tx.net/5kZn3j?u=${encodeURIComponent(
    `https://www.fanatics.com/search?query=${encodeURIComponent(query)}`
  )}`;

const RESULTS: Record<number, string> = {
  1986: "Mets over Red Sox", 1987: "Twins over Cardinals", 1988: "Dodgers over Athletics",
  1989: "Athletics over Giants", 1990: "Reds over Athletics", 1991: "Twins over Braves",
  1992: "Blue Jays over Braves", 1993: "Blue Jays over Phillies",
  1994: "Cancelled by the players strike", 1995: "Braves over Indians",
  1996: "Yankees over Braves", 1997: "Marlins over Indians", 1998: "Yankees over Padres",
  1999: "Yankees over Braves", 2000: "Yankees over Mets", 2001: "Diamondbacks over Yankees",
  2002: "Angels over Giants", 2003: "Marlins over Yankees", 2004: "Red Sox over Cardinals",
  2005: "White Sox over Astros", 2006: "Cardinals over Tigers", 2007: "Red Sox over Rockies",
  2008: "Phillies over Rays", 2009: "Yankees over Phillies", 2010: "Giants over Rangers",
  2011: "Cardinals over Rangers", 2012: "Giants over Tigers", 2013: "Red Sox over Cardinals",
  2014: "Giants over Royals", 2015: "Royals over Mets", 2016: "Cubs over Indians",
  2017: "Astros over Dodgers", 2018: "Red Sox over Dodgers", 2019: "Nationals over Astros",
  2020: "Dodgers over Rays", 2021: "Braves over Astros", 2022: "Astros over Phillies",
  2023: "Rangers over Diamondbacks", 2024: "Dodgers over Yankees", 2025: "Dodgers over Blue Jays",
};

export const FIRST_YEAR = 1986;
export const LAST_YEAR = 2025;

export const YEARS: LogoYear[] = Array.from(
  { length: LAST_YEAR - FIRST_YEAR + 1 },
  (_, i) => {
    const year = FIRST_YEAR + i;
    const era = ERAS.find((e) => year >= e.years[0] && year <= e.years[1])!;
    return { year, result: RESULTS[year], era: era.name, cwGrade: era.grade };
  }
);

export const logoSrc = (year: number) => `/images/posts/world-series-logo-history/${year}.png`;

// ---- Share encoding -------------------------------------------------------
// One character per year in chronological order, "-" for ungraded. Notes are
// deliberately NOT shared: they are personal, they would blow past a sane URL
// length, and a shared link should not carry someone's free text.
const EMPTY = "-";

export function encodeGrades(g: Record<number, Grade>): string {
  return YEARS.map((y) => g[y.year] ?? EMPTY).join("");
}

export function decodeGrades(s: string): Record<number, Grade> {
  const out: Record<number, Grade> = {};
  if (!s) return out;
  for (let i = 0; i < YEARS.length && i < s.length; i++) {
    const c = s[i].toUpperCase();
    if ((GRADES as string[]).includes(c)) out[YEARS[i].year] = c as Grade;
  }
  return out;
}

/** Best-graded year, earliest wins ties — used for the shared link's preview title. */
export function topPick(g: Record<number, Grade>): number | null {
  let best: number | null = null;
  let bestRank = 99;
  for (const y of YEARS) {
    const grade = g[y.year];
    if (!grade) continue;
    const rank = GRADES.indexOf(grade);
    if (rank < bestRank) { bestRank = rank; best = y.year; }
  }
  return best;
}
