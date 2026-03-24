import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getAllPosts } from "@/lib/posts";
import StoriesFilter from "@/components/StoriesFilter";
import { Suspense } from "react";

export default function StoriesPage() {
  const posts = getAllPosts();

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
