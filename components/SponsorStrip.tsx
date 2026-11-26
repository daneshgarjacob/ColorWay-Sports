import type { Sponsor } from "@/lib/sponsors";

// "Presented by" strip under a story's byline (lib/sponsors.ts). A static,
// self-hosted image and a plain sponsored link: no ad tags or tracking pixels.
export default function SponsorStrip({ sponsor }: { sponsor: Sponsor & { href: string } }) {
  // Sized logos (a square badge, a taller wordmark) stack the label on two even
  // lines so it never leaves a wide gap before the logo. Default stays as Daps ran.
  const sized = Boolean(sponsor.logoDisplayHeight);
  return (
    <a
      href={sponsor.href}
      target="_blank"
      rel="sponsored noopener"
      data-sponsor={sponsor.id}
      className={`group mt-4 flex ${sized ? "max-w-[600px]" : "max-w-[560px]"} items-center gap-3.5 overflow-hidden rounded-lg border border-black/10 bg-white pr-4 no-underline transition-colors hover:border-[#0025CC]`}
    >
      {/* Royal rule on the left edge: the same blue as the site header. */}
      <span aria-hidden className="w-[5px] self-stretch bg-[#0025CC]" />
      <span
        className={`py-3 font-display text-[10.5px] font-black uppercase leading-[1.35] tracking-[0.18em] text-black${sized ? " max-w-[176px] shrink-0" : ""}`}
      >
        {sponsor.label}
      </span>
      <span aria-hidden className="h-8 w-px shrink-0 bg-black/10" />
      <img
        src={sponsor.logo}
        alt={sponsor.name}
        width={sponsor.logoWidth}
        height={sponsor.logoHeight}
        className={sized ? "my-2 w-auto shrink-0" : "my-2 h-[22px] w-auto shrink-0"}
        style={sized ? { boxShadow: "none", height: Math.min(sponsor.logoDisplayHeight ?? 44, 44) } : { boxShadow: "none" }}
      />
      <span className="ml-auto hidden whitespace-nowrap text-[13px] font-semibold text-[#0025CC] group-hover:underline sm:inline">
        {sponsor.line} →
      </span>
    </a>
  );
}
