// One-off: fetch a team's primary logo (500px transparent PNG) from ESPN's CDN, for post covers.
import { writeFileSync, mkdirSync } from "fs";

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const teams = [
  ["red-sox", "bos", "public/images/posts/red-sox-uniform-schedule-2026"],
  ["mets", "nym", "public/images/posts/mets-uniform-schedule-2026"],
];

for (const [slug, abbr, dest] of teams) {
  try {
    mkdirSync(dest, { recursive: true });
    const url = `https://a.espncdn.com/i/teamlogos/mlb/500/${abbr}.png`;
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (!res.ok) { console.log(`${slug}: HTTP ${res.status}`); continue; }
    const buf = Buffer.from(await res.arrayBuffer());
    writeFileSync(`${dest}/team-logo.png`, buf);
    console.log(`${slug}: ${(buf.length / 1024).toFixed(0)}KB  <-  ${url}`);
  } catch (e) {
    console.log(`${slug}: ERROR ${e.message}`);
  }
}
