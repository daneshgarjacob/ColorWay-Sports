"use client";

// My Teams (Jake 11/2): a reader follows any number of clubs and sees each
// one's next uniform at the top of the homepage. The list lives only in the
// reader's browser (localStorage), so there is no login and nothing to store.
// MyTeamsRow shows the followed clubs; TeamPicker is the logo row that adds them.

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import type { MyTeamCard, MyTeamLeague } from "@/lib/myTeams";
import { clarityTag, trackEvent } from "@/lib/track";

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
    const removing = cur.includes(id);
    const next = removing ? cur.filter((x) => x !== id) : [...cur, id];
    setIds(next);
    write(next);
    // GA4 (11/20): how many readers set up My Teams. Team id only, nothing personal.
    trackEvent(removing ? "my_teams_remove" : "my_teams_add", {
      team_id: id,
      league: id.split(":")[0],
      team_count: next.length,
      placement: placementOf(window.location.pathname),
    });
  };
  return [ids, toggle];
}

function placementOf(p: string): string {
  if (p === "/") return "home";
  if (p.startsWith("/my-teams")) return "my_teams_page";
  if (p.startsWith("/teams/")) return "team_page";
  return "other";
}

/**
 * One GA4 event per homepage view with the number of teams saved (0 when
 * none), so GA4 can answer "what share of homepage visitors use My Teams, and
 * how many teams on average". Also tags the Clarity session.
 */
export function useReportMyTeamsCount(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const n = read().length;
    trackEvent("my_teams_view", { team_count: n, has_my_teams: n > 0 ? "yes" : "no" });
    clarityTag("my_teams_count", String(n));
  }, [enabled]);
}

// "nfl:los-angeles-chargers" -> "/teams/nfl/los-angeles-chargers" (lib/myTeams teamPagePath;
// repeated here because that file reads the disk and can't ship to the browser).
const teamPage = (id: string) => `/teams/${id.replace(":", "/")}`;

function MatchSide({ logo, look, img, label }: { logo?: string; look?: string; img?: string; label: string }) {
  return (
    <div className="flex-1 min-w-0 flex flex-col items-center text-center gap-1.5">
      <div className="w-[110px] h-[124px] sm:w-[150px] sm:h-[168px] rounded-xl bg-[#f4f6f9] flex items-center justify-center overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {(img ?? logo) && <img src={img ?? logo} alt="" className={img ? "w-[92%] h-[92%] object-contain" : "w-[55%] h-[55%] object-contain"} />}
      </div>
      <div className="font-display font-black text-[15px] sm:text-[17px] leading-tight">{label}</div>
      {look && <div className="text-[12px] sm:text-[13px] leading-snug text-foreground/80">{look}</div>}
    </div>
  );
}

// Jake 11/5: tapping a card opens the matchup, our jersey against theirs,
// instead of leaving the homepage. The team page is one more tap away.
function Matchup({ t, href }: { t: MyTeamCard; href: string }) {
  const g = t.next!;
  const home = g.opp.startsWith("vs ");
  const oppName = g.vs?.nickname ?? g.opp.replace(/^(vs|at) /, "");
  const us = <MatchSide logo={t.logo} look={g.look} img={g.img} label={t.nickname} />;
  const them = <MatchSide logo={g.vs?.logo} look={g.vs?.look} img={g.vs?.img} label={oppName} />;
  return (
    <div className="mt-1 mb-2 rounded-2xl border border-border bg-white p-4" style={{ borderTop: `4px solid ${t.color === "#0A1733" ? "#003087" : t.color}` }}>
      <div className={`${LABEL} text-steel text-center mb-3`}>{g.when}</div>
      <div className="flex items-start gap-2 max-w-[520px] mx-auto">
        {home ? them : us}
        <div className="self-center font-display font-black text-[13px] text-steel">at</div>
        {home ? us : them}
      </div>
      {!g.vs?.look && <div className="text-center text-[11px] text-steel mt-2">{oppName} jersey not posted yet</div>}
      <div className="text-center mt-3">
        <Link prefetch={false} href={href} className="font-display text-[14px] font-extrabold text-orange">
          {`Every ${t.nickname} uniform this season →`}
        </Link>
      </div>
    </div>
  );
}

// Jake 11/20: the big cards crowded the homepage, so My Teams is now a slim
// ticker (Option C of three mockups): one row of team chips
// with the next jersey in color words, tap one to slide open the matchup,
// then each team's newest story. Desktop lines the stories up under their
// chips; phones swipe the chips and list the stories.
const stripe = (c: string) => (c === "#0A1733" ? "#003087" : c);
const isToday = (t: MyTeamCard) => /^(Today|Tonight)/.test(t.next?.when ?? "");
// "Sun, Nov 22 · Week 12" -> "Sun, Nov 22 vs Jets": the week tag is noise on a chip.
const nextLine = (t: MyTeamCard) => (t.next ? `${t.next.when.split(" · ")[0]} ${t.next.opp}` : `${t.nickname} · ${t.league}`);

/** Small pulsing dot for a game today, like the red dots on the tracker menus. */
function LiveDot() {
  return (
    <span className="relative inline-flex w-2 h-2 shrink-0" aria-hidden>
      <span className="absolute inset-0 rounded-full bg-[#E4002B] opacity-60 motion-safe:animate-ping" />
      <span className="relative w-2 h-2 rounded-full bg-[#E4002B]" />
    </span>
  );
}

