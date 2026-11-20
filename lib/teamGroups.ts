// Browse by league, division and conference (Jake 11/19: "If you want to just
// look for NFL, you can do that. If you want to look just AFC West, you can do
// that. If you want to just look for the Big Ten..."). One static map of
// league -> division/conference -> clubs, shared by the league pages (/nfl),
// the division and conference pages (/nfl/afc-west, /college-football/big-ten),
// the /stories filter bar, the header menus and the breadcrumbs.
//
// Pure data, no fs: the header (a client component) imports it.
//
// Team ids are the My Teams card slugs (lib/myTeams.ts, the /teams/<league>/<slug>
// pages). groupProblems() below lists any club missing from the map or listed
// twice; the league pages log it and show unmapped clubs under "More Teams".

import { teamSlug } from "@/lib/teamLogos";

export type HubLeague = "nfl" | "nba" | "nhl" | "mlb" | "cfb";

export interface LeagueHub {
  key: HubLeague;
  /** My Teams card league ("NFL", "CFB"). */
  code: "NFL" | "NBA" | "NHL" | "MLB" | "CFB";
  /** Header rail label. */
  navLabel: string;
  name: string;
  path: string;
  /** Post frontmatter `league:` value, for /stories?league=. */
  storiesLeague: string;
  /** The Wire's tag for this league. */
  wireTag: "NFL" | "NBA" | "NHL" | "MLB" | "College";
  groupWord: "Division" | "Conference";
  logo: string;
  /** Daily tracker + per-team calendars, when the league has them. */
  tracker?: { label: string; href: string };
  calendars?: { label: string; href: string };
  records?: { label: string; href: string };
}

export const LEAGUE_HUBS: LeagueHub[] = [
  {
    key: "nfl", code: "NFL", navLabel: "NFL", name: "NFL", path: "/nfl", storiesLeague: "nfl", wireTag: "NFL",
    groupWord: "Division", logo: "/logos/leagues/nfl.png",
    tracker: { label: "NFL Uniform Tracker", href: "/stories/nfl-uniform-tracker-2026" },
    calendars: { label: "Team Calendars", href: "/nfl-tracker" },
    records: { label: "Uniform Records", href: "/uniform-records" },
  },
  {
    key: "cfb", code: "CFB", navLabel: "CFB", name: "College Football", path: "/college-football", storiesLeague: "college",
    wireTag: "College", groupWord: "Conference", logo: "/logos/leagues/college-football.svg",
  },
  {
    key: "nba", code: "NBA", navLabel: "NBA", name: "NBA", path: "/nba", storiesLeague: "nba", wireTag: "NBA",
    groupWord: "Division", logo: "/logos/leagues/nba.png",
    tracker: { label: "NBA Uniform Tracker", href: "/stories/nba-uniform-tracker-2026-27" },
    calendars: { label: "Team Calendars", href: "/nba-tracker" },
    records: { label: "Uniform Records", href: "/uniform-records" },
  },
  {
    key: "nhl", code: "NHL", navLabel: "NHL", name: "NHL", path: "/nhl", storiesLeague: "nhl", wireTag: "NHL",
    groupWord: "Division", logo: "/logos/leagues/nhl.png",
    tracker: { label: "NHL Uniform Tracker", href: "/stories/nhl-uniform-tracker-2026-27" },
    calendars: { label: "Team Calendars", href: "/nhl-tracker" },
    records: { label: "Uniform Records", href: "/uniform-records" },
  },
  {
    key: "mlb", code: "MLB", navLabel: "MLB", name: "MLB", path: "/mlb", storiesLeague: "mlb", wireTag: "MLB",
    groupWord: "Division", logo: "/logos/leagues/mlb.png",
    tracker: { label: "MLB Uniform Tracker", href: "/stories/mlb-uniform-tracker-2026" },
    calendars: { label: "Team Calendars", href: "/mlb-tracker" },
  },
];

export const hubByKey = (k: string) => LEAGUE_HUBS.find((h) => h.key === k);
export const hubByNavLabel = (label: string) => LEAGUE_HUBS.find((h) => h.navLabel === label);
export const hubByStoriesLeague = (l: string) => LEAGUE_HUBS.find((h) => h.storiesLeague === l);

