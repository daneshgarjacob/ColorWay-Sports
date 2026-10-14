"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  EMAIL_DISMISSED_KEY,
  EMAIL_SUBSCRIBED_KEY,
  countPageView,
  emailEligible,
  sessionPromptOwner,
  setStored,
} from "@/lib/promptGate";

// Newsletter sign-up prompt. Rules (site audit 10/13, see lib/promptGate.ts):
//   - never on the first page view of a session (a Google landing);
//   - never in a session where web push owns the prompt;
//   - phones (<768px) get a slim bottom bar that sits above Mediavine's sticky
//     bottom ad, never a full-screen modal (Google's intrusive interstitial
//     guidance); desktop keeps the centred modal;
//   - the phone bar hides while a Mediavine floating video player is on
//     screen and comes back when it closes (it must never cover the player);
//   - closing it stays closed for 7 days; subscribing stays closed for good.
// The subscribe call is unchanged: POST /api/subscribe (beehiiv).

const PHONE_MAX = 767;

// Mediavine's floating video players. On phones the Universal Video Player
// floats in #fixed_container_bottom (#universalPlayer_wrapper, close button
// .universalPlayer_close) right where the bar sits, and the in-content player
// (.mv-video-target) can go sticky too. Seen live on 10/14: the player's "Ad
// loading" box sat on top of the bar's Subscribe button. Named selectors first,
// then any visible <video> or video-ad iframe inside a position:fixed box, so a
// renamed class still gets caught.
const FLOATING_PLAYER_SELECTORS = [
  "#universalPlayer_wrapper",
  ".universalPlayer_wrap",
  "[class*='mv-video__sticky']",
  "[class*='mv-sticky-video']",
  ".mediavine-video__sticky-container",
  "#mv-sticky-video",
].join(",");

function isOnScreen(el: Element): boolean {
  const r = el.getBoundingClientRect();
  if (r.width < 40 || r.height < 40) return false;
  if (r.bottom <= 0 || r.top >= window.innerHeight || r.right <= 0 || r.left >= window.innerWidth) return false;
  const cs = getComputedStyle(el);
  return cs.display !== "none" && cs.visibility !== "hidden" && Number(cs.opacity) > 0.05;
}

function insideFixedBox(el: Element, ours: Element | null): boolean {
  for (let n: Element | null = el; n && n !== document.body; n = n.parentElement) {
    if (ours && n === ours) return false;
    if (getComputedStyle(n).position === "fixed") return true;
  }
  return false;
}

/** True while a Mediavine floating/sticky video player is visible on screen. */
function floatingPlayerVisible(ours: Element | null): boolean {
  for (const el of document.querySelectorAll(FLOATING_PLAYER_SELECTORS)) {
    if (isOnScreen(el)) return true;
  }
  for (const el of document.querySelectorAll("video, iframe[id*='universal_player'], iframe[src*='imasdk']")) {
    if (el.closest(".adhesion_wrapper")) continue; // the bottom banner, handled by adOffset
    if (isOnScreen(el) && insideFixedBox(el, ours)) return true;
  }
  return false;
}

