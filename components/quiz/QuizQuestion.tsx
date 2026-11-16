"use client";

import type { ReactNode } from "react";
import styles from "./quiz.module.css";
import { setMark, useHydrated, useMarks } from "./quizStore";

// One quiz question. The whole thing is server-rendered: the piece, the hint
// and a native <details> holding the answer (passed in as children from the
// server page), so the quiz works with JavaScript off. JavaScript only adds the
// "Did you get it?" buttons that feed the score at the bottom.

export default function QuizQuestion({
  slug,
  index,
  total,
  leagueName,
  pieceSrc,
  hint,
  children,
}: {
  slug: string;
  index: number;
  total: number;
  leagueName: string;
  pieceSrc: string;
  hint?: string;
  children: ReactNode;
}) {
  const hydrated = useHydrated();
  const mark = useMarks(slug)[index];
  const n = index + 1;
  const last = n === total;

  return (
    <section id={`q${n}`} className={styles.question} aria-labelledby={`q${n}-title`}>
      <div className={styles.qTop}>
        <p className={styles.qNum} style={{ margin: 0 }}>
          <b>{n}</b>/{total}
        </p>
        {mark && (
          <span key={mark} className={`${styles.qBadge} ${mark === "got" ? styles.qBadgeGot : styles.qBadgeMissed}`}>
            {mark === "got" ? "Got It" : "Missed"}
          </span>
        )}
      </div>
      <h2 id={`q${n}-title`} className={styles.qTitle}>
        Whose Logo Is This?
      </h2>

      <div className={styles.lens}>
        {/* eslint-disable-next-line @next/next/no-img-element -- public/ is served raw by design (AGENTS.md) */}
        <img
          src={pieceSrc}
          alt={`Question ${n}: a tiny piece of an ${leagueName} team logo`}
          width={320}
          height={320}
          loading={n <= 2 ? "eager" : "lazy"}
          decoding="async"
        />
      </div>
      {hint && <p className={styles.hint}>{hint}</p>}

      <details className={styles.details}>
        <summary className={styles.summary}>Show The Answer</summary>
        <div className={styles.answer}>{children}</div>

        {hydrated && (
          <div className={styles.mark}>
            <p className={styles.markQ}>Did You Get It?</p>
            <div className={styles.markRow}>
              <button
                type="button"
                className={`${styles.btn} ${mark === "got" ? styles.btnOn : ""}`}
                aria-pressed={mark === "got"}
                onClick={() => setMark(slug, index, "got")}
              >
                Got It
              </button>
              <button
                type="button"
                className={`${styles.btn} ${mark === "missed" ? styles.btnOn : ""}`}
                aria-pressed={mark === "missed"}
                onClick={() => setMark(slug, index, "missed")}
              >
                Missed It
              </button>
            </div>
          </div>
        )}

        <a className={styles.next} href={last ? "#score" : `#q${n + 1}`}>
          {last ? "See Your Score ↓" : `Next: Question ${n + 1} ↓`}
        </a>
      </details>
    </section>
  );
}
