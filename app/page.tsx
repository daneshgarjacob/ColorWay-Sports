import Header from "@/components/Header";
import Hero from "@/components/Hero";
import StoryCard from "@/components/StoryCard";
import Footer from "@/components/Footer";
import Link from "next/link";
import { getAllPosts } from "@/lib/posts";

export default function Home() {
  const posts = getAllPosts();
  const featured = posts[0];
  const secondary = posts.slice(1, 3); // 2 secondary featured stories
  const rest = posts.slice(3, 9); // Show only 6 more (9 total on homepage)

  return (
    <>
      <Header />
      <main>
        <Hero />

        {/* Featured stories — top section */}
        <section className="max-w-[1200px] mx-auto px-5 pt-8 pb-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Main featured story — tall, left side */}
            {featured && (
              <Link href={`/stories/${featured.slug}`} className="block group lg:row-span-2">
                <div className="relative rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 h-full min-h-[320px] lg:min-h-[440px]">
                  <div
                    className="absolute inset-0 flex items-start justify-center pt-8 sm:pt-12"
                    style={{ background: featured.coverImage ? undefined : featured.gradient }}
                  >
                    {featured.coverImage ? (
                      <img
                        src={featured.coverImage}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
                        style={featured.coverImagePosition ? { objectPosition: featured.coverImagePosition } : undefined}
                      />
                    ) : featured.logoSrc && featured.logoSrc2 ? (
                      <div className="flex items-center gap-5 transition-all duration-500 group-hover:scale-110">
                        <img src={featured.logoSrc} alt="" className="h-[90px] sm:h-[110px] w-auto drop-shadow-2xl" />
                        <span className="text-white/60 text-3xl font-extrabold">×</span>
                        <img src={featured.logoSrc2} alt="" className="h-[70px] sm:h-[90px] w-auto drop-shadow-2xl" />
                      </div>
                    ) : featured.logoSrc ? (
                      <img
                        src={featured.logoSrc}
                        alt=""
                        className="h-[100px] sm:h-[130px] w-auto transition-all duration-500 group-hover:scale-110 drop-shadow-2xl"
                      />
                    ) : (
                      <span className="text-white/15 text-5xl sm:text-6xl font-bold uppercase tracking-wider transition-all duration-300 group-hover:text-white/25">
                        {featured.category}
                      </span>
                    )}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-6 sm:p-8">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-orange">
                      {featured.category}
                    </span>
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mt-1 leading-tight group-hover:text-orange transition-colors duration-200">
                      {featured.title}
                    </h2>
                    <p className="text-sm text-white/70 mt-2 max-w-[500px] hidden sm:block">
                      {featured.excerpt}
                    </p>
                  </div>
                </div>
              </Link>
            )}

            {/* Two secondary featured stories — stacked on right */}
            {secondary.map((post) => (
              <Link key={post.slug} href={`/stories/${post.slug}`} className="block group">
                <div className="relative rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 h-[210px]">
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ background: post.coverImage ? undefined : post.gradient }}
                  >
                    {post.coverImage ? (
                      <img
                        src={post.coverImage}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
                        style={post.coverImagePosition ? { objectPosition: post.coverImagePosition } : undefined}
                      />
                    ) : post.logoSrc && post.logoSrc2 ? (
                      <div className="flex items-center gap-3 transition-all duration-500 group-hover:scale-110 -translate-y-4">
                        <img src={post.logoSrc} alt="" className="h-[60px] w-auto drop-shadow-xl" />
                        <span className="text-white/60 text-xl font-extrabold">×</span>
                        <img src={post.logoSrc2} alt="" className="h-[45px] w-auto drop-shadow-xl" />
                      </div>
                    ) : post.logoSrc && post.overlayText ? (
                      <div className="flex flex-col items-center gap-2 transition-all duration-500 group-hover:scale-110 -translate-y-4">
                        <img src={post.logoSrc} alt="" className="h-[70px] w-auto drop-shadow-xl" />
                        <span className="text-white text-base font-extrabold uppercase tracking-widest drop-shadow-lg">
                          {post.overlayText}
                        </span>
                      </div>
                    ) : post.logoSrc ? (
                      <img
                        src={post.logoSrc}
                        alt=""
                        className="h-[80px] w-auto transition-all duration-500 group-hover:scale-110 drop-shadow-xl -translate-y-4"
                      />
                    ) : (
                      <span className="text-white/15 text-3xl font-bold uppercase tracking-wider transition-all duration-300 group-hover:text-white/25">
                        {post.category}
                      </span>
                    )}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/75 via-black/40 to-transparent p-5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-orange">
                      {post.category}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-white mt-1 leading-snug group-hover:text-orange transition-colors duration-200">
                      {post.title}
                    </h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Remaining stories grid */}
        {rest.length > 0 && (
          <section className="max-w-[1200px] mx-auto px-5 py-8">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-orange mb-3">
              More Stories
            </h2>
            <hr className="border-border mb-6" />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {rest.map((post) => (
                <StoryCard key={post.slug} {...post} />
              ))}
            </div>

            <div className="flex justify-center mt-10">
              <Link
                href="/stories"
                className="inline-block px-8 py-3 text-[14px] font-bold uppercase tracking-[0.15em] text-white bg-[#0021A5] hover:bg-[#001a84] rounded-lg transition-colors duration-200"
              >
                View All Stories
              </Link>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
