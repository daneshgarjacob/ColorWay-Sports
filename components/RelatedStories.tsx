import StoryCard from "@/components/StoryCard";
import type { PostMeta } from "@/lib/posts";

interface RelatedStoriesProps {
  posts: PostMeta[];
}

export default function RelatedStories({ posts }: RelatedStoriesProps) {
  if (!posts || posts.length === 0) return null;

  return (
    <section
      aria-label="Related stories"
      className="my-14 pt-10 border-t border-black/10"
    >
      <div className="mb-6">
        <p
          className="text-[10px] uppercase tracking-[0.22em] font-bold text-[#2f6bed] mb-1"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          Keep Reading
        </p>
        <h2
          className="text-2xl sm:text-3xl font-extrabold text-black leading-tight tracking-tight"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          Related Stories
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {posts.map((post) => (
          <StoryCard
            key={post.slug}
            slug={post.slug}
            title={post.title}
            category={post.category}
            date={post.date}
            updatedDate={post.updatedDate}
            excerpt={post.excerpt}
            gradient={post.gradient}
            overlayText={post.overlayText}
            logoSrc={post.logoSrc}
            logoSrc2={post.logoSrc2}
            coverImage={post.coverImage}
            coverImagePosition={post.coverImagePosition}
            coverImageFit={post.coverImageFit}
            showDate={true}
          />
        ))}
      </div>
    </section>
  );
}
