// The World Cup kit-ranking posts are our highest purchase-intent pages and
// carried zero affiliate links. This adds a per-country "Shop on Fanatics" CTA
// at the end of each country's section, matching the CTA already used on the
// World Cup jersey tracker.
//
// Idempotent: skips any section that already has a Fanatics link.
// Usage: node scripts/add-wc-ranking-ctas.mjs [--dry]
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DRY = process.argv.includes("--dry");

const POSTS = [
  "every-2026-world-cup-jersey-ranked",
  "every-2026-world-cup-home-jersey-ranked",
  "every-2026-world-cup-away-jersey-ranked",
  "ranking-every-adidas-2026-world-cup-home-kit",
  "ranking-every-adidas-2026-world-cup-away-kit",
  "ranking-every-nike-world-cup-kit-2026",
  "ranking-every-puma-2026-world-cup-kit",
];

// "## 52. Qatar (Adidas): D-" | "## 23. Qatar 2026 World Cup Home Kit: D+" | "## 1. France"
// The leading "N." is what marks a country section, so the grade and the
// brand/kit suffixes are all optional. Unnumbered headings never match.
const HEADING = /^## \d+\.\s+(.+?)\s*(?:\((?:Adidas|Nike|Puma|New Balance|Umbro|Hummel|Kappa|Macron|Joma|Castore|Marathon|Erreà|Errea)[^)]*\))?\s*(?:2026 World Cup (?:Home|Away|Third)? ?Kit)?\s*(?::\s*[A-F][+-]?)?\s*$/i;

const deepLink = (country) =>
  `https://fanatics.93n6tx.net/5kZn3j?u=${encodeURIComponent(
    `https://www.fanatics.com/search?query=${country} national team jersey`
  ).replace(/%20/g, "%2520")}`;

const cta = (country) =>
  `<div style="display: flex; justify-content: center; margin: 0 0 1.6em;">
<a href="${deepLink(country)}" target="_blank" rel="sponsored noopener" data-fanatics-jersey-cta style="padding: 8px 18px; background: linear-gradient(135deg, #C8102E 0%, #8B0000 100%); border-radius: 999px; color: #fff; font-size: 11px; font-weight: 800; text-decoration: none; letter-spacing: 1.5px; text-transform: uppercase; display: inline-block; box-shadow: 0 2px 6px rgba(200,16,46,0.35);">Shop ${country} Jerseys</a>
</div>`;

let totalAdded = 0;

for (const slug of POSTS) {
  const path = resolve(root, "content/posts", `${slug}.md`);
  let md;
  try {
    md = readFileSync(path, "utf8");
  } catch {
    console.log(`  MISSING  ${slug}.md`);
    continue;
  }

  const lines = md.split("\n");
  const out = [];
  let current = null; // country name of the section we are inside
  let sectionHasCta = false;
  let added = 0;

  const flush = () => {
    if (current && !sectionHasCta) {
      // trim trailing blanks, append CTA, restore one blank line
      while (out.length && out[out.length - 1].trim() === "") out.pop();
      out.push("", cta(current), "");
      added++;
    }
    current = null;
    sectionHasCta = false;
  };

  for (const line of lines) {
    if (line.startsWith("## ")) {
      flush();
      const m = line.match(HEADING);
      if (m) {
        current = m[1].trim();
        sectionHasCta = false;
      }
      out.push(line);
      continue;
    }
    if (line.includes("fanatics.93n6tx.net")) sectionHasCta = true;
    out.push(line);
  }
  flush();

  if (!DRY && added) writeFileSync(path, out.join("\n"));
  totalAdded += added;
  console.log(`  ${DRY ? "would add" : "added   "} ${String(added).padStart(3)} CTAs  ${slug}`);
}

console.log(`\n${DRY ? "[dry run] " : ""}total CTAs: ${totalAdded}`);
