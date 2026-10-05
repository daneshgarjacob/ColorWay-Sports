// The embeddable "What is my team wearing this week" widget.
//
// Other sites paste an iframe and get a small card with their team's uniform for
// the upcoming game, plus a followed "Uniform data by ColorWay Sports" link back
// to that team's schedule post. Each league plugs in through one adapter that
// turns its own data (NFL: schedule-post week cells + tracker cards) into the
// league-neutral card below, so the renderer and the route never change when a
// league is added.

export type EmbedStatus = "confirmed" | "expected" | "worn";

export type EmbedPart = {
  /** "Helmet", "Jersey", "Pants" (MLB might use "Cap", "Jersey", "Pants"). */
  part: string;
  /** "Silver", or "TBA" when nothing official and no projection exists. */
  label: string;
  hex?: string;
};

export type EmbedCard = {
  league: string;        // "nfl"
  leagueLabel: string;   // "NFL"
  teamName: string;      // "Detroit Lions"
  nickname: string;      // "Lions"
  logo?: string;         // public path
  accent: string;        // team colour for the top rule
  /** "Week 5", "Game 3", "Tonight". */
  period: string;
  /** "at Bengals" / "vs Packers". */
  matchup: string;
  /** "Sun, Oct 11" or the week window when no exact date is known. */
  when: string;
  /** Headline uniform name, as the schedule post words it ("Honolulu Blue"). */
  uniform: string;
  parts: EmbedPart[];
  /** Jersey photo (public path), only when it maps exactly. */
  image?: string;
  imageAlt?: string;
  /** Fallback swatch colour for the jersey drawing when there is no photo. */
  swatch: string;
  status: EmbedStatus;
  /** One short line under the status, e.g. "Helmet and pants are our read". */
  statusNote?: string;
  /** "Bye in Week 5", shown above the card when we skipped a week. */
  notice?: string;
  /** Absolute URL of the team's schedule post (the attribution link). */
  sourceUrl: string;
};

export type EmbedTeam = { key: string; name: string; logo?: string };

export interface EmbedLeague {
  key: string;      // URL segment: "nfl"
  label: string;    // "NFL"
  teams(): EmbedTeam[];
  card(teamKey: string, now: Date): EmbedCard | null;
}

export const SITE = "https://www.colorwaysports.com";

/** iframe height the snippet ships with; the card is designed to fit it at 280-400px wide. */
export const EMBED_HEIGHT = 280;