export function MyTeamsRow({
  teams,
  teamPages,
  latest = {},
  reportView,
}: {
  teams: MyTeamCard[];
  teamPages?: boolean;
  /** Newest story per club id from the last month (lib/browse newestStoryByTeam), 11/19. */
  latest?: Record<string, { slug: string; title: string }>;
  /** Homepage only: send the my_teams_view GA4 event with the saved-team count. */
  reportView?: boolean;
}) {
  useReportMyTeamsCount(!!reportView);
  const [ids, toggle] = useFollowed();
  const [editing, setEditing] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const mine = teams
    .filter((t) => ids.includes(t.id))
    // Soonest game first; offseason clubs (no next game) go last.
    .sort((a, b) => (a.next?.at ?? Infinity) - (b.next?.at ?? Infinity));
  if (!mine.length) return null;
  const opened = mine.find((t) => t.id === open && t.next);
  const hrefOf = (t: MyTeamCard) => (teamPages ? teamPage(t.id) : t.href);
  // Desktop: chips and stories share one column grid, up to five across, so
  // each headline sits under its own team and the row never wraps raggedly.
  const cols = { "--mt-cols": Math.min(mine.length, 5) } as CSSProperties;
  const grid = "lg:grid lg:grid-cols-[repeat(var(--mt-cols),minmax(0,1fr))] lg:gap-3";

  return (
    <section className="max-w-[1200px] mx-auto px-5 pt-6">
      <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-3">
        <span className={`${LABEL} text-black`}>My Teams</span>
        <div className="flex items-center gap-4">
          {editing && (
            <Link prefetch={false} href="/my-teams#find-your-team" className="font-display text-[12px] font-extrabold text-orange">
              + Add teams
            </Link>
          )}
          <button onClick={() => setEditing((v) => !v)} className="font-display text-[12px] font-extrabold text-orange">
            {editing ? "Done" : "Edit"}
          </button>
        </div>
      </div>

      <div style={cols} className={`flex gap-2 overflow-x-auto chip-scroll -mx-5 px-5 pt-2 pb-1 lg:mx-0 lg:px-0 lg:overflow-visible ${grid}`}>
        {mine.map((t, i) => {
          const on = open === t.id;
          const body = (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={t.logo} alt="" className="w-7 h-7 object-contain shrink-0" />
              <span className="min-w-0 text-left">
                <span className="block font-display font-black text-[15px] leading-tight text-black truncate">{t.next?.look ?? t.note}</span>
                <span className="flex items-center gap-1.5 text-[13px] leading-snug text-gray-medium">
                  {isToday(t) && <LiveDot />}
                  <span className="truncate">{nextLine(t)}</span>
                </span>
              </span>
            </>
          );
          const cls = `flex items-center gap-2.5 w-full min-h-[52px] pl-3 pr-3.5 py-1.5 rounded-xl bg-white border transition-colors ${on ? "border-black" : "border-border hover:border-black/25"}`;
          const style = { boxShadow: `inset 4px 0 0 ${stripe(t.color)}` };
          return (
            <div key={t.id} className="browse-rise relative shrink-0 max-w-[260px] lg:max-w-none" style={{ animationDelay: `${i * 50}ms` }}>
              {t.next ? (
                <button type="button" aria-expanded={on} onClick={() => setOpen((v) => (v === t.id ? null : t.id))} className={cls} style={style}>
                  {body}
                </button>
              ) : (
                <Link prefetch={false} href={hrefOf(t)} className={cls} style={style}>
                  {body}
                </Link>
              )}
              {editing && (
                <button
                  onClick={() => toggle(t.id)}
                  aria-label={`Remove ${t.nickname}`}
                  className="absolute -top-2 -right-2 z-10 w-7 h-7 rounded-full bg-white text-black border border-border text-[14px] font-black shadow"
                >
                  &times;
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* The matchup slides open with a grid-rows transition, so nothing jumps. */}
      <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${opened ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">{opened && <div className="pt-2"><Matchup t={opened} href={hrefOf(opened)} /></div>}</div>
      </div>

      {/* 11/19: the newest story on each followed club; no recent story = its team page. */}
      <div className="mt-2 border-t border-border pt-1">
        <ul style={cols} className={`m-0 p-0 list-none ${grid}`}>
          {mine.map((t) => {
            const s = latest[t.id];
            return (
              // Phones gather the story-less teams into one shared row below.
              <li key={t.id} className={`${s ? "flex" : "hidden lg:flex"} items-start gap-2 min-h-[44px] py-1.5 border-b border-border lg:border-b-0`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={t.logo} alt="" width={20} height={20} className="w-5 h-5 object-contain shrink-0 mt-0.5" />
                {s ? (
                  <Link prefetch={false} href={`/stories/${s.slug}`} className="min-w-0 text-[14px] font-bold leading-snug text-black hover:text-orange line-clamp-1 lg:line-clamp-2">
                    {s.title}
                  </Link>
                ) : (
                  <Link prefetch={false} href={teamPage(t.id)} className="text-[14px] font-extrabold font-display text-orange">
                    {`All ${t.nickname} →`}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
        {mine.some((t) => !latest[t.id]) && (
          <div className="lg:hidden flex flex-wrap gap-x-5 min-h-[44px] items-center py-1">
            {mine
              .filter((t) => !latest[t.id])
              .map((t) => (
                <Link key={t.id} prefetch={false} href={teamPage(t.id)} className="inline-flex items-center gap-2 min-h-[44px] text-[14px] font-extrabold font-display text-orange">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.logo} alt="" width={20} height={20} className="w-5 h-5 object-contain" />
                  {`All ${t.nickname} →`}
                </Link>
              ))}
          </div>
        )}
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
    <section id="find-your-team" className="max-w-[1200px] mx-auto px-5 pt-10 scroll-mt-4">
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
