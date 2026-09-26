import type { Metadata } from "next";
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
// Public again (Jake, 2026-09-26: wants a Team Kits section on the site while
// the league outreach runs): indexable, in the footer and the sitemap. No sample
// designs up front; a team gets a design when it asks.

export const metadata: Metadata = {
  title: "Custom Rec League Jerseys for Any Sport: Hockey, Soccer, Softball, Basketball and More | ColorWay Sports",
  description:
    "Custom jerseys for adult rec and beer league teams in any sport: hockey, soccer, softball, baseball, basketball, flag football and more. Designed to a professional standard, from $85 per player with names and numbers included.",
  alternates: { canonical: "https://www.colorwaysports.com/team-kits" },
  openGraph: {
    title: "ColorWay Team Kits",
    description:
      "Custom team uniforms, designed to a professional standard.",
    url: "https://www.colorwaysports.com/team-kits",
    type: "website",
  },
};

// Jake's sample designs go here, one per kit: a front-view image in
// public/images/team-kits/ (run the image diet), a made-up team name, sport
// and colors. Never a real team's name or logo.
const KITS: { image: string; team: string; detail: string }[] = [];

// What goes into every kit. Craft, not credentials (Jake: "show that we have
// some design techniques and talk less about tracking the NFL, MLB, etc.").
const CRAFT = [
  { title: "A real color system", body: "A palette built for contrast on the ice, the field and the court, with exact color codes so every reorder matches." },
  { title: "Crest and typography", body: "A custom crest and a number set matched to your identity, legible from the stands." },
  { title: "Striping in proportion", body: "Hem, sleeve and yoke stripes drawn to the cut of the garment, the way pro jerseys are built." },
  { title: "Production-ready files", body: "Vector artwork and a full spec sheet go to the manufacturer, so what you approve is exactly what arrives." },
];

const PROMISES = [
  "Price shown before you pay",
  "Names and numbers included",
  "Size check for every player",
  "Single-jersey reorders",
];

// The spec card in the hero. A sample, drawn as a design brief rather than a
// picture of a jersey, which is how a real kit starts life.
const SPEC = {
  team: "Silver Lake Night Owls",
  sport: "Hockey · Home sweater",
  swatches: [
    { name: "Midnight", hex: "#14203D" },
    { name: "Lagoon", hex: "#2EC4B6" },
    { name: "Ice", hex: "#F4F7FB" },
  ],
  rows: [
    ["Cut", "Traditional, long sleeve, fight strap"],
    ["Fabric", "Sublimated, pro-weight mesh"],
    ["Striping", "Hem and sleeve, 3-band"],
    ["Names & numbers", "Included"],
  ],
};

const COMPARE = [
  ["Who designs it", "You, in a template builder", "A designer, around your team"],
  ["The price", "Behind a quote form", "Shown before you pay anything"],
  ["Names and numbers", "Often extra, per jersey", "Included"],
  ["Sizing", "Guess from a chart", "Every player checks the exact cut"],
  ["New player mid-season", "Rebuy a full set", "Order one matching jersey"],
];

const STEPS = [
  { title: "Tell us about your team", body: "Team name, colors, and anything you already have. Five minutes." },
  { title: "We design it", body: "Your first draft in about a week, with two rounds of changes." },
  { title: "Sizes and deposit", body: "Every player confirms a size, then a 50% deposit starts production." },
  { title: "Shipped to your captain", body: "Made to order and delivered about 3 to 4 weeks later." },
];

