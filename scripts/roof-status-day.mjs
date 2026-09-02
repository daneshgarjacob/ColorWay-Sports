#!/usr/bin/env node
// Rewrites the dated "Today's Roof Status" block on all 7 MLB retractable-roof
// posts. Standing daily task.
//   node scripts/roof-status-day.mjs YYYY-MM-DD
//
// Schedule and first-pitch times come from statsapi, the forecast from open-meteo
// at the venue's local first-pitch hour. The OPEN/CLOSED call is a judgement made
// from that forecast plus each club's documented roof tendency, and the block says
// "Expected" for exactly that reason: the ballpark makes the real call about
// ninety minutes out, and the block always links the account that confirms it.

import fs from "node:fs";

const date = process.argv[2];
if (!date) { console.error("usage: roof-status-day.mjs YYYY-MM-DD"); process.exit(1); }

const TEAMS = {
  "Arizona Diamondbacks": { slug: "chase-field-retractable-roof-diamondbacks", venue: "Chase Field", accent: "#A71930", tz: "America/Phoenix", lat: 33.45, lon: -112.07, handle: "ChaseFieldRoof", short: "Diamondbacks" },
  "Houston Astros":       { slug: "daikin-park-roof-open-astros-2026",         venue: "Daikin Park", accent: "#002D62", tz: "America/Chicago", lat: 29.76, lon: -95.36, handle: "astros", short: "Astros" },
  "Texas Rangers":        { slug: "rangers-roof-open-globe-life-field-2026",   venue: "Globe Life Field", accent: "#003278", tz: "America/Chicago", lat: 32.75, lon: -97.08, handle: "GLFroof", short: "Rangers" },
  "Seattle Mariners":     { slug: "tmobile-park-roof-open-mariners-2026",      venue: "T-Mobile Park", accent: "#0C2C56", tz: "America/Los_Angeles", lat: 47.59, lon: -122.33, handle: "Mariners", short: "Mariners" },
  "Milwaukee Brewers":    { slug: "american-family-field-roof-open-brewers-2026", venue: "American Family Field", accent: "#12284B", tz: "America/Chicago", lat: 43.03, lon: -87.97, handle: "Brewers", short: "Brewers" },
  "Toronto Blue Jays":    { slug: "rogers-centre-roof-open-blue-jays-2026",    venue: "Rogers Centre", accent: "#134A8E", tz: "America/Toronto", lat: 43.64, lon: -79.39, handle: "BlueJays", short: "Blue Jays" },
  "Miami Marlins":        { slug: "loandepot-park-roof-open-marlins-2026",     venue: "loanDepot Park", accent: "#00A3E0", tz: "America/New_York", lat: 25.78, lon: -80.22, handle: "Marlins", short: "Marlins" },
};

const GREEN = "#1a7f37", RED = "#C0111F", GRAY = "#5a6472";

const sched = await (await fetch(
  `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${date}`
)).json();

const homeToday = new Map();
for (const d of sched.dates ?? []) {
  for (const g of d.games) {
    const h = g.teams.home.team.name, a = g.teams.away.team.name;
    if (TEAMS[h]) homeToday.set(h, { away: a, gameDate: g.gameDate });
    if (TEAMS[a]) homeToday.set(a + "::away", { at: h });
  }
}

const fmtLocal = (iso, tz) =>
  new Date(iso).toLocaleTimeString("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit" });
const zoneAbbr = (iso, tz) =>
  new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "short" })
    .formatToParts(new Date(iso)).find((p) => p.type === "timeZoneName").value;
const localHour = (iso, tz) =>
  Number(new Date(iso).toLocaleString("en-US", { timeZone: tz, hour: "2-digit", hour12: false }));

const longDate = new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", {
  timeZone: "UTC", weekday: "long", month: "long", day: "numeric", year: "numeric",
});

