import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const FANATICS_AFFILIATE = "https://fanatics.93n6tx.net/5kZn3j";
const AMAZON_ORANGE_GRADIENT =
  "background: linear-gradient(135deg, #FF9900 0%, #FF6F00 100%); border-radius: 999px; color: #111;";
const FANATICS_RED_GRADIENT =
  "background: linear-gradient(135deg, #C8102E 0%, #8B0000 100%); border-radius: 999px; color: #fff;";
const AMAZON_SHADOW = "box-shadow: 0 2px 6px rgba(0,0,0,0.25);";
const FANATICS_SHADOW = "box-shadow: 0 2px 6px rgba(200,16,46,0.35);";

const files = [
  "content/posts/nba-playoffs-2026-round-1-jersey-tracker.md",
  "content/posts/nba-playoffs-2026-round-2-jersey-tracker.md",
  "content/posts/nba-playoffs-2026-conference-finals-jersey-tracker.md",
  "content/posts/nhl-playoffs-2026-round-1-jersey-tracker.md",
  "content/posts/nhl-playoffs-2026-round-2-jersey-tracker.md",
];

const root = resolve(process.cwd());
let totalLinks = 0;

for (const relPath of files) {
  const fullPath = resolve(root, relPath);
  let content = readFileSync(fullPath, "utf8");
  let fileLinks = 0;

  // 1. Swap Amazon search URLs → Fanatics deep-linked affiliate URLs
  content = content.replace(
    /https:\/\/www\.amazon\.com\/s\?k=([^&"]+)&tag=colorwaysport-20/g,
    (_match, encodedQuery) => {
      fileLinks += 1;
      const fanaticsTargetUrl = `https://www.fanatics.com/search?query=${encodedQuery}`;
      return `${FANATICS_AFFILIATE}?u=${encodeURIComponent(fanaticsTargetUrl)}`;
    }
  );

  // 2. Rename data attribute for analytics
  content = content.replaceAll("data-amazon-jersey-cta", "data-fanatics-jersey-cta");

  // 3. Swap button color (orange → Fanatics red)
  content = content.replaceAll(AMAZON_ORANGE_GRADIENT, FANATICS_RED_GRADIENT);
  content = content.replaceAll(AMAZON_SHADOW, FANATICS_SHADOW);

  // 4. Swap button text
  content = content.replaceAll(">Shop on Amazon<", ">Shop on Fanatics<");

  writeFileSync(fullPath, content);
  totalLinks += fileLinks;
  console.log(`${relPath}: ${fileLinks} links swapped`);
}

console.log(`\nTotal: ${totalLinks} Amazon links replaced with Fanatics affiliate links`);
