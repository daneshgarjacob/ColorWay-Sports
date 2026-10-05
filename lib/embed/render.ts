import type { EmbedCard } from "./types";

// Renders the widget as one small, self-contained HTML document: no React, no
// site layout, no ads, no analytics, no client JS beyond the three-line theme
// switch. It is what other sites put in an iframe, so it has to be light and
// it has to look finished at any width from ~280 to 400px.

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const STATUS_TEXT: Record<EmbedCard["status"], string> = {
  confirmed: "Confirmed by the team",
  expected: "Expected",
  worn: "Final · worn",
};

function isLight(hex?: string): boolean {
  if (!hex || !/^#[0-9a-f]{6}$/i.test(hex)) return false;
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.299 * r + 0.587 * g + 0.114 * b > 220;
}

// Plain jersey outline, filled with the schedule post's colour for the week,
// for when no photo maps exactly. Colour only, never a guessed design.
function jerseySvg(fill: string): string {
  const stroke = isLight(fill) ? "#C9CED8" : "rgba(0,0,0,.18)";
  return `<svg viewBox="0 0 100 100" width="84" height="84" aria-hidden="true"><path d="M34 12 L22 16 L6 30 L14 46 L24 40 L24 90 L76 90 L76 40 L86 46 L94 30 L78 16 L66 12 C63 20 57 24 50 24 C43 24 37 20 34 12 Z" fill="${esc(fill)}" stroke="${stroke}" stroke-width="1.5" stroke-linejoin="round"/></svg>`;
}

export function renderEmbedHtml(c: EmbedCard): string {
  const title = `${c.teamName} uniform this week · ColorWay Sports`;
  const photo = c.image
    ? `<img src="${esc(c.image)}" alt="${esc(c.imageAlt ?? "")}" width="200" height="200" decoding="async">`
    : jerseySvg(c.swatch);

  const rows = c.parts
    .map((p) => {
      const tba = p.label === "TBA";
      const dot = p.hex
        ? `<span class="dot" style="background:${esc(p.hex)}${isLight(p.hex) ? ";box-shadow:inset 0 0 0 1px #C9CED8" : ""}"></span>`
        : `<span class="dot dot-tba"></span>`;
      return `<div class="row">${dot}<span class="k">${esc(p.part)}</span><span class="v${tba ? " tba" : ""}">${esc(p.label)}</span></div>`;
    })
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>${esc(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@500;600;700;800&display=swap" rel="stylesheet">
<script>(function(){try{var t=new URLSearchParams(location.search).get("theme");if(t==="dark"||(t==="auto"&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.setAttribute("data-theme","dark")}catch(e){}})()</script>
<style>
:root{--bg:#fff;--ink:#0B1F4A;--muted:#5F6B7D;--soft:#8A93A3;--line:#E3E7EE;--well:#F2F4F7;--brand:#2f6bed;--ok:#1A7F37;--warn:#A86400;--chip:#F2F4F7}
:root[data-theme="dark"]{--bg:#0F1621;--ink:#EEF1F6;--muted:#A3ADBD;--soft:#7C8799;--line:#243041;--well:#E9ECF1;--chip:#fff;--brand:#7FA6FF;--ok:#4CC27A;--warn:#F0B44C}
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:transparent}
body{font-family:"Hanken Grotesk",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:var(--ink);-webkit-font-smoothing:antialiased}
.cw{max-width:400px;min-height:100vh;display:flex;flex-direction:column;background:var(--bg);border:1px solid var(--line);border-radius:14px;overflow:hidden}
.cw .body{flex:1}
.uni.long{font-size:14.5px}
.uni{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.rule{height:3px;background:${esc(c.accent)}}
.head{display:flex;align-items:center;gap:11px;padding:12px 14px 11px}
.chip{width:42px;height:42px;border-radius:50%;background:var(--chip);display:flex;align-items:center;justify-content:center;flex:none}
.logo{width:30px;height:30px;object-fit:contain}
.id{min-width:0;flex:1}
.id .kick{margin-bottom:2px}
.team{font-size:15px;font-weight:800;line-height:1.15;letter-spacing:-.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.meta{font-size:12px;color:var(--muted);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.body{display:grid;grid-template-columns:112px 1fr;gap:12px;padding:0 14px 12px;align-items:center}
.photo{height:118px;border-radius:10px;background:var(--well);display:flex;align-items:center;justify-content:center;padding:6px}
.photo img{max-width:100%;max-height:106px;width:auto;height:auto;object-fit:contain}
.kick{font-size:9.5px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--soft)}
.uni{font-size:17px;font-weight:800;line-height:1.15;letter-spacing:-.01em;margin:3px 0 7px}
.row{display:flex;align-items:center;gap:7px;font-size:12px;line-height:1.55}
.dot{width:9px;height:9px;border-radius:50%;flex:none}
.dot-tba{background:transparent;box-shadow:inset 0 0 0 1.5px var(--soft);opacity:.7}
.k{color:var(--muted);width:44px;flex:none}
.v{font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.v.tba{color:var(--soft);font-weight:600}
.status{display:flex;align-items:center;gap:6px;margin-top:8px;font-size:10.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
.status i{width:7px;height:7px;border-radius:50%;background:currentColor}
.s-confirmed,.s-worn{color:var(--ok)}
.s-expected{color:var(--warn)}
.note{font-size:10.5px;color:var(--soft);margin-top:2px;line-height:1.35}
.foot{display:flex;align-items:center;justify-content:space-between;gap:10px;border-top:1px solid var(--line);padding:9px 14px;font-size:11.5px;color:var(--muted)}
.foot a{color:var(--brand);font-weight:700;text-decoration:none}
.foot a:hover{text-decoration:underline}
.foot .more{white-space:nowrap}
@media (max-width:340px){.body{grid-template-columns:92px 1fr;gap:10px}.photo{height:108px}.uni{font-size:15.5px}.foot .more{display:none}}
</style>
</head>
<body>
<div class="cw">
<div class="rule"></div>
<div class="head">
${c.logo ? `<span class="chip"><img class="logo" src="${esc(c.logo)}" alt="" width="30" height="30"></span>` : ""}
<div class="id"><div class="kick">${esc(c.leagueLabel)} · ${esc(c.period)}${c.notice ? ` · ${esc(c.notice)}` : ""}</div><div class="team">${esc(c.teamName)}</div><div class="meta">This week: ${esc(c.matchup)} · ${esc(c.when)}</div></div>
</div>
<div class="body">
<div class="photo">${photo}</div>
<div>
<div class="kick">This week's uniform</div>
<div class="uni${c.uniform.length > 16 ? " long" : ""}">${esc(c.uniform)}</div>
${rows}
<div class="status s-${c.status}"><i></i>${STATUS_TEXT[c.status]}</div>
${c.statusNote ? `<div class="note">${esc(c.statusNote)}</div>` : ""}
</div>
</div>
<div class="foot"><a href="${esc(c.sourceUrl)}" target="_blank" rel="noopener">Uniform data by ColorWay Sports</a><a class="more" href="${esc(c.sourceUrl)}" target="_blank" rel="noopener">Full schedule &rarr;</a></div>
</div>
</body>
</html>`;
}
