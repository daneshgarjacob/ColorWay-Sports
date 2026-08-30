#!/usr/bin/env node
// Matchweek 2 kit renders for the Premier League kit tracker.
//
// Same canvas and geometry as scripts/gen-epl-kit-renders.mjs (450x600,
// transparent) so these sit beside the real product-shot cutouts in the tracker
// cards without looking like a different library. Every design here is taken
// from the club/supplier launch description on that club's own ColorWay page,
// not guessed.
//
// Product photos are still the preferred source — use make-kit-cutout.mjs when a
// clean laydown is available. These renders exist for the shirts we could not
// source a photo for.
//
// Output: public/images/posts/premier-league-kit-schedule-2026-27/{key}.png
// Usage: node scripts/gen-epl-mw2-kits.mjs
import sharp from "sharp";
import { resolve } from "node:path";
import { existsSync } from "node:fs";

const OUT = resolve(process.cwd(), "public/images/posts/premier-league-kit-schedule-2026-27");

// crest: the club mark from public/logos/teams, composited onto the chest — a
//        real asset on a drawn shirt, which is what stops these reading as blank.
// pattern: solid | vstripes (stripes AND pinstripes, by width) | wave | brick | diag
// collar:  crew (default) | vneck | polo
// cuffBands: thin contrast bands laid over the cuff, outermost first
// sleeveStripes: adidas-style shoulder stripes
const KITS = [
  // ---- Saturday, played ----
  // Hull: amber and black stripes across front, sleeves and back, white
  // fold-over collar with a black v-neck insert, white cuffs.
  {
    key: "hull-home", crest: "epl-hull-city", sleeves: "#F5A100", collar: "#ffffff", cuffs: "#ffffff",
    collarStyle: "vneck", collarInsert: "#101010", stripeSleeves: true,
    pattern: { type: "vstripes", colors: ["#F5A100", "#101010"], widths: [34, 34] },
  },
  // Everton away: white base, fine navy pinstripes, navy V-neck and thick navy
  // cuffs, each trimmed in a thin yellow line.
  {
    key: "everton-away", crest: "epl-everton", sleeves: "#ffffff", collar: "#152D63", cuffs: "#152D63",
    collarStyle: "vneck", cuffBands: [{ color: "#F5C518", width: 4 }],
    pattern: { type: "vstripes", colors: ["#152D63", "#ffffff"], widths: [4, 26] },
  },
  // Spurs home: lilywhite with a textured diagonal tonal stripe in the fabric,
  // navy on the collar and cuffs.
  {
    key: "tottenham-home", crest: "epl-tottenham", sleeves: "#ffffff", collar: "#131C37", cuffs: "#131C37",
    pattern: { type: "diag", base: "#ffffff", line: "#f4f5f9" },
  },
  // Newcastle away: Night Navy base with a St James' Park brickwork graphic,
  // white and Vista Blue detailing, adidas Trefoil era trim.
  {
    key: "newcastle-away", crest: "epl-newcastle", sleeves: "#1B2432", collar: "#ffffff", cuffs: "#7CB9E8",
    sleeveStripes: "#ffffff",
    pattern: { type: "brick", base: "#1B2432", line: "#263346" },
  },
  // Forest third: light blue base with a flowing River Trent graphic, navy
  // logos and trim, grey three stripes. On sale August 28, worn August 29.
  {
    key: "forest-third", crest: "epl-nottingham-forest", sleeves: "#8FC3E8", collar: "#12234A", cuffs: "#12234A",
    sleeveStripes: "#B9C2CC",
    pattern: { type: "wave", base: "#8FC3E8", line: "#ffffff", opacity: 0.45, gap: 44, width: 4 },
  },

  // ---- Sunday, today ----
  // Chelsea home: solid blue, gold piping on the shoulder seams and side
  // panels, gold laurel-wreath graphic at the collar and cuffs.
  {
    key: "chelsea-home", crest: "epl-chelsea", sleeves: "#034694", collar: "#C8A951", cuffs: "#C8A951",
    shoulderPiping: "#C8A951", sidePanels: "#C8A951",
    pattern: { type: "solid", color: "#034694" },
  },
  // Brighton away: the home pinstripe inverted — white base, royal blue
  // pinstripes, carrying the same 125th anniversary collar.
  {
    key: "brighton-away", crest: "epl-brighton", sleeves: "#ffffff", collar: "#0057B8", cuffs: "#0057B8",
    pattern: { type: "vstripes", colors: ["#0057B8", "#ffffff"], widths: [5, 26] },
  },
  // Brentford away: deep navy with cream vertical pinstripes, a thick cream
  // crew-neck collar and cuffs. Savile Row tailoring, by way of Kingsman.
  {
    key: "brentford-away", crest: "epl-brentford", sleeves: "#131C37", collar: "#E9DCC0", cuffs: "#E9DCC0",
    thickCollar: true,
    pattern: { type: "vstripes", colors: ["#E9DCC0", "#131C37"], widths: [4, 30] },
  },
  // Fulham third: bright sky blue with neon pink details and a horizontal line
  // graphic that creates a wave across the front and lower back.
  {
    key: "fulham-third", crest: "epl-fulham", sleeves: "#4EC3F0", collar: "#FF2D8B", cuffs: "#FF2D8B",
    pattern: { type: "wave", base: "#4EC3F0", line: "#FF2D8B", opacity: 0.8, gap: 38, width: 3 },
  },
  // United home: clean red, fold-over polo collar tipped in white and black,
  // matching banded cuffs, adidas three stripes on the shoulders. Fifty years
  // since the 1977 FA Cup final.
  {
    key: "manchester-united-home", crest: "epl-manchester-united", sleeves: "#DA291C", collar: "#C0201A", cuffs: "#DA291C",
    collarStyle: "polo", collarTip: ["#ffffff", "#101010"], sleeveStripes: "#ffffff",
    cuffBands: [{ color: "#101010", width: 5 }, { color: "#ffffff", width: 4 }],
    pattern: { type: "solid", color: "#DA291C" },
  },

  // ---- Matchweek 1, for the three graded blocks that had no shirts ----
  // Everton home: royal blue with white logos and yellow on the collar and cuffs.
  {
    key: "everton-home", crest: "epl-everton", sleeves: "#003399", collar: "#F5C518", cuffs: "#F5C518",
    pattern: { type: "solid", color: "#003399" },
  },
  // United third: ivory with a tonal hand-drawn rose print, maroon at the
  // collar, cuffs and trim, green accents. Worn at Hull on opening weekend.
  {
    key: "manchester-united-third", crest: "epl-manchester-united", sleeves: "#EFE7D6", collar: "#6B2233", cuffs: "#6B2233",
    sleeveStripes: "#6B2233", cuffBands: [{ color: "#2F5D3A", width: 3 }],
    pattern: { type: "wave", base: "#EFE7D6", line: "#E3D9C3", opacity: 1, gap: 34, width: 6 },
  },
  // Fulham home: white base, red trim at the collar, black sleeve cuffs, and a
  // tonal embossed chevron that mimics the ripples of the Thames.
  {
    key: "fulham-home", crest: "epl-fulham", sleeves: "#ffffff", collar: "#CC0000", cuffs: "#101010",
    pattern: { type: "wave", base: "#ffffff", line: "#f0f1f4", opacity: 1, gap: 40, width: 5 },
  },
  // ---- Re-cut from scripts/gen-epl-kit-renders.mjs, now carrying the club
  // crest so they match the rest of the tracker's library. Same specs. ----
  {
    key: "sunderland-home", crest: "epl-sunderland", sleeves: "#d0021b", collar: "#101010", cuffs: "#101010",
    pattern: { type: "vstripes", colors: ["#d0021b", "#ffffff"], widths: [32, 32] },
  },
  {
    key: "ipswich-home", crest: "epl-ipswich-town", sleeves: "#0044a9", collar: "#ffffff", cuffs: "#ffffff",
    pattern: { type: "solid", color: "#0044a9" },
  },
  {
    key: "forest-home", crest: "epl-nottingham-forest", sleeves: "#DD0000", collar: "#ffffff", cuffs: "#ffffff",
    pattern: { type: "solid", color: "#DD0000" },
  },
];

