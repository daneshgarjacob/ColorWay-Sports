import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TwitterEmbed from "@/components/TwitterEmbed";
import InstagramEmbed from "@/components/InstagramEmbed";
import InlineNewsletter from "@/components/InlineNewsletter";
import RelatedStories from "@/components/RelatedStories";
import ReadingProgress from "@/components/ReadingProgress";
import TrackerJumpNav, { type JumpNavItem } from "@/components/TrackerJumpNav";
import TrackerSearch from "@/components/TrackerSearch";
import TrackerTeamIndex from "@/components/TrackerTeamIndex";
import { buildMlbTeamIndex } from "@/lib/mlbTrackerTeamIndex";
import TeamWoreLastNight from "@/components/TeamWoreLastNight";
import { getTeamLatestFromTracker, teamWearQuestions } from "@/lib/mlbTeamLatest";
import UpNext from "@/components/UpNext";
import { leagueColor } from "@/lib/leagueColors";
import { HomeAwayChart, HomeRatioChart, FullSeasonChart, TotalAppearancesChart } from "@/components/LakersCharts";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostBySlug, getAllPosts, getRelatedPosts } from "@/lib/posts";
import AuthorBio from "@/components/AuthorBio";
import { getAuthor, authorSchema } from "@/lib/authors";
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
    notFound();
  }

  const publishedIso = new Date(post.date.includes("T") ? post.date : post.date + "T12:00:00Z").toISOString();
  const modifiedDateStr = post.updatedDate || post.date;
  const modifiedIso = new Date(modifiedDateStr.includes("T") ? modifiedDateStr : modifiedDateStr + "T12:00:00Z").toISOString();

  const author = getAuthor(post.author);

  const articleSchema: Record<string, unknown> = {
    "@type": "NewsArticle",
    headline: post.title,
    description: post.excerpt,
    datePublished: publishedIso,
    dateModified: modifiedIso,
    author: authorSchema(author),
    publisher: {
      "@type": "Organization",
      name: "ColorWay Sports",
      url: "https://www.colorwaysports.com",
      sameAs: ["https://x.com/ColorWaySports"],
      logo: {
        "@type": "ImageObject",
        url: "https://www.colorwaysports.com/brand/colorway-logo.jpg",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://www.colorwaysports.com/stories/${slug}`,
    },
    ...(post.coverImage ? { image: `https://www.colorwaysports.com${post.coverImage}` } : {}),
  };

  // MLB team schedule posts get a live "what did they wear last night" block
  // sourced from the daily tracker. These are the pages that actually rank for
  // "what are the <team> wearing", so the freshness belongs here rather than on
  // the league-wide tracker. Only loads the tracker for those slugs.
  const isMlbSchedulePost =
    post.league === "mlb" && /-uniform-schedule-2026$/.test(slug);
  const trackerPost = isMlbSchedulePost
    ? await getPostBySlug("mlb-uniform-tracker-2026")
    : null;
  const teamLatest = trackerPost
    ? getTeamLatestFromTracker(trackerPost.contentHtml, slug)
    : null;

  const graph: Record<string, unknown>[] = [articleSchema];

  if (post.faqs && post.faqs.length > 0) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: post.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    });
  }

  // The live block visibly asks and answers two of the four target phrasings, so
  // those two get FAQ schema. "right now" / "what jersey did" are deliberately
  // NOT declared — schema should only claim questions the page actually answers
  // on screen. Google matches paraphrases to the same block anyway.
  if (teamLatest?.latest) {
    const q = teamWearQuestions(teamLatest.team);
    const g = teamLatest.latest;
    const place = g.home ? "at home" : "on the road";
    graph.push({
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: q.lastNight,
          acceptedAnswer: {
            "@type": "Answer",
            text: g.uniform
              ? `On ${g.month} ${g.date} the ${teamLatest.team} wore the ${g.uniform} ${place} ${g.opp}.`
              : `The ${teamLatest.team} last played ${g.opp} on ${g.month} ${g.date}.`,
          },
        },
        {
          "@type": "Question",
          name: q.tonight,
          acceptedAnswer: {
            "@type": "Answer",
            text: `The ${teamLatest.team} uniform schedule on this page maps every jersey they run and when, so you can call tonight's look before first pitch. Their most recent logged game was ${g.month} ${g.date}${g.uniform ? `, in the ${g.uniform}` : ""}.`,
          },
        },
      ],
    });
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": graph,
  };

  // Long tracker posts (8+ "Match N" / "Game N" sections) get a sticky jump nav.
  const matchHeadings = post.headings.filter(
    (h) => h.level === 2 && /^(Match|Game)\s+\d+/i.test(h.text)
  );
  let jumpItems: JumpNavItem[] =
    matchHeadings.length >= 8
      ? matchHeadings.map((h) => {
          const m = h.text.match(/^Match\s+(\d+)/i);
          return {
            id: h.id,
            label: h.text,
            group:
              slug === "world-cup-2026-jersey-tracker" && m
                ? wc2026Round(parseInt(m[1], 10))
                : undefined,
          };
        })
      : [];

  // MLB daily tracker: games are h3 "Away at Home" headings grouped under day h2s
  // ("Friday, July 10"), so build the jump nav from those instead.
  if (slug === "mlb-uniform-tracker-2026") {
    const gameItems: JumpNavItem[] = [];
    let day: string | undefined;
    for (const h of post.headings) {
      if (h.level === 2) {
        day = /^[A-Z][a-z]+, \w+ \d+/.test(h.text) ? h.text : undefined;
      } else if (h.level === 3 && day && / at /.test(h.text)) {
        gameItems.push({ id: h.id, label: h.text, group: day });
      }
    }
    if (gameItems.length >= 8) jumpItems = gameItems;
  }
  const jumpNavIsGames = slug === "mlb-uniform-tracker-2026";
  const teamIndex =
    slug === "mlb-uniform-tracker-2026" ? buildMlbTeamIndex(post.contentHtml) : null;

  const relatedPosts = getRelatedPosts(slug, {
    league: post.league,
    teams: post.teams,
    category: post.category,
    limit: 3,
  });
  const upNextPost = relatedPosts[0];

  return (
    <>
      <ReadingProgress />
      <Header />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Editorial hero */}
      <div className="w-full py-8 sm:py-10 px-5 border-b border-black/5">
        <div className="max-w-[720px] mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/stories"
              className="text-sm text-black/60 hover:text-black transition-colors"
            >
              &larr; All Stories
            </Link>
            <span className="text-xs text-black/70 font-semibold uppercase tracking-widest">
              {post.category}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-extrabold text-black leading-[1.1] tracking-tight">
            {post.title}
          </h1>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="text-black/70 text-sm">
              By{" "}
              <Link
                href={`/authors/${author.slug}`}
                className="font-semibold text-black hover:text-orange transition-colors"
              >
                {author.name}
              </Link>
            </span>
            <span className="text-black/30">·</span>
            <time className="text-black/50 text-sm">
              {post.updatedDate ? "Updated " : ""}
              {new Date((post.updatedDate || post.date) + "T12:00:00").toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
          </div>
        </div>
      </div>

      {teamLatest?.latest && (
        <TeamWoreLastNight data={teamLatest} accent={leagueColor(post.category)} />
      )}

      {jumpItems.length > 0 &&
        (jumpNavIsGames ? (
          <TrackerSearch items={jumpItems} unitLabel="games logged" />
        ) : (
          <TrackerJumpNav items={jumpItems} />
        ))}

      {teamIndex && <TrackerTeamIndex teams={teamIndex} />}

      {/* Daily-updated posts get a signup ABOVE the body as well as below it.
          On a post the length of the MLB tracker the footer form is tens of
          thousands of words past where anyone stops reading, so the page with
          the strongest reason to subscribe was the one never asking. Opt-in via
          `newsletterTop: true` in frontmatter so no other post is affected. */}
      {post.newsletterTop && (
        <div className="max-w-[720px] mx-auto px-5 pt-8">
          <InlineNewsletter
            eyebrow="Updated Every Morning"
            heading="Never check the site to find out."
            body="We log every uniform in every game, every day. Get the day's slate, the standouts, and the misses in one email."
          />
        </div>
      )}

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

        {/* Byline card — a named human behind every grade */}
        <AuthorBio author={author} />

        {/* Inline newsletter signup */}
        <InlineNewsletter />

        {/* Related stories */}
        <RelatedStories posts={relatedPosts} />

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

      {upNextPost && (
        <UpNext
          slug={upNextPost.slug}
          title={upNextPost.title}
          category={upNextPost.category}
          gradient={upNextPost.gradient}
          coverImage={upNextPost.coverImage}
          coverImagePosition={upNextPost.coverImagePosition}
          accent={leagueColor(upNextPost.category)}
        />
      )}

      <Footer />
    </>
  );
}

// 2026 World Cup match numbers → knockout round names (104-match format:
// 72 group games, then Round of 32 through the Final).
function wc2026Round(num: number): string {
  if (num <= 72) return "Group Stage";
  if (num <= 88) return "Round of 32";
  if (num <= 96) return "Round of 16";
  if (num <= 100) return "Quarterfinals";
  if (num <= 102) return "Semifinals";
  if (num === 103) return "Third Place";
  return "Final";
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
