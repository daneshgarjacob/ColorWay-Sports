import { getAllPosts } from "@/lib/posts";
import { TEAM_LOGOS, COMPETITION_LOGOS } from "@/lib/teamLogos";

// Static search index for the header's Discover box. Built once at build time
// and served as a plain JSON file, so typing in the header never hits the
// server — the whole index is fetched on first focus and filtered in memory.
// Keep the payload lean: this ships to every reader who focuses the box.
export const dynamic = "force-static";

const slugify = (name: string) => name.toLowerCase().replace(/\s+/g, "-");

export function GET() {
  const posts = getAllPosts().map((p) => ({
    t: p.title,
    s: p.slug,
    l: p.league ?? "",
    // Excerpt is searched too, trimmed to keep the payload down. Without it a
    // query like "roof status" finds nothing, because the roof headlines say
    // "Is the Globe Life Field Roof Open Today?" and never the word "status".
    e: (p.excerpt ?? "").slice(0, 160),
  }));

  // Teams and competitions resolve to their filtered stories page, which is the
  // same destination as clicking them in the nav dropdowns.
  const teams = [...Object.keys(TEAM_LOGOS), ...Object.keys(COMPETITION_LOGOS)].map((name) => ({
    n: name,
    s: slugify(name),
    g: (TEAM_LOGOS as Record<string, string>)[name] ?? (COMPETITION_LOGOS as Record<string, string>)[name],
  }));

  return Response.json(
    { posts, teams },
    { headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" } }
  );
}
