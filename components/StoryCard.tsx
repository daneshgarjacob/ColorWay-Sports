import Link from "next/link";
import { leagueColor } from "@/lib/leagueColors";
interface StoryCardProps {
  slug: string;
  title: string;
  category: string;
  date?: string;
  updatedDate?: string;
  excerpt: string;
  gradient: string;
  overlayText?: string;
  logoSrc?: string;
  logoSrc2?: string;
  coverImage?: string;
  coverImagePosition?: string;
  coverImageFit?: string;
  showDate?: boolean;
}

export default function StoryCard({
  slug,
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
  showDate,
}: StoryCardProps) {
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
    <article className="story-card bg-white rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 active:scale-[0.98] active:duration-150">
      {/* Gradient image area */}
      <Link href={`/stories/${slug}`}>
        <div
          className="aspect-[3/2] flex items-center justify-center relative overflow-hidden group"
          style={{ background: (coverImageFit === "contain" || !coverImage) ? gradient : undefined }}
        >
          {coverImage ? (
            <img
              src={coverImage}
              alt=""
              loading="lazy"
              decoding="async"
              className={`w-full h-full transition-transform duration-500 ease-out group-hover:scale-[1.06] ${coverImageFit === "contain" ? "object-contain" : "object-cover"}`}
              style={coverImagePosition ? { objectPosition: coverImagePosition } : undefined}
            />
          ) : logoSrc && logoSrc2 ? (
            <div className="flex items-center gap-4 transition-all duration-300 group-hover:scale-110">
              <img src={logoSrc} alt="" className="h-[80px] w-auto drop-shadow-lg" />
              <span className="text-white/70 text-2xl font-extrabold">×</span>
              <img src={logoSrc2} alt="" className="h-[60px] w-auto drop-shadow-lg" />
            </div>
          ) : logoSrc && overlayText ? (
            <div className="flex flex-col items-center gap-2 transition-all duration-300 group-hover:scale-110">
              <img
                src={logoSrc}
                alt=""
                className="h-[100px] w-auto drop-shadow-lg -mt-2"
              />
              <span className="text-white text-xl font-extrabold uppercase tracking-widest drop-shadow-lg">
                {overlayText}
              </span>
            </div>
          ) : logoSrc ? (
            <img
              src={logoSrc}
              alt=""
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
      <div className="p-6">
        <div className="flex items-center gap-2">
          <span
            className="text-[11px] font-semibold uppercase tracking-widest"
            style={{ color: leagueColor(category) }}
          >
            {category}
          </span>
          {showDate && formattedDate && (
            <>
              <span className="text-gray-light text-[10px]">·</span>
              <span className="text-[11px] text-gray-light">{datePrefix}{formattedDate}</span>
            </>
          )}
        </div>
        <h3 className="mt-2.5">
          <Link
            href={`/stories/${slug}`}
            className="text-lg font-bold text-blue-dark hover:text-orange transition-colors duration-200 leading-snug"
          >
            {title}
          </Link>
        </h3>
        <p className="mt-2.5 text-sm text-gray-medium leading-relaxed">
          {excerpt}
        </p>
      </div>
    </article>
  );
}
