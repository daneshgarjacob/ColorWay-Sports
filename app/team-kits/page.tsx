import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// ColorWay Team Kits: custom uniforms for adult rec-league teams, designed by
// us and made to order by a factory that ships straight to the team.
//
// Jake, 2026-09-22: pre-sell first. Teams reserve a spot for free, and nothing
// is charged until a factory quote, a sample and a seller's permit exist. The
// form posts to formsubmit.co, the same free relay the contact page uses, so
// every reservation lands in jake@colorwaysports.com.
//
// Unlisted until Jake's kit designs are in: noindex, not in the nav or the
// sitemap. To launch, fill KITS, flip `robots` to index, and add it to the
// footer or nav.

export const metadata: Metadata = {
  title: "Team Kits: Custom Uniforms for Your League Team | ColorWay Sports",
  description:
    "Custom hockey and soccer uniforms for adult league teams, designed by the people who grade every uniform in pro sports. One price per player, shown up front.",
  alternates: { canonical: "https://www.colorwaysports.com/team-kits" },
  robots: { index: false, follow: true },
  openGraph: {
    title: "ColorWay Team Kits",
    description:
      "Custom uniforms for adult league teams, designed by the people who grade uniforms for a living.",
    url: "https://www.colorwaysports.com/team-kits",
    type: "website",
  },
};

// Jake's sample designs go here, one per kit: a front-view image in
// public/images/team-kits/ (run the image diet), a made-up team name, sport
// and colors. Never a real team's name or logo.
const KITS: { image: string; team: string; detail: string }[] = [];

// Real numbers only. GA4 30d on 2026-09-20: 124K views, 59K active users
// (about 5% of those are bots, so 50,000+ is the honest floor). The wear log
// held 1,000+ confirmed pro games on 2026-09-22.
const PROOF = [
  { big: "50,000+", small: "fans read ColorWay Sports every month" },
  { big: "1,000+", small: "pro games' uniforms logged and graded since July" },
  { big: "32 of 32", small: "NFL teams' full uniform schedules, published" },
];

const PROMISES = [
  {
    title: "A designer, not a template.",
    body: "Your kit is drawn around your team's name and colors by the same people who grade what the pros wear. Two rounds of changes included.",
  },
  {
    title: "One price, shown up front.",
    body: "Names and numbers included. No quote form, no surprise charge per jersey at checkout.",
  },
  {
    title: "Sizing sorted before you order.",
    body: "Every player checks a size guide for that exact cut before anything is made. New player mid-season? Order one matching jersey.",
  },
];

const STEPS = [
  { title: "Tell us about your team", body: "Name, colors, anything you already have. Five minutes." },
  { title: "We design it", body: "A first draft in about a week, then two rounds of changes." },
  { title: "Sizes and deposit", body: "Players confirm sizes, then a 50% deposit starts production." },
  { title: "Shipped to you", body: "Made to order and shipped to your captain about 3 to 4 weeks later." },
];

const FAQ = [
  {
    q: "Can you put an NHL, NFL or other pro team's logo on our jerseys?",
    a: "No. We only print logos your team owns or that we design for you. That keeps your kit, and us, out of legal trouble.",
  },
  {
    q: "What if we already have a logo?",
    a: "Send it over and we'll build the kit around it. We can also clean it up or redraw it.",
  },
  {
    q: "Does reserving a spot cost anything?",
    a: "No. Reserving is free and doesn't commit you to buying. You pay nothing until you've approved your design, and then a 50% deposit starts production.",
  },
  {
    q: "What's the minimum order?",
    a: "10 players. After that you can reorder a single jersey whenever you add a player.",
  },
  {
    q: "Can we return them?",
    a: "Custom kits are made to order, so they can't be returned. That's why every player confirms their size before anything is made.",
  },
];

const field =
  "w-full border border-white/15 rounded-lg px-3.5 py-3 text-[15px] bg-white/5 text-white placeholder:text-white/35 focus:outline-none focus:border-[#8fb0ff]";
const label = "block text-[11px] font-bold uppercase tracking-[0.12em] text-white/60 mb-1.5";

