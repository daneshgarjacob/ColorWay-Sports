import Link from "next/link";
import { leagueColor } from "@/lib/leagueColors";
import type { PostMeta } from "@/lib/posts";

// Oversized lead-story card at the top of Latest Stories — one editorial
// hero moment before the equal-weight grid, ESPN/Ringer style.
export default function StoryHero({ post }: { post: PostMeta }) {
  const {
    slug,
    href,
    title,
    category,
    date,
    updatedDate,
    excerpt,
    gradient,
    overlayText,
    logoSrc,
    logoSrc2,
    coverImage,
    coverImagePosition,
    coverImageFit,
  } = post;

  const displayDate = updatedDate || date;
  const formattedDate = displayDate
    ? new Date(displayDate + "T00:00:00").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;
  const datePrefix = updatedDate ? "Updated " : "";

  return (
    <Link href={href ?? `/stories/${slug}`} className="block group">
      <article className="story-card bg-white rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 active:scale-[0.99] active:duration-150 grid grid-cols-1 lg:grid-cols-5">
        {/* Cover */}
        <div
          className="relative overflow-hidden aspect-[3/2] lg:aspect-auto lg:col-span-3 lg:min-h-[290px] flex items-center justify-center"
          style={{ background: (coverImageFit === "contain" || !coverImage) ? gradient : undefined }}
        >
          {coverImage ? (
            <img
              src={coverImage}
              alt=""
              loading="eager"
              decoding="async"
              className={`absolute inset-0 w-full h-full transition-transform duration-500 ease-out group-hover:scale-[1.04] ${coverImageFit === "contain" ? "object-contain" : "object-cover"}`}
              style={coverImagePosition ? { objectPosition: coverImagePosition } : undefined}
            />
          ) : logoSrc && logoSrc2 ? (
            <div className="flex items-center gap-5 transition-all duration-300 group-hover:scale-105">
              <img src={logoSrc} alt="" className="h-[100px] w-auto drop-shadow-lg" />
              <span className="text-white/70 text-3xl font-extrabold">×</span>
              <img src={logoSrc2} alt="" className="h-[75px] w-auto drop-shadow-lg" />
            </div>
          ) : logoSrc && overlayText ? (
            <div className="flex flex-col items-center gap-3 transition-all duration-300 group-hover:scale-105">
              <img src={logoSrc} alt="" className="h-[120px] w-auto drop-shadow-lg" />
              <span className="text-white text-2xl font-extrabold uppercase tracking-widest drop-shadow-lg">
                {overlayText}
              </span>
            </div>
          ) : logoSrc ? (
            <img
              src={logoSrc}
              alt=""
              className="h-[140px] w-auto transition-all duration-300 group-hover:scale-105 drop-shadow-lg"
            />
          ) : overlayText ? (
            <span className="text-white/30 text-5xl font-bold uppercase tracking-wider transition-all duration-300 group-hover:text-white/50">
              {overlayText}
            </span>
          ) : null}
        </div>

        {/* Body */}
        <div className="lg:col-span-2 p-5 sm:p-7 flex flex-col justify-center">
          <div className="flex items-center gap-2">
            {logoSrc && <img src={logoSrc} alt="" className="h-[22px] w-auto object-contain" />}
            {logoSrc2 && <img src={logoSrc2} alt="" className="h-[22px] w-auto object-contain" />}
            <span
              className="text-[11px] font-semibold uppercase tracking-widest"
              style={{ color: leagueColor(category) }}
            >
              {category}
            </span>
            {formattedDate && (
              <>
                <span className="text-gray-light text-[10px]">·</span>
                <span className="text-[11px] text-gray-light">{datePrefix}{formattedDate}</span>
              </>
            )}
          </div>
          <h3 className="mt-3 text-xl sm:text-2xl font-extrabold text-blue-dark leading-tight tracking-tight group-hover:text-orange transition-colors duration-200">
            {title}
          </h3>
          <p className="mt-3 text-[15px] text-gray-medium leading-relaxed line-clamp-3">
            {excerpt}
          </p>
          <span className="mt-4 text-[12px] font-bold uppercase tracking-[0.15em] text-orange">
            Read the story →
          </span>
        </div>
      </article>
    </Link>
  );
}
