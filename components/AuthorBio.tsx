import Link from "next/link";
import type { Author } from "@/lib/authors";

/**
 * Byline card appended to the end of every story. Gives the grades a named
 * human behind them and links through to the full author page.
 */
export default function AuthorBio({ author }: { author: Author }) {
  const initials = author.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

  return (
    <aside className="mt-14 mb-4 border-t border-border pt-8">
      <div className="flex gap-4 items-start">
        <div
          className="shrink-0 w-12 h-12 rounded-full bg-orange text-white flex items-center justify-center font-extrabold text-sm tracking-wide"
          aria-hidden="true"
        >
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.18em] text-gray-light font-semibold mb-1">
            Written By
          </p>
          <Link
            href={`/authors/${author.slug}`}
            className="text-base font-extrabold text-black hover:text-orange transition-colors"
          >
            {author.name}
          </Link>
          <p className="text-[13px] text-gray-medium mt-0.5">{author.role}</p>
          <p className="text-sm text-foreground leading-relaxed mt-2">{author.shortBio}</p>
          <Link
            href={`/authors/${author.slug}`}
            className="inline-block mt-3 text-[13px] font-semibold text-orange hover:underline"
          >
            More from {author.name.split(" ")[0]} &rarr;
          </Link>
        </div>
      </div>
    </aside>
  );
}
