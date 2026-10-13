"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { StandsPhoto } from "@/lib/homeToday";

// Jake 10/13: From the Stands shows a random one of his photos on every visit,
// not one per day. The server renders the day's pick (so the static page and
// crawlers always get a real photo), then the browser swaps in a random one.
const LABEL = "font-display text-[11px] font-black tracking-[0.18em] uppercase";

export default function FromTheStandsRandom({ photos, initial }: { photos: StandsPhoto[]; initial: StandsPhoto }) {
  const [photo, setPhoto] = useState(initial);
  useEffect(() => {
    if (photos.length > 1) setPhoto(photos[Math.floor(Math.random() * photos.length)]);
  }, [photos]);

  return (
    <Link prefetch={false} href={photo.href} className="group block">
      <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-4">
        <span className={`${LABEL} text-black`}>From the Stands</span>
        <span className="text-[11px] text-steel">Our photos · from our seats</span>
      </div>
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-[#e9ebef]">
        <img
          key={photo.src}
          src={photo.src}
          alt={photo.caption}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          style={photo.position ? { objectPosition: photo.position } : undefined}
        />
      </div>
      <p className="m-0 mt-3 text-[15px] font-bold leading-snug text-black group-hover:text-orange">{photo.caption}</p>
      <p className="m-0 mt-1 text-[12px] text-steel">{photo.where} · Photo by Jake Daneshgar</p>
    </Link>
  );
}
