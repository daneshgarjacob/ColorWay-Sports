// Team Alerts (Jake 11/16): "Tell me what my team is wearing before every game."
//
// SIGNUP ONLY. Nothing here sends, schedules or automates an email; the plan for
// the per-game teaser lives in docs/team-alerts-plan.md.
//
// The switch is OFF by default. While it is off:
//   - the signup box does not render on schedule posts or tracker team pages,
//   - /alerts still builds (so Jake can look at it) but is noindex, not in the
//     sitemap and linked from nowhere, and says plainly that alerts are not live.
// Why off: no per-game email exists yet, so promising "before every game" on
// the live site would be a broken promise, and the beehiiv "Team Alerts" custom
// field has not been confirmed to exist (beehiiv drops unknown fields quietly,
// so nothing breaks, but the team would not be saved).
//
// To turn it on, set NEXT_PUBLIC_TEAM_ALERTS=on in Vercel (Production) and redeploy.
// This file is imported by client components, so it must not touch the disk.

export const TEAM_ALERTS_LIVE = process.env.NEXT_PUBLIC_TEAM_ALERTS === "on";

/** Same id format as My Teams (localStorage `cw-myteams`): "nfl:detroit-lions". */
export type TeamAlertId = string;

export type TeamAlertOption = { id: TeamAlertId; name: string; league: string };

const ID_RE = /^(nfl|nba|nhl|mlb|cfb):[a-z0-9-]{2,60}$/;
export const isTeamAlertId = (v: unknown): v is TeamAlertId => typeof v === "string" && ID_RE.test(v);

/** Post frontmatter league ("college") to the My Teams id prefix ("cfb"). */
export function teamAlertId(league: string | undefined, slug: string | undefined): TeamAlertId | null {
  if (!league || !slug) return null;
  const l = league === "college" ? "cfb" : league.toLowerCase();
  const id = `${l}:${slug}`;
  return isTeamAlertId(id) ? id : null;
}

/** "nfl:detroit-lions" -> "Detroit Lions". Used for followed teams the page has no name for. */
export function nameFromId(id: TeamAlertId): string {
  const slug = id.split(":")[1] ?? id;
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** The most teams one signup can carry; beehiiv custom fields are a single string. */
export const MAX_ALERT_TEAMS = 5;
