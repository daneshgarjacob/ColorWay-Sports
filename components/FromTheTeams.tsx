import Link from "next/link";
import type { NewsMeta, NewsThumb } from "@/lib/news";
import { dayLabel, stamp } from "@/lib/news";

type Item = NewsMeta & { thumb: NewsThumb };

/**
 * "From The Teams" (Jake 11/13): the newest uniform posts from team and league
 * accounts, pulled from The Wire. One row of cards: logo or cover, the headline,
 * and who posted it. Text and one small image per card, no embedded tweets
 * (the twitter widget is heavy and moves the layout), so the homepage stays fast.
 */
export default function FromTheTeams({
  items,
  title = "From The Teams",
  allHref = "/news",
  className = "max-w-[1200px] mx-auto px-5 pt-8",
}: {
  items: Item[];
  title?: string;
  allHref?: string;
  className?: string;
}) {
  if (items.length === 0) return null;
  const today = dayLabel(new Date().toISOString());
  return (
    <section className={className} aria-labelledby="from-the-teams">
      <div className="flex items-baseline justify-between mb-3">
        <h2 id="from-the-teams" className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-[#8A8F98]">
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full rounded-full bg-[#E5262E] opacity-60 motion-safe:animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#E5262E]" />
          </span>
          {title}
        </h2>
        <Link prefetch={false} href={allHref} className="text-[11px] font-semibold text-orange hover:underline uppercase tracking-widest">
          The Wire →
        </Link>
      </div>
      <hr className="border-border mb-5" />
      <div className="-mx-5 px-5 flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 lg:mx-0 lg:px-0 lg:grid lg:grid-cols-4 lg:overflow-visible">
        {items.slice(0, 8).map((item) => {
          const { time, zone } = stamp(item.at);
          const day = dayLabel(item.at);
          const when = day === today ? `Today · ${time} ${zone}` : `${day.split(",")[0]} · ${time} ${zone}`;
          return (
            <Link
              prefetch={false}
              key={item.slug}
              href={`/news/${item.slug}`}
              className="group snap-start shrink-0 w-[240px] lg:w-auto flex flex-col rounded-xl border border-border bg-white overflow-hidden no-underline hover:border-black/25 transition-colors"
            >
              <Thumb thumb={item.thumb} />
              <div className="p-3 flex flex-col gap-1.5 flex-1">
                <span className="font-display text-[10px] font-extrabold tracking-[0.14em] uppercase text-orange">{item.tag}</span>
                <span className="font-display text-[14.5px] font-bold leading-[1.3] text-black line-clamp-3 group-hover:text-orange">
                  {item.title}
                </span>
                <span className="mt-auto pt-1 text-[11px] text-steel">
                  {item.source ? `via ${item.source} · ` : ""}
                  {when}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function Thumb({ thumb }: { thumb: NewsThumb }) {
  // Fixed aspect box so nothing shifts while images load (Clarity CLS 0.13).
  return (
    <span className="relative block aspect-[16/9] bg-[#f4f6fa] overflow-hidden" aria-hidden="true">
      <span className="absolute top-0 inset-x-0 h-1 z-10" style={{ background: thumb.accent }} />
      {thumb.kind === "cover" && (
        /* eslint-disable-next-line @next/next/no-img-element -- public/ images are served raw site-wide */
        <img
          src={thumb.src}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          style={thumb.position ? { objectPosition: thumb.position } : undefined}
        />
      )}
      {(thumb.kind === "logo" || thumb.kind === "cutout") && thumb.src && (
        <span className="absolute inset-0 flex items-center justify-center p-4">
          {/* eslint-disable-next-line @next/next/no-img-element -- public/ images are served raw site-wide */}
          <img src={thumb.src} alt="" loading="lazy" decoding="async" className="max-h-[62%] max-w-[55%] object-contain" />
        </span>
      )}
      {thumb.kind === "brand" && (
        <span
          className="absolute inset-0 flex items-center justify-center font-display text-[11px] font-extrabold tracking-[0.2em] uppercase text-white/90"
          style={{ background: `linear-gradient(135deg, ${thumb.accent} 0%, #0025CC 100%)` }}
        >
          The Wire
        </span>
      )}
    </span>
  );
}
