#!/usr/bin/env node
// Build the ONE approved affiliate link format (Jake, 2026-09-11): a single plain-text
// "Where to get it" line on event posts only (reveal days, championship gear, All-Star and
// special-event jerseys, national-team kits during tournaments). Never on schedule posts,
// never on trackers, never as a button, card or pill. Every link carries subId1=<post-slug>
// so Impact's "Performance by Sub ID" report can finally attribute sales to a page.
//
// usage: node scripts/affiliate-link.mjs <post-slug> "<fanatics search query or full fanatics.com URL>" ["link text"]
// example: node scripts/affiliate-link.mjs nba-city-edition-jerseys-2026-27 "lakers city edition jersey" "the Lakers City Edition jersey at Fanatics"
const [slug, target, text] = process.argv.slice(2);
if (!slug || !target) {
  console.error('usage: affiliate-link.mjs <post-slug> "<search query | fanatics.com url>" ["link text"]');
  process.exit(1);
}
const subId = slug.replace(/[^a-z0-9-]/gi, "").slice(0, 60);
const dest = /^https?:\/\//i.test(target)
  ? target
  : `https://www.fanatics.com/search?query=${encodeURIComponent(target)}`;
const href = `https://fanatics.93n6tx.net/5kZn3j?subId1=${subId}&u=${encodeURIComponent(dest)}`;
const label = text || `${target} at Fanatics`;
console.log(href);
console.log("");
console.log(`<p style="font-size: 0.92em; color: #3a4a68; margin: 1.2em 0 1.6em;">Where to get it: <a href="${href}" rel="sponsored noopener" target="_blank">${label}</a>. That is an affiliate link and we earn a small commission if you buy.</p>`);
