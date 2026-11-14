import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StoryCard from "@/components/StoryCard";
import MvSlot from "@/components/MvSlot";
import Link from "next/link";
import type { Metadata } from "next";
import { getAllPostsByDate, type PostMeta } from "@/lib/posts";

// Jake 11/13: the site should be where people go for everything uniform, court
// and field related. This hub collects every court, field, end zone, turf,
// ballpark and stadium story we have, by surface, newest first. It fills on its
// own: any new story whose slug names one of these surfaces lands here.

export const metadata: Metadata = {
  title: "Courts, Fields And Stadiums: Every NBA Court, End Zone And Ballpark Design",
  description:
    "Every court, field, end zone and stadium design we have covered: NBA Cup and City Edition courts, playoff and Final Four floors, NFL and college end zones and turf, and new ballparks and stadiums.",
  alternates: { canonical: "/courts-and-fields" },
};

type Group = { id: string; title: string; blurb: string; test: RegExp };

const GROUPS: Group[] = [
  {
    id: "courts",
    title: "Courts",
    blurb: "NBA Cup, City Edition, playoff and Finals floors, and college basketball courts.",
    test: /court|floor/,
  },
  {
    id: "fields",
    title: "Fields, End Zones And Turf",
    blurb: "Painted end zones, special fields and turf, from the NFL to college football.",
    // Ballpark names end in "field" too (Chase Field, Globe Life Field): roofs go to ballparks.
    test: /^(?!.*(roof|uniqlo)).*(end-zone|turf|-field-(?!of-dreams)|on-field|field-week)/,
  },
  {
    id: "ballparks",
    title: "Ballparks, Stadiums And Rinks",
    blurb: "New stadiums and ballparks, renderings, roofs and the places teams play.",
    test: /ballpark|stadium-renderings|stadium-2027|roof|uniqlo-field|rink|arena-design/,
  },
];

// Slugs that match a surface word but are really about something else.
const EXCLUDE = /uniform-schedule|scorebug|traffic-parking|emma-stone|jersey-2026$|uniform-history/;

function grouped(): { group: Group; posts: PostMeta[] }[] {
  const posts = getAllPostsByDate().filter((p) => !EXCLUDE.test(p.slug));
  const used = new Set<string>();
  return GROUPS.map((group) => {
    const mine = posts.filter((p) => !used.has(p.slug) && group.test.test(p.slug));
    mine.forEach((p) => used.add(p.slug));
    return { group, posts: mine };
  }).filter((g) => g.posts.length > 0);
}

export default function CourtsAndFieldsPage() {
  const groups = grouped();
  return (
    <>
      <Header />
      <main>
        <section className="max-w-[1200px] mx-auto px-5 pt-8 pb-2">
          <div className="text-[11px] font-black tracking-[0.18em] uppercase text-steel">Beyond The Uniform</div>
          <h1 className="font-display font-black text-[30px] sm:text-[42px] leading-[1.05] mt-1">Courts, Fields And Stadiums</h1>
          <p className="text-[16px] text-[#3c4250] max-w-[680px] mt-3">
            The court a team plays on is part of the look. Every court, end zone, field and stadium design we have
            covered, newest first.
          </p>
          <nav className="flex flex-wrap gap-2 mt-5">
            {groups.map(({ group, posts }) => (
              <a
                key={group.id}
                href={`#${group.id}`}
                className="rounded-full border border-border bg-white px-4 py-2 font-display text-[13px] font-extrabold text-black hover:border-black/30"
              >
                {group.title} <span className="text-steel font-bold">{posts.length}</span>
              </a>
            ))}
          </nav>
        </section>

        {groups.map(({ group, posts }, i) => (
          <section key={group.id} id={group.id} className="max-w-[1200px] mx-auto px-5 pt-10 scroll-mt-28">
            <div className="flex items-baseline justify-between gap-4 border-b-2 border-black pb-2 mb-2">
              <h2 className="font-display text-[20px] sm:text-[24px] font-black">{group.title}</h2>
            </div>
            <p className="text-[14px] text-steel mb-5">{group.blurb}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <StoryCard key={post.slug} {...post} compact />
              ))}
            </div>
            {i === 0 && <div className="pt-8"><MvSlot /></div>}
          </section>
        ))}

        <section className="max-w-[1200px] mx-auto px-5 pt-12 pb-14">
          <p className="text-[14px] text-steel">
            Looking for what teams are wearing? See <Link prefetch={false} href="/tonight" className="text-orange font-bold">Today&apos;s Uniforms</Link>{" "}
            or <Link prefetch={false} href="/news" className="text-orange font-bold">The Wire</Link>.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