export interface TeamGroup {
  league: HubLeague;
  /** URL segment: /nfl/<slug>. */
  slug: string;
  name: string;
  /** "AFC" / "NFC", "AL" / "NL", "East" / "West": the parent, for grouping chips. */
  parent?: string;
  /** Card slugs (lib/myTeams ids without the league). */
  teams: string[];
  /** Post tag for the whole group (college conferences tag their posts: "sec", "big-ten"). */
  storyTag?: string;
  logo?: string;
}

// College conferences, school display names as the header menu lists them
// (moved here from components/Header.tsx 11/19 so the menu and the conference
// pages can never disagree). Membership checked against ESPN for 2026.
// Six schools with team pages but no header row until 11/19 joined their
// conferences: Louisiana, Southern Miss, Troy (Sun Belt), UAB (American),
// Western Kentucky (Conference USA), Wyoming (Mountain West).
export const CFB_CONFERENCE_SCHOOLS: Record<string, string[]> = {
  "SEC": [
    "Alabama Crimson Tide", "Arkansas Razorbacks", "Auburn Tigers", "Florida Gators", "Georgia Bulldogs",
    "Kentucky Wildcats", "LSU Tigers", "Mississippi State Bulldogs", "Missouri Tigers", "Oklahoma Sooners",
    "Ole Miss Rebels", "South Carolina Gamecocks", "Tennessee Volunteers", "Texas Longhorns", "Texas A&M Aggies",
    "Vanderbilt Commodores",
  ],
  "Big Ten": [
    "Illinois Fighting Illini", "Indiana Hoosiers", "Iowa Hawkeyes", "Maryland Terrapins", "Michigan Wolverines",
    "Michigan State Spartans", "Minnesota Golden Gophers", "Nebraska Cornhuskers", "Northwestern Wildcats",
    "Ohio State Buckeyes", "Oregon Ducks", "Penn State Nittany Lions", "Purdue Boilermakers",
    "Rutgers Scarlet Knights", "UCLA Bruins", "USC Trojans", "Washington Huskies", "Wisconsin Badgers",
  ],
  "ACC": [
    "Boston College Eagles", "Cal Golden Bears", "Clemson Tigers", "Duke Blue Devils", "Florida State Seminoles",
    "Georgia Tech Yellow Jackets", "Louisville Cardinals", "Miami Hurricanes", "NC State Wolfpack",
    "North Carolina Tar Heels", "Pitt Panthers", "SMU Mustangs", "Stanford Cardinal", "Syracuse Orange",
    "Virginia Cavaliers", "Virginia Tech Hokies", "Wake Forest Demon Deacons",
  ],
  "Big 12": [
    "Arizona Wildcats", "Arizona State Sun Devils", "Baylor Bears", "BYU Cougars", "Cincinnati Bearcats",
    "Colorado Buffaloes", "Houston Cougars", "Iowa State Cyclones", "Kansas Jayhawks", "Kansas State Wildcats",
    "Oklahoma State Cowboys", "TCU Horned Frogs", "Texas Tech Red Raiders", "UCF Knights", "Utah Utes",
    "West Virginia Mountaineers",
  ],
  "Pac-12": [
    "Boise State Broncos", "Colorado State Rams", "Fresno State Bulldogs", "Oregon State Beavers",
    "San Diego State Aztecs", "Texas State Bobcats", "Utah State Aggies", "Washington State Cougars",
  ],
  "American Conference": [
    "Army Black Knights", "East Carolina Pirates", "Memphis Tigers", "Navy Midshipmen", "North Texas Mean Green",
    "Rice Owls", "South Florida Bulls", "Temple Owls", "Tulane Green Wave", "Tulsa Golden Hurricane",
    "UAB Blazers", "UTSA Roadrunners",
  ],
  "Mountain West": ["Air Force Falcons", "Hawaii Rainbow Warriors", "UNLV Rebels", "Wyoming Cowboys"],
  "Sun Belt": [
    "Appalachian State Mountaineers", "Coastal Carolina Chanticleers", "Georgia Southern Eagles",
    "James Madison Dukes", "Louisiana Ragin' Cajuns", "Marshall Thundering Herd", "Southern Miss Golden Eagles",
    "Troy Trojans",
  ],
  "MAC": ["Buffalo Bulls", "Toledo Rockets"],
  "Conference USA": ["Liberty Flames", "Western Kentucky Hilltoppers"],
  "FBS Independents": ["Notre Dame Fighting Irish", "UConn Huskies"],
};

