"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { percents, type Choice, type VoteTally } from "@/lib/votes/polls";

// Head-to-head fan vote, filled into placeholders a markdown post writes:
//
//   <div data-cw-vote="tg26:r1-m1" data-label-a="1A" data-a="Cowboys 1960s Classic"
//        data-label-b="1B" data-b="Rams Fearsome White"></div>
//
// The story page mounts this only when the post HTML contains data-cw-vote.
// Same storage pattern as Grade It (components/GradeIt.tsx): nothing is
// requested until the reader taps, or until mount finds a vote this browser
// already cast (then one CDN-cached GET for the running tally). One vote per
// browser per matchup: the choice is remembered in localStorage and the server
// keeps only the first vote per anonymous browser id.

const VOTES_KEY = "cw-votes-v1"; // { [item]: "A" | "B" }
const ANON_KEY = "cw-anon-id"; // shared with Grade It: a random UUID, nothing else

function readStored(item: string): Choice | null {
  try {
    const all = JSON.parse(localStorage.getItem(VOTES_KEY) ?? "{}") as Record<string, unknown>;
    const v = all[item];
    return v === "A" || v === "B" ? v : null;
  } catch {
    return null;
  }
}

function writeStored(item: string, choice: Choice) {
  try {
    const all = JSON.parse(localStorage.getItem(VOTES_KEY) ?? "{}") as Record<string, string>;
    all[item] = choice;
    localStorage.setItem(VOTES_KEY, JSON.stringify(all));
  } catch {}
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

type Fetched = { kind: "idle" } | { kind: "loading" } | { kind: "ok"; t: VoteTally } | { kind: "off" };

type Slot = { el: HTMLElement; item: string; a: string; b: string; labelA: string; labelB: string };

function VoteBox({ item, a, b, labelA, labelB }: Omit<Slot, "el">) {
  const [mine, setMine] = useState<Choice | null>(null);
  const [fetched, setFetched] = useState<Fetched>({ kind: "idle" });
  const seq = useRef(0);

  const apply = useCallback(async (res: Promise<Response>) => {
    const n = ++seq.current;
    try {
      const r = await res;
      if (n !== seq.current) return;
      if (!r.ok) return setFetched({ kind: "off" });
      setFetched({ kind: "ok", t: (await r.json()) as VoteTally });
    } catch {
      if (n === seq.current) setFetched({ kind: "off" });
    }
  }, []);

  useEffect(() => {
    const had = readStored(item);
    if (!had) return;
    let live = true;
    Promise.resolve().then(() => {
      if (!live) return;
      setMine(had);
      setFetched({ kind: "loading" });
      apply(fetch(`/api/votes?item=${encodeURIComponent(item)}`));
    });
    return () => {
      live = false;
    };
  }, [item, apply]);

  const vote = (choice: Choice) => {
    if (mine) return; // one vote per browser per matchup
    setMine(choice);
    writeStored(item, choice);
    setFetched({ kind: "loading" });
    apply(
      fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item, choice, anon: anonId() }),
      })
    );
  };

  const t = fetched.kind === "ok" ? fetched.t : null;
  const pct = t ? percents(t) : null;

  const option = (choice: Choice, label: string, name: string) => {
    const picked = mine === choice;
    const share = pct ? (choice === "A" ? pct.a : pct.b) : null;
    return (
      <button
        type="button"
        onClick={() => vote(choice)}
        disabled={!!mine}
        aria-pressed={picked}
        className={`relative flex min-h-[56px] w-full items-center gap-3 overflow-hidden rounded-[10px] border px-3.5 py-2.5 text-left transition-colors [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange ${
          picked ? "border-orange bg-white" : "border-[#d9dde3] bg-white"
        } ${mine ? "cursor-default" : "hover:border-orange hover:bg-[#f5f7ff]"}`}
      >
        {share !== null && (
          <span
            aria-hidden="true"
            className={`absolute inset-y-0 left-0 ${picked ? "bg-orange/15" : "bg-[#eef0f3]"}`}
            style={{ width: `${share}%`, transition: "width .5s ease" }}
          />
        )}
        <span
          className={`relative inline-flex h-8 min-w-8 items-center justify-center rounded-full px-1.5 text-[13px] font-extrabold ${
            picked ? "bg-orange text-white" : "bg-navy-deep text-white"
          }`}
        >
          {label}
        </span>
        <span className="relative flex-1 text-[15px] font-semibold leading-snug text-navy-deep">{name}</span>
        {share !== null && <span className="relative text-[15px] font-bold tabular-nums text-navy-deep">{share}%</span>}
      </button>
    );
  };

  let line = "Tap your pick. One vote per matchup.";
  if (mine && fetched.kind === "loading") line = "Counting…";
  else if (mine && fetched.kind === "off") line = "Your pick is saved on this device. Live site totals are coming soon.";
  else if (t?.closed) line = `Voting is closed. ${t.count.toLocaleString("en-US")} site votes.`;
  else if (t) line = `You voted ${mine === "A" ? labelA : labelB}. ${t.count.toLocaleString("en-US")} site ${t.count === 1 ? "vote" : "votes"} so far, plus TikTok comments.`;

  return (
    <div className="not-prose my-6 rounded-[14px] border border-[#e3e7ec] bg-[#f7f8fa] p-3.5 font-sans">
      <p className="m-0 mb-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7380]">Vote</p>
      <div role="group" aria-label={`Vote: ${labelA} ${a} or ${labelB} ${b}`} className="grid gap-2 sm:grid-cols-2">
        {option("A", labelA, a)}
        {option("B", labelB, b)}
      </div>
      <p aria-live="polite" className="m-0 mt-2.5 text-[13px] leading-snug text-[#4b5563]">
        {line}
      </p>
    </div>
  );
}

export default function BracketVote() {
  const [slots, setSlots] = useState<Slot[]>([]);

  useEffect(() => {
    const found: Slot[] = [];
    document.querySelectorAll<HTMLElement>("[data-cw-vote]").forEach((el) => {
      const item = el.dataset.cwVote;
      const a = el.dataset.a;
      const b = el.dataset.b;
      if (!item || !a || !b) return;
      found.push({ el, item, a, b, labelA: el.dataset.labelA || "A", labelB: el.dataset.labelB || "B" });
    });
    Promise.resolve().then(() => setSlots(found));
  }, []);

  return <>{slots.map((s) => createPortal(<VoteBox item={s.item} a={s.a} b={s.b} labelA={s.labelA} labelB={s.labelB} />, s.el, s.item))}</>;
}
