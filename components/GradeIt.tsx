"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  LETTERS,
  MIN_FOR_STATS,
  isGrade,
  letterOf,
  letterPercents,
  pretty,
  standing,
  versusColorway,
  type Aggregate,
  type Grade,
  type Letter,
} from "@/lib/grades/grade";

// Grade It, phase 1 (review-screens/grade-it-mock.html, frames 1, 4, 5).
//
// Five letters, one tap; +/- refine after the tap; then You / Fans / ColorWay
// on one line, a five-segment bar and a hook line. The grade is changeable
// (another tap updates the same row, never a second vote).
//
// Bandwidth: this renders with the page and makes no request until the reader
// taps, or until mount finds a grade for this item already in localStorage
// (then one cached GET for the aggregate). The server never renders a grade,
// so the first client render matches the HTML and hydration is clean.

const GRADES_KEY = "cw-grades-v1"; // { [item]: Grade }
const ANON_KEY = "cw-anon-id"; // random UUID, nothing else

type Mod = "+" | "-" | "";
type Fetched = { kind: "idle" } | { kind: "loading" } | { kind: "ok"; agg: Aggregate } | { kind: "off" };

const compose = (letter: Letter, mod: Mod): Grade => (letter === "F" ? "F" : `${letter}${mod}`) as Grade;

function readStored(item: string): Grade | null {
  try {
    const all = JSON.parse(localStorage.getItem(GRADES_KEY) ?? "{}") as Record<string, unknown>;
    return isGrade(all[item]) ? all[item] : null;
  } catch {
    return null;
  }
}

