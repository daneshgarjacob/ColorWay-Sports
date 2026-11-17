import { buildWinterIndex, nhlTeams, shortDate, type WinterGame, type WinterTeamEntry } from "@/lib/winterTrackerIndex";
import { NBA_TILE_COLORS } from "@/lib/nbaTileColors";
import { SITE, type EmbedCard, type EmbedLeague, type EmbedPart } from "./types";

// NBA and NHL adapters for the embed widget. Same source as the homepage My
// Teams cards (lib/myTeams.ts winterCards): the per-club season calendars in
// lib/winterTrackerIndex.ts, which join the ESPN fixture list with
//   NBA: the league's announced uniform schedule + our nightly worn log;
//   NHL: each club's standard home/road sweater + announced specials from the
//        nightly game log.
// The card shows the next game on or after today (US Eastern), so on game day
// it reads "Tonight" until the date rolls over.

const etToday = (now: Date) => now.toLocaleDateString("en-CA", { timeZone: "America/New_York" });

// NBA tile colour words -> a swatch for the colour dot. Words not listed fall
// back to the club colour.
const NBA_HEX: Record<string, string> = {
  White: "#FFFFFF", Cream: "#F3EBD7", Black: "#111111", Red: "#C8102E", Wine: "#6F263D", Green: "#007A33",
  "Royal Blue": "#1D428A", Blue: "#0057B8", "Light Blue": "#7BAFD4", Navy: "#0C2340", Teal: "#00788C",
  Purple: "#552583", Gray: "#8A8D8F", Silver: "#C4CED4", Gold: "#FDB927", Orange: "#F58426", Yellow: "#FFC72C",
};

// NHL sweater tiles. Every club has <key>-home.jpg, <key>-road.jpg and
// <key>-remix.jpg in this folder (checked 2026-11-17). They are referenced by
// URL only: the embed function ships without public/ (next.config.ts), so an
// existence check at ISR time would always fail.
const NHL_TILES = "/images/posts/nhl-daily-tracker";

function nextGame(t: WinterTeamEntry, now: Date): WinterGame | undefined {
  const today = etToday(now);
  return t.games.find((g) => g.date >= today);
}

function frame(t: WinterTeamEntry, g: WinterGame, now: Date, leagueLabel: string) {
  const tonight = g.date === etToday(now);
  return {
    league: t.league,
    leagueLabel,
    teamName: t.name,
    nickname: t.nickname,
    logo: t.logo,
    accent: t.color,
    period: "2026-27",
    lead: tonight ? "Tonight" : "Next game",
    uniformKicker: tonight ? "Tonight's uniform" : "Next game's uniform",
    matchup: `${g.home ? "vs" : "at"} ${g.opp?.nickname ?? g.opponent}`,
    when: shortDate(g.date),
    sourceUrl: `${SITE}/stories/${t.scheduleSlug}`,
  };
}

// ---- NBA ---------------------------------------------------------------------

function nbaCard(teamKey: string, now: Date): EmbedCard | null {
  const t = buildWinterIndex().find((x) => x.league === "nba" && x.key === teamKey);
  const g = t && nextGame(t, now);
  if (!t || !g) return null;

  const call = g.uniform ?? g.expected;
  const image = g.image ?? g.expectedImage;
  // Say the colour, not the edition (Jake 11/2): "Red jersey", "Black City jersey".
  const color = image ? NBA_TILE_COLORS[image.split("/").pop() ?? ""] : undefined;
  const kind = call && /city/i.test(call) ? " City" : call && /classic/i.test(call) ? " Classic" : "";
  const uniform = !call ? "Uniform TBA" : color ? `${color}${kind} jersey` : call;
  const hex = color ? NBA_HEX[color] : undefined;

  const parts: EmbedPart[] = [
    { part: "Jersey", label: color ?? (call ? call : "TBA"), hex },
    { part: "Edition", label: call ?? "TBA" },
  ];

  let status: EmbedCard["status"];
  let statusNote: string | undefined;
  if (g.confirmed) {
    status = "worn";
  } else if (call) {
    status = "confirmed";
    statusNote = "From the NBA's announced uniform schedule";
  } else {
    status = "expected";
    statusNote = "Not announced yet";
  }

  return {
    ...frame(t, g, now, "NBA"),
    uniform,
    parts,
    image,
    imageAlt: image ? `${t.name} ${uniform}` : undefined,
    swatch: hex ?? t.color,
    status,
    statusNote,
  };
}

// ---- NHL ---------------------------------------------------------------------

function nhlCard(teamKey: string, now: Date): EmbedCard | null {
  const t = buildWinterIndex().find((x) => x.league === "nhl" && x.key === teamKey);
  const g = t && nextGame(t, now);
  if (!t || !g) return null;
  const club = Object.values(nhlTeams()).find((c) => c.key === t.key);

  const standard = g.home ? club?.homeLabel ?? "Home" : "Road White";
  const call = g.uniform ?? g.expected ?? standard;
  const special = call !== standard;
  const remix = /remix/i.test(call);
  const image =
    g.image ||
    g.expectedImage ||
    (remix ? `${NHL_TILES}/${t.key}-remix.jpg` : !special ? `${NHL_TILES}/${t.key}-${g.home ? "home" : "road"}.jpg` : undefined);
  const swatch = g.swatch ?? (special ? t.color : g.home ? club?.homeSwatch ?? t.color : "#FFFFFF");

  let status: EmbedCard["status"];
  let statusNote: string | undefined;
  if (g.confirmed) {
    status = "worn";
  } else if (special) {
    status = "confirmed";
    statusNote = "Special night announced by the team";
  } else {
    status = "expected";
    statusNote = `Standard ${g.home ? "home" : "road"} sweater, no special announced`;
  }

  return {
    ...frame(t, g, now, "NHL"),
    uniform: call,
    parts: [
      { part: "Sweater", label: call, hex: swatch },
      { part: "Game", label: g.home ? "Home ice" : "Road" },
    ],
    image,
    imageAlt: image ? `${t.name} ${call} sweater` : undefined,
    swatch,
    status,
    statusNote,
  };
}

const teamsOf = (league: "nba" | "nhl") => () =>
  buildWinterIndex()
    .filter((t) => t.league === league)
    .map((t) => ({ key: t.key, name: t.name, logo: t.logo }));

export const nbaLeague: EmbedLeague = { key: "nba", label: "NBA", teams: teamsOf("nba"), card: nbaCard };
export const nhlLeague: EmbedLeague = { key: "nhl", label: "NHL", teams: teamsOf("nhl"), card: nhlCard };
