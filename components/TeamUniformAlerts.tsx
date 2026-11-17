"use client";

// Team Alerts signup, components/TeamUniformAlerts.tsx (Jake 11/16): "Tell me what my team is wearing before
// every game." Email + the team(s) to follow. Submits through the existing
// /api/subscribe (beehiiv), which saves the teams in the "Team Alerts" custom
// field. SIGNUP ONLY: nothing is emailed from here. See lib/teamAlerts.ts for
// the on/off switch and docs/team-alerts-plan.md for the email itself.
//
// Layout: the server renders the box at its final size. Teams the reader
// follows in My Teams (localStorage `cw-myteams`) are added after load into a
// one-line row whose height is reserved, so nothing below it moves.

import { useEffect, useState } from "react";
import {
  MAX_ALERT_TEAMS,
  isTeamAlertId,
  nameFromId,
  type TeamAlertId,
  type TeamAlertOption,
} from "@/lib/teamAlerts";

type Props = {
  /** The team this page is about; preselected. */
  pageTeam?: { id: TeamAlertId; name: string; nickname?: string };
  /** Every team, for the /alerts picker. Pages about one team leave it out to stay light. */
  options?: TeamAlertOption[];
  /** /alerts while the switch is off: say alerts are not live yet. */
  preview?: boolean;
  className?: string;
};

type Chip = { id: TeamAlertId; name: string; on: boolean };

const MY_TEAMS_KEY = "cw-myteams";
const LEAGUE_LABEL: Record<string, string> = { nfl: "NFL", nba: "NBA", nhl: "NHL", mlb: "MLB", cfb: "College Football" };

function readFollowed(): TeamAlertId[] {
  try {
    const v = JSON.parse(localStorage.getItem(MY_TEAMS_KEY) ?? "[]");
    return Array.isArray(v) ? v.filter(isTeamAlertId) : [];
  } catch {
    return [];
  }
}

