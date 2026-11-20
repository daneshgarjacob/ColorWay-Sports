import Link from "next/link";
import { Fragment } from "react";

export type Crumb = { label: string; href?: string; /** Shorter label under 640px. */ short?: string };

/**
 * League › Division › Team (11/19), in the site's small-label style. One line
 * that never wraps (long names truncate), so it can sit where a single-line
 * label was without moving anything below it.
 */
export default function Breadcrumbs({
  crumbs,
  tone = "dark",
  className = "",
}: {
  crumbs: Crumb[];
  tone?: "dark" | "light";
  className?: string;
}) {
  const link = tone === "light" ? "text-sky hover:text-white" : "text-black/60 hover:text-black";
  const sep = tone === "light" ? "text-white/40" : "text-black/30";
  const last = tone === "light" ? "text-white" : "text-black/80";
  return (
    <nav aria-label="Breadcrumb" className={`min-w-0 ${className}`}>
      <ol className="flex items-center gap-1.5 whitespace-nowrap overflow-hidden m-0 p-0 list-none">
        {crumbs.map((c, i) => {
          const text = c.short ? (
            <>
              <span className="sm:hidden">{c.short}</span>
              <span className="hidden sm:inline">{c.label}</span>
            </>
          ) : (
            c.label
          );
          const isLast = i === crumbs.length - 1;
          return (
            <Fragment key={`${c.label}-${i}`}>
              {i > 0 && (
                <li aria-hidden="true" className={sep}>
                  &rsaquo;
                </li>
              )}
              <li className={isLast ? "min-w-0 truncate" : "shrink-0"}>
                {c.href ? (
                  <Link prefetch={false} href={c.href} className={`${isLast ? last : link} transition-colors`}>
                    {text}
                  </Link>
                ) : (
                  <span className={last} aria-current="page">
                    {text}
                  </span>
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
