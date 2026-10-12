#!/usr/bin/env node
// Emits one day block for the MLB daily uniform tracker.
//   node scripts/mlb-tracker-day.mjs YYYY-MM-DD > /tmp/day.html
//
// The day blocks were hand-written before this, which meant ~350 lines of
// near-identical card markup per day and a real chance of a stale swatch or a
// wrong tile path. Everything the cards need already exists in the tracker, so
// this LEARNS the map (uniform name -> tile file, swatch hex, Fanatics link,
// short team label) by parsing the post, then re-emits it for a new date from
// scripts/mlb-confirmed/<date>.json plus statsapi for matchups and scores.
//
// The three awards are Jake's picks and are NOT generated - paste those blocks
// in by hand after this output.

import fs from "node:fs";
import { fetchCaps } from "./mlb-caps.mjs";
import { cardD5, sideD5, originalOf, MLB_TEAM } from "./mlb-card-d5.mjs";

const TRACKER = "content/posts/mlb-uniform-tracker-2026.md";
const SLUG = {
  "Baltimore Orioles":"orioles","Boston Red Sox":"red-sox","New York Yankees":"yankees",
  "Tampa Bay Rays":"rays","Toronto Blue Jays":"blue-jays","Chicago White Sox":"white-sox",
  "Cleveland Guardians":"guardians","Detroit Tigers":"tigers","Kansas City Royals":"royals",
  "Minnesota Twins":"twins","Houston Astros":"astros","Los Angeles Angels":"angels",
  "Athletics":"athletics","Seattle Mariners":"mariners","Texas Rangers":"rangers",
  "Atlanta Braves":"braves","Miami Marlins":"marlins","New York Mets":"mets",
  "Philadelphia Phillies":"phillies","Washington Nationals":"nationals","Chicago Cubs":"cubs",
  "Cincinnati Reds":"reds","Milwaukee Brewers":"brewers","Pittsburgh Pirates":"pirates",
  "St. Louis Cardinals":"cardinals","Arizona Diamondbacks":"diamondbacks",
  "Colorado Rockies":"rockies","Los Angeles Dodgers":"dodgers","San Diego Padres":"padres",
  "San Francisco Giants":"giants",
};

// last word of the club name, except where that is ambiguous or wrong
const SHORT_OVERRIDE = {
  "Boston Red Sox":"Red Sox","Chicago White Sox":"White Sox","Toronto Blue Jays":"Blue Jays",
};
const short = (n) => SHORT_OVERRIDE[n] ?? n.split(" ").pop();

const date = process.argv[2];
if (!date) { console.error("usage: mlb-tracker-day.mjs YYYY-MM-DD"); process.exit(1); }

