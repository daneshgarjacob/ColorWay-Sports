import sharp from "sharp";
const W=1500,H=1000;
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
 <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#284898"/><stop offset="0.55" stop-color="#1b2f63"/><stop offset="1" stop-color="#E81828"/>
 </linearGradient></defs>
 <rect width="${W}" height="${H}" fill="url(#bg)"/>
 <text x="96" y="330" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="800" letter-spacing="7" fill="rgba(255,255,255,0.62)">PHILADELPHIA PHILLIES</text>
 <text x="96" y="440" font-family="Georgia, 'Times New Roman', serif" font-size="80" font-weight="900" fill="#ffffff">The Throwback</text>
 <text x="96" y="528" font-family="Georgia, 'Times New Roman', serif" font-size="80" font-weight="900" fill="#ffffff">Playbook</text>
 <rect x="96" y="572" width="150" height="5" fill="#ffffff" opacity="0.85"/>
 <text x="96" y="648" font-family="Arial, Helvetica, sans-serif" font-size="27" font-weight="600" fill="rgba(255,255,255,0.72)">Powder blue, cream, red pinstripes, and 1939.</text>
 <text x="96" y="726" font-family="Arial, Helvetica, sans-serif" font-size="21" font-weight="700" letter-spacing="3" fill="rgba(255,255,255,0.45)">FIELD OF DREAMS · AUGUST 13</text>
</svg>`;
const dl=async u=>Buffer.from(await (await fetch(u)).arrayBuffer());
const phi=await sharp(await dl("https://a.espncdn.com/i/teamlogos/mlb/500/phi.png")).resize({height:430}).png().toBuffer();
await sharp(Buffer.from(svg)).composite([{input:phi,top:300,left:1000}]).jpeg({quality:88})
 .toFile("public/images/posts/phillies-throwbacks/cover.jpg");
console.log("ok");
