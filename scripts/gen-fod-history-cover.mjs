// Cover for the Field of Dreams uniform-history ranking. Illustrated only:
// club marks from the ESPN CDN over the cornfield palette, no photography.
import sharp from "sharp";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const W = 1500, H = 1000;

const corn = (n, y, h, o, w, tint) => Array.from({length:n},(_,i)=>{
  const x = 18 + i*((W-36)/n), j = ((i*37)%11)-5, hh = h + ((i*23)%34);
  return `<rect x="${x.toFixed(1)}" y="${y+j}" width="${w}" height="${hh}" fill="${tint}" opacity="${o}" rx="${w/2}"/>`;
}).join("");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="0.35" y2="1">
    <stop offset="0" stop-color="#faf4e4"/><stop offset="0.45" stop-color="#efe1c1"/><stop offset="1" stop-color="#ddc79a"/>
  </linearGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${corn(64,700,150,0.09,3,"#6d5622")}${corn(42,752,190,0.13,4,"#5c4a1d")}${corn(28,810,210,0.17,5.5,"#4a3b17")}
  <text x="750" y="150" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="25" font-weight="700" letter-spacing="9" fill="#9c2b1f" font-style="italic">2021 · 2022 · 2026</text>
  <text x="750" y="700" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="76" font-weight="900" fill="#16233f">Every Field of Dreams</text>
  <text x="750" y="784" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="76" font-weight="900" fill="#16233f">Uniform, Ranked</text>
  <rect x="620" y="828" width="260" height="3" fill="#9c2b1f" opacity="0.7"/>
  <text x="750" y="888" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="23" font-weight="800" letter-spacing="5" fill="#16233f">ALL SIX THROWBACKS GRADED</text>
</svg>`;

const dl = async (u) => Buffer.from(await (await fetch(u)).arrayBuffer());
const abbrs = ["chw","nyy","chc","cin","phi","min"];
const LOGO = 150, GAP = 34;
const total = abbrs.length*LOGO + (abbrs.length-1)*GAP;
const left0 = Math.round((W-total)/2);
const layers = [];
for (let i=0;i<abbrs.length;i++){
  try{
    const b = await sharp(await dl(`https://a.espncdn.com/i/teamlogos/mlb/500/${abbrs[i]}.png`))
      .resize({height:LOGO,width:LOGO,fit:"contain",background:{r:0,g:0,b:0,alpha:0}}).png().toBuffer();
    layers.push({input:b, top:300, left:left0 + i*(LOGO+GAP)});
  }catch(e){ console.warn("skip",abbrs[i]); }
}
const out = resolve(root,"public/images/posts/field-of-dreams-history/cover.jpg");
await sharp(Buffer.from(svg)).composite(layers).jpeg({quality:88}).toFile(out);
console.log("wrote",out,"with",layers.length,"logos");
