import { nflLeague } from "./nfl";
import type { EmbedLeague } from "./types";

// One entry per league the widget supports. To add MLB / NHL / college, write
// an adapter like ./nfl.ts that returns an EmbedCard and list it here; the
// route (/embed/<league>/<team>), the renderer and the /embed generator pick it
// up with no other changes.
export const EMBED_LEAGUES: EmbedLeague[] = [nflLeague];

export function embedLeague(key: string): EmbedLeague | undefined {
  return EMBED_LEAGUES.find((l) => l.key === key);
}
