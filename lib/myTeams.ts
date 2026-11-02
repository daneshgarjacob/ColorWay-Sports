// My Teams (Jake 11/2): readers follow any number of teams and the homepage
// shows each one's next uniform first. Nothing is stored on our side; the
// follow list lives in the reader's own browser (components/home/MyTeams.tsx).
// This file builds one card per club from data the site already has: the NFL
// schedule grids, the NBA/NHL season calendars, and the MLB schedule posts.

import fs from "fs";
import path from "path";
import { buildNflTeamIndex } from "./nflTrackerTeamIndex";
import { buildWinterIndex, shortDate } from "./winterTrackerIndex";
import { currentNflWeek } from "./nflWeek";

export type MyTeamLeague = "NFL" | "NBA" | "NHL" | "MLB";

export type MyTeamCard = {
  /** "nfl:chicago-bears" */
  id: string;
  league: MyTeamLeague;
  name: string;
  nickname: string;
  logo: string;
  href: string;
  color: string;
  next?: {
    /** "Tonight", "Wed, Nov 4", or the NFL week window. */
    when: string;
    /** "at Seahawks" / "vs Heat" */
    opp: string;
    look: string;
    img?: string;
    confirmed?: boolean;
    /** Sort key, ms. */
    at: number;
  };
  /** Shown instead of a next game (offseason, bye). */
  note?: string;
};

const MONTHS: Record<string, number> = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };

function etToday(now: Date): string {
  return now.toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}

function nflCards(now: Date): MyTeamCard[] {
  const week = currentNflWeek(now);
  return buildNflTeamIndex().map((t) => {
    const card: MyTeamCard = {
      id: `nfl:${t.slug}`, league: "NFL", name: t.name, nickname: t.nickname, logo: t.logo,
      href: `/stories/${t.scheduleSlug}`, color: t.color,
    };
    const g = t.games.find((x) => x.week >= week && !x.bye);
    if (!g) return { ...card, note: "Season over" };
    const m = g.window.match(/^\w{3}, (\w{3}) (\d+)/);
    const at = m ? Date.UTC(2026, MONTHS[m[1]] ?? 0, Number(m[2])) : 0;
    const bye = t.games.find((x) => x.week === week)?.bye;
    card.next = {
      when: `${bye ? "After the bye · " : ""}Week ${g.week}`,
      opp: g.matchup,
      // "White · MNF" → "White jersey"; the window tag reads as noise on a card.
      look: `${g.uniform.split(" · ")[0]} jersey`,
      img: g.img,
      confirmed: g.confirmed,
      at,
    };
    return card;
  });
}

function winterCards(now: Date): MyTeamCard[] {
  const today = etToday(now);
  return buildWinterIndex().map((t) => {
    const league: MyTeamLeague = t.league === "nba" ? "NBA" : "NHL";
    const card: MyTeamCard = {
      id: `${t.league}:${t.slug}`, league, name: t.name, nickname: t.nickname, logo: t.logo,
      href: `/stories/${t.scheduleSlug}`, color: t.color,
    };
    const g = t.games.find((x) => x.date >= today);
    if (!g) return { ...card, note: "Season over" };
    const opp = g.opp?.nickname ?? g.opponent;
    card.next = {
      when: g.date === today ? "Tonight" : shortDate(g.date),
      opp: `${g.home ? "vs" : "at"} ${opp}`,
      look: g.uniform ?? g.expected ?? "Uniform to come",
      img: g.image ?? g.expectedImage,
      confirmed: g.confirmed,
      at: Date.parse(`${g.date}T12:00:00Z`),
    };
    return card;
  });
}

// MLB is in its offseason, so a followed club gets a "back in spring" card that
// still links to its 2026 schedule post. Clubs come from the logo files.
function mlbCards(): MyTeamCard[] {
  const dir = path.join(process.cwd(), "public", "logos", "teams");
  const posts = path.join(process.cwd(), "content", "posts");
  const out: MyTeamCard[] = [];
  for (const f of fs.readdirSync(dir)) {
    const m = f.match(/^mlb-(.+)\.png$/);
    if (!m) continue;
    const words = m[1].split("-");
    // "Red Sox", "White Sox", "Blue Jays" are two words; everyone else is one.
    const two = words.slice(-2).join("-");
    const slug = fs.existsSync(path.join(posts, `${two}-uniform-schedule-2026.md`)) ? two : words[words.length - 1];
    if (!fs.existsSync(path.join(posts, `${slug}-uniform-schedule-2026.md`))) continue;
    const cap = (s: string) => s.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
    out.push({
      id: `mlb:${m[1]}`, league: "MLB", name: cap(m[1]), nickname: cap(slug), logo: `/logos/teams/${f}`,
      href: `/stories/${slug}-uniform-schedule-2026`, color: "#0A1733", note: "Back in spring",
    });
  }
  return out;
}

export function getMyTeamCards(now = new Date()): MyTeamCard[] {
  return [...nflCards(now), ...winterCards(now), ...mlbCards()].sort((a, b) => a.nickname.localeCompare(b.nickname));
}
