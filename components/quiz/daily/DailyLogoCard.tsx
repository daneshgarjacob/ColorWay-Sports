"use client";

import { useEffect, useState } from "react";
import { dayNumber, slotFor } from "@/lib/dailyLogoHash";
import { computeStats, loadHistory } from "./dailyStore";

// The way in to /quiz/daily from the /quiz hub ("hub", big) and the homepage
// ("home", compact). Server markup is a plain link with an empty glass; after
// hydration it shows today's number, today's piece and the reader's streak.

interface Me {
  n: number;
  key: string;
  status: "playing" | "won" | "lost";
  guesses: number;
  streak: number;
}

export default function DailyLogoCard({
  epoch,
  keys,
  variant,
}: {
  epoch: string;
  keys: string[];
  variant: "hub" | "home";
}) {
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    const n = dayNumber(epoch);
    const h = loadHistory();
    const rec = h[n];
    setMe({
      n,
      key: keys[slotFor(n, keys.length)],
      status: rec?.s ?? "playing",
      guesses: rec?.g.length ?? 0,
      streak: computeStats(h, n).current,
    });
  }, [epoch, keys]);

  const done = me && me.status !== "playing";
  const line = !me
    ? "A new piece every day. Three guesses."
    : me.status === "won"
      ? `You got today's in ${me.guesses}. Streak: ${me.streak}.`
      : me.status === "lost"
        ? "Today's got you. New piece at midnight Eastern."
        : me.streak > 0
          ? `Your streak: ${me.streak}. Keep it alive.`
          : "Three guesses. Every miss shows a bigger piece.";
  const cta = done ? "See Today's Answer →" : "Play Today's →";

  const big = variant === "hub";
  return (
    <a
      href="/quiz/daily"
      className={`group flex items-center gap-4 rounded-2xl no-underline transition-colors ${
        big ? "p-5 bg-[#0025CC] hover:bg-[#001ea6]" : "p-4 border-2 border-[#0025CC] bg-white hover:bg-[#f1f4ff]"
      }`}
    >
      <span
        className={`relative flex-none rounded-full overflow-hidden bg-white border-[5px] border-[#0b0b0f] ${
          big ? "w-[104px] h-[104px] shadow-[0_0_0_3px_#0025CC,0_0_0_6px_#fff]" : "w-[84px] h-[84px] shadow-[0_0_0_3px_#fff,0_0_0_6px_#0025CC]"
        } transition-transform group-hover:scale-105`}
      >
        {me && (
          // eslint-disable-next-line @next/next/no-img-element -- public/ is served raw by design
          <img src={`/quiz/daily/${me.key}-1.webp`} alt="" width={104} height={104} className="w-full h-full block" />
        )}
      </span>
      <span className="min-w-0">
        <span
          className={`block font-display text-[13px] font-extrabold tracking-[0.14em] uppercase ${
            big ? "text-white/85" : "text-[#0025CC]"
          }`}
        >
          {me ? `Daily Logo #${me.n}` : "Daily Logo"}
        </span>
        <span className={`block mt-1 font-display font-black leading-[1.1] ${big ? "text-[26px] text-white" : "text-[22px] text-[#0b0b0f]"}`}>
          Guess The Team From Today&apos;s Tiny Piece
        </span>
        <span className={`block mt-1 text-[16px] leading-snug ${big ? "text-white/90" : "text-[#444]"}`}>{line}</span>
        <span className={`block mt-1 text-[16px] font-bold ${big ? "text-white" : "text-[#0025CC]"}`}>{cta}</span>
      </span>
    </a>
  );
}
