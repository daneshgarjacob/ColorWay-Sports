"""Log NFL tracker cards. Usage: python3 scripts/nfl-tracker-log.py games.json  (run from repo root)
games.json = [ {"away":"Green Bay Packers","home":"Minnesota Vikings",
                "awayBars":["#FFB612","#FFFFFF","#FFB612"], "homeBars":[...],
                "prose":"...", "grade":"-"} ]
Bars order = helmet, jersey, pants. White (#FFFFFF) bars get the border automatically.
"""
import json, re, sys
F = "content/posts/nfl-uniform-tracker-2026.md"
md = open(F).read()
games = json.load(open(sys.argv[1]))
WHITE_BORDER = "border:1px solid #d9dde3;"

def bar_span(hex_):
    hex_ = hex_.upper()
    b = WHITE_BORDER if hex_ == "#FFFFFF" else ""
    return f'<span style="flex:1;height:11px;border-radius:3px;background:{hex_};{b}display:block;"></span>'

for g in games:
    h3 = f"### {g['away']} at {g['home']}\n"
    i = md.find(h3)
    assert i >= 0, h3
    j = md.find("\n### ", i + 1)
    k = md.find("\n## ", i + 1)
    end = min(x for x in (j, k, len(md)) if x > 0)
    card = md[i:end]
    # prose: replace the placeholder paragraph (first non-empty line after the h3)
    lines = card.split("\n")
    assert lines[2].startswith("What the "), lines[2][:60]
    lines[2] = g["prose"]
    card = "\n".join(lines)
    # bars: the card has 6 bar spans in order away H/J/P then home H/J/P
    bars = g["awayBars"] + g["homeBars"]
    pat = re.compile(r'<span style="flex:1;height:11px;border-radius:3px;background:#[0-9A-Fa-f]{6};(?:border:1px solid #d9dde3;)?display:block;"></span>')
    found = pat.findall(card)
    assert len(found) == 6, (h3, len(found))
    n = [0]
    def rep(m):
        s = bar_span(bars[n[0]]); n[0] += 1; return s
    card = pat.sub(rep, card)
    assert card.count("Not yet worn") == 2, h3
    card = card.replace("Not yet worn", "Final")
    grade = g.get("grade", "-")
    if grade and grade != "-":
        card = card.replace('<span style="background:#f1f3f6;color:#a6acb7;font-size:1em;font-weight:900;padding:5px 0;border-radius:8px;min-width:52px;text-align:center;letter-spacing:-.5px;">&ndash;</span>',
                            f'<span style="background:#14223f;color:#ffffff;font-size:1em;font-weight:900;padding:5px 0;border-radius:8px;min-width:52px;text-align:center;letter-spacing:-.5px;">{grade}</span>')
        card = card.replace('color:#a6acb7;">ColorWay Sports Grade &middot; after kickoff', 'color:#6b7280;">ColorWay Sports Matchup Grade')
    else:
        card = card.replace("ColorWay Sports Grade &middot; after kickoff", "ColorWay Sports Matchup Grade")
    md = md[:i] + card + md[end:]
    print("logged", h3.strip())

md = re.sub(r'updatedDate: "\d{4}-\d{2}-\d{2}"', 'updatedDate: "2026-09-13"', md, 1)
open(F, "w").write(md)
