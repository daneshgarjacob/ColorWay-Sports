#!/usr/bin/env node
// Builds the day sections of the NHL daily uniform tracker
// (content/posts/nhl-uniform-tracker-2026-27.md) from the same game log that
// drives the 32 team schedule posts, so one data entry feeds everything.
//
//   node scripts/nhl-tracker-day.mjs 2026-10-02            print that day's section
//   node scripts/nhl-tracker-day.mjs 2026-10-02 --write    insert / refresh it in the post
//   node scripts/nhl-tracker-day.mjs --all --write         refresh every logged date
//
// NIGHTLY NHL PASS (one command after the log is updated):
//   1. node scripts/nhl-game-photos.mjs <YYYYMMDD>         view the frames
//   2. add "<date> <AWAY>@<HOME>": { "confirmed": true, ... } entries to
//      scripts/data/nhl-game-log-2026-27.json (non-default sides get "call",
//      and "image"/"swatch" when a third or special has its own tile)
//   3. npm run nhl:daily  (= gen-nhl-schedule-tables.mjs + this script --all --write)
//      -> the 32 schedule posts, this tracker post, and /nhl-tracker/<team>
//         (which reads the log at build time) all update together.
//
// How the post is laid out: each day is "## Weekday, Month D", then a
// hand-written intro paragraph, then the cards between
// <!-- nhl-day:YYYY-MM-DD:start --> and <!-- nhl-day:YYYY-MM-DD:end -->.
// --write only ever replaces what is between the markers, so the intro survives
// re-runs. A brand-new day gets an auto intro (rewrite it in our voice if there
// is a story) and is placed newest-first above older days.
//
// Only games marked confirmed in the log get a card. Scores come live from
// api-web.nhle.com/v1/score/<date>; the pill says "Final" (never "Live").

import fs from "node:fs";

const POST = "content/posts/nhl-uniform-tracker-2026-27.md";
const LOG = JSON.parse(fs.readFileSync("scripts/data/nhl-game-log-2026-27.json", "utf8")).games;
const TEAMS = JSON.parse(fs.readFileSync("content/data/nhl-teams.json", "utf8")).teams;
const TILE_DIR = "/images/posts/nhl-daily-tracker";

const args = process.argv.slice(2);
const write = args.includes("--write");
const all = args.includes("--all");
const dateArg = args.find((a) => /^\d{4}-\d{2}-\d{2}$/.test(a));
if (!all && !dateArg) {
  console.error("usage: nhl-tracker-day.mjs YYYY-MM-DD [--write] | --all [--write]");
  process.exit(1);
}

const confirmedDates = [...new Set(
  Object.entries(LOG).filter(([, v]) => v.confirmed).map(([k]) => k.split(" ")[0]),
)].sort().reverse();
const dates = all ? confirmedDates : [dateArg];

