"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface UpNextProps {
  slug: string;
  title: string;
  category: string;
  gradient?: string;
  coverImage?: string;
  coverImagePosition?: string;
  accent?: string;
}

// Frosted "Up Next" bar that slides in from the bottom on phones once the
// reader is past ~55% of the article. Tapping it goes straight to the next
// story; the X dismisses it for the rest of the page view.
export default function UpNext({ slug, title, category, gradient, coverImage, coverImagePosition, accent = "#2f6bed" }: UpNextProps) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  // Height of Mediavine's bottom adhesion ad, so this bar can sit above it
  // instead of underneath it. 0 when no ad is on the page.
  const [adhesionOffset, setAdhesionOffset] = useState(0);

  useEffect(() => {
    let ticking = false;
    const update = () => {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      const pct = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
      setVisible(pct > 55);

      // Mediavine's adhesion unit is pinned to the bottom of the viewport at a
      // z-index we cannot outrank, and it loads async long after this mounts.
      // Measuring here is enough because the bar only ever appears past 55%
      // scroll, so a scroll event always fires before it can collide.
      // `.adhesion_wrapper` covers both #adhesion_mobile_wrapper and the
      // desktop variant.
      const ad = document.querySelector(".adhesion_wrapper");
      setAdhesionOffset(ad ? ad.getBoundingClientRect().height : 0);

      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  if (dismissed) return null;

  return (
    <div
      className={`lg:hidden fixed inset-x-0 bottom-0 z-40 px-3 pb-3 transition-all duration-500 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
      }`}
      style={adhesionOffset ? { paddingBottom: adhesionOffset + 12 } : undefined}
    >
      <div className="relative flex items-center gap-3 rounded-2xl bg-white/85 supports-[backdrop-filter]:bg-white/75 backdrop-blur-2xl backdrop-saturate-150 border border-black/10 shadow-[0_-4px_24px_rgba(0,0,0,0.10),0_8px_24px_rgba(0,0,0,0.12)] p-2.5 pr-10">
        <Link href={`/stories/${slug}`} className="flex items-center gap-3 min-w-0 flex-1">
          <div
            className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0"
            style={{ background: gradient || "#0B1F4A" }}
          >
            {coverImage && (
              <img
                src={coverImage}
                alt=""
                className="w-full h-full object-cover"
                style={coverImagePosition ? { objectPosition: coverImagePosition } : undefined}
              />
            )}
          </div>
          <div className="min-w-0">
            <p
              className="text-[9px] font-extrabold uppercase tracking-[0.2em] mb-0.5"
              style={{ color: accent }}
            >
              Up Next · {category}
            </p>
            <p className="text-[13px] font-bold text-black leading-snug line-clamp-2">{title}</p>
          </div>
        </Link>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="absolute right-2 top-2 p-1.5 text-black/40 hover:text-black"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
