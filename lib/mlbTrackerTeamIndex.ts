// Server-side builder for the MLB daily tracker's browse-by-team index.
// Parses the rendered tracker HTML (day h2s -> game h3s -> two jersey cards)
// into a per-team log: every game a team appears in, what they wore, and the
// matchup grade, newest first. Consumed by <TrackerTeamIndex />.

export type TeamGame = {
  id: string; // h3 anchor id to jump to
  day: string; // "Jul 17"
  opp: string; // "at Yankees" / "vs Giants" (+ " · G1" for doubleheaders)
  uniform?: string; // "Road Gray" — omitted if the card markup didn't parse
  uniformColor?: string; // swatch hex lifted from the game card's own dot
  img?: string; // jersey shot from the game card, for the calendar thumbnails
  home: boolean; // drives the home/road splits on the team page
  month: string; // "July" — calendar grouping
  date: number; // 19
  oppName: string; // "Angels" (no at/vs prefix)
};

export type TeamIndexEntry = {
  key: string;
  name: string;
  division: string;
  color: string;
  scheduleHref: string;
  games: TeamGame[];
};

// division + primary color + schedule-post slug for all 30 clubs
const TEAMS: Array<[name: string, division: string, color: string, slug: string]> = [
  ["Yankees", "AL East", "#0C2340", "yankees-uniform-schedule-2026"],
  ["Red Sox", "AL East", "#BD3039", "red-sox-uniform-schedule-2026"],
  ["Blue Jays", "AL East", "#134A8E", "blue-jays-uniform-schedule-2026"],
  ["Rays", "AL East", "#8FBCE6", "rays-uniform-schedule-2026"],
  ["Orioles", "AL East", "#DF4601", "orioles-uniform-schedule-2026"],
  ["Guardians", "AL Central", "#00385D", "guardians-uniform-schedule-2026"],
  ["Twins", "AL Central", "#002B5C", "twins-uniform-schedule-2026"],
  ["White Sox", "AL Central", "#27251F", "white-sox-uniform-schedule-2026"],
  ["Tigers", "AL Central", "#0C2340", "tigers-uniform-schedule-2026"],
  ["Royals", "AL Central", "#004687", "royals-uniform-schedule-2026"],
  ["Astros", "AL West", "#EB6E1F", "astros-uniform-schedule-2026"],
  ["Mariners", "AL West", "#0C2C56", "mariners-uniform-schedule-2026"],
  ["Rangers", "AL West", "#003278", "rangers-uniform-schedule-2026"],
  ["Angels", "AL West", "#BA0021", "angels-uniform-schedule-2026"],
  ["Athletics", "AL West", "#003831", "athletics-uniform-schedule-2026"],
  ["Braves", "NL East", "#CE1141", "braves-uniform-schedule-2026"],
  ["Phillies", "NL East", "#E81828", "phillies-uniform-schedule-2026"],
  ["Mets", "NL East", "#FF5910", "mets-uniform-schedule-2026"],
  ["Marlins", "NL East", "#00A3E0", "marlins-uniform-schedule-2026"],
  ["Nationals", "NL East", "#AB0003", "nationals-uniform-schedule-2026"],
  ["Brewers", "NL Central", "#12284B", "brewers-uniform-schedule-2026"],
  ["Cubs", "NL Central", "#0E3386", "cubs-uniform-schedule-2026"],
  ["Cardinals", "NL Central", "#C41E3A", "cardinals-uniform-schedule-2026"],
  ["Pirates", "NL Central", "#FDB827", "pirates-uniform-schedule-2026"],
  ["Reds", "NL Central", "#C6011F", "reds-uniform-schedule-2026"],
  ["Dodgers", "NL West", "#005A9C", "dodgers-uniform-schedule-2026"],
  ["Padres", "NL West", "#2F241D", "padres-uniform-schedule-2026"],
  ["Giants", "NL West", "#FD5A1E", "giants-uniform-schedule-2026"],
  ["Diamondbacks", "NL West", "#A71930", "diamondbacks-uniform-schedule-2026"],
  ["Rockies", "NL West", "#333366", "rockies-uniform-schedule-2026"],
];

const MONTH_ABBR: Record<string, string> = {
  January: "Jan", February: "Feb", March: "Mar", April: "Apr", May: "May",
  June: "Jun", July: "Jul", August: "Aug", September: "Sep", October: "Oct",
  November: "Nov", December: "Dec",
};

function shortDay(dayHeading: string): string {
  // "Friday, July 17" -> "Jul 17"
  const m = dayHeading.match(/^[A-Z][a-z]+, ([A-Z][a-z]+) (\d+)/);
  return m ? `${MONTH_ABBR[m[1]] || m[1]} ${m[2]}` : dayHeading;
}

function parseDayParts(dayHeading: string): { month: string; date: number } {
  // "Friday, July 17" -> { month: "July", date: 17 }
  const m = dayHeading.match(/^[A-Z][a-z]+, ([A-Z][a-z]+) (\d+)/);
  return m ? { month: m[1], date: Number(m[2]) } : { month: "", date: 0 };
}

function shortSuffix(paren: string): string {
  // "(Doubleheader Game 2)" / "(Game 1)" -> "G2" / "G1"
  const m = paren.match(/Game (\d+)/i);
  return m ? `G${m[1]}` : "";
}

const strip = (s: string) => s.replace(/<[^>]+>/g, "").trim();

