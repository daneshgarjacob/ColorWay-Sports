// Cover for /stories/nfl-uniform-mysteries-explained
// Usage: node scripts/covers/nfl-uniform-mysteries-cover.mjs <photo.jpg> <out.jpg>
import { chromium } from '/Users/jakedaneshgar/.npm/_npx/9833c18b2d85bc59/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import os from 'node:os';
const HOME = process.env.HOME, PHOTO = process.argv[2], OUT = process.argv[3];
const BRAND = `${HOME}/Desktop/ColorWay Sports/BRAND - START HERE`;
const u = (p) => 'file://' + p.split('/').map(encodeURIComponent).join('/');
const html = `<!doctype html><html><head><style>
@font-face{font-family:Anton;src:url('${u(BRAND + '/Fonts/Anton-Regular.ttf')}');}
@font-face{font-family:Hanken;src:url('${u(BRAND + '/Fonts/HankenGrotesk-Variable.ttf')}');font-weight:100 900;}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1500px;height:1000px;overflow:hidden;background:#101010}
body{font-family:Hanken,sans-serif;position:relative;color:#fff;-webkit-font-smoothing:antialiased}
.abs{position:absolute}
</style></head><body>
<div class="abs" style="inset:0;background:url('${u(PHOTO)}') 40% 30%/cover"></div>
<div class="abs" style="inset:0;background:linear-gradient(180deg,rgba(10,10,12,0) 30%,rgba(10,10,12,.72) 60%,rgba(10,10,12,.96) 100%)"></div>
<div class="abs" style="left:0;right:0;bottom:0;height:10px;background:linear-gradient(90deg,#FFB612 0 50%,#FF3C00 50% 100%)"></div>
<div class="abs" style="left:64px;top:560px;background:#2f6bed;padding:8px 18px;border-radius:8px;font-weight:800;font-size:26px;letter-spacing:5px">EXPLAINED</div>
<div class="abs" style="left:60px;top:618px;font-family:Anton;text-transform:uppercase;font-size:132px;line-height:.95">NFL uniform mysteries</div>
<div class="abs" style="left:64px;top:760px;font-size:38px;font-weight:700;line-height:1.3;width:1300px">One logo on one side. No logo at all. <span style="color:#FFB612">12 answers.</span></div>
<div class="abs" style="right:28px;bottom:26px;font-size:17px;font-weight:600;opacity:.8">Photo: Erik Drost / CC BY 2.0 (adapted)</div>
</body></html>`;
const tmp = fs.mkdtempSync(os.tmpdir() + '/cover-');
fs.writeFileSync(tmp + '/cover.html', html);
const b = await chromium.launch({ executablePath: `${HOME}/Library/Caches/ms-playwright/chromium-1217/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing` });
const p = await b.newPage({ viewport: { width: 1500, height: 1000 } });
await p.goto(u(tmp + '/cover.html'), { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(600);
await p.screenshot({ path: OUT, type: 'jpeg', quality: 84 }); await b.close(); console.log('ok');
