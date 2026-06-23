// One-off: fetch each IPL team's infobox logo from Wikipedia (transparent PNG thumbnails).
import { writeFileSync } from "fs";

const DEST = "public/images/posts/cricket-league-jerseys-ipl";
const UA = "ColorWaySports/1.0 (editorial logo fetch; contact@colorwaysports.com)";
const teams = [
  ["csk", "Chennai_Super_Kings"],
  ["mi", "Mumbai_Indians"],
  ["rcb", "Royal_Challengers_Bengaluru"],
  ["srh", "Sunrisers_Hyderabad"],
  ["kkr", "Kolkata_Knight_Riders"],
  ["rr", "Rajasthan_Royals"],
  ["pbks", "Punjab_Kings"],
  ["gt", "Gujarat_Titans"],
  ["lsg", "Lucknow_Super_Giants"],
  ["dc", "Delhi_Capitals"],
];

for (const [slug, page] of teams) {
  try {
    const html = await (
      await fetch(`https://en.wikipedia.org/wiki/${page}`, { headers: { "User-Agent": UA } })
    ).text();
    const ibIdx = html.indexOf("infobox");
    const scope = ibIdx >= 0 ? html.slice(ibIdx, ibIdx + 6000) : html;
    // first infobox image from upload.wikimedia (the logo)
    const m = scope.match(/src="(\/\/upload\.wikimedia\.org\/wikipedia\/[^"]+?\.(?:png|jpg|jpeg))"/i);
    if (!m) {
      console.log(`${slug}: NO infobox image`);
      continue;
    }
    // use the native infobox thumbnail size (non-free logos are resolution-capped)
    const url = "https:" + m[1];
    const ext = url.split(".").pop().split("?")[0].toLowerCase();
    const buf = Buffer.from(await (await fetch(url, { headers: { "User-Agent": UA } })).arrayBuffer());
    writeFileSync(`${DEST}/logo-${slug}.${ext}`, buf);
    console.log(`${slug}: ${ext} ${(buf.length / 1024).toFixed(0)}KB  <-  ${decodeURIComponent(url.split("/").pop())}`);
  } catch (e) {
    console.log(`${slug}: ERROR ${e.message}`);
  }
}
