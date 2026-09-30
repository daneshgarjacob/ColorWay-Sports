import Link from "next/link";
import type { NewsItem, NewsThumb } from "@/lib/news";
import { stamp } from "@/lib/news";

const TAG_CLASS: Record<string, string> = {
  Breaking: "bg-black text-white",
  NFL: "bg-[#eef2fe] text-[#1f4fc4]",
  MLB: "bg-[#fdeeee] text-[#b8262b]",
  College: "bg-[#eefaf2] text-[#10744a]",
  NBA: "bg-[#fff3ea] text-[#b4530f]",
  NHL: "bg-[#eef4f8] text-[#1c5675]",
  Soccer: "bg-[#f1eefe] text-[#4b2fbd]",
};

/**
 * One item in The Wire. Headline, a few sentences, where it came from, and Jake's
 * take when there is one. The byline only appears with a take: an item that is
 * just facts does not need a name on it, and putting one there would make the
 * whole feed read like filler.
 */
export default function WireItem({
  item,
  headingLevel = "h3",
  variant = "feed",
  thumb,
}: {
  item: NewsItem;
  headingLevel?: "h1" | "h3";
  /**
   * "feed" is the scannable list: headline, words, take, and (since Jake's 9/30
   * call, reversing 9/17) a picture when `thumb` is passed. Tweet embeds still
   * belong on the item you click into.
   * "full" is that item page, where the team's own post carries the visual.
   */
  variant?: "feed" | "full";
  /**
   * Feed picture (Jake, 9/30: the /news front page needs images). Resolved by
   * newsThumb() in lib/news; only drawn in the feed variant, the item page
   * already shows the full image or embed.
   */
  thumb?: NewsThumb;
}) {
  const { time, zone } = stamp(item.at);
  const Heading = headingLevel;
  const showThumb = variant === "feed" && !!thumb;
  const body =
    variant === "feed"
      ? item.contentHtml.replace(/<blockquote class="twitter-tweet"[\s\S]*?<\/blockquote>/g, "")
      : item.contentHtml;

  return (
    <article className="grid grid-cols-[58px_1fr] sm:grid-cols-[74px_1fr] gap-3 sm:gap-[18px] py-5 border-t border-border">
      <div className="pt-1">
        <div className="font-display text-[12px] font-extrabold text-black tracking-[0.01em]">{time}</div>
        <div className="font-display text-[10px] font-bold text-steel tracking-[0.12em] mt-[3px]">{zone}</div>
      </div>

      <div className={showThumb ? "md:grid md:grid-cols-[minmax(0,1fr)_200px] md:gap-5 md:items-start" : ""}>
        {showThumb && thumb && <FeedThumb thumb={thumb} href={`/news/${item.slug}`} alt={item.imageAlt || item.title} tag={item.tag} />}
        <div className="min-w-0 md:order-1">
        <span
          className={`inline-block font-display text-[9.5px] font-extrabold tracking-[0.16em] uppercase px-[9px] py-[3px] rounded-full mb-[9px] ${
            TAG_CLASS[item.tag] ?? TAG_CLASS.NFL
          }`}
        >
          {item.tag}
        </span>

        <Heading className="font-display text-[21px] sm:text-[23px] font-extrabold leading-[1.22] tracking-[-0.01em] text-black m-0 mb-2">
          {headingLevel === "h3" ? (
            <Link prefetch={false} href={`/news/${item.slug}`} className="text-black no-underline hover:text-orange">
              {item.title}
            </Link>
          ) : (
            item.title
          )}
        </Heading>

        {item.image && variant === "full" && (
          <div
            className={`rounded-[10px] border border-border overflow-hidden my-1 mb-3 ${
              item.imageStyle === "full" ? "" : "bg-[#f1f3f8] flex items-center justify-center p-3"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- public/ images are served raw site-wide */}
            <img
              src={item.image}
              alt={item.imageAlt || item.title}
              className={item.imageStyle === "full" ? "w-full block" : "max-h-[240px] w-auto object-contain"}
              loading="lazy"
            />
          </div>
        )}

        <div
          className="wire-body text-[15.5px] leading-[1.62] text-[#3f4650]"
          dangerouslySetInnerHTML={{ __html: body }}
        />

        {item.take && (
          <blockquote className="border-l-[3px] border-orange pl-[14px] py-1 my-3 m-0">
            <p className="font-serif text-[17px] leading-[1.55] text-black m-0">{item.take}</p>
            <span className="font-display text-[10.5px] font-extrabold tracking-[0.16em] uppercase text-orange mt-2 block">
              {item.takeBy}
            </span>
          </blockquote>
        )}

        <p className="text-[12.5px] text-steel m-0 mt-2">
          {item.source && (
            <>
              <span className="text-gray-medium font-semibold">Source:</span>{" "}
              {item.sourceUrl ? (
                <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-steel underline">
                  {item.source}
                </a>
              ) : (
                item.source
              )}
            </>
          )}
          {item.source && item.link && <span className="mx-2">&middot;</span>}
          {item.link && (
            <Link
              prefetch={false}
              href={item.link}
              className="font-display text-[12.5px] font-extrabold text-orange no-underline"
            >
              {item.linkLabel || "Read more"} &rarr;
            </Link>
          )}
        </p>
        </div>
      </div>
    </article>
  );
}

/** ColorWay "Outline Stamp" mark, same geometry as the header logo. */
function Stamp({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <circle cx="50" cy="50" r="37" fill="none" stroke="currentColor" strokeWidth="2.6" />
      <circle cx="50" cy="50" r="31" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.45" />
      <g transform="translate(0,3)" fill="currentColor">
        <circle cx="40.8" cy="32" r="2.4" />
        <rect x="39.6" y="33" width="2.6" height="33" rx="1.3" />
        <path d="M42.2,36 L65,40.5 L55,46 L65,51.5 L42.2,54 Z" />
      </g>
    </svg>
  );
}

/**
 * The feed picture. Full width above the headline on phones, a 3:2 thumbnail to
 * the right of the words from sm up (the ESPN/Athletic news-river shape). Every
 * source is a file already in public/, so this adds no new weight to the repo.
 */
function FeedThumb({ thumb, href, alt, tag }: { thumb: NewsThumb; href: string; alt: string; tag: string }) {
  const frame =
    "block relative aspect-[16/9] md:aspect-[3/2] rounded-[10px] overflow-hidden border border-border mb-3 md:mb-0 md:order-2 md:mt-1";
  return (
    <Link prefetch={false} href={href} className={`${frame} group`} aria-hidden="true" tabIndex={-1}>
      {thumb.kind === "cover" && (
        /* eslint-disable-next-line @next/next/no-img-element -- public/ images are served raw site-wide */
        <img
          src={thumb.src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          style={thumb.position ? { objectPosition: thumb.position } : undefined}
        />
      )}
      {thumb.kind === "cutout" && (
        <span className="absolute inset-0 bg-[#f1f3f8] flex items-center justify-center p-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- public/ images are served raw site-wide */}
          <img src={thumb.src} alt={alt} loading="lazy" decoding="async" className="max-h-full max-w-full object-contain" />
        </span>
      )}
      {thumb.kind === "logo" && (
        <span className="absolute inset-0 bg-[#f4f6fa] flex items-center justify-center">
          <span className="absolute top-0 inset-x-0 h-1" style={{ background: thumb.accent }} />
          {/* eslint-disable-next-line @next/next/no-img-element -- public/ images are served raw site-wide */}
          <img src={thumb.src} alt="" loading="lazy" decoding="async" className="h-[48%] w-auto max-w-[60%] object-contain" />
          <Stamp className="absolute right-2.5 bottom-2.5 w-5 h-5 text-[#9aa3b2]" />
        </span>
      )}
      {thumb.kind === "brand" && (
        <span
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white"
          style={{ background: `linear-gradient(135deg, ${thumb.accent} 0%, #003087 100%)` }}
        >
          <Stamp className="w-11 h-11" />
          <span className="font-display text-[10px] font-extrabold tracking-[0.2em] uppercase text-white/85">
            The Wire &middot; {tag}
          </span>
        </span>
      )}
    </Link>
  );
}
