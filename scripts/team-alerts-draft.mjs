#!/usr/bin/env node
// Team Alerts: writes the per-game teaser DRAFTS for one date (docs/team-alerts-plan.md).
//
//   node scripts/team-alerts-draft.mjs                      # tomorrow (Pacific)
//   node scripts/team-alerts-draft.mjs --date 2026-11-22
//   node scripts/team-alerts-draft.mjs --date 2026-11-22 --sample nfl:detroit-lions
//   npm run alerts:draft -- --date 2026-11-22
//
// DRAFTS ONLY. Nothing here sends, schedules, or talks to beehiiv or Vercel.
// Jake reviews the drafts first; sending is a separate, later decision.
//
// For every NFL / NBA / NHL / college club with a game on that date (US Eastern),
// one teaser: Subject (team, opponent, day, uniform headline, Title Case), one
// line (the look, confirmed vs. expected), and the "See The Full Uniform" link to
// the club's schedule post with the plan's UTM tags. Clubs with no known look
// are skipped and listed, never guessed (plan rule 6).
//
// Output:
//   docs/team-alerts-drafts/<date>.md           every draft for the date
//   docs/team-alerts-drafts/<date>-sample.html  one sample email, image-free, inline styles
//
// The data lives in lib/*.ts, so like scripts/build-uniform-records.mjs this
// re-runs itself with Node's --experimental-strip-types, plus a small resolve
// hook (below) for the "@/" alias, extensionless imports and JSON imports that
// lib/myTeams.ts uses. No extra dependency.

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { register } from "node:module";

if (!process.execArgv.includes("--experimental-strip-types") && !process.features?.typescript) {
  const r = spawnSync(
    process.execPath,
    ["--experimental-strip-types", "--no-warnings", ...process.execArgv, fileURLToPath(import.meta.url), ...process.argv.slice(2)],
    { stdio: "inherit" },
  );
  process.exit(r.status ?? 1);
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(ROOT);

// Resolve hook: "@/x" -> <root>/x, "./foo" -> "./foo.ts", and JSON files loaded
// as plain modules (lib/ imports them without `with { type: "json" }`).
const HOOKS = `
import fs from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
const ROOT = ${JSON.stringify(pathToFileURL(ROOT + "/").href)};
const EXTS = ["", ".ts", ".tsx", ".js", ".mjs", "/index.ts", "/index.js"];
export async function resolve(spec, ctx, next) {
  let base = null;
  if (spec.startsWith("@/")) base = new URL(spec.slice(2), ROOT);
  else if ((spec.startsWith("./") || spec.startsWith("../")) && ctx.parentURL?.startsWith(ROOT) && !ctx.parentURL.includes("/node_modules/")) base = new URL(spec, ctx.parentURL);
  if (base) {
    for (const ext of EXTS) {
      const u = new URL(base.href + ext);
      try { if (fs.statSync(fileURLToPath(u)).isFile()) return { url: u.href, shortCircuit: true }; } catch {}
    }
  }
  return next(spec, ctx);
}
export async function load(url, ctx, next) {
  if (url.startsWith(ROOT) && url.endsWith(".json") && !url.includes("/node_modules/")) {
    return { format: "module", source: "export default " + fs.readFileSync(fileURLToPath(url), "utf8") + ";", shortCircuit: true };
  }
  return next(url, ctx);
}`;
register("data:text/javascript," + encodeURIComponent(HOOKS));

const lib = (f) => import(pathToFileURL(path.join(ROOT, "lib", f)).href);
const { getMyTeamCards } = await lib("myTeams.ts");
const { buildNflTeamIndex } = await lib("nflTrackerTeamIndex.ts");
const { buildWinterIndex, nhlTeams } = await lib("winterTrackerIndex.ts");

// ---------------------------------------------------------------------------
// Arguments

const arg = (name) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
};
const tomorrowPT = () => {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
  return new Date(Date.parse(`${today}T12:00:00Z`) + 86400_000).toISOString().slice(0, 10);
};
const DATE = arg("date") ?? tomorrowPT();
if (!/^\d{4}-\d{2}-\d{2}$/.test(DATE)) {
  console.error(`--date must be YYYY-MM-DD, got "${DATE}"`);
  process.exit(1);
}
const SAMPLE = arg("sample");
const SITE = "https://www.colorwaysports.com";
const OUT_DIR = path.join(ROOT, "docs", "team-alerts-drafts");

// ---------------------------------------------------------------------------
// Helpers

