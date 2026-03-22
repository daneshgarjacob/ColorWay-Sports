import Link from "next/link";

interface StoryCardProps {
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  gradient: string;
  overlayText?: string;
}

export default function StoryCard({
  slug,
  title,
  category,
  excerpt,
  gradient,
  overlayText,
}: StoryCardProps) {
  return (
    <article className="bg-white rounded shadow-sm overflow-hidden">
      {/* Gradient image placeholder */}
      <Link href={`/stories/${slug}`}>
        <div
          className="h-[200px] flex items-center justify-center relative"
          style={{ background: gradient }}
        >
          {overlayText && (
            <span className="text-white/40 text-4xl font-bold uppercase tracking-wider">
              {overlayText}
            </span>
          )}
        </div>
      </Link>

      {/* Card body */}
      <div className="p-5">
        <span className="text-xs text-gray-medium">{category}</span>
        <h3 className="mt-1">
          <Link
            href={`/stories/${slug}`}
            className="text-lg font-bold text-blue-dark hover:text-orange transition-colors leading-snug"
          >
            {title}
          </Link>
        </h3>
        <p className="mt-2 text-sm text-gray-medium leading-relaxed">
          {excerpt}
        </p>
      </div>
    </article>
  );
}