export function buildMlbTeamIndex(contentHtml: string): TeamIndexEntry[] {
  const byName = new Map<string, TeamIndexEntry>();
  for (const [name, division, color, slug] of TEAMS) {
    byName.set(name, {
      key: name.toLowerCase().replace(/\s+/g, "-"),
      name,
      division,
      color,
      scheduleHref: `/stories/${slug}`,
      games: [],
    });
  }

  // Walk headings in document order, tracking the current day h2.
  const headingRe = /<h([23])[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/g;
  type Slot = { id: string; text: string; day: string; start: number; end: number };
  const slots: Slot[] = [];
  let day = "";
  let match: RegExpExecArray | null;
  const found: Array<{ level: string; id: string; text: string; index: number; length: number }> = [];
  while ((match = headingRe.exec(contentHtml)) !== null) {
    found.push({ level: match[1], id: match[2], text: strip(match[3]), index: match.index, length: match[0].length });
  }
  for (let i = 0; i < found.length; i++) {
    const h = found[i];
    if (h.level === "2") {
      day = /^[A-Z][a-z]+, [A-Z][a-z]+ \d+/.test(h.text) ? h.text : "";
    } else if (h.level === "3" && day && / at /.test(h.text)) {
      slots.push({
        id: h.id,
        text: h.text,
        day,
        start: h.index + h.length,
        end: i + 1 < found.length ? found[i + 1].index : contentHtml.length,
      });
    }
  }

  for (const slot of slots) {
    const m = slot.text.match(/^(.+?) at (.+?)(?:\s*\((.*)\))?$/);
    if (!m) continue;
    const awayName = m[1].trim();
    const homeName = m[2].trim();
    const suffix = m[3] ? shortSuffix(`(${m[3]})`) : "";
    const away = byName.get(awayName);
    const home = byName.get(homeName);
    if (!away && !home) continue;

    const slice = contentHtml.slice(slot.start, slot.end);
    // Each jersey card carries its own colored dot next to the uniform label —
    // lift both so the index swatch always matches the card exactly.
    const uniLabels = [...slice.matchAll(/background: ([^;]+);[^>]*vertical-align: middle;"><\/span>([^<]+)<\/p>/g)].map(
      (u) => ({ color: u[1].trim(), label: u[2].trim() }),
    );
    // Jersey shots appear in the same away-then-home order as the labels.
    const imgs = [...slice.matchAll(/<img[^>]+src="(\/images\/posts\/mlb-daily-tracker\/[^"]+)"/g)].map((m2) => m2[1]);
    const dayShort = shortDay(slot.day);
    const { month, date } = parseDayParts(slot.day);
    const sfx = suffix ? ` · ${suffix}` : "";

    if (away) {
      away.games.push({
        id: slot.id,
        day: dayShort,
        opp: `at ${homeName}${sfx}`,
        uniform: uniLabels.length === 2 ? uniLabels[0].label : undefined,
        uniformColor: uniLabels.length === 2 ? uniLabels[0].color : undefined,
        img: imgs.length === 2 ? imgs[0] : undefined,
        home: false,
        month,
        date,
        oppName: homeName,
      });
    }
    if (home) {
      home.games.push({
        id: slot.id,
        day: dayShort,
        opp: `vs ${awayName}${sfx}`,
        uniform: uniLabels.length === 2 ? uniLabels[1].label : undefined,
        uniformColor: uniLabels.length === 2 ? uniLabels[1].color : undefined,
        img: imgs.length === 2 ? imgs[1] : undefined,
        home: true,
        month,
        date,
        oppName: awayName,
      });
    }
  }

  // Keep division order stable (as declared), teams alphabetical within division.
  return [...byName.values()];
}

// ---- per-team page helpers -------------------------------------------------

export type UniformUsage = {
  uniform: string;
  color?: string;
  img?: string;
  total: number;
  home: number;
  road: number;
};

/** Every uniform a club has worn, most-worn first, split home vs road. */
export function uniformUsage(entry: TeamIndexEntry): UniformUsage[] {
  const byUniform = new Map<string, UniformUsage>();
  for (const g of entry.games) {
    if (!g.uniform) continue;
    let u = byUniform.get(g.uniform);
    if (!u) {
      u = { uniform: g.uniform, color: g.uniformColor, img: g.img, total: 0, home: 0, road: 0 };
      byUniform.set(g.uniform, u);
    }
    u.total += 1;
    if (g.home) u.home += 1;
    else u.road += 1;
    if (!u.img && g.img) u.img = g.img;
  }
  return [...byUniform.values()].sort((a, b) => b.total - a.total || a.uniform.localeCompare(b.uniform));
}

/** Games bucketed by calendar month, oldest month first, days ascending. */
export function gamesByMonth(entry: TeamIndexEntry): Array<{ month: string; games: TeamGame[] }> {
  const order = Object.keys(MONTH_ABBR);
  const byMonth = new Map<string, TeamGame[]>();
  for (const g of entry.games) {
    if (!g.month) continue;
    const list = byMonth.get(g.month) || [];
    list.push(g);
    byMonth.set(g.month, list);
  }
  return [...byMonth.entries()]
    .sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]))
    .map(([month, games]) => ({ month, games: [...games].sort((a, b) => a.date - b.date) }));
}

/** Slugs for generateStaticParams — all 30 clubs. */
export function allTeamKeys(): string[] {
  return TEAMS.map(([name]) => name.toLowerCase().replace(/\s+/g, "-"));
}

export function teamMetaByKey(key: string) {
  const found = TEAMS.find(([name]) => name.toLowerCase().replace(/\s+/g, "-") === key);
  if (!found) return null;
  const [name, division, color, slug] = found;
  return { key, name, division, color, scheduleHref: `/stories/${slug}` };
}
