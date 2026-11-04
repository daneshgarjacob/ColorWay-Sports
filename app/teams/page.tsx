import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import type { Metadata } from "next";
import { getMyTeamCards, teamPagePath } from "@/lib/myTeams";

// Every team page in one place, by league (Jake 11/4, ESPN's Teams tab).

export const metadata: Metadata = {
  title: "Teams: Every NFL, NBA, NHL, MLB and College Football Team's Uniforms",
  description: "Pick a team to see what it's wearing this week, its upcoming uniforms, its full schedule and every story.",
  alternates: { canonical: "/teams" },
};

export const revalidate = 86400;

const LEAGUES: { key: string; name: string }[] = [
  { key: "NFL", name: "NFL" }, { key: "CFB", name: "College Football" }, { key: "NBA", name: "NBA" },
  { key: "NHL", name: "NHL" }, { key: "MLB", name: "MLB" },
];

export default function TeamsPage() {
  const cards = getMyTeamCards();
  const LABEL = "font-display text-[11px] font-black tracking-[0.18em] uppercase";
  return (
    <>
      <Header />
      <main className="max-w-[1200px] mx-auto px-5 py-6">
        <h1 className="font-display font-black text-[28px] sm:text-[38px] leading-tight">Teams</h1>
        <div className="flex gap-2 my-4 overflow-x-auto">
          {LEAGUES.map((l) => (
            <a key={l.key} href={`#${l.key.toLowerCase()}`} className="shrink-0 rounded-full border border-border px-4 py-1.5 font-display text-[13px] font-extrabold">{l.name}</a>
          ))}
        </div>
        {LEAGUES.map((l) => (
          <section key={l.key} id={l.key.toLowerCase()} className="mb-8 scroll-mt-28">
            <div className={`${LABEL} border-b-2 border-black pb-2 mb-3`}>{l.name}</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {cards.filter((c) => c.league === l.key).sort((a, b) => a.name.localeCompare(b.name)).map((c) => (
                <Link prefetch={false} key={c.id} href={teamPagePath(c.id)} className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 hover:bg-black/[0.03]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.logo} alt="" className="w-7 h-7 object-contain shrink-0" loading="lazy" />
                  <span className="text-[14px] font-bold leading-tight">{c.name}</span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </main>
      <Footer />
    </>
  );
}
