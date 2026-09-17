import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllNewsMeta, getNewsBySlug, getAllNews, dayLabel } from "@/lib/news";
import WireItem from "@/components/WireItem";
import TwitterEmbed from "@/components/TwitterEmbed";

// Every wire item gets its own URL so it can be shared, linked and indexed. The
// feed is the front door; this is the permanent address.
export async function generateStaticParams() {
  return getAllNewsMeta().map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = await getNewsBySlug(slug);
  if (!item) return { title: "Not found" };
  const description = item.plain.slice(0, 180);
  return {
    title: item.title,
    description,
    alternates: { canonical: `/news/${slug}` },
    openGraph: {
      title: item.title,
      description,
      url: `/news/${slug}`,
      type: "article",
      publishedTime: item.at,
      images: item.image ? [item.image] : undefined,
    },
  };
}

export default async function WirePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await getNewsBySlug(slug);
  if (!item) notFound();

  const all = await getAllNews();
  const more = all.filter((n) => n.slug !== slug).slice(0, 4);

  return (
    <>
      <Header />
      <main className="pb-20">
        {/* widgets.js is loaded globally; this re-runs it so wire embeds render */}
        <TwitterEmbed />
        <div className="max-w-[760px] mx-auto px-5">
          <nav className="pt-8 pb-4">
            <Link
              prefetch={false}
              href="/news"
              className="font-display text-[11px] font-extrabold tracking-[0.18em] uppercase text-orange no-underline"
            >
              &larr; The Wire
            </Link>
            <span className="font-display text-[11px] font-extrabold tracking-[0.18em] uppercase text-steel ml-3">
              {dayLabel(item.at)}
            </span>
          </nav>

          <WireItem item={item} headingLevel="h1" />

          {more.length > 0 && (
            <section className="mt-12">
              <h2 className="font-display text-[12px] font-extrabold tracking-[0.18em] uppercase text-steel m-0 mb-1 pb-3 border-b-2 border-black">
                More from the wire
              </h2>
              {more.map((n) => (
                <WireItem key={n.slug} item={n} />
              ))}
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
