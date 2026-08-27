// Rebuilds the "More 2026 college uniform schedules" block in every college
// uniform-schedule post from the set of posts that actually exist, so adding a
// new program is one command instead of twelve hand edits.
//
// The block is what keeps these pages out of orphan status: there is no college
// hub page, so the posts link each other. A new post with no inbound links is an
// orphan the day it ships.
//
// Idempotent. Run after adding any <team>-uniform-schedule-2026 post with
// league: "college".
//
// Usage: node scripts/sync-cfb-crosslinks.mjs
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const POSTS = join(root, "content", "posts");

const esc = (s) => s.replace(/&/g, "&amp;");

const files = readdirSync(POSTS).filter((f) => /-uniform-schedule-2026\.md$/.test(f));
const teams = [];
for (const f of files) {
  const md = readFileSync(join(POSTS, f), "utf8");
  if (!/^league:\s*["']?college["']?/m.test(md)) continue;
  const t = md.match(/^title:\s*"(.+?) Uniform Schedule 2026/m);
  if (!t) { console.log(`SKIP ${f}: title does not match "<Team> Uniform Schedule 2026"`); continue; }
  teams.push({ slug: f.replace(/\.md$/, ""), name: t[1] });
}
teams.sort((a, b) => a.name.localeCompare(b.name));
console.log(`${teams.length} college schedule posts`);

const BLOCK = /<div data-cfb-crosslinks[\s\S]*?<\/div>/;

let changed = 0;
for (const me of teams) {
  const file = join(POSTS, `${me.slug}.md`);
  let md = readFileSync(file, "utf8");

  const links = teams
    .filter((t) => t.slug !== me.slug)
    .map(
      (t) =>
        `<a href="/stories/${t.slug}" style="display: block; padding: 9px 0; border-bottom: 1px solid #e3e7ec; color: #14284b; font-weight: 700; text-decoration: none;">${esc(t.name)} 2026 Uniform Schedule</a>`,
    )
    .join("");

  const block =
    `<div data-cfb-crosslinks style="margin: 2.25em 0; padding: 1.35em 1.5em; background: #f6f7f9; border: 1px solid #e3e7ec; border-radius: 12px;">` +
    `<p style="font-size: 0.7em; font-weight: 800; letter-spacing: 2.2px; text-transform: uppercase; color: #5f7085; margin: 0 0 0.35em;">More 2026 college uniform schedules</p>` +
    `<p style="font-size: 0.9em; color: #5f7085; margin: 0 0 0.9em; line-height: 1.5;">What the other programs wear, week by week.</p>` +
    links +
    `</div>`;

  const before = md;
  if (BLOCK.test(md)) {
    md = md.replace(BLOCK, block);
  } else {
    md = md.trimEnd() + "\n\n" + block + "\n";
  }
  if (md !== before) {
    writeFileSync(file, md);
    changed++;
    console.log(`ok  ${me.slug}`);
  }
}
console.log(`\n${changed} posts updated.`);
