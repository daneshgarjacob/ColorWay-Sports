#!/usr/bin/env node
// Checks every known source of per-game NBA jersey calls against
// scripts/data/nba-announced-uniforms-2026-27.json and reports what changed.
// Read-only: it never edits the data file. Run weekly (and before tip-off week).
//
//   node scripts/nba-jersey-feeds-check.mjs
//
// Sources:
//  - Nets: brooklynse.net master-foo.json, field `jersey`, feeds nba.com/nets/schedule
//    (master.json is an older copy with every road game "icon"; ignore it).
//  - Bucks: data.bucks.digital GraphQL, games[].jersey.name, feeds nba.com/bucks/schedule.
//  - League: content-api-prod.nba.com team schedules, home/visitor.uniform.name.
//    Empty for all 30 clubs on 2026-09-28; ~20 team pages render it the day it fills.

import fs from "node:fs";

const DATA = JSON.parse(fs.readFileSync("scripts/data/nba-announced-uniforms-2026-27.json", "utf8"));
const LABEL = {
  icon: "Icon Edition", association: "Association White", statement: "Statement Edition",
  city: "City Edition", classic: "Classic Edition",
};
const label = (s) => LABEL[String(s).toLowerCase()] || s;
const etDate = (utc) =>
  new Date(utc.replace(" ", "T") + "Z").toLocaleDateString("en-CA", { timeZone: "America/New_York" });

function diff(tri, fresh) {
  const have = DATA[tri]?.games || {};
  const changes = [];
  for (const [d, call] of Object.entries(fresh)) {
    if (have[d] !== call) changes.push(`  ${d}: ${have[d] || "(none)"} -> ${call}`);
  }
  for (const d of Object.keys(have)) if (!(d in fresh)) changes.push(`  ${d}: ${have[d]} -> (gone from feed)`);
  console.log(`${tri}: ${Object.keys(fresh).length} tagged in feed, ${changes.length ? changes.length + " changed" : "no changes"}`);
  changes.forEach((c) => console.log(c));
}

async function nets() {
  const r = await fetch("https://brooklynse.net/bkn/schedule/2026/data/master-foo.json");
  const { games } = await r.json();
  const out = {};
  for (const g of games) if (g.gdte >= "2026-10-20" && !g.GM.startsWith("PR") && g.jersey) out[g.gdte] = label(g.jersey);
  diff("BKN", out);
}

async function bucks() {
  const r = await fetch("https://data.bucks.digital/graphql", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query: "{teamsByLeagueId(league_tids:[1610612749]){games{datetime league_gid jersey{name}}}}" }),
  });
  const games = (await r.json()).data.teamsByLeagueId[0].games;
  const out = {};
  for (const g of games) if (g.league_gid.startsWith("002") && g.jersey?.name) out[etDate(g.datetime)] = label(g.jersey.name);
  diff("MIL", out);
}

async function league() {
  const filled = [];
  for (let id = 1610612737; id <= 1610612766; id++) {
    try {
      const r = await fetch(`https://content-api-prod.nba.com/public/1/leagues/nba/teams/${id}/schedule?season=2026-27`);
      const games = (await r.json()).results.schedule.filter((g) => g.type === "game" && g.gid.startsWith("002"));
      let n = 0, ta = "";
      for (const g of games) {
        const side = g.home.tid === id ? g.home : g.visitor;
        ta = side.ta;
        if (side.uniform?.name) n++;
      }
      if (n) filled.push(`${ta} ${n}`);
    } catch (e) {
      console.log(`league feed ${id}: err ${e.message}`);
    }
  }
  console.log(`League feed: ${filled.length ? "FILLED for " + filled.join(", ") : "still empty for all 30 clubs"}`);
}

await nets().catch((e) => console.log("BKN err", e.message));
await bucks().catch((e) => console.log("MIL err", e.message));
await league();
