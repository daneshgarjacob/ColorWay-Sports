import Link from "next/link";
import type { MyTeamCard } from "@/lib/myTeams";
import { teamPagePath } from "@/lib/myTeams";

// One club's look this week, for the division and conference pages (11/19):
// jersey tile, the look in color words, the game, and whether the team has
// confirmed it. The tile opens the club's uniform schedule post, the page
// that answers "what are they wearing" (and earns); the small link under it
// opens the team page. Same data as the team pages and My Teams, so the three
// never disagree. No records or stat pills on tiles.

export function lookStatus(card: MyTeamCard): "Confirmed" | "Expected" | null {
  if (!card.next) return null;
  if (card.next.confirmed === true) return "Confirmed";
  if (card.next.confirmed === false) return "Expected";
  return null;
}

const stripe = (c: string) => (c === "#0A1733" ? "#003087" : c);

export default function TeamLookTile({ card, index = 0 }: { card: MyTeamCard; index?: number }) {
  const g = card.next;
  const status = lookStatus(card);
  return (
    <div
      className="browse-rise group/tile flex flex-col rounded-2xl border border-border bg-white overflow-hidden"
      style={{ borderTop: `4px solid ${stripe(card.color)}`, animationDelay: `${Math.min(index, 11) * 45}ms` }}
    >
      <Link prefetch={false} href={card.href} className="flex flex-col flex-1 p-3 sm:p-4 no-underline">
        <div className="relative aspect-[5/6] w-full rounded-xl bg-[#f4f6f9] flex items-center justify-center overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={g?.img ?? card.logo}
            alt={g?.img ? `${card.name} ${g.look}` : `${card.name} logo`}
            loading="lazy"
            decoding="async"
            className={`${g?.img ? "w-[90%] h-[90%]" : "w-[48%] h-[48%]"} object-contain transition-transform duration-300 ease-out motion-safe:group-hover/tile:-translate-y-1`}
          />
          {status && (
            <span
              className={`absolute top-2 left-2 rounded-full px-2.5 py-1 font-display text-[11px] font-extrabold tracking-[0.06em] uppercase ${
                status === "Confirmed" ? "bg-[#e7f6ee] text-[#0f7a43]" : "bg-white text-steel border border-border"
              }`}
            >
              {status}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={card.logo} alt="" width={22} height={22} loading="lazy" className="w-[22px] h-[22px] object-contain shrink-0" />
          <span className="font-display font-black text-[17px] leading-tight text-black group-hover/tile:text-orange">{card.nickname}</span>
        </div>
        {g ? (
          <>
            <div className="text-[16px] font-bold leading-snug text-black mt-1.5">{g.look}</div>
            <div className="text-[14px] text-steel leading-snug mt-0.5">
              {g.when} · {g.opp}
            </div>
          </>
        ) : (
          <div className="text-[16px] font-bold leading-snug text-black mt-1.5">{card.note}</div>
        )}
        <span className="mt-auto pt-3 font-display text-[14px] font-extrabold text-orange">Uniform Schedule &rarr;</span>
      </Link>
      <Link
        prefetch={false}
        href={teamPagePath(card.id)}
        className="flex items-center min-h-[44px] px-3 sm:px-4 border-t border-border font-display text-[13px] font-extrabold text-black hover:bg-black/[0.03]"
      >
        <span className="sr-only">{card.nickname} </span>News &amp; Stories &rarr;
      </Link>
    </div>
  );
}
