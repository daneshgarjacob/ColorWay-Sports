#!/usr/bin/env node
// Writes the "full jersey schedule is out" layer into the NBA team schedule
// posts once a club's 2026-27 calls are complete in
// scripts/data/nba-announced-uniforms-2026-27.json (all 80 dated games):
//   - replaces the pre-season "September 15 reveal" intro paragraph with a
//     dated update (most-worn jersey, opening night, City Edition debut,
//     Specter / Classic nights)
//   - a count grid ("How Many Times the X Wear Each Jersey"), home/road split
//   - refreshes the stale FAQ answers and adds schedule FAQs
//   - refreshes the Bottom Line and the excerpt
// Every sentence is computed from the data file, nothing typed by hand.
// Idempotent: re-running rewrites the marked blocks in place.
//
//   node scripts/gen-nba-uniform-counts.mjs
//
// Skips the hand-written posts (Pacers, Nets, Bucks) on purpose.

import fs from "node:fs";

const SKIP = new Set(["pacers", "nets", "bucks"]);
const TEAMS = {
  "76ers": "PHI", "bulls": "CHI", "cavaliers": "CLE", "celtics": "BOS",
  "clippers": "LAC", "grizzlies": "MEM", "hawks": "ATL", "hornets": "CHA", "knicks": "NYK",
  "lakers": "LAL", "mavericks": "DAL", "miami-heat": "MIA", "nuggets": "DEN",
  "oklahoma-city-thunder": "OKC", "orlando-magic": "ORL", "pelicans": "NOP",
  "pistons": "DET", "raptors": "TOR", "rockets": "HOU", "sacramento-kings": "SAC",
  "spurs": "SAS", "suns": "PHX", "timberwolves": "MIN", "trail-blazers": "POR",
  "utah-jazz": "UTA", "warriors": "GSW", "wizards": "WAS",
};
const NAME = {
  ATL: "Hawks", BOS: "Celtics", BKN: "Nets", CHA: "Hornets", CHI: "Bulls", CLE: "Cavaliers",
  DAL: "Mavericks", DEN: "Nuggets", DET: "Pistons", GSW: "Warriors", HOU: "Rockets",
  IND: "Pacers", LAC: "Clippers", LAL: "Lakers", MEM: "Grizzlies", MIA: "Heat", MIL: "Bucks",
  MIN: "Timberwolves", NOP: "Pelicans", NYK: "Knicks", OKC: "Thunder", ORL: "Magic",
  PHI: "76ers", PHX: "Suns", POR: "Trail Blazers", SAC: "Kings", SAS: "Spurs",
  TOR: "Raptors", UTA: "Jazz", WAS: "Wizards",
};
const MONTH = ["", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];
const ORDER = ["Association White", "Icon Edition", "Statement Edition", "City Edition", "Classic Edition", "Specter Edition"];
const LABEL = { "Association White": "Association Edition" };
const lab = (c) => LABEL[c] || c;
const NUM = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
const num = (n) => (n <= 10 ? NUM[n] : String(n));
const cap = (s) => s[0].toUpperCase() + s.slice(1);
const poss = (n) => (n.endsWith("s") ? `${n}'` : `${n}'s`);

const games = fs.readFileSync("scripts/data/nba-schedule-2026-27.txt", "utf8")
  .trim().split("\n").map((l) => { const [d, a, h] = l.split("|"); return { d, a, h }; });
const ANN = JSON.parse(fs.readFileSync("scripts/data/nba-announced-uniforms-2026-27.json", "utf8"));
const today = new Date().toISOString().slice(0, 10);

