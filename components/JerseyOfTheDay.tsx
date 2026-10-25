import Link from "next/link";
import { leagueColor } from "@/lib/leagueColors";
import { imgFitClass, shortDate, shortDow, wornWhen, type JotdCredit, type JotdEntry } from "@/lib/jerseyOfTheDay";

// Jersey of the Day pieces. Built from the story card / StoryHero
// language: white rounded-xl .story-card, league-color tag, Hanken display
// type for labels, Inter for body, brand blue (text-orange) for links.

export function PhotoCredit({ credit, caption }: { credit: JotdCredit; caption?: string }) {
  return (
    <p className="mt-2 mb-0 text-center text-xs text-black/50 leading-snug px-2">
      {caption ? <>{caption} </> : null}
      Photo:{" "}
      {credit.url ? (
        <a href={credit.url} rel="nofollow noopener" target="_blank" className="underline hover:text-black">
          {credit.text}
        </a>
      ) : (
        credit.text
      )}
      {credit.license && (
        <>
          {" / "}
          {credit.licenseUrl ? (
            <a href={credit.licenseUrl} rel="nofollow noopener" target="_blank" className="underline hover:text-black">
              {credit.license}
            </a>
          ) : (
            credit.license
          )}
        </>
      )}
    </p>
  );
}

const STATUS_STYLE: Record<string, string> = {
  Confirmed: "text-[#128a4a]",
  Announced: "text-orange",
  Scheduled: "text-orange",
  Expected: "text-steel",
  Projected: "text-steel",
};

export function TodayFeature({ entry, isToday }: { entry: JotdEntry; isToday: boolean }) {
  const accent = leagueColor(entry.league);
  return (
    <article className="story-card bg-white rounded-xl overflow-hidden grid grid-cols-1 lg:grid-cols-[minmax(0,11fr)_minmax(0,9fr)]">
      <figure className="m-0">
        <div className="relative overflow-hidden aspect-[4/5] sm:aspect-[4/3] lg:aspect-auto lg:h-full lg:min-h-[560px] bg-[#f1f3f8]">
          <img
            src={entry.image}
            alt={entry.imageAlt}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className={`absolute inset-0 w-full h-full ${imgFitClass(entry)}`}
            style={entry.imagePosition ? { objectPosition: entry.imagePosition } : undefined}
          />
          <span className="absolute left-3 top-3 font-display text-[10px] font-extrabold uppercase tracking-[0.18em] px-2.5 py-[5px] rounded bg-white/95 text-black">
            {isToday ? "Today" : shortDate(entry.date)} · Jersey of the Day
          </span>
        </div>
      </figure>

      <div className="p-5 sm:p-7 lg:p-8 flex flex-col">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-[3px] rounded text-white"
            style={{ background: accent }}
          >
            {entry.league}
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-light">
            {entry.season} · {entry.edition}
          </span>
        </div>

        <h2 className="mt-3 mb-0 font-display text-[30px] sm:text-[36px] font-black tracking-[-0.025em] leading-[1.05] text-black">
          {entry.jerseyName}
        </h2>
        <p className="mt-1 mb-0 text-[17px] font-semibold text-blue-dark">{entry.team}</p>

        {/* When it is on the field */}
        <div className="mt-5 rounded-lg border border-border bg-[#fafbfc] px-4 py-3">
          <p className="m-0 font-display text-[10.5px] font-extrabold uppercase tracking-[0.16em] text-steel">
            Worn {wornWhen(entry)}
          </p>
          <p className="mt-1 mb-0 text-[15px] font-semibold text-black leading-snug">
            {shortDow(entry.worn.date)}, {shortDate(entry.worn.date)} · {entry.worn.matchup}
          </p>
          <p className="mt-1 mb-0 text-[12.5px] leading-snug">
            <span className={`font-bold ${STATUS_STYLE[entry.worn.status] ?? "text-steel"}`}>{entry.worn.status}</span>
            {entry.worn.note && <span className="text-gray-medium"> · {entry.worn.note}</span>}
          </p>
        </div>

        {/* Jake's line. whyPlaceholder marks a drafted line still awaiting
            Jake's approval; it is a data flag only and renders like an
            approved line, so the public page never shows a placeholder. */}
        {entry.why && (
          <div className="mt-5 border-l-[3px] pl-4" style={{ borderColor: accent }}>
            <p className="m-0 font-display text-[10.5px] font-extrabold uppercase tracking-[0.16em] text-orange">
              Why it&rsquo;s great
            </p>
            <p className="mt-1.5 mb-0 text-[17px] leading-snug font-semibold text-black">{entry.why}</p>
          </div>
        )}

        {/* The story */}
        <h3 className="mt-6 mb-0 font-display text-[11px] font-extrabold uppercase tracking-[0.18em] text-steel">
          The story behind it
        </h3>
        <p className="mt-2 mb-0 text-[15.5px] text-[#2a2a2a] leading-relaxed">{entry.story}</p>

        <div className="mt-6 pt-5 border-t border-border flex flex-col gap-2.5">
          <Link
            prefetch={false}
            href={`/stories/${entry.scheduleSlug}`}
            className="text-[12px] font-bold uppercase tracking-[0.15em] text-orange no-underline hover:text-blue-dark"
          >
            {entry.scheduleLabel} →
          </Link>
          {entry.related.map((r) => (
            <Link
              key={r.slug}
              prefetch={false}
              href={`/stories/${r.slug}`}
              className="text-[14px] font-semibold text-black no-underline hover:text-orange leading-snug"
            >
              {r.label}
            </Link>
          ))}
        </div>
      </div>
    </article>
  );
}

/** One small tile in the This Week strip and the archive grid. */
export function JotdTile({ entry, active, href }: { entry: JotdEntry; active?: boolean; href: string }) {
  return (
    <Link prefetch={false} href={href} className="group block h-full no-underline">
      <article
        className={`story-card h-full bg-white rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 ${
          active ? "ring-2 ring-orange" : ""
        }`}
      >
        <div className="relative aspect-[4/5] overflow-hidden bg-[#f1f3f8]">
          <img
            src={entry.image}
            alt=""
            loading="lazy"
            decoding="async"
            className={`absolute inset-0 w-full h-full ${imgFitClass(entry)} transition-transform duration-500 ease-out group-hover:scale-[1.04]`}
            style={entry.imagePosition ? { objectPosition: entry.imagePosition } : undefined}
          />
        </div>
        <div className="p-3">
          <p className="m-0 font-display text-[10px] font-extrabold uppercase tracking-[0.14em]" style={{ color: active ? undefined : leagueColor(entry.league) }}>
            <span className={active ? "text-orange" : ""}>
              {shortDow(entry.date)} {shortDate(entry.date)}
            </span>
          </p>
          <p className="mt-1 mb-0 text-[13.5px] font-extrabold text-blue-dark leading-tight group-hover:text-orange transition-colors">
            {entry.jerseyName}
          </p>
          <p className="mt-0.5 mb-0 text-[12px] text-gray-medium leading-tight">{entry.teamShort}</p>
        </div>
      </article>
    </Link>
  );
}
