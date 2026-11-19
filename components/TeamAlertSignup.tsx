"use client";

import { useState } from "react";

/**
 * Slim team email signup that sits right under the "this week" box on team
 * schedule posts (Jake 11/13). Clarity showed under 5% of phone readers get
 * halfway down a schedule post, so the full signup after the grid was never
 * seen. Same /api/subscribe call, tagged with the team (utm_campaign).
 */
/*
 * Phones (Clarity 11/19): Mediavine's floating video player (bottom-left,
 * ~230x130 on a 390px screen) and the sticky bottom ad sit over the lower
 * ~260px of the screen, and a reader sat 30 seconds with the player over this
 * email field. So: the box now renders inside the this-week box, right under
 * the headline answer (TeamWearBox `signup` slot) instead of below its FAQ
 * list; on phones the field and button stack full width; and focusing the
 * field scrolls it into the clear upper part of the screen. UpNext hides while
 * any email form is on screen (data-signup).
 */
function liftIntoView(el: HTMLElement) {
  // After the keyboard opens, put the field about a third of the way down the
  // visible area, well above the floating player and the bottom ad.
  window.setTimeout(() => {
    const vh = window.visualViewport?.height ?? window.innerHeight;
    const r = el.getBoundingClientRect();
    if (r.top < 72 || r.bottom > vh - 280) {
      window.scrollBy({ top: r.top - vh * 0.3, behavior: "smooth" });
    }
  }, 300);
}

export default function TeamAlertSignup({
  team,
  who,
  accent = "#0025CC",
  embedded = false,
}: {
  team: string;
  who: string;
  accent?: string;
  /** Inside the this-week box: tinted panel instead of a separate card. */
  embedded?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return setStatus("error");
    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, team }),
      });
      if (!res.ok) throw new Error();
      setStatus("success");
      try {
        localStorage.setItem("cw-email-subscribed", "true");
      } catch {}
    } catch {
      setStatus("error");
    }
  };

  return (
    <aside
      aria-label="Team uniform email"
      data-signup=""
      className={
        embedded
          ? "mt-5 rounded-xl border border-black/10 bg-[#f5f7fb] px-4 pt-4 pb-5 sm:px-5"
          : "mt-3 rounded-2xl border border-black/10 bg-white px-5 pt-4 pb-5 sm:pb-4"
      }
    >
      {status === "success" ? (
        <p className="text-[15px] font-bold" style={{ color: accent }}>
          You&apos;re in. Check your inbox to confirm.
        </p>
      ) : (
        <form onSubmit={submit} className="flex flex-col sm:flex-row sm:items-center gap-3">
          <p className="text-[14px] font-extrabold text-black leading-snug sm:flex-1">
            Get {who} uniform every game week.{" "}
            <span className="font-semibold text-black/50">Free email.</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              required
              placeholder="you@email.com"
              aria-label="Email address"
              autoComplete="email"
              value={email}
              onFocus={(e) => liftIntoView(e.currentTarget)}
              onChange={(e) => {
                setEmail(e.target.value);
                if (status === "error") setStatus("idle");
              }}
              className="w-full min-w-0 sm:w-[200px] rounded-lg border border-black/15 bg-white px-3 py-3 sm:py-2.5 text-[16px] sm:text-[15px] outline-none focus:border-black/40"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full sm:w-auto rounded-lg px-4 py-3 sm:py-2.5 text-[15px] sm:text-[14px] font-bold text-white disabled:opacity-50 whitespace-nowrap"
              style={{ background: accent }}
            >
              {status === "loading" ? "…" : "Sign Up"}
            </button>
          </div>
        </form>
      )}
      {status === "error" && <p className="mt-2 text-[13px] text-red-600">Check the email and try again.</p>}
    </aside>
  );
}
