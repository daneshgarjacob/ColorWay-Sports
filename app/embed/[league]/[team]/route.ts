import { EMBED_LEAGUES, embedLeague } from "@/lib/embed/registry";
import { renderEmbedHtml } from "@/lib/embed/render";

// GET /embed/<league>/<team> -> the iframe widget as a bare HTML document.
//
// A Route Handler rather than a page on purpose: pages inherit app/layout.tsx,
// which carries the Mediavine ad script, GA, Grow and the email popup. None of
// that may run inside someone else's site. This returns ~6 KB of HTML instead.
//
// Prerendered for every team and refreshed hourly (ISR), so a busy forum
// embedding it costs one CDN hit, not a function call. ?theme=dark / auto is
// handled client-side in the document, which keeps the URL cacheable.
// Framing is allowed for this path only (next.config.ts headers()).

export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return EMBED_LEAGUES.flatMap((l) => l.teams().map((t) => ({ league: l.key, team: t.key })));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ league: string; team: string }> },
) {
  const { league, team } = await params;
  const card = embedLeague(league)?.card(team, new Date());
  if (!card) return new Response("Not found", { status: 404 });
  return new Response(renderEmbedHtml(card), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
