// Writes scripts/data/mlb-postseason-results-2026.json: every 2026 postseason
// game (Wild Card through World Series) with its final score, from MLB's
// schedule API. Run it nightly during October; the homepage World Series band
// reads it for the series score and each team's record in each jersey.
import fs from "node:fs";
const url =
  "https://statsapi.mlb.com/api/v1/schedule?sportId=1&startDate=2026-09-29&endDate=2026-11-05&gameType=F,D,L,W";
const slug = (n) => (n.endsWith("Sox") || n.endsWith("Jays") ? n.toLowerCase().split(" ").slice(-2).join("-") : n === "Athletics" ? "athletics" : n.toLowerCase().split(" ").pop());
const data = await (await fetch(url)).json();
const games = [];
for (const d of data.dates) {
  for (const g of d.games) {
    // A postponed game reappears on its makeup date; keep only that one.
    if (g.status.detailedState === "Postponed") continue;
    games.push({
      date: d.date,
      round: g.gameType,
      description: g.description || "",
      gameNumber: g.seriesGameNumber ?? null,
      away: slug(g.teams.away.team.name),
      home: slug(g.teams.home.team.name),
      awayScore: g.teams.away.score ?? null,
      homeScore: g.teams.home.score ?? null,
      final: g.status.abstractGameState === "Final",
    });
  }
}
fs.writeFileSync("scripts/data/mlb-postseason-results-2026.json", JSON.stringify(games, null, 1) + "\n");
console.log(`${games.length} postseason games, ${games.filter((g) => g.final).length} final`);
