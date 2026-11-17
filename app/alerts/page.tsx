import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TeamUniformAlerts from "@/components/TeamUniformAlerts";
import { getMyTeamCards } from "@/lib/myTeams";
import { TEAM_ALERTS_LIVE, type TeamAlertOption } from "@/lib/teamAlerts";

// /alerts (Jake 11/16): what Team Alerts are and the signup with every team.
// While the switch in lib/teamAlerts.ts is off this page is noindex, missing
// from the sitemap, linked from nowhere and says alerts are not live yet.

export const metadata: Metadata = {
  title: "Team Uniform Alerts: Know What Your Team Wears Before Every Game",
  description:
    "A short, free email before each of your team's games that says which uniform they are wearing. NFL, NBA, NHL, MLB and college football.",
  alternates: { canonical: "/alerts" },
  robots: TEAM_ALERTS_LIVE ? undefined : { index: false },
};

const LEAGUE_ORDER = ["nfl", "nba", "nhl", "cfb", "mlb"];

const STEPS = [
  {
    title: "Pick Your Teams",
    body: "Any NFL, NBA, NHL, MLB or college football team, up to five. Teams you follow in My Teams are already on the list.",
  },
  {
    title: "Get One Line Before The Game",
    body: "The morning of the game (the night before for early starts) you get the uniform in one sentence, and whether the team has confirmed it.",
  },
  {
    title: "See The Full Look On The Site",
    body: "Photos of both teams' uniforms, our grade and the rest of the season's schedule are one tap away.",
  },
];

const FAQ = [
  {
    q: "How Many Emails Will I Get?",
    a: "One per game for each team you pick, never more. A bye week or an off day means no email. You also get our Sunday newsletter.",
  },
  {
    q: "Can I Mute A Team?",
    a: "Yes. Every alert has a link to drop that team or stop alerts altogether, and you can unsubscribe from everything in one click.",
  },
  {
    q: "What If The Team Hasn't Announced Its Uniform?",
    a: "We say so. The email tells you whether the look is confirmed by the team or our expected call from the schedule. The site updates when the team confirms it.",
  },
  {
    q: "Is It Free?",
    a: "Yes, and we use your address only to send these emails and the newsletter.",
  },
];

export default function AlertsPage() {
  const options: TeamAlertOption[] = getMyTeamCards()
    .map((c) => ({ id: c.id, name: c.name, league: c.id.split(":")[0] }))
    .sort(
      (a, b) =>
        LEAGUE_ORDER.indexOf(a.league) - LEAGUE_ORDER.indexOf(b.league) || a.name.localeCompare(b.name)
    );

  return (
    <>
      <Header />
      <main className="max-w-[760px] mx-auto px-4 sm:px-5 py-10 sm:py-14">
        {!TEAM_ALERTS_LIVE && (
          <p className="mb-6 rounded-xl border border-[#0025CC]/20 bg-[#f5f8ff] px-4 py-3 text-[15px] font-bold text-[#0025CC]">
            Preview: Team Alerts are not live yet. Signing up saves your teams for when they start.
          </p>
        )}

        <p className="m-0 text-[13px] font-extrabold uppercase tracking-[0.16em] text-[#0025CC]">
          Team Uniform Alerts
        </p>
        <h1 className="mt-2 mb-0 text-[34px] sm:text-[48px] font-extrabold text-black leading-[1.05] tracking-tight">
          Know What Your Team Wears Before Every Game
        </h1>
        <p className="mt-4 mb-0 text-[19px] sm:text-[21px] text-[#3c4250] leading-snug">
          One short email before each game. It tells you the uniform in a sentence; the photos, the matchup and our
          grade are on the site.
        </p>

        {/* What an alert looks like: the real format, plain text, no images. */}
        <figure className="mt-8 mb-0">
          <div className="rounded-2xl border border-black/10 bg-white shadow-[0_2px_12px_rgba(10,23,51,0.06)] overflow-hidden">
            <div className="border-b border-black/[0.08] bg-[#fafbfd] px-5 py-3">
              <p className="m-0 text-[13px] font-bold uppercase tracking-[0.12em] text-[#5b6474]">Subject</p>
              <p className="m-0 mt-1 text-[18px] sm:text-[19px] font-extrabold text-black leading-snug">
                Lions vs. Bucs Sunday: The Black Alternates Are Expected
              </p>
            </div>
            <div className="px-5 py-5">
              <p className="m-0 text-[18px] text-black leading-snug">
                Detroit is expected in the black alternate at Ford Field, the second of three black games this season.
              </p>
              <p className="m-0 mt-4">
                <span className="inline-block rounded-lg bg-[#0025CC] px-5 py-3 text-[17px] font-extrabold text-white">
                  See The Full Uniform &rarr;
                </span>
              </p>
              <p className="m-0 mt-4 text-[14px] text-[#5b6474]">Mute Lions alerts · Unsubscribe</p>
            </div>
          </div>
          <figcaption className="mt-2 text-[14px] text-[#5b6474]">
            A sample alert for the Lions&rsquo; Week 11 game. That&rsquo;s the whole email.
          </figcaption>
        </figure>

        <TeamUniformAlerts options={options} preview={!TEAM_ALERTS_LIVE} />

        <section aria-labelledby="how-alerts-work">
          <h2 id="how-alerts-work" className="mt-0 mb-5 text-[26px] sm:text-[30px] font-extrabold text-black leading-tight">
            How It Works
          </h2>
          <ol className="m-0 p-0 list-none grid gap-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-4">
                <span className="flex-shrink-0 w-10 h-10 rounded-full bg-[#0025CC] text-white text-[18px] font-extrabold flex items-center justify-center">
                  {i + 1}
                </span>
                <span>
                  <span className="block text-[19px] font-bold text-black leading-snug">{s.title}</span>
                  <span className="block mt-1 text-[17px] text-[#3c4250] leading-snug">{s.body}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="alerts-faq" className="mt-12">
          <h2 id="alerts-faq" className="mt-0 mb-5 text-[26px] sm:text-[30px] font-extrabold text-black leading-tight">
            Questions
          </h2>
          <div className="grid gap-5">
            {FAQ.map((f) => (
              <div key={f.q}>
                <h3 className="m-0 text-[19px] font-bold text-black">{f.q}</h3>
                <p className="m-0 mt-1.5 text-[17px] text-[#3c4250] leading-snug">{f.a}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 mb-0 text-[15px] text-[#5b6474]">
            Read how we handle your email in our{" "}
            <a href="/privacy-policy" className="underline text-[#0025CC]">
              Privacy Policy
            </a>
            .
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
