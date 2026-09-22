// "NFL Week N in Color" — the LinkedIn week-starter graphic.
//
//   node scripts/gen-week-in-color.mjs --week 2 [--out <dir>] [--title "NFL WEEK 2"]
//
// Every game of the week as six colour bars (helmet / jersey / pants, away on the
// left, home on the right) plus the final score. No team logos and no team photos,
// which is the whole point: it is an original, repostable ColorWay graphic that
// says something only our data can say. See the LinkedIn rules in memory —
// in-house image, value in the post itself, link in the first comment.
//
// WHY THIS SCRIPT EXISTS: Week 1's version was built in a scratchpad and the
// generator was lost, so Week 2 would have been a from-scratch rebuild. It now
// lives in the repo and reruns in one command each Monday once the week's last
// game is logged.
//
// Data comes from content/posts/nfl-uniform-tracker-2026.md: each logged card
// already carries data-color="#RRGGBB" on its helmet/jersey/pants chips and a
// "Final &middot; Winner N, Loser N" pill. Day-of-week labels and a score
// cross-check come from ESPN's scoreboard for that week. Both sources must agree
// on the score or the script refuses to render, because a wrong score on a
// shareable graphic is worse than no graphic.
import sharp from "sharp";
import fs from "fs";
import path from "path";

const args = {};
for (let i = 2; i < process.argv.length; i += 2) args[process.argv[i].replace(/^--/, "")] = process.argv[i + 1];
const WEEK = Number(args.week);
if (!WEEK) { console.error("need --week N"); process.exit(1); }
const OUT = args.out || `${process.env.HOME}/Desktop/ColorWay Sports/brand-social-2026-09/linkedin-posts`;
const TITLE = args.title || `NFL WEEK ${WEEK}`;
const TRACKER = "content/posts/nfl-uniform-tracker-2026.md";
const LOGO = `${process.env.HOME}/Desktop/ColorWay Sports/brand-social-2026-09/profile-navy-disc-1024.png`;

// ---------- brand ----------
const BG = "#003087";        // brand navy, the page field
const PANEL = "#0b398c";     // card panel, one step up from the field
const RULE = "#2f6bed";      // brand blue, the 3px rule on every card
const SKY = "#9FB6D6";       // brand sky, every small label
const DIM = "#7f9ac6";       // secondary label
const W = 1200, H = 1500;
const FONT = "Hanken Grotesk";

// ---------- read the tracker ----------
const md = fs.readFileSync(TRACKER, "utf8");
// The week shows up in each card's grade line as "Week 2 &middot; <window>".
// The lookbehind keeps "Preseason Week 2" out of the regular-season graphic.
const weekRe = new RegExp(`(?<!Preseason )Week ${WEEK}\\s*(?=&middot;|<)`);
if (!weekRe.test(md)) { console.error(`no "Week ${WEEK}" card in the tracker`); process.exit(1); }
// A card block runs from its "### Away at Home" heading to the next heading.
const blocks = md.split(/\n### /).slice(1);
const games = [];
for (const b of blocks) {
  if (!weekRe.test(b)) continue;
  const head = b.split("\n")[0].trim();
  if (!head.includes(" at ")) continue;
  const [away, home] = head.split(" at ");
  const hexes = [...b.matchAll(/data-color="(#[0-9A-Fa-f]{6})"/g)].map((m) => m[1].toUpperCase());
  const score = b.match(/>Final &middot; ([^<]+)</);
  if (hexes.length !== 6) { console.error(`skip ${head}: ${hexes.length} colours, expected 6`); continue; }
  games.push({ away, home, hexes, score: score ? score[1] : null });
}
if (!games.length) { console.error("no logged games found for that week"); process.exit(1); }

// ---------- ESPN: day labels + an independent score check ----------
const espnRes = await fetch(
  `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=2026&seasontype=2&week=${WEEK}`,
);
const espn = await espnRes.json();
const byMatch = new Map();
for (const e of espn.events || []) {
  const c = e.competitions[0].competitors;
  const a = c.find((x) => x.homeAway === "away"), h = c.find((x) => x.homeAway === "home");
  // Pacific day: the graphic reads to a US audience and the site works in PT.
  const dt = new Date(new Date(e.date).getTime() - 7 * 3600 * 1000);
  byMatch.set(`${a.team.displayName}|${h.team.displayName}`, {
    day: ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][dt.getUTCDay()],
    order: new Date(e.date).getTime(),
    away: Number(a.score), home: Number(h.score),
    final: e.status?.type?.completed === true,
  });
}

const short = (n) => (n === "Washington Commanders" ? "Commanders" : n.split(" ").pop());
for (const g of games) {
  const m = byMatch.get(`${g.away}|${g.home}`);
  if (!m) { console.error(`no ESPN game for ${g.away} at ${g.home}`); process.exit(1); }
  g.day = m.day; g.order = m.order; g.final = m.final;
  g.awayScore = m.away; g.homeScore = m.home;
  if (g.score) {
    // The pill is "Winner N, Loser N". Confirm it against ESPN both ways round.
    // Only take digits that END a clause, or the "49" in "49ers" is read as a score.
    const nums = [...g.score.matchAll(/(\d+)\s*(?=,|$)/g)].map((m) => Number(m[1])).sort((x, y) => y - x);
    const espnNums = [m.away, m.home].sort((x, y) => y - x);
    if (nums[0] !== espnNums[0] || nums[1] !== espnNums[1]) {
      console.error(`SCORE MISMATCH ${g.away} at ${g.home}: tracker "${g.score}" vs ESPN ${m.away}-${m.home}`);
      process.exit(1);
    }
  }
}
games.sort((a, b) => a.order - b.order);
console.log(`${games.length} games, ${games.filter((g) => g.final).length} final`);

