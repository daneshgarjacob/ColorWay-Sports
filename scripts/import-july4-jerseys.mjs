#!/usr/bin/env node
// Import Jake's Desktop Fourth of July jersey product images into the post folder.
// Converts every format (avif/png/jpg) to web jpg, flattens onto white, caps at 760px.
// Names by team slug. Picks the star player when a team has two files.

import sharp from "sharp";
import { readdir, mkdir } from "fs/promises";
import { resolve } from "path";

const SRC = "/Users/jakedaneshgar/Desktop/4th-july-jerseys";
const OUT = resolve("public/images/posts/mlb-july-4th-jerseys-2026");
await mkdir(OUT, { recursive: true });

// team token found in the Fanatics filename -> output slug
const TEAMS = [
  ["yankees", "yankees"], ["orioles", "orioles"], ["cubs", "cubs"],
  ["phillies", "phillies"], ["mariners", "mariners"], ["diamondbacks", "diamondbacks"],
  ["dodgers", "dodgers"], ["reds", "reds"], ["rockies", "rockies"], ["brewers", "brewers"],
  ["nationals", "nationals"], ["red-sox", "red-sox"], ["cardinals", "cardinals"],
  ["twins", "twins"], ["astros", "astros"], ["guardians", "guardians"], ["mets", "mets"],
  ["giants", "giants"], ["rays", "rays"], ["marlins", "marlins"], ["padres", "padres"],
  ["athletics", "athletics"], ["pirates", "pirates"], ["braves", "braves"],
  ["tigers", "tigers"], ["angels", "angels"],
];

const files = await readdir(SRC);
const used = new Set();
async function conv(file, slug) {
  await sharp(resolve(SRC, file))
    .resize(760, 760, { fit: "inside" })
    .flatten({ background: "#ffffff" })
    .jpeg({ quality: 82 })
    .toFile(resolve(OUT, slug + ".jpg"));
  console.log("  ok", slug);
}

// Royals: keep the Bobby Witt Jr. home white, skip the second Royals file
const royals = files.find((f) => f.includes("kansas-city-royals") && f.includes("bobby-witt"));
if (royals) { used.add(royals); await conv(royals, "royals"); } else console.log("  MISSING royals");

for (const [tok, slug] of TEAMS) {
  const f = files.find((ff) => ff.includes(tok) && !used.has(ff));
  if (f) { used.add(f); await conv(f, slug); } else console.log("  MISSING", slug);
}
console.log(`Imported ${used.size} jerseys to ${OUT}`);
