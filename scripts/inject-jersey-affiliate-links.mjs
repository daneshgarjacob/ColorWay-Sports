#!/usr/bin/env node
// Injects an Amazon Associates "Shop on Amazon" CTA button under every
// jersey card in a tracker markdown file. Idempotent — re-running on an
// already-injected file is a no-op.
//
// Usage: node scripts/inject-jersey-affiliate-links.mjs <path/to/tracker.md>

import { readFile, writeFile } from "fs/promises";
import { resolve } from "path";

const AMAZON_TAG = "colorwaysport-20";

const BUTTON_MARKER = "amazon-jersey-cta"; // Used for idempotency check
const BUTTON_TEMPLATE = (query) =>
  `<a href="https://www.amazon.com/s?k=${encodeURIComponent(query)}&tag=${AMAZON_TAG}" target="_blank" rel="sponsored noopener" data-${BUTTON_MARKER} style="margin-top: 12px; padding: 6px 14px; background: linear-gradient(135deg, #FF9900 0%, #FF6F00 100%); border-radius: 999px; color: #111; font-size: 10px; font-weight: 800; text-decoration: none; letter-spacing: 1.5px; text-transform: uppercase; display: inline-block; box-shadow: 0 2px 6px rgba(0,0,0,0.25);">Shop on Amazon</a>`;

// Pattern matches a jersey card column:
//   <img src="/images/jerseys/{league}/X.png" alt="..." style="height: 200px; ..." />
//   <p style="color: #fff; font-size: 14px; ...">TEAM NAME</p>
//   <p style="color: #fff; font-size: 9px; ...">EDITION · COLOR</p>
//
// We capture team name + edition line and inject the button immediately after.
const JERSEY_CARD_REGEX =
  /(<img[^>]+src="\/images\/jerseys\/[^"]+"[^>]*\/>\s*<p[^>]*font-size:\s*14px[^>]*>([A-Z][A-Z\s\.'-]+)<\/p>\s*<p[^>]*font-size:\s*9px[^>]*>([^<]+)<\/p>)/g;

function buildQuery(teamName, editionLine) {
  // editionLine looks like "Association · White" or "Home · Blue" or "Classic · Throwback Blue"
  // Convert " · " to a space and prepend team name + append "jersey"
  const flat = editionLine.replace(/\s*·\s*/g, " ").trim();
  return `${teamName.toLowerCase()} ${flat.toLowerCase()} jersey`.replace(
    /\s+/g,
    " "
  );
}

async function injectAffiliateLinks(filePath) {
  const absPath = resolve(filePath);
  const src = await readFile(absPath, "utf8");

  if (src.includes(`data-${BUTTON_MARKER}`)) {
    console.log(`SKIP (already injected): ${filePath}`);
    return { injected: 0, file: filePath, skipped: true };
  }

  let count = 0;
  const out = src.replace(JERSEY_CARD_REGEX, (match, jerseyBlock, team, edition) => {
    count += 1;
    const teamClean = team.trim().replace(/\s+/g, " ");
    const editionClean = edition.trim();
    const query = buildQuery(teamClean, editionClean);
    const button = BUTTON_TEMPLATE(query);
    return `${jerseyBlock}\n      ${button}`;
  });

  if (count === 0) {
    console.log(`NO MATCHES: ${filePath}`);
    return { injected: 0, file: filePath, skipped: false };
  }

  await writeFile(absPath, out);
  console.log(`Injected ${count} affiliate buttons into ${filePath}`);
  return { injected: count, file: filePath, skipped: false };
}

const target = process.argv[2];
if (!target) {
  console.error("Usage: node scripts/inject-jersey-affiliate-links.mjs <path/to/tracker.md>");
  process.exit(1);
}

injectAffiliateLinks(target).catch((err) => {
  console.error(err);
  process.exit(1);
});
