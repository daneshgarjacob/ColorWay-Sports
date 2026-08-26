import type { TeamQuickLinksEntry } from "@/lib/teamQuickLinks";
import { LEAGUE_NAMES } from "@/lib/teamLogos";

// The uniform schedule / uniform calendar bar that sits above the story grid on
// any team view of /stories. Server-rendered on purpose: these are the two links
// a team search is actually after, and crawlers should see them in the HTML.

const KIND_COPY: Record<string, string> = {
  schedule: "Every jersey and when they wear it",
  calendar: "Day by day, everything worn this season",
};

function Icon({ kind }: { kind: string }) {
  return kind === "schedule" ? (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  ) : (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
    </svg>
  );
}

export default function TeamQuickLinks({ teams }: { teams: TeamQuickLinksEntry[] }) {
  if (teams.length === 0) return null;

  return (
    <div className="mb-8 flex flex-col gap-3">
      {teams.map((team) => (
        <section
          key={team.slug}
          aria-label={`${team.name} uniform tracking`}
          className="rounded-2xl border border-black/[0.08] bg-[#f7f9fc] p-4 sm:p-5"
        >
          <div className="flex items-center gap-2.5 mb-3">
            {team.logo && (
              <img src={team.logo} alt="" className="w-6 h-6 object-contain flex-shrink-0" />
            )}
            <span className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#5b6474]">
              Track the {team.name}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white bg-[#14284b] rounded px-1.5 py-0.5">
              {LEAGUE_NAMES[team.league] || team.league.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {team.links.map((link) => (
              <a
                key={link.kind}
                href={link.href}
                className="group flex items-center gap-3 rounded-xl border border-black/10 bg-white px-4 py-3 hover:border-[#2f6bed] hover:shadow-[0_4px_16px_rgba(47,107,237,0.13)] transition-all duration-150"
              >
                <span className="flex-shrink-0 w-9 h-9 rounded-lg bg-[#e8eefb] text-[#2f6bed] flex items-center justify-center">
                  <Icon kind={link.kind} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[14px] font-bold text-blue-dark leading-tight">
                    {link.label}
                  </span>
                  <span className="block text-[12px] text-gray-medium leading-tight mt-0.5">
                    {KIND_COPY[link.kind]}
                  </span>
                </span>
                <span className="ml-auto text-[#2f6bed] font-bold text-lg leading-none group-hover:translate-x-0.5 transition-transform duration-150">
                  &rarr;
                </span>
              </a>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
