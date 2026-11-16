// Build guard for the "More For Your Team" block (lib/teamMoreLinks.ts).
//
// The block only links pages that exist when the site builds, but two inputs
// are typed by hand and can go stale: content/data/rivals.json and the post
// slugs named in lib/teamMoreLinks.ts (holiday hubs, league trackers). This
// fails the build if any of them points at a page that is not there.
//
// Run: node scripts/check-team-more-links.mjs   (also runs in prebuild)
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const postsDir = path.join(root, "content/posts");
const files = fs.readdirSync(postsDir).filter((f) => f.endsWith(".md"));
const slugs = new Set(files.map((f) => f.replace(/\.md$/, "")));

// Team slug -> its uniform schedule post, from each schedule post's `teams:`.
const scheduled = new Set();
for (const f of files) {
  if (!/-uniform-schedule-\d{4}(-\d{2})?\.md$/.test(f)) continue;
  const raw = fs.readFileSync(path.join(postsDir, f), "utf8");
  const fm = raw.split(/^---$/m)[1] ?? "";
  const inline = fm.match(/^teams:\s*\[(.*?)\]/m);
  const list = inline
    ? inline[1].split(",").map((s) => s.trim().replace(/^["']|["']$/g, ""))
    : [...(fm.match(/^teams:\s*\n((?:\s+-.*\n?)+)/m)?.[1] ?? "").matchAll(/-\s*["']?([a-z0-9-]+)/g)].map((m) => m[1]);
  for (const t of list) if (t) scheduled.add(t);
}

const errors = [];

const rivals = JSON.parse(fs.readFileSync(path.join(root, "content/data/rivals.json"), "utf8"));
let pairs = 0;
for (const [league, table] of Object.entries(rivals)) {
  if (league.startsWith("_")) continue;
  for (const [team, list] of Object.entries(table)) {
    if (!scheduled.has(team)) errors.push(`rivals.json ${league}: "${team}" has no uniform schedule post`);
    for (const r of list) {
      pairs++;
      if (!scheduled.has(r)) errors.push(`rivals.json ${league}: rival "${r}" of "${team}" has no uniform schedule post`);
      if (r === team) errors.push(`rivals.json ${league}: "${team}" lists itself`);
    }
  }
}

const lib = fs.readFileSync(path.join(root, "lib/teamMoreLinks.ts"), "utf8");
const named = [...lib.matchAll(/slug:\s*"([a-z0-9-]+)"/g)].map((m) => m[1]);
for (const s of named) if (!slugs.has(s)) errors.push(`lib/teamMoreLinks.ts links /stories/${s}, which does not exist`);

if (errors.length) {
  console.error(`check-team-more-links: ${errors.length} broken link(s)`);
  for (const e of errors) console.error("  - " + e);
  process.exit(1);
}
console.log(`check-team-more-links: OK (${pairs} rival links, ${named.length} named pages)`);
