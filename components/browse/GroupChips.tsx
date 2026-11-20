import Link from "next/link";
import { groupPath, groupsOf, hubByKey, type HubLeague } from "@/lib/teamGroups";

const CHIP =
  "inline-flex min-h-[44px] items-center gap-2 rounded-full border px-4 py-2 font-display text-[14px] font-extrabold whitespace-nowrap transition-colors";

/**
 * Every division (or conference) in a league as a row of chips, grouped by
 * AFC/NFC, AL/NL or East/West where the league has them. Phones swipe each row.
 */
export default function GroupChips({ league, current }: { league: HubLeague; current?: string }) {
  const hub = hubByKey(league)!;
  const groups = groupsOf(league);
  const parents = [...new Set(groups.map((x) => x.parent ?? ""))];
  return (
    <nav aria-label={`${hub.name} ${hub.groupWord === "Division" ? "divisions" : "conferences"}`} className="flex flex-col gap-2">
      {parents.map((p) => (
        <div key={p || "all"} className="flex items-center gap-2 -mx-5 px-5 overflow-x-auto chip-scroll pb-1 sm:flex-wrap sm:overflow-visible">
          {p && <span className="shrink-0 w-[44px] sm:w-auto sm:mr-1 text-[12px] font-black tracking-[0.14em] uppercase text-steel">{p}</span>}
          {groups
            .filter((x) => (x.parent ?? "") === p)
            .map((x) => {
              const on = x.slug === current;
              return (
                <Link
                  prefetch={false}
                  key={x.slug}
                  href={groupPath(x)}
                  aria-current={on ? "page" : undefined}
                  className={`${CHIP} shrink-0 ${on ? "bg-navy-deep border-navy-deep text-white" : "bg-white border-border text-black hover:border-black/30"}`}
                >
                  {x.logo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={x.logo} alt="" width={20} height={20} className="w-5 h-5 object-contain" loading="lazy" />
                  )}
                  {x.name}
                </Link>
              );
            })}
        </div>
      ))}
    </nav>
  );
}