const g = (league: HubLeague, name: string, parent: string | undefined, teams: string[]): TeamGroup => ({
  league, slug: teamSlug(name), name, parent, teams,
});

export const TEAM_GROUPS: TeamGroup[] = [
  // NFL
  g("nfl", "AFC East", "AFC", ["buffalo-bills", "miami-dolphins", "new-england-patriots", "new-york-jets"]),
  g("nfl", "AFC North", "AFC", ["baltimore-ravens", "cincinnati-bengals", "cleveland-browns", "pittsburgh-steelers"]),
  g("nfl", "AFC South", "AFC", ["houston-texans", "indianapolis-colts", "jacksonville-jaguars", "tennessee-titans"]),
  g("nfl", "AFC West", "AFC", ["denver-broncos", "kansas-city-chiefs", "las-vegas-raiders", "los-angeles-chargers"]),
  g("nfl", "NFC East", "NFC", ["dallas-cowboys", "new-york-giants", "philadelphia-eagles", "washington-commanders"]),
  g("nfl", "NFC North", "NFC", ["chicago-bears", "detroit-lions", "green-bay-packers", "minnesota-vikings"]),
  g("nfl", "NFC South", "NFC", ["atlanta-falcons", "carolina-panthers", "new-orleans-saints", "tampa-bay-buccaneers"]),
  g("nfl", "NFC West", "NFC", ["arizona-cardinals", "los-angeles-rams", "san-francisco-49ers", "seattle-seahawks"]),
  // College football conferences
  ...Object.entries(CFB_CONFERENCE_SCHOOLS).map(([conf, schools]) => ({
    ...g("cfb", conf, undefined, schools.map(teamSlug)),
    storyTag: teamSlug(conf),
    logo: `/logos/leagues/ncaa-conf-${teamSlug(conf)}.png`,
  })),
  // NBA
  g("nba", "Atlantic", "East", ["boston-celtics", "brooklyn-nets", "new-york-knicks", "philadelphia-76ers", "toronto-raptors"]),
  g("nba", "Central", "East", ["chicago-bulls", "cleveland-cavaliers", "detroit-pistons", "indiana-pacers", "milwaukee-bucks"]),
  g("nba", "Southeast", "East", ["atlanta-hawks", "charlotte-hornets", "miami-heat", "orlando-magic", "washington-wizards"]),
  g("nba", "Northwest", "West", ["denver-nuggets", "minnesota-timberwolves", "oklahoma-city-thunder", "portland-trail-blazers", "utah-jazz"]),
  g("nba", "Pacific", "West", ["golden-state-warriors", "la-clippers", "los-angeles-lakers", "phoenix-suns", "sacramento-kings"]),
  g("nba", "Southwest", "West", ["dallas-mavericks", "houston-rockets", "memphis-grizzlies", "new-orleans-pelicans", "san-antonio-spurs"]),
  // NHL (2026-27)
  g("nhl", "Atlantic", "East", ["boston-bruins", "buffalo-sabres", "detroit-red-wings", "florida-panthers", "montreal-canadiens", "ottawa-senators", "tampa-bay-lightning", "toronto-maple-leafs"]),
  g("nhl", "Metropolitan", "East", ["carolina-hurricanes", "columbus-blue-jackets", "new-jersey-devils", "new-york-islanders", "new-york-rangers", "philadelphia-flyers", "pittsburgh-penguins", "washington-capitals"]),
  g("nhl", "Central", "West", ["chicago-blackhawks", "colorado-avalanche", "dallas-stars", "minnesota-wild", "nashville-predators", "st-louis-blues", "utah-mammoth", "winnipeg-jets"]),
  g("nhl", "Pacific", "West", ["anaheim-ducks", "calgary-flames", "edmonton-oilers", "los-angeles-kings", "san-jose-sharks", "seattle-kraken", "vancouver-canucks", "vegas-golden-knights"]),
  // MLB
  g("mlb", "AL East", "AL", ["baltimore-orioles", "boston-red-sox", "new-york-yankees", "tampa-bay-rays", "toronto-blue-jays"]),
  g("mlb", "AL Central", "AL", ["chicago-white-sox", "cleveland-guardians", "detroit-tigers", "kansas-city-royals", "minnesota-twins"]),
  g("mlb", "AL West", "AL", ["oakland-athletics", "houston-astros", "los-angeles-angels", "seattle-mariners", "texas-rangers"]),
  g("mlb", "NL East", "NL", ["atlanta-braves", "miami-marlins", "new-york-mets", "philadelphia-phillies", "washington-nationals"]),
  g("mlb", "NL Central", "NL", ["chicago-cubs", "cincinnati-reds", "milwaukee-brewers", "pittsburgh-pirates", "st-louis-cardinals"]),
  g("mlb", "NL West", "NL", ["arizona-diamondbacks", "colorado-rockies", "los-angeles-dodgers", "san-diego-padres", "san-francisco-giants"]),
];

