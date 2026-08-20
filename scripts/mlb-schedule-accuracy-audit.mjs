#!/usr/bin/env node
// Diff what each MLB team ACTUALLY wore (the tracker) against what its
// uniform-schedule post CLAIMS they wear (the rotation section headings).
//   node scripts/mlb-schedule-accuracy-audit.mjs [--team rays]
//
// Why: the 30 schedule posts are the highest-earning format on the site
// (1,400+ clicks each vs 150 for the tracker), but their rotation rules were
// written at the START of the season from preseason reporting. Five months of
// logged games is now better evidence than the reporting was. This finds where
// the pages that rank are wrong.
//
// Read-only. It prints a report and changes nothing.

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
const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

// ---- 1. what they actually wore -------------------------------------------
const md = fs.readFileSync(TRACKER, "utf8");
const SIDE = /<img src="\/images\/posts\/mlb-daily-tracker\/[^"]+"[\s\S]*?background: #[0-9A-Fa-f]{6};[^>]*><\/span>([^<]+)<\/p>/g;

const worn = new Map(); // slug -> [{weekday, home, uniform}]
const dayBlocks = md.split(/^## /m).slice(1);
for (const block of dayBlocks) {
  const head = block.split("\n")[0].trim();
  const wm = head.match(/^([A-Z][a-z]+), [A-Z][a-z]+ \d+/);
  if (!wm) continue;
  const weekday = wm[1];
  for (const card of block.split(/^### /m).slice(1)) {
    const h = card.split("\n")[0].replace(/,\s*Game \d+\s*$/, "").trim();
    const parts = h.split(" at ");
    if (parts.length !== 2) continue;
    const slugs = parts.map((n) => SLUG[n.trim()]);
    if (slugs.some((s) => !s)) continue;
    let m, i = 0;
    SIDE.lastIndex = 0;
    while ((m = SIDE.exec(card)) !== null && i < 2) {
      const slug = slugs[i];
      if (!worn.has(slug)) worn.set(slug, []);
      worn.get(slug).push({ weekday, home: i === 1, uniform: m[1].trim() });
      i++;
    }
  }
}

// ---- 2. what the schedule post claims --------------------------------------
// Rotation rules live in section headings: "## <Uniform> (<claim>)"
const CLAIM_RE = /^## ([^(\n]+?)\s*\(([^)\n]+)\)\s*$/gm;

const onlyTeam = process.argv.includes("--team") ? process.argv[process.argv.indexOf("--team") + 1] : null;
const report = [];

for (const [name, slug] of Object.entries(SLUG)) {
  if (onlyTeam && slug !== onlyTeam) continue;
  const path = `content/posts/${slug}-uniform-schedule-2026.md`;
  if (!fs.existsSync(path)) { report.push({ slug, fatal: "no schedule post" }); continue; }
  const post = fs.readFileSync(path, "utf8");
  const games = worn.get(slug) ?? [];
  const issues = [];

  const claims = [...post.matchAll(CLAIM_RE)].map((m) => ({ uniform: m[1].trim(), claim: m[2].trim() }));

  // normalise a post's uniform heading to the tracker's label vocabulary
  const norm = (s) => s.toLowerCase().replace(/[^a-z ]/g, " ").replace(/\s+/g, " ").trim();
  // Words that appear in half the uniforms in baseball carry no signal. What makes
  // "Khaki Road" findable is "khaki", not "road".
  const GENERIC = new Set(["home","road","away","alternate","alt","jersey","jerseys","uniform","the","kit","set","edition"]);
  const distinctive = (s) => norm(s).split(" ").filter((w) => w.length > 2 && !GENERIC.has(w));
  const wornLabels = [...new Set(games.map((g) => g.uniform))];
  const matchLabel = (headingName) => {
    const h = norm(headingName);
    return wornLabels.find((w) => {
      const n = norm(w);
      return n === h || h.includes(n) || n.includes(h)
        || (h.includes("city connect") && n.includes("city connect"))
        || (h.includes("throwback") && n.includes("throwback"));
    });
  };

  // A. day-of-week claims we can actually test
  for (const c of claims) {
    const label = matchLabel(c.uniform);
    const cl = c.claim.toLowerCase();
    const day = DAYS.find((d) => cl.includes(d.toLowerCase()) && !cl.includes("non-" + d.toLowerCase()));
    if (!day) continue;
    const homeOnly = cl.includes("home");
    const pool = games.filter((g) => g.weekday === day && (!homeOnly || g.home));
    // Never claim a rule is WRONG on the strength of a window that never tested it.
    // Six weeks gives a team only a handful of Friday home dates.
    if (pool.length < 3) continue;
    if (!label) {
      issues.push(`"${c.uniform}" claimed for ${day}${homeOnly ? " home" : ""} games. ${pool.length} such games in the window and it never appeared. Actual: ${[...new Set(pool.map((g) => g.uniform))].join(", ")}`);
      continue;
    }
    const hits = pool.filter((g) => g.uniform === label).length;
    const pct = Math.round((hits / pool.length) * 100);
    if (pct < 50) {
      const actual = {};
      pool.forEach((g) => { actual[g.uniform] = (actual[g.uniform] || 0) + 1; });
      const top = Object.entries(actual).sort((a, b) => b[1] - a[1]).slice(0, 3)
        .map(([u, n]) => `${u} ${n}`).join(", ");
      issues.push(`"${c.uniform}" claimed for ${day}${homeOnly ? " home" : ""} games but worn only ${hits}/${pool.length} (${pct}%). Actual: ${top}`);
    }
  }

  // B. uniforms actually worn that the post never documents
  for (const w of wornLabels) {
    const n = norm(w);
    const toks = distinctive(w);
    const postNorm = norm(post);
    // documented if every distinctive word shows up somewhere in the post
    const documented = toks.length === 0 || toks.every((t) => postNorm.includes(t));
    const count = games.filter((g) => g.uniform === w).length;
    if (!documented && count >= 2) issues.push(`WORE "${w}" ${count}x but the post never mentions it`);
  }

  report.push({ slug, logged: games.length, issues });
}

// ---- 3. print --------------------------------------------------------------
const bad = report.filter((r) => r.fatal || r.issues.length);
console.log(`Audited ${report.length} teams against ${[...worn.values()].reduce((n, a) => n + a.length, 0)} logged team-games.\n`);
for (const r of bad) {
  console.log(`── ${r.slug} (${r.logged ?? 0} games logged)`);
  if (r.fatal) { console.log(`   ⚠️  ${r.fatal}`); continue; }
  r.issues.forEach((i) => console.log(`   • ${i}`));
  console.log();
}
console.log(`${report.length - bad.length} of ${report.length} teams had no detectable discrepancy.`);
