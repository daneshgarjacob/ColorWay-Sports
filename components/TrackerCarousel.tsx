"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";

// Sportslogos-style rotator for the three MLB tools. Auto-advances,
// pauses on hover/touch, and is swipeable on mobile. Arrows + dots let
// the reader page through Daily Tracker → Team Calendars → Uniform Schedule.
const slides = [
  {
    href: "/stories/mlb-uniform-tracker-2026",
    image: "/images/posts/mlb-daily-tracker/cover-branded.jpg",
    eyebrow: "Updated Every Morning",
    title: "Daily Uniform Tracker",
    dek: "What every team wore last night, logged every morning.",
  },
  {
    href: "/mlb-tracker",
    image: "/images/posts/mlb-daily-tracker/calendars-cover.jpg",
    eyebrow: "All 30 Teams",
    title: "Team Uniform Calendars",
    dek: "Every jersey, team by team, laid out all season.",
  },
  {
    href: "/stories/mlb-uniform-schedule-2026",
    image: "/images/posts/mlb-uniform-schedule-2026-cover.jpg",
    eyebrow: "Season-Long",
    title: "Uniform Schedule",
    dek: "What each team wears and when, for all 30 teams.",
  },
];

export default function TrackerCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const startX = useRef<number | null>(null);

  const go = (n: number) => setIndex((n + slides.length) % slides.length);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), 5000);
    return () => clearInterval(id);
  }, [paused]);

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="overflow-hidden rounded-xl border border-border bg-blue-dark"
        onTouchStart={(e) => {
          startX.current = e.touches[0].clientX;
          setPaused(true);
        }}
        onTouchEnd={(e) => {
          if (startX.current == null) return;
          const dx = e.changedTouches[0].clientX - startX.current;
          if (dx > 40) go(index - 1);
          else if (dx < -40) go(index + 1);
          startX.current = null;
          setPaused(false);
        }}
      >
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="group relative block min-w-full h-[190px] sm:h-[230px]"
            >
              <img
                src={s.image}
                alt=""
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(0,20,60,0.86) 0%, rgba(0,20,60,0.62) 45%, rgba(0,20,60,0.15) 100%)",
                }}
              />
              <div className="absolute inset-0 flex flex-col justify-center gap-1.5 p-6 sm:p-8 max-w-[85%]">
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange">
                  {s.eyebrow}
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold text-white leading-tight tracking-tight">
                  {s.title}
                </span>
                <span className="text-[13px] sm:text-sm text-white/80 leading-snug">
                  {s.dek}
                </span>
                <span className="mt-1 text-[12px] font-bold uppercase tracking-[0.14em] text-white group-hover:text-orange transition-colors">
                  Open →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <button
        type="button"
        aria-label="Previous tracker"
        onClick={() => go(index - 1)}
        className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-blue-dark font-bold shadow-md transition hover:bg-white"
      >
        ‹
      </button>
      <button
        type="button"
        aria-label="Next tracker"
        onClick={() => go(index + 1)}
        className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-blue-dark font-bold shadow-md transition hover:bg-white"
      >
        ›
      </button>

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
        {slides.map((s, i) => (
          <button
            key={s.href}
            type="button"
            aria-label={`Go to ${s.title}`}
            aria-current={i === index}
            onClick={() => go(i)}
            className={`h-2 rounded-full transition-all ${
              i === index ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/80"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
