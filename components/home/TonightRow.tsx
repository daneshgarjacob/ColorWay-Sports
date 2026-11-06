import Link from "next/link";
import { LEAGUE_HREF, LEAGUE_LOGO, LEAGUE_NAME, ORDER, type Matchup } from "@/lib/tonight";

// The homepage's one Tonight row (Jake 11/4): a column per league with each
// game and both teams' jerseys by name. The league name opens that league's
// page; "more" opens /tonight at that league, where the jerseys are pictured.

// 11/5: five games a league and every league with games (was 4 and 3), and
// each game now opens the home club's uniform schedule post, the page that
// pictures both jerseys' season, instead of being plain text.
const PER_LEAGUE = 5;

export default function TonightRow({ games, label }: { games: Matchup[]; label: string }) {
  if (!games.length) return null;
  const leagues = ORDER.filter((l) => games.some((g) => g.league === l));
  return (
    <section className="max-w-[1200px] mx-auto px-5 pt-8">
      <div className="bg-white border border-border rounded-2xl px-5 sm:px-6 pt-[18px] pb-5">
        <div className="flex items-baseline justify-between mb-4">
          <span className="font-display text-[11px] font-black tracking-[0.18em] uppercase text-black">Tonight&rsquo;s Uniforms &middot; {label}</span>
          <Link prefetch={false} href="/tonight" className="font-display text-[12px] font-extrabold text-orange">Every game &rarr;</Link>
        </div>
        <div className={`grid grid-cols-1 gap-6 md:gap-y-6 lg:gap-y-0 md:divide-x md:divide-border ${leagues.length >= 4 ? "md:grid-cols-2 lg:grid-cols-4" : leagues.length === 3 ? "md:grid-cols-3" : leagues.length === 2 ? "md:grid-cols-2" : ""}`}>
          {leagues.slice(0, 4).map((l) => {
            const all = games.filter((g) => g.league === l);
            return (
              <div key={l} className="md:px-5 md:first:pl-0 md:last:pr-0 min-w-0">
                <div className="flex items-center justify-between">
                  <Link prefetch={false} href={LEAGUE_HREF[l]} className="flex items-center gap-2 font-display text-[13px] font-black tracking-[0.12em] uppercase text-blue-dark hover:text-orange">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={LEAGUE_LOGO[l]} alt="" className="w-5 h-5 object-contain" />
                    {LEAGUE_NAME[l] ?? l}
                  </Link>
                  <Link prefetch={false} href={LEAGUE_HREF[l]} className="text-[11px] font-bold text-orange hover:underline">
                    {`${l} page →`}
                  </Link>
                </div>
                <ul className="m-0 mt-2 p-0 list-none">
                  {all.slice(0, PER_LEAGUE).map((g) => (
                    <li key={g.home.id} className="border-t border-border">
                      <Link prefetch={false} href={g.home.href} className="group block py-2.5">
                      {g.away && g.away !== g.home ? (
                        <>
                          <div className="text-[14px] font-bold text-blue-dark group-hover:text-orange">
                            {g.away.nickname} <span className="text-[#8A8F98] font-medium">at</span> {g.home.nickname}
                          </div>
                          <div className="mt-0.5 text-[12px] text-[#5b6474]">
                            {g.away.next?.look} <span className="text-[#aab0ba]">vs</span> {g.home.next?.look}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-[14px] font-bold text-blue-dark group-hover:text-orange">
                            {g.home.nickname} <span className="text-[#8A8F98] font-medium">{g.home.next?.opp}</span>
                          </div>
                          <div className="mt-0.5 text-[12px] text-[#5b6474]">{g.home.next?.look}</div>
                        </>
                      )}
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link prefetch={false} href={`/tonight#${l.toLowerCase()}`} className="inline-block mt-1 text-[12px] font-bold text-orange hover:underline">
                  {all.length > PER_LEAGUE ? `All ${all.length} ${l} games with jerseys →` : `See the ${l} jerseys →`}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