const fmt = (iso) => { const [, m, d] = iso.split("-").map(Number); return `${MONTH[m]} ${d}`; };
const list = (xs) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}`);

let done = 0;
for (const [slug, tri] of Object.entries(TEAMS)) {
  if (SKIP.has(slug)) continue;
  const path = `content/posts/${slug}-uniform-schedule-2026-27.md`;
  const ann = ANN[tri];
  const mine = games.filter((g) => g.a === tri || g.h === tri).sort((x, y) => x.d.localeCompare(y.d));
  if (!ann || ann.partial || mine.some((g) => !ann.games[g.d])) { console.log(`- ${slug}: schedule not complete, skipped`); continue; }

  let s = fs.readFileSync(path, "utf8");
  const orig = s;
  const full = (s.match(/\*\*What are the (.+?) wearing tonight\?\*\*/) || [])[1];
  const short = (s.match(/we log the (.+?) (?:jersey|uniform) for every game/) || [])[1] || NAME[tri];
  if (!full) { console.error(`✗ ${slug}: FAQ anchor not found`); process.exitCode = 1; continue; }

  const rows = mine.map((g) => {
    const home = g.h === tri;
    return { d: g.d, home, opp: NAME[home ? g.a : g.h], call: ann.games[g.d] };
  });
  const where = (r) => `${r.home ? "vs" : "at"} the ${r.opp}`;
  const tally = {};
  for (const r of rows) {
    const t = (tally[r.call] ||= { n: 0, h: 0, a: 0, rows: [] });
    t.n++; r.home ? t.h++ : t.a++; t.rows.push(r);
  }
  const ranked = Object.entries(tally).sort((x, y) => y[1].n - x[1].n || ORDER.indexOf(x[0]) - ORDER.indexOf(y[0]));
  const [topCall, top] = ranked[0];
  const second = ranked[1];
  const opener = rows[0];
  const city = tally["City Edition"];
  const specter = tally["Specter Edition"];
  const classic = tally["Classic Edition"];

  // --- colors for the count grid, read from the post's own closet cards
  const card = (label) => {
    const m = s.slice(s.indexOf("Uniform Closet for")).match(new RegExp(`<div style="background: (#[0-9A-Fa-f]{3,6}); color: (#[0-9A-Fa-f]{3,6});[^"]*"><div[^>]*>${label}</div>`));
    return m ? { bg: m[1], fg: m[2], border: "" } : null;
  };
  const style = {
    "Association White": { bg: "#ffffff", fg: "#14284b", border: " border: 1px solid #dfe3ea;" },
    "Icon Edition": card("Icon Edition") || { bg: "#14284b", fg: "#ffffff", border: "" },
    "Statement Edition": card("Statement Edition") || { bg: "#2f6bed", fg: "#ffffff", border: "" },
    "City Edition": card("City Edition") || { bg: "#101010", fg: "#ffffff", border: "" },
    "Classic Edition": card("Classic Edition") || { bg: "#7a4a12", fg: "#ffffff", border: "" },
    "Specter Edition": { bg: "#1a1426", fg: "#ffffff", border: "" },
  };
  const box = (call, t) => {
    const st = style[call];
    return `  <div style="background: ${st.bg}; color: ${st.fg};${st.border} border-radius: 12px; padding: 16px 14px;"><div style="font-size: 0.72em; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; opacity: 0.85;">${lab(call)}</div><div style="font-size: 2.2em; font-weight: 900; line-height: 1.1; margin-top: 6px;">${t.n}</div><div style="font-size: 0.85em; font-weight: 600; margin-top: 2px;">${t.h} home, ${t.a} road</div></div>`;
  };

  // --- the update paragraph
  let upd = `**Update, October 19:** The full ${short} jersey schedule for 2026-27 is out, a call for all 80 dated games. The ${lab(topCall)} is the most-worn ${short} jersey this season at **${top.n} games** (${top.h} home, ${top.a} road), ahead of the ${lab(second[0])} at ${second[1].n}.`;
  upd += ` Opening night, ${fmt(opener.d)} ${where(opener)}, is the **${lab(opener.call)}**.`;
  if (city) upd += ` The City Edition debuts **${fmt(city.rows[0].d)} ${where(city.rows[0])}** and is scheduled for ${num(city.n)} games in all.`;
  if (specter) upd += ` The new [Specter Edition](/stories/nba-specter-edition-jerseys-2026-27) gets ${num(specter.n)} ${specter.n === 1 ? "night" : "nights"}: ${list(specter.rows.map((r) => `${fmt(r.d)} ${where(r)}`))}.`;
  if (classic) upd += ` The Classic Edition is on for ${num(classic.n)} games.`;
  upd += ` Every game is filled in below.`;

  const intro = `<!-- nba-uniform-counts:intro:start -->\n${upd}\n<!-- nba-uniform-counts:intro:end -->`;
  const staleIntro = /We build these before the season rather than after it[^\n]*\n/;
  if (s.includes("<!-- nba-uniform-counts:intro:start -->")) {
    s = s.replace(/<!-- nba-uniform-counts:intro:start -->[\s\S]*?<!-- nba-uniform-counts:intro:end -->/, intro);
  } else if (staleIntro.test(s)) {
    s = s.replace(staleIntro, intro + "\n");
  } else {
    console.error(`✗ ${slug}: intro anchor not found`); process.exitCode = 1; continue;
  }

  // --- count grid, right before the closet section
  const grid = `<!-- nba-uniform-counts:grid:start -->
## How Many Times the ${short} Wear Each Jersey in 2026-27

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin: 1.5em 0;">
${ranked.map(([c, t]) => box(c, t)).join("\n")}
</div>

That covers all 80 games the league has dated. The last two December dates wait on the NBA Cup knockout draw, and we add them when the league slots them.
<!-- nba-uniform-counts:grid:end -->`;
  if (s.includes("<!-- nba-uniform-counts:grid:start -->")) {
    s = s.replace(/<!-- nba-uniform-counts:grid:start -->[\s\S]*?<!-- nba-uniform-counts:grid:end -->/, grid);
  } else {
    const closet = s.indexOf("\n## The ");
    if (closet < 0 || !/Uniform Closet/.test(s.slice(closet, closet + 80))) { console.error(`✗ ${slug}: closet heading not found`); process.exitCode = 1; continue; }
    s = s.slice(0, closet) + "\n" + grid + "\n" + s.slice(closet);
  }

  // --- FAQ
  s = s.replace(/(\*\*What uniforms do the .+? have for 2026-27\?\*\*\n\n)[^\n]*\n/, (m, q) => {
    const have = ranked.map(([c]) => lab(c));
    return `${q}${list(have)}. ${cap(num(have.length))} jerseys in all for 2026-27, and the count grid above shows how many games each one gets.\n`;
  });
  s = s.replace(/(\*\*What are the .+? wearing tonight\?\*\*\n\n)[^\n]*\n/, (m, q) =>
    `${q}Find tonight's date in the game-by-game table above: every ${short} game for 2026-27 has its scheduled jersey, and each row flips to what was actually worn, updated the morning after. Opening night, ${fmt(opener.d)} ${where(opener)}, is the ${lab(opener.call)}.\n`);

  const faq = [];
  faq.push([`What jersey do the ${full} wear the most in 2026-27?`,
    `The ${lab(topCall)}, scheduled for ${top.n} of 80 dated games (${top.h} home, ${top.a} road). Then it goes ${ranked.slice(1).map(([c, t]) => `${lab(c)} ${t.n}`).join(", ")}.`]);
  if (city) faq.push([`When do the ${full} wear their City Edition jersey?`,
    `${cap(num(city.n))} games: ${list(city.rows.map((r) => `${fmt(r.d)} ${where(r)}`))}.`]);
  if (specter) faq.push([`When do the ${full} wear the Specter Edition?`,
    `${cap(num(specter.n))} ${specter.n === 1 ? "game" : "games"}: ${list(specter.rows.map((r) => `${fmt(r.d)} ${where(r)}`))}. The Specter Edition is Nike's new fifth uniform for the NBA's eight oldest franchises, and we break it down in our [Specter Edition guide](/stories/nba-specter-edition-jerseys-2026-27).`]);
  if (classic) faq.push([`When do the ${full} wear the Classic Edition?`,
    `${cap(num(classic.n))} games: ${list(classic.rows.map((r) => `${fmt(r.d)} ${where(r)}`))}.`]);
  faq.push([`Do the ${full} always wear white at home?`,
    `No. The Association white is scheduled for ${tally["Association White"]?.h || 0} of the ${poss(short)} 40 home games this season. The rest of the home schedule goes to the color and alternate jerseys, so check the table for the night you are going.`]);
  const faqBlock = `<!-- nba-uniform-counts:faq:start -->\n${faq.map(([q, a]) => `**${q}**\n\n${a}`).join("\n\n")}\n<!-- nba-uniform-counts:faq:end -->`;
  if (s.includes("<!-- nba-uniform-counts:faq:start -->")) {
    s = s.replace(/<!-- nba-uniform-counts:faq:start -->[\s\S]*?<!-- nba-uniform-counts:faq:end -->/, faqBlock);
  } else {
    s = s.replace(/(## Frequently Asked Questions\n\n)/, `$1${faqBlock}\n\n`);
  }

  // --- Bottom Line (only the stale pre-season one)
  s = s.replace(/(## The Bottom Line\n\n)The .+? closet for 2026-27 is set apart from the City Edition, which the league reveals on September 15\.[^\n]*\n/, (m, h) =>
    `${h}The ${short} schedule for 2026-27 is set, all 80 dated games. It is ${/^[AEIOU]/.test(lab(topCall)) ? "an" : "a"} ${lab(topCall)} season first, ${top.n} games of it, with ${list(ranked.slice(1).map(([c, t]) => `${t.n} ${lab(c)}`))}. This page logs what is actually worn every night from the opener on.\n`);

  // --- excerpt
  s = s.replace(/^excerpt: .*$/m, `excerpt: "The full ${short} uniform schedule for 2026-27: the jersey for all 80 dated games, how many times they wear each one${city ? ", and every City Edition date" : ""}."`);

  if (s === orig) continue;
  s = s.replace(/^updatedDate:\s*['"]?\d{4}-\d{2}-\d{2}['"]?\s*$/m, `updatedDate: "${today}"`);
  fs.writeFileSync(path, s);
  done++;
  console.log(`✓ ${slug}: ${ranked.map(([c, t]) => `${lab(c).split(" ")[0]} ${t.n}`).join(", ")}`);
}
console.log(`${done} posts updated`);
