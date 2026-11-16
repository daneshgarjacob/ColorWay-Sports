import type { TeamMoreData, MoreLinkKind } from "@/lib/teamMoreLinks";

// "More For Your Team" (site plan 11/16, item 2): near the end of every team
// schedule post and tracker team page. Server-rendered, fixed markup with no
// images that load late (team logos carry explicit sizes), so it cannot shift
// the layout. Text is the size of the article body or bigger: a reader who got
// this far is a fan of this team, and these are the next pages they want.

const KIND_ICON: Record<MoreLinkKind, string> = {
  next: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
  rival: "M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2M9.5 6.5 21 18v3h-3L6.5 9.5M11 5 5 11M8 8 4 4M5 3 3 5",
  explained: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01",
  hub: "M12 2 15 8.5 22 9.3 17 14 18.2 21 12 17.8 5.8 21 7 14 2 9.3 9 8.5z",
  calendar: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01",
  tracker: "M3 3v18h18M7 15l4-4 3 3 5-6",
};

export default function TeamMoreBlock({ data }: { data: TeamMoreData | null }) {
  if (!data || data.links.length < 2) return null;

  return (
    <section
      aria-labelledby={`more-${data.slug}`}
      data-team-more
      className="not-prose my-12 rounded-2xl border border-black/[0.08] bg-[#f5f8ff] p-5 sm:p-7"
    >
      <div className="flex items-center gap-3 mb-5">
        {data.logo && (
          // eslint-disable-next-line @next/next/no-img-element -- public/ images are served raw site-wide
          <img src={data.logo} alt="" width={40} height={40} className="w-10 h-10 object-contain flex-shrink-0" />
        )}
        <div>
          <p className="text-[13px] font-extrabold uppercase tracking-[0.16em] text-[#0025CC] leading-none">
            Keep Going
          </p>
          <h2 id={`more-${data.slug}`} className="mt-1.5 text-[26px] sm:text-[30px] font-extrabold text-black leading-tight tracking-tight">
            More For {data.short} Fans
          </h2>
        </div>
      </div>

      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {data.links.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              className="group flex h-full items-start gap-3.5 rounded-xl border border-black/10 bg-white px-4 py-4 no-underline hover:border-[#0025CC] hover:shadow-[0_4px_16px_rgba(0,37,204,0.12)] transition-all duration-150"
            >
              <span className="flex-shrink-0 w-11 h-11 rounded-lg bg-[#e8eefb] text-[#0025CC] flex items-center justify-center">
                {link.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element -- public/ images are served raw site-wide
                  <img src={link.logo} alt="" width={30} height={30} loading="lazy" decoding="async" className="w-[30px] h-[30px] object-contain" />
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d={KIND_ICON[link.kind]} />
                  </svg>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-extrabold uppercase tracking-[0.12em] text-[#5b6474] leading-tight">
                  {link.eyebrow}
                </span>
                <span className="mt-1 block text-[18px] font-bold text-black leading-snug group-hover:text-[#0025CC]">
                  {link.label}
                </span>
                {link.detail && (
                  <span className="mt-1 block text-[16px] text-[#3c4250] leading-snug">{link.detail}</span>
                )}
              </span>
              <span aria-hidden className="self-center text-[#0025CC] font-bold text-xl leading-none group-hover:translate-x-0.5 transition-transform duration-150">
                &rarr;
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