const etDay = (ms) => new Date(ms).toLocaleDateString("en-CA", { timeZone: "America/New_York" });
const weekday = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
const longDate = (iso) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" });
// Jake 11/9: capitalize every word in titles, small words too.
const titleCase = (s) => s.replace(/(^|[\s\-/(])([a-z])/g, (_, a, b) => a + b.toUpperCase());
const ORD = ["", "first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth"];
const NUM = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
const UNKNOWN = /^(uniform to come|bye week|tbd|tba|$)/i;
// NFL grid tags that are a TV window, not a uniform story.
const WINDOW_TAG = /^(mnf|snf|tnf|sunday night|monday night|thursday night|prime ?time|international|london|.*pants)$/i;

const cityOf = (name, nickname) => (name.endsWith(` ${nickname}`) ? name.slice(0, -nickname.length - 1) : name);
// Grid matchups can carry a site tag: "vs. Vikings (MEX)". Known neutral sites
// read as a city; any other tag (day of week, TBD) is dropped.
const SITES = { MEX: "Mexico City", LON: "London", GER: "Berlin", BRA: "Sao Paulo", ESP: "Madrid", IRL: "Dublin", AUS: "Melbourne" };
const siteOf = (opp) => SITES[/\(([A-Z]{2,4})\)/.exec(opp)?.[1] ?? ""];
const oppName = (opp) => opp.replace(/^(vs\.?|at)\s+/i, "").replace(/\s*\([A-Z]{2,4}\)/g, "").trim();
const isHome = (opp) => /^vs/i.test(opp);

// Plain color words read lowercase in a sentence ("the royal blue jersey");
// named looks keep the team's capitals ("the Cold Front jersey", "the Vice City Edition").
const COLORS = new Set("white black navy royal blue red gold green purple orange teal aqua silver gray grey cream wine light dark powder scarlet crimson maroon yellow pewter brown burgundy kelly columbia carolina home road".split(" "));
function lookPhrase(league, look) {
  if (/^all /i.test(look)) return look.toLowerCase();
  const debut = /\s+debut$/i.test(look);
  if (debut) look = look.replace(/\s+debut$/i, "");
  const tail = debut ? " for the first time" : "";
  if (league === "NHL") return `the ${look}${/sweater|jersey/i.test(look) ? "" : " sweater"}${tail}`;
  if (league === "CFB" && look.includes(" / ")) {
    const [h, j, p] = look.split(" / ").map((x) => x.trim().toLowerCase());
    return `a ${h} helmet, ${j} jersey and ${p} pants`;
  }
  // "White jersey, royal pants" -> "the white jersey and royal pants"; "Red City jersey" -> "the red City jersey"
  const words = look.split(" ");
  const lead = [];
  while (words.length && COLORS.has(words[0].toLowerCase().replace(/,$/, ""))) lead.push(words.shift().toLowerCase());
  const s = [...lead, ...words].join(" ");
  return `the ${s.replace(/, ([^,]+)$/, " and $1")}${tail}`;
}

// ---------------------------------------------------------------------------
// Source data, for what the card hides: NFL grid tags + season counts, NBA/NHL
// whether the call is published/announced or the NHL's standard home/road rule.

const nflBySlug = new Map(buildNflTeamIndex().map((t) => [t.slug, t]));
const winterBySlug = new Map(buildWinterIndex().map((t) => [`${t.league}:${t.slug}`, t]));
const nhlHomeLabel = new Map(Object.values(nhlTeams()).map((t) => [t.slug, t.homeLabel]));

function nflContext(slug, week) {
  const t = nflBySlug.get(slug);
  const g = t?.games.find((x) => x.week === week && !x.bye);
  if (!t || !g) return {};
  const [first, second] = g.uniform.split(" · ");
  const special = second && !WINDOW_TAG.test(second.trim()) ? second.trim() : undefined;
  // "second of three black games": only for a jersey that is not one of the
  // club's two everyday jerseys, and only when it is worn more than once.
  const jerseyOf = (u) => u.split(" · ")[0].split(" / ")[0].trim().toLowerCase();
  const counts = new Map();
  for (const x of t.games.filter((x) => !x.bye)) counts.set(jerseyOf(x.uniform), (counts.get(jerseyOf(x.uniform)) ?? 0) + 1);
  const everyday = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k]) => k);
  const jersey = jerseyOf(first);
  let series;
  const total = counts.get(jersey) ?? 0;
  if (!everyday.includes(jersey) && total >= 2 && total <= 10) {
    const nth = t.games.filter((x) => !x.bye && x.week <= week && jerseyOf(x.uniform) === jersey).length;
    series = `the ${ORD[nth]} of ${NUM[total]} ${jersey} games this season`;
  }
  return { special, series };
}

