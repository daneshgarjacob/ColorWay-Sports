"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { percents, pollFor, type Choice, type VoteTally } from "@/lib/votes/polls";

// Head-to-head fan vote, filled into placeholders a markdown post writes:
//
//   <div data-cw-vote="tg26:r1-m1" data-label-a="1A" data-a="Cowboys 1960s Classic"
//        data-label-b="1B" data-b="Rams Fearsome White"></div>
//
// The story page mounts this only when the post HTML contains data-cw-vote.
// Same storage pattern as Grade It (components/GradeIt.tsx): nothing is
// requested until the reader taps, or until mount finds a vote this browser
// already cast. One vote per browser per matchup: the choice is remembered in
// localStorage and the server keeps only the first vote per anonymous browser id.
//
// Making "is my vote saved?" unmistakable:
// - The choice is written to localStorage only AFTER the server confirms it
//   (or says site votes are off), so a failed save never looks like success.
// - The last tally this browser saw is kept in localStorage too. The GET is
//   CDN-cached for a minute, so on reload each side shows the larger of the
//   cached count and the remembered count: the reader's own vote is always in
//   the totals, and the numbers never go backwards.
// - A browser that voted before tallies were remembered re-sends its vote once
//   on load. That is safe (the server keeps the first vote and ignores
//   repeats) and returns an uncached tally that confirms the vote is stored.

const VOTES_KEY = "cw-votes-v1"; // { [item]: "A" | "B" }
const TALLY_KEY = "cw-vote-tallies-v1"; // { [item]: { a, b } } last tally this browser saw
const ANON_KEY = "cw-anon-id"; // shared with Grade It: a random UUID, nothing else
const GIVEAWAY_ID = "enter-the-breakingt-shirt-giveaway"; // h3 id the post's giveaway box gets
const HEADER_OFFSET = 110; // matches the vote placeholders' scroll-margin-top

function readJSON(key: string): Record<string, unknown> {
  try {
    const v = JSON.parse(localStorage.getItem(key) ?? "{}");
    return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function writeJSON(key: string, item: string, value: unknown) {
  try {
    const all = readJSON(key);
    all[item] = value;
    localStorage.setItem(key, JSON.stringify(all));
  } catch {}
}

function readStored(item: string): Choice | null {
  const v = readJSON(VOTES_KEY)[item];
  return v === "A" || v === "B" ? v : null;
}

function readSavedTally(item: string): { a: number; b: number } | null {
  const v = readJSON(TALLY_KEY)[item] as { a?: unknown; b?: unknown } | undefined;
  if (!v || typeof v.a !== "number" || typeof v.b !== "number") return null;
  return { a: v.a, b: v.b };
}

/** Never show fewer votes than this browser has already seen, and always count its own vote. */
function mergeTally(t: VoteTally, mine: Choice, seen: { a: number; b: number } | null): VoteTally {
  const a = Math.max(t.a, seen?.a ?? 0, mine === "A" ? 1 : 0);
  const b = Math.max(t.b, seen?.b ?? 0, mine === "B" ? 1 : 0);
  return { ...t, a, b, count: a + b };
}

function anonId(): string {
  try {
    const have = localStorage.getItem(ANON_KEY);
    if (have && /^[0-9a-f-]{36}$/i.test(have)) return have;
    const id =
      typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            return (c === "x" ? r : (r & 3) | 8).toString(16);
          });
    localStorage.setItem(ANON_KEY, id);
    return id;
  } catch {
    return "00000000-0000-4000-8000-000000000000";
  }
}

/** "Round 1 closes Saturday at 11:59 p.m. ET." from the poll's real closing time. */
function closingNote(item: string): string {
  const poll = pollFor(item);
  if (!poll) return "One vote per matchup.";
  const round = /:r(\d+)-/.exec(item)?.[1];
  const when = new Date(poll.closesAt);
  const day = when.toLocaleDateString("en-US", { weekday: "long", timeZone: "America/New_York" });
  const time = when
    .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York" })
    .replace(/\s?AM$/, " a.m.")
    .replace(/\s?PM$/, " p.m.");
  return `One vote per matchup. ${round ? `Round ${round}` : "Voting"} closes ${day} at ${time} ET.`;
}

