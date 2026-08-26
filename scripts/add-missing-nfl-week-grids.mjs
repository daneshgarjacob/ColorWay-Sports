// One-time backfill: give the 49ers, Buccaneers and Colts schedule posts the same
// week-by-week grid every other NFL club already has, so /nfl-tracker covers all 32.
//
// Where the schedules came from: the other 29 posts already name their opponent
// every week, so each missing club's season was reconstructed by inverting those
// 29 grids (a "vs Colts" in Houston's Week 3 is a Colts home game in Week 3).
// That recovered 17 of 18 weeks for each club; the one gap is the bye. Every
// reconstruction was cross-checked against the club's own confirmed alternate
// dates, and all three matched exactly, which is a strong independent check.
//
// Two neutral-site games are handled explicitly, both with the missing club as
// designated home team: the Colts host Washington in London (Week 4) and the
// 49ers host Minnesota at Estadio Azteca (Week 11).
//
// Usage: node scripts/add-missing-nfl-week-grids.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const post = (slug) => resolve(root, "content/posts", `${slug}.md`);

// uniform label -> [background, text colour, optional border]
const STYLES = {
  "49ers": {
    Scarlet: ["#AA0000", "#ffffff"],
    White: ["#f1f3f8", "#333", "1px solid #dfe3ea"],
    "Red 1994 Throwback": ["#B3995D", "#7a0000"],
    "White 1994 Throwback": ["#ffffff", "#AA0000", "2px solid #B3995D"],
    "Black Rivalries": ["#1d1d1d", "#ffffff"],
  },
  buccaneers: {
    Red: ["#D50A0A", "#ffffff"],
    White: ["#f1f3f8", "#333", "1px solid #dfe3ea"],
    "Creamsicle Throwback": ["#E87722", "#ffffff"],
    "All-Pewter": ["#34302B", "#ffffff"],
  },
  colts: {
    Blue: ["#002C5F", "#ffffff"],
    White: ["#f1f3f8", "#333", "1px solid #dfe3ea"],
    "Anvil Strike": ["#0a1a2e", "#A2AAAD"],
    "White Out": ["#ffffff", "#002C5F", "2px solid #002C5F"],
    "Indiana Nights": ["#101418", "#A2AAAD"],
  },
};

// [week, matchup, uniform, confirmed]
const SCHEDULES = {
  "49ers": [
    [1, "at Rams", "White"], [2, "vs Dolphins", "Scarlet"], [3, "vs Cardinals", "Scarlet"],
    // Week 4 is at Levi's Stadium on Sun Oct 4, so San Francisco is the home team.
    [4, "vs Broncos", "Scarlet"],
    [5, "at Seahawks", "White"], [6, "vs Commanders", "Scarlet"],
    [7, "at Falcons", "White"], [8, "Bye", "Off"], [9, "vs Raiders", "Scarlet"],
    [10, "at Cowboys", "Red 1994 Throwback", true], [11, "vs Vikings (MEX)", "Scarlet"],
    [12, "vs Seahawks", "Scarlet"], [13, "at Giants", "White"],
    [14, "vs Rams", "Black Rivalries", true], [15, "at Chargers", "White 1994 Throwback", true],
    [16, "at Chiefs", "White"], [17, "vs Eagles", "Red 1994 Throwback", true],
    [18, "at Cardinals", "White"],
  ],
  buccaneers: [
    [1, "at Bengals", "White"], [2, "vs Browns", "Red"], [3, "vs Vikings", "Red"],
    [4, "vs Packers", "Red"], [5, "at Cowboys", "White"], [6, "vs Steelers", "Red"],
    [7, "at Panthers", "White"], [8, "vs Falcons", "Red"], [9, "at Bears", "White"],
    [10, "Bye", "Off"], [11, "at Lions", "White"], [12, "vs Panthers", "Red"],
    [13, "vs Chargers", "Creamsicle Throwback", true], [14, "at Ravens", "White"],
    [15, "vs Saints", "All-Pewter", true], [16, "at Falcons", "White"],
    [17, "vs Rams", "Red"], [18, "at Saints", "White"],
  ],
  colts: [
    [1, "vs Ravens", "Blue"], [2, "at Chiefs", "White"],
    [3, "vs Texans", "Anvil Strike", true], [4, "vs Commanders (LDN)", "Blue"],
    [5, "at Steelers", "White"], [6, "vs Titans", "Blue"], [7, "at Vikings", "White"],
    [8, "at Jaguars", "White"], [9, "vs Cowboys", "White Out", true],
    [10, "vs Dolphins", "Blue"], [11, "at Texans", "White"], [12, "vs Giants", "Blue"],
    [13, "Bye", "Off"], [14, "at Eagles", "White"], [15, "at Titans", "White"],
    [16, "vs Bengals", "Indiana Nights", true], [17, "at Browns", "White"],
    [18, "vs Jaguars", "Blue"],
  ],
};

function cell(key, [week, matchup, uniform, confirmed]) {
  if (uniform === "Off") {
    return `  <div style="background: #eceff3; color: #98a0ac; border: 1px dashed #cdd3db; border-radius: 10px; padding: 12px 10px; text-align: center;"><div style="font-size: 0.68em; font-weight: 700; letter-spacing: 1px; opacity: 0.8;">WEEK ${week}</div><div style="font-size: 0.95em; font-weight: 800; margin: 4px 0;">Bye</div><div style="font-size: 0.76em; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Off</div></div>`;
  }
  const [bg, fg, border] = STYLES[key][uniform];
  const borderCss = border ? ` border: ${border};` : "";
  const label = `${confirmed ? "&#9733; " : ""}${uniform}`;
  return `  <div style="background: ${bg}; color: ${fg};${borderCss} border-radius: 10px; padding: 12px 10px; text-align: center;"><div style="font-size: 0.68em; font-weight: 700; letter-spacing: 1px; opacity: 0.8;">WEEK ${week}</div><div style="font-size: 0.95em; font-weight: 800; margin: 4px 0;">${matchup}</div><div style="font-size: 0.76em; font-weight: ${confirmed ? 800 : 700}; text-transform: uppercase; letter-spacing: 0.5px;">${label}</div></div>`;
}