// ---------------------------------------------------------------------------
// Build the drafts

// Midnight Eastern at the start of DATE (EST in Nov-Mar, EDT otherwise; NFL
// cards keep a game "next" until four hours after kickoff, so an hour either
// way is harmless). Every card is asked for its next six games.
const now = new Date(`${DATE}T00:00:00-05:00`);
const cards = getMyTeamCards(now, 6).filter((c) => ["NFL", "NBA", "NHL", "CFB"].includes(c.league));

const drafts = [];
const skipped = [];
for (const c of cards) {
  const g = (c.upcoming ?? (c.next ? [c.next] : [])).find((u) => etDay(u.at) === DATE);
  if (!g) continue;
  const opp = oppName(g.opp);
  const site = siteOf(g.opp);
  const home = isHome(g.opp) && !site;
  const slug = c.id.split(":")[1];
  if (!g.look || UNKNOWN.test(g.look.trim())) {
    skipped.push({ team: c.name, league: c.league, opp: g.opp, why: g.look || "no look" });
    continue;
  }

  let confirmed = false;
  let source = "";
  let extra = {};
  if (c.league === "NFL") {
    confirmed = !!g.confirmed;
    source = confirmed ? "the team announced it" : "our call from the team's uniform schedule";
    const week = Number(/Week (\d+)/.exec(g.when)?.[1]);
    extra = nflContext(slug, week);
  } else if (c.league === "NBA") {
    // Plan: the NBA's published jersey schedule counts as confirmed.
    confirmed = true;
    source = "the NBA's published jersey schedule";
  } else if (c.league === "NHL") {
    const w = winterBySlug.get(c.id)?.games.find((x) => x.date === DATE);
    const standard = w?.expected === (w?.home ? nhlHomeLabel.get(slug) : "Road White");
    confirmed = !!w?.confirmed || (!!w?.expected && !standard);
    source = confirmed ? "the team announced it" : "the standard home/road rule, no special sweater announced";
  } else {
    source = "our call from the team's uniform schedule";
  }

  const city = c.league === "CFB" ? c.name : cityOf(c.name, c.nickname);
  const day = weekday(DATE);
  const subject = titleCase(`${c.nickname} ${home || site ? "vs." : "at"} ${opp}${site ? ` In ${site}` : ""} ${day}: ${g.look} ${confirmed ? "Confirmed" : "Expected"}`);
  const where = site ? `against the ${opp} in ${site}` : home ? `at home against the ${opp}` : `at the ${opp}`;
  const where2 = c.league === "CFB" ? (home ? `at home against ${opp}` : `at ${opp}`) : where;
  let line = `${city} ${confirmed ? "will wear" : "is expected in"} ${lookPhrase(c.league, g.look)} ${where2} on ${longDate(DATE)}`;
  if (extra.special) line += ` (${extra.special})`;
  if (extra.series) line += `, ${extra.series}`;
  line += ".";
  if (confirmed && c.league === "NBA") line += " It is on the NBA's published jersey schedule.";
  if (confirmed && c.league === "NHL") line += " The team has announced it.";
  if (confirmed && c.league === "NFL") line += " The team has confirmed it.";

  const utm = `utm_source=beehiiv&utm_medium=email&utm_campaign=team-alert&utm_content=${c.league.toLowerCase()}-${slug}-${DATE}`;
  drafts.push({
    id: c.id, league: c.league, team: c.name, nickname: c.nickname, opp, home,
    kickoff: c.league === "NFL" ? new Date(g.at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York" }) + " ET" : undefined,
    subject, line, confirmed, source,
    url: `${SITE}${c.href}?${utm}`,
  });
}

const LEAGUE_ORDER = ["NFL", "NBA", "NHL", "CFB"];
drafts.sort((a, b) => LEAGUE_ORDER.indexOf(a.league) - LEAGUE_ORDER.indexOf(b.league) || a.nickname.localeCompare(b.nickname));

// ---------------------------------------------------------------------------
// Markdown

const md = [];
md.push(`# Team Alert Drafts: ${longDate(DATE)}, ${DATE.slice(0, 4)}`);
md.push("");
md.push(`DRAFTS FOR JAKE'S REVIEW. Nothing has been sent or scheduled. Generated ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC by \`scripts/team-alerts-draft.mjs --date ${DATE}\`, from the same data as the homepage My Teams cards (docs/team-alerts-plan.md).`);
md.push("");
md.push(`- **${drafts.length} drafts** (${LEAGUE_ORDER.map((l) => `${l} ${drafts.filter((d) => d.league === l).length}`).join(", ")}).`);
md.push(`- **${skipped.length} skipped** for no known look (never guessed).`);
md.push(`- Confirmed: ${drafts.filter((d) => d.confirmed).length}. Expected: ${drafts.filter((d) => !d.confirmed).length}.`);
md.push("- One email per team per game. A reader who follows several teams playing today gets ONE email with one block per team (plan rule 3); that merge happens at send time.");
md.push("- Footer on every email: Mute [Team] alerts · Unsubscribe (links TODO, see the sample HTML).");
md.push("");
for (const l of LEAGUE_ORDER) {
  const list = drafts.filter((d) => d.league === l);
  if (!list.length) continue;
  md.push(`## ${l} (${list.length})`);
  md.push("");
  for (const d of list) {
    md.push(`### ${d.team} (\`${d.id}\`)${d.kickoff ? ` · ${d.kickoff}` : ""}`);
    md.push("");
    md.push(`**Subject:** ${d.subject}`);
    md.push("");
    md.push(d.line);
    md.push("");
    md.push(`**[See The Full Uniform →]**`);
    md.push(`\`${d.url}\``);
    md.push("");
    md.push(`_${d.confirmed ? "Confirmed" : "Expected"}: ${d.source}._ · Mute ${d.nickname} alerts · Unsubscribe`);
    md.push("");
  }
}
if (skipped.length) {
  md.push("## Skipped (No Known Look)");
  md.push("");
  for (const s of skipped) md.push(`- ${s.team} (${s.league}) ${s.opp}: "${s.why}"`);
  md.push("");
}

fs.mkdirSync(OUT_DIR, { recursive: true });
const mdPath = path.join(OUT_DIR, `${DATE}.md`);
fs.writeFileSync(mdPath, md.join("\n"));

// ---------------------------------------------------------------------------
// Sample HTML: one email, no images, inline styles only (Gmail strips <style>
// in some clients), table layout, ColorWay royal button.

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const sample = drafts.find((d) => d.id === SAMPLE) ?? drafts.find((d) => d.league === "NFL") ?? drafts[0];
let htmlPath;
if (sample) {
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(sample.subject)}</title>
<!-- Team Alert sample (DRAFT, not sent). Subject line: ${esc(sample.subject)}
     TODO before sending: replace MUTE_LINK_TODO with the beehiiv link that removes
     "${sample.id}" from the reader's "Team Alerts" field, and UNSUBSCRIBE_LINK_TODO
     with beehiiv's unsubscribe merge tag (syntax not yet confirmed from beehiiv's docs). -->
