import Link from "next/link";
import { leagueColor } from "@/lib/leagueColors";
import type { PostMeta } from "@/lib/posts";
import { getAuthor } from "@/lib/authors";
import type { Take, TonightLeague, StandsPhoto } from "@/lib/homeToday";

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
export function TodayBrief({ day, lines }: { day: string; lines: string[] }) {
  if (lines.length === 0) return null;
  return (
    <section className="max-w-[1200px] mx-auto px-5 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-5 border-b border-border pb-4">
        <div className="shrink-0">
          <span className={`${LABEL} text-black`}>{day}</span>
        </div>
        {/* Phones get three lines so the lead photo stays above the fold. */}
        <div className="text-[14.5px] leading-relaxed text-[#3a3f47] line-clamp-3 sm:line-clamp-none">
          {lines.map((l, i) => (
            <span key={i}>{l} </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── 2. Lead story, stacked (image over headline) to sit beside the rail ── */
export function LeadStory({ post }: { post: PostMeta }) {
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
      <h2 className="mt-2 font-display text-[26px] sm:text-[32px] font-extrabold leading-[1.12] tracking-tight text-black group-hover:text-orange transition-colors">
        {post.title}
      </h2>
      <p className="mt-3 text-[15.5px] leading-relaxed text-[#4b5260] max-w-[680px]">{post.excerpt}</p>
      <p className="mt-3 text-[12px] font-semibold text-steel">By {author.name}</p>
    </Link>
  );
}

/* ── 3. Jake's Takes rail ───────────────────────────────────────────────── */
export function JakesTakes({ takes }: { takes: Take[] }) {
  if (takes.length === 0) return null;
  return (
    <aside className="lg:border-l lg:border-border lg:pl-7">
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
    <section className="bg-[#0A1733] text-white">
      <div className="max-w-[1200px] mx-auto px-5 py-7">
        <div className="flex items-baseline justify-between mb-4">
          <span className={`${LABEL} text-white`}>Tonight&rsquo;s Uniforms</span>
          <span className="text-[11px] text-sky">Updated with every confirmation</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-0 md:divide-x md:divide-white/15">
          {leagues.map((l) => (
            <div key={l.league} className="md:px-6 md:first:pl-0 md:last:pr-0">
              <div className="flex items-baseline justify-between">
                <span className="font-display text-[13px] font-black tracking-[0.12em] uppercase">
                  {l.league} <span className="text-sky font-bold">· {l.label}</span>
                </span>
                <Link prefetch={false} href={l.href} className="text-[11px] font-bold text-sky hover:text-white">
                  Tracker &rarr;
                </Link>
              </div>
              <ul className="m-0 mt-2 p-0 list-none">
                {l.games.map((g, i) => (
                  <li key={i} className="border-t border-white/10 py-2.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-[14px] font-bold">
                        {g.away} <span className="text-sky font-medium">at</span> {g.home}
                      </span>
                      {g.time && <span className="shrink-0 text-[11px] text-sky">{g.time}</span>}
                    </div>
                    <div className="mt-0.5 text-[12px] text-white/70">
                      {g.awayLook || g.homeLook ? (
                        <>
                          {g.awayLook ?? "TBA"} <span className="text-white/40">vs</span> {g.homeLook ?? "TBA"}
                        </>
                      ) : (
                        "Uniforms TBA"
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              <p className="m-0 mt-1 text-[11px] text-sky">{l.confirmed}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── 5. From the Stands ────────────────────────────────────────────────── */
export function FromTheStands({ photo }: { photo: StandsPhoto }) {
  return (
    <Link prefetch={false} href={photo.href} className="group block">
      <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-4">
        <span className={`${LABEL} text-black`}>From the Stands</span>
        <span className="text-[11px] text-steel">Our photo · new every day</span>
      </div>
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-[#e9ebef]">
        <img
          src={photo.src}
          alt={photo.caption}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          style={photo.position ? { objectPosition: photo.position } : undefined}
        />
      </div>
      <p className="m-0 mt-3 text-[15px] font-bold leading-snug text-black group-hover:text-orange">{photo.caption}</p>
      <p className="m-0 mt-1 text-[12px] text-steel">{photo.where} · Photo by Jake Daneshgar</p>
    </Link>
  );
}
