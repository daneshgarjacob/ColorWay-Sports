import Link from "next/link";
import { imgFitClass, type JotdEntry } from "@/lib/jerseyOfTheDay";
import { leagueColor } from "@/lib/leagueColors";
import type { PostMeta } from "@/lib/posts";
import { getAuthor } from "@/lib/authors";
import type { Take, TonightLeague } from "@/lib/homeToday";

// Homepage refresh (shipped 10/5). Pieces of the proposed homepage. Every one of
// them is fed by data the daily passes already write, so the page reads
// differently each morning without anyone pinning anything.

function ago(when: string): string {
  const mins = Math.max(1, Math.round((Date.now() - Date.parse(when)) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? "Yesterday" : `${d} days ago`;
}

const LABEL = "font-display text-[11px] font-black tracking-[0.18em] uppercase";

/* ── 1. Dateline + Today's brief ─────────────────────────────────────────── */
// About three lines of 14.5px Inter in the 350px text column of a 390px phone.
const PHONE_BRIEF_CHARS = 150;

export function TodayBrief({ day, lines }: { day: string; lines: string[] }) {
  if (lines.length === 0) return null;
  return (
    <section className="max-w-[1200px] mx-auto px-5 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-5 border-b border-border pb-4">
        <div className="shrink-0">
          <span className={`${LABEL} text-black`}>{day}</span>
        </div>
        {/* Phones keep the brief short so the lead photo stays above the fold,
            but by whole sentences: a line-clamp cut the last one off mid-word.
            The first sentence always shows; later ones show on phones only
            while the total stays within about three lines at 390px. */}
        <div className="text-[14.5px] leading-relaxed text-[#3a3f47]">
          {lines.map((l, i) => {
            const before = lines.slice(0, i + 1).join(" ").length;
            const phone = i === 0 || before <= PHONE_BRIEF_CHARS;
            return (
              <span key={i} className={phone ? undefined : "hidden sm:inline"}>
                {l}{" "}
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ── 2. Lead story, stacked (image over headline) to sit beside the rail ── */
export function LeadStory({ post, compact = false }: { post: PostMeta; compact?: boolean }) {
  const author = getAuthor(post.author);
  return (
    <Link prefetch={false} href={`/stories/${post.slug}`} className="group block">
      <div className="relative aspect-[3/2] overflow-hidden rounded-xl bg-[#0b1730]">
        {post.coverImage && (
          <img
            src={post.coverImage}
            alt=""
            loading="eager"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            style={post.coverImagePosition ? { objectPosition: post.coverImagePosition } : undefined}
          />
        )}
      </div>
      <div className="mt-4 flex items-center gap-2">
        {post.logoSrc2 && <img src={post.logoSrc2} alt="" className="h-[20px] w-auto" />}
        <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: leagueColor(post.category) }}>
          {post.category}
        </span>
        {post.kicker && (
          <span className="text-[11px] font-bold uppercase tracking-widest text-steel">· {post.kicker}</span>
        )}
      </div>
      <h2 className={`mt-2 font-display ${compact ? "text-[21px] sm:text-[22px]" : "text-[26px] sm:text-[32px]"} font-extrabold leading-[1.12] tracking-tight text-black group-hover:text-orange transition-colors`}>
        {post.title}
      </h2>
      <p className={`mt-3 ${compact ? "text-[14px]" : "text-[15.5px]"} leading-relaxed text-[#4b5260] max-w-[680px]`}>{post.excerpt}</p>
      <p className="mt-3 text-[12px] font-semibold text-steel">By {author.name}</p>
    </Link>
  );
}

/* ── 3. Jake's Takes rail ───────────────────────────────────────────────── */
export function JakesTakes({ takes, jotd }: { takes: Take[]; jotd?: JotdEntry | null }) {
  if (takes.length === 0 && !jotd) return null;
  return (
    <aside className="lg:border-l lg:border-border lg:pl-7">
      {jotd && (
        <Link prefetch={false} href="/jersey-of-the-day" className="group mb-6 flex gap-4 no-underline rounded-xl border border-border bg-white p-3">
          <div className="relative w-[92px] shrink-0 aspect-[4/5] rounded-lg bg-[#f1f3f8] overflow-hidden">
            <img src={jotd.image} alt={jotd.imageAlt} loading="lazy" decoding="async" className={`absolute inset-0 w-full h-full ${imgFitClass(jotd)}`} style={jotd.imagePosition ? { objectPosition: jotd.imagePosition } : undefined} />
          </div>
          <div className="min-w-0">
            <p className="m-0 font-display text-[10px] font-extrabold uppercase tracking-[0.16em] text-orange">Jersey of the Day</p>
            <p className="mt-1 mb-0 font-display text-[17px] font-extrabold text-black leading-tight group-hover:text-orange transition-colors">{jotd.jerseyName}</p>
            <p className="mt-0.5 mb-0 text-[12px] font-semibold text-steel">{jotd.teamShort} &middot; {jotd.worn.matchup.split(",")[0]}</p>
            <p className="mt-1.5 mb-0 text-[13px] text-[#3a3f47] leading-snug line-clamp-2">{jotd.why}</p>
          </div>
        </Link>
      )}
      <div className="flex items-center justify-between border-b-2 border-black pb-2">
        <span className={`${LABEL} text-black`}>Jake&rsquo;s Takes</span>
        <Link prefetch={false} href="/authors/jake-daneshgar" className="font-display text-[12px] font-extrabold text-orange">
          All &rarr;
        </Link>
      </div>
      <ol className="m-0 p-0 list-none">
        {takes.map((t) => (
          <li key={t.key} className="border-b border-border py-4 last:border-b-0">
            <Link prefetch={false} href={t.href} className="group block no-underline">
              <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.14em]">
                <span style={{ color: leagueColor(t.tag) }}>{t.tag}</span>
                <span className="text-steel">· {t.kind} · {ago(t.when)}</span>
              </div>
              {t.kind === "Wire" ? (
                <>
                  <p className="m-0 mt-2 text-[15px] font-semibold leading-snug text-black line-clamp-3">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <p className="m-0 mt-1.5 text-[12.5px] leading-snug text-steel group-hover:text-orange line-clamp-2">
                    {t.headline}
                  </p>
                </>
              ) : (
                <>
                  <p className="m-0 mt-2 text-[15.5px] font-extrabold leading-snug text-black group-hover:text-orange line-clamp-3">
                    {t.headline}
                  </p>
                  <p className="m-0 mt-1.5 text-[12px] font-semibold text-steel">By Jake Daneshgar</p>
                </>
              )}
            </Link>
          </li>
        ))}
      </ol>
    </aside>
  );
}

/* ── 4. Tonight strip ──────────────────────────────────────────────────── */
export function TonightStrip({ leagues }: { leagues: TonightLeague[] }) {
  if (leagues.length === 0) return null;
  return (
    <section className="max-w-[1200px] mx-auto px-5">
      <div className="bg-white border border-border rounded-2xl px-5 sm:px-6 pt-[18px] pb-5">
        <div className="flex items-baseline justify-between mb-4">
          <span className={`${LABEL} text-black`}>Tonight&rsquo;s Uniforms</span>
          <span className="text-[11px] text-[#8A8F98]">Updated with every confirmation</span>
        </div>
        <div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-0 md:divide-x md:divide-border min-w-0">
            {leagues.map((l) => (
              <div key={l.league} className="md:px-5 md:first:pl-0 md:last:pr-0 min-w-0">
                <div className="flex items-baseline justify-between">
                  <span className="font-display text-[13px] font-black tracking-[0.12em] uppercase text-blue-dark">
                    {l.league} <span className="text-[#8A8F98] font-bold">&middot; {l.label}</span>
                  </span>
                  <Link prefetch={false} href={l.href} className="text-[11px] font-bold text-orange hover:underline">
                    Tracker &rarr;
                  </Link>
                </div>
                <ul className="m-0 mt-2 p-0 list-none">
                  {l.games.map((g, i) => (
                    <li key={i} className="border-t border-border py-2.5">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-[14px] font-bold text-blue-dark">
                          {g.away} <span className="text-[#8A8F98] font-medium">at</span> {g.home}
                        </span>
                        {g.time && <span className="shrink-0 text-[11px] text-[#8A8F98]">{g.time}</span>}
                      </div>
                      <div className="mt-0.5 text-[12px] text-[#5b6474]">
                        {g.awayLook || g.homeLook ? (
                          <>
                            {g.awayLook ?? "TBA"} <span className="text-[#aab0ba]">vs</span> {g.homeLook ?? "TBA"}
                          </>
                        ) : (
                          "Uniforms TBA"
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
                <p className="m-0 mt-1 text-[11px] text-[#8A8F98]">{l.confirmed}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