</head>
<body style="margin:0;padding:0;background:#ffffff;">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(sample.line)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;">
  <tr>
    <td align="center" style="padding:24px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
        <tr>
          <td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:#0025CC;padding-bottom:16px;">
            ColorWay Sports · ${esc(sample.nickname)} Alert
          </td>
        </tr>
        <tr>
          <td style="font-family:Arial,Helvetica,sans-serif;font-size:24px;line-height:1.3;font-weight:bold;color:#111111;padding-bottom:12px;">
            ${esc(sample.subject)}
          </td>
        </tr>
        <tr>
          <td style="font-family:Arial,Helvetica,sans-serif;font-size:18px;line-height:1.5;color:#222222;padding-bottom:24px;">
            ${esc(sample.line)}
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:32px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="center" bgcolor="#0025CC" style="border-radius:6px;">
                  <a href="${esc(sample.url)}" target="_blank" style="display:inline-block;padding:14px 26px;font-family:Arial,Helvetica,sans-serif;font-size:17px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:6px;">See The Full Uniform &rarr;</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="border-top:1px solid #e3e5ea;padding-top:16px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:#666666;">
            You get this because you asked for ${esc(sample.nickname)} uniform alerts on colorwaysports.com. One email per game, never more than one a day.<br>
            <a href="MUTE_LINK_TODO" style="color:#666666;">Mute ${esc(sample.nickname)} alerts</a> &middot; <a href="UNSUBSCRIBE_LINK_TODO" style="color:#666666;">Unsubscribe</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>
`;
  htmlPath = path.join(OUT_DIR, `${DATE}-sample.html`);
  fs.writeFileSync(htmlPath, html);
}

console.log(`${DATE}: ${drafts.length} drafts, ${skipped.length} skipped (no known look)`);
console.log(`  ${path.relative(ROOT, mdPath)}`);
if (htmlPath) console.log(`  ${path.relative(ROOT, htmlPath)} (sample: ${sample.id})`);
