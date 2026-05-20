"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "cw-cookie-consent";

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) setShow(true);
  }, []);

  const handleChoice = (choice: "accepted" | "declined") => {
    localStorage.setItem(STORAGE_KEY, choice);
    localStorage.setItem(`${STORAGE_KEY}-at`, String(Date.now()));
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: "rgba(15, 17, 24, 0.97)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderTop: "1px solid rgba(255, 255, 255, 0.08)",
        boxShadow: "0 -8px 32px rgba(0, 0, 0, 0.4)",
        color: "#fff",
        fontFamily: "Inter, system-ui, sans-serif",
        padding: "16px 20px",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          gap: 20,
          flexWrap: "wrap",
        }}
      >
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, flex: "1 1 320px", color: "rgba(255,255,255,0.9)" }}>
          We use cookies to analyze site traffic and serve ads. See our{" "}
          <Link
            href="/privacy-policy"
            style={{ color: "#FF5910", textDecoration: "underline", fontWeight: 600 }}
          >
            Privacy Policy
          </Link>{" "}
          for details.
        </p>
        <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => handleChoice("declined")}
            style={{
              padding: "10px 18px",
              background: "transparent",
              border: "1px solid rgba(255, 255, 255, 0.25)",
              borderRadius: 999,
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.3px",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => handleChoice("accepted")}
            style={{
              padding: "10px 22px",
              background: "#FF5910",
              border: "1px solid #FF5910",
              borderRadius: 999,
              color: "#fff",
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: "0.3px",
              cursor: "pointer",
              fontFamily: "inherit",
              boxShadow: "0 2px 12px rgba(255, 89, 16, 0.35)",
            }}
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}
