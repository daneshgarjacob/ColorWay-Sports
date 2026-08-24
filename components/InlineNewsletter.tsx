"use client";

import { useState } from "react";

type Props = {
  eyebrow?: string;
  heading?: string;
  body?: string;
};

export default function InlineNewsletter({
  eyebrow = "The ColorWay Sports Newsletter",
  heading = "Get every uniform drop in your inbox.",
  body = "New jerseys, playoff trackers, and uniform news the moment it lands. Free, no spam.",
}: Props = {}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        // Also suppress the scroll-triggered EmailCapture popup on this
        // browser — a reader who subscribed here should never see it again.
        localStorage.setItem("cw-email-subscribed", "true");
      } else {
        setErrorMsg(data.error || "Something went wrong. Try again.");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Something went wrong. Try again.");
      setStatus("error");
    }
  };

  return (
    <aside
      aria-label="Newsletter signup"
      className="my-12 rounded-2xl border border-black/5 px-6 py-8 sm:px-10 sm:py-10"
      style={{
        background:
          "linear-gradient(135deg, #f6f6f8 0%, #ffffff 60%, #fff3eb 100%)",
      }}
    >
      <div className="max-w-[520px] mx-auto text-center">
        <p
          className="text-[10px] uppercase tracking-[0.22em] font-bold text-[#2f6bed] mb-2"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          {eyebrow}
        </p>
        <h2
          className="text-2xl sm:text-3xl font-extrabold text-black leading-tight tracking-tight mb-2"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          {heading}
        </h2>
        <p className="text-[15px] text-black/60 mb-5 leading-relaxed">
          {body}
        </p>
        {status === "success" ? (
          <p className="text-base font-semibold text-[#2f6bed] py-3">
            Thanks for subscribing — check your inbox to confirm.
          </p>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-3 max-w-[460px] mx-auto"
          >
            <input
              type="email"
              required
              placeholder="you@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (status === "error") setStatus("idle");
              }}
              className="flex-1 rounded-lg border border-black/10 bg-white px-4 py-3 text-[15px] text-black placeholder-black/40 outline-none focus:border-[#2f6bed] focus:ring-1 focus:ring-[#2f6bed] transition-colors"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="rounded-lg px-6 py-3 font-bold text-white transition-opacity disabled:opacity-50 whitespace-nowrap"
              style={{ backgroundColor: "#2f6bed" }}
            >
              {status === "loading" ? "Subscribing…" : "Subscribe"}
            </button>
          </form>
        )}
        {status === "error" && (
          <p className="text-red-500 text-sm mt-3">{errorMsg}</p>
        )}
      </div>
    </aside>
  );
}
