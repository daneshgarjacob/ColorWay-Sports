import Link from "next/link";
import { getAllNewsMeta, stamp } from "@/lib/news";

// Only items from the last WIRE_DAYS days. Wire items are written for the day
// (e.g. "for Friday night against Iowa State"), so a week-old one read as
// upcoming on 10/12. When nothing is that fresh the strip hides; /news keeps
// the full week.
const WIRE_DAYS = 3;

/**
 * The Wire's three newest items, for the homepage. Deliberately text only: the
 * homepage already carries a lot of images, and the job here is to show the site
 * was updated today, then get the reader into the feed.
 */
export default function WireStrip({ limit = 3, skip = [] }: { limit?: number; skip?: string[] }) {
  // skip: items already shown higher on the page (the Jake's Takes rail).
  const cutoff = Date.now() - WIRE_DAYS * 24 * 60 * 60 * 1000;
  const items = getAllNewsMeta()
    .filter((n) => !skip.includes(n.slug) && new Date(n.at).getTime() >= cutoff)
    .slice(0, limit);
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
            const day = new Date(item.at).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              timeZone: "America/Los_Angeles",
            });
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
                  {day} · {time} {zone}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
