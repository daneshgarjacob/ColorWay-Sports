import re, glob, json, urllib.request, sys

# short display name used in "at X" / "vs X" -> slug
NAME2SLUG = {
 "Arsenal":"arsenal","Aston Villa":"aston-villa","Bournemouth":"bournemouth","Brentford":"brentford",
 "Brighton":"brighton","Chelsea":"chelsea","Coventry City":"coventry-city","Coventry":"coventry-city",
 "Crystal Palace":"crystal-palace","Everton":"everton","Fulham":"fulham","Hull City":"hull-city","Hull":"hull-city",
 "Ipswich Town":"ipswich-town","Ipswich":"ipswich-town","Leeds United":"leeds-united","Leeds":"leeds-united",
 "Liverpool":"liverpool","Man City":"manchester-city","Manchester City":"manchester-city",
 "Man United":"manchester-united","Man Utd":"manchester-united","Manchester United":"manchester-united",
 "Newcastle":"newcastle","Nottingham Forest":"nottingham-forest","Forest":"nottingham-forest",
 "Sunderland":"sunderland","Tottenham":"tottenham","Spurs":"tottenham",
}

ROW = re.compile(
 r'>([A-Z][a-z]{2} \d{1,2})</span>'
 r'<span style="flex: 1 1 auto; color: #14284b; font-weight: 700;">(at|vs) ([^<]+)</span>'
 r'<span style="flex: 0 0 auto; font-weight: 800; font-size: 0\.85em; color: (#[0-9a-fA-F]{6});">([^<]+)</span>'
 r'<span style="flex: 0 0 74px; text-align: right; color: (#[0-9a-fA-F]{6}); font-weight: 700; font-size: 0\.85em;">([^<]+)</span>')

MONTH={'Aug':8,'Sep':9,'Oct':10,'Nov':11,'Dec':12,'Jan':1,'Feb':2,'Mar':3,'Apr':4,'May':5}
played_cutoff = (8, 31)  # through Aug 31

rows = {}   # slug -> list of dicts
problems = []
for f in sorted(glob.glob('content/posts/*-kits-2026-27.md')):
    slug = f.split('/')[-1].replace('-kits-2026-27.md','')
    if slug == 'premier-league-kit-schedule': continue
    s = open(f).read()
    found = ROW.findall(s)
    rows[slug] = []
    for date, ha, opp, kitcol, kit, rescol, res in found:
        mon, day = date.split(); m = MONTH.get(mon); d = int(day)
        played = (m == 8 and d <= 31)
        oslug = NAME2SLUG.get(opp.strip())
        if oslug is None:
            problems.append(f"{slug}: unknown opponent name '{opp}'"); continue
        rows[slug].append(dict(m=m,d=d,ha=ha,opp=oslug,kit=kit.strip(),kitcol=kitcol,res=res.strip()))
        if played:
            if res.strip() == 'Expected' or kitcol != '#1a7f37':
                problems.append(f"{slug}: PLAYED row {date} {ha} {opp} still shows '{kit.strip()}' / '{res.strip()}' (kitcol {kitcol})")
        else:
            if re.match(r'[WLD] \d', res.strip()):
                problems.append(f"{slug}: FUTURE row {date} has a result '{res.strip()}'")

# completeness: every club should have exactly 2 played rows
for slug, rs in rows.items():
    n = sum(1 for r in rs if r['m']==8 and r['d']<=31)
    if n != 2: problems.append(f"{slug}: {n} played rows (expected 2)")
    if len(rs) < 30: problems.append(f"{slug}: only {len(rs)} schedule rows parsed")

# mirror check on played fixtures
for slug, rs in rows.items():
    for r in rs:
        if not (r['m']==8 and r['d']<=31): continue
        other = rows.get(r['opp'], [])
        m = [o for o in other if o['m']==r['m'] and o['d']==r['d'] and o['opp']==slug]
        if not m: problems.append(f"{slug} {r['d']}/8 vs {r['opp']}: NO mirror row on opponent page"); continue
        o = m[0]
        if {r['ha'], o['ha']} != {'at','vs'}: problems.append(f"{slug}/{r['opp']} {r['d']}/8: home/away disagree")
        def parse(res):
            mm = re.match(r'([WLD]) (\d+)-(\d+)', res); return mm.groups() if mm else None
        pr, po = parse(r['res']), parse(o['res'])
        if pr and po:
            if pr[1] != po[2] or pr[2] != po[1]:
                problems.append(f"{slug} {r['res']} vs {r['opp']} {o['res']}: scores not mirrored")
            wl = {'W':'L','L':'W','D':'D'}
            if wl[pr[0]] != po[0]:
                problems.append(f"{slug}/{r['opp']} {r['d']}/8: W/L not opposite ({r['res']} / {o['res']})")

# ESPN ground truth for scores
espn_probs = []
for dates in ('20260821','20260822','20260823','20260824','20260828','20260829','20260830','20260831'):
    try:
        d = json.load(urllib.request.urlopen(f'https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard?dates={dates}'))
    except Exception as e:
        espn_probs.append(f'{dates}: fetch failed {e}'); continue
    for e in d.get('events', []):
        comp = e['competitions'][0]
        if e['status']['type']['state'] != 'post': continue
        sc = {c['homeAway']: (c['team']['displayName'], int(c['score'])) for c in comp['competitors']}
        yield_row = (dates, sc['home'], sc['away'])
        # map ESPN names to slugs
        MAP = {"AFC Bournemouth":"bournemouth","Brighton & Hove Albion":"brighton","Ipswich Town":"ipswich-town",
               "Leeds United":"leeds-united","Luton Town":None,"Manchester City":"manchester-city",
               "Manchester United":"manchester-united","Newcastle United":"newcastle","Nottingham Forest":"nottingham-forest",
               "Tottenham Hotspur":"tottenham","West Ham United":None,"Wolverhampton Wanderers":None,
               "Coventry City":"coventry-city","Hull City":"hull-city","Crystal Palace":"crystal-palace",
               "Arsenal":"arsenal","Aston Villa":"aston-villa","Brentford":"brentford","Chelsea":"chelsea",
               "Everton":"everton","Fulham":"fulham","Liverpool":"liverpool","Sunderland":"sunderland"}
        hs, hn = MAP.get(sc['home'][0]), sc['home'][1]
        as_, an = MAP.get(sc['away'][0]), sc['away'][1]
        if not hs or not as_: continue
        day = int(dates[6:])
        hrow = [r for r in rows.get(hs,[]) if r['m']==8 and r['d']==day and r['opp']==as_]
        if hrow:
            mm = re.match(r'([WLD]) (\d+)-(\d+)', hrow[0]['res'])
            if mm:
                w, a, b = mm.groups()
                ok = (int(a)==hn and int(b)==an) if w!='L' or True else False
                # home page lists own score first? convention: result is own-perspective "L 0-4" = own 0, opp 4
                if not (int(a)==hn and int(b)==an):
                    espn_probs.append(f"{hs} {day}/8: page says {hrow[0]['res']}, ESPN says {hn}-{an}")

print(f"parsed {len(rows)} club pages")
print("\n== STRUCTURE / MIRROR PROBLEMS ==" if problems else "\n== NO structure/mirror problems ==")
for p in problems: print(" •", p)
print("\n== ESPN SCORE PROBLEMS ==" if espn_probs else "\n== ESPN scores all match ==")
for p in espn_probs: print(" •", p)
