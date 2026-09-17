import Link from "next/link";
import { getAllNewsMeta, stamp } from "@/lib/news";

/**
 * The Wire's three newest items, for the homepage. Deliberately text only: the
 * homepage already carries a lot of images, and the job here is to show the site
 * was updated today, then get the reader into the feed.
 */
export default function WireStrip({ limit = 3 }: { limit?: number }) {
  const items = getAllNewsMeta().slice(0, limit);
  if (items.length === 0) return null;

  return (
    <section className="max-w-[1180px] mx-auto px-5 mb-12">
      <div className="bg-white border border-border rounded-2xl px-5 sm:px-6 pt-[18px] pb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="font-display text-[12px] font-black tracking-[0.18em] uppercase text-black">
            The Wire
          </span>
          <Link
            prefetch={false}
            href="/news"
            className="font-display text-[12.5px] font-extrabold text-orange no-underline"
          >
            All news &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-[18px]">
          {items.map((item) => {
            const { time, zone } = stamp(item.at);
            return (
              <Link
                prefetch={false}
                key={item.slug}
                href={`/news/${item.slug}`}
                className="block border-t-2 border-black pt-[10px] no-underline group"
              >
                <div className="font-display text-[10px] font-extrabold tracking-[0.14em] uppercase text-orange">
                  {item.tag}
                </div>
                <p className="font-display text-[15px] font-bold leading-[1.3] text-black m-0 mt-[6px] group-hover:text-orange">
                  {item.title}
                </p>
                <span className="text-[11px] text-steel mt-[6px] block">
                  {time} {zone}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