export default function TeamUniformAlerts({ pageTeam, options, preview = false, className = "" }: Props) {
  const nameOf = (id: TeamAlertId) => options?.find((o) => o.id === id)?.name ?? nameFromId(id);
  const [chips, setChips] = useState<Chip[]>(pageTeam ? [{ id: pageTeam.id, name: pageTeam.name, on: true }] : []);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Prefill: ?team=nfl:detroit-lions (links from team pages to /alerts), then My Teams.
  useEffect(() => {
    let fromUrl: TeamAlertId | null = null;
    try {
      const t = new URLSearchParams(window.location.search).get("team");
      if (isTeamAlertId(t)) fromUrl = t;
    } catch {
      // no URL access: skip
    }
    const followed = readFollowed();
    setChips((cur) => {
      const have = new Set(cur.map((c) => c.id));
      const add: Chip[] = [];
      for (const id of [fromUrl, ...followed]) {
        if (!id || have.has(id)) continue;
        have.add(id);
        // Followed teams are offered, not ticked, when the page has its own team.
        add.push({ id, name: nameOf(id), on: !pageTeam || id === fromUrl });
      }
      return [...cur, ...add].slice(0, 8);
    });
    // Runs once after load; nameOf only reads props.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const picked = chips.filter((c) => c.on);
  const toggle = (id: TeamAlertId) =>
    setChips((cur) =>
      cur.map((c) =>
        c.id === id ? { ...c, on: c.on ? false : cur.filter((x) => x.on).length < MAX_ALERT_TEAMS } : c
      )
    );
  const addTeam = (id: string) => {
    if (!isTeamAlertId(id)) return;
    setChips((cur) =>
      cur.some((c) => c.id === id)
        ? cur.map((c) => (c.id === id ? { ...c, on: true } : c))
        : [...cur, { id, name: nameOf(id), on: cur.filter((x) => x.on).length < MAX_ALERT_TEAMS }]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      setStatus("error");
      return;
    }
    if (picked.length === 0) {
      setErrorMsg("Pick at least one team.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, teams: picked.map((c) => c.id) }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus("success");
        try {
          localStorage.setItem("cw-email-subscribed", "true"); // no newsletter popup after this
        } catch {
          // blocked storage: the popup may ask once more, harmless
        }
      } else {
        setErrorMsg(data.error || "Something went wrong. Try again.");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Something went wrong. Try again.");
      setStatus("error");
    }
  };

  const who = pageTeam?.nickname ?? pageTeam?.name;
  const heading = pageTeam ? `Get ${pageTeam.name} Uniform Alerts` : "Pick Your Teams";
  const leagues = options ? [...new Set(options.map((o) => o.league))] : [];

  return (
    <section
      aria-label="Team uniform alerts signup"
      data-team-alerts
      className={`not-prose my-12 rounded-2xl border border-black/[0.08] border-t-4 border-t-[#0025CC] bg-white p-5 sm:p-7 ${className}`}
    >
      <p className="m-0 text-[13px] font-extrabold uppercase tracking-[0.16em] text-[#0025CC] leading-none">
        Before Every Game
      </p>
      <h2 className="mt-2 mb-0 text-[26px] sm:text-[30px] font-extrabold text-black leading-tight tracking-tight">
        {heading}
      </h2>
      <p className="mt-2 mb-0 text-[17px] sm:text-[18px] text-[#3c4250] leading-snug">
        {who
          ? `One short email before each ${who} game that says what they are wearing. The photos and our grade are one tap away on the site.`
          : "One short email before each game that says what your team is wearing. The photos and our grade are one tap away on the site."}
      </p>

      {status === "success" ? (
        <p className="mt-5 mb-0 rounded-xl bg-[#f5f8ff] px-4 py-4 text-[18px] font-bold text-[#0025CC] leading-snug" role="status">
          {preview
            ? "You're on the list. Alerts are not live yet; we'll start them soon."
            : `You're in. Your first alert lands before the next ${picked.length === 1 ? `${picked[0].name} game` : "game"}.`}
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-5">
          {options && (
            <label className="block mb-3">
              <span className="block text-[15px] font-bold text-black mb-1.5">Add a team</span>
              <select
                value=""
                onChange={(e) => addTeam(e.target.value)}
                className="w-full rounded-lg border border-black/15 bg-white px-3 py-3 text-[17px] text-black outline-none focus:border-[#0025CC] focus:ring-1 focus:ring-[#0025CC]"
              >
                <option value="">Choose a team…</option>
                {leagues.map((l) => (
                  <optgroup key={l} label={LEAGUE_LABEL[l] ?? l.toUpperCase()}>
                    {options
                      .filter((o) => o.league === l)
                      .map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
            </label>
          )}

          {/* One line, fixed height: followed teams slot in after load without moving anything. */}
          <div className="h-[48px] mb-3">
            <ul
              aria-label="Teams to get alerts for"
              className="m-0 p-0 list-none flex gap-2 overflow-x-auto whitespace-nowrap h-full items-center [scrollbar-width:none]"
            >
              {chips.length === 0 && (
                <li className="text-[16px] text-[#5b6474]">No team picked yet.</li>
              )}
              {chips.map((c) => (
                <li key={c.id} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => toggle(c.id)}
                    aria-pressed={c.on}
                    className={`h-10 rounded-full border px-4 text-[16px] font-bold transition-colors ${
                      c.on
                        ? "border-[#0025CC] bg-[#0025CC] text-white"
                        : "border-black/15 bg-white text-black hover:border-[#0025CC]"
                    }`}
                  >
                    {c.on ? "✓ " : "+ "}
                    {c.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              required
              inputMode="email"
              autoComplete="email"
              aria-label="Email address"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (status === "error") setStatus("idle");
              }}
              className="min-w-0 flex-1 rounded-lg border border-black/15 bg-white px-4 py-3.5 text-[18px] text-black placeholder-black/40 outline-none focus:border-[#0025CC] focus:ring-1 focus:ring-[#0025CC]"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="rounded-lg px-6 py-3.5 text-[18px] font-extrabold text-white whitespace-nowrap disabled:opacity-50"
              style={{ backgroundColor: "#0025CC" }}
            >
              {status === "loading" ? "Signing Up…" : "Get Alerts"}
            </button>
          </div>
          {status === "error" && <p className="mt-2 mb-0 text-[15px] text-red-600">{errorMsg}</p>}
        </form>
      )}

      <p className="mt-4 mb-0 text-[14px] text-[#5b6474] leading-snug">
        Free. One email per game at most, and you also get our Sunday newsletter. Mute a team or unsubscribe from
        any email. We use your address only to send these emails.{" "}
        <a href="/privacy-policy" className="underline text-[#0025CC]">
          Privacy Policy
        </a>
        {!options && (
          <>
            {" · "}
            <a href={pageTeam ? `/alerts?team=${pageTeam.id}` : "/alerts"} className="underline text-[#0025CC]">
              How Alerts Work
            </a>
          </>
        )}
      </p>
    </section>
  );
}