const BLURB = {
  "49ers": {
    name: "49ers",
    intro:
      "Scarlet at Levi's, white on the road, and four dates that break the pattern. Week 11 against Minnesota is at Estadio Azteca in Mexico City, where San Francisco is the designated home team.",
    caveat:
      "Every &#9733; is officially confirmed by the 49ers. The rest follow the standard scarlet-at-home, white-on-the-road split, which is the club's usual practice but has not been announced week by week. Pant colors and exact combinations are an equipment-staff call the week of each game.",
  },
  buccaneers: {
    name: "Buccaneers",
    intro:
      "Red at Raymond James, white on the road, and two confirmed special dates in December: the creamsicle throwbacks against the Chargers and the all-pewter set against the Saints.",
    caveat:
      "Every &#9733; is officially confirmed by the Buccaneers. The rest follow the standard red-at-home, white-on-the-road split, which is the club's usual practice but has not been announced week by week. Pant colors and exact combinations are an equipment-staff call the week of each game.",
  },
  colts: {
    name: "Colts",
    intro:
      "Blue at Lucas Oil, white on the road, and three confirmed alternates, all of them at home. Week 4 against Washington is in London, where Indianapolis is the designated home team.",
    caveat:
      "Every &#9733; is officially confirmed by the Colts. The rest follow the standard blue-at-home, white-on-the-road split, which is the club's usual practice but has not been announced week by week. Pant colors and exact combinations are an equipment-staff call the week of each game.",
  },
};

function grid(key) {
  const cells = SCHEDULES[key].map((g) => cell(key, g)).join("\n");
  const b = BLURB[key];
  return `## The Full 2026 ${b.name} Uniform Schedule, Week by Week

${b.intro}

<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(138px, 1fr)); gap: 10px; margin: 1.5em 0;">
${cells}
</div>

<p style="font-size: 0.85em; color: #777; margin: 0 0 2.5em;">${b.caveat}</p>

`;
}

const TARGETS = [
  ["49ers", "49ers-uniform-schedule-2026"],
  ["buccaneers", "buccaneers-uniform-schedule-2026"],
  ["colts", "colts-uniform-schedule-2026"],
];

for (const [key, slug] of TARGETS) {
  const path = post(slug);
  let s = readFileSync(path, "utf8");
  if (s.includes("The Full 2026")) {
    console.log(`  ${slug}: already has a grid, skipped`);
    continue;
  }
  const anchor = s.includes("## The Bottom Line")
    ? "## The Bottom Line"
    : "## Frequently Asked Questions";
  s = s.replace(anchor, grid(key) + anchor);
  s = s.replace(/^updatedDate: ["'][\d-]+["']$/m, 'updatedDate: "2026-08-26"');
  writeFileSync(path, s);
  console.log(`  ${slug}: grid added before "${anchor}"`);
}

// The Broncos grid shipped with six cells missing their vs/at prefix, which made
// the home/road split unreadable. Resolved against each opponent's own post.
const BRONCOS_FIX = [
  ["WEEK 4</div><div style=\"font-size: 0.95em; font-weight: 800; margin: 4px 0;\">49ers", "at 49ers"],
  ["WEEK 9</div><div style=\"font-size: 0.95em; font-weight: 800; margin: 4px 0;\">Panthers", "at Panthers"],
  ["WEEK 11</div><div style=\"font-size: 0.95em; font-weight: 800; margin: 4px 0;\">Raiders", "vs Raiders"],
  ["WEEK 12</div><div style=\"font-size: 0.95em; font-weight: 800; margin: 4px 0;\">Steelers", "at Steelers"],
  ["WEEK 15</div><div style=\"font-size: 0.95em; font-weight: 800; margin: 4px 0;\">Raiders", "at Raiders"],
  ["WEEK 17</div><div style=\"font-size: 0.95em; font-weight: 800; margin: 4px 0;\">Patriots", "at Patriots"],
];
{
  const path = post("broncos-uniform-schedule-2026");
  let s = readFileSync(path, "utf8");
  let n = 0;
  for (const [needle, replacement] of BRONCOS_FIX) {
    const bare = needle.split(">").pop();
    const full = needle.slice(0, needle.length - bare.length) + replacement;
    if (s.includes(needle) && !s.includes(full)) {
      s = s.replace(needle, full);
      n++;
    }
  }
  if (n) {
    s = s.replace(/^updatedDate: ["'][\d-]+["']$/m, 'updatedDate: "2026-08-26"');
    writeFileSync(path, s);
  }
  console.log(`  broncos: fixed ${n} unprefixed week cells`);
}

// The 49ers post listed Week 15 as "vs. Chargers"; the Chargers post has that game
// on its home slate and San Francisco wears the WHITE throwback, so it is a road game.
{
  const path = post("49ers-uniform-schedule-2026");
  let s = readFileSync(path, "utf8");
  const before = s;
  s = s.replace(/Week 15 &middot; vs\. Chargers \(TNF\)/g, "Week 15 &middot; at Chargers (TNF)");
  if (s !== before) writeFileSync(path, s);
  console.log(`  49ers: Week 15 corrected to a road game${s !== before ? "" : " (no change needed)"}`);
}
