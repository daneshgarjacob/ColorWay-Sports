// Direct-sold "presented by" sponsors. One entry per deal; the strip renders under
// the byline of every post in `slugs` while `enabled` is true and today (US
// Eastern) is inside [start, end]. Flip `enabled` and push to start or stop a deal.
// Links carry UTM tags so the sponsor can see visits and sales from each page.

export type Sponsor = {
  id: string;
  name: string;
  label: string; // "NFL Uniform Schedules presented by"
  line: string; // the sponsor's short line, shown beside the logo
  logo: string; // transparent PNG under public/
  logoWidth: number;
  logoHeight: number;
  url: string; // landing page, UTM tags added per page
  campaign: string;
  enabled: boolean;
  start: string; // YYYY-MM-DD, Eastern, inclusive
  end: string; // YYYY-MM-DD, Eastern, inclusive
  slugs: string[];
};

const NFL_TEAM_SCHEDULES = [
  "49ers", "arizona-cardinals", "bears", "bengals", "bills", "broncos", "browns", "buccaneers",
  "chargers", "chiefs", "colts", "commanders", "cowboys", "dolphins", "eagles", "falcons",
  "jaguars", "jets", "lions", "new-york-giants", "packers", "panthers", "patriots", "raiders",
  "rams", "ravens", "saints", "seahawks", "steelers", "texans", "titans", "vikings",
].map((t) => `${t}-uniform-schedule-2026`);

export const SPONSORS: Sponsor[] = [
  {
    // Daps one-week trial (Matthew Makabeh, 10/26). Waiting on Mediavine's OK for
    // direct-sold static units before going live; set the dates when it starts.
    id: "daps",
    name: "Daps",
    label: "NFL Uniform Schedules presented by",
    line: "energy made easy",
    logo: "/images/sponsors/daps-logo-blue.png",
    logoWidth: 360,
    logoHeight: 142,
    url: "https://daps.shop/products/energy-strips",
    campaign: "colorway_nfl_schedules_trial",
    enabled: false,
    start: "2026-11-01",
    end: "2026-11-07",
    slugs: NFL_TEAM_SCHEDULES,
  },
];

function etToday(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(now);
}

/** The active sponsor for a post, with its tracked link, or null. */
export function sponsorForPost(slug: string, now = new Date()): (Sponsor & { href: string }) | null {
  const today = etToday(now);
  const s = SPONSORS.find((x) => x.enabled && x.slugs.includes(slug) && today >= x.start && today <= x.end);
  if (!s) return null;
  const content = slug.replace(/-uniform-schedule-\d{4}(-\d{2})?$/, "");
  const q = new URLSearchParams({
    utm_source: "colorwaysports",
    utm_medium: "sponsorship",
    utm_campaign: s.campaign,
    utm_content: content,
  });
  return { ...s, href: `${s.url}?${q.toString()}` };
}
