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
const SIDE = /<img src="(\/images\/posts\/mlb-daily-tracker\/[^"]+)" alt="([^"]*)"[\s\S]*?line-height: 1\.2;">([^<]+)<\/p>[\s\S]*?background: (#[0-9A-Fa-f]{6});[^>]*><\/span>([^<]+)<\/p>[\s\S]*?<a href="([^"]+)"/g;

const tile = new Map();     // `${slug}|${uniform}` -> {src, swatch}
const label = new Map();    // slug -> short label e.g. SOX
const shop = new Map();     // slug -> fanatics href
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
    const [, src, , lbl, swatch, uniform, href] = m;
    const slug = slugs[i++];
    tile.set(`${slug}|${uniform.trim()}`, { src, swatch });
    label.set(slug, lbl.trim());
    shop.set(slug, href);
    if (!seenUni.has(slug)) seenUni.set(slug, new Set());
    seenUni.get(slug).add(uniform.trim());
  }
}

// First-time uniforms: a tile that exists on disk but has never appeared in a
// card yet, so the learner cannot know it. Seed those here on their debut day;
// after the day block ships, the learner picks them up from the post itself.
const SEED = {
  "astros|Navy Alternate": { src: "/images/posts/mlb-daily-tracker/astros-navy-alternate.jpg", swatch: "#002D62" },
  "phillies|Black City Connect": { src: "/images/posts/mlb-daily-tracker/phillies-city-connect.jpg", swatch: "#101820" },
  "orioles|BMORE City Connect": { src: "/images/posts/mlb-daily-tracker/orioles-bmore-cc.jpg", swatch: "#EAE3CE" },
  "angels|Road Gray": { src: "/images/posts/mlb-daily-tracker/angels-road-gray.jpg", swatch: "#8d9093" },
  "rockies|City Connect": { src: "/images/posts/mlb-daily-tracker/rockies-city-connect.jpg", swatch: "#7864b0" },
  "cubs|Royal Blue Alternate": { src: "/images/posts/mlb-daily-tracker/cubs-blue-alternate.jpg", swatch: "#0E3386" },
  "red-sox|Yellow City Connect": { src: "/images/posts/mlb-daily-tracker/red-sox-yellow-cc.jpg", swatch: "#FFD100" },
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
  return `    <div style="text-align: center; display: flex; flex-direction: column; align-items: center;">
      <div style="width: 100%; height: 150px; background: #ececf0; border-radius: 10px; display: flex; align-items: center; justify-content: center; padding: 8px; box-sizing: border-box;">
        <img src="${hit.src}" alt="${name} ${uniform} jersey worn ${dateWords} against the ${oppName}, from the MLB daily uniform tracker" style="max-height: 132px; max-width: 100%; object-fit: contain;" />
      </div>
      <p style="color: #ffffff; font-size: 13px; font-weight: 900; margin: 11px 0 0; line-height: 1.2;">${label.get(slug)}</p>
      <p style="color: #ffffff; font-size: 9px; letter-spacing: 1.8px; text-transform: uppercase; opacity: 0.85; margin: 4px 0 0; font-weight: 600;"><span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${hit.swatch}; border: 1px solid rgba(255,255,255,0.45); margin-right: 5px; vertical-align: middle;"></span>${uniform}</p>
      <a href="${shop.get(slug)}" target="_blank" rel="sponsored noopener" data-fanatics-jersey-cta style="margin-top: 10px; padding: 5px 12px; background: #2f6bed; border-radius: 999px; color: #ffffff; font-size: 9px; font-weight: 800; text-decoration: none; letter-spacing: 1.2px; text-transform: uppercase; display: inline-block;">Shop Jerseys</a>
    </div>`;
}

const dateWords = new Date(date + "T12:00:00Z").toLocaleDateString("en-US",
  { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }).replace(",", "");

const out = [`## ${pretty}`, "", "<!-- INTRO PARAGRAPH -->", "",
  "<!-- JERSEY OF THE DAY / STINKER blocks go here -->", ""];

for (const g of games) {
  const aName = g.teams.away.team.name, hName = g.teams.home.team.name;
  const aSlug = SLUG[aName], hSlug = SLUG[hName];
  const aU = confirmed[aSlug], hU = confirmed[hSlug];
  if (!aU || !hU) { problems.push(`${aName} at ${hName}: missing confirmed uniform`); continue; }

  const aR = g.teams.away.score, hR = g.teams.home.score;
  const win = hR > aR ? `${short(hName)} ${hR}, ${short(aName)} ${aR}`
                      : `${short(aName)} ${aR}, ${short(hName)} ${hR}`;
  const gameNo = g.gameNumber > 1 ? ` &middot; Game ${g.gameNumber}` : "";
  // A game that has not actually ended must never carry a score in the pill - a
  // suspended 3-3 tie reading "Final - Sox 3, Cubs 3" is just wrong. House style
  // never says "Live", so an unfinished game gets a bare Final and a patch later.
  const done = ["Final", "Game Over", "Completed Early"].includes(g.status.detailedState);
  const pill = done ? `Final${gameNo} &middot; ${win}` : `Final${gameNo}`;
  if (!done) problems.push(`${aName} at ${hName}: ${g.status.detailedState} (${aR}-${hR}) - bare Final pill, PATCH the score once it ends`);

  const a = side(aSlug, short(hName), aU, dateWords);
  const h = side(hSlug, short(aName), hU, dateWords);
  if (!a || !h) continue;

  out.push(`### ${aName} at ${hName}${g.gameNumber > 1 ? `, Game ${g.gameNumber}` : ""}`, "",
`<div style="margin: 1.4em 0 0.6em;">
<div style="background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%); border-radius: 14px; padding: 18px 22px 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
  <div style="text-align: center; margin-bottom: 12px;">
    <span style="padding: 4px 14px; background: linear-gradient(90deg, #005A9C 0%, #0E3386 100%); border-radius: 999px; font-size: 10px; font-weight: 800; color: #ffffff; text-transform: uppercase; letter-spacing: 2px; display: inline-block;">${pill}</span>
  </div>
  <div style="display: grid; grid-template-columns: 1fr auto 1fr; align-items: center;">
${a}
    <p style="font-size: 11px; font-weight: 800; color: #ffffff; letter-spacing: 2.5px; opacity: 0.8; margin: 0 18px;">AT</p>
${h}
  </div>
</div>
</div>`, "");
}

process.stdout.write(out.join("\n"));
if (problems.length) {
  console.error("\n\n=== NEEDS ATTENTION ===");
  for (const p of problems) console.error("  " + p);
}
