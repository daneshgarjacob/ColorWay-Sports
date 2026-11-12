import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AdvertiseHeroCards from "@/components/AdvertiseHeroCards";

// Advertise / media kit (Jake 11/5: "We have no media kit, so add that").
// Every number here is measured, with its window, so a brand can check it:
// GA4 for readers, Search Console for Google clicks, TikTok Studio for social.
// Jake 11/5: lead with the biggest TRUE numbers (page views, impressions,
// growth) and refresh them on the first Monday of every month so the page
// never looks stale. Never round up past what the dashboards show.
// Rates stay "on request" until Jake sets a price sheet.

export const metadata: Metadata = {
  title: "Advertise With ColorWay Sports: Media Kit, Audience and Partnerships",
  description:
    "Reach sports fans checking what their team wears this week. ColorWay Sports media kit: 167,000+ page views a month, 2.5 million Google search impressions in three months, 83% U.S. readers, and presenting partnerships on NFL, NBA and NHL uniform schedules.",
  alternates: { canonical: "https://www.colorwaysports.com/advertise" },
  openGraph: {
    title: "Advertise With ColorWay Sports",
    description: "Media kit: audience, placements and how to partner with ColorWay Sports.",
    url: "https://www.colorwaysports.com/advertise",
    type: "website",
  },
};

const AS_OF = "November 2026";
const EMAIL = "partnerships@colorwaysports.com";

const STATS = [
  { n: "167,000+", label: "Page views in the last 28 days", src: "Google Analytics, Oct 15 to Nov 11" },
  { n: "2.5M", label: "Google search impressions in 3 months", src: "Google Search Console" },
  { n: "117,000", label: "Visits in October 2026", src: "Google Analytics" },
  { n: "22x", label: "Growth in monthly visits since June", src: "Google Analytics" },
];

const AUDIENCE = [
  ["Country", "83% United States, 4% Canada"],
  ["Device", "64% phone, 35% desktop"],
  ["How they find us", "Mostly Google: fans searching what their team is wearing this week"],
  ["Top cities", "Chicago, Dallas, Los Angeles, Atlanta, Indianapolis"],
  ["Readers", "82,000 in the last 28 days, 153,000 Google clicks in 3 months"],
  ["Engagement", "About half of all visits are engaged sessions"],
];

const SOCIAL = [
  ["TikTok @colorway.sports", "1,200 followers, 475,000 views in the last 7 days (83% U.S.). Top posts: 134,000, 102,000 and 91,000 views"],
  ["Newsletter", "Sunday morning edition on beehiiv"],
  ["Also on", "Instagram, X, Facebook and LinkedIn"],
];

const PLACEMENTS = [
  {
    title: "Presenting partner on uniform schedules",
    body: "Your brand on our team uniform schedule pages, the most-read pages on the site. Fans open them before every game to see what their team is wearing. Available by league: NFL, NBA, NHL, college football.",
  },
  {
    title: "Weekly guide sponsorship",
    body: "\"Presented by\" on our weekly guides, such as NFL Week 9 Uniforms, which cover every game of the week and lead the homepage.",
  },
  {
    title: "Gear reviews",
    body: "An honest review of your jersey, hat or apparel, photographed by us, with a grade and buying links. We only review gear we have worn or handled.",
  },
  {
    title: "Newsletter sponsor",
    body: "A sponsor slot in the Sunday newsletter, written in our voice.",
  },
  {
    title: "TikTok and Instagram",
    body: "A post in our formats that already reach tens of thousands of fans: origin stories, logo quizzes and jersey rankings.",
  },
];

const wrap = "max-w-[1120px] mx-auto px-5";
const eyebrow = "text-[11px] uppercase tracking-[0.24em] font-bold";

