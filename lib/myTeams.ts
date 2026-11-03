// My Teams (Jake 11/2): readers follow any number of teams and the homepage
// shows each one's next uniform first. Nothing is stored on our side; the
// follow list lives in the reader's own browser (components/home/MyTeams.tsx).
// This file builds one card per club from data the site already has: the NFL
// schedule grids, the NBA/NHL season calendars, and the MLB schedule posts.

import fs from "fs";
import path from "path";
import { buildNflTeamIndex } from "./nflTrackerTeamIndex";
import { buildWinterIndex, shortDate } from "./winterTrackerIndex";
import { NBA_TILE_COLORS } from "./nbaTileColors";
import { TEAM_LOGOS } from "./teamLogos";
import kickoffData from "@/content/data/nfl-kickoffs-2026.json";

export type MyTeamLeague = "NFL" | "NBA" | "NHL" | "MLB" | "CFB";

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

function etToday(now: Date): string {
  return now.toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}

type Kickoff = { week: number; away: string; home: string; kickoff: string };
const KICKOFFS = (kickoffData as { games: Kickoff[] }).games;

function nflCards(now: Date): MyTeamCard[] {
  // A game stays "next" until about four hours after kickoff, then the card
  // moves on to the following week (exact times from content/data/nfl-kickoffs-2026.json).
  const live = now.getTime() - 4 * 3600_000;
  return buildNflTeamIndex().map((t) => {
    const card: MyTeamCard = {
      id: `nfl:${t.slug}`, league: "NFL", name: t.name, nickname: t.nickname, logo: t.logo,
      href: `/stories/${t.scheduleSlug}`, color: t.color,
    };
    const k = KICKOFFS.filter((x) => (x.away === t.nickname || x.home === t.nickname) && Date.parse(x.kickoff) > live)
      .sort((a, b) => Date.parse(a.kickoff) - Date.parse(b.kickoff))[0];
    const g = k && t.games.find((x) => x.week === k.week && !x.bye);
    if (!k || !g) return { ...card, note: "Season over" };
    const at = Date.parse(k.kickoff);
    const etDay = (ms: number) => new Date(ms).toLocaleDateString("en-CA", { timeZone: "America/New_York" });
    const when = etDay(at) === etToday(now)
      ? "Today"
      : new Date(at).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "America/New_York" });
    card.next = {
      when: `${when} · Week ${g.week}`,
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

// NBA calls are edition names ("Icon Edition"), which mean nothing to most
// readers, so the card names the jersey's color from its tile instead.
function lookWords(league: "nba" | "nhl", call: string | undefined, img: string | undefined): string {
  if (!call) return "Uniform to come";
  if (league !== "nba") return call;
  const color = img ? NBA_TILE_COLORS[img.split("/").pop() ?? ""] : undefined;
  if (!color) return call;
  const kind = /city/i.test(call) ? " City" : /classic/i.test(call) ? " Classic" : "";
  return `${color}${kind} jersey`;
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
      look: lookWords(t.league, g.uniform ?? g.expected, g.image ?? g.expectedImage),
      // Announced NHL specials carry no tile; Remix nights get the NHL's studio
      // photo of that club's Hometown Remix jersey (Jake 11/2).
      img: g.image ?? g.expectedImage ?? (t.league === "nhl" && /remix/i.test(`${g.uniform ?? ""} ${g.expected ?? ""}`)
        ? `/images/posts/nhl-daily-tracker/${t.nickname.toLowerCase().replace(/[^a-z]+/g, "-")}-remix.jpg`
        : undefined),
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

// College football: one card per school with a schedule post. There is no
// game-by-game data file for college yet, so the card points to the post,
// where each week's look lives.
function cfbCards(): MyTeamCard[] {
  const posts = path.join(process.cwd(), "content", "posts");
  const out: MyTeamCard[] = [];
  for (const f of fs.readdirSync(posts)) {
    if (!f.endsWith("-uniform-schedule-2026.md")) continue;
    const head = fs.readFileSync(path.join(posts, f), "utf8").slice(0, 1500);
    if (!/^league: "?college"?/m.test(head)) continue;
    const team = head.match(/^teams: \["([^"]+)"/m)?.[1];
    const logo = team && TEAM_LOGOS[team];
    const school = head.match(/^title: "(.+?) Uniform Schedule/m)?.[1];
    if (!team || !logo || !school) continue;
    out.push({
      id: `cfb:${team}`, league: "CFB", name: school, nickname: school, logo,
      href: `/stories/${f.replace(/\.md$/, "")}`, color: "#0A1733", note: "This week's look",
    });
  }
  return out;
}

export function getMyTeamCards(now = new Date()): MyTeamCard[] {
  return [...nflCards(now), ...winterCards(now), ...mlbCards(), ...cfbCards()].sort((a, b) => a.nickname.localeCompare(b.nickname));
}
