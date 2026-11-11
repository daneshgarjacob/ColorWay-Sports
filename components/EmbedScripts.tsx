"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// X (Twitter) widgets.js and Instagram embed.js, loaded ONLY on pages that
// actually have an embedded post. They used to load on every page from the
// root layout; on a schedule post with no tweets, widgets.js alone cost about
// 600 ms of phone main-thread time (Lighthouse 11/11), time the page could not
// answer a tap in (INP). Checked again on every client-side navigation, so a
// page reached by a link still gets its embeds. Once a script is on the page
// it stays; components/TwitterEmbed.tsx and InstagramEmbed.tsx re-scan new
// pages with the loaded script.
const SCRIPTS = [
  { selector: "blockquote.twitter-tweet, blockquote.twitter-video", src: "https://platform.twitter.com/widgets.js", id: "cw-x-widgets" },
  { selector: "blockquote.instagram-media", src: "https://www.instagram.com/embed.js", id: "cw-ig-embed" },
];

export default function EmbedScripts() {
  const pathname = usePathname();

  useEffect(() => {
    for (const s of SCRIPTS) {
      if (document.getElementById(s.id) || !document.querySelector(s.selector)) continue;
      const el = document.createElement("script");
      el.id = s.id;
      el.src = s.src;
      el.async = true;
      el.charset = "utf-8";
      document.body.appendChild(el);
    }
  }, [pathname]);

  return null;
}
