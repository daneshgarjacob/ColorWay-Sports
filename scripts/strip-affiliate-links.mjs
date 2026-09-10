#!/usr/bin/env node
// Removes every affiliate block, button and disclaimer from content/posts.
// Decided 2026-09-10: the site runs on Mediavine display ads; the affiliate
// layer earned ~$50/mo and made the pages read as a shop. Idempotent.
//   node scripts/strip-affiliate-links.mjs --dry   # report only
//   node scripts/strip-affiliate-links.mjs         # write
import fs from "node:fs";
import path from "node:path";
const DRY = process.argv.includes("--dry");
const DIR = "content/posts";
const AFF = /fanatics\.93n6tx\.net|sportsmemorabilia\.evyy\.net|fubo\.tv\/welcome|tag=colorwaysport-20/;
const RULES = [
  // A. wrapped shop cards (Fanatics jersey cards, SportsMemorabilia cards): wrapper div .. disclaimer p .. close
  ["shop-card", /\n?<div style="margin: 2em 0; font-family: Inter[^>]*>\n<div style="background: #f5f7fa;[\s\S]*?<\/a>\n<\/div>\n<p style="font-size: 12px; color: #9aa0ac; margin: 8px 2px 0;">ColorWay Sports may earn a commission[^<]*<\/p>\n<\/div>\n?/g],
  // B. unwrapped cards (Fubo in the tracker, any card whose wrapper is the f5f7fa div itself)
  ["bare-card", /\n?<div style="background: #f5f7fa; border: 1px solid #e3e6ec;[^>]*>\n<div style="width: 44px;[\s\S]*?<\/a>\n<\/div>\n<p style="font-size: 12px; color: #9aa0ac; margin: 8px 2px 0;">ColorWay Sports may earn a commission[^<]*<\/p>\n?/g],
  // E. "Our No. 1 this season" boxes and similar single-CTA boxes
  ["cta-box", /\n?<div style="[^"]*border-left: 4px solid #2f6bed;[^"]*">[\s\S]*?<a href="https:\/\/(?:fanatics\.93n6tx\.net|sportsmemorabilia\.evyy\.net)[^>]*>[^<]*<\/a>\n<\/div>\n?/g],
  // C/D. any remaining affiliate anchor (inline CTA lines, tracker pills, WC card buttons)
  ["anchor", /[ \t]*<a href="https:\/\/(?:fanatics\.93n6tx\.net|sportsmemorabilia\.evyy\.net|www\.fubo\.tv\/welcome)[^"]*"[^>]*>[^<]*<\/a>[ \t]*\n?/g],
  // F. Amazon markdown links: drop the Amazon option, keep the brand link
  ["amazon-or", /on \[Amazon\]\(https:\/\/www\.amazon\.com[^)]*colorwaysport-20[^)]*\) or (?:at )?/g],
  ["amazon-pipe-after", / \| \[Amazon\]\(https:\/\/www\.amazon\.com[^)]*colorwaysport-20[^)]*\)/g],
  ["amazon-pipe-before", /\[Amazon\]\(https:\/\/www\.amazon\.com[^)]*colorwaysport-20[^)]*\) \| /g],
  ["amazon-bare", /\[Amazon\]\(https:\/\/www\.amazon\.com[^)]*colorwaysport-20[^)]*\)/g],
  // C2. block-style CTA anchors with nested markup (World Series logo post) and any Amazon anchor
  ["anchor-block", /\n?[ \t]*<a href="https:\/\/(?:fanatics\.93n6tx\.net|sportsmemorabilia\.evyy\.net|www\.fubo\.tv\/welcome|www\.amazon\.com[^"]*colorwaysport-20)[^"]*"[^>]*>[\s\S]*?<\/a>[ \t]*\n?/g],
  // H. markdown links: a line that is only a shop link goes; an inline one keeps its text
  ["md-shop-line", /^[ \t]*\[[^\]]*\]\(https:\/\/(?:fanatics\.93n6tx\.net|sportsmemorabilia\.evyy\.net|www\.amazon\.com[^)]*colorwaysport-20)[^)]*\)[ \t]*\n/gm],
  ["md-inline", /\[([^\]]+)\]\(https:\/\/(?:fanatics\.93n6tx\.net|sportsmemorabilia\.evyy\.net|www\.amazon\.com[^)]*colorwaysport-20)[^)]*\)/g],
  // I. wrappers left empty by the removals
  ["empty-div", /\n?<div style="[^"]*">\s*<\/div>\n?/g],
  // G. stray disclaimers
  ["disclaimer", /\n?<p style="[^"]*">ColorWay Sports may earn a commission[^<]*<\/p>\n?/g],
];
let totalFiles = 0; const totals = {};
for (const f of fs.readdirSync(DIR).filter((x) => x.endsWith(".md"))) {
  const p = path.join(DIR, f); const before = fs.readFileSync(p, "utf8");
  if (!AFF.test(before) && !/may earn a commission/.test(before)) continue;
  let s = before; const hits = {};
  for (const [name, re] of RULES) { const n = (s.match(re) || []).length; if (n) { hits[name] = n; totals[name] = (totals[name] || 0) + n; s = s.replace(re, name === "amazon-bare" ? "Amazon" : name === "md-inline" ? "$1" : ""); } }
  s = s.replace(/\n{4,}/g, "\n\n\n");
  const left = (s.match(AFF) || []).length + (s.match(/rel="sponsored/g) || []).length;
  if (s !== before) { totalFiles++; if (!DRY) fs.writeFileSync(p, s); }
  if (left) console.log(`  LEFTOVER in ${f}: ${left}`);
  if (DRY && Object.keys(hits).length) console.log(`  ${f}: ${JSON.stringify(hits)}`);
}
console.log(`\n${DRY ? "[dry] would change" : "changed"} ${totalFiles} files`, totals);
