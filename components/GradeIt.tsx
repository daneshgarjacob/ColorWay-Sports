"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  LETTERS,
  MIN_FOR_STATS,
  isGrade,
  letterOf,
  letterPercents,
  pretty,
  score100,
  score100ForMean,
  standing,
  versusColorway,
  type Aggregate,
  type Grade,
  type Letter,
} from "@/lib/grades/grade";
import { GRADES_KEY, gradeItSectionId } from "@/lib/grades/reserve";

// Grade It, Direction B "The Instrument" (review-screens/grade-it-design-
// directions.html, frames B1, B2). White surface, navy ink, Inter with
// tabular numerals; one joined five-segment A-F scale with Best / Worst
// under it; ColorWay's grade in a thin ring at the top right; after the tap
// three rings (You / Fans / ColorWay, each scored 0-100), a five-column
// distribution, a one-line hook and Share Your Grade. The only motion is the
// reader's ring filling to the score (globals.css .gi-arc, collapsed under
// prefers-reduced-motion).
//
// Bandwidth: this renders with the page and makes no request until the reader
// taps, or until mount finds a grade for this item already in localStorage
// (then one cached GET for the aggregate). The server never renders a grade,
// so the first client render matches the HTML and hydration is clean.

// GRADES_KEY: { [item]: Grade } in localStorage (lib/grades/reserve.ts).
const ANON_KEY = "cw-anon-id"; // random UUID, nothing else

/** Ring geometry: r 42 in a 92 box, 2π·42 ≈ 264. */
const CIRC = 264;

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

const MUTE = "text-[#6b7380]";
const KICKER = `font-semibold text-[10.5px] uppercase tracking-[0.12em] ${MUTE}`;

/**
 * One thin ring. `score` 0-100 fills the arc (null = empty track). `animate`
 * replays the fill whenever `grade` changes (the reader's ring only).
 */
