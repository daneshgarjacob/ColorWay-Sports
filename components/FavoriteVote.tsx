"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { isClosed, isMulti, optionPercents, pollFor, type OptionTally, type Poll, type PollOption } from "@/lib/votes/polls";
import {
  GIVEAWAY_ID,
  TALLY_KEY,
  VOTES_KEY,
  anonId,
  easternDayTime,
  jumpToGiveaway,
  readJSON,
  votesWord,
  writeJSON,
} from "@/lib/votes/browser";

// Pick-one-of-many fan vote ("Vote For Your Favorite Thanksgiving Uniform"),
// filled into a placeholder the markdown writes:
//
//   <div class="tgv-slot" data-cw-poll="tg26:favorite"></div>
//
// The options (name + image) come from lib/votes/polls.ts, so the server and
// the page can never disagree about what is on the ballot. The story page
// mounts this only when the post HTML contains data-cw-poll.
//
// Same rules as the head-to-head box (components/BracketVote.tsx):
// - Nothing is requested until the reader votes, or until mount finds a vote
//   this browser already cast (or the poll has closed and there are results).
// - One vote per browser: the server keeps the first vote per anonymous
//   browser id; the choice is written to localStorage only AFTER the server
//   confirms it, so a failed save never looks like success.
// - The last tally this browser saw is remembered, and on reload each option
//   shows the larger of the (CDN-cached) count and the remembered one, so the
//   reader's own vote is always in the totals and numbers never go backwards.
//
// Two taps to vote: tap a uniform to pick it, then tap the Vote button that
// appears on it. A single stray tap can never use up the one vote.

type Counts = Record<string, number>;

type Status =
  | { kind: "idle" }
  | { kind: "saving"; key: string }
  | { kind: "saved"; t: OptionTally; fresh: boolean } // fresh = voted just now (not a reload)
  | { kind: "loading" } // reload: vote known, totals on the way
  | { kind: "off" } // API says site votes are not available: device-only
  | { kind: "error"; key: string; message: string }
  | { kind: "closed"; t: OptionTally | null };

const CSS = `
@keyframes tgv-rise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.tgv-rise{animation:tgv-rise .18s ease-out both}
.tgv-bar{transition:width .7s cubic-bezier(.2,.7,.2,1)}
@media (prefers-reduced-motion:reduce){.tgv-rise{animation:none}.tgv-bar{transition:none}}
`;

function readStored(item: string, poll: Poll): string | null {
  const v = readJSON(VOTES_KEY)[item];
  return typeof v === "string" && poll.options?.some((o) => o.key === v) ? v : null;
}

function readSavedCounts(item: string): Counts | null {
  const v = readJSON(TALLY_KEY)[item];
  if (!v || typeof v !== "object") return null;
  const out: Counts = {};
  for (const [k, n] of Object.entries(v as Record<string, unknown>)) if (typeof n === "number") out[k] = n;
  return out;
}

/** Never show fewer votes than this browser has already seen, and always count its own vote. */
function mergeTally(t: OptionTally, keys: string[], mine: string | null, seen: Counts | null): OptionTally {
  const counts: Counts = {};
  for (const k of keys) counts[k] = Math.max(t.counts?.[k] ?? 0, seen?.[k] ?? 0, mine === k ? 1 : 0);
  return { ...t, counts, count: keys.reduce((s, k) => s + counts[k], 0) };
}

