"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    twttr?: {
      widgets: {
        load: (el?: HTMLElement) => void;
      };
    };
  }
}

export default function TwitterEmbed() {
  useEffect(() => {
    // Re-render any Twitter embeds when the component mounts. widgets.js loads
    // afterInteractive, so on a fresh page load it is often not there yet at
    // mount time; keep checking for a few seconds until it is.
    let tries = 0;
    const tick = () => {
      if (window.twttr?.widgets) {
        window.twttr.widgets.load();
        return;
      }
      if (tries++ < 40) timer = window.setTimeout(tick, 250);
    };
    let timer = window.setTimeout(tick, 0);
    return () => window.clearTimeout(timer);
  }, []);

  return null;
}
