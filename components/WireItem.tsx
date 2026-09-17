import Link from "next/link";
import type { NewsItem } from "@/lib/news";
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
export default function WireItem({ item, headingLevel = "h3" }: { item: NewsItem; headingLevel?: "h1" | "h3" }) {
  const { time, zone } = stamp(item.at);
  const Heading = headingLevel;

  return (
    <article className="grid grid-cols-[58px_1fr] sm:grid-cols-[74px_1fr] gap-3 sm:gap-[18px] py-5 border-t border-border">
      <div className="pt-1">
        <div className="font-display text-[12px] font-extrabold text-black tracking-[0.01em]">{time}</div>
        <div className="font-display text-[10px] font-bold text-steel tracking-[0.12em] mt-[3px]">{zone}</div>
      </div>

      <div>
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

        {item.image && (
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
          dangerouslySetInnerHTML={{ __html: item.contentHtml }}
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
    </article>
  );
}