// ---- learn the card vocabulary from the existing tracker -------------------
const md = fs.readFileSync(TRACKER, "utf8");
// (?!round-logos\/) keeps an old-path round logo from being learned as the away
// team's jersey tile. Reads BOTH card styles:
//   old (to 10/12): team label <p ... line-height: 1.2;">DODGERS</p>, uniform as bare text then </p>
//   Direction 5:    <div data-label ...>DODGERS</div>, uniform in <span data-uni ...>Road Gray</span>
// A Direction 5 card may carry the -cut.webp; originalOf() maps it back to the tile file.
const SIDE = /<img src="(\/images\/posts\/mlb-daily-tracker\/(?!round-logos\/)[^"]+)" alt="([^"]*)"[\s\S]*?(?:line-height: 1\.2;">|data-label[^>]*>)([^<]+)<\/(?:p|div)>[\s\S]*?background: (#[0-9A-Fa-f]{6});[^>]*><\/span>(?:<span[^>]*>)?([^<]+)<\/(?:p|span)>/g;

const tile = new Map();     // `${slug}|${uniform}` -> {src, swatch}
const label = new Map();    // slug -> short label e.g. SOX
const seenUni = new Map();  // slug -> Set(uniform names)

// walk cards in document order so the H3 tells us which side is which team
const cards = md.split(/^### /m).slice(1);
for (const card of cards) {
  const head = card.split("\n")[0].replace(/,\s*Game \d+\s*$/, "").trim();
  const parts = head.split(" at ");
  if (parts.length !== 2) continue;
  const slugs = parts.map((n) => SLUG[n.trim()]);
  if (slugs.some((s) => !s)) continue;
  let m, i = 0;
  SIDE.lastIndex = 0;
  while ((m = SIDE.exec(card)) !== null && i < 2) {
    const [, rawSrc, , lbl, swatch, uniform] = m;
    const src = originalOf(rawSrc);
    const slug = slugs[i++];
    tile.set(`${slug}|${uniform.trim()}`, { src, swatch });
    label.set(slug, lbl.trim());
    if (!seenUni.has(slug)) seenUni.set(slug, new Set());
    seenUni.get(slug).add(uniform.trim());
  }
}

// First-time uniforms: a tile that exists on disk but has never appeared in a
// card yet, so the learner cannot know it. Seed those here on their debut day;
// after the day block ships, the learner picks them up from the post itself.
const SEED = {
  "twins|Ripple Effect City Connect": { src: "/images/posts/mlb-daily-tracker/twins-ripple-effect-cc.jpg", swatch: "#4A90D9" },
  "angels|Surf City City Connect": { src: "/images/posts/mlb-daily-tracker/angels-cream-cc.jpg", swatch: "#F2E9D4" },
  "rays|Columbia Blue Alternate": { src: "/images/posts/mlb-daily-tracker/rays-light-blue-alternate.jpg", swatch: "#75AADB" },
  "tigers|Navy City Connect": { src: "/images/posts/mlb-daily-tracker/tigers-motor-city-cc.jpg", swatch: "#0C2340" },
  "astros|Navy Alternate": { src: "/images/posts/mlb-daily-tracker/astros-navy-alternate.jpg", swatch: "#002D62" },
  "phillies|Black City Connect": { src: "/images/posts/mlb-daily-tracker/phillies-city-connect.jpg", swatch: "#101820" },
  "orioles|BMORE City Connect": { src: "/images/posts/mlb-daily-tracker/orioles-bmore-cc.jpg", swatch: "#EAE3CE" },
  "angels|Road Gray": { src: "/images/posts/mlb-daily-tracker/angels-road-gray.jpg", swatch: "#8d9093" },
  "rockies|City Connect": { src: "/images/posts/mlb-daily-tracker/rockies-city-connect.jpg", swatch: "#7864b0" },
  "cubs|Royal Blue Alternate": { src: "/images/posts/mlb-daily-tracker/cubs-blue-alternate.jpg", swatch: "#0E3386" },
  "red-sox|Yellow City Connect": { src: "/images/posts/mlb-daily-tracker/red-sox-yellow-cc.jpg", swatch: "#FFD100" },
  "brewers|Home White": { src: "/images/posts/mlb-daily-tracker/brewers-home-white.jpg", swatch: "#f0f0f0" },
  "astros|Stros City Connect": { src: "/images/posts/mlb-daily-tracker/astros-space-city-cc.jpg", swatch: "#f5f5f5" },
  "mets|Blue Alternate": { src: "/images/posts/mlb-daily-tracker/mets-blue-alternate.jpg", swatch: "#002D72" },
  "white-sox|Southside City Connect": { src: "/images/posts/mlb-daily-tracker/white-sox-southside-cc.jpg", swatch: "#1A1A1A" },
  // Debuts 9/22 in game 2 of the doubleheader at the Yankees: the Rays' first road
  // gray since 2023. Tile is cropped from the reveal graphic, not a laydown - swap it
  // for a product shot or game photo once one exists.
  "rays|Road Gray": { src: "/images/posts/mlb-daily-tracker/rays-road-gray.jpg", swatch: "#C4CED4" },
};
for (const [k, v] of Object.entries(SEED)) {
  if (!tile.has(k)) {
    tile.set(k, v);
    const slug = k.split("|")[0];
    if (!seenUni.has(slug)) seenUni.set(slug, new Set());
    seenUni.get(slug).add(k.split("|")[1]);
  }
}

// ---- tonight's data --------------------------------------------------------
const confirmed = JSON.parse(fs.readFileSync(`scripts/mlb-confirmed/${date}.json`, "utf8"));
const sched = await fetch(
  `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${date}`,
).then((r) => r.json());
const games = sched?.dates?.[0]?.games ?? [];
// Standing rule (Jake, 8/30): most recent game at the top of the day, so the
// reader lands on the newest result. The feed is chronological; reverse it.
games.sort((a, b) => new Date(b.gameDate) - new Date(a.gameDate));
// Caps from the uniform feed (Jake 9/14: build the hats in). Empty when not filed yet.
const caps = await fetchCaps(date, SLUG);

// ---- postseason round logo ------------------------------------------------
// Direction 5 cards (Jake approved 10/12) put the official round logo top-left.
// Detected from the statsapi game (gameType L + seriesDescription "AL..."/"NL..."
// -> alcs/nlcs, gameType W -> world-series). The confirmed file can force it with
// an optional "_round" key ("alcs" | "nlcs" | "world-series" | "none"). Missing
// file = warn and use the MLB league logo, which regular season, Wild Card and
// Division Series cards always get. (height is from the old centered layout.)
const LOGO_DIR = "/images/posts/mlb-round-logos";
const ROUND = {
  alcs: { file: "alcs-2026.png", alt: "2026 ALCS logo", height: 22 },
  nlcs: { file: "nlcs-2026.png", alt: "2026 NLCS logo", height: 22 },
  "world-series": { file: "world-series-2026.png", alt: "2026 World Series logo", height: 44 },
};
function roundOf(g) {
  const o = confirmed._round;
  if (o) return o === "none" ? null : o;
  if (g.gameType === "W") return "world-series";
  if (g.gameType === "L") {
    const d = g.seriesDescription ?? "";
    if (d.startsWith("AL")) return "alcs";
    if (d.startsWith("NL")) return "nlcs";
  }
  return null;
}
// Top-left logo of the Direction 5 card: the round logo for LCS / World Series,
// otherwise the MLB league logo (regular season, Wild Card, Division Series).
// trimmed copy of public/logos/leagues/mlb.png (that one is padded to a square,
// so the mark rendered half-size in the 30px band)
const MLB_LOGO = { src: "/images/posts/mlb-round-logos/mlb-league-logo.png", alt: "MLB logo" };
function cardLogo(g) {
  const key = roundOf(g);
  if (!key) return MLB_LOGO;
  const r = ROUND[key];
  if (!r) { problems.push(`_round "${key}" unknown - MLB logo used`); return MLB_LOGO; }
  if (!fs.existsSync(`public${LOGO_DIR}/${r.file}`)) {
    problems.push(`round logo public${LOGO_DIR}/${r.file} missing - MLB logo used`);
    return MLB_LOGO;
  }
  return { src: `${LOGO_DIR}/${r.file}`, alt: r.alt, round: true };
}
// Second line under FINAL in the score bar. LCS/WS: the logo names the round, so
// just "Game N". Wild Card / Division Series: "NLDS · Game 4". Regular season:
// "Game 2" for the back half of a doubleheader, else nothing.
function subLine(g, logo) {
  const n = g.seriesGameNumber;
  const lg = (g.seriesDescription ?? "").startsWith("AL") ? "AL" : (g.seriesDescription ?? "").startsWith("NL") ? "NL" : "";
  if (logo.round) return n ? `Game ${n}` : "";
  if (g.gameType === "D") return `${lg}DS${n ? ` &middot; Game ${n}` : ""}`;
  if (g.gameType === "F") return `${lg ? lg + " " : ""}Wild Card${n ? ` &middot; Game ${n}` : ""}`;
  return g.gameNumber > 1 ? `Game ${g.gameNumber}` : "";
}

const pretty = new Date(date + "T12:00:00Z").toLocaleDateString("en-US",
  { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" });

// the confirmed file uses the schedule-post vocabulary ("Road Grays"); the
// tracker cards use the singular ("Road Gray"). Try the obvious rewrites before
// giving up, so the two files never have to be kept in lockstep by hand.
const ALIAS = { "reds|Red Alternate": "Red Script Alternate" };
function resolve(slug, uniform) {
  const tries = [
    uniform,
    ALIAS[`${slug}|${uniform}`],
    uniform.replace(/\bGrays\b/, "Gray").replace(/\bWhites\b/, "White"),
    uniform.replace(/\bHome Pinstripes\b/, "Home White Pinstripes"),
  ].filter(Boolean);
  for (const t of tries) if (tile.has(`${slug}|${t}`)) return t;
  return null;
}

const problems = [];
function side(slug, oppName, uniform, dateWords) {
  const resolved = resolve(slug, uniform);
  const hit = resolved ? tile.get(`${slug}|${resolved}`) : null;
  if (hit) uniform = resolved;
  if (!hit) {
    const known = [...(seenUni.get(slug) ?? [])].sort().join(" / ") || "(none logged)";
    problems.push(`${slug} "${uniform}" -> no tile. known: ${known}`);
    return null;
  }
  const name = Object.keys(SLUG).find((n) => SLUG[n] === slug);
  return sideD5({
    src: hit.src,
    alt: `${name} ${uniform} jersey worn ${dateWords} against the ${oppName}, from the MLB daily uniform tracker`,
    label: label.get(slug) ?? short(name).toUpperCase(),
    swatch: hit.swatch,
    uniform,
    cap: caps[slug],
  });
}

const dateWords = new Date(date + "T12:00:00Z").toLocaleDateString("en-US",
  { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }).replace(",", "");

const out = [`## ${pretty}`, "", "<!-- INTRO PARAGRAPH -->", ""];

for (const g of games) {
  const aName = g.teams.away.team.name, hName = g.teams.home.team.name;
  const aSlug = SLUG[aName], hSlug = SLUG[hName];
  // Doubleheaders: a club can wear two different uniforms on the same date, and a
  // file keyed by team alone cannot say so - both halves would get whichever one
  // was filed. An optional "<slug>|<gameNumber>" key overrides the plain key for
  // that half only. Needed 9/22: the Rays debut the new road gray in game 2 at the
  // Yankees and wear something else in game 1.
  const forGame = (slug) => confirmed[`${slug}|${g.gameNumber}`] ?? confirmed[slug];
  const aU = forGame(aSlug), hU = forGame(hSlug);
  if (!aU || !hU) { problems.push(`${aName} at ${hName}: missing confirmed uniform`); continue; }

  // A game that has not started cannot have a uniform logged against it. This
  // matters for doubleheaders: the confirmed file is keyed by TEAM, not gamePk,
  // so both halves match the same pair and the unplayed one would otherwise get
  // a card (and a "Final" pill) off the played one's data. Caught 2026-09-04,
  // when the Tigers-Guardians opener was in progress and game 2 had not begun.
  if (["Scheduled", "Pre-Game", "Warmup", "Delayed Start"].includes(g.status.detailedState)) {
    problems.push(`${aName} at ${hName}${g.gameNumber > 1 ? ` game ${g.gameNumber}` : ""}: ${g.status.detailedState}, not started - no card emitted`);
    continue;
  }

  const aR = g.teams.away.score, hR = g.teams.home.score;
  // A game that has not actually ended must never carry a score - a suspended 3-3
  // tie reading as a final is just wrong. House style never says "Live", so an
  // unfinished game gets a bare FINAL with en-dash scores, filled in later by
  // scripts/mlb-backfill-scores.mjs.
  const done = ["Final", "Game Over", "Completed Early"].includes(g.status.detailedState);
  if (!done) problems.push(`${aName} at ${hName}: ${g.status.detailedState} (${aR}-${hR}) - bare Final, run mlb-backfill-scores.mjs once it ends`);
  if (!MLB_TEAM[aSlug] || !MLB_TEAM[hSlug]) { problems.push(`${aName} at ${hName}: no score-bar colors in MLB_TEAM`); continue; }

  // Matchup grade (Jake's call), optional: "_grades": {"dodgers@brewers": "B-"}
  // in the confirmed file; "dodgers@brewers|2" for game 2 of a doubleheader.
  // No grade = the pending "–" chip; add the key and regenerate (or edit the chip).
  const gkey = `${aSlug}@${hSlug}`;
  const grade = confirmed._grades?.[`${gkey}|${g.gameNumber}`] ?? confirmed._grades?.[gkey] ?? "";

  const a = side(aSlug, short(hName), aU, dateWords);
  const h = side(hSlug, short(aName), hU, dateWords);
  if (!a || !h) continue;

  const logo = cardLogo(g);
  out.push(`### ${aName} at ${hName}${g.gameNumber > 1 ? `, Game ${g.gameNumber}` : ""}`, "",
    cardD5({
      logo, grade, away: a, home: h, awaySlug: aSlug, homeSlug: hSlug,
      awayScore: done ? aR : null, homeScore: done ? hR : null,
      sub: subLine(g, logo),
    }), "");
}

process.stdout.write(out.join("\n"));
if (problems.length) {
  console.error("\n\n=== NEEDS ATTENTION ===");
  for (const p of problems) console.error("  " + p);
}