export default function AdvertisePage() {
  return (
    <>
      <Header />
      <main style={{ fontFamily: "var(--font-sans)" }}>
        <section className="bg-[#0d1322] text-white">
          <div className={`${wrap} py-14 sm:py-20 grid lg:grid-cols-[1fr_320px] gap-10 items-center`}>
            <div>
            <p className={`${eyebrow} text-[#8fb0ff] mb-4`}>ColorWay Sports · Media kit · Updated {AS_OF}</p>
            <h1 className="text-[34px] sm:text-[54px] font-extrabold leading-[1.04] tracking-[-0.03em] max-w-[820px]" style={{ color: "#ffffff" }}>
              Reach fans the moment they check what their team is wearing.
            </h1>
            <p className="text-[17px] sm:text-[19px] text-white/70 leading-relaxed mt-6 max-w-[640px]">
              ColorWay Sports covers the visual side of sports: uniforms, logos and design. Our uniform
              schedules for every NFL, NBA, NHL and major college team are where fans go before every game,
              and we cover soccer kits from MLS to the Premier League.
            </p>
            <a href={`mailto:${EMAIL}?subject=Partnership%20with%20ColorWay%20Sports`} className="inline-block mt-8 bg-[#0025CC] hover:bg-[#001FA6] text-white font-bold px-6 py-3.5 rounded-lg transition-colors">
              Email {EMAIL}
            </a>
            </div>
            <AdvertiseHeroCards />
          </div>
        </section>

        <section className="bg-white border-b border-black/10">
          <div className={`${wrap} grid grid-cols-2 lg:grid-cols-4`}>
            {STATS.map((s) => (
              <div key={s.label} className="py-8 pr-4 border-b lg:border-b-0 border-black/10">
                <p className="text-[34px] sm:text-[44px] font-extrabold tracking-[-0.03em] leading-none">{s.n}</p>
                <p className="text-[14px] font-bold mt-2">{s.label}</p>
                <p className="text-[12px] text-black/50 mt-1">{s.src}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={`${wrap} py-12 grid grid-cols-1 lg:grid-cols-2 gap-10`}>
          <div>
            <p className={`${eyebrow} text-black/50 mb-3`}>Who reads us</p>
            <dl className="text-[15px]">
              {AUDIENCE.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-6 py-3 border-b border-black/10">
                  <dt className="text-black/55 shrink-0">{k}</dt>
                  <dd className="font-semibold text-right">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div>
            <p className={`${eyebrow} text-black/50 mb-3`}>Social and email</p>
            <dl className="text-[15px]">
              {SOCIAL.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-6 py-3 border-b border-black/10">
                  <dt className="text-black/55 shrink-0">{k}</dt>
                  <dd className="font-semibold text-right">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="bg-[#f4f6f9]">
          <div className={`${wrap} py-12`}>
            <p className={`${eyebrow} text-black/50 mb-3`}>Ways to partner</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {PLACEMENTS.map((p) => (
                <div key={p.title} className="bg-white rounded-2xl border border-black/10 p-6">
                  <p className="text-[18px] font-extrabold tracking-tight">{p.title}</p>
                  <p className="text-[15px] text-black/70 leading-relaxed mt-2">{p.body}</p>
                </div>
              ))}
            </div>
            <p className="text-[14px] text-black/60 mt-6">
              Every partnership is labeled as sponsored. Rates on request, by league and season.
            </p>
          </div>
        </section>

        <section className={`${wrap} py-12`}>
          <div className="rounded-2xl bg-[#0d1322] text-white p-8">
            <p className="text-[24px] font-extrabold tracking-tight" style={{ color: "#ffffff" }}>Let's talk.</p>
            <p className="text-[16px] text-white/70 mt-2">
              Jake Daneshgar, Founder and Editor in Chief. We reply within one business day.
            </p>
            <a href={`mailto:${EMAIL}?subject=Partnership%20with%20ColorWay%20Sports`} className="inline-block mt-5 bg-[#0025CC] hover:bg-[#001FA6] text-white font-bold px-6 py-3 rounded-lg transition-colors">
              {EMAIL}
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
