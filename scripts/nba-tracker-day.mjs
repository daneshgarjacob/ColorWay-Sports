#!/usr/bin/env node
// Builds the day sections of the NBA daily uniform tracker
// (content/posts/nba-uniform-tracker-2026-27.md) from the same worn log that
// drives the 30 NBA team schedule posts and /nba-tracker/<team>, so one data
// entry feeds everything. The basketball twin of scripts/nhl-tracker-day.mjs.
//
//   node scripts/nba-tracker-day.mjs 2026-10-25            print that day's section
//   node scripts/nba-tracker-day.mjs 2026-10-25 --write    insert / refresh it in the post
//   node scripts/nba-tracker-day.mjs --all --write         refresh every logged date
//
// NIGHTLY NBA PASS: see the NIGHTLY STEPS at the top of scripts/nba-worn-log.mjs.
// This script is step 4, after the games are confirmed in
// scripts/data/nba-worn-2026-27.json and the schedule tables are regenerated.
//
// How the post is laid out: each day is "## Weekday, Month D", then a
// hand-written intro paragraph, then the cards between
// <!-- nba-day:YYYY-MM-DD:start --> and <!-- nba-day:YYYY-MM-DD:end -->.
// --write only ever replaces what is between the markers, so the intro survives
// re-runs. A brand-new day gets an auto intro (rewrite it in our voice if there
// is a story) and is placed newest-first above older days, or above
// <!-- nba-days:end --> when it is the oldest.
//
// Only games marked confirmed in the log get a card. Scores come from the log
// (nba-worn-log.mjs copies ESPN's finals in); the status always says "Final".
// Game order within a day: newest tip-off first (ESPN scoreboard start times;
// if ESPN cannot be reached, the log's key order).
//
// Grades come from scripts/data/nba-matchup-grades-2026-27.json (our pre-game
// calls, keyed "date|AWAY|HOME"). A game without a grade gets the dashed
// pending chip; we never invent one. A pre-game grade is NOT shown when a club
// wore something other than the announced call, because the grade was for a
// different matchup: grade the worn pairing in the grades file to show one.
//
// Card: the D5 matchup card the NHL tracker uses (scripts/nhl-card-d5.mjs
// cardShell + scripts/mlb-card-d5.mjs sideD5), with the NBA logo and the NBA
// score-bar colours below. Jersey tiles: lib/nbaTileFiles.json (never a
// readdir of public/ in app code; this script runs locally so it may check disk).

import fs from "node:fs";
import sharp from "sharp";
import { cardShell } from "./nhl-card-d5.mjs";
import { sideD5 } from "./mlb-card-d5.mjs";

const POST = "content/posts/nba-uniform-tracker-2026-27.md";
const WORN = JSON.parse(fs.readFileSync("scripts/data/nba-worn-2026-27.json", "utf8")).games;
const ANN = JSON.parse(fs.readFileSync("scripts/data/nba-announced-uniforms-2026-27.json", "utf8"));
const GRADES = JSON.parse(fs.readFileSync("scripts/data/nba-matchup-grades-2026-27.json", "utf8"));
const TILES = new Set(JSON.parse(fs.readFileSync("lib/nbaTileFiles.json", "utf8")));
const TILE_DIR = "/images/posts/nba-daily-tracker";

