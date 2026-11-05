"use client";

// My Teams (Jake 11/2): a reader follows any number of clubs and sees each
// one's next uniform at the top of the homepage. The list lives only in the
// reader's browser (localStorage), so there is no login and nothing to store.
// MyTeamsRow shows the followed clubs; TeamPicker is the logo row that adds them.

import Link from "next/link";
import { useEffect, useState } from "react";
import type { MyTeamCard, MyTeamLeague } from "@/lib/myTeams";

const KEY = "cw-myteams";
const EVENT = "cw-myteams-change";
const LABEL = "font-display text-[11px] font-black tracking-[0.18em] uppercase";

function read(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function write(ids: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    // Private mode or blocked storage: the follow just lasts for this visit.
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: ids }));
}

function useFollowed(): [string[], (id: string) => void] {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    setIds(read());
    const on = (e: Event) => setIds((e as CustomEvent<string[]>).detail ?? read());
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, []);
  const toggle = (id: string) => {
    const cur = read();
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    setIds(next);
    write(next);
  };
  return [ids, toggle];
}

// "nfl:los-angeles-chargers" -> "/teams/nfl/los-angeles-chargers" (lib/myTeams teamPagePath;
// repeated here because that file reads the disk and can't ship to the browser).
const teamPage = (id: string) => `/teams/${id.replace(":", "/")}`;

export function MyTeamsRow({ teams, teamPages }: { teams: MyTeamCard[]; teamPages?: boolean }) {
  const [ids, toggle] = useFollowed();
  const [editing, setEditing] = useState(false);
  const mine = teams
    .filter((t) => ids.includes(t.id))
    // Soonest game first; offseason clubs (no next game) go last.
    .sort((a, b) => (a.next?.at ?? Infinity) - (b.next?.at ?? Infinity));
  if (!mine.length) return null;

  return (
    <section className="max-w-[1200px] mx-auto px-5 pt-6">
      <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-3">
        <span className={`${LABEL} text-black`}>My Teams</span>
        <button onClick={() => setEditing((v) => !v)} className="font-display text-[12px] font-extrabold text-orange">
          {editing ? "Done" : "Edit"}
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto pt-2 pr-2 pb-2 snap-x lg:flex-wrap lg:overflow-visible">
        {mine.map((t) => (
          <div key={t.id} className="relative snap-start shrink-0 w-[210px] sm:w-[250px]">
            <Link
              prefetch={false}
              href={teamPages ? teamPage(t.id) : t.href}
              className="flex gap-2.5 items-center rounded-xl p-2 sm:p-2.5 h-full bg-white border border-border hover:border-black/25 transition-colors"
              // Plain white card with the club's color as a left stripe, like the
              // site's story cards (Jake 11/4: the dark gradient read as AI).
              style={{ borderLeft: `5px solid ${t.color === "#0A1733" ? "#003087" : t.color}` }}
            >
              <div className="w-[48px] h-[56px] sm:w-[58px] sm:h-[68px] shrink-0 rounded-lg bg-[#f4f6f9] flex items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={t.next?.img ?? t.logo} alt="" className={t.next?.img ? "w-[90%] h-[90%] object-contain" : "w-[70%] h-[70%] object-contain"} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1 text-[9px] font-black tracking-[0.14em] uppercase text-steel truncate">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.logo} alt="" className="w-3.5 h-3.5 object-contain" />
                  {t.nickname} · {t.league}
                </div>
                {t.next ? (
                  <>
                    <div className="font-display font-black text-[14px] sm:text-[15px] leading-tight mt-0.5 truncate text-black">{t.next.look}</div>
                    <div className="text-[11px] text-gray-medium mt-0.5 truncate">
                      {t.next.when} · {t.next.opp}
                    </div>
                                      </>
                ) : (
                  <div className="font-display font-black text-[14px] leading-tight mt-0.5 text-black">{t.note}</div>
                )}
                              </div>
            </Link>
            {editing && (
              <button
                onClick={() => toggle(t.id)}
                aria-label={`Remove ${t.nickname}`}
                className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white text-black border border-border text-[14px] font-black shadow"
              >
                &times;
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

const TABS: MyTeamLeague[] = ["NFL", "CFB", "NBA", "NHL", "MLB"];
const TAB_LABEL: Partial<Record<MyTeamLeague, string>> = { CFB: "College Football" };

export function TeamPicker({ teams }: { teams: MyTeamCard[] }) {
  const [ids, toggle] = useFollowed();
  const [tab, setTab] = useState<MyTeamLeague>("NFL");
  const shown = teams.filter((t) => t.league === tab);

  return (
    <section className="max-w-[1200px] mx-auto px-5 pt-10">
      <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-3">
        <span className={`${LABEL} text-black`}>Find Your Team</span>
        <span className="text-[11px] font-semibold text-gray-medium">Tap ☆ to add it to My Teams</span>
      </div>
      <div className="flex gap-2 mb-3">
        {TABS.map((l) => (
          <button
            key={l}
            onClick={() => setTab(l)}
            className={`font-display font-extrabold text-[13px] px-3.5 py-1.5 rounded-full border ${l === tab ? "bg-navy-deep text-white border-navy-deep" : "bg-white border-border text-black"}`}
          >
            {TAB_LABEL[l] ?? l}
          </button>
        ))}
      </div>
      {/* Phones swipe the row; wider screens wrap it, since a mouse cannot swipe (Jake 11/2). */}
      <div className="flex gap-2.5 overflow-x-auto pt-2 pr-2 pb-2 lg:flex-wrap lg:overflow-visible">
        {shown.map((t) => {
          const on = ids.includes(t.id);
          return (
            <div key={t.id} className="relative shrink-0 w-[66px] text-center">
              <Link prefetch={false} href={t.href} className="block">
                <span className={`flex w-[66px] h-[66px] rounded-2xl bg-white border items-center justify-center ${on ? "border-orange" : "border-border"}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.logo} alt={`${t.name} logo`} className="w-[42px] h-[42px] object-contain" loading="lazy" />
                </span>
                <span className="block mt-1 text-[10px] font-bold text-gray-medium truncate">{t.nickname}</span>
              </Link>
              <button
                onClick={() => toggle(t.id)}
                aria-label={on ? `Remove ${t.nickname} from My Teams` : `Add ${t.nickname} to My Teams`}
                className={`absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full text-[13px] leading-none shadow border ${on ? "bg-orange text-white border-orange" : "bg-white text-gray-medium border-border"}`}
              >
                {on ? "★" : "☆"}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// The ☆ on a team page: same follow list as the homepage row (Jake 11/4,
// ESPN-style team pages).
export function FollowButton({ id, name }: { id: string; name: string }) {
  const [ids, toggle] = useFollowed();
  const on = ids.includes(id);
  return (
    <button
      onClick={() => toggle(id)}
      aria-pressed={on}
      aria-label={on ? `Unfollow ${name}` : `Follow ${name}`}
      className={`shrink-0 rounded-full px-4 py-2 font-display text-[13px] font-extrabold border-2 border-white ${on ? "bg-white text-black" : "bg-transparent text-white"}`}
    >
      {on ? "★ Following" : "☆ Follow"}
    </button>
  );
}
