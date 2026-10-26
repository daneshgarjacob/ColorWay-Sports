import type { Sponsor } from "@/lib/sponsors";

// "Presented by" strip under a story's byline (lib/sponsors.ts). A static,
// self-hosted image and a plain sponsored link: no ad tags or tracking pixels.
export default function SponsorStrip({ sponsor }: { sponsor: Sponsor & { href: string } }) {
  return (
    <a
      href={sponsor.href}
      target="_blank"
      rel="sponsored noopener"
      data-sponsor={sponsor.id}
      className="mt-4 flex max-w-[560px] items-center gap-3 rounded-[10px] border border-[#d6dcf5] bg-[#f3f6ff] px-4 py-2.5 no-underline hover:border-[#2f6bed]"
    >
      <span className="text-[10px] font-extrabold uppercase leading-tight tracking-[0.16em] text-[#6b7280]">
        {sponsor.label}
      </span>
      <img
        src={sponsor.logo}
        alt={sponsor.name}
        width={sponsor.logoWidth}
        height={sponsor.logoHeight}
        className="h-[22px] w-auto shrink-0"
        style={{ boxShadow: "none" }}
      />
      <span className="ml-auto hidden whitespace-nowrap text-[13px] font-semibold text-[#002fd9] sm:inline">
        {sponsor.line} →
      </span>
    </a>
  );
}
