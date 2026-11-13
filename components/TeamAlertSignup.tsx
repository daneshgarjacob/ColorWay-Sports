"use client";

import { useState } from "react";

/**
 * Slim team email signup that sits right under the "this week" box on team
 * schedule posts (Jake 11/13). Clarity showed under 5% of phone readers get
 * halfway down a schedule post, so the full signup after the grid was never
 * seen. Same /api/subscribe call, tagged with the team (utm_campaign).
 */
export default function TeamAlertSignup({ team, who, accent = "#0025CC" }: { team: string; who: string; accent?: string }) {
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
    <aside aria-label="Team uniform email" className="mt-3 rounded-2xl border border-black/10 bg-white px-5 py-4">
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
          <div className="flex gap-2">
            <input
              type="email"
              required
              placeholder="you@email.com"
              aria-label="Email address"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (status === "error") setStatus("idle");
              }}
              className="min-w-0 flex-1 sm:w-[200px] rounded-lg border border-black/15 px-3 py-2.5 text-[15px] outline-none focus:border-black/40"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="rounded-lg px-4 py-2.5 text-[14px] font-bold text-white disabled:opacity-50 whitespace-nowrap"
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
