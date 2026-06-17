#!/usr/bin/env node
// Import Jake's Desktop Fourth of July hat product images into the post folder.
// Converts every format to web jpg, flattens onto white, caps at 640px. Names by team slug.
// Logs the crown color (navy/red) parsed from the filename so we can group the grid.

import sharp from "sharp";
import { readdir, mkdir } from "fs/promises";
import { resolve } from "path";

const SRC = "/Users/jakedaneshgar/Desktop/4th-july-hats";
const OUT = resolve("public/images/posts/mlb-july-4th-hats-2026");
await mkdir(OUT, { recursive: true });

const TEAMS = [
  ["yankees", "yankees"], ["orioles", "orioles"], ["cubs", "cubs"], ["royals", "royals"],
  ["phillies", "phillies"], ["mariners", "mariners"], ["diamondbacks", "diamondbacks"],
  ["dodgers", "dodgers"], ["reds", "reds"], ["rockies", "rockies"], ["brewers", "brewers"],
  ["nationals", "nationals"], ["red-sox", "red-sox"], ["cardinals", "cardinals"],
  ["twins", "twins"], ["astros", "astros"], ["guardians", "guardians"], ["mets", "mets"],
  ["giants", "giants"], ["rays", "rays"], ["marlins", "marlins"], ["padres", "padres"],
  ["athletics", "athletics"], ["pirates", "pirates"], ["braves", "braves"],
  ["tigers", "tigers"], ["angels", "angels"], ["blue-jays", "blue-jays"],
  ["white-sox", "white-sox"], ["rangers", "rangers"],
];

const files = await readdir(SRC);
const used = new Set();
const colorByTeam = {};
async function conv(file, slug) {
  const color = file.startsWith("navy") ? "navy" : file.startsWith("red") ? "red" : "?";
  colorByTeam[slug] = color;
  await sharp(resolve(SRC, file))
    .resize(640, 640, { fit: "inside" })
    .flatten({ background: "#ffffff" })
    .jpeg({ quality: 84 })
    .toFile(resolve(OUT, slug + ".jpg"));
  console.log(`  ${color.padEnd(4)} ${slug}`);
}

for (const [tok, slug] of TEAMS) {
  const f = files.find((ff) => ff.includes(tok) && !used.has(ff));
  if (f) { used.add(f); await conv(f, slug); } else console.log("  MISSING", slug);
}
console.log(`\nImported ${used.size} hats.`);
const navy = Object.entries(colorByTeam).filter(([, c]) => c === "navy").map(([t]) => t);
const red = Object.entries(colorByTeam).filter(([, c]) => c === "red").map(([t]) => t);
console.log(`NAVY (${navy.length}): ${navy.join(", ")}`);
console.log(`RED  (${red.length}): ${red.join(", ")}`);
