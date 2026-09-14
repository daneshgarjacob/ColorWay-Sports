"""Swap an NFL tracker game card to the jersey-card format (MLB-style matchup card + helmet/jersey/pants chips).
usage: python3 scripts/nfl-tracker-card.py games.json
games.json = [{"away":"Buffalo Bills","home":"Houston Texans","awayJersey":"bills-royal-home","homeJersey":"texans-white-liberty",
               "score":"Bills 36, Texans 31"}]   (score = winner first; omit for a game still in progress)
The six helmet/jersey/pants colours (icon data-color, or old bars), the week label, the Final/Not-yet-worn status and the grade are read off the existing card, so a game that has
been logged with scripts/nfl-tracker-log.py converts with no re-entry. Jersey images live in public/images/posts/nfl-tracker-jerseys/.
"""
import json, re, sys, os
F = "content/posts/nfl-uniform-tracker-2026.md"
LIB = "/images/posts/nfl-tracker-jerseys"
NAMES = {  # bar hex -> colour word used in the combination line
    "#FFFFFF": "White", "#00338D": "Royal", "#03202F": "Navy", "#FB4F14": "Orange", "#34302B": "Pewter", "#FF3C00": "Orange",
    "#101820": "Black", "#006778": "Teal", "#000000": "Black", "#FFB612": "Gold", "#241773": "Purple", "#0055A4": "Royal",
    "#125740": "Green", "#4B92DB": "Light Blue", "#B0B7BC": "Silver", "#0076B6": "Honolulu Blue", "#D3BC8D": "Gold",
    "#0B162A": "Navy", "#0085CA": "Powder Blue", "#203731": "Green", "#4F2683": "Purple", "#97233F": "Cardinal",
    "#0080C6": "Powder Blue", "#5A1414": "Burgundy", "#004C54": "Midnight Green", "#A5ACAF": "Silver", "#B3995D": "Gold",
    "#003594": "Royal", "#FFD100": "Yellow", "#0B2265": "Royal", "#C83803": "Orange", "#BFC0BF": "Silver", "#D50A0A": "Red",
    "#008E97": "Aqua", "#0C2340": "Navy", "#002244": "Navy", "#69BE28": "Green", "#AA0000": "Red", "#E31837": "Red",
    "#FF7900": "Orange", "#311D00": "Brown", "#0B162A": "Navy", "#4B92DB": "Light Blue", "#1D428A": "Royal", "#ACC0C6": "Silver Green",
}
SHORT = lambda name: name.split()[-1].upper() if name not in ("Washington Commanders",) else "COMMANDERS"

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from nfl_uniform_icons import dark_row as chips, card_hexes  # helmet/jersey/pants icons

def side(name, slug, hexes, date_words, opp):
    combo = " &middot; ".join(NAMES.get(h.upper(), "?") for h in hexes)
    alt = f"{name} {slug.split('-',1)[1].replace('-',' ')} jersey worn {date_words} against the {opp.split()[-1]}, from the ColorWay Sports NFL uniform tracker"
    return ('<div style="text-align:center;display:flex;flex-direction:column;align-items:center;">'
            f'<div style="width:100%;height:150px;background:#ececf0;border-radius:10px;display:flex;align-items:center;justify-content:center;padding:8px;box-sizing:border-box;"><img src="{LIB}/{slug}.jpg" alt="{alt}" style="max-height:134px;max-width:100%;object-fit:contain;" loading="lazy" decoding="async" /></div>'
            f'<p style="color:#ffffff;font-size:13px;font-weight:900;margin:11px 0 0;line-height:1.2;">{SHORT(name)}</p>'
            f'<p style="color:#ffffff;font-size:9px;letter-spacing:1.8px;text-transform:uppercase;opacity:.85;margin:4px 0 0;font-weight:600;">{combo}</p>'
            + chips(hexes) + "</div>")

md = open(F).read()
games = json.load(open(sys.argv[1]))
for g in games:
    for s in (g["awayJersey"], g["homeJersey"]):
        assert os.path.exists(f"public{LIB}/{s}.jpg"), s
    h3 = f"### {g['away']} at {g['home']}\n"
    i = md.find(h3); assert i >= 0, h3
    j = md.find("\n### ", i + 1); k = md.find("\n## ", i + 1)
    end = min(x for x in (j, k, len(md)) if x > 0)
    card = md[i:end]
    m = re.search(r'<div style="border:1px solid #e3e6ec;border-radius:12px;.*?</div></div>\n', card, re.S)
    assert m, "old card not found: " + h3
    old = m.group(0)
    label = re.search(r'Week \d+ &middot; ([^<]+)<', old).group(1)
    hexes = card_hexes(old)
    assert len(hexes) == 6, h3
    grade = re.search(r'letter-spacing:-\.5px;">([^<]+)</span>', old).group(1)
    final = "Final" in old
    # the day heading above this card gives the date words for alt text
    day = re.findall(r"\n## ([A-Z][a-z]+day, [A-Z][a-z]+ \d+)\n", md[:i])
    date_words = (day[-1] if day else "in Week 1").replace(",", "") + ", 2026" if day else "in 2026"
    if g.get("score"):
        pill = f"Final &middot; {g['score']}"
    else:
        pill = "Final" if final else f"Week 1 &middot; {label}"
    grade_html = (f'<span style="background:#ffffff;color:#0a0a0a;font-size:1em;font-weight:900;padding:5px 0;border-radius:8px;min-width:52px;text-align:center;letter-spacing:-.5px;">{grade}</span>'
                  if grade.strip() not in ("&ndash;", "–", "-") else
                  '<span style="background:rgba(255,255,255,.12);color:rgba(255,255,255,.55);font-size:1em;font-weight:900;padding:5px 0;border-radius:8px;min-width:52px;text-align:center;letter-spacing:-.5px;">&ndash;</span>')
    new = ('<div style="margin:0.6em 0 1.2em;"><div style="background:linear-gradient(135deg,#1a1a1a 0%,#0a0a0a 100%);border-radius:14px;padding:18px 22px 20px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">'
           f'<div style="text-align:center;margin-bottom:12px;"><span style="padding:4px 14px;background:linear-gradient(90deg,#013369 0%,#0C1526 100%);border-radius:999px;font-size:10px;font-weight:800;color:#ffffff;text-transform:uppercase;letter-spacing:2px;display:inline-block;">{pill}</span></div>'
           '<div style="display:grid;grid-template-columns:1fr auto 1fr;align-items:start;">'
           + side(g["away"], g["awayJersey"], hexes[:3], date_words, g["home"]) +
           '<p style="font-size:11px;font-weight:800;color:#ffffff;letter-spacing:2.5px;opacity:.8;margin:64px 18px 0;">AT</p>'
           + side(g["home"], g["homeJersey"], hexes[3:], date_words, g["away"]) +
           '</div>'
           f'<div style="display:flex;align-items:center;gap:11px;margin:14px 0 0;padding-top:12px;border-top:1px solid rgba(255,255,255,.12);">{grade_html}<span style="font-size:0.7em;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:rgba(255,255,255,.6);">ColorWay Sports Matchup Grade &middot; Week 1 &middot; {label}</span></div>'
           '</div></div>\n')
    md = md[:i] + card.replace(old, new) + md[end:]
    print("converted", h3.strip(), "|", pill, "|", grade)
open(F, "w").write(md)