// tricode -> full name, short name (nickname), tile + /nba-tracker key
const NBA_TEAMS = {
  ATL: ["Atlanta Hawks", "Hawks", "hawks"],
  BOS: ["Boston Celtics", "Celtics", "celtics"],
  BKN: ["Brooklyn Nets", "Nets", "nets"],
  CHA: ["Charlotte Hornets", "Hornets", "hornets"],
  CHI: ["Chicago Bulls", "Bulls", "bulls"],
  CLE: ["Cleveland Cavaliers", "Cavaliers", "cavaliers"],
  DAL: ["Dallas Mavericks", "Mavericks", "mavericks"],
  DEN: ["Denver Nuggets", "Nuggets", "nuggets"],
  DET: ["Detroit Pistons", "Pistons", "pistons"],
  GSW: ["Golden State Warriors", "Warriors", "warriors"],
  HOU: ["Houston Rockets", "Rockets", "rockets"],
  IND: ["Indiana Pacers", "Pacers", "pacers"],
  LAC: ["LA Clippers", "Clippers", "clippers"],
  LAL: ["Los Angeles Lakers", "Lakers", "lakers"],
  MEM: ["Memphis Grizzlies", "Grizzlies", "grizzlies"],
  MIA: ["Miami Heat", "Heat", "heat"],
  MIL: ["Milwaukee Bucks", "Bucks", "bucks"],
  MIN: ["Minnesota Timberwolves", "Timberwolves", "timberwolves"],
  NOP: ["New Orleans Pelicans", "Pelicans", "pelicans"],
  NYK: ["New York Knicks", "Knicks", "knicks"],
  OKC: ["Oklahoma City Thunder", "Thunder", "thunder"],
  ORL: ["Orlando Magic", "Magic", "magic"],
  PHI: ["Philadelphia 76ers", "76ers", "76ers"],
  PHX: ["Phoenix Suns", "Suns", "suns"],
  POR: ["Portland Trail Blazers", "Trail Blazers", "trail-blazers"],
  SAC: ["Sacramento Kings", "Kings", "kings"],
  SAS: ["San Antonio Spurs", "Spurs", "spurs"],
  TOR: ["Toronto Raptors", "Raptors", "raptors"],
  UTA: ["Utah Jazz", "Jazz", "jazz"],
  WAS: ["Washington Wizards", "Wizards", "wizards"],
};

// Score-bar colours, same rules as NHL_TEAM: navy/black primaries use a lighter
// shade so the block separates from the navy card; accent = outside edge stripe.
const NBA_TEAM = {
  ATL: { abbr: "ATL", top: "#C8102E", bot: "#940a20", accent: "#FDB927" },
  BOS: { abbr: "BOS", top: "#0a7a3f", bot: "#005a26", accent: "#BA9653" },
  BKN: { abbr: "BKN", top: "#4a4a4f", bot: "#333336", accent: "#ffffff" },
  CHA: { abbr: "CHA", top: "#00788C", bot: "#005a69", accent: "#A1A1A4" },
  CHI: { abbr: "CHI", top: "#CE1141", bot: "#990b30", accent: "#ffffff" },
  CLE: { abbr: "CLE", top: "#860038", bot: "#5e0027", accent: "#FDBB30" },
  DAL: { abbr: "DAL", top: "#0064B1", bot: "#004a85", accent: "#BBC4CA" },
  DEN: { abbr: "DEN", top: "#1f3f6e", bot: "#132b4f", accent: "#FEC524" },
  DET: { abbr: "DET", top: "#1d42ba", bot: "#15318a", accent: "#C8102E" },
  GSW: { abbr: "GSW", top: "#1f4fa8", bot: "#1D428A", accent: "#FFC72C" },
  HOU: { abbr: "HOU", top: "#CE1141", bot: "#990b30", accent: "#C4CED4" },
  IND: { abbr: "IND", top: "#1f4a85", bot: "#163a6a", accent: "#FDBB30" },
  LAC: { abbr: "LAC", top: "#1f4fa8", bot: "#163a7a", accent: "#C8102E" },
  LAL: { abbr: "LAL", top: "#6a35a0", bot: "#552583", accent: "#FDB927" },
  MEM: { abbr: "MEM", top: "#5D76A9", bot: "#3f5a8a", accent: "#F5B112" },
  MIA: { abbr: "MIA", top: "#98002E", bot: "#6e0021", accent: "#F9A01B" },
  MIL: { abbr: "MIL", top: "#1e6030", bot: "#00471B", accent: "#EEE1C6" },
  MIN: { abbr: "MIN", top: "#1f4a85", bot: "#163a6a", accent: "#78BE20" },
  NOP: { abbr: "NOP", top: "#1f3f6e", bot: "#132b4f", accent: "#C8102E" },
  NYK: { abbr: "NYK", top: "#006BB6", bot: "#004f87", accent: "#F58426" },
  OKC: { abbr: "OKC", top: "#007AC1", bot: "#005a8f", accent: "#EF3B24" },
  ORL: { abbr: "ORL", top: "#0077C0", bot: "#005a91", accent: "#C4CED4" },
  PHI: { abbr: "PHI", top: "#006BB6", bot: "#004f87", accent: "#ED174C" },
  PHX: { abbr: "PHX", top: "#4a3a8f", bot: "#33276b", accent: "#E56020" },
  POR: { abbr: "POR", top: "#E03A3E", bot: "#a82a2d", accent: "#ffffff" },
  SAC: { abbr: "SAC", top: "#5A2D81", bot: "#41205e", accent: "#A1A1A4" },
  SAS: { abbr: "SAS", top: "#4a4a4f", bot: "#333336", accent: "#C4CED4" },
  TOR: { abbr: "TOR", top: "#CE1141", bot: "#990b30", accent: "#A1A1A4" },
  UTA: { abbr: "UTA", top: "#4b2a7a", bot: "#35205a", accent: "#ffffff" },
  WAS: { abbr: "WAS", top: "#1f4a85", bot: "#163a6a", accent: "#E31837" },
};

