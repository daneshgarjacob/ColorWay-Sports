#!/usr/bin/env node
// Keeps the "what the rest of the league is wearing" pill row identical across
// every Premier League club kit page, and rebuilds the hub's link box.
//
// Run this after adding or renaming any club page. Doing it by hand is how a
// page ends up orphaned or linking itself.
//   node scripts/sync-epl-pills.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const HUB = 'premier-league-kit-schedule-2026-27';

// slug stem -> pill label (short) and hub label (full-ish)
const CLUBS = [
  ['arsenal', 'Arsenal', 'Arsenal'],
  ['aston-villa', 'Aston Villa', 'Aston Villa'],
  ['bournemouth', 'Bournemouth', 'Bournemouth'],
  ['brentford', 'Brentford', 'Brentford'],
  ['brighton', 'Brighton', 'Brighton'],
  ['chelsea', 'Chelsea', 'Chelsea'],
  ['coventry-city', 'Coventry', 'Coventry City'],
  ['crystal-palace', 'Crystal Palace', 'Crystal Palace'],
  ['everton', 'Everton', 'Everton'],
  ['fulham', 'Fulham', 'Fulham'],
  ['hull-city', 'Hull City', 'Hull City'],
  ['ipswich-town', 'Ipswich', 'Ipswich Town'],
  ['leeds-united', 'Leeds', 'Leeds United'],
  ['liverpool', 'Liverpool', 'Liverpool'],
  ['manchester-city', 'Man City', 'Man City'],
  ['manchester-united', 'Man United', 'Man United'],
  ['newcastle', 'Newcastle', 'Newcastle'],
  ['nottingham-forest', 'Forest', 'Nottingham Forest'],
  ['sunderland', 'Sunderland', 'Sunderland'],
  ['tottenham', 'Tottenham', 'Tottenham'],
];

const full = (stem) => `${stem}-kits-2026-27`;

const hubPill =
  `<a href="/stories/${HUB}" style="display: inline-block; padding: 5px 12px; margin: 0 6px 6px 0; background: #3D195B; border: 1px solid #3D195B; border-radius: 999px; color: #ffffff; font-size: 13px; font-weight: 700; text-decoration: none;">Full matchweek kit schedule</a>`;

const clubPill = (stem, label) =>
  `<a href="/stories/${full(stem)}" style="display: inline-block; padding: 5px 12px; margin: 0 6px 6px 0; background: #ffffff; border: 1px solid #e3e6ec; border-radius: 999px; color: #2f6bed; font-size: 13px; font-weight: 700; text-decoration: none;">${label}</a>`;

const pillRow = (selfStem) =>
  '<div style="margin-top: 18px; padding-top: 14px; border-top: 1px solid #eef0f4;">' +
  '<p style="font-size: 0.7em; font-weight: 800; letter-spacing: 1.6px; text-transform: uppercase; color: #8892a0; margin: 0 0 8px;">What the rest of the league is wearing</p>' +
  hubPill +
  CLUBS.filter(([s]) => s !== selfStem).map(([s, label]) => clubPill(s, label)).join('') +
  '</div>';

let changed = 0;
for (const [stem] of CLUBS) {
  const path = `content/posts/${full(stem)}.md`;
  let s = readFileSync(path, 'utf8');
  const before = s;
  const row = pillRow(stem);

  // Newly generated pages carry an empty placeholder; existing pages carry a
  // populated row. Handle both, and never let a page link itself.
  if (s.includes('<div data-epl-pills')) {
    s = s.replace(/<div data-epl-pills[^>]*><\/div>/, row);
  } else {
    s = s.replace(
      /<div style="margin-top: 18px; padding-top: 14px; border-top: 1px solid #eef0f4;">[\s\S]*?<\/div><\/div><\/div>/,
      row + '</div></div>'
    );
  }
  if (s !== before) { writeFileSync(path, s); changed++; }
}

// Rebuild the hub's link box with all twenty.
const hubPath = `content/posts/${HUB}.md`;
let hub = readFileSync(hubPath, 'utf8');
const links = CLUBS.map(([stem, , label], i) => {
  const bb = i === CLUBS.length - 1 ? '' : 'border-bottom: 1px solid #e3e7ec; ';
  return `<a href="/stories/${full(stem)}" style="display: block; padding: 9px 0; ${bb}color: #14284b; font-weight: 700; text-decoration: none;">What Kit Are ${label} Wearing Today?</a>`;
}).join('');
const box =
  '<div data-epl-hub-crosslinks style="margin: 2.25em 0; padding: 1.35em 1.5em; background: #f6f7f9; border: 1px solid #e3e7ec; border-radius: 12px;">' +
  '<p style="font-size: 0.7em; font-weight: 800; letter-spacing: 2.2px; text-transform: uppercase; color: #5f7085; margin: 0 0 0.35em;">Every kit, club by club, graded</p>' +
  '<p style="font-size: 0.9em; color: #5f7085; margin: 0 0 0.9em; line-height: 1.5;">The full 2026/27 wardrobe for all twenty Premier League clubs, with our grades and what they are wearing next.</p>' +
  links + '</div>';
hub = hub.replace(/<div data-epl-hub-crosslinks[\s\S]*?<\/div>\n/, box + '\n');
writeFileSync(hubPath, hub);

console.log(`pill rows synced on ${changed} club pages; hub box rebuilt with ${CLUBS.length} clubs.`);
