#!/usr/bin/env node
// Refresh public/ads.txt from Mediavine's hosted file for this site.
//   node scripts/refresh-ads-txt.mjs
//
// Mediavine versions their ads.txt (see the "v<date>" on line 1) and adds demand
// partners over time. A stale ads.txt costs revenue silently: an unlisted partner
// simply cannot bid, and nothing anywhere reports an error. Re-run this whenever
// Mediavine's dashboard health check flags ads.txt, and any time we touch monetization.
//
// A 301 from /ads.txt to their server would be self-updating and is what Mediavine's
// WordPress plugin does, but it does NOT work here — see the comment in next.config.ts.

import fs from "node:fs";

const SITE_ID = "248fd8c4-77fb-4142-acb9-6610f6e7c3ea";
const SRC = `https://adstxt.mediavine.com/sites/${SITE_ID}/ads.txt`;
const DEST = "public/ads.txt";

const res = await fetch(SRC);
if (!res.ok) {
  console.error(`FAILED: ${SRC} returned ${res.status}. Leaving ${DEST} untouched.`);
  process.exit(1);
}
const next = await res.text();

// Guard against writing a truncated or wrong-site file over a good one.
if (!next.includes("ownerdomain=colorwaysports.com")) {
  console.error("FAILED: fetched file is not for colorwaysports.com. Not writing.");
  process.exit(1);
}
const count = (t) => t.split("\n").filter((l) => /^[^#\s].*,/.test(l)).length;
if (count(next) < 50) {
  console.error(`FAILED: only ${count(next)} records, expected 100+. Not writing.`);
  process.exit(1);
}

const prev = fs.existsSync(DEST) ? fs.readFileSync(DEST, "utf8") : "";
if (prev === next) {
  console.log(`No change. ${count(next)} records, ${next.split("\n")[0]}`);
} else {
  fs.writeFileSync(DEST, next);
  console.log(`Updated: ${count(prev)} -> ${count(next)} records, ${next.split("\n")[0]}`);
}
