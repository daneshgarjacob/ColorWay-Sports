import Link from "next/link";
import { CYBER_WEEK, cyberWeekActive } from "@/lib/affiliates";

// One plain text line to our Cyber Week deals page (lib/affiliates.ts). Never a
// banner or a button; renders nothing outside the sale window.
export default function CyberWeekLine({ className = "" }: { className?: string }) {
  if (!cyberWeekActive()) return null;
  return (
    <p className={`mb-0 text-[14px] font-semibold ${className}`}>
      <Link prefetch={false} href={CYBER_WEEK.href} className="text-orange underline underline-offset-2 hover:text-blue-dark">
        {`${CYBER_WEEK.text} \u2192`}
      </Link>
    </p>
  );
}
