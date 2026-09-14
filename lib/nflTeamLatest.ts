// Pulls one club's most recent PLAYED game out of the NFL uniform tracker so the
// team's schedule post (the page that ranks for "what are the Chargers wearing")
// can answer "what were they wearing" with the real helmet, jersey and pants.
//
// Same reasoning as lib/mlbTeamLatest.ts: Google sends team queries to the team
// page, so the freshness goes there instead of onto the league-wide tracker.
//
// Only games carrying a "Final" pill count. Unplayed preview cards ("Not yet
// worn") are skipped, so the block never claims a look before kickoff.

export type NflLatest = {
  /** Full club name, e.g. "Los Angeles Chargers". */
  team: string;
  /** "Chargers". */
  nickname: string;
  /** "Sunday, September 13" — the tracker's day heading. */
  day: string;
  /** "Week 1" when the card says so. */
  week: string | null;
  opponent: string;
  home: boolean;
  helmet: string;
  jersey: string;
  pants: string;
  img: string | null;
  /** "Cardinals 26, Chargers 14". */
  final: string;
  trackerHref: string;
  /** Played games logged for this club, preseason excluded. */
  logged: number;
};

const TRACKER = "/stories/nfl-uniform-tracker-2026";

const strip = (s: string) =>
  s
    .replace(/<[^>]+>/g, "")
    .replace(/&middot;/g, "·")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

type Slot = { id: string; text: string; day: string; body: string };

function slots(html: string): Slot[] {
  // The preseason log sits below the regular season; it is not "what they wore
  // last game" once the season is on, so stop there.
  const cut = html.search(/<h2[^>]*>[^<]*Preseason/i);
  const season = cut === -1 ? html : html.slice(0, cut);

  const re = /<h([23])[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/g;
  const found: { level: string; id: string; text: string; start: number; end: number }[] = [];
  for (const m of season.matchAll(re)) {
    found.push({ level: m[1], id: m[2], text: strip(m[3]), start: m.index!, end: m.index! + m[0].length });
  }

  const out: Slot[] = [];
  let day = "";
  found.forEach((h, i) => {
    if (h.level === "2") {
      day = h.text;
      return;
    }
    const next = found[i + 1];
    out.push({ id: h.id, text: h.text, day, body: season.slice(h.end, next ? next.start : season.length) });
  });
  return out;
}

/**
 * Resolve a schedule-post team (full name, e.g. "Los Angeles Chargers") to its
 * latest played tracker game. Returns null when the club has none yet.
 */
export function getNflLatestFromTracker(trackerHtml: string, team: string): NflLatest | null {
  const nickname = team.split(" ").slice(-1)[0];
  let latest: NflLatest | null = null;
  let logged = 0;

  // Tracker days run newest first, so the first played match is the latest.
  for (const s of slots(trackerHtml)) {
    const [away, home] = s.text.split(/\s+at\s+/);
    if (!home || (away !== team && home !== team)) continue;

    const final = /Final\s*(?:&middot;|·)\s*([^<]+)/.exec(s.body);
    if (!final) continue;
    logged += 1;
    if (latest) continue;

    // Two sides per card, away first: label, then "Helmet · Jersey · Pants".
    const sides = [
      ...s.body.matchAll(
        /<img src="([^"]+)"[\s\S]*?font-weight:900;[^"]*">([^<]+)<\/p><p[^>]*>([^<]+)<\/p>/g,
      ),
    ];
    const side = sides.find((m) => strip(m[2]).toLowerCase() === nickname.toLowerCase());
    if (!side) continue;
    const [helmet, jersey, pants] = strip(side[3]).split(" · ");
    if (!helmet || !jersey || !pants) continue;

    const isHome = home === team;
    const week = /(Week \d+)/.exec(strip(s.body));
    latest = {
      team,
      nickname,
      day: s.day,
      week: week ? week[1] : null,
      opponent: isHome ? away : home,
      home: isHome,
      helmet,
      jersey,
      pants,
      img: side[1],
      final: strip(final[1]),
      trackerHref: `${TRACKER}#${s.id}`,
      logged: 0,
    };
  }

  return latest ? { ...latest, logged } : null;
}

/** Visible questions and schema questions come from one place so they never drift. */
export function nflWearQuestions(nickname: string) {
  return {
    were: `What were the ${nickname} wearing?`,
    lastGame: `What uniform did the ${nickname} wear in their last game?`,
  };
}

/** "white helmets, powder blue jerseys and white pants" */
export function nflComboSentence(g: Pick<NflLatest, "helmet" | "jersey" | "pants">) {
  const l = (s: string) => s.toLowerCase();
  return `${l(g.helmet)} helmets, ${l(g.jersey)} jerseys and ${l(g.pants)} pants`;
}
