import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DisqusComments from "@/components/DisqusComments";
import TwitterEmbed from "@/components/TwitterEmbed";
import InstagramEmbed from "@/components/InstagramEmbed";
import { HomeAwayChart, HomeRatioChart, FullSeasonChart, TotalAppearancesChart } from "@/components/LakersCharts";
import Link from "next/link";
import { getPostBySlug, getAllPosts } from "@/lib/posts";
import type { Metadata } from "next";

export function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return { title: "Story Not Found | ColorWay Sports" };
  }

  return {
    title: `${post.title} | ColorWay Sports`,
    description: post.excerpt,
    alternates: {
      canonical: `https://www.colorwaysports.com/stories/${slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      siteName: "ColorWay Sports",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
    },
  };
}

export default async function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return (
      <>
        <Header />
        <main className="max-w-[800px] mx-auto px-5 py-12 text-center">
          <h1 className="text-3xl font-bold text-black mb-4">Story Not Found</h1>
          <Link href="/stories" className="text-orange hover:underline">
            Back to Stories
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />

      {/* Compact hero banner with gradient */}
      <div
        className="w-full py-8 sm:py-10 px-5"
        style={{ background: post.gradient }}
      >
        <div className="max-w-[720px] mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/stories"
              className="text-sm text-white/70 hover:text-white transition-colors"
            >
              &larr; All Stories
            </Link>
            <span className="text-xs text-white/80 font-semibold uppercase tracking-widest">
              {post.category}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
            {post.title}
          </h1>
          <div className="flex items-center gap-2 mt-3">
            <span className="text-white/80 text-sm">ColorWay Sports</span>
            <span className="text-white/40">·</span>
            <time className="text-white/60 text-sm">
              {new Date(post.date + "T12:00:00").toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
          </div>
        </div>
      </div>

      {/* Article body */}
      <main className="max-w-[720px] mx-auto px-5 py-12">
        {slug === "lakers-jersey-tracker-2025-26" ? (
          <LakersArticle />
        ) : (
          <>
            <article
              className="prose prose-lg max-w-none text-foreground leading-relaxed"
              dangerouslySetInnerHTML={{ __html: post.contentHtml }}
            />
            <TwitterEmbed />
            <InstagramEmbed />
          </>
        )}

        {/* Comments */}
        <DisqusComments
          url={`https://colorwaysports.com/stories/${slug}`}
          identifier={slug}
        />

        {/* Bottom divider and back link */}
        <div className="border-t border-border mt-12 pt-8 flex items-center justify-between">
          <Link
            href="/stories"
            className="text-sm text-gray-medium hover:text-orange transition-colors font-medium"
          >
            &larr; All Stories
          </Link>
          <span className="text-xs text-gray-light uppercase tracking-wider">ColorWay Sports</span>
        </div>
      </main>

      <Footer />
    </>
  );
}

function LakersArticle() {
  const imgStyle = "rounded-lg mx-auto my-4 max-w-[25%] h-auto block shadow-md";
  return (
    <article className="prose prose-lg max-w-none text-foreground leading-relaxed">
      <p>We've been tracking every Lakers uniform this season in a spreadsheet. Game by game, home and away, which jersey they wore and what day it was. 82 games in, the data tells the story we already knew from watching: gold is no longer the default at home, and it's driving us crazy.</p>

      <div className="flex justify-center gap-4 mt-8 mb-1">
        <img src="/images/posts/lakers-gold.jpg" alt="Lakers Gold Jersey" className="rounded-lg w-[22%] h-auto shadow-md" />
        <img src="/images/posts/lakers-white.jpg" alt="Lakers White Jersey" className="rounded-lg w-[22%] h-auto shadow-md" />
        <img src="/images/posts/lakers-purple.jpg" alt="Lakers Purple Jersey" className="rounded-lg w-[22%] h-auto shadow-md" />
        <img src="/images/posts/lakers-black.jpg" alt="Lakers Black Jersey" className="rounded-lg w-[22%] h-auto shadow-md" />
      </div>
      <p className="text-center text-xs text-gray-400 mb-8" style={{ fontStyle: "normal" }}>Uniform images via NBA.com</p>

      <p>Across 41 home games, the Lakers have worn gold just 13 times. White gets 10. Purple gets 9. And the black City Edition gets 9. That means on any given night at Crypto.com Arena, there's less than a one-in-three chance you're seeing the gold jersey.</p>

      <HomeAwayChart />

      <p>There was a time when you turned on a Lakers home game and you knew what you were getting. Gold. Every single night. The only exception was Sundays, when white jersey Sundays were a real tradition. More recently, Saturdays got the white treatment too. But that was it. Gold and white. Home meant gold.</p>

      <p>Now it's a costume rotation. Tuesday gold, Wednesday purple, Friday black, Sunday white. Four different uniforms cycling through the building with no consistency, no identity, no sense of "this is what the Lakers look like at home." It's the NBA's four-uniform system doing exactly what it was designed to do: sell more jerseys, at the expense of everything that made uniform traditions feel like they meant something.</p>

      <p>So we created what we're calling the Home Ratio. It's simple: how often did the Lakers wear the right jersey at home versus the wrong one? Gold or white on the appropriate day counts as traditional. Purple or black at home counts as non-traditional. The result for the full season? 23 to 18. Only 56.1% of home games in the right jersey.</p>

      <HomeRatioChart />

      <p>That green border means traditional. That red border means they wore something they shouldn't have been wearing at home. Look at how much red is in there. Nearly half the home schedule is purple or black jerseys that belong on the road or don't belong in the rotation at all.</p>

      <p>And here's the other thing that kills us: the purple road jersey is being wasted.</p>

      <p>The Lakers' away look used to be simple and perfect: purple on the road, every game. That was the deal across the entire NBA: home team wears white, away team wears their color. It meant every road game was a sea of purple and gold against whatever the home team was wearing. It looked incredible.</p>

      <p>But the league moved away from the white-at-home standard, which means opposing teams are now wearing their colored jerseys at home whenever they feel like it. So the Lakers have to counter with gold or white on the road to avoid color-on-color matchups. The result? Gold leads the away count with 16 games, nearly half of all road contests. Purple only gets 10 road games. The jersey that was built for the road barely gets to travel anymore.</p>

      <FullSeasonChart />

      <p>There's the full season, game by game. Gold leads the overall count with 29 appearances, white at 22, purple at 19, and black at 12. The home ratio already tells you what you need to know: the Lakers are only wearing the right jersey at home 56.1% of the time. That number should be 100%.</p>

      <TotalAppearancesChart />
    </article>
  );
}