export default async function TeamKitsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const reserved = (await searchParams).reserved === "true";

  return (
    <>
      <Header />
      <main className="max-w-[1080px] mx-auto px-5" style={{ fontFamily: "var(--font-sans)" }}>
        <section className="pt-12 sm:pt-16 pb-10">
          <p className="text-[11px] uppercase tracking-[0.22em] font-bold text-[#2f6bed] mb-3">
            ColorWay Team Kits · Hockey and soccer
          </p>
          <h1 className="text-[34px] sm:text-[56px] font-extrabold text-black leading-[1.03] tracking-tight max-w-[820px]">
            Uniforms designed by the people who grade uniforms for a living.
          </h1>
          <p className="text-[17px] sm:text-[19px] text-black/60 leading-relaxed mt-5 max-w-[640px]">
            ColorWay Sports tracks and grades what every team in the NFL, MLB
            and Premier League wears, every game. Now we design kits for adult
            league teams: a real designer, one price per player shown up front,
            and a single matching jersey when a new player joins mid-season.
          </p>
          <a
            href="#reserve"
            className="inline-block mt-7 bg-[#2f6bed] hover:bg-[#2458c9] text-white font-bold px-6 py-3.5 rounded-lg transition-colors"
          >
            Reserve a spot for your team
          </a>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-12">
          {PROOF.map((p) => (
            <div key={p.big} className="bg-[#f5f7fb] rounded-xl px-5 py-5">
              <p className="text-[32px] font-extrabold tracking-tight text-black leading-none">{p.big}</p>
              <p className="text-[14px] text-black/60 mt-2 leading-snug">{p.small}</p>
            </div>
          ))}
        </section>

        {KITS.length > 0 && (
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 pb-14">
            {KITS.map((k) => (
              <div key={k.team} className="bg-[#f5f7fb] rounded-xl p-4 text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={k.image} alt={`${k.team} sample kit by ColorWay Team Kits`} className="w-full h-[190px] object-contain" loading="lazy" />
                <p className="text-[15px] font-extrabold mt-3">{k.team}</p>
                <p className="text-[12px] text-black/55">{k.detail}</p>
              </div>
            ))}
          </section>
        )}

        <section className="border-t border-black/10 py-12">
          <h2 className="text-[28px] font-extrabold tracking-tight mb-2">What&apos;s different</h2>
          <p className="text-black/60 mb-8 max-w-[640px]">
            Every uniform company says &quot;free design.&quot; You still end up in a template.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PROMISES.map((p, i) => (
              <div key={p.title}>
                <p className="text-[12px] font-extrabold text-[#2f6bed] tracking-[0.15em] mb-2">0{i + 1}</p>
                <p className="text-[18px] font-bold mb-1.5">{p.title}</p>
                <p className="text-[15px] text-black/60 leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-black/10 py-12">
          <h2 className="text-[28px] font-extrabold tracking-tight mb-2">How it works</h2>
          <p className="text-black/60 mb-8">About 5 to 6 weeks from your first message to kits in hand.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((s, i) => (
              <div key={s.title} className="border-t-[3px] border-black pt-3">
                <p className="font-bold mb-1">{i + 1}. {s.title}</p>
                <p className="text-[14px] text-black/60 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
          <p className="text-[14px] text-black/60 mt-8">
            See what we do every day:{" "}
            <Link href="/nfl-tracker" className="text-[#2f6bed] font-semibold hover:underline">the NFL uniform tracker</Link>
            {" · "}
            <Link href="/mlb-tracker" className="text-[#2f6bed] font-semibold hover:underline">the MLB uniform tracker</Link>
            {" · "}
            <Link href="/stories" className="text-[#2f6bed] font-semibold hover:underline">every story</Link>
          </p>
        </section>

        <section id="reserve" className="py-12 scroll-mt-20">
          <div className="bg-[#101522] text-white rounded-2xl p-6 sm:p-11 grid grid-cols-1 md:grid-cols-[1.1fr_1fr] gap-10">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] font-bold text-[#8fb0ff] mb-3">
                Founding teams · Winter and spring 2027
              </p>
              <h2 className="text-[28px] sm:text-[34px] font-extrabold tracking-tight leading-tight" style={{ color: "#ffffff" }}>
                Reserve a spot. Pay nothing today.
              </h2>
              <p className="text-white/70 mt-3 leading-relaxed">
                We&apos;re taking our first 10 teams for next season. Reserving is
                free and doesn&apos;t commit you to buying. It holds your place and gets you:
              </p>
              <ul className="list-disc pl-5 mt-4 space-y-1.5 text-white/85 text-[15px]">
                <li>Founding-team pricing, locked for your first order</li>
                <li>Your first design draft before anyone else</li>
                <li>Your kit featured on ColorWay Sports, with a grade</li>
              </ul>
            </div>

            {reserved ? (
              <div className="self-center bg-white/5 border border-white/15 rounded-xl p-6">
                <p className="text-[20px] font-extrabold" style={{ color: "#ffffff" }}>You&apos;re on the list.</p>
                <p className="text-white/70 mt-2">We&apos;ll email you within two days to talk about your kit.</p>
              </div>
            ) : (
              <form action="https://formsubmit.co/jake@colorwaysports.com" method="POST" className="grid gap-3">
                <input type="text" name="_honey" style={{ display: "none" }} />
                <input type="hidden" name="_captcha" value="false" />
                <input type="hidden" name="_template" value="table" />
                <input type="hidden" name="_subject" value="Team Kits reservation" />
                <input type="hidden" name="_next" value="https://www.colorwaysports.com/team-kits?reserved=true#reserve" />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={label} htmlFor="tk-team">Team name</label>
                    <input id="tk-team" name="team" required className={field} />
                  </div>
                  <div>
                    <label className={label} htmlFor="tk-sport">Sport</label>
                    <select id="tk-sport" name="sport" className={field}>
                      <option className="text-black">Hockey</option>
                      <option className="text-black">Soccer</option>
                      <option className="text-black">Softball</option>
                      <option className="text-black">Other</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={label} htmlFor="tk-league">League or rink</label>
                    <input id="tk-league" name="league" className={field} />
                  </div>
                  <div>
                    <label className={label} htmlFor="tk-roster">Roster size</label>
                    <input id="tk-roster" name="roster" inputMode="numeric" className={field} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={label} htmlFor="tk-name">Your name</label>
                    <input id="tk-name" name="name" required className={field} />
                  </div>
                  <div>
                    <label className={label} htmlFor="tk-email">Email</label>
                    <input id="tk-email" type="email" name="email" required className={field} />
                  </div>
                </div>
                <div>
                  <label className={label} htmlFor="tk-when">When do you need them?</label>
                  <select id="tk-when" name="timing" className={field}>
                    <option className="text-black">Next season start</option>
                    <option className="text-black">Within 2 months</option>
                    <option className="text-black">No rush, just curious</option>
                  </select>
                </div>
                <div>
                  <label className={label} htmlFor="tk-notes">Anything we should know</label>
                  <textarea id="tk-notes" name="notes" rows={3} placeholder="Colors, a logo you already have, a vibe" className={`${field} resize-none`} />
                </div>
                <button type="submit" className="mt-1 bg-[#2f6bed] hover:bg-[#2458c9] text-white font-bold py-3.5 rounded-lg transition-colors">
                  Reserve our spot
                </button>
                <p className="text-[12px] text-white/45">No payment. No obligation. We&apos;ll email you within two days.</p>
              </form>
            )}
          </div>
        </section>

        <section className="border-t border-black/10 py-12 max-w-[760px]">
          <h2 className="text-[28px] font-extrabold tracking-tight mb-2">Questions</h2>
          {FAQ.map((f) => (
            <div key={f.q} className="mt-6">
              <h3 className="text-[17px] font-bold mb-1">{f.q}</h3>
              <p className="text-black/60 leading-relaxed">{f.a}</p>
            </div>
          ))}
        </section>
      </main>
      <Footer />
    </>
  );
}