// Shared geometry (viewBox 0 0 450 600), identical to gen-epl-kit-renders.mjs.
const BODY = "M132,92 L166,64 C186,96 264,96 284,64 L318,92 L326,560 Q225,586 124,560 Z";
const LSLV = "M132,92 L124,300 L34,286 L58,120 Z";
const RSLV = "M318,92 L392,120 L416,286 L326,300 Z";
const LCUFF = "M124,300 L34,286 L36,262 L125,275 Z";
const RCUFF = "M326,300 L416,286 L414,262 L325,275 Z";
const COLLAR = "M166,64 C186,96 264,96 284,64 L296,74 C270,114 180,114 154,74 Z";
const COLLAR_THICK = "M166,64 C186,96 264,96 284,64 L302,80 C272,128 178,128 148,80 Z";
const COLLAR_VNECK = "M166,64 C186,96 264,96 284,64 L294,72 L225,150 L156,72 Z";
const COLLAR_POLO = "M166,64 C186,96 264,96 284,64 L306,84 L266,90 L225,116 L184,90 L144,84 Z";

function bodyFill(p, defs) {
  if (p.type === "solid") return p.color;
  if (p.type === "vstripes") {
    const total = p.widths.reduce((a, b) => a + b, 0);
    let x = 0;
    const rects = p.colors
      .map((c, i) => {
        const r = `<rect x="${x}" y="0" width="${p.widths[i]}" height="600" fill="${c}"/>`;
        x += p.widths[i];
        return r;
      })
      .join("");
    defs.push(
      `<pattern id="pv" width="${total}" height="600" patternUnits="userSpaceOnUse" x="9">${rects}</pattern>`
    );
    return "url(#pv)";
  }
  if (p.type === "wave") {
    // Stacked sine bands across the chest — the "flowing water" graphic both the
    // Forest third and the Fulham third are built on.
    let lines = "";
    for (let i = 0; i < 14; i++) {
      const y = 60 + i * p.gap;
      lines += `<path d="M-20,${y} q 60,-22 120,0 t 120,0 t 120,0 t 120,0" fill="none" stroke="${p.line}" stroke-opacity="${p.opacity}" stroke-width="${p.width ?? 5}"/>`;
    }
    defs.push(
      `<pattern id="pw" width="450" height="600" patternUnits="userSpaceOnUse"><rect width="450" height="600" fill="${p.base}"/>${lines}</pattern>`
    );
    return "url(#pw)";
  }
  if (p.type === "brick") {
    // Tonal brickwork, a shade off the base: reads as texture, not pattern,
    // which is how it reads on the shirt too.
    const b = `<rect width="60" height="30" fill="${p.base}"/>` +
      `<rect x="0" y="0" width="60" height="1.6" fill="${p.line}"/>` +
      `<rect x="0" y="15" width="60" height="1.6" fill="${p.line}"/>` +
      `<rect x="14" y="0" width="1.6" height="15" fill="${p.line}"/>` +
      `<rect x="44" y="15" width="1.6" height="15" fill="${p.line}"/>`;
    defs.push(`<pattern id="pb" width="60" height="30" patternUnits="userSpaceOnUse">${b}</pattern>`);
    return "url(#pb)";
  }
  if (p.type === "diag") {
    const d = `<rect width="44" height="44" fill="${p.base}"/><path d="M-10,34 L34,-10 M0,54 L54,0" stroke="${p.line}" stroke-width="5"/>`;
    defs.push(`<pattern id="pd" width="44" height="44" patternUnits="userSpaceOnUse">${d}</pattern>`);
    return "url(#pd)";
  }
  throw new Error(`unknown pattern ${p.type}`);
}

