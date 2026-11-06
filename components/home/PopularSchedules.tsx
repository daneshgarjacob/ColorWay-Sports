import Link from "next/link";
import type { MyTeamCard } from "@/lib/myTeams";

// "Most-Searched Uniform Schedules This Week" (11/5): the team schedule posts
// that earn the most search traffic, for the clubs playing in the next few
// days. Schedule posts are the site's best-earning pages, so a homepage reader
// who taps one of these lands on a long page with room for ads. Plain white
// cards with the club's color as a left stripe, like the My Teams cards.

const LABEL = "font-display text-[11px] font-black tracking-[0.18em] uppercase";
const stripe = (c: string) => (c === "#0A1733" ? "#003087" : c);

export default function PopularSchedules({ teams, title, moreHref = "/#find-your-team" }: { teams: MyTeamCard[]; title: string; moreHref?: string }) {
  if (teams.length < 4) return null;
  return (
    <section className="max-w-[1200px] mx-auto px-5 pt-10">
      <div className="flex items-baseline justify-between border-b-2 border-black pb-2 mb-4">
        <h2 className={`${LABEL} text-black m-0`}>{title}</h2>
        <Link prefetch={false} href={moreHref} className="font-display text-[12px] font-extrabold text-orange shrink-0 ml-3">
          Every team &rarr;
        </Link>
      </div>
      <ul className="m-0 p-0 list-none grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {teams.map((t) => {
          const g = t.next!;
          const sure = g.confirmed || /^Uniform to come|^Bye week/.test(g.look);
          return (
            <li key={t.id}>
              <Link
                prefetch={false}
                href={t.href}
                className="group flex items-center gap-3 h-full rounded-xl bg-white border border-border hover:border-black/25 p-3"
                style={{ borderLeft: `5px solid ${stripe(t.color)}` }}
              >
                <span className="w-[52px] h-[52px] shrink-0 rounded-lg bg-[#f4f6f9] flex items-center justify-center overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g.img ?? t.logo} alt="" loading="lazy" className={g.img ? "w-[90%] h-[90%] object-contain" : "w-[70%] h-[70%] object-contain"} />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-1 text-[9px] font-black tracking-[0.14em] uppercase text-steel truncate">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={t.logo} alt="" className="w-3.5 h-3.5 object-contain" loading="lazy" />
                    {t.league === "CFB" ? "College" : t.league} · {g.when.replace(/ · Week \d+$/, "")} · {g.opp}
                  </span>
                  <span className="block font-display font-black text-[15px] leading-tight mt-0.5 text-black group-hover:text-orange">
                    {t.nickname} Uniform Schedule
                  </span>
                  <span className="block text-[12px] text-[#5b6474] mt-0.5 truncate">
                    {sure ? g.look : `Expected: ${g.look}`}
                    {g.confirmed ? " ✓" : ""}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
