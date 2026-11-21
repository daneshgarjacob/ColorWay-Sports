// Rooting Guide sanity check (11/20). Loads the same ESPN feeds the site uses,
// runs the same pure rules in lib/rootingGuide/, and prints every team's picks
// for the current week in a compact table, plus any problems found (a team
// told to root against itself, duplicate games, undefined text, a contender
// with no "Big" game).
//
//   node scripts/rooting-guide-check.mjs              all NFL + ranked college teams
//   node scripts/rooting-guide-check.mjs --league nfl
//   node scripts/rooting-guide-check.mjs --detail nfl/los-angeles-chargers   full rows + reasons
//
// It compiles lib/rootingGuide/*.ts with the project's TypeScript into
// node_modules/.cache/rooting-guide-check/ first (no extra dependency).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "lib", "rootingGuide");
const OUT = path.join(ROOT, "node_modules", ".cache", "rooting-guide-check");
fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(SRC)) {
  if (!f.endsWith(".ts") || f === "feeds.ts") continue;
  const src = fs.readFileSync(path.join(SRC, f), "utf8");
  const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  fs.writeFileSync(path.join(OUT, f.replace(/\.ts$/, ".mjs")), js.replace(/from "\.\/([a-zA-Z]+)"/g, 'from "./$1.mjs"'));
}
const load = (m) => import(pathToFileURL(path.join(OUT, `${m}.mjs`)).href);
const parse = await load("parse");
const { nflGuide, guideProblems } = await load("nfl");
const { cfbGuide, cfbSupportedSlugs } = await load("cfb");
const { applyOverrides } = await load("shared");

const args = process.argv.slice(2);
const opt = (k) => (args.includes(k) ? args[args.indexOf(k) + 1] : undefined);
const onlyLeague = opt("--league");
const detail = opt("--detail");
const overrides = JSON.parse(fs.readFileSync(path.join(ROOT, "content/data/rooting-guide-overrides.json"), "utf8"));
const ids = JSON.parse(fs.readFileSync(path.join(ROOT, "content/data/team-page-ids.json"), "utf8"));

const get = async (url) => {
  const r = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 (rooting-guide-check)" } });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
};
const E = "https://site.api.espn.com/apis";

async function nflData() {
  const cur = parse.slimBoard(await get(`${E}/site/v2/sports/football/nfl/scoreboard`));
  const others = await Promise.all(parse.weekPlan(cur).map((p) => get(`${E}/site/v2/sports/football/nfl/scoreboard?seasontype=2&week=${p.week}&dates=${cur.season}`).then(parse.slimBoard)));
  const teams = parse.slimNflStandings(await get(`${E}/v2/sports/football/nfl/standings?season=${cur.season}&level=3`));
  return parse.assembleNfl(cur, others, teams);
}
async function cfbData() {
  const B = `${E}/site/v2/sports/football/college-football/scoreboard?groups=80&limit=300`;
  const cur = parse.slimBoard(await get(B));
  const others = await Promise.all(parse.weekPlan(cur).map((p) => get(`${B}&seasontype=2&week=${p.week}&dates=${cur.season}`).then(parse.slimBoard)));
  const teams = parse.slimCfbStandings(await get(`${E}/v2/sports/football/college-football/standings?season=${cur.season}&group=80`));
  const rank = parse.slimCfbRankings(await get(`${E}/site/v2/sports/football/college-football/rankings`));
  return parse.assembleCfb(cur, others, teams, rank);
}

const pad = (s, n) => String(s).slice(0, n).padEnd(n);
const LV = { Big: "BIG", Helps: "hlp", "A Little": "ltl" };
let problems = 0;

function show(res) {
  if (res.kind !== "guide") {
    console.log(`  ${pad(res.key, 40)} ${res.kind.toUpperCase()}${res.line ? ` — ${res.line}` : ""}`);
    return;
  }
  const g = applyOverrides(res.guide, overrides);
  const p = guideProblems(g);
  const contender = /In Position|In The Hunt|On The Bubble|In The Field|Clinched|Needs Help/.test(g.status.tag);
  // A judgement call, not an error (rivals on bye, or comfortably in): printed to read, not counted.
  const note = contender && g.sections[0] && !g.sections[0].games.some((r) => r.level === "Big") ? "contender with no Big game this week (check why)" : "";
  const rows = g.sections[0]?.games ?? [];
  console.log(`\n${g.key}  [${g.status.tag}]  ${g.status.facts.map((f) => f.value).join(" | ")}`);
  console.log(`  own: ${g.own.matchup} — ${g.own.when}`);
  for (const r of rows) console.log(`  ${LV[r.level]} ${pad(r.root, 16)} over ${pad(r.over, 18)} ${pad(r.matchup, 46)} w=${r.weight}`);
  for (const d of g.sections[0]?.done ?? []) console.log(`  done ${d.result} — ${d.verdict}`);
  if (g.sections[1]) console.log(`  next: ${g.sections[1].games.map((r) => `${r.root}>${r.over}(${LV[r.level]})`).join(", ")}`);
  if (note) console.log(`  -- ${note}`);
  for (const x of p) console.log(`  !! ${x}`);
  problems += p.length;
}

function showDetail(res) {
  if (res.kind !== "guide") return console.log(JSON.stringify(res, null, 2));
  const g = applyOverrides(res.guide, overrides);
  console.log(`${g.h1}\n${g.status.tag}: ${g.status.line}\n${g.status.need}`);
  console.log(`OWN ${g.own.label}: ${g.own.matchup} · ${g.own.when}\n    ${g.own.reason}`);
  for (const s of g.sections) {
    console.log(`\n== ${s.title} (${s.sub})`);
    for (const r of s.games) console.log(`[${r.level}] Root For ${r.root} — ${r.matchup} · ${r.when}\n    ${r.reason}`);
    for (const d of s.done ?? []) console.log(`[done] ${d.result} · ${d.when} · ${d.verdict}\n    ${d.reason}`);
    if (s.footnote) console.log(`note: ${s.footnote}`);
  }
  console.log("\nFAQ");
  for (const f of g.faq) console.log(`Q ${f.q}\nA ${f.a}`);
  console.log(`\ntitle: ${g.title}\ndesc: ${g.description}\npicks: ${g.picks.join(", ")}`);
}

if ((!detail && (!onlyLeague || onlyLeague === "nfl")) || detail?.startsWith("nfl/")) {
  const d = await nflData();
  const slugs = ids.filter((x) => x.startsWith("nfl:")).map((x) => x.slice(4));
  if (detail?.startsWith("nfl/")) showDetail(nflGuide(d, detail.slice(4)));
  else {
    console.log(`NFL ${d.season} Week ${d.week}`);
    for (const s of slugs) show(nflGuide(d, s));
  }
}
if (!detail && (!onlyLeague || onlyLeague === "cfb")) {
  const d = await cfbData();
  console.log(`\nCOLLEGE ${d.season} Week ${d.week} (${d.poll})`);
  for (const s of cfbSupportedSlugs(d)) show(cfbGuide(d, s));
} else if (detail?.startsWith("college-football/")) {
  showDetail(cfbGuide(await cfbData(), detail.slice("college-football/".length)));
}
console.log(`\n${problems} problem(s)`);
process.exitCode = problems ? 1 : 0;