// The NBA logoman is red, white and blue; a thin light edge keeps the blue half
// off the navy card.
const NBA_LOGO = {
  src: "/logos/leagues/nba.png", alt: "NBA logo", via: "via NBA", height: "clamp(34px, 9vw, 44px)",
  style: "filter: drop-shadow(0 0 0.6px rgba(255,255,255,0.95)) drop-shadow(0 0 8px rgba(160,190,255,0.35));",
};

const args = process.argv.slice(2);
const write = args.includes("--write");
const all = args.includes("--all");
const dateArg = args.find((a) => /^\d{4}-\d{2}-\d{2}$/.test(a));
if (!all && !dateArg) {
  console.error("usage: nba-tracker-day.mjs YYYY-MM-DD [--write] | --all [--write]");
  process.exit(1);
}

const confirmedDates = [...new Set(
  Object.entries(WORN).filter(([, v]) => v.confirmed && v.score).map(([k]) => k.split(" ")[0]),
)].sort().reverse();
const dates = all ? confirmedDates : [dateArg];

const problems = [];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const pretty = (d) => new Date(d + "T12:00:00Z").toLocaleDateString("en-US",
  { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" });
const dateWords = (d) => { const [y, m, dd] = d.split("-").map(Number); return `${MONTHS[m - 1]} ${dd} ${y}`; };

function edition(call) {
  if (/^Association/.test(call)) return "association";
  if (/^Icon/.test(call)) return "icon";
  if (/^Statement/.test(call)) return "statement";
  if (/^Classic/.test(call)) return "classic";
  if (/City/.test(call)) return "city";
  return null;
}

// Swatch dot: white for any Association, else the body colour sampled from the
// jersey tile (below the numbers). SWATCH_FIX covers tiles where the sample
// window lands on a stripe.
const SWATCH_FIX = { "trail-blazers-icon.jpg": "#1b1c1e" };
const swatchCache = new Map();
async function swatchFor(file, call) {
  if (/^Association/.test(call)) return "#ffffff";
  if (!file) return "#6b7280";
  if (SWATCH_FIX[file]) return SWATCH_FIX[file];
  if (swatchCache.has(file)) return swatchCache.get(file);
  const src = `public${TILE_DIR}/${file}`;
  const m = await sharp(src).metadata();
  const { data } = await sharp(src)
    .extract({ left: Math.round(m.width * 0.4), top: Math.round(m.height * 0.74), width: Math.round(m.width * 0.2), height: Math.round(m.height * 0.08) })
    .resize(1, 1).raw().toBuffer({ resolveWithObject: true });
  const [r, g, b] = data;
  const hex = 0.299 * r + 0.587 * g + 0.114 * b > 170
    ? "#ffffff"
    : "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
  swatchCache.set(file, hex);
  return hex;
}

// A team-colour tank-top outline for any jersey we have no tile for yet.
function placeholder(name, call, fill) {
  const stroke = fill.toLowerCase() === "#ffffff" ? "#9aa0ac" : "rgba(0,0,0,0.25)";
  return `<svg viewBox="0 0 120 120" width="100%" height="100%" role="img" aria-label="${name} ${call} jersey"><path d="M40 10 L52 10 Q60 24 68 10 L80 10 Q82 30 96 36 L96 112 L24 112 L24 36 Q38 30 40 10 Z" fill="${fill}" stroke="${stroke}" stroke-width="2.5" stroke-linejoin="round"/></svg>`;
}

async function sideInfo(tri, isHome, date, entry) {
  const [name, short, nick] = NBA_TEAMS[tri];
  const s = (isHome ? entry.home : entry.away) ?? {};
  const announced = ANN[tri]?.games?.[date];
  const call = s.call ?? announced ?? (isHome ? "Association White" : "Icon Edition");
  const ed = edition(call);
  const file = ed && TILES.has(`${nick}-${ed}.jpg`) ? `${nick}-${ed}.jpg` : "";
  const swatch = await swatchFor(file, call);
  return {
    tri, name, short, call, detail: s.detail, swatch, announced,
    image: file ? `${TILE_DIR}/${file}` : "",
    changed: Boolean(announced && call !== announced),
  };
}

function sideHtml(info, oppShort, date) {
  const uniform = info.detail ? `${info.call}, ${info.detail}` : info.call;
  const html = sideD5({
    src: info.image || `${TILE_DIR}/missing.jpg`,
    alt: `${info.name} ${info.call} jersey worn ${dateWords(date)} against the ${oppShort}, from the NBA daily uniform tracker`,
    label: info.short.toUpperCase(),
    swatch: info.swatch,
    uniform,
  });
  if (info.image) return html;
  problems.push(`${date} ${info.short}: no tile for "${info.call}" -> placeholder jersey used (add public${TILE_DIR}/<nick>-<edition>.jpg, then node scripts/gen-nba-tile-list.mjs)`);
  return html.replace(/<img src="[^"]*"[^>]*\/>/, placeholder(info.name, info.call, info.swatch));
}

const ESPN_TRI = { GS: "GSW", NY: "NYK", NO: "NOP", SA: "SAS", UTAH: "UTA", WSH: "WAS" };
async function tipTimes(date) {
  const out = new Map();
  try {
    const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${date.replaceAll("-", "")}`);
    if (!res.ok) throw new Error(String(res.status));
    for (const ev of (await res.json()).events ?? []) {
      const c = ev.competitions?.[0]?.competitors ?? [];
      const t = (ha) => { const a = c.find((x) => x.homeAway === ha)?.team?.abbreviation; return ESPN_TRI[a] ?? a; };
      out.set(`${t("away")}@${t("home")}`, new Date(ev.date).getTime());
    }
  } catch (e) {
    problems.push(`${date}: ESPN scoreboard unreachable (${e.message}), games in log order`);
  }
  return out;
}

async function buildDay(date) {
  const keys = Object.keys(WORN).filter((k) => k.startsWith(date + " "));
  const tips = await tipTimes(date);
  // Standing rule from the MLB tracker: newest game at the top of the day.
  keys.sort((x, y) => (tips.get(y.split(" ")[1]) ?? 0) - (tips.get(x.split(" ")[1]) ?? 0));

  const cards = [];
  const specials = [];
  const changed = [];
  for (const k of keys) {
    const entry = WORN[k];
    const [A, H] = k.split(" ")[1].split("@");
    if (!entry.confirmed) {
      if (entry.score) problems.push(`${k}: final but not confirmed in the worn log, no card`);
      continue;
    }
    if (!NBA_TEAMS[A] || !NBA_TEAMS[H]) { problems.push(`${k}: unknown tricode`); continue; }
    const a = await sideInfo(A, false, date, entry), h = await sideInfo(H, true, date, entry);
    for (const s of [a, h]) {
      if (s.changed) changed.push(`the ${s.short} wore the ${s.call} (the schedule said ${s.announced})`);
      else if (s.detail || /Classic|City|Specter/.test(s.call)) specials.push(`${s.short} (${s.detail ? `${s.call}, ${s.detail}` : s.call})`);
    }
    let grade = GRADES[`${date}|${A}|${H}`] ?? "";
    if (grade && (a.changed || h.changed)) {
      problems.push(`${k}: pre-game grade ${grade} not shown, a jersey changed from the schedule (grade the worn pairing to show one)`);
      grade = "";
    }
    if (!grade && !(a.changed || h.changed)) problems.push(`${k}: no grade in nba-matchup-grades-2026-27.json, pending chip shown`);
    const done = entry.score && typeof entry.score.away === "number";
    cards.push(`### ${a.name} at ${h.name}\n\n` + cardShell({
      id: "nba-d5",
      logo: NBA_LOGO,
      grade,
      A: NBA_TEAM[A],
      H: NBA_TEAM[H],
      away: sideHtml(a, h.short, date),
      home: sideHtml(h, a.short, date),
      awayScore: done ? entry.score.away : undefined,
      homeScore: done ? entry.score.home : undefined,
      sub: entry.ot ? "OT" : "",
    }));
  }

  const n = cards.length;
  const intro = `${n} game${n === 1 ? "" : "s"} on ${pretty(date).split(",")[0]}, every jersey confirmed from game photos. ` +
    (changed.length ? `Off the schedule: ${changed.join("; ")}. ` : "") +
    (specials.length
      ? `The special looks: ${specials.join(", ")}. Everyone else wore an Association, Icon or Statement Edition as scheduled.`
      : `Every club wore its Association, Icon or Statement Edition${changed.length ? "" : " exactly as the NBA's schedule called it"}.`);
  const block = `<!-- nba-day:${date}:start -->\n\n${cards.join("\n\n")}\n\n<!-- nba-day:${date}:end -->`;
  return { heading: `## ${pretty(date)}`, intro, block, n };
}

