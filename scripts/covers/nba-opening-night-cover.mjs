import { chromium } from '/Users/jakedaneshgar/.npm/_npx/9833c18b2d85bc59/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const HOME = process.env.HOME, DIR = process.argv[2], OUT = process.argv[3];
const BRAND = `${HOME}/Desktop/ColorWay Sports/BRAND - START HERE`;
const u = (p) => 'file://' + p.split('/').map(encodeURIComponent).join('/');
const html = `<!doctype html><html><head><style>
@font-face{font-family:Anton;src:url('${u(BRAND + '/Fonts/Anton-Regular.ttf')}');}
@font-face{font-family:Hanken;src:url('${u(BRAND + '/Fonts/HankenGrotesk-Variable.ttf')}');font-weight:100 900;}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1600px;height:1066px;overflow:hidden;background:#0b1a3a}
body{font-family:Hanken,sans-serif;position:relative;color:#fff;-webkit-font-smoothing:antialiased}
.abs{position:absolute}
</style></head><body>
<div class="abs" style="inset:0;background:url('${u(DIR + '/photo.jpg')}') 62% 45%/cover"></div>
<div class="abs" style="inset:0;background:linear-gradient(90deg,rgba(0,30,90,.92) 0%,rgba(0,30,90,.78) 30%,rgba(0,30,90,.15) 55%,rgba(0,30,90,0) 70%)"></div>
<div class="abs" style="left:0;right:0;bottom:0;height:10px;background:linear-gradient(90deg,#FDB927 0 50%,#2f6bed 50% 100%)"></div>
<div class="abs" style="left:72px;top:64px;width:360px;height:44px;background:url('${u(BRAND + '/Logos (all uses)/wordmark-lockup-white.png')}') no-repeat left center/contain"></div>
<div class="abs" style="left:72px;top:330px;background:#2f6bed;padding:10px 20px;border-radius:8px;font-weight:800;font-size:28px;letter-spacing:5px">NBA OPENING NIGHT</div>
<div class="abs" style="left:68px;top:405px;font-family:Anton;text-transform:uppercase;font-size:128px;line-height:.96;letter-spacing:1px">Every jersey.<br><span style="color:#FDB927">Every game.</span></div>
<div class="abs" style="left:72px;top:672px;font-size:36px;font-weight:600;line-height:1.35;width:640px">All 28 Opening Night uniforms, confirmed and graded.</div>
<div class="abs" style="left:72px;top:790px;display:flex;gap:14px">
  <span style="background:#fff;color:#0b1a3a;font-weight:800;font-size:24px;letter-spacing:2px;padding:10px 18px;border-radius:999px">OCT. 20-21</span>
  <span style="border:2px solid rgba(255,255,255,.8);font-weight:800;font-size:24px;letter-spacing:2px;padding:8px 18px;border-radius:999px">2026-27 SEASON</span>
</div>
<div class="abs" style="right:28px;bottom:26px;font-size:18px;font-weight:600;opacity:.85">Photo: Erik Drost / CC BY 4.0 (adapted)</div>
</body></html>`;
fs.writeFileSync(DIR + '/cover.html', html);
const b = await chromium.launch({ executablePath: `${HOME}/Library/Caches/ms-playwright/chromium-1217/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing` });
const p = await b.newPage({ viewport: { width: 1600, height: 1066 } });
await p.goto(u(DIR + '/cover.html'), { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(600);
await p.screenshot({ path: OUT, type: 'jpeg', quality: 86 }); await b.close(); console.log('ok');