export default function EmailCapture() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);
  const [phone, setPhone] = useState(false);
  const [adOffset, setAdOffset] = useState(0);
  // Hidden (not dismissed) while a Mediavine floating video is up, so the bar
  // never covers the player or its close button; it comes back once it closes.
  const [playerUp, setPlayerUp] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const pageView = countPageView(pathname);
    if (show) return; // already up from an earlier page this visit
    if (pageView < 2) return;
    if (sessionPromptOwner() !== "email") return;
    if (!emailEligible()) return;

    // Fire at HALF THE PAGE **or** a fixed depth, whichever comes first.
    //
    // The percentage-only version silently never fired on the site's most
    // valuable pages. The MLB daily tracker is ~200,000 words; 50% of it is
    // roughly 100,000 words down, so the one page a reader has a reason to
    // revisit every single morning was the one page that never asked them to
    // subscribe. Short pages still use the percentage (2,400px may be past
    // their end); long pages now trigger at a depth a real reader reaches.
    const DEPTH_PX = 2400;

    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight <= 0) return;
      const deepEnough = window.scrollY / scrollHeight > 0.5 || window.scrollY > DEPTH_PX;
      if (deepEnough) {
        setPhone(window.innerWidth <= PHONE_MAX);
        setShow(true);
        window.removeEventListener("scroll", handleScroll);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
    // `show` is read only to skip re-arming; re-run per page view, not per show.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Phone bar: keep it above Mediavine's bottom adhesion ad. The ad loads late,
  // resizes, and can be closed, so re-measure while the bar is up. Also flag
  // the page so the story "Up Next" bar stays out of the way meanwhile.
  useEffect(() => {
    if (!show || !phone) return;
    const root = document.documentElement;
    root.dataset.cwBottomBar = "newsletter";
    const measure = () => {
      const ad = document.querySelector(".adhesion_wrapper");
      const h = ad ? ad.getBoundingClientRect().height : 0;
      setAdOffset((prev) => (prev === h ? prev : h));
      const up = floatingPlayerVisible(barRef.current);
      setPlayerUp((prev) => (prev === up ? prev : up));
    };
    measure();
    // The player is injected, floated and closed by Mediavine's script, so watch
    // the DOM (batched to one check per frame) with the 1s poll as a backstop.
    let frame = 0;
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(() => { frame = 0; measure(); });
    };
    const mo = new MutationObserver(schedule);
    mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style"] });
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const id = window.setInterval(measure, 1000);
    return () => {
      window.clearInterval(id);
      mo.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) window.cancelAnimationFrame(frame);
      delete root.dataset.cwBottomBar;
    };
  }, [show, phone]);

  const handleDismiss = () => {
    setShow(false);
    setStored("local", EMAIL_DISMISSED_KEY, Date.now().toString());
  };

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
        setStored("local", EMAIL_SUBSCRIBED_KEY, "true");
        // The phone bar has no backdrop to tap away, so it clears itself.
        if (phone) window.setTimeout(() => setShow(false), 4000);
      } else {
        setErrorMsg(data.error || "Something went wrong. Try again.");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Something went wrong. Try again.");
      setStatus("error");
    }
  };

  if (!show) return null;

  const closeIcon = (size: number) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );

  if (phone) {
    return (
      <div
        ref={barRef}
        className="fixed inset-x-0 bottom-0 z-40 px-3 pb-3"
        style={{
          ...(adOffset ? { paddingBottom: adOffset + 8 } : null),
          ...(playerUp ? { display: "none" } : null),
        }}
        role="dialog"
        aria-label="Newsletter sign-up"
        aria-hidden={playerUp || undefined}
        data-cw-player-up={playerUp ? "" : undefined}
      >
        <div
          className="relative rounded-2xl bg-white border border-black/10 shadow-[0_-4px_24px_rgba(0,0,0,0.10),0_8px_24px_rgba(0,0,0,0.12)] px-3.5 pt-2.5 pb-3"
          style={{ animation: "fadeInUp 0.3s ease-out" }}
        >
          <button
            onClick={handleDismiss}
            className="absolute right-1 top-1 flex h-9 w-9 items-center justify-center text-black/45 hover:text-black"
            aria-label="Close"
          >
            {closeIcon(16)}
          </button>
          {status === "success" ? (
            <p className="m-0 py-1.5 pr-8 text-[14px] font-bold text-gray-900">
              You&rsquo;re in. Watch your inbox for this week&rsquo;s issue.
            </p>
          ) : (
            <>
              <p className="m-0 pr-8 text-[13.5px] font-bold leading-snug text-gray-900">
                Don&rsquo;t miss a jersey drop.{" "}
                <span className="font-medium text-gray-500">One email a week.</span>
              </p>
              <form onSubmit={handleSubmit} className="mt-2 flex gap-2">
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="Your email"
                  aria-label="Email address"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (status === "error") setStatus("idle");
                  }}
                  // 16px stops iOS zooming the page when the field is tapped.
                  className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-2 text-[16px] text-gray-900 placeholder-gray-400 outline-none focus:border-[#2f6bed] focus:ring-1 focus:ring-[#2f6bed]"
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="shrink-0 rounded-lg px-4 py-2 text-[14px] font-semibold text-white disabled:opacity-50"
                  style={{ backgroundColor: "#2f6bed" }}
                >
                  {status === "loading" ? "..." : "Subscribe"}
                </button>
              </form>
              {status === "error" && <p className="m-0 mt-1.5 text-[12.5px] text-red-500">{errorMsg}</p>}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}
      onClick={handleDismiss}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl"
        style={{ animation: "fadeInUp 0.3s ease-out" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200 hover:text-gray-900"
          aria-label="Close"
        >
          {closeIcon(20)}
        </button>

        {status === "success" ? (
          <div className="text-center py-4">
            <p className="text-2xl font-bold text-gray-900 mb-2">You're in.</p>
            <p className="text-gray-500">We'll send you the latest uniform news and jersey reviews.</p>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-gray-900 mb-2 pr-8">
              Don't Miss a Jersey Drop.
            </h2>
            <p className="text-gray-500 mb-6">
              Get uniform news and jersey reviews before anyone else. No spam, just the good stuff.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status === "error") setStatus("idle");
                }}
                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-[#2f6bed] focus:ring-1 focus:ring-[#2f6bed] transition-colors"
              />
              {status === "error" && (
                <p className="text-red-500 text-sm">{errorMsg}</p>
              )}
              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full rounded-lg py-3 font-semibold text-white transition-opacity disabled:opacity-50"
                style={{ backgroundColor: "#2f6bed" }}
              >
                {status === "loading" ? "Subscribing..." : "Subscribe"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
