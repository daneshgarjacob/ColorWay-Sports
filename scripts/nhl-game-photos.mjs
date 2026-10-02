#!/usr/bin/env node
// Daily NHL sweater check: downloads ESPN's game photos and highlight frames for every
// final NHL game on a date, so we can SEE what both teams wore before logging it in
// scripts/data/nhl-game-log-2026-27.json. Viewing only: these are real game photos and
// never go into public/ (we don't host game photography).
//
//   node scripts/nhl-game-photos.mjs 20261002 [outDir]
//
// Default outDir: /tmp/nhl-game-photos/<date>. Prints the log key for each game
// ("2026-10-02 NYR@DET") so you can paste it straight into the data file.

import fs from "node:fs";

const date = process.argv[2];
if (!/^\d{8}$/.test(date ?? "")) { console.error("usage: node scripts/nhl-game-photos.mjs YYYYMMDD [outDir]"); process.exit(1); }
const out = process.argv[3] ?? `/tmp/nhl-game-photos/${date}`;
fs.mkdirSync(out, { recursive: true });

// ESPN uses a few short codes that differ from the NHL's tricodes
const TRI = { LA: "LAK", NJ: "NJD", SJ: "SJS", TB: "TBL", UTAH: "UTA", WSH: "WSH" };
const tri = (a) => TRI[a] ?? a;
const iso = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6)}`;

const sb = await fetch(`https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard?dates=${date}`).then(r => r.json());
for (const e of sb.events ?? []) {
  const comp = e.competitions[0];
  const away = tri(comp.competitors.find(c => c.homeAway === "away").team.abbreviation);
  const home = tri(comp.competitors.find(c => c.homeAway === "home").team.abbreviation);
  const key = `${iso} ${away}@${home}`;
  if (e.status.type.name !== "STATUS_FINAL") { console.log(`… ${key}: not final (${e.status.type.description})`); continue; }
  const j = await fetch(`https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/summary?event=${e.id}`).then(r => r.json());
  const imgs = [
    ...(j.article?.images ?? []).map(i => [i.url, i.caption ?? ""]),
    ...(j.videos ?? []).slice(0, 8).map(v => [v.thumbnail, v.headline ?? ""]),
  ].filter(([u]) => u);
  console.log(`== ${key}  (${imgs.length} frames)`);
  let i = 0;
  for (const [url, cap] of imgs) {
    const fn = `${out}/${away}_at_${home}_${i++}.jpg`;
    try {
      fs.writeFileSync(fn, Buffer.from(await fetch(url).then(r => r.arrayBuffer())));
      console.log(`   ${fn}  ${cap.slice(0, 90)}`);
    } catch { console.log(`   failed: ${url}`); }
  }
}