const problems = [];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const pretty = (d) => new Date(d + "T12:00:00Z").toLocaleDateString("en-US",
  { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" });
const dateWords = (d) => { const [y, m, dd] = d.split("-").map(Number); return `${MONTHS[m - 1]} ${dd} ${y}`; };

function sideInfo(tri, isHome, entry) {
  const t = TEAMS[tri];
  const s = (isHome ? entry.home : entry.away) ?? {};
  const call = s.call ?? (isHome ? t.homeLabel : "Road White");
  const swatch = s.swatch ?? (s.color && !/^Road White/.test(call) ? s.color : null) ?? (isHome ? t.homeSwatch : "#ffffff");
  const image = s.image ?? `${TILE_DIR}/${t.key}-${isHome ? "home" : "road"}.jpg`;
  return { t, call, swatch, image, isDefault: !s.call };
}

// A clean team-colour sweater outline for any club whose product shot is missing.
function placeholder(info) {
  const fill = info.swatch;
  const stroke = fill.toLowerCase() === "#ffffff" ? "#9aa0ac" : "rgba(0,0,0,0.25)";
  return `<svg viewBox="0 0 120 120" width="120" height="120" role="img" aria-label="${info.t.name} ${info.call} sweater"><path d="M38 14 L60 22 L82 14 L112 34 L102 58 L90 52 L90 108 L30 108 L30 52 L18 58 L8 34 Z" fill="${fill}" stroke="${stroke}" stroke-width="2.5" stroke-linejoin="round"/></svg>`;
}

function side(info, oppShort, date) {
  const onDisk = fs.existsSync(`public${info.image}`);
  if (!onDisk) problems.push(`${date} ${info.t.short}: no tile at public${info.image} -> placeholder sweater used`);
  const pic = onDisk
    ? `<img src="${info.image}" alt="${info.t.name} ${info.call} sweater worn ${dateWords(date)} against the ${oppShort}, from the NHL daily uniform tracker" style="max-height: 132px; max-width: 100%; object-fit: contain;" />`
    : placeholder(info);
  return `    <div style="text-align: center; display: flex; flex-direction: column; align-items: center;">
      <div style="width: 100%; height: 150px; background: #ffffff; border-radius: 10px; display: flex; align-items: center; justify-content: center; padding: 8px; box-sizing: border-box;">
        ${pic}
      </div>
      <p style="color: #ffffff; font-size: 13px; font-weight: 900; margin: 11px 0 0; line-height: 1.2;">${info.t.short.toUpperCase()}</p>
      <p style="color: #ffffff; font-size: 9px; letter-spacing: 1.8px; text-transform: uppercase; opacity: 0.85; margin: 4px 0 0; font-weight: 600;"><span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${info.swatch}; border: 1px solid rgba(255,255,255,0.45); margin-right: 5px; vertical-align: middle;"></span>${info.call}</p>
    </div>`;
}

async function buildDay(date) {
  const res = await fetch(`https://api-web.nhle.com/v1/score/${date}`).then((r) => r.json());
  const games = (res.games ?? []).filter((g) => g.gameDate === date && g.gameType !== 1);
  // Standing rule from the MLB tracker: newest game at the top of the day.
  games.sort((a, b) => new Date(b.startTimeUTC) - new Date(a.startTimeUTC));

  const cards = [];
  const specials = [];
  for (const g of games) {
    const A = g.awayTeam.abbrev, H = g.homeTeam.abbrev;
    const entry = LOG[`${date} ${A}@${H}`];
    const done = ["OFF", "FINAL"].includes(g.gameState);
    if (!entry?.confirmed) {
      if (done) problems.push(`${date} ${A}@${H}: final but not confirmed in the game log, no card`);
      continue;
    }
    if (!TEAMS[A] || !TEAMS[H]) { problems.push(`${date} ${A}@${H}: unknown tricode`); continue; }
    const a = sideInfo(A, false, entry), h = sideInfo(H, true, entry);
    for (const s of [a, h]) if (!s.isDefault) specials.push(`${s.t.short} (${s.call})`);

    let pill = "Final";
    if (done) {
      const as = g.awayTeam.score, hs = g.homeTeam.score;
      const lp = g.gameOutcome?.lastPeriodType;
      const tag = lp && lp !== "REG" ? `Final/${lp}` : "Final";
      pill = hs > as ? `${tag} &middot; ${h.t.short} ${hs}, ${a.t.short} ${as}` : `${tag} &middot; ${a.t.short} ${as}, ${h.t.short} ${hs}`;
    } else {
      problems.push(`${date} ${A}@${H}: ${g.gameState}, bare Final pill, re-run once it ends`);
    }

    cards.push(`### ${a.t.name} at ${h.t.name}

<div style="margin: 1.4em 0 0.6em;">
<div style="background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%); border-radius: 14px; padding: 18px 22px 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
  <div style="text-align: center; margin-bottom: 12px;">
    <span style="padding: 4px 14px; background: linear-gradient(90deg, #005A9C 0%, #0E3386 100%); border-radius: 999px; font-size: 10px; font-weight: 800; color: #ffffff; text-transform: uppercase; letter-spacing: 2px; display: inline-block;">${pill}</span>
  </div>
  <div style="display: grid; grid-template-columns: 1fr auto 1fr; align-items: center;">
${side(a, h.t.short, date)}
    <p style="font-size: 11px; font-weight: 800; color: #ffffff; letter-spacing: 2.5px; opacity: 0.8; margin: 0 18px;">AT</p>
${side(h, a.t.short, date)}
  </div>
</div>
</div>`);
  }

  const n = cards.length;
  const intro = `${n} game${n === 1 ? "" : "s"} on ${pretty(date).split(",")[0]}, every sweater confirmed from game photos. ` +
    (specials.length
      ? `The non-standard looks: ${specials.join(", ")}. Everyone else wore the usual dark at home and white on the road.`
      : `Every club wore its standard dark at home and white on the road.`);
  const block = `<!-- nhl-day:${date}:start -->\n\n${cards.join("\n\n")}\n\n<!-- nhl-day:${date}:end -->`;
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
  const re = new RegExp(`<!-- nhl-day:${date}:start -->[\\s\\S]*?<!-- nhl-day:${date}:end -->`);
  if (re.test(md)) {
    md = md.replace(re, day.block);
  } else {
    // newest first: in front of the first older day, else at the end of the days
    const section = `${day.heading}\n\n${day.intro}\n\n${day.block}\n\n`;
    const markers = [...md.matchAll(/<!-- nhl-day:(\d{4}-\d{2}-\d{2}):start -->/g)];
    const older = markers.find((m) => m[1] < date);
    let at;
    if (older) at = md.lastIndexOf("\n## ", older.index) + 1;
    else at = md.indexOf("<!-- nhl-days:end -->");
    if (at <= 0) { console.error("could not find where to insert (missing <!-- nhl-days:end --> marker?)"); process.exit(1); }
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
