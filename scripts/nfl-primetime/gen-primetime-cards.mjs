import fs from 'fs';
const T={ARI:['Arizona Cardinals','arizona-cardinals','arizona-cardinals'],ATL:['Atlanta Falcons','falcons','atlanta-falcons'],BAL:['Baltimore Ravens','ravens','baltimore-ravens'],BUF:['Buffalo Bills','bills','buffalo-bills'],CAR:['Carolina Panthers','panthers','carolina-panthers'],CHI:['Chicago Bears','bears','chicago-bears'],CIN:['Cincinnati Bengals','bengals','cincinnati-bengals'],CLE:['Cleveland Browns','browns','cleveland-browns'],DAL:['Dallas Cowboys','cowboys','dallas-cowboys'],DEN:['Denver Broncos','broncos','denver-broncos'],DET:['Detroit Lions','lions','detroit-lions'],GB:['Green Bay Packers','packers','green-bay-packers'],HOU:['Houston Texans','texans','houston-texans'],IND:['Indianapolis Colts','colts','indianapolis-colts'],JAX:['Jacksonville Jaguars','jaguars','jacksonville-jaguars'],KC:['Kansas City Chiefs','chiefs','kansas-city-chiefs'],LV:['Las Vegas Raiders','raiders','las-vegas-raiders'],LAC:['Los Angeles Chargers','chargers','los-angeles-chargers'],LAR:['Los Angeles Rams','rams','los-angeles-rams'],MIA:['Miami Dolphins','dolphins','miami-dolphins'],MIN:['Minnesota Vikings','vikings','minnesota-vikings'],NE:['New England Patriots','patriots','new-england-patriots'],NO:['New Orleans Saints','saints','new-orleans-saints'],NYG:['New York Giants','new-york-giants','new-york-giants'],NYJ:['New York Jets','jets','new-york-jets'],PHI:['Philadelphia Eagles','eagles','philadelphia-eagles'],PIT:['Pittsburgh Steelers','steelers','pittsburgh-steelers'],SF:['San Francisco 49ers','49ers','san-francisco-49ers'],SEA:['Seattle Seahawks','seahawks','seattle-seahawks'],TB:['Tampa Bay Buccaneers','buccaneers','tampa-bay-buccaneers'],TEN:['Tennessee Titans','titans','tennessee-titans'],WSH:['Washington Commanders','commanders','washington-commanders']};
const ROOT='/Users/jakedaneshgar/Developer/colorway/.claude/worktrees/newsletter-unsubscribes-mediavine-dfa255/public';
for(const v of Object.values(T)) if(!fs.existsSync(`${ROOT}/logos/teams/nfl-${v[2]}.png`)) throw new Error('logo '+v[2]);
const g=JSON.parse(fs.readFileSync('national.json'));
const rows=JSON.parse(fs.readFileSync('rows.json'));
const NET={snf:'Sunday Night Football',mnf:'Monday Night Football',tnf:'Thursday Night Football',nbc:'NBC',peacock:'Peacock',espn:'ESPN',abc:'ABC','prime-video':'Prime Video',netflix:'Netflix',fox:'Fox',cbs:'CBS','paramount-plus':'Paramount+','nfl-network':'NFL Network'};
// display heights (px): window marks bigger, network marks smaller; tuned per aspect
const H={snf:30,mnf:30,tnf:42,nbc:24,peacock:13,espn:13,abc:24,'prime-video':32,netflix:16,fox:17,cbs:15,'paramount-plus':14,'nfl-network':20};
const logo=k=>`<img class="pt-n" src="/logos/networks/${k}.png" alt="${NET[k]}" title="${NET[k]}" loading="lazy" style="height:${H[k]}px">`;
const pill=(t,f)=>`<span class="pt-p${f?' pt-f':''}">${t}</span>`;
function flex(x){ if(x.cat==='SNF') return (x.w>=7&&x.w<=10)||(x.w>=12&&x.w<=17); if(x.cat==='MNF') return x.w>=12&&x.w<=17; if(x.cat==='TNF') return x.w>=13&&x.w<=17; return false; }
function broadcast(x){
  const city={'Rio De Janeiro':'Rio de Janeiro','Saint-Denis':'Paris'}[x.city]||x.city;
  switch(true){
    case x.cat==='SNF': return {label:x.w===11?'Mexico City':null,logos:['snf','nbc','peacock']};
    case x.cat==='MNF': return {label:null,logos:['mnf','espn',...(x.b.includes('ABC')?['abc']:[])]};
    case x.cat==='TNF': return {label:x.w===16?'Christmas Eve':x.w===17?"New Year's Eve":null,logos:['tnf','prime-video']};
    case x.cat==='Kickoff (NBC)': return {label:'Kickoff Game',logos:['nbc','peacock']};
    case x.cat==='Melbourne (Netflix)': return {label:'Melbourne',logos:['netflix']};
    case x.cat==='Thanksgiving Eve (Netflix)': return {label:'Thanksgiving Eve',logos:['netflix']};
    case x.cat==='Thanksgiving Night (NBC)': return {label:'Thanksgiving Night',logos:['nbc','peacock']};
    case x.cat==='Saturday Night (CBS)': return {label:'Saturday Night',logos:['cbs','paramount-plus']};
    case x.cat==='Christmas Night (Fox)': return {label:'Christmas Night',logos:['fox']};
    case x.cat==='Thanksgiving Day': return {label:'Thanksgiving',logos:[x.b==='CBS'?'cbs':'fox']};
    case x.cat==='Black Friday (Prime Video)': return {label:'Black Friday',logos:['prime-video']};
    case x.cat==='Christmas Day (Netflix)': return {label:'Christmas Day',logos:['netflix']};
    case x.cat==='Saturday': return {label:'Saturday',logos:['fox']};
    case x.cat.startsWith('International'): return {label:city,logos:[x.b==='NFL Net'?'nfl-network':x.b==='Fox'?'fox':'cbs']};
  }
  throw new Error(x.cat);
}
const mon={Sep:'Sept.',Oct:'Oct.',Nov:'Nov.',Dec:'Dec.',Jan:'Jan.'};
function row(x,t){
  const [m,d]=x.md.split(' ');
  const home=x.home===t, opp=home?x.away:x.home;
  const neutral=x.cat.startsWith('International')||x.cat.startsWith('Melbourne')||(x.cat==='SNF'&&x.w===11);
  const vs=neutral?'vs':home?'vs':'at';
  const b=broadcast(x);
  const tags=[b.label?pill(b.label):'',flex(x)?pill('Can be flexed',1):''].filter(Boolean).join(' ');
  return `<div class="pt-r"><div class="pt-w"><b>WEEK ${x.w}</b><span>${x.wd}., ${mon[m]} ${d}</span></div>`+
  `<div class="pt-o"><span class="pt-v">${vs}</span><img class="pt-t" src="/logos/teams/nfl-${T[opp][2]}.png" alt="${T[opp][0]} logo" loading="lazy"><span><b>${T[opp][0]}</b>${tags?`<span class="pt-g">${tags}</span>`:''}</span></div>`+
  `<div class="pt-b">${b.logos.map(logo).join('')}</div></div>`;
}
const tbd=rows.filter(r=>r.timeValid===false&&r.w<18);
const teams=Object.keys(T).map(t=>{const gs=g.filter(x=>x.away===t||x.home===t);return {t,pt:gs.filter(x=>x.kind==='PT'),nat:gs.filter(x=>x.kind==='NAT'),tbd:tbd.filter(r=>r.away===t||r.home===t)};});
teams.sort((a,b)=>b.pt.length-a.pt.length||b.nat.length-a.nat.length||T[a.t][0].localeCompare(T[b.t][0]));
const sub=t=>`<div class="pt-s">${t}</div>`;
let out='';let i=0;
for(const x of teams){i++;
const [nm,sl,ls]=T[x.t];
  const n=x.pt.length;
  out+=`<div id="pt-${sl}" class="pt-c"><div class="pt-h"><img src="/logos/teams/nfl-${ls}.png" alt="${nm} logo" loading="lazy"><h3>${i}. ${nm}: ${n} Prime-Time Game${n===1?'':'s'}</h3><span class="pt-k${n?'':' pt-z'}">${n}</span></div>`;
  if(n){ out+=sub('PRIME TIME'); for(const y of x.pt) out+=row(y,x.t); }
  if(!n&&!x.nat.length) out+=`<div class="pt-x">No prime-time games and no other national standalone games on the 2026 schedule. A flex move later in the season is the way in.</div>`;
  if(x.nat.length){ out+=sub('ALSO ON THE NATIONAL STAGE'); for(const y of x.nat) out+=row(y,x.t); }
  for(const r of x.tbd){const opp=r.home===x.t?r.away:r.home;const v=r.home===x.t?'vs':'at';const dd=r.w===16?'Sat., Dec. 26 or Sun., Dec. 27':'Sat., Jan. 2 or Sun., Jan. 3';out+=`<div class="pt-x pt-sm"><strong>Still to be set:</strong> Week ${r.w} ${v} ${T[opp][0]} will be played ${dd}.</div>`;}
  out+=`<div class="pt-l"><a href="/stories/${sl}-uniform-schedule-2026">${nm} uniform schedule, and what they'll wear →</a><a class="pt-up" href="#pt-grid">↑ All 32 teams</a></div>`;
  out+=`</div>\n\n`;
}
fs.writeFileSync('teams2.md',out);
const CSS=`<style>
.pt-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px;margin:1.5rem 0;scroll-margin-top:140px}
.prose .pt-grid a{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:12px;background:#013369;color:#fff;text-decoration:none;transition:transform .12s,box-shadow .12s}
.prose .pt-grid a:hover{transform:translateY(-1px);box-shadow:0 4px 14px rgba(1,51,105,.25);color:#fff}
.prose .pt-grid a.pt-0,.prose .pt-grid a.pt-0:hover{background:#eef1f5;color:#1d2733}
.prose .pt-grid img,.prose .pt-h img{width:30px;height:30px;object-fit:contain;margin:0;box-shadow:none;border-radius:50%;background:#fff;padding:3px;display:block;max-width:none;flex:0 0 auto}
.pt-grid .pt-nm{flex:1;font-weight:600;font-size:14px;line-height:1.25}
.pt-grid .pt-ct{font-weight:800;font-size:20px}
.pt-c{scroll-margin-top:140px;margin:2.25rem 0 2.5rem;border:1px solid #dfe5ee;border-radius:16px;overflow:hidden;background:#fff;box-shadow:0 2px 10px rgba(1,51,105,.06)}
.pt-h{display:flex;align-items:center;gap:14px;padding:14px 16px;background:linear-gradient(135deg,#013369,#0a1f44)}
.prose .pt-h img{width:44px;height:44px;padding:5px}
.prose .pt-h h3{flex:1;margin:0;font-size:19px;line-height:1.25;color:#fff}
.pt-k{flex:0 0 auto;min-width:44px;height:44px;border-radius:12px;background:#D50A0A;color:#fff;font-size:24px;font-weight:800;display:flex;align-items:center;justify-content:center}
.pt-k.pt-z{background:#5b6675}
.pt-s{padding:8px 16px;border-top:1px solid #edf0f5;background:#f6f8fb;font-size:11px;font-weight:800;letter-spacing:.08em;color:#5b6675}
.pt-r{display:flex;flex-wrap:wrap;align-items:center;gap:10px 14px;padding:12px 16px;border-top:1px solid #edf0f5}
.pt-w{flex:0 0 100px;line-height:1.2;white-space:nowrap}
.pt-w b{display:block;font-size:11px;font-weight:800;letter-spacing:.08em;color:#013369}
.pt-w span{display:block;font-size:13px;font-weight:600;color:#5b6675;margin-top:3px}
.pt-o{flex:1 1 170px;display:flex;align-items:center;gap:9px;min-width:0}
.pt-o>span:last-child{min-width:0}
.pt-o b{display:block;font-size:15px;font-weight:700;color:#111827;line-height:1.25}
.pt-v{font-size:12px;font-weight:700;color:#8a94a3;width:16px}
.prose img.pt-t{width:30px;height:30px;object-fit:contain;margin:0;box-shadow:none;border-radius:0;display:block;max-width:none}
.pt-g{display:block;margin-top:4px;line-height:1}
.pt-p{display:inline-block;padding:3px 8px;margin-right:4px;border-radius:999px;background:#eef3fb;color:#013369;font-size:11px;font-weight:700;white-space:nowrap}
.pt-p.pt-f{background:#fff4e0;color:#8a5300}
.pt-b{flex:0 0 auto;display:flex;align-items:center;gap:12px;margin-left:auto}
.prose img.pt-n{width:auto;margin:0;box-shadow:none;border-radius:0;display:block;max-width:none}
.pt-x{padding:14px 16px;font-size:15px;color:#374151;line-height:1.5;border-top:1px solid #edf0f5}
.pt-x.pt-sm{padding:10px 16px;font-size:13px;color:#5b6675}
.prose .pt-x strong{color:#8a5300}
.pt-l{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;padding:12px 16px;border-top:1px solid #edf0f5;background:#f6f8fb;font-size:14px}
.prose .pt-l a{font-weight:700;color:#2f6bed;text-decoration:none}
.prose .pt-l a.pt-up{color:#5b6675;font-weight:600}
@media (max-width:480px){.pt-grid{grid-template-columns:1fr 1fr;gap:6px}.prose .pt-grid a{padding:8px 9px;gap:7px}.pt-grid .pt-nm{font-size:12.5px}.pt-grid .pt-ct{font-size:17px}.prose .pt-grid img{width:24px;height:24px;padding:2px}.pt-w{flex-basis:96px}.pt-b{margin-left:110px}}
</style>`.replace(/\n/g,'');
let grid=CSS+'<div id="pt-grid" class="pt-grid">';
i=0;for(const x of teams){i++;const [nm,sl,ls]=T[x.t];
grid+=`<a href="#pt-${sl}"${x.pt.length?'':' class="pt-0"'}><img src="/logos/teams/nfl-${ls}.png" alt="" loading="lazy"><span class="pt-nm">${i}. ${nm}</span><span class="pt-ct">${x.pt.length}</span></a>`;}
grid+='</div>';
fs.writeFileSync('grid2.html',grid);
console.log('ok');