// ---------- layout, measured off the Week 1 graphic ----------
const COLS = 4;
const CARD_X = [64, 336, 607, 879], CARD_W = 257;
const ROW_Y = [371, 611, 851, 1091], CARD_H = 226;
const PAD = 16, CHIP_W = 105, CHIP_GAP = 15, CHIP_H = 32, CHIP_PITCH = 37, CHIP_TOP = 44;

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const t = (x, y, s, { size = 14, weight = 700, fill = "#fff", anchor = "start", ls = 0 } = {}) =>
  `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}"${ls ? ` letter-spacing="${ls}"` : ""}>${esc(s)}</text>`;

let cards = "";
games.forEach((g, i) => {
  if (i >= COLS * ROW_Y.length) return;
  const x = CARD_X[i % COLS], y = ROW_Y[Math.floor(i / COLS)];
  const lx = x + PAD, rx = x + PAD + CHIP_W + CHIP_GAP, rEdge = x + CARD_W - PAD;
  cards += `<rect x="${x}" y="${y}" width="${CARD_W}" height="${CARD_H}" fill="${PANEL}"/>`;
  cards += `<rect x="${x}" y="${y}" width="${CARD_W}" height="3" fill="${RULE}"/>`;
  cards += t(lx, y + 28, g.day, { size: 11, weight: 800, fill: DIM, ls: 1.6 });
  cards += t(rEdge, y + 28, g.final ? "FINAL" : "LIVE", { size: 11, weight: 800, fill: DIM, anchor: "end", ls: 1.6 });
  for (let r = 0; r < 3; r++) {
    const cy = y + CHIP_TOP + r * CHIP_PITCH;
    for (const [cx, hex] of [[lx, g.hexes[r]], [rx, g.hexes[3 + r]]]) {
      // White and near-white bars need an outline or they melt into nothing.
      const light = parseInt(hex.slice(1), 16) > 0xe0e0e0;
      cards += `<rect x="${cx}" y="${cy}" width="${CHIP_W}" height="${CHIP_H}" rx="3" fill="${hex}"${light ? ` stroke="#d7e0f0" stroke-width="1"` : ""}/>`;
    }
  }
  cards += t(lx, y + 175, short(g.away), { size: 16, weight: 700, fill: SKY });
  cards += t(rEdge, y + 175, short(g.home), { size: 16, weight: 800, fill: "#fff", anchor: "end" });
  if (g.final) {
    const win = g.awayScore > g.homeScore;
    cards += t(lx, y + 208, g.awayScore, { size: 30, weight: 800, fill: win ? "#fff" : DIM });
    cards += t(rEdge, y + 208, g.homeScore, { size: 30, weight: 800, fill: win ? DIM : "#fff", anchor: "end" });
  }
});

// legend, top right
let legend = "";
["HELMET", "JERSEY", "PANTS"].forEach((label, i) => {
  const y = 82 + i * 24;
  legend += t(1097, y + 4, label, { size: 11, weight: 800, fill: SKY, anchor: "end", ls: 1.6 });
  legend += `<rect x="1107" y="${y - 5}" width="30" height="9" rx="2" fill="#7f9ac6"/>`;
});
legend += t(1137, 162, "AWAY  /  HOME", { size: 11, weight: 800, fill: DIM, anchor: "end", ls: 1.6 });

const [l1, l2] = TITLE.includes(" IN ") ? TITLE.split(" IN ") : [TITLE, "IN COLOR"];
const played = games.filter((g) => g.final).length;
const teams = new Set(games.flatMap((g) => [g.away, g.home])).size;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" fill="${BG}"/>
<rect x="64" y="80" width="43" height="4" fill="${RULE}"/>
${t(120, 89, "COLORWAY SPORTS UNIFORM TRACKER", { size: 14, weight: 800, ls: 3.4 })}
${t(64, 186, l1, { size: 92, weight: 800 })}
${t(64, 274, l2 === "IN COLOR" ? l2 : `IN ${l2}`, { size: 92, weight: 800 })}
${t(64, 325, `What all ${teams} teams wore, helmet to pants`, { size: 26, weight: 600, fill: SKY })}
${legend}
${cards}
<rect x="64" y="1356" width="1072" height="1.5" fill="#2a5aa8"/>
${t(152, 1414, "ColorWay Sports", { size: 40, weight: 800 })}
${t(152, 1437, "EVERY JERSEY. EVERY LOGO. EVERY DETAIL.", { size: 12, weight: 700, fill: SKY, ls: 2.2 })}
${t(1136, 1404, "EVERY GAME LOGGED", { size: 12, weight: 800, fill: DIM, anchor: "end", ls: 2.2 })}
${t(1136, 1437, "colorwaysports.com", { size: 24, weight: 800, anchor: "end" })}
</svg>`;

fs.mkdirSync(OUT, { recursive: true });
const slug = TITLE.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-in-color";
for (const scale of [1, 2]) {
  const logo = await sharp(LOGO).resize(Math.round(65 * scale), Math.round(65 * scale)).toBuffer();
  const buf = await sharp(Buffer.from(svg), { density: 72 * scale })
    .composite([{ input: logo, left: Math.round(64 * scale), top: Math.round(1384 * scale) }])
    .png().toBuffer();
  const file = path.join(OUT, `${slug}-${W * scale}x${H * scale}.png`);
  fs.writeFileSync(file, buf);
  console.log(`wrote ${file} (${(buf.length / 1024).toFixed(0)} KB)`);
}
