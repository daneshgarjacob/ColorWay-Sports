import type { Metadata } from "next";
import NflWeekZoneV2 from "@/components/NflWeekZoneV2";
import NflWeekZone from "@/components/NflWeekZone";
import WorldSeriesZone from "@/components/WorldSeriesZone";

// Jake 10/17: "I need to see the band mock on the actual site." Not linked
// anywhere and not indexed. Delete once the new band ships to the homepage.
export const metadata: Metadata = {
  title: "NFL Band Preview",
  robots: { index: false, follow: false },
};

export default function NflBandPreview() {
  return (
    <main>
      <div className="max-w-[1200px] mx-auto px-5 pt-6 pb-2 text-[13px] text-[#5f7085]">
        <b className="text-[#0B1F4A]">Preview for Jake:</b> the new NFL band (first), between the ALCS band and the
        current NFL band (last) for comparison. Live data, same as the homepage.
      </div>
      <WorldSeriesZone />
      <NflWeekZoneV2 />
      <div className="max-w-[1200px] mx-auto px-5 pt-8 pb-2 text-[12px] font-bold uppercase tracking-[0.14em] text-[#8A8F98]">
        Current NFL band (for comparison)
      </div>
      <NflWeekZone />
    </main>
  );
}
