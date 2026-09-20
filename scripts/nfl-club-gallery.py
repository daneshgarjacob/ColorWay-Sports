#!/usr/bin/env python3
"""Find an NFL club's game-action photo gallery for a given date and download frames.

Why this exists (2026-09-20): ESPN's summary endpoint publishes game photography only once its
recap article lands, which on Week 2 Sunday was 30+ minutes after some finals and never at all for
others. NFL club sites publish a game-action gallery DURING the game. Three games that Sunday were
confirmed off the club gallery with nothing usable from ESPN.

Every club names its gallery differently, so we do not guess the URL. We list /photos/, drop the
obvious non-game galleries, then check `datePublished` on each candidate until one matches the date.
Seen in the wild:
  ravens      game-action-gallery-ravens-vs-saints-week-2
  panthers    game-action-gallery-panthers-at-falcons-september-20-2026
  packers     game-photos-packers-vs-jets-week-2-2026
  texans      gameday-action-texans-vs-bengals-week-2
  chargers    2026-game-action-photos-week-2-raiders
  jaguars     game-action-jaguars-vs-broncos-2026-season-week-2
  cardinals   photos-cardinals-top-pics-vs-<opponent>
  broncos     <away>-at-<home>-game-gallery-photos-week-N-2026-...

usage: nfl-club-gallery.py <host> <club-image-slug> <out-dir> [date=YYYY-MM-DD] [start] [count]
  e.g. nfl-club-gallery.py baltimoreravens.com ravens /tmp/nobal 2026-09-20 6 8

The club-image-slug is the path segment used by static.clubs.nfl.com (ravens, packers, 49ers, ...),
which is usually but NOT always the host's short name.
"""
import re, sys, os, urllib.request, datetime

if len(sys.argv) < 4:
    print(__doc__); sys.exit(1)
host, club, outdir = sys.argv[1], sys.argv[2], sys.argv[3]
date = sys.argv[4] if len(sys.argv) > 4 else datetime.date.today().isoformat()
start = int(sys.argv[5]) if len(sys.argv) > 5 else 6
count = int(sys.argv[6]) if len(sys.argv) > 6 else 8

UA = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
                    "(KHTML, like Gecko) Chrome/130.0 Safari/537.36"}
def get(u):
    return urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=25).read().decode("utf-8", "ignore")

GOOD = re.compile(r"game|action|gallery|top-pics|best-of", re.I)
# Arrivals are players in suits; pregame/warmup can precede a uniform change; the rest are not games.
BAD = re.compile(r"cheer|arrival|watch-party|pregame|warm-?up|practice|fan-photos|mascot|archive|"
                 r"record-books|community|through-the-years|auditions|training-camp|backgrounds", re.I)

idx = get(f"https://www.{host}/photos/")
links = sorted(set(re.findall(r"/photos/[a-z0-9-]{8,110}", idx)))
cands = [l for l in links if GOOD.search(l) and not BAD.search(l)]
print(f"{host}: {len(cands)} candidate galleries")

page = chosen = None
for c in cands[:20]:
    try:
        h = get(f"https://www.{host}{c}")
    except Exception:
        continue
    dp = re.findall(r'datePublished"?\s*:\s*"([^"]+)"', h)[:1]
    if dp and dp[0].startswith(date):
        page, chosen = h, c
        print(f"  MATCH {c}  published {dp[0]}")
        break
if page is None:
    print(f"  no gallery published {date} (galleries usually appear during the game)")
    sys.exit(2)

ids = []
for m in re.finditer(rf"{club}/([a-z0-9]{{15,30}})\.jpg", page):
    if m.group(1) not in ids:
        ids.append(m.group(1))
print(f"  {len(ids)} images in gallery")
os.makedirs(outdir, exist_ok=True)
for k, i in enumerate(ids[start:start + count]):
    u = f"https://static.clubs.nfl.com/image/upload/t_editorial_landscape_12_desktop/{club}/{i}.jpg"
    try:
        open(os.path.join(outdir, f"{k}.jpg"), "wb").write(
            urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=25).read())
    except Exception as e:
        print("   err", k, e)
print(f"  saved to {outdir}")
