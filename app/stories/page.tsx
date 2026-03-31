import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getAllPostsByDate } from "@/lib/posts";
import StoriesFilter from "@/components/StoriesFilter";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "All Stories – ColorWay Sports",
  alternates: {
    canonical: "https://www.colorwaysports.com/stories",
  },
};

export default function StoriesPage() {
  const posts = getAllPostsByDate();

  return (
    <>
      <Header />
      <Suspense fallback={<div className="max-w-[1200px] mx-auto px-5 py-12">Loading...</div>}>
        <StoriesFilter posts={posts} />
      </Suspense>
      <Footer />
    </>
  );
}
