import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import type { Metadata } from "next";
import fs from "fs";
import path from "path";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

/** Newest logged day (on or before today, Eastern) and its game count, plus total games, read from the tracker post. */
type MiniGame = { away: string; home: string; imgs: { src: string; alt: string }[] };
function trackerStats(slug: string): { day: string; games: number; total: number; list: MiniGame[] } | null {
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), "content/posts", `${slug}.md`), "utf8");
    const body = raw.split(/^---$/m).slice(2).join("---");
    const today = new Date(new Date().toLocaleDateString("en-US", { timeZone: "America/New_York" }));
    let best: { t: number; day: string; games: number; part: string } | null = null;
    let total = 0;
    const parts = body.split(/^## /m).slice(1);
    for (const part of parts) {
      const head = part.split("\n")[0].trim();
      const games = (part.match(/^### /gm) || []).length;
      total += games;
      const m = /^(\w+), (\w+) (\d{1,2})$/.exec(head);
      if (!m || !games) continue;
      const mi = MONTHS.indexOf(m[2]);
      if (mi < 0) continue;
      const year = mi < 6 ? 2027 : 2026;
      const t = new Date(year, mi, Number(m[3])).getTime();
      if (t > today.getTime()) continue;
      if (!best || t > best.t) best = { t, day: head, games, part };
    }
    if (!best) return null;
    const list: MiniGame[] = [];
    for (const g of best.part.split(/^### /m).slice(1)) {
      const title = g.split("\n")[0].trim();
      const mm = /^(.+?) at (.+)$/.exec(title);
      if (!mm) continue;
      const imgs = [...g.matchAll(/<img src="(\/images\/posts\/[^"]+-cut\.webp)" alt="([^"]*)"/g)].slice(0, 2).map((x) => ({ src: x[1], alt: x[2] }));
      if (imgs.length === 2) list.push({ away: mm[1], home: mm[2], imgs });
    }
    return { day: best.day, games: best.games, total, list };
  } catch {
    return null;
  }
}

// Trackers hub (Jake 11/13): the phone quick bar's "Trackers" tab lands here.
// Tracker pages hold readers longest (about 1m15s vs a 44s site average), so
// they get a front door of their own. In-season leagues first.

export const metadata: Metadata = {
  title: "Uniform Trackers: What Every NFL, NBA, NHL And MLB Team Wore, Every Game",
  description:
    "Every uniform every team wore, logged game by game: the NFL, NBA and NHL uniform trackers, team-by-team calendars, and the 2026 MLB season in full.",
  alternates: { canonical: "/trackers" },
};

const TRACKERS = [
  { league: "NFL", slug: "nfl-uniform-tracker-2026", logo: "/logos/leagues/nfl.png", color: "#013369", blurb: "Every game, helmet to pants, with a grade for every matchup.", href: "/stories/nfl-uniform-tracker-2026", calendar: "/nfl-tracker", status: "Live" },
  { league: "NBA", slug: "nba-uniform-tracker-2026-27", logo: "/logos/leagues/nba.png", color: "#C8102E", blurb: "Every jersey every team wears, logged the morning after.", href: "/stories/nba-uniform-tracker-2026-27", calendar: "/nba-tracker", status: "Live" },
  { league: "NHL", slug: "nhl-uniform-tracker-2026-27", logo: "/logos/leagues/nhl.png", color: "#111111", blurb: "Every sweater, including every Hometown Remix debut.", href: "/stories/nhl-uniform-tracker-2026-27", calendar: "/nhl-tracker", status: "Live" },
  { league: "MLB", slug: "mlb-uniform-tracker-2026", logo: "/logos/leagues/mlb.png", color: "#041E42", blurb: "The full 2026 season, through the Brewers' World Series.", href: "/stories/mlb-uniform-tracker-2026", calendar: "/mlb-tracker", status: "Final" },
];

/** "Los Angeles Kings" -> "Kings", keeping two-word nicknames. */
const TWO = ["Red Sox", "White Sox", "Blue Jays", "Maple Leafs", "Golden Knights", "Blue Jackets", "Red Wings", "Trail Blazers"];
const short = (n: string) => TWO.find((x) => n.endsWith(x)) ?? n.split(" ").slice(-1)[0];

// Re-read the tracker posts at most hourly so "Latest" stays current without a deploy.
export const revalidate = 3600;

export default function TrackersPage() {
  return (
    <>
      <Header />
      <main className="max-w-[900px] mx-auto px-5 pt-8 pb-14">
        <div className="text-[11px] font-black tracking-[0.18em] uppercase text-steel">Every Game, Logged</div>
        <h1 className="font-display font-black text-[30px] sm:text-[40px] leading-[1.05] mt-1">Uniform Trackers</h1>
        <p className="text-[16px] text-[#3c4250] mt-3 max-w-[620px]">
          What every team actually wore, every game, logged the morning after. Pick a league, or open the calendars to see one team&apos;s whole season.
        </p>
        <div className="grid gap-4 mt-7">
          {TRACKERS.map((t) => {
            const st = trackerStats(t.slug);
            return (
            <div key={t.league} className="rounded-2xl border border-border bg-white overflow-hidden">
              <div className="h-1.5" style={{ background: t.color }} />
              <div className="p-5 relative">
                {/* eslint-disable-next-line @next/next/no-img-element -- public/ images are served raw site-wide */}
                <img src={t.logo} alt="" className="absolute left-5 top-5 w-9 h-9 object-contain" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 pl-12 min-h-[36px]">
                    <h2 className="font-display text-[20px] font-black whitespace-nowrap">{t.league} Uniform Tracker</h2>
                    {t.status === "Live" ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#E11D2E]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#E11D2E]" />Live
                      </span>
                    ) : (
                      <span className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-steel">{t.status}</span>
                    )}
                  </div>
                  <p className="text-[14px] text-steel mt-2">{t.blurb}</p>
                  {st && (
                    <p className="text-[13px] font-semibold text-[#0b0b0f] mt-1.5">
                      Latest: {st.day} · {st.games} {st.games === 1 ? "game" : "games"}
                      <span className="text-steel font-medium"> · {st.total.toLocaleString()} logged this season</span>
                    </p>
                  )}
                  {st && st.list.length > 0 && (
                    <div className="mt-3 -mr-5 pr-5 flex gap-2.5 overflow-x-auto snap-x pb-1">
                      {st.list.slice(0, 8).map((g) => (
                        <Link prefetch={false} key={g.away + g.home} href={t.href} className="snap-start shrink-0 w-[124px] rounded-xl border border-border bg-[#f6f7fa] p-2 no-underline hover:border-black/25">
                          <div className="flex items-end justify-center gap-1 h-[74px]">
                            {g.imgs.map((im) => (
                              /* eslint-disable-next-line @next/next/no-img-element -- public/ images are served raw site-wide */
                              <img key={im.src} src={im.src} alt={im.alt} loading="lazy" decoding="async" className="h-full w-[56px] object-contain" />
                            ))}
                          </div>
                          <div className="mt-1.5 text-center text-[11px] font-extrabold leading-tight text-[#0b0b0f]">
                            {short(g.away)} <span className="text-steel font-semibold">at</span> {short(g.home)}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-4 mt-2 text-[13px] font-bold">
                    <Link prefetch={false} href={t.href} className="text-[#0025CC] hover:underline">Open the tracker →</Link>
                    <Link prefetch={false} href={t.calendar} className="text-[#0b0b0f]/70 hover:text-[#0025CC]">Team calendars</Link>
                  </div>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      </main>
      <Footer />
    </>
  );
}