async function forecast(t, iso) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${t.lat}&longitude=${t.lon}` +
    `&hourly=temperature_2m,precipitation_probability,relative_humidity_2m` +
    `&temperature_unit=fahrenheit&timezone=${encodeURIComponent(t.tz)}&start_date=${date}&end_date=${date}`;
  const h = (await (await fetch(url)).json()).hourly;
  const want = localHour(iso, t.tz);
  let idx = 0, best = 99;
  h.time.forEach((s, i) => { const d = Math.abs(Number(s.slice(11, 13)) - want); if (d < best) { best = d; idx = i; } });
  return { temp: Math.round(h.temperature_2m[idx]), rain: h.precipitation_probability[idx], hum: h.relative_humidity_2m[idx] };
}

// Each club's documented tendency, applied to the forecast.
function decide(team, f) {
  switch (team) {
    case "Arizona Diamondbacks":
      return f.temp >= 95
        ? ["CLOSED", `<strong>${f.temp}&deg;F</strong> at first pitch. Chase Field shuts and pre-cools any time Phoenix runs this hot, which in late August is essentially every night.`]
        : ["OPEN", `<strong>${f.temp}&deg;F</strong> and dry. Mild enough that Arizona opens it up.`];
    case "Houston Astros":
      return f.temp >= 85 || f.rain >= 30 || f.hum >= 60
        ? ["CLOSED", `<strong>${f.temp}&deg;F</strong> with ${f.hum}% humidity. Daikin Park stays shut through the Houston summer.`]
        : ["OPEN", `<strong>${f.temp}&deg;F</strong> and dry, which is the rare Houston night the roof opens.`];
    case "Texas Rangers":
      return f.temp >= 85 || f.rain >= 25
        ? ["CLOSED", `<strong>${f.temp}&deg;F</strong> at first pitch. Globe Life closes for heat, and Arlington in August is heat.`]
        : ["OPEN", `<strong>${f.temp}&deg;F</strong> and dry, inside the narrow window Texas actually opens for.`];
    case "Seattle Mariners":
      return f.rain >= 30
        ? ["CLOSED", `${f.rain}% chance of rain at first pitch. T-Mobile Park is an umbrella, and rain is the only thing that closes it.`]
        : ["OPEN", `<strong>${f.temp}&deg;F</strong> and dry. T-Mobile Park is an umbrella, not a dome, and the call is made on rain alone.`];
    case "Milwaukee Brewers":
      return f.rain >= 30 || f.temp <= 60
        ? ["CLOSED", `<strong>${f.temp}&deg;F</strong> with a ${f.rain}% chance of rain. The fan-blade roof closes for exactly this.`]
        : ["OPEN", `<strong>${f.temp}&deg;F</strong> and dry. Milwaukee moves this roof more than any club in baseball and a night like this is why.`];
    case "Toronto Blue Jays":
      return f.rain >= 25 || f.temp <= 64
        ? ["CLOSED", `<strong>${f.temp}&deg;F</strong> with a ${f.rain}% chance of rain. Rogers Centre closes for cold and for rain, and it closes often.`]
        : ["OPEN", `<strong>${f.temp}&deg;F</strong> and dry at first pitch, which is the kind of evening Toronto opens for.`];
    case "Miami Marlins":
      return f.rain >= 20 || f.hum >= 65
        ? ["CLOSED", `<strong>${f.temp}&deg;F</strong> with ${f.hum}% humidity and a ${f.rain}% chance of rain. loanDepot Park is closed by default and this is a default night.`]
        : ["OPEN", `<strong>${f.temp}&deg;F</strong> and unusually dry for Miami, one of the few nights loanDepot Park opens.`];
    default:
      return ["CLOSED", ""];
  }
}

function block(t, { status, color, sub, line, reason }) {
  return `<div style="margin: 1.75em 0; border: 2px solid ${t.accent}; border-radius: 16px; overflow: hidden;">
  <div style="background: ${t.accent}; padding: 9px 16px; display: flex; justify-content: space-between; align-items: center;">
    <span style="font-size: 0.7em; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #ffffff;">Today's Roof Status</span>
    <span style="font-size: 0.7em; font-weight: 700; color: rgba(255,255,255,0.85);">${longDate}</span>
  </div>
  <div style="padding: 1.5em; text-align: center; background: #ffffff;">
    <div style="font-size: 2.6em; font-weight: 900; color: ${color}; line-height: 1;">${status}</div>
    <div style="font-size: 0.8em; color: #777; margin-top: 5px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">${sub}</div>
    <div style="margin-top: 14px; font-size: 1em; color: #1c1c1c; font-weight: 600;">${line}</div>
    <div style="margin-top: 6px; font-size: 0.95em; color: #444; line-height: 1.5;">${reason}</div>
    <a href="https://x.com/${t.handle}" style="display: inline-block; margin-top: 16px; padding: 10px 22px; background: ${t.accent}; color: #ffffff; border-radius: 999px; font-weight: 800; font-size: 0.85em; text-decoration: none; letter-spacing: 0.5px;">Confirm live on @${t.handle} &rarr;</a>
  </div>
</div>`;
}

for (const [team, t] of Object.entries(TEAMS)) {
  const path = `content/posts/${t.slug}.md`;
  let s = fs.readFileSync(path, "utf8");
  const home = homeToday.get(team);
  let fields;

  if (home) {
    const f = await forecast(t, home.gameDate);
    const [status, reason] = decide(team, f);
    fields = {
      status,
      color: status === "OPEN" ? GREEN : RED,
      sub: "Expected &middot; final call about 90 minutes before first pitch",
      line: `${home.away.split(" ").pop()} at ${t.short} &middot; ${fmtLocal(home.gameDate, t.tz)} ${zoneAbbr(home.gameDate, t.tz)}`,
      reason,
    };
    console.log(`  ${t.short.padEnd(14)} ${status.padEnd(6)} ${f.temp}F rain ${f.rain}% hum ${f.hum}%`);
  } else {
    const away = homeToday.get(team + "::away");
    const oppCity = away ? away.at.split(" ").slice(0, -1).join(" ") : null;
    fields = {
      status: "NO HOME GAME",
      color: GRAY,
      sub: `Check back on the next ${t.short} home date`,
      line: oppCity ? `The ${t.short} are in ${oppCity}.` : `The ${t.short} are not at home today.`,
      reason: `No game at ${t.venue} today. The roof question returns with the next homestand.`,
    };
    console.log(`  ${t.short.padEnd(14)} NO HOME GAME`);
  }

  const re = /<div style="margin: 1\.75em 0; border: 2px solid #[0-9A-Fa-f]{6}; border-radius: 16px; overflow: hidden;">[\s\S]*?\n<\/div>/;
  if (!re.test(s)) { console.warn(`  !! no roof block found in ${t.slug}`); continue; }
  s = s.replace(re, block(t, fields));
  s = s.replace(/^updatedDate: ["'][\d-]+["']$/m, `updatedDate: '${date}'`);
  fs.writeFileSync(path, s);
}
console.log(`\n7 roof posts updated for ${longDate}`);
