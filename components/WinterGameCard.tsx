"use client";

import { useState } from "react";
import type { WinterGame } from "@/lib/winterTrackerIndex";

// One date on an /nba-tracker or /nhl-tracker team calendar. The card shows the
// club's own jersey; hovering (or tapping, on a phone) turns it to the matchup:
// both jerseys side by side, so the other team's look is one gesture away.

const short = (call: string) => call.replace(" Edition", "");

function Side({ label, call, image, swatch, alt }: { label: string; call?: string; image?: string; swatch?: string; alt: string }) {
  return (
    <div className="min-w-0 flex flex-col items-center">
      {image ? (
        <img src={image} alt={alt} loading="lazy" className="h-[56px] w-full object-contain" />
      ) : (
        <span
          aria-hidden
          className="h-[56px] w-[34px] rounded-md border border-black/15"
          style={{ background: swatch ?? "#e3e7ec" }}
        />
      )}
      <div className="text-[10px] font-extrabold uppercase tracking-[0.04em] leading-tight text-blue-dark mt-1 truncate max-w-full">
        {label}
      </div>
      <div className="text-[9px] font-bold uppercase tracking-[0.04em] leading-tight text-[#5b6474]">
        {call ? short(call) : "TBD"}
      </div>
    </div>
  );
}