const FAQ = [
  {
    q: "Does reserving a spot cost anything?",
    a: "No. Reserving is free and doesn't commit you to buying. You pay nothing until you've approved your design and your price, and then a 50% deposit starts production.",
  },
  {
    q: "How much will our kits cost?",
    a: "Founding-team pricing starts at $85 per player, names and numbers included. Your exact price comes with your first design, before you pay anything.",
  },
  {
    q: "What sports do you make jerseys for?",
    a: "Any league that wears a jersey. Hockey and soccer are where we started, and we also design for softball, baseball, basketball, flag football, volleyball and more. If your league wears it, we can design it.",
  },
  {
    q: "Can you put an NHL, NFL or other pro team's logo on our jerseys?",
    a: "No. We only print logos your team owns or that we design for you. That keeps your kit, and us, out of legal trouble.",
  },
  {
    q: "What if we already have a logo?",
    a: "Send it over and we'll build the kit around it. We can also clean it up or redraw it.",
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

const wrap = "max-w-[1120px] mx-auto px-5";
const eyebrow = "text-[11px] uppercase tracking-[0.24em] font-bold";
const field =
  "w-full border border-white/15 rounded-lg px-3.5 py-3 text-[15px] bg-white/[0.06] text-white placeholder:text-white/35 focus:outline-none focus:border-[#8fb0ff] focus:bg-white/[0.09] transition-colors";
const label = "block text-[11px] font-bold uppercase tracking-[0.12em] text-white/55 mb-1.5";

export default async function TeamKitsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const reserved = (await searchParams).reserved === "true";

  return (
    <>
      <Header />
      <main style={{ fontFamily: "var(--font-sans)" }}>
        {/* Hero */}
        <section className="bg-[#0d1322] text-white relative overflow-hidden">
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(135deg, #ffffff 0 1px, transparent 1px 22px)",
            }}
          />
          <div className={`${wrap} relative grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-12 items-center py-16 sm:py-24`}>
            <div>
              <p className={`${eyebrow} text-[#8fb0ff] mb-4`}>ColorWay Sports · Team Kits</p>
              <h1 className="text-[38px] sm:text-[58px] font-extrabold leading-[1.03] tracking-[-0.03em]" style={{ color: "#ffffff" }}>
                Custom team uniforms, designed to a professional standard.
              </h1>
              <p className="text-[17px] sm:text-[19px] text-white/70 leading-relaxed mt-6 max-w-[560px]">
                Every kit starts from a blank page. We build your color system,
                crest, striping and numbers from scratch, then deliver
                production-ready artwork for league teams in any sport: hockey,
                soccer, softball, baseball, basketball, flag football and more.
              </p>
              <div className="flex flex-wrap gap-3 mt-8">
                <a href="#reserve" className="bg-[#2f6bed] hover:bg-[#2458c9] text-white font-bold px-6 py-3.5 rounded-lg transition-colors">
                  Reserve a spot, free
                </a>
                <a href="#how" className="border border-white/30 hover:border-white/60 text-white font-bold px-6 py-3.5 rounded-lg transition-colors">
                  How it works
                </a>
              </div>
            </div>

            {/* Spec card */}
            <div className="bg-white text-black rounded-2xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] overflow-hidden">
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-black/[0.07]">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/45">Kit spec · Sample</p>
                  <p className="text-[18px] font-extrabold tracking-tight mt-0.5">{SPEC.team}</p>
                  <p className="text-[13px] text-black/55">{SPEC.sport}</p>
                </div>
                <span className="bg-[#101522] text-white text-[11px] font-bold uppercase tracking-[0.14em] px-2.5 py-1.5 rounded-md">Draft 1</span>
              </div>
              <div className="grid grid-cols-3">
                {SPEC.swatches.map((s) => (
                  <div key={s.hex}>
                    <div className="h-[92px] border-b border-black/[0.06]" style={{ background: s.hex }} />
                    <div className="px-4 py-2.5">
                      <p className="text-[12px] font-bold">{s.name}</p>
                      <p className="text-[11px] text-black/45 font-mono">{s.hex}</p>
                    </div>
                  </div>
                ))}
              </div>
              <dl className="px-6 py-4 border-t border-black/[0.07] text-[13px]">
                {SPEC.rows.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 py-1.5 border-b border-dashed border-black/10 last:border-0">
                    <dt className="text-black/50">{k}</dt>
                    <dd className="font-semibold text-right">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        {/* Promise strip */}
        <section className="border-b border-black/10 bg-white">
          <div className={`${wrap} grid grid-cols-2 md:grid-cols-4`}>
            {PROMISES.map((p, i) => (
              <div key={p} className={`py-5 text-center text-[14px] font-bold ${i > 0 ? "md:border-l border-black/10" : ""}`}>
                <span className="text-[#2f6bed] mr-1.5">✓</span>{p}
              </div>
            ))}
          </div>
        </section>

        {/* Craft */}
        <section className="bg-[#f5f7fb]">
          <div className={`${wrap} py-16`}>
            <p className={`${eyebrow} text-[#2f6bed] mb-3`}>How we design</p>
            <h2 className="text-[30px] sm:text-[36px] font-extrabold tracking-[-0.02em] max-w-[680px] leading-tight">
              The same principles behind the best uniforms in sport, applied to yours.
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
              {CRAFT.map((c, i) => (
                <div key={c.title} className="bg-white rounded-xl p-6 border border-black/[0.06]">
                  <p className="text-[12px] font-extrabold text-[#2f6bed] tracking-[0.15em]">0{i + 1}</p>
                  <p className="font-extrabold text-[17px] mt-3 mb-1.5">{c.title}</p>
                  <p className="text-[14px] text-black/60 leading-relaxed">{c.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {KITS.length > 0 && (
          <section className="bg-white">
            <div className={`${wrap} py-16`}>
              <p className={`${eyebrow} text-[#2f6bed] mb-3`}>Lookbook</p>
              <h2 className="text-[30px] sm:text-[36px] font-extrabold tracking-[-0.02em] mb-8">Sample kits</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {KITS.map((k) => (
                  <div key={k.team} className="bg-[#f5f7fb] rounded-xl p-4 text-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={k.image} alt={`${k.team} sample kit by ColorWay Team Kits`} className="w-full h-[210px] object-contain" loading="lazy" />
                    <p className="text-[15px] font-extrabold mt-3">{k.team}</p>
                    <p className="text-[12px] text-black/55">{k.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Comparison */}
        <section className="bg-white">
          <div className={`${wrap} py-16`}>
            <p className={`${eyebrow} text-[#2f6bed] mb-3`}>The difference</p>
            <h2 className="text-[30px] sm:text-[36px] font-extrabold tracking-[-0.02em] max-w-[640px] leading-tight">
              Every uniform company says &quot;free design.&quot; You still end up in a template.
            </h2>
            <div className="mt-10 border border-black/10 rounded-2xl overflow-hidden text-[14px] sm:text-[15px]">
              <div className="grid grid-cols-[1fr_1fr_1fr] bg-[#f5f7fb] font-bold text-[12px] uppercase tracking-[0.1em] text-black/55">
                <div className="px-4 sm:px-6 py-3.5" />
                <div className="px-4 sm:px-6 py-3.5">Typical custom shop</div>
                <div className="px-4 sm:px-6 py-3.5 text-[#2f6bed]">ColorWay Team Kits</div>
              </div>
              {COMPARE.map(([k, them, us]) => (
                <div key={k} className="grid grid-cols-[1fr_1fr_1fr] border-t border-black/10">
                  <div className="px-4 sm:px-6 py-4 font-bold">{k}</div>
                  <div className="px-4 sm:px-6 py-4 text-black/50">{them}</div>
                  <div className="px-4 sm:px-6 py-4 font-semibold">{us}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="bg-[#f5f7fb] scroll-mt-20">
          <div className={`${wrap} py-16`}>
            <p className={`${eyebrow} text-[#2f6bed] mb-3`}>How it works</p>
            <h2 className="text-[30px] sm:text-[36px] font-extrabold tracking-[-0.02em]">From first message to kits in hand in about 6 weeks.</h2>
            <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-10">
              {STEPS.map((s, i) => (
                <li key={s.title} className="bg-white rounded-xl p-6 border border-black/[0.06]">
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[#101522] text-white text-[14px] font-black">{i + 1}</span>
                  <p className="font-extrabold text-[17px] mt-4 mb-1.5">{s.title}</p>
                  <p className="text-[14px] text-black/60 leading-relaxed">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Pricing */}
        <section className="bg-white">
          <div className={`${wrap} py-16 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center`}>
            <div>
              <p className={`${eyebrow} text-[#2f6bed] mb-3`}>Pricing</p>
              <h2 className="text-[30px] sm:text-[36px] font-extrabold tracking-[-0.02em] leading-tight">One number per player. No surprises at checkout.</h2>
              <p className="text-black/60 mt-4 leading-relaxed max-w-[480px]">
                Your exact price comes with your first design, before you pay
                anything. Minimum 10 players.
              </p>
            </div>
            <div className="border-2 border-[#101522] rounded-2xl p-7 sm:p-8">
              <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-black/50">Founding-team pricing</p>
              <p className="mt-2 flex items-baseline gap-2">
                <span className="text-[15px] font-semibold text-black/55">from</span>
                <span className="text-[56px] font-extrabold tracking-[-0.04em] leading-none">$85</span>
                <span className="text-[15px] font-semibold text-black/55">per player</span>
              </p>
              <ul className="mt-6 space-y-2.5 text-[15px]">
                {["Custom design, two rounds of changes", "Sublimated jersey for any sport", "Player name and number included", "Size check for every player", "Single-jersey reorders any time"].map((x) => (
                  <li key={x} className="flex gap-2.5"><span className="text-[#2f6bed] font-bold">✓</span>{x}</li>
                ))}
              </ul>
              <a href="#reserve" className="block text-center mt-7 bg-[#101522] hover:bg-black text-white font-bold py-3.5 rounded-lg transition-colors">
                Reserve a founding spot
              </a>
            </div>
          </div>
        </section>

        {/* Reserve */}
        <section id="reserve" className="bg-[#0d1322] text-white scroll-mt-20">
          <div className={`${wrap} py-16 sm:py-20 grid grid-cols-1 md:grid-cols-[1fr_1.05fr] gap-12`}>
            <div>
              <p className={`${eyebrow} text-[#8fb0ff] mb-3`}>Founding teams · Winter and spring 2027</p>
              <h2 className="text-[32px] sm:text-[40px] font-extrabold tracking-[-0.02em] leading-tight" style={{ color: "#ffffff" }}>
                Reserve a spot. Pay nothing today.
              </h2>
              <p className="text-white/70 mt-4 leading-relaxed">
                We&apos;re taking our first 10 teams for next season. Reserving is
                free and doesn&apos;t commit you to buying. It holds your place and gets you:
              </p>
              <ul className="mt-5 space-y-2.5 text-white/85 text-[15px]">
                {["Founding-team pricing, locked for your first order", "Your first design draft before anyone else", "Your kit featured on ColorWay Sports"].map((x) => (
                  <li key={x} className="flex gap-2.5"><span className="text-[#8fb0ff] font-bold">✓</span>{x}</li>
                ))}
              </ul>
            </div>

            {reserved ? (
              <div className="self-center bg-white/[0.06] border border-white/15 rounded-2xl p-8">
                <p className="text-[24px] font-extrabold" style={{ color: "#ffffff" }}>You&apos;re on the list.</p>
                <p className="text-white/70 mt-2">We&apos;ll email you within two days to start on your kit.</p>
              </div>
            ) : (
              <form action="https://formsubmit.co/jake@colorwaysports.com" method="POST" className="grid gap-3.5 bg-white/[0.03] border border-white/10 rounded-2xl p-5 sm:p-7">
                <input type="text" name="_honey" style={{ display: "none" }} />
                <input type="hidden" name="_captcha" value="false" />
                <input type="hidden" name="_template" value="table" />
                <input type="hidden" name="_subject" value="Team Kits reservation" />
                <input type="hidden" name="_next" value="https://www.colorwaysports.com/team-kits?reserved=true#reserve" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
                      <option className="text-black">Baseball</option>
                      <option className="text-black">Basketball</option>
                      <option className="text-black">Flag football</option>
                      <option className="text-black">Volleyball</option>
                      <option className="text-black">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className={label} htmlFor="tk-league">League, rink or field</label>
                    <input id="tk-league" name="league" className={field} />
                  </div>
                  <div>
                    <label className={label} htmlFor="tk-roster">Roster size</label>
                    <input id="tk-roster" name="roster" inputMode="numeric" className={field} />
                  </div>
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
                <p className="text-[12px] text-white/45 text-center">No payment. No obligation. We&apos;ll email you within two days.</p>
              </form>
            )}
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-white">
          <div className={`${wrap} py-16 max-w-[820px]`}>
            <p className={`${eyebrow} text-[#2f6bed] mb-3`}>Questions</p>
            <h2 className="text-[30px] sm:text-[36px] font-extrabold tracking-[-0.02em] mb-6">Before you reserve</h2>
            <div className="border-t border-black/10">
              {FAQ.map((f) => (
                <details key={f.q} className="group border-b border-black/10 py-5">
                  <summary className="flex justify-between items-center gap-4 cursor-pointer list-none text-[17px] font-bold">
                    {f.q}
                    <span className="text-[22px] font-light text-black/40 transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="text-black/60 leading-relaxed mt-3">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
