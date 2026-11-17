"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import quiz from "../quiz.module.css";
import styles from "./daily.module.css";
import { answerHash, dayNumber, secondsToEtMidnight, slotFor } from "@/lib/dailyLogoHash";
import type { DailyAnswer, DailyDay } from "@/lib/dailyLogo";
import { computeStats, loadHistory, MAX_GUESSES, saveDay, type DayRecord, type History } from "./dailyStore";

// The Daily Logo game. Everything about "today" is worked out here in the
// browser from the prebuilt schedule, so the page itself stays static. Before
// hydration (and with JavaScript off) this renders nothing; the server page
// shows a <noscript> version instead.

const SHARE_URL = "colorwaysports.com/quiz/daily";

function article(league: string) {
  return /^[AEFHILMNORSX]/.test(league) ? "an" : "a";
}

function fmtClock(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export default function DailyLogo({
  epoch,
  salt,
  days,
  lists,
}: {
  epoch: string;
  salt: string;
  days: DailyDay[];
  lists: Record<string, string[]>;
}) {
  const [day, setDay] = useState<number | null>(null);
  const [history, setHistory] = useState<History>({});
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const [answer, setAnswer] = useState<DailyAnswer | null>(null);
  const [answerError, setAnswerError] = useState(false);
  const [shake, setShake] = useState(0);
  const [shared, setShared] = useState<"" | "copied" | "failed">("");
  const [left, setLeft] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mount: today's number + saved history. Then tick the countdown, and roll
  // over to the next logo at Eastern midnight without a reload.
  const dayRef = useRef<number | null>(null);
  useEffect(() => {
    const sync = () => {
      const n = dayNumber(epoch);
      if (dayRef.current !== n) {
        if (dayRef.current !== null) {
          setAnswer(null);
          setAnswerError(false);
          setQuery("");
          setPicked(null);
          setShared("");
        }
        dayRef.current = n;
        setDay(n);
      }
      setLeft(secondsToEtMidnight());
    };
    setHistory(loadHistory());
    sync();
    const t = window.setInterval(sync, 1000);
    return () => window.clearInterval(t);
  }, [epoch]);

  const today = day === null ? null : days[slotFor(day, days.length)];
  const rec: DayRecord = (day !== null && history[day]) || { g: [], s: "playing" };
  const finished = rec.s !== "playing";
  const misses = rec.g.length - (rec.s === "won" ? 1 : 0);
  const level = finished ? MAX_GUESSES : Math.min(rec.g.length + 1, MAX_GUESSES);
  const list = useMemo(() => (today ? lists[today.l] ?? [] : []), [today, lists]);
  const stats = useMemo(() => (day === null ? null : computeStats(history, day)), [history, day]);

  const loadAnswer = useCallback(async (key: string) => {
    setAnswerError(false);
    try {
      const res = await fetch(`/quiz/daily/answer/${key}`);
      if (!res.ok) throw new Error(String(res.status));
      setAnswer(await res.json());
    } catch {
      setAnswerError(true);
    }
  }, []);

  useEffect(() => {
    if (finished && today && !answer) loadAnswer(today.k);
  }, [finished, today, answer, loadAnswer]);

  const options = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list.filter((t) => !rec.g.includes(t) && (!q || t.toLowerCase().includes(q)));
  }, [list, query, rec.g]);

  if (day === null || !today) return null;

  function guess(team: string) {
    if (finished || day === null || !today || rec.g.includes(team)) return;
    const g = [...rec.g, team];
    const right = answerHash(salt, today.k, team) === today.h;
    const s = right ? "won" : g.length >= MAX_GUESSES ? "lost" : "playing";
    setHistory(saveDay(day, { g, s }));
    setQuery("");
    setPicked(null);
    if (!right) setShake((x) => x + 1);
    if (s === "playing") inputRef.current?.focus();
  }

  // What the Guess button would send: the tapped team, an exact typed name, or
  // the only team left in the filtered list.
  const exact = options.find((t) => t.toLowerCase() === query.trim().toLowerCase());
  const choice = picked ?? exact ?? (query.trim() && options.length === 1 ? options[0] : null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (choice) guess(choice);
  }

  const squares = rec.g.map((_, i) => (rec.s === "won" && i === rec.g.length - 1 ? "🟩" : "🟥")).join("");
  const scoreText = rec.s === "won" ? `${rec.g.length}/${MAX_GUESSES}` : `X/${MAX_GUESSES}`;
  const shareLine = `ColorWay Daily Logo #${day} — ${scoreText} ${squares} — ${SHARE_URL}`;

  async function share() {
    try {
      if (typeof navigator !== "undefined" && navigator.share && window.matchMedia("(pointer: coarse)").matches) {
        await navigator.share({ text: shareLine });
        return;
      }
      await navigator.clipboard.writeText(shareLine);
      setShared("copied");
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setShared("failed");
    }
  }

  return (
    <div className={styles.game}>
      <div className={styles.topline}>
        <p className={styles.num}>
          Daily Logo <b>#{day}</b>
        </p>
        <p className={styles.league}>
          Today: {article(today.l)} {today.l} logo
        </p>
      </div>

      <div key={shake} className={`${quiz.lens} ${styles.lens} ${shake && !finished ? styles.shake : ""}`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- public/ is served raw by design (AGENTS.md) */}
        <img
          key={level}
          className={styles.crop}
          src={`/quiz/daily/${today.k}-${level}.webp`}
          alt={`Daily Logo #${day}: a tiny piece of ${article(today.l)} ${today.l} team logo`}
          width={320}
          height={320}
        />
      </div>

      <ol className={styles.pips} aria-label="Guesses">
        {Array.from({ length: MAX_GUESSES }, (_, i) => {
          const g = rec.g[i];
          const hit = g && rec.s === "won" && i === rec.g.length - 1;
          return (
            <li key={i} className={`${styles.pip} ${g ? (hit ? styles.pipHit : styles.pipMiss) : ""}`}>
              <span className={styles.pipN}>{i + 1}</span>
              <span className={styles.pipTeam}>{g ?? (i === rec.g.length && !finished ? "Your guess" : "")}</span>
              {g && <span aria-label={hit ? "right" : "wrong"}>{hit ? "✓" : "✗"}</span>}
            </li>
          );
        })}
      </ol>

      {!finished && (
        <form className={styles.form} onSubmit={submit}>
          <p className={styles.status} aria-live="polite">
            {misses === 0
              ? `Three guesses. Each miss shows you a bigger piece.`
              : misses === 1
                ? "Not it. Here is a bigger piece. Two guesses left."
                : "Not it either. Biggest piece. Last guess."}
          </p>
          <label htmlFor="daily-guess" className={styles.label}>
            Which {today.l} team?
          </label>
          <input
            ref={inputRef}
            id="daily-guess"
            className={styles.input}
            type="text"
            inputMode="search"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder="Type a team"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPicked(null);
            }}
          />
          <ul className={styles.options} role="listbox" aria-label={`${today.l} teams`}>
            {options.map((t) => (
              <li key={t} role="option" aria-selected={picked === t}>
                <button
                  type="button"
                  className={`${styles.option} ${picked === t ? styles.optionOn : ""}`}
                  onClick={() => {
                    setPicked(t);
                    setQuery(t);
                  }}
                >
                  {t}
                </button>
              </li>
            ))}
            {options.length === 0 && <li className={styles.none}>No {today.l} team matches that.</li>}
          </ul>
          <button type="submit" className={styles.go} disabled={!choice}>
            {choice ? `Guess: ${choice}` : "Pick A Team To Guess"}
          </button>
        </form>
      )}

      {finished && (
        <div className={styles.result}>
          <p className={styles.verdict}>
            {rec.s === "won"
              ? rec.g.length === 1
                ? "First Guess. Ridiculous."
                : `Got It In ${rec.g.length}.`
              : "Not Today."}
          </p>

          {answer ? (
            <div className={styles.answer}>
              <div className={quiz.pair}>
                <div className={quiz.mini}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- public/ is served raw by design */}
                  <img src={`/quiz/daily/${today.k}-1.webp`} alt="" width={92} height={92} />
                </div>
                <span className={quiz.arrow} aria-hidden>
                  →
                </span>
                <div className={quiz.full}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- public/ is served raw by design */}
                  <img src={answer.logo} alt={`${answer.team} logo`} width={220} height={220} />
                </div>
              </div>
              <p className={quiz.team}>{answer.team}</p>
              <p className={quiz.piece}>
                <strong>The piece:</strong> {answer.piece}
              </p>
              <p className={quiz.fact}>{answer.fact}</p>
              <ul className={quiz.links}>
                {answer.links.map((l) => (
                  <li key={l.href}>
                    <a href={l.href}>{l.label}</a>
                  </li>
                ))}
                <li>
                  <a href={`/quiz/${answer.quiz.slug}`}>Play The Full Quiz: {answer.quiz.title}</a>
                </li>
              </ul>
            </div>
          ) : answerError ? (
            <p className={styles.status}>
              Could not load the answer.{" "}
              <button type="button" className={styles.retry} onClick={() => loadAnswer(today.k)}>
                Try Again
              </button>
            </p>
          ) : (
            <p className={styles.status}>Loading the answer…</p>
          )}

          <div className={styles.card}>
            <p className={styles.share}>{shareLine}</p>
            <button type="button" className={quiz.scoreBtn} onClick={share}>
              {shared === "copied" ? "Copied. Paste It Anywhere" : "Share Your Result"}
            </button>
            {shared === "failed" && <p className={styles.small}>Could not copy. Select the line above and copy it by hand.</p>}
            {left !== null && (
              <p className={styles.next}>
                Next logo in <span className={styles.clock}>{fmtClock(left)}</span>
              </p>
            )}
          </div>
        </div>
      )}

      {stats && (
        <dl className={styles.stats}>
          <div>
            <dt>Streak</dt>
            <dd>{stats.current}</dd>
          </div>
          <div>
            <dt>Best</dt>
            <dd>{stats.best}</dd>
          </div>
          <div>
            <dt>Played</dt>
            <dd>{stats.played}</dd>
          </div>
          <div>
            <dt>Win %</dt>
            <dd>{stats.winPct}</dd>
          </div>
        </dl>
      )}
    </div>
  );
}