export default function WinterGameCard({
  game,
  accent,
  today,
  kit,
  dateLabel,
  nickname,
}: {
  game: WinterGame;
  accent: string;
  today: string;
  kit: string;
  dateLabel: string;
  nickname: string;
}) {
  const [open, setOpen] = useState(false);
  const logged = Boolean(game.uniform);
  const upcoming = game.date >= today;
  const opp = game.opp;
  const hoverable = () => typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches;

  // Hover and tap both reach the matchup view; past games with nothing logged
  // on either side have nothing to show, so they stay put.
  const ourCall = game.uniform ?? (upcoming ? game.expected : undefined);
  const oppCall = opp?.uniform ?? (upcoming ? opp?.expected : undefined);
  const canFlip = Boolean(opp && (ourCall || oppCall));

  const handlers = canFlip
    ? {
        onMouseEnter: () => hoverable() && setOpen(true),
        onMouseLeave: () => hoverable() && setOpen(false),
        onClick: () => setOpen((o) => !o),
        role: "button" as const,
        tabIndex: 0,
        "aria-expanded": open,
        "aria-label": `${dateLabel} ${game.home ? "vs" : "at"} ${game.opponent}: show both ${kit}s`,
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((o) => !o);
          }
        },
      }
    : {};

  const hint = canFlip && (
    <div className="text-[9px] font-bold uppercase tracking-[0.08em] mt-1.5 opacity-60">
      <span className="hidden [@media(hover:hover)]:inline">Hover</span>
      <span className="[@media(hover:hover)]:hidden">Tap</span> for {opp!.nickname} {kit}
    </div>
  );

  if (open && opp) {
    const bothConfirmed = Boolean(game.uniform && opp.uniform);
    const awayFirst = !game.home;
    const us = (
      <Side
        key="us"
        label={nickname}
        call={ourCall}
        image={game.image ?? (upcoming ? game.expectedImage : undefined)}
        swatch={game.swatch}
        alt={`${nickname} ${ourCall ?? kit} on ${dateLabel}`}
      />
    );
    const them = (
      <Side
        key="them"
        label={opp.nickname}
        call={oppCall}
        image={opp.uniform || upcoming ? opp.image : undefined}
        swatch={opp.swatch}
        alt={`${opp.nickname} ${oppCall ?? kit} on ${dateLabel}`}
      />
    );
    return (
      <div
        {...handlers}
        className="rounded-xl px-2 pt-2.5 pb-2.5 text-center flex flex-col border-2 bg-white cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#2f6bed]"
        style={{ borderColor: accent }}
      >
        <div className="text-[10px] font-bold tracking-[0.08em] text-[#5b6474]">{dateLabel}</div>
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1 mt-1.5">
          {awayFirst ? us : them}
          <span className="text-[9px] font-extrabold uppercase text-[#9aa0ac]">at</span>
          {awayFirst ? them : us}
        </div>
        <div
          className={`text-[9px] font-extrabold uppercase tracking-[0.12em] mt-1.5 ${bothConfirmed ? "text-[#1a8f4c]" : "text-[#5b6474]"}`}
        >
          {bothConfirmed ? "Both confirmed" : upcoming ? "Expected" : "Partly logged"}
        </div>
        {game.result && (
          <div className="text-[10px] font-extrabold tracking-[0.06em] mt-0.5 text-blue-dark">{game.result}</div>
        )}
      </div>
    );
  }

  // Confirmed games carry the product shot of the jersey/sweater worn.
  if (logged && game.image) {
    return (
      <div
        {...handlers}
        className={`rounded-xl px-2.5 pt-2.5 pb-3 text-center flex flex-col items-center border-2 bg-white outline-none focus-visible:ring-2 focus-visible:ring-[#2f6bed] ${canFlip ? "cursor-pointer" : ""}`}
        style={{ borderColor: accent }}
      >
        <div className="text-[10px] font-bold tracking-[0.08em] text-[#5b6474]">{dateLabel}</div>
        <div className="text-[13px] font-extrabold mt-0.5 leading-tight text-blue-dark">
          <span className="opacity-60">{game.home ? "vs" : "at"} </span>
          {game.opponentAbbr || game.opponent}
        </div>
        <img
          src={game.image}
          alt={`${game.uniform} ${kit} worn ${game.home ? "against" : "at"} the ${game.opponent} on ${dateLabel}`}
          loading="lazy"
          className="h-[70px] w-full object-contain my-1.5"
        />
        <div className="text-[10px] font-bold uppercase tracking-[0.04em] leading-tight text-blue-dark">
          {game.swatch && (
            <span
              aria-hidden
              className="inline-block w-2 h-2 rounded-full mr-1 align-middle border border-black/20"
              style={{ background: game.swatch }}
            />
          )}
          {game.uniform}
        </div>
        {game.scheduled && (
          <div className="text-[9px] font-bold uppercase tracking-[0.06em] text-[#5b6474] mt-0.5">
            Changed from {short(game.scheduled)}
          </div>
        )}
        <div className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#1a8f4c] mt-1">Confirmed</div>
        {game.result && (
          <div className="text-[10px] font-extrabold tracking-[0.06em] mt-0.5 text-blue-dark">{game.result}</div>
        )}
        {hint && <div className="text-[#5b6474]">{hint}</div>}
      </div>
    );
  }
  return (
    <div
      {...handlers}
      className={`rounded-xl px-3 py-3 text-center min-h-[96px] flex flex-col justify-center border outline-none focus-visible:ring-2 focus-visible:ring-[#2f6bed] ${canFlip ? "cursor-pointer" : ""}`}
      style={{
        background: logged ? accent : "#f7f9fc",
        color: logged ? "#ffffff" : "#333",
        borderColor: logged ? accent : "#e3e7ec",
      }}
    >
      <div className="text-[10px] font-bold tracking-[0.08em] opacity-75">{dateLabel}</div>
      <div className="text-[13px] font-extrabold my-1 leading-tight">
        <span className="opacity-70">{game.home ? "vs" : "at"} </span>
        {game.opponentAbbr || game.opponent}
      </div>
      {!logged && game.expectedImage && upcoming && (
        <img
          src={game.expectedImage}
          alt={`Expected ${game.expected} ${kit} ${game.home ? "against" : "at"} the ${game.opponent}`}
          loading="lazy"
          className="h-[56px] w-full object-contain mb-1 opacity-90"
        />
      )}
      <div className="text-[10px] font-bold uppercase tracking-[0.04em] leading-tight opacity-80">
        {game.uniform ?? (game.expected && upcoming ? `Expected: ${game.expected}` : "Not yet logged")}
      </div>
      {/* NBA: a jersey that broke from the announced schedule, and the final. */}
      {game.scheduled && (
        <div className="text-[9px] font-bold uppercase tracking-[0.06em] opacity-75 mt-0.5">
          Changed from {short(game.scheduled)}
        </div>
      )}
      {game.result && <div className="text-[10px] font-extrabold tracking-[0.06em] mt-1 opacity-90">{game.result}</div>}
      {hint}
    </div>
  );
}
