import { getAllPosts } from "@/lib/posts";
import { TEAM_LOGOS, teamSlug } from "@/lib/teamLogos";
import { allTeamKeys, teamMetaByKey } from "@/lib/mlbTrackerTeamIndex";

// Uniform schedule + uniform calendar shortcuts for a single club, surfaced
// above the story grid whenever a reader lands on /stories filtered to a team.
//
// Tracking a team's uniforms IS the site. Somebody who types "Dodgers" wants the
// schedule and the calendar, not a reverse-chronological list of every Dodgers
// story we have ever written, so those two destinations go above the grid where
// they cannot be missed. The links are server-rendered, which also hands crawlers
// a direct path from the team hub into the two pages that actually earn.
//
// Everything here is derived at build time from the posts themselves. Publish
// "<team>-uniform-schedule-2027" and tag it with the team, and the button appears
// on its own — there is no hand-kept table to fall out of sync.

export type QuickLinkKind = "schedule" | "calendar";

export interface TeamQuickLink {
  kind: QuickLinkKind;
  label: string;
  href: string;
}

export interface TeamQuickLinksEntry {
  slug: string;
  /** Full club name, e.g. "Los Angeles Dodgers". */
  name: string;
  /** Nickname alone where it is unambiguous league-wide, e.g. "Dodgers". */
  short: string;
  league: string;
  logo?: string;
  links: TeamQuickLink[];
}

// Nicknames that are two words. Everything else is the last word of the club name.
const TWO_WORD_NICKNAMES = [
  "Trail Blazers",
  "Red Sox",
  "White Sox",
  "Blue Jays",
  "Red Wings",
  "Blue Jackets",
  "Maple Leafs",
  "Golden Knights",
  "Hockey Club",
];

function nickname(name: string): string {
  const hit = TWO_WORD_NICKNAMES.find((n) => name.endsWith(n));
  return hit ?? name.split(" ").slice(-1)[0];
}

// League comes off the logo filename ("/logos/teams/nfl-dallas-cowboys.png").
function leagueOf(logoPath: string): string {
  return (logoPath.split("/").pop() ?? "").split("-")[0];
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

interface RawTeam {
  slug: string;
  name: string;
  nick: string;
  league: string;
  logo: string;
}

function rawTeams(): RawTeam[] {
  return Object.entries(TEAM_LOGOS).map(([name, logo]) => ({
    slug: teamSlug(name),
    name,
    nick: nickname(name),
    league: leagueOf(logo),
    logo,
  }));
}

// MLB club -> its /mlb-tracker/<key> calendar page. The tracker keys are the bare
// nicknames ("blue-jays"), so match on the nickname rather than the full slug.
function mlbCalendarKey(nick: string): string | undefined {
  const key = teamSlug(nick);
  return allTeamKeys().includes(key) ? key : undefined;
}

/**
 * Every club that has at least one of the two destinations, keyed by team slug.
 * Clubs with neither are omitted: an empty shortcut bar is worse than none.
 */
export function buildTeamQuickLinks(): Record<string, TeamQuickLinksEntry> {
  const teams = rawTeams();

  // A nickname is only safe to show on its own if exactly one club league-wide
  // answers to it. "Dodgers" is fine; "Cardinals", "Giants", "Rangers",
  // "Panthers", "Jets" and "Kings" each belong to two clubs and get the full name.
  const nickCount = new Map<string, number>();
  for (const t of teams) nickCount.set(t.nick, (nickCount.get(t.nick) ?? 0) + 1);

  // Uniform schedule posts, indexed by the team they are tagged with. Slug shape
  // is checked too so a general team story can never be mistaken for a schedule.
  const scheduleByTeam = new Map<string, string>();
  for (const post of getAllPosts()) {
    if (!/-uniform-schedule-\d{4}$/.test(post.slug)) continue;
    for (const t of post.teams ?? []) {
      if (!scheduleByTeam.has(t)) scheduleByTeam.set(t, post.slug);
    }
  }

  const out: Record<string, TeamQuickLinksEntry> = {};

  for (const t of teams) {
    const unique = (nickCount.get(t.nick) ?? 0) === 1;
    const short = unique ? t.nick : t.name;
    const links: TeamQuickLink[] = [];

    const schedule = scheduleByTeam.get(t.slug);
    if (schedule) {
      links.push({
        kind: "schedule",
        label: `${short} Uniform Schedule`,
        href: `/stories/${schedule}`,
      });
    }

    if (t.league === "mlb") {
      const key = mlbCalendarKey(t.nick);
      if (key && teamMetaByKey(key)) {
        links.push({
          kind: "calendar",
          label: `${short} Uniform Calendar`,
          href: `/mlb-tracker/${key}`,
        });
      }
    }

    if (links.length === 0) continue;

    out[t.slug] = {
      slug: t.slug,
      name: t.name,
      short,
      league: t.league,
      logo: t.logo,
      links,
    };
  }

  return out;
}

/**
 * Clubs a /stories view is about, for either `?team=` or a free-text `?q=`.
 *
 * A search for "Cardinals" legitimately means two different clubs, so this can
 * return more than one — better to offer both than to guess and be wrong half
 * the time. Returns [] when the query is not about a team at all.
 */
export function resolveTeamQuickLinks(
  index: Record<string, TeamQuickLinksEntry>,
  { team, query }: { team?: string; query?: string }
): TeamQuickLinksEntry[] {
  if (team) {
    const hit = index[team];
    return hit ? [hit] : [];
  }

  const q = norm(query ?? "");
  if (q.length < 3) return [];

  const entries = Object.values(index);

  // Exact hit on the slug, the full name, or the nickname.
  const exact = entries.filter(
    (e) =>
      norm(e.slug) === q ||
      norm(e.name) === q ||
      norm(nickname(e.name)) === q
  );
  if (exact.length) return exact;

  // Otherwise the nickname has to appear as a whole word inside the query, so
  // "what are the dodgers wearing" resolves but "red" never matches the Red Sox.
  const words = new Set(q.split(" "));
  const loose = entries.filter((e) => {
    const nick = norm(nickname(e.name));
    return nick.includes(" ") ? q.includes(nick) : words.has(nick);
  });

  return loose.length <= 3 ? loose : [];
}