const votesWord = (n: number) => `${n.toLocaleString("en-US")} ${n === 1 ? "vote" : "votes"}`;

type Status =
  | { kind: "idle" }
  | { kind: "saving"; choice: Choice }
  | { kind: "saved"; t: VoteTally; fresh: boolean } // fresh = voted just now (not a reload)
  | { kind: "loading" } // reload: vote known, totals on the way
  | { kind: "off" } // API says site votes are not available: device-only
  | { kind: "error"; choice: Choice; message: string };

type Slot = { el: HTMLElement; item: string; a: string; b: string; labelA: string; labelB: string };

type BoxProps = Omit<Slot, "el"> & {
  onDone: (item: string, fresh: boolean) => void;
  allDoneHere: boolean;
  giveaway: boolean;
};

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-5 w-5 flex-none" fill="none">
      <circle cx="10" cy="10" r="10" fill="#15803d" />
      <path d="M5.5 10.5l3 3 6-6.5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function VoteBox({ item, a, b, labelA, labelB, onDone, allDoneHere, giveaway }: BoxProps) {
  const [mine, setMine] = useState<Choice | null>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const seq = useRef(0);

  // POST this browser's vote. Used for a new vote, a retry, and the one-time
  // re-confirm for browsers that voted before tallies were remembered.
  const send = useCallback(
    async (choice: Choice, fresh: boolean) => {
      const n = ++seq.current;
      try {
        const r = await fetch("/api/votes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ item, choice, anon: anonId() }),
        });
        if (n !== seq.current) return;
        if (r.ok) {
          const t = mergeTally((await r.json()) as VoteTally, choice, null);
          writeJSON(VOTES_KEY, item, choice);
          writeJSON(TALLY_KEY, item, { a: t.a, b: t.b });
          setMine(choice);
          setStatus({ kind: "saved", t, fresh });
          onDone(item, fresh);
          return;
        }
        const body = (await r.json().catch(() => ({}))) as { error?: string; code?: string };
        if (r.status === 503 && body.code !== "failed") {
          // No vote store configured: keep the pick on this device only.
          writeJSON(VOTES_KEY, item, choice);
          setMine(choice);
          setStatus({ kind: "off" });
          onDone(item, fresh);
          return;
        }
        const message =
          r.status === 429 ? "Too many votes from this connection. Wait a minute, then try again." : "We could not save your vote. Try again.";
        setStatus({ kind: "error", choice, message });
      } catch {
        if (n === seq.current) setStatus({ kind: "error", choice, message: "We could not save your vote. Check your connection and try again." });
      }
    },
    [item, onDone]
  );

  useEffect(() => {
    const had = readStored(item);
    if (!had) return;
    let live = true;
    Promise.resolve().then(() => {
      if (!live) return;
      setMine(had);
      setStatus({ kind: "loading" });
      const seen = readSavedTally(item);
      if (!seen) {
        // Voted before tallies were remembered: re-send once (idempotent) to confirm it is stored.
        send(had, false);
        return;
      }
      const n = ++seq.current;
      fetch(`/api/votes?item=${encodeURIComponent(item)}`)
        .then(async (r) => {
          if (n !== seq.current) return;
          if (!r.ok) throw new Error(String(r.status));
          const t = mergeTally((await r.json()) as VoteTally, had, seen);
          writeJSON(TALLY_KEY, item, { a: t.a, b: t.b });
          setStatus({ kind: "saved", t, fresh: false });
        })
        .catch(() => {
          // The server already confirmed this vote once; show the totals we remember.
          if (n !== seq.current) return;
          setStatus({ kind: "saved", t: { item, a: seen.a, b: seen.b, count: seen.a + seen.b, closed: false }, fresh: false });
        })
        .finally(() => {
          if (n === seq.current) onDone(item, false);
        });
    });
    return () => {
      live = false;
    };
  }, [item, send, onDone]);

  const locked = !!mine || status.kind === "saving";
  const vote = (choice: Choice) => {
    if (locked) return; // one vote per browser per matchup
    setStatus({ kind: "saving", choice });
    send(choice, true);
  };

  const t = status.kind === "saved" ? status.t : null;
  const pct = t ? percents(t) : null;
  const highlighted = mine ?? (status.kind === "saving" ? status.choice : null);
  const nameOf = (c: Choice) => `${c === "A" ? labelA : labelB} ${c === "A" ? a : b}`;

  const option = (choice: Choice, label: string, name: string) => {
    const picked = highlighted === choice;
    const share = pct ? (choice === "A" ? pct.a : pct.b) : null;
    const n = t ? (choice === "A" ? t.a : t.b) : 0;
    return (
      <button
        type="button"
        onClick={() => vote(choice)}
        disabled={locked}
        aria-pressed={picked}
        aria-label={`${label} ${name}${picked && mine ? ", your pick" : ""}${share !== null ? `, ${share}%, ${votesWord(n)}` : ""}`}
        className={`relative flex min-h-[56px] w-full items-center gap-3 overflow-hidden rounded-[10px] px-3.5 py-2.5 text-left transition-colors [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange ${
          picked ? "border-2 border-orange bg-white" : "border-2 border-[#d9dde3] bg-white"
        } ${locked ? "cursor-default" : "hover:border-orange hover:bg-[#f5f7ff]"}`}
      >
        {share !== null && (
          <span
            aria-hidden="true"
            className={`absolute inset-y-0 left-0 ${picked ? "bg-orange/15" : "bg-[#e9ecf0]"}`}
            style={{ width: `${share}%`, transition: "width .6s ease" }}
          />
        )}
        <span
          aria-hidden="true"
          className={`relative inline-flex h-8 min-w-8 flex-none items-center justify-center rounded-full px-1.5 text-[13px] font-extrabold ${
            picked ? "bg-orange text-white" : "bg-navy-deep text-white"
          }`}
        >
          {label}
        </span>
        <span aria-hidden="true" className="relative flex-1 text-[15px] font-semibold leading-snug text-navy-deep">
          {name}
          {picked && mine && <span className="mt-0.5 block text-[14px] font-bold text-orange">Your pick</span>}
        </span>
        {share !== null && (
          <span aria-hidden="true" className="relative flex-none text-right leading-tight text-navy-deep">
            <span className="block text-[17px] font-extrabold tabular-nums">{share}%</span>
            <span className="block text-[14px] font-medium tabular-nums text-[#4b5563]">{votesWord(n)}</span>
          </span>
        )}
      </button>
    );
  };

  // Status area (announced to screen readers).
  let statusEl: React.ReactNode = <div className="m-0 text-[16px] leading-snug text-[#4b5563]">Tap your pick. One vote per matchup.</div>;
  if (status.kind === "saving") {
    statusEl = <div className="m-0 text-[16px] font-semibold leading-snug text-[#4b5563]">Saving your vote for {nameOf(status.choice)}…</div>;
  } else if (status.kind === "loading" && mine) {
    statusEl = (
      <div className="m-0 flex items-center gap-2 text-[16px] font-bold leading-snug text-[#15803d]">
        <CheckIcon />
        You voted {mine === "A" ? labelA : labelB} · Your vote is saved
      </div>
    );
  } else if (status.kind === "saved" && mine) {
    statusEl = (
      <div>
        <div className="m-0 flex items-center gap-2 text-[16px] font-bold leading-snug text-[#15803d]">
          <CheckIcon />
          {status.fresh ? `Your vote is saved: ${nameOf(mine)}` : `You voted ${mine === "A" ? labelA : labelB} · Your vote is saved`}
        </div>
        <div className="m-0 mt-1 text-[16px] leading-snug text-[#4b5563]">
          {status.t.closed
            ? `Voting is closed. ${votesWord(status.t.count)} on the site.`
            : `${votesWord(status.t.count)} on the site so far, plus TikTok comments.`}
        </div>
      </div>
    );
  } else if (status.kind === "off") {
    statusEl = <div className="m-0 text-[16px] leading-snug text-[#4b5563]">Your pick is saved on this device. Live site totals are coming soon.</div>;
  } else if (status.kind === "error") {
    const retryChoice = status.choice;
    statusEl = (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div role="alert" className="m-0 text-[16px] font-bold leading-snug text-[#b91c1c]">
          {status.message}
        </div>
        <button
          type="button"
          onClick={() => {
            setStatus({ kind: "saving", choice: retryChoice });
            send(retryChoice, true);
          }}
          className="rounded-full bg-navy-deep px-4 py-1.5 text-[16px] font-bold text-white hover:bg-orange focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange"
        >
          Try again
        </button>
      </div>
    );
  }

  const jump = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const target = document.getElementById(GIVEAWAY_ID);
    if (!target) return;
    e.preventDefault();
    const box = (target.closest(".bkt") as HTMLElement | null) ?? target;
    window.scrollTo({ top: box.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET, behavior: "smooth" });
    history.replaceState(null, "", `#${GIVEAWAY_ID}`);
  };

  return (
    <div className="not-prose my-6 rounded-[14px] border border-[#e3e7ec] bg-[#f7f8fa] p-3.5 font-sans">
      <p className="m-0 mb-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7380]">Vote</p>
      <div role="group" aria-label={`Vote: ${labelA} ${a} or ${labelB} ${b}`} className="grid gap-2 sm:grid-cols-2">
        {option("A", labelA, a)}
        {option("B", labelB, b)}
      </div>
      <div aria-live="polite" className="mt-2.5 min-h-[20px]">
        {statusEl}
      </div>
      <div className="mt-1.5 text-[16px] leading-snug text-[#4b5563]">{closingNote(item)}</div>
      {allDoneHere && (
        <div className="mt-2 text-[16px] font-bold leading-snug text-navy-deep">
          All four votes are in.{" "}
          {giveaway ? (
            <a href={`#${GIVEAWAY_ID}`} onClick={jump} className="text-orange underline underline-offset-2">
              Enter the shirt giveaway
            </a>
          ) : (
            "Enter the shirt giveaway below."
          )}
        </div>
      )}
    </div>
  );
}

