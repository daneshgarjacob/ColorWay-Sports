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

export function MyTeamsRow({ teams, teamPages }: { teams: MyTeamCard[]; teamPages?: boolean }) {
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

  return (
    <section className="max-w-[1200px] mx-auto px-5 pt-6">
      <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-3">
        <span className={`${LABEL} text-black`}>My Teams</span>
        <button onClick={() => setEditing((v) => !v)} className="font-display text-[12px] font-extrabold text-orange">
          {editing ? "Done" : "Edit"}
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto pt-2 pr-2 pb-2 snap-x lg:flex-wrap lg:overflow-visible">
        {mine.map((t) => {
          // Jake 11/5: clubs out of season (no next game) shrink to a small chip
          // everywhere; on desktop, in-season clubs with no game today go slim
          // too, so the row stays one line and the big cards are tonight's games.
          const off = !t.next;
          const quiet = off || !/^(Today|Tonight)/.test(t.next?.when ?? "");
          const inner = (
            <>
              <div className={`w-[48px] h-[56px] sm:w-[58px] sm:h-[68px] shrink-0 rounded-lg ${off ? "hidden" : quiet ? "lg:hidden" : ""} bg-[#f4f6f9] flex items-center justify-center overflow-hidden`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={t.next?.img ?? t.logo} alt="" className={t.next?.img ? "w-[90%] h-[90%] object-contain" : "w-[70%] h-[70%] object-contain"} />
              </div>
              <div className="min-w-0 text-left">
                <div className="flex items-center gap-1 text-[9px] font-black tracking-[0.14em] uppercase text-steel truncate">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.logo} alt="" className="w-3.5 h-3.5 object-contain" />
                  {t.nickname} · {t.league}
                </div>
                {t.next ? (
                  <>
                    <div className={`font-display font-black text-[14px] sm:text-[15px] leading-tight mt-0.5 truncate text-black ${quiet ? "lg:text-[13px]" : ""}`}>{t.next.look}</div>
                    <div className="text-[11px] text-gray-medium mt-0.5 truncate">
                      {t.next.when} · {t.next.opp}
                    </div>
                  </>
                ) : (
                  <div className="font-display font-black text-[13px] leading-tight mt-0.5 text-black">{t.note}</div>
                )}
              </div>
            </>
          );
          const cls = `flex gap-2.5 items-center rounded-xl p-2 sm:p-2.5 h-full w-full bg-white border transition-colors ${open === t.id ? "border-black" : "border-border hover:border-black/25"}`;
          // Plain white card with the club's color as a left stripe, like the
          // site's story cards (Jake 11/4: the dark gradient read as AI).
          const style = { borderLeft: `5px solid ${t.color === "#0A1733" ? "#003087" : t.color}` };
          return (
          <div key={t.id} className={`relative snap-start shrink-0 ${off ? "w-[150px]" : `w-[210px] sm:w-[250px] ${quiet ? "lg:w-[200px]" : ""}`}`}>
            {off ? (
              <Link prefetch={false} href={hrefOf(t)} className={cls} style={style}>{inner}</Link>
            ) : (
              <button type="button" aria-expanded={open === t.id} onClick={() => setOpen((v) => (v === t.id ? null : t.id))} className={cls} style={style}>
                {inner}
              </button>
            )}
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
          );
        })}
      </div>
      {opened && <Matchup t={opened} href={hrefOf(opened)} />}
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