export const groupsOf = (league: HubLeague) => TEAM_GROUPS.filter((x) => x.league === league);
export const findGroup = (league: string, slug: string) => TEAM_GROUPS.find((x) => x.league === league && x.slug === slug);
export const groupPath = (x: TeamGroup) => `${hubByKey(x.league)!.path}/${x.slug}`;
/** The group a club is in: groupOfTeam("nfl", "denver-broncos") -> AFC West. */
export const groupOfTeam = (league: string, slug: string) =>
  TEAM_GROUPS.find((x) => x.league === league && x.teams.includes(slug));

/** Short group label for chips: "AFC West", "Big Ten", "Atlantic". */
export const groupLabel = (x: TeamGroup) => x.name;
/** Full label for headings: "NBA Atlantic Division", "AFC West", "Big Ten". */
export function groupTitle(x: TeamGroup): string {
  if (x.league === "nfl" || x.league === "cfb" || x.league === "mlb") return x.name;
  return `${hubByKey(x.league)!.name} ${x.name} Division`;
}

// Card slug -> the slug posts are tagged with, where they differ. The A's card
// is built from the logo file (mlb-oakland-athletics.png); posts say "athletics".
const STORY_TEAM_ALIAS: Record<string, string> = { "oakland-athletics": "athletics" };
export const storyTeamSlug = (cardSlug: string) => STORY_TEAM_ALIAS[cardSlug] ?? cardSlug;
const CARD_ALIAS: Record<string, string> = Object.fromEntries(Object.entries(STORY_TEAM_ALIAS).map(([a, b]) => [b, a]));
/** Post tag -> card slug ("athletics" -> "oakland-athletics"). */
export const cardTeamSlug = (storySlug: string) => CARD_ALIAS[storySlug] ?? storySlug;

/** Which league + group a post tag ("denver-broncos", "sec") belongs to. */
export function locateTag(tag: string): { league: HubLeague; group?: TeamGroup; team?: string } | undefined {
  const conf = TEAM_GROUPS.find((x) => x.storyTag === tag);
  if (conf) return { league: conf.league, group: conf };
  const slug = cardTeamSlug(tag);
  // A slug can exist in two leagues only in theory (none do today); the
  // pro leagues win, then college.
  for (const k of ["nfl", "nba", "nhl", "mlb", "cfb"] as HubLeague[]) {
    const grp = groupOfTeam(k, slug);
    if (grp) return { league: k, group: grp, team: slug };
  }
  return undefined;
}

/**
 * Clubs listed twice in a league, clubs with a team page but no group, and
 * group entries with no team page. Never throws: a new college schedule post
 * must not fail the build, it just shows under "More Teams" until mapped.
 */
export function groupProblems(cardIds: string[]): string[] {
  const problems: string[] = [];
  for (const hub of LEAGUE_HUBS) {
    const seen = new Map<string, string>();
    for (const grp of groupsOf(hub.key)) {
      for (const t of grp.teams) {
        if (seen.has(t)) problems.push(`${hub.key}:${t} is in both ${seen.get(t)} and ${grp.name}`);
        seen.set(t, grp.name);
      }
    }
    const ids = cardIds.filter((id) => id.startsWith(`${hub.key}:`)).map((id) => id.split(":")[1]);
    for (const id of ids) if (!seen.has(id)) problems.push(`${hub.key}:${id} has no ${hub.groupWord.toLowerCase()}`);
    for (const t of seen.keys()) if (!ids.includes(t)) problems.push(`${hub.key}:${t} has no team page`);
  }
  return problems;
}
