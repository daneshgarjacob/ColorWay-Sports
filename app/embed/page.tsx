import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EmbedGenerator, { type GeneratorTeam } from "@/components/EmbedGenerator";
import { EMBED_LEAGUES } from "@/lib/embed/registry";
import { EMBED_HEIGHT, SITE } from "@/lib/embed/types";

// The pitch + snippet generator for the "What is my team wearing this week"
// widget. Shipped 2026-10-05; linked from the site footer.

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Free Team Uniform Widget for Your Site – ColorWay Sports",
  description:
    "Show what your team is wearing this week on your blog, fan site or forum. Free for any site, updates every week, one line of code.",
  alternates: { canonical: `${SITE}/embed` },
};

const SHOWCASE: { league: string; team: string; theme: "light" | "dark" }[] = [
  { league: "nfl", team: "saints", theme: "light" },
  { league: "nfl", team: "lions", theme: "dark" },
  { league: "nfl", team: "giants", theme: "light" },
];

export default function EmbedPage() {
  const teams: GeneratorTeam[] = EMBED_LEAGUES.flatMap((l) =>
    l.teams().map((t) => {
      const card = l.card(t.key, new Date());
      return {
        league: l.key,
        leagueLabel: l.label,
        key: t.key,
        name: t.name,
        sourceUrl: card?.sourceUrl ?? SITE,
      };
    }),
  );

  return (
    <>
      <Header />
      <main className="max-w-[1200px] mx-auto px-5 pt-12 pb-20" style={{ fontFamily: "var(--font-hanken), system-ui, sans-serif" }}>
        <section className="max-w-[720px]">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#2f6bed] mb-3">Free widget · NFL now, more leagues soon</p>
          <h1 className="text-[34px] sm:text-[44px] font-extrabold leading-[1.05] tracking-[-0.02em] text-[#0B1F4A]">
            What is your team wearing this week?
          </h1>
          <p className="mt-4 text-[17px] leading-relaxed text-[#46536A]">
            Put the answer on your blog, fan site or forum: helmet, jersey and pants for the next game, and whether the team
            has confirmed it. <strong className="text-[#0B1F4A]">Free for any site. Updates every week.</strong>
          </p>
        </section>

        <section className="mt-10 grid gap-5 md:grid-cols-3" aria-label="Examples">
          {SHOWCASE.map((s) => (
            <div
              key={`${s.league}-${s.team}`}
              className={`rounded-2xl p-5 ${s.theme === "dark" ? "bg-[#0A0F17]" : "bg-[#F2F4F7]"}`}
            >
              <iframe
                src={`/embed/${s.league}/${s.team}${s.theme === "dark" ? "?theme=dark" : ""}`}
                title={`${s.team} uniform this week`}
                width="100%"
                height={EMBED_HEIGHT}
                style={{ border: 0, display: "block", maxWidth: 400 }}
                loading="lazy"
              />
            </div>
          ))}
        </section>

        <section className="mt-16">
          <h2 className="text-[22px] font-extrabold tracking-[-0.01em] text-[#0B1F4A] mb-1">Get the code</h2>
          <p className="text-[14px] text-[#5F6B7D] mb-6">Pick your team and a theme, then paste the snippet anywhere that accepts HTML.</p>
          <EmbedGenerator teams={teams} />
        </section>

        <section className="mt-16 grid gap-8 sm:grid-cols-3 border-t border-[#E3E7EE] pt-10">
          {[
            {
              h: "Always this week",
              p: "The card rolls to the next game as soon as the last one is final, and skips bye weeks on its own.",
            },
            {
              h: "Confirmed or expected, never guessed",
              p: "Confirmed means the team announced it. Expected is our read from the team's rotation. Unknown pieces say TBA.",
            },
            {
              h: "No ads, no tracking",
              p: "The widget is a plain card with no ads, cookies or scripts from us. It loads from our CDN in a few kilobytes.",
            },
          ].map((f) => (
            <div key={f.h}>
              <h3 className="text-[15px] font-extrabold text-[#0B1F4A] mb-1.5">{f.h}</h3>
              <p className="text-[14px] leading-relaxed text-[#5F6B7D]">{f.p}</p>
            </div>
          ))}
        </section>
      </main>
      <Footer />
    </>
  );
}