function CheckBadge({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={`h-7 w-7 flex-none drop-shadow ${className}`} fill="none">
      <circle cx="12" cy="12" r="12" fill="#0025CC" />
      <path d="M6.8 12.6l3.4 3.4 7-7.4" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SavedIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-5 w-5 flex-none" fill="none">
      <circle cx="10" cy="10" r="10" fill="#15803d" />
      <path d="M5.5 10.5l3 3 6-6.5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const keysOf = (p: Poll) => (p.options ?? []).map((o) => o.key);

const fullName = (o: PollOption) => `${o.team} ${o.look}`;

function PollBox({ poll, options, giveaway }: { poll: Poll; options: PollOption[]; giveaway: boolean }) {
  const item = poll.id;
  const keys = keysOf(poll);
  const [mine, setMine] = useState<string | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const seq = useRef(0);

  const send = useCallback(
    async (key: string, fresh: boolean) => {
      const n = ++seq.current;
      try {
        const r = await fetch("/api/votes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ item, choice: key, anon: anonId() }),
        });
        if (n !== seq.current) return;
        if (r.ok) {
          const raw = (await r.json()) as OptionTally;
          // Voting closed between page load and the tap: the server kept nothing.
          if (raw.closed && fresh) {
            setStatus({ kind: "closed", t: mergeTally(raw, keysOf(poll), null, null) });
            return;
          }
          const t = mergeTally(raw, keysOf(poll), key, null);
          writeJSON(VOTES_KEY, item, key);
          writeJSON(TALLY_KEY, item, t.counts);
          setMine(key);
          setStatus({ kind: "saved", t, fresh });
          return;
        }
        const body = (await r.json().catch(() => ({}))) as { code?: string };
        if (r.status === 503 && body.code !== "failed") {
          // No vote store configured: keep the pick on this device only.
          writeJSON(VOTES_KEY, item, key);
          setMine(key);
          setStatus({ kind: "off" });
          return;
        }
        const message =
          r.status === 429 ? "Too many votes from this connection. Wait a minute, then try again." : "We could not save your vote. Try again.";
        setStatus({ kind: "error", key, message });
      } catch {
        if (n === seq.current) setStatus({ kind: "error", key, message: "We could not save your vote. Check your connection and try again." });
      }
    },
    [item, poll]
  );

  useEffect(() => {
    const had = readStored(item, poll);
    const closed = isClosed(poll);
    if (!had && !closed) return;
    let live = true;
    Promise.resolve().then(() => {
      if (!live) return;
      const seen = readSavedCounts(item);
      if (had) {
        setMine(had);
        setStatus({ kind: "loading" });
        if (!seen) {
          // Pick known but no remembered totals: re-send once (the server ignores repeats) to confirm it is stored.
          send(had, false);
          return;
        }
      } else {
        setStatus({ kind: "closed", t: null });
      }
      const n = ++seq.current;
      fetch(`/api/votes?item=${encodeURIComponent(item)}`)
        .then(async (r) => {
          if (n !== seq.current) return;
          if (!r.ok) throw new Error(String(r.status));
          const t = mergeTally((await r.json()) as OptionTally, keysOf(poll), had, seen);
          if (had) {
            writeJSON(TALLY_KEY, item, t.counts);
            setStatus({ kind: "saved", t, fresh: false });
          } else setStatus({ kind: "closed", t });
        })
        .catch(() => {
          if (n !== seq.current) return;
          if (had && seen) {
            // The server already confirmed this vote once; show the totals we remember.
            const t = mergeTally({ item, count: 0, counts: {}, closed }, keysOf(poll), had, seen);
            setStatus({ kind: "saved", t, fresh: false });
          } else if (!had) setStatus({ kind: "closed", t: null });
        });
    });
    return () => {
      live = false;
    };
  }, [item, poll, send]);

  const closed = status.kind === "closed";
  const voted = !!mine;
  const saving = status.kind === "saving";
  const locked = voted || saving || closed;
  const t = status.kind === "saved" || status.kind === "closed" ? status.t : null;
  const pct = t ? optionPercents(t.counts, keys) : null;
  const chosen = mine ?? (saving ? status.key : null) ?? (status.kind === "error" ? status.key : null) ?? picked;
  const nameOf = (key: string) => {
    const o = options.find((x) => x.key === key);
    return o ? fullName(o) : key;
  };

  const vote = (key: string) => {
    if (locked) return;
    setStatus({ kind: "saving", key });
    send(key, true);
  };

  const { day, date, time } = easternDayTime(poll.closesAt);

  let statusEl: React.ReactNode = null;
  if (saving) {
    statusEl = <div className="m-0 text-[16px] font-semibold leading-snug text-[#4b5563]">Saving your vote for {nameOf(status.key)}…</div>;
  } else if (status.kind === "loading" && mine) {
    statusEl = (
      <div className="m-0 flex items-center gap-2 text-[16px] font-bold leading-snug text-[#15803d]">
        <SavedIcon />
        You voted {nameOf(mine)}. Your vote is saved.
      </div>
    );
  } else if (status.kind === "saved" && mine) {
    statusEl = (
      <div>
        <div className="m-0 flex items-center gap-2 text-[16px] font-bold leading-snug text-[#15803d]">
          <SavedIcon />
          {status.fresh ? `Your vote is saved: ${nameOf(mine)}` : `You voted ${nameOf(mine)}. Your vote is saved.`}
        </div>
        <div className="m-0 mt-1 text-[16px] leading-snug text-[#4b5563]">
          {status.t.closed ? `Voting is closed. ${votesWord(status.t.count)} in all.` : `${votesWord(status.t.count)} so far.`}
          {!status.t.closed && giveaway && (
            <>
              {" "}
              <a href={`#${GIVEAWAY_ID}`} onClick={jumpToGiveaway} className="font-bold text-orange underline underline-offset-2">
                Enter the shirt giveaway
              </a>
            </>
          )}
        </div>
      </div>
    );
  } else if (status.kind === "off") {
    statusEl = <div className="m-0 text-[16px] leading-snug text-[#4b5563]">Your pick is saved on this device. Live site totals are coming soon.</div>;
  } else if (status.kind === "error") {
    const retry = status.key;
    statusEl = (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div role="alert" className="m-0 text-[16px] font-bold leading-snug text-[#b91c1c]">
          {status.message}
        </div>
        <button
          type="button"
          onClick={() => {
            setStatus({ kind: "saving", key: retry });
            send(retry, true);
          }}
          className="min-h-[44px] rounded-full bg-navy-deep px-5 text-[16px] font-bold text-white hover:bg-orange focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange"
        >
          Try Again
        </button>
      </div>
    );
  } else if (closed) {
    statusEl = (
      <div className="m-0 text-[16px] font-bold leading-snug text-navy-deep">
        Voting is closed.{status.t ? ` ${votesWord(status.t.count)} in all.` : ""}
      </div>
    );
  }

  return (
    <div className="not-prose my-6 rounded-[16px] border border-[#e3e7ec] bg-[#f7f8fa] p-3 font-sans leading-snug sm:p-4">
      <style>{CSS}</style>
      <div className="m-0 text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7380]">Fan Vote</div>
      <div className="m-0 mt-1 mb-3 text-[16px] leading-snug text-navy-deep">
        {locked && !saving
          ? closed
            ? "Final results."
            : "Results so far."
          : "Tap your favorite, then tap Vote. One vote per visitor."}
      </div>

      <div
        role={locked ? "list" : "radiogroup"}
        aria-label="Vote for your favorite Thanksgiving uniform"
        className="grid grid-cols-2 gap-2.5 sm:grid-cols-4"
      >
        {options.map((o) => {
          const isChosen = chosen === o.key;
          const isMine = mine === o.key;
          const share = pct ? pct[o.key] : null;
          const n = t ? t.counts[o.key] ?? 0 : 0;
          const leader = t && t.count > 0 && Math.max(...keys.map((k) => t.counts[k] ?? 0)) === n && n > 0;
          return (
            <div key={o.key} role={locked ? "listitem" : undefined} className="relative min-w-0">
              <button
                type="button"
                role={locked ? undefined : "radio"}
                aria-checked={locked ? undefined : isChosen}
                aria-label={`${fullName(o)}${isMine ? ", your pick" : ""}${share !== null ? `, ${share}%, ${votesWord(n)}` : ""}`}
                disabled={locked}
                onClick={() => setPicked(o.key)}
                className={`group flex h-full w-full flex-col overflow-hidden rounded-[12px] border-2 bg-white text-left transition-[border-color,box-shadow] duration-150 [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange ${
                  isChosen ? "border-orange shadow-[0_0_0_3px_rgba(0,37,204,.15)]" : "border-[#dfe3e9]"
                } ${locked ? "cursor-default" : "cursor-pointer hover:border-orange"}`}
              >
                <span className="relative block aspect-[4/5] w-full overflow-hidden bg-[#eef1f5]">
                  {/* eslint-disable-next-line @next/next/no-img-element -- site serves public/ images raw */}
                  <img
                    src={o.img}
                    alt={o.alt}
                    width={960}
                    height={1200}
                    loading="lazy"
                    decoding="async"
                    className={`!m-0 block !h-full !w-full !max-w-none !rounded-none !shadow-none object-cover transition-transform duration-300 motion-reduce:transition-none ${
                      locked ? "" : "group-hover:scale-[1.03]"
                    }`}
                  />
                  {isChosen && <CheckBadge className="absolute right-2 top-2" />}
                  {isMine && (
                    <span className="absolute left-2 top-2 rounded-full bg-orange px-2.5 py-1 text-[13px] font-extrabold text-white shadow">
                      Your Pick
                    </span>
                  )}
                </span>
                <span className="flex flex-1 flex-col px-2.5 pb-2.5 pt-2">
                  <span className="block text-[16px] font-extrabold leading-tight text-navy-deep">{o.team}</span>
                  <span className="block text-[15px] leading-snug text-[#4b5563]">{o.look}</span>
                  {share !== null && (
                    <span className="mt-auto block pt-2">
                      <span className="flex items-baseline justify-between gap-1">
                        <span className="text-[20px] font-extrabold tabular-nums text-navy-deep">{share}%</span>
                        <span className="text-[14px] font-medium tabular-nums text-[#4b5563]">{votesWord(n)}</span>
                      </span>
                      <span aria-hidden="true" className="mt-1 block h-2 overflow-hidden rounded-full bg-[#e6e9ee]">
                        <span
                          className={`tgv-bar block h-full rounded-full ${isMine ? "bg-orange" : leader ? "bg-navy-deep" : "bg-[#9aa3b2]"}`}
                          style={{ width: `${share}%` }}
                        />
                      </span>
                    </span>
                  )}
                </span>
              </button>
              {!locked && picked === o.key && (
                <span className="pointer-events-none absolute inset-x-0 top-0 flex aspect-[4/5] items-end p-2">
                  <button
                    type="button"
                    onClick={() => vote(o.key)}
                    aria-label={`Vote for ${fullName(o)}`}
                    className="tgv-rise pointer-events-auto min-h-[48px] w-full rounded-full bg-orange text-[17px] font-extrabold text-white shadow-[0_6px_18px_rgba(0,0,0,.28)] hover:bg-[#001a99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    Vote
                  </button>
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div aria-live="polite" className="mt-3 min-h-[22px]">
        {statusEl}
      </div>
      {!closed && !(t && t.closed) && (
        <div className="m-0 mt-1.5 text-[16px] leading-snug text-[#4b5563]">
          Voting closes {day}, {date} at {time} ET.
        </div>
      )}
    </div>
  );
}

type Slot = { el: HTMLElement; poll: Poll };

export default function FavoriteVote() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [giveaway, setGiveaway] = useState(false);

  useEffect(() => {
    const found: Slot[] = [];
    document.querySelectorAll<HTMLElement>("[data-cw-poll]").forEach((el) => {
      const poll = pollFor(el.dataset.cwPoll);
      if (poll && isMulti(poll)) found.push({ el, poll });
    });
    const hasGiveaway = !!document.getElementById(GIVEAWAY_ID);
    Promise.resolve().then(() => {
      setSlots(found);
      setGiveaway(hasGiveaway);
    });
  }, []);

  return <>{slots.map((s) => createPortal(<PollBox poll={s.poll} options={s.poll.options ?? []} giveaway={giveaway} />, s.el, s.poll.id))}</>;
}
