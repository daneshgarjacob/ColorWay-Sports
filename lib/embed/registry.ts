import { nflLeague } from "./nfl";
import { nbaLeague, nhlLeague } from "./winter";
import type { EmbedLeague } from "./types";

// One entry per league the widget supports (NFL, NBA, NHL). To add MLB / college, write
// an adapter like ./nfl.ts that returns an EmbedCard and list it here; the
// route (/embed/<league>/<team>), the renderer and the /embed generator pick it
// up with no other changes.
export const EMBED_LEAGUES: EmbedLeague[] = [nflLeague, nbaLeague, nhlLeague];

export function embedLeague(key: string): EmbedLeague | undefined {
  return EMBED_LEAGUES.find((l) => l.key === key);
}
