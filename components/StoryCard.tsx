import Link from "next/link";
interface StoryCardProps {
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  gradient: string;
  overlayText?: string;
  logoSrc?: string;
}

export default function StoryCard({
  slug,
  title,
  category,
  excerpt,
  gradient,
  overlayText,
  logoSrc,
}: StoryCardProps) {
  return (
    <article className="bg-white rounded-lg shadow-sm overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      {/* Gradient image area */}
      <Link href={`/stories/${slug}`}>
        <div
          className="h-[200px] flex items-center justify-center relative overflow-hidden group"
          style={{ background: gradient }}
        >
          {logoSrc ? (
            <img
              src={logoSrc}
              alt={overlayText || ""}
              className="h-[120px] w-auto transition-all duration-300 group-hover:scale-110 drop-shadow-lg"
            />
          ) : overlayText ? (
            <span className="text-white/30 text-4xl font-bold uppercase tracking-wider transition-all duration-300 group-hover:text-white/50 group-hover:scale-105">
              {overlayText}
            </span>
          ) : null}
        </div>
      </Link>

      {/* Card body */}
      <div className="p-5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-orange">
          {category}
        </span>
        <h3 className="mt-1.5">
          <Link
            href={`/stories/${slug}`}
            className="text-lg font-bold text-blue-dark hover:text-orange transition-colors duration-200 leading-snug"
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