for (const k of KITS) {
  const defs = [];
  const fill = bodyFill(k.pattern, defs);
  // Soft self-shadow down the sides so flat color reads as a garment, not a swatch.
  defs.push(
    '<linearGradient id="shade" x1="0" y1="0" x2="1" y2="0">' +
      '<stop offset="0" stop-color="#000" stop-opacity="0.16"/>' +
      '<stop offset="0.12" stop-color="#000" stop-opacity="0"/>' +
      '<stop offset="0.88" stop-color="#000" stop-opacity="0"/>' +
      '<stop offset="1" stop-color="#000" stop-opacity="0.16"/></linearGradient>'
  );
  defs.push(`<clipPath id="bodyclip"><path d="${BODY}"/></clipPath>`);
  defs.push(`<clipPath id="lclip"><path d="${LSLV}"/></clipPath>`);
  defs.push(`<clipPath id="rclip"><path d="${RSLV}"/></clipPath>`);
  defs.push(`<clipPath id="lcuffclip"><path d="${LCUFF}"/></clipPath>`);
  defs.push(`<clipPath id="rcuffclip"><path d="${RCUFF}"/></clipPath>`);

  const sleeveFill = k.stripeSleeves ? fill : k.sleeves;

  // Gold/contrast piping down the side seams (Chelsea).
  let overlays = "";
  if (k.sidePanels) {
    overlays +=
      `<g clip-path="url(#bodyclip)">` +
      `<rect x="136" y="92" width="4" height="480" fill="${k.sidePanels}" opacity="0.9"/>` +
      `<rect x="310" y="92" width="4" height="480" fill="${k.sidePanels}" opacity="0.9"/></g>`;
  }
  if (k.shoulderPiping) {
    overlays +=
      `<g clip-path="url(#lclip)"><rect x="40" y="112" width="100" height="4.5" transform="rotate(9 90 114)" fill="${k.shoulderPiping}"/></g>` +
      `<g clip-path="url(#rclip)"><rect x="310" y="112" width="100" height="4.5" transform="rotate(-9 360 114)" fill="${k.shoulderPiping}"/></g>`;
  }
  if (k.sleeveStripes) {
    // Three stripes running down the shoulder of each sleeve.
    const set = (clip, x0, rot, cx) => {
      let g = "";
      for (let i = 0; i < 3; i++) {
        g += `<rect x="${x0 + i * 13}" y="88" width="7" height="122" fill="${k.sleeveStripes}"/>`;
      }
      return `<g clip-path="url(#${clip})"><g transform="rotate(${rot} ${cx} 150)">${g}</g></g>`;
    };
    overlays += set("lclip", 74, 12, 90) + set("rclip", 330, -12, 360);
  }

  // Cuff bands: thin contrast stripes laid across each cuff.
  let cuffBands = "";
  if (k.cuffBands) {
    let off = 0;
    for (const band of k.cuffBands) {
      cuffBands +=
        `<g clip-path="url(#lcuffclip)"><rect x="20" y="${268 + off}" width="130" height="${band.width}" transform="rotate(-8 85 272)" fill="${band.color}"/></g>` +
        `<g clip-path="url(#rcuffclip)"><rect x="300" y="${268 + off}" width="130" height="${band.width}" transform="rotate(8 365 272)" fill="${band.color}"/></g>`;
      off += band.width + 2;
    }
  }

  const collarPath =
    k.collarStyle === "vneck" ? COLLAR_VNECK
      : k.collarStyle === "polo" ? COLLAR_POLO
        : k.thickCollar ? COLLAR_THICK
          : COLLAR;

  // A v-neck insert (Hull) or polo tipping (United) sits on top of the collar.
  let collarDetail = "";
  if (k.collarInsert) {
    collarDetail += `<path d="M186,78 L225,132 L264,78 L252,72 L225,104 L198,72 Z" fill="${k.collarInsert}"/>`;
  }
  if (k.collarTip) {
    let inset = 0;
    for (const c of k.collarTip) {
      collarDetail += `<path d="M${168 + inset},${70 + inset} C188,${100 + inset} 262,${100 + inset} ${282 - inset},${70 + inset}" fill="none" stroke="${c}" stroke-width="3.5"/>`;
      inset += 5;
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 450 600" width="450" height="600">
  <defs>${defs.join("")}</defs>
  <path d="${LSLV}" fill="${sleeveFill}"/>
  <path d="${RSLV}" fill="${sleeveFill}"/>
  <path d="${BODY}" fill="${fill}"/>
  ${overlays}
  <path d="${BODY}" fill="url(#shade)"/>
  <path d="${LSLV}" fill="url(#shade)"/>
  <path d="${RSLV}" fill="url(#shade)"/>
  <path d="${LCUFF}" fill="${k.cuffs}"/>
  <path d="${RCUFF}" fill="${k.cuffs}"/>
  ${cuffBands}
  <path d="${collarPath}" fill="${k.collar}"/>
  ${collarDetail}
  <path d="${BODY}" fill="none" stroke="#000" stroke-opacity="0.18" stroke-width="2"/>
  <path d="${LSLV}" fill="none" stroke="#000" stroke-opacity="0.18" stroke-width="2"/>
  <path d="${RSLV}" fill="none" stroke="#000" stroke-opacity="0.18" stroke-width="2"/>
</svg>`;

  const out = `${OUT}/${k.key}.png`;
  let img = sharp(Buffer.from(svg));

  // Composite the club crest onto the wearer's left chest (viewer's right).
  const crestPath = resolve(process.cwd(), `public/logos/teams/${k.crest}.png`);
  if (k.crest && existsSync(crestPath)) {
    const crest = await sharp(crestPath)
      .resize(72, 72, { fit: "inside", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();
    img = sharp(await img.png().toBuffer()).composite([{ input: crest, top: 152, left: 254 }]);
  } else if (k.crest) {
    console.warn(`  ! no crest asset for ${k.key} (${k.crest})`);
  }

  const info = await img.png({ palette: true, colors: 200, dither: 0.3 }).toFile(out);
  console.log(`wrote ${k.key}.png (${Math.round(info.size / 1024)}KB)`);
}