export default function BracketVote() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [done, setDone] = useState<string[]>([]);
  const [lastFresh, setLastFresh] = useState<string | null>(null);
  const [giveaway, setGiveaway] = useState(false);

  useEffect(() => {
    const found: Slot[] = [];
    document.querySelectorAll<HTMLElement>("[data-cw-vote]").forEach((el) => {
      const item = el.dataset.cwVote;
      const a = el.dataset.a;
      const b = el.dataset.b;
      if (!item || !a || !b) return;
      found.push({ el, item, a, b, labelA: el.dataset.labelA || "A", labelB: el.dataset.labelB || "B" });
    });
    const hasGiveaway = !!document.getElementById(GIVEAWAY_ID);
    Promise.resolve().then(() => {
      setSlots(found);
      setGiveaway(hasGiveaway);
    });
  }, []);

  const onDone = useCallback((item: string, fresh: boolean) => {
    setDone((d) => (d.includes(item) ? d : [...d, item]));
    if (fresh) setLastFresh(item);
  }, []);

  // "All four votes are in" shows once, in the box voted last (or the last box on a reload).
  const allDone = slots.length > 1 && slots.every((s) => done.includes(s.item));
  const doneBox = allDone ? (lastFresh ?? slots[slots.length - 1].item) : null;

  return (
    <>
      {slots.map((s) =>
        createPortal(
          <VoteBox
            item={s.item}
            a={s.a}
            b={s.b}
            labelA={s.labelA}
            labelB={s.labelB}
            onDone={onDone}
            allDoneHere={doneBox === s.item}
            giveaway={giveaway}
          />,
          s.el,
          s.item
        )
      )}
    </>
  );
}