function Ring({
  grade,
  score,
  under,
  accent = false,
  small = false,
  animate = false,
  label,
}: {
  grade: string;
  score: number | null;
  /** The small line under the grade: the score, or a word. */
  under: string;
  accent?: boolean;
  small?: boolean;
  animate?: boolean;
  /** Accessible name for the whole ring. */
  label: string;
}) {
  const px = small ? 72 : 92;
  const offset = score === null ? CIRC : Math.round(CIRC * (1 - Math.min(100, Math.max(0, score)) / 100));
  return (
    <div role="img" aria-label={label} className="relative shrink-0" style={{ width: px, height: px }}>
      <svg viewBox="0 0 92 92" width={px} height={px} className="-rotate-90" aria-hidden="true">
        <circle cx="46" cy="46" r="42" fill="none" stroke="#e6e8ec" strokeWidth="5" />
        <circle
          key={animate ? grade : undefined}
          cx="46"
          cy="46"
          r="42"
          fill="none"
          strokeWidth="5"
          className={`stroke-orange ${animate ? "gi-arc" : ""}`}
          strokeDasharray={CIRC}
          style={{ strokeDashoffset: offset }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none" aria-hidden="true">
        <b className={`font-bold tracking-[-0.03em] text-navy-deep ${small ? "text-[24px]" : "text-[30px]"}`}>{grade}</b>
        <small className={`mt-[3px] font-medium ${MUTE} ${small ? "text-[7.5px] tracking-[0.04em]" : "text-[10px] tracking-[0.06em]"}`}>
          {under}
        </small>
      </div>
    </div>
  );
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
  const fansScore = hasStats && agg.mean !== null ? score100ForMean(agg.mean) : null;

  // The Fans ring and its caption, by state.
  let fansGrade = "—";
  let fansUnder = "";
  let fansCaption = "";
  if (hasStats && agg?.fans) {
    fansGrade = pretty(agg.fans);
    fansUnder = String(fansScore ?? "");
    fansCaption = `${agg.count.toLocaleString("en-US")} grades`;
  } else if (fetched.kind === "loading") fansCaption = "Checking";
  else if (fetched.kind === "off") fansCaption = "Coming Soon";
  else if (agg) fansCaption = "Still Early";

  // The one-line hook.
  let line: React.ReactNode = null;
  if (you && fetched.kind === "loading") line = "Checking fan grades…";
  else if (you && fetched.kind === "off") line = "Fan grades are coming soon.";
  else if (you && agg && !hasStats)
    line = agg.count <= 1 ? "You’re the first to grade this." : `You’re one of the first ${agg.count} to grade this.`;
  else if (you && agg && hasStats) {
    const s = standing(you, agg.letters, agg.count);
    line = (
      <>
        {s.word === "tougher" ? "Tougher" : "Kinder"} than <b className="font-bold">{s.pct}%</b> of fans.
        {cw && <span className={MUTE}> {versusColorway(you, cw)}</span>}
      </>
    );
  }

  return (
    <section
      id={gradeItSectionId(item)}
      // gradeItReserveScript (rendered after this by the page) may add
      // data-graded before hydration; React leaves that attribute alone.
      suppressHydrationWarning
      aria-labelledby="grade-it-title"
      className="gi-box mt-5 border-t border-[#e6e8ec] pt-5 font-sans text-navy-deep tabular-nums tracking-[-0.005em] lg:max-w-[460px]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 id="grade-it-title" className="m-0 text-[16px] font-bold tracking-[-0.01em] text-navy-deep">
            {you ? "Your Grade" : "Grade It"}
          </h3>
          <p className={`mt-0.5 mb-0 text-[12.5px] leading-snug ${MUTE}`}>
            {you ? "Tap another letter to change it." : "Tap a letter. Refine with + and −."}
          </p>
        </div>
        {cw && <Ring grade={pretty(cw)} score={score100(cw)} under="COLORWAY" small label={`ColorWay grade ${pretty(cw)}`} />}
      </div>

      <div
        role="group"
        aria-label="Your grade, A to F"
        className="mt-3.5 grid h-[52px] grid-cols-5 overflow-hidden rounded-[10px] border border-orange/40 bg-white"
      >
        {LETTERS.map((l, i) => (
          <button
            key={l}
            type="button"
            aria-pressed={letter === l}
            onClick={() => pickLetter(l)}
            className={`h-full text-[17px] font-semibold text-navy-deep transition-colors duration-100 hover:bg-[#f3f4f6] aria-pressed:bg-orange aria-pressed:text-white aria-pressed:hover:bg-orange focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-orange [-webkit-tap-highlight-color:transparent] ${
              i ? "border-l border-[#e6e8ec]" : ""
            }`}
          >
            {l}
          </button>
        ))}
      </div>
      <div className={`flex justify-between px-0.5 pt-1.5 text-[10px] font-medium uppercase tracking-[0.08em] ${MUTE}`} aria-hidden="true">
        <span>Best</span>
        <span>Worst</span>
      </div>

      {letter && letter !== "F" && (
        <div className={`mt-3 flex items-center justify-between gap-3 text-[12.5px] ${MUTE}`}>
          <span id="grade-refine">Refine It</span>
          <div role="group" aria-labelledby="grade-refine" className="flex overflow-hidden rounded-[6px] border border-[#e6e8ec]">
            {(["+", "-"] as const).map((m, i) => (
              <button
                key={m}
                type="button"
                aria-pressed={mod === m}
                aria-label={m === "+" ? `${letter} plus` : `${letter} minus`}
                onClick={() => pickMod(m)}
                className={`h-11 w-12 bg-white text-[18px] text-navy-deep transition-colors duration-100 hover:bg-[#f3f4f6] aria-pressed:bg-[#f3f4f6] aria-pressed:font-bold focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-orange [-webkit-tap-highlight-color:transparent] ${
                  i ? "border-l border-[#e6e8ec]" : ""
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
          <div className="mt-[18px] border-t border-[#e6e8ec] pt-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col items-center gap-2">
                <Ring grade={pretty(you)} score={score100(you)} under={String(score100(you))} accent animate label={`Your grade ${pretty(you)}`} />
                <p className={`m-0 ${KICKER}`}>You</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Ring grade={fansGrade} score={fansScore} under={fansUnder} label={hasStats ? `Fans grade ${fansGrade}` : "Fans grade not available yet"} />
                <p className={`m-0 ${KICKER}`}>Fans</p>
                {fansCaption && <p className={`m-0 -mt-1 text-[11.5px] ${MUTE}`}>{fansCaption}</p>}
              </div>
              {cw && (
                <div className="flex flex-col items-center gap-2">
                  <Ring grade={pretty(cw)} score={score100(cw)} under={String(score100(cw))} label={`ColorWay grade ${pretty(cw)}`} />
                  <p className={`m-0 ${KICKER}`}>ColorWay</p>
                  <p className={`m-0 -mt-1 text-[11.5px] ${MUTE}`}>Our Call</p>
                </div>
              )}
            </div>

            {/* While the fan numbers load, hold the chart's space so the
                bars arriving do not push the rest of the page down (CLS). */}
            {!hasStats && fetched.kind === "loading" && <div className="mt-[18px] h-[74px]" aria-hidden="true" />}
            {hasStats && pct && (
              <dl className="mt-[18px] mb-0 grid h-[74px] grid-cols-5 gap-1.5" aria-label="Fan grades by letter">
                {LETTERS.map((l) => (
                  <div key={l} className="flex h-full flex-col">
                    <div className="flex flex-1 items-end" aria-hidden="true">
                      <span
                        className={`block w-full rounded-t-[2px] ${l === letter ? "bg-orange" : "bg-[#c9cdd5]"}`}
                        style={{ height: pct[l] ? `max(2px, ${pct[l]}%)` : 0 }}
                      />
                    </div>
                    <div className={`flex justify-center gap-1 pt-1.5 text-[11px] leading-none whitespace-nowrap ${MUTE}`}>
                      <dt className="font-semibold text-navy-deep">{l}</dt>
                      <dd className="m-0">{pct[l]}%</dd>
                    </div>
                  </div>
                ))}
              </dl>
            )}

            {line && <p className="mt-3.5 mb-0 text-[14px] leading-[1.45] text-navy-deep">{line}</p>}

            <div className="mt-3.5">
              <button
                type="button"
                onClick={share}
                className="h-11 rounded-[6px] border border-orange bg-orange px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[#001FA6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange"
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
