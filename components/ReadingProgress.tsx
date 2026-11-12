"use client";

import { useEffect, useState } from "react";

// Thin orange reading-progress bar pinned to the very top of the viewport,
// above the frosted sticky header. Fills as the reader moves through the page.
export default function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let ticking = false;
    const update = () => {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      const pct = scrollable > 0 ? Math.min(100, Math.max(0, (window.scrollY / scrollable) * 100)) : 0;
      setProgress(pct);
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

  return (
    <div className="fixed top-0 left-0 right-0 h-[3px] z-[60] pointer-events-none" aria-hidden="true">
      {/* scaleX, not width: a transform is drawn by the compositor, while a
          width change re-runs layout on every scroll frame (scroll jank and
          slower taps on long, ad-heavy pages). */}
      <div
        className="h-full w-full origin-left"
        style={{
          transform: `scaleX(${progress / 100})`,
          background: "linear-gradient(90deg, #0025CC 0%, #5b8def 100%)",
          boxShadow: progress > 0 ? "0 0 8px rgba(255,89,16,0.45)" : "none",
          transition: "transform 80ms linear",
        }}
      />
    </div>
  );
}
