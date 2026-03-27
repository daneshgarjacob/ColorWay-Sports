"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    instgrm?: {
      Embeds: {
        process: () => void;
      };
    };
  }
}

export default function InstagramEmbed() {
  useEffect(() => {
    if (window.instgrm?.Embeds) {
      window.instgrm.Embeds.process();
    }
  }, []);

  return null;
}
