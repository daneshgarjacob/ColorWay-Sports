#!/usr/bin/env node
// Rewrites lib/nbaTileFiles.json from public/images/posts/nba-daily-tracker/*.jpg.
// Run after adding or renaming an NBA jersey tile (lib/nbaTiles.ts reads the list).
import fs from "node:fs";

const files = fs.readdirSync("public/images/posts/nba-daily-tracker").filter((f) => f.endsWith(".jpg")).sort();
fs.writeFileSync("lib/nbaTileFiles.json", JSON.stringify(files, null, 0) + "\n");
console.log(`${files.length} tiles -> lib/nbaTileFiles.json`);
