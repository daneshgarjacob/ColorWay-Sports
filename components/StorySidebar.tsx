import StoryCard from "@/components/StoryCard";
import InlineNewsletter from "@/components/InlineNewsletter";
import type { PostMeta } from "@/lib/posts";

interface StorySidebarProps {
  posts: PostMeta[];
}

// Desktop-only right rail beside the article body.
//
// Two jobs. First, revenue: the article template was a single 720px column,
// which meant Mediavine had no sidebar to place its two desktop sidebar units
// in (their health check flagged "Sticky Sidebar Ads"), and desktop is the
// highest-RPM device we have. Mediavine needs the rail to be at least 300px
// wide and to sit beside the content on every viewport wider than 1023px; the
// id/classes below are the ones its script looks for on a sidebar. Second,
// page depth: two related stories in the reader's eyeline, not buried under
// the byline. Kept deliberately short so the sticky unit starts refreshing
// early in the scroll, which is what Mediavine's own guidance asks for.
export default function StorySidebar({ posts }: StorySidebarProps) {
  const picks = (posts || []).slice(0, 2);
  return (
    <aside
      id="sidebar"
      className="sidebar widget-area hidden lg:block w-[300px] shrink-0"
      aria-label="More stories"
    >
      {picks.length > 0 && (
        <section className="mb-8">
          <p
            className="text-[10px] uppercase tracking-[0.22em] font-bold text-[#2f6bed] mb-3"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            Keep Reading
          </p>
          <div className="flex flex-col gap-4">
            {picks.map((p) => (
              <StoryCard
                key={p.slug}
                slug={p.slug}
                title={p.title}
                category={p.category}
                date={p.date}
                updatedDate={p.updatedDate}
                excerpt={p.excerpt}
                gradient={p.gradient}
                overlayText={p.overlayText}
                logoSrc={p.logoSrc}
                logoSrc2={p.logoSrc2}
                coverImage={p.coverImage}
                coverImagePosition={p.coverImagePosition}
                coverImageFit={p.coverImageFit}
                cardStyle={p.cardStyle}
                kicker={p.kicker}
                bodyPreview={p.bodyPreview}
                compact
              />
            ))}
          </div>
        </section>
      )}
      <InlineNewsletter stacked />
    </aside>
  );
}
