import Link from "next/link";
import type { PostMeta } from "@/lib/posts";

// "More Explained": three related why/origin stories under an Explained story,
// plus the way into the /explained hub. Words only on purpose: the Related
// Stories grid lower down carries cover photos, and a photo never appears twice
// on one page (Jake 11/14).

export default function ExplainedRail({ posts }: { posts: PostMeta[] }) {
  if (posts.length === 0) return null;
  return (
    <section aria-labelledby="more-explained" className="not-prose my-12 border-t-4 border-[#0025CC] pt-6">
      <div className="flex items-end justify-between gap-4 mb-5">
        <div>
          <p className="text-[13px] font-extrabold uppercase tracking-[0.16em] text-[#0025CC] leading-none">Explained</p>
          <h2 id="more-explained" className="mt-1.5 text-[26px] sm:text-[30px] font-extrabold text-black leading-tight tracking-tight">
            More Explained
          </h2>
        </div>
        <Link prefetch={false} href="/explained" className="shrink-0 text-[16px] font-bold text-[#0025CC] hover:underline">
          See All &rarr;
        </Link>
      </div>
      <ol className="grid gap-3">
        {posts.map((p, i) => (
          <li key={p.slug}>
            <Link
              prefetch={false}
              href={p.href ?? `/stories/${p.slug}`}
              className="group flex gap-4 rounded-xl border border-black/10 bg-white px-4 py-4 hover:border-[#0025CC] transition-colors"
            >
              <span className="shrink-0 w-9 text-[28px] font-black leading-none text-[#0025CC]/80 tabular-nums">{i + 1}</span>
              <span className="min-w-0">
                <span className="block text-[13px] font-extrabold uppercase tracking-[0.12em] text-[#5b6474]">{p.category}</span>
                <span className="mt-1 block text-[19px] font-bold text-black leading-snug group-hover:text-[#0025CC]">{p.title}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
