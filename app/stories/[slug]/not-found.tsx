import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="max-w-[800px] mx-auto px-5 py-12 text-center">
        <h1 className="text-3xl font-bold text-black mb-4">Story Not Found</h1>
        <p className="text-gray-medium mb-6">
          The story you're looking for doesn't exist or may have been moved.
        </p>
        <Link href="/stories" className="text-orange hover:underline">
          Back to Stories
        </Link>
      </main>
      <Footer />
    </>
  );
}