function writeStored(item: string, grade: Grade) {
  try {
    const all = JSON.parse(localStorage.getItem(GRADES_KEY) ?? "{}") as Record<string, string>;
    all[item] = grade;
    localStorage.setItem(GRADES_KEY, JSON.stringify(all));
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

export type GradeItProps = {
  /** "jotd:2026-11-10" */
  item: string;
  /** "Blue Jackets Hometown Remix (Cannon)": the subject in the share text. */
  subject: string;
  /** ColorWay's grade, when the editor has set one. */
  colorwayGrade?: string;
  /** Absolute URL the share text links to. */
  shareUrl: string;
};

export default function GradeIt({ item, subject, colorwayGrade, shareUrl }: GradeItProps) {
  const cw: Grade | null = isGrade(colorwayGrade) ? colorwayGrade : null;
  const [letter, setLetter] = useState<Letter | null>(null);
  const [mod, setMod] = useState<Mod>("");
  const [fetched, setFetched] = useState<Fetched>({ kind: "idle" });
  const [copied, setCopied] = useState(false);
  const seq = useRef(0);

  const you: Grade | null = letter ? compose(letter, mod) : null;

  const apply = useCallback(
    async (res: Promise<Response>) => {
      const n = ++seq.current;
      try {
        const r = await res;
        if (n !== seq.current) return;
        if (!r.ok) {
          setFetched({ kind: "off" });
          return;
        }
        setFetched({ kind: "ok", agg: (await r.json()) as Aggregate });
      } catch {
        if (n === seq.current) setFetched({ kind: "off" });
      }
    },
    []
  );

  // A grade this browser gave before: show it and fetch the (CDN-cached) aggregate.
  useEffect(() => {
    const had = readStored(item);
    if (!had) return;
    let live = true;
    // Next microtask, not synchronously in the effect body (react-hooks rule);
    // the remembered grade still shows before the aggregate arrives.
    Promise.resolve().then(() => {
      if (!live) return;
      setLetter(letterOf(had));
      setMod(had.length > 1 ? (had[1] as Mod) : "");
      setFetched({ kind: "loading" });
      apply(fetch(`/api/grades?item=${encodeURIComponent(item)}`));
    });
    return () => {
      live = false;
    };
  }, [item, apply]);

  const submit = useCallback(
    (grade: Grade) => {
      writeStored(item, grade);
      setFetched((f) => (f.kind === "ok" ? f : { kind: "loading" }));
      apply(
        fetch("/api/grades", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ item, grade, anon: anonId() }),
        })
      );
    },
    [item, apply]
  );

  const pickLetter = (l: Letter) => {
    const nextMod: Mod = l === "F" ? "" : mod;
    setLetter(l);
    setMod(nextMod);
    submit(compose(l, nextMod));
  };

  const pickMod = (m: Mod) => {
    if (!letter || letter === "F") return;
    const nextMod: Mod = mod === m ? "" : m;
    setMod(nextMod);
    submit(compose(letter, nextMod));
  };

  const share = async () => {
    if (!you) return;
    const text = `I graded the ${subject}: ${pretty(you)}.${cw ? ` ColorWay says ${pretty(cw)}.` : ""}`;
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ text, url: shareUrl });
        return;
      }
      await navigator.clipboard.writeText(`${text} ${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const agg = fetched.kind === "ok" ? fetched.agg : null;
  const hasStats = !!agg && agg.count >= MIN_FOR_STATS;
  const pct = hasStats ? letterPercents(agg.letters, agg.count) : null;

  let line: React.ReactNode = null;
  if (you && fetched.kind === "loading") line = "Checking fan grades…";
  else if (you && fetched.kind === "off") line = "Fan grades are coming soon.";
  else if (you && agg && !hasStats)
    line = agg.count <= 1 ? "You’re the first to grade this." : `You’re one of the first ${agg.count} to grade this.`;
  else if (you && agg && hasStats) {
    const s = standing(you, agg.letters, agg.count);
    line = (
      <>
        You&rsquo;re {s.word} than <b className="font-bold tabular-nums">{s.pct}%</b> of fans.
        {cw && <> {versusColorway(you, cw)}</>}
      </>
    );
  }

  return (
    <section aria-labelledby="grade-it-title" className="mt-5 border-t border-border pt-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 id="grade-it-title" className="m-0 font-display text-[10.5px] font-extrabold uppercase tracking-[0.16em] text-steel">
            {you ? "Your Grade" : "Grade It"}
          </h3>
          <p className="mt-1 mb-0 text-[14px] leading-snug text-gray-medium">
            {you ? "Tap a letter to change it." : "How good is this jersey? One tap."}
          </p>
        </div>
        {cw && (
          <p className="m-0 shrink-0 text-right font-display text-[10.5px] font-extrabold uppercase tracking-[0.16em] text-steel">
            ColorWay
            <span className="block mt-0.5 font-sans text-[22px] font-extrabold normal-case tracking-[-0.02em] leading-none text-black tabular-nums">
              {pretty(cw)}
            </span>
          </p>
        )}
      </div>

      <div role="group" aria-label="Your grade, A to F" className="mt-3 grid grid-cols-5 gap-1.5">
        {LETTERS.map((l) => (
          <button
            key={l}
            type="button"
            aria-pressed={letter === l}
            onClick={() => pickLetter(l)}
            className="h-12 rounded-[6px] border border-[#d4d4d4] bg-white text-[20px] font-bold tracking-[-0.02em] text-black transition-[background-color,border-color,transform] duration-100 hover:border-black active:scale-[0.97] aria-pressed:border-black aria-pressed:bg-black aria-pressed:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange [-webkit-tap-highlight-color:transparent]"
          >
            {l}
          </button>
        ))}
      </div>

      {letter && letter !== "F" && (
        <div className="mt-2.5 flex items-center justify-between gap-3 text-[12.5px] text-steel">
          <span id="grade-refine">Refine It</span>
          <div role="group" aria-labelledby="grade-refine" className="inline-flex overflow-hidden rounded-[6px] border border-[#d4d4d4]">
            {(["+", "-"] as const).map((m, i) => (
              <button
                key={m}
                type="button"
                aria-pressed={mod === m}
                aria-label={m === "+" ? `${letter} plus` : `${letter} minus`}
                onClick={() => pickMod(m)}
                className={`h-11 min-w-[56px] bg-white px-3 text-[16px] font-semibold text-black transition-colors duration-100 aria-pressed:bg-black aria-pressed:text-white focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-orange [-webkit-tap-highlight-color:transparent] ${
                  i ? "border-l border-[#d4d4d4]" : ""
                }`}
              >
                {m === "+" ? "+" : "−"}
              </button>
            ))}
          </div>
        </div>
      )}

      <div aria-live="polite">
        {you && (
          <div className="gi-reveal mt-4 border-t border-border pt-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="m-0 font-display text-[10.5px] font-extrabold uppercase tracking-[0.16em] text-steel">You</p>
                <p className="mt-1 mb-0 text-[30px] font-extrabold leading-none tracking-[-0.03em] text-orange tabular-nums">{pretty(you)}</p>
              </div>
              <div className={cw ? "" : "text-right"}>
                <p className="m-0 font-display text-[10.5px] font-extrabold uppercase tracking-[0.16em] text-steel">Fans</p>
                <p className="mt-1 mb-0 text-[30px] font-extrabold leading-none tracking-[-0.03em] text-black tabular-nums">
                  {hasStats && agg?.fans ? pretty(agg.fans) : "—"}
                  {hasStats && agg && (
                    <span className="ml-1.5 text-[12px] font-medium tracking-normal text-steel">
                      {agg.count.toLocaleString("en-US")} grades
                    </span>
                  )}
                </p>
              </div>
              {cw && (
                <div className="text-right">
                  <p className="m-0 font-display text-[10.5px] font-extrabold uppercase tracking-[0.16em] text-steel">ColorWay</p>
                  <p className="mt-1 mb-0 text-[30px] font-extrabold leading-none tracking-[-0.03em] text-black tabular-nums">{pretty(cw)}</p>
                </div>
              )}
            </div>

            {hasStats && agg && pct && (
              <>
                <div className="mt-3.5 flex h-2 gap-px overflow-hidden rounded-[2px] bg-[#ececec]" aria-hidden="true">
                  {LETTERS.map((l) => (
                    <span
                      key={l}
                      className={`block h-full ${l === letter ? "bg-orange" : "bg-navy-deep"}`}
                      style={{ width: `${pct[l]}%`, display: pct[l] ? undefined : "none" }}
                    />
                  ))}
                </div>
                <dl className="mt-1.5 mb-0 grid grid-cols-5 text-[11px] font-semibold tracking-[0.04em] text-steel tabular-nums">
                  {LETTERS.map((l) => (
                    <div key={l} className={`flex gap-1 ${l === letter ? "text-black" : ""}`}>
                      <dt>{l}</dt>
                      <dd className="m-0">{pct[l]}%</dd>
                    </div>
                  ))}
                </dl>
              </>
            )}

            {line && <p className="mt-3 mb-0 text-[14px] leading-snug text-black">{line}</p>}

            <div className="mt-4">
              <button
                type="button"
                onClick={share}
                className="h-11 rounded-[6px] bg-black px-4 text-[13px] font-semibold text-white transition-colors hover:bg-navy-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange"
              >
                {copied ? "Link Copied" : "Share Your Grade"}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
