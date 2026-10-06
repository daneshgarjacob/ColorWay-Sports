"use client";

import { useMemo, useState } from "react";
import { EMBED_HEIGHT, SITE } from "@/lib/embed/types";

export type GeneratorTeam = {
  league: string;
  leagueLabel: string;
  key: string;
  name: string;
  /** Absolute URL of the team's schedule post. */
  sourceUrl: string;
};


const THEMES = [
  { key: "light", label: "Light" },
  { key: "dark", label: "Dark" },
  { key: "auto", label: "Match reader" },
] as const;

export default function EmbedGenerator({ teams }: { teams: GeneratorTeam[] }) {
  const [id, setId] = useState(() => {
    const lions = teams.find((t) => t.key === "lions");
    return lions ? `${lions.league}/${lions.key}` : `${teams[0].league}/${teams[0].key}`;
  });
  const [theme, setTheme] = useState<(typeof THEMES)[number]["key"]>("light");
  const [copied, setCopied] = useState(false);

  const team = teams.find((t) => `${t.league}/${t.key}` === id) ?? teams[0];
  const query = theme === "light" ? "" : `?theme=${theme}`;
  const path = `/embed/${team.league}/${team.key}${query}`;

  const snippet = useMemo(
    () =>
      `<iframe src="${SITE}${path}" title="${team.name} uniform this week" width="100%" height="${EMBED_HEIGHT}" style="max-width:400px;border:0" loading="lazy"></iframe>\n` +
      `<p style="margin:6px 0 0;font:12px/1.4 sans-serif"><a href="${team.sourceUrl}">Uniform data by ColorWay Sports</a></p>`,
    [path, team],
  );

  const leagues = [...new Set(teams.map((t) => t.leagueLabel))];

  async function copy() {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked: the textarea is still selectable */
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px] items-start">
      <div className="min-w-0">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-[#5F6B7D] mb-1.5">Team</span>
            <select
              value={id}
              onChange={(e) => setId(e.target.value)}
              className="w-full h-11 rounded-lg border border-[#D9DEE6] bg-white px-3 text-[15px] font-semibold text-[#0B1F4A] focus:outline-none focus:ring-2 focus:ring-[#2f6bed]/40"
            >
              {leagues.map((lg) => (
                <optgroup key={lg} label={lg}>
                  {teams
                    .filter((t) => t.leagueLabel === lg)
                    .map((t) => (
                      <option key={`${t.league}/${t.key}`} value={`${t.league}/${t.key}`}>
                        {t.name}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </label>
          <div>
            <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-[#5F6B7D] mb-1.5">Theme</span>
            <div className="flex h-11 rounded-lg border border-[#D9DEE6] bg-[#F2F4F7] p-1" role="radiogroup" aria-label="Theme">
              {THEMES.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  role="radio"
                  aria-checked={theme === t.key}
                  onClick={() => setTheme(t.key)}
                  className={`flex-1 rounded-md text-[13px] font-semibold transition-colors ${
                    theme === t.key ? "bg-white text-[#0B1F4A] shadow-sm" : "text-[#5F6B7D] hover:text-[#0B1F4A]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#5F6B7D]">Paste this into your page</span>
            <button
              type="button"
              onClick={copy}
              className="h-9 rounded-lg bg-[#2f6bed] px-4 text-[13px] font-bold text-white hover:bg-[#2459c9] transition-colors"
            >
              {copied ? "Copied" : "Copy code"}
            </button>
          </div>
          <textarea
            readOnly
            value={snippet}
            onFocus={(e) => e.currentTarget.select()}
            rows={6}
            spellCheck={false}
            className="w-full rounded-lg border border-[#D9DEE6] bg-[#0F1621] p-4 font-mono text-[12.5px] leading-relaxed text-[#DCE3EE] resize-none"
          />
          <p className="mt-2 text-[12.5px] text-[#5F6B7D] leading-relaxed">
            Works in WordPress (Custom HTML block), Squarespace (Code block), Wix (Embed code), Ghost and any forum that
            allows iframes. Keep the credit line under the widget; it is the only thing we ask for.
          </p>
        </div>
      </div>

      <div>
        <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-[#5F6B7D] mb-1.5">Live preview</span>
        <div className={`rounded-xl p-4 ${theme === "dark" ? "bg-[#0A0F17]" : "bg-[#F2F4F7]"}`}>
          <iframe
            key={path}
            src={path}
            title={`${team.name} uniform this week`}
            width="100%"
            height={EMBED_HEIGHT}
            style={{ maxWidth: 400, border: 0, display: "block" }}
          />
          <p className={`mt-1.5 text-[12px] ${theme === "dark" ? "text-[#A3ADBD]" : "text-[#5F6B7D]"}`}>
            <a href={team.sourceUrl} className="underline">Uniform data by ColorWay Sports</a>
          </p>
        </div>
      </div>
    </div>
  );
}
