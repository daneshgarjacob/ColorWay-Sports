// Direct-sold "presented by" sponsors. One entry per deal; the strip renders under
// the byline of every post in `slugs` while `enabled` is true and today (US
// Eastern) is inside [start, end]. Flip `enabled` and push to start or stop a deal.
// Links carry UTM tags so the sponsor can see visits and sales from each page.

import { unstable_cache } from "next/cache";

export type Sponsor = {
  id: string;
  name: string;
  label: string; // "NFL Uniform Schedules presented by"
  line: string; // the sponsor's short line, shown beside the logo
  logo: string; // transparent PNG under public/
  logoWidth: number;
  logoHeight: number;
  logoDisplayHeight?: number; // on-page height in px (default 22, the Daps wordmark)
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
    // Daps trial (Matthew Makabeh, 10/26): Sun Nov 1 through Sun Nov 8, two NFL
    // Sundays. Commission only (20% of sales via the UTM link).
    id: "daps",
    name: "Daps",
    label: "NFL Uniform Schedules presented by",
    line: "energy made easy",
    logo: "/images/sponsors/daps-logo-blue.png",
    logoWidth: 360,
    logoHeight: 142,
    url: "https://daps.shop/products/energy-strips",
    campaign: "colorway_nfl_schedules_trial",
    enabled: true,
    start: "2026-11-01",
    end: "2026-11-08",
    slugs: NFL_TEAM_SCHEDULES,
  },
  {
    // TrophySmack trial (Josh Weaver, 11/24): $150 flat for Tue Dec 1 through Thu
    // Dec 31 on all 32 NFL team schedule pages; report first week of January.
    // NOT LIVE: flip `enabled` once the sponsor confirms logo, line, URL and payment.
    // Logo: square fantasy badge (sponsor's preference). Alternative supplied:
    // /images/sponsors/trophysmack-wordmark.png (720x199, use logoDisplayHeight 30).
    id: "trophysmack",
    name: "TrophySmack",
    label: "NFL Uniform Schedules presented by",
    // Josh 11/25: Option A (badge), this line, and the fantasy trophies collection link.
    line: "Fantasy Football Trophies and Belts",
    logo: "/images/sponsors/trophysmack-badge.png",
    logoWidth: 353,
    logoHeight: 400,
    logoDisplayHeight: 56,
    url: "https://www.trophysmack.com/collections/fantasy-football-trophies",
    campaign: "colorway_nfl_schedules_dec_trial",
    enabled: false,
    start: "2026-12-01",
    end: "2026-12-31",
    slugs: NFL_TEAM_SCHEDULES,
  },
];

function etToday(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(now);
}

/** The active sponsor for a post, with its tracked link, or null. */
export function sponsorForPost(slug: string, now = new Date()): (Sponsor & { href: string }) | null {
  const today = etToday(now);
  // Local preview only: SPONSOR_PREVIEW=<id> in .env.local shows that sponsor's
  // strip regardless of `enabled` and dates. Never set in production.
  const preview = process.env.NODE_ENV !== "production" ? process.env.SPONSOR_PREVIEW : undefined;
  const s = SPONSORS.find(
    (x) => x.slugs.includes(slug) && (x.id === preview || (x.enabled && today >= x.start && today <= x.end))
  );
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

/** Keep sponsored pages re-rendering while a deal is upcoming or running, so the
 * strip appears on its start date and comes down after its end date without a
 * deploy (static pages otherwise only re-render on deploy or around game days). */
export async function revalidateForSponsors(slug: string, now = new Date()): Promise<void> {
  const today = etToday(now);
  const live = SPONSORS.some((x) => x.enabled && x.slugs.includes(slug) && today <= dayAfter(x.end));
  if (!live) return;
  await unstable_cache(async () => true, ["sponsor-window-ttl"], { revalidate: 3 * 3600 })();
}

function dayAfter(ymd: string): string {
  const d = new Date(`${ymd}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}
