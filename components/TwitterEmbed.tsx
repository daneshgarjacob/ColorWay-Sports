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
    // Re-render any Twitter embeds when the component mounts
    if (window.twttr?.widgets) {
      window.twttr.widgets.load();
    }
  }, []);

  return null;
}
