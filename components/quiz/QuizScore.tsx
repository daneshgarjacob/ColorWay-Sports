"use client";

import { useState } from "react";
import styles from "./quiz.module.css";
import { setMark, useHydrated, useMarks } from "./quizStore";

// The tally at the bottom of a quiz page, plus the share line. Server render
// (and JavaScript off) shows the instructions only; the score fills in as the
// reader marks each answer.

function verdict(got: number, total: number): string {
  if (got === total) return "Perfect score.";
  if (got >= total - 2) return "Strong score for hard mode.";
  if (got >= total / 2) return "Respectable for hard mode.";
  return "Hard mode is hard. Try the next quiz below.";
}

export default function QuizScore({
  slug,
  total,
  leagueName,
  url,
  noun = "logo",
}: {
  slug: string;
  total: number;
  leagueName: string;
  url: string;
  /** Lower-case quiz subject: "logo", "jersey", "old logo". */
  noun?: string;
}) {
  const hydrated = useHydrated();
  const marks = useMarks(slug);
  const [shared, setShared] = useState<"" | "copied" | "failed">("");

  const answered = marks.filter(Boolean).length;
  const got = marks.filter((m) => m === "got").length;
  const done = answered === total;
  const line = `I got ${got}/${total} on the ColorWay hard ${leagueName} ${noun} quiz. Can you beat it?`;

  async function share() {
    const text = `${line} ${url}`;
    try {
      if (typeof navigator !== "undefined" && navigator.share && window.matchMedia("(pointer: coarse)").matches) {
        await navigator.share({ text: line, url });
        return;
      }
      await navigator.clipboard.writeText(text);
      setShared("copied");
    } catch (err) {
      // A cancelled share sheet throws AbortError: not a failure.
      if (err instanceof Error && err.name === "AbortError") return;
      setShared("failed");
    }
  }

  function reset() {
    for (let i = 0; i < total; i++) setMark(slug, i, undefined);
    document.querySelectorAll<HTMLDetailsElement>(`[data-quiz="${slug}"] details`).forEach((d) => (d.open = false));
    setShared("");
    document.getElementById("q1")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div id="score" className={styles.score}>
      <p className={styles.scoreKicker}>Your Score</p>
      {hydrated ? (
        <>
          <p className={styles.scoreNum}>
            <span key={got} className={styles.scorePop}>
              {got}
            </span>
            <span>/{total}</span>
          </p>
          <div className={styles.dots} aria-hidden>
            {Array.from({ length: total }, (_, i) => (
              <span
                key={i}
                className={`${styles.dot} ${marks[i] === "got" ? styles.dotGot : marks[i] === "missed" ? styles.dotMissed : ""}`}
              />
            ))}
          </div>
          {done ? (
            <>
              <p className={styles.scoreLine}>{verdict(got, total)}</p>
              <p className={styles.share}>{line}</p>
              <div className={styles.scoreBtns}>
                <button type="button" className={styles.scoreBtn} onClick={share}>
                  {shared === "copied" ? "Copied. Paste It Anywhere" : "Share Your Score"}
                </button>
                <button type="button" className={`${styles.scoreBtn} ${styles.scoreBtnGhost}`} onClick={reset}>
                  Play Again
                </button>
              </div>
              {shared === "failed" && (
                <p className={styles.scoreLine} style={{ fontSize: 16 }}>
                  Could not copy. Select the line above and copy it by hand.
                </p>
              )}
            </>
          ) : (
            <p className={styles.scoreLine}>
              {answered === 0
                ? `Reveal each answer and tap Got It or Missed It. Your score and share line show up here after all ${total}.`
                : `${answered} of ${total} marked. Keep going.`}
            </p>
          )}
        </>
      ) : (
        <p className={styles.scoreLine}>
          Count how many of the {total} you got before you opened the answer. Then send this page to a friend and see who knows their {leagueName} {noun}s better.
        </p>
      )}
    </div>
  );
}