let md = write ? fs.readFileSync(POST, "utf8") : "";
for (const date of dates) {
  const day = await buildDay(date);
  if (!day.n) { problems.push(`${date}: no confirmed games, nothing emitted`); continue; }
  if (!write) {
    process.stdout.write(`${day.heading}\n\n${day.intro}\n\n${day.block}\n\n`);
    continue;
  }
  const re = new RegExp(`<!-- nba-day:${date}:start -->[\\s\\S]*?<!-- nba-day:${date}:end -->`);
  if (re.test(md)) {
    md = md.replace(re, () => day.block);
  } else {
    // newest first: in front of the first older day, else at the end of the days
    const section = `${day.heading}\n\n${day.intro}\n\n${day.block}\n\n`;
    const markers = [...md.matchAll(/<!-- nba-day:(\d{4}-\d{2}-\d{2}):start -->/g)];
    const older = markers.find((m) => m[1] < date);
    let at;
    if (older) at = md.lastIndexOf("\n## ", older.index) + 1;
    else at = md.indexOf("<!-- nba-days:end -->");
    if (at <= 0) { console.error("could not find where to insert (missing <!-- nba-days:end --> marker?)"); process.exit(1); }
    md = md.slice(0, at) + section + md.slice(at);
  }
}
if (write) {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(new Date());
  const before = fs.readFileSync(POST, "utf8");
  if (md !== before) {
    md = md.replace(/^updatedDate: ".*"$/m, `updatedDate: "${today}"`);
    fs.writeFileSync(POST, md);
    console.log(`wrote ${POST} (${dates.join(", ")})`);
  } else {
    console.log("tracker post already up to date");
  }
}
if (problems.length) {
  console.error("\n=== NEEDS ATTENTION ===");
  for (const p of problems) console.error("  " + p);
}
