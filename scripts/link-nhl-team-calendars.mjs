// NHL twin of link-team-calendars.mjs: puts a "see every sweater they have worn"
// callout under the intro of each 2026-27 NHL team schedule post, linking to
// /nhl-tracker/<team>, and a daily-tracker callout on the league hub post
// (nhl-uniform-schedule-2026-27). Idempotent: a post that already carries the
// <!-- nhl-tracker-callout --> marker is left alone. Bumps updatedDate (Pacific
// date) on every post it changes.
//   node scripts/link-nhl-team-calendars.mjs
import fs from "node:fs";

const TEAMS = JSON.parse(fs.readFileSync("content/data/nhl-teams.json", "utf8")).teams;
const MARK = "<!-- nhl-tracker-callout -->";
const TODAY = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(new Date());

// White text needs a dark enough background; gold and light clubs fall back to navy.
const darkEnough = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 140;
};

const block = (href, eyebrow, line, cta, color) => `${MARK}
<div style="margin: 1.6em 0; padding: 16px 18px; border-radius: 14px; background: linear-gradient(135deg, ${color} 0%, ${color}cc 100%);">
  <p style="margin: 0 0 4px; font-size: 0.7em; font-weight: 800; letter-spacing: 0.16em; text-transform: uppercase; color: rgba(255,255,255,0.72);">${eyebrow}</p>
  <p style="margin: 0 0 10px; font-size: 1.05em; font-weight: 800; color: #ffffff; line-height: 1.35;">${line}</p>
  <a href="${href}" style="display: inline-block; padding: 8px 16px; background: #ffffff; color: ${color}; border-radius: 999px; font-size: 0.82em; font-weight: 800; text-decoration: none; letter-spacing: 0.03em;">${cta} &rarr;</a>
</div>`;

function insert(slug, html) {
  const path = `content/posts/${slug}.md`;
  if (!fs.existsSync(path)) return console.log(`  MISSING  ${slug}.md`), "missing";
  let md = fs.readFileSync(path, "utf8");
  if (md.includes(MARK)) return "skipped";
  const idx = md.indexOf("\n## ");
  if (idx === -1) return console.log(`  NO H2    ${slug}.md`), "missing";
  md = `${md.slice(0, idx)}\n\n${html}\n${md.slice(idx)}`;
  md = md.replace(/^updatedDate: .*$/m, `updatedDate: "${TODAY}"`);
  fs.writeFileSync(path, md);
  return "changed";
}

const tally = { changed: 0, skipped: 0, missing: 0 };
for (const t of Object.values(TEAMS)) {
  const md = fs.existsSync(`content/posts/${t.post}.md`) ? fs.readFileSync(`content/posts/${t.post}.md`, "utf8") : "";
  const hex = /gradient:.*?#([0-9a-fA-F]{6})/.exec(md)?.[1];
  const color = hex && darkEnough(`#${hex}`) ? `#${hex}` : "#14284b";
  tally[insert(t.post, block(
    `/nhl-tracker/${t.key}`,
    "Live 2026-27 Tracker",
    `See every sweater the ${t.name} have actually worn this season, game by game.`,
    `Open the ${t.short} uniform calendar`,
    color,
  ))]++;
}
tally[insert("nhl-uniform-schedule-2026-27", block(
  "/stories/nhl-uniform-tracker-2026-27",
  "Updated Every Morning",
  "What every NHL team wore last night: both sweaters from every game, confirmed from game photos.",
  "Open the NHL daily uniform tracker",
  "#14284b",
))]++;

console.log(`inserted: ${tally.changed}   already-linked: ${tally.skipped}   problems: ${tally.missing}`);
