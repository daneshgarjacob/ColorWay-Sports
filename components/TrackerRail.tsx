import StorySidebar from "@/components/StorySidebar";
import { getAllPosts, type PostMeta } from "@/lib/posts";
import { ARTICLE_ROW } from "@/lib/articleColumn";

// The story template's body + right rail, for the /nfl-, /nba-, /nhl- and
// /mlb-tracker team pages (11/19). Those pages were one centered column with
// no #sidebar, so Mediavine had nowhere to put its desktop sidebar units, the
// same hole the story pages had before 9/4 (see StorySidebar). Same geometry
// as the story page: a column up to 720px plus a fixed 300px rail from lg up,
// so the TeamWearBox above (already on ARTICLE_ROW) lines up with the body.
// The rail is in the server HTML at its final width, so nothing shifts when
// the ads arrive. Below lg it is hidden and the page is exactly what it was:
// the -mx-5 cancels ARTICLE_ROW's gutter because every section inside carries
// its own px-5.
export default function TrackerRail({ slugs, children }: { slugs: string[]; children: React.ReactNode }) {
  const all = getAllPosts();
  const posts = slugs
    .map((s) => all.find((p) => p.slug === s))
    .filter((p): p is PostMeta => Boolean(p));
  return (
    <div className={`${ARTICLE_ROW} lg:items-start`}>
      <div className="min-w-0 -mx-5">{children}</div>
      <div className="hidden lg:block pt-8">
        <StorySidebar posts={posts} />
      </div>
    </div>
  );
}
