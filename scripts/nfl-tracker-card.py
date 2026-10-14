"""Swap an NFL tracker game card to the jersey-card format (MLB-style matchup card + helmet/jersey/pants chips).
usage: python3 scripts/nfl-tracker-card.py games.json
Re-runnable: works on a light preview card OR an already-converted jersey card. Optional per game: awayBars/homeBars (override the
six colours, e.g. what was actually worn), awayStatus/homeStatus ("Confirmed"/"Projected", shown until Final), prose (replaces the
paragraph under the h3). Sunday loop for a jersey preview card = one call with bars + score + prose.
games.json = [{"away":"Buffalo Bills","home":"Houston Texans","awayJersey":"bills-royal-home","homeJersey":"texans-white-liberty",
               "score":"Bills 36, Texans 31"}]   (score = winner first; omit for a game still in progress)
The six helmet/jersey/pants colours (icon data-color, or old bars), the week label, the Final/Not-yet-worn status and the grade are read off the existing card, so a game that has
been logged with scripts/nfl-tracker-log.py converts with no re-entry. Jersey images live in public/images/posts/nfl-tracker-jerseys/.

DIRECTION 5 (Jake approved 10/13). Every NEW card is the D5 card, built by scripts/nfl-card-d5.mjs (we pipe it a JSON spec):
  * an h3 with no card under it yet gets a D5 card inserted after its paragraph. Needs: awayJersey, homeJersey, awayBars,
    homeBars, week, label (the window: "1:00 ET", "Thursday Night Football", "9:30 ET &middot; London"), kickoff
    ("Thu 5:15 PT", shown in the score-bar center until the final), awayStatus/homeStatus ("Confirmed",
    "Jersey confirmed", "Projected"). Optional awayWords/homeWords (["Royal","Orange","White"]) when a hex is not in NAMES
    or the club's own wording differs.
  * a D5 card re-runs in place: anything not passed is read back off the card (jerseys, bars, words, statuses, week, label,
    kickoff, grade). After the game pass "score" (winner first, "Bills 37, Rams 34 (OT)") or awayScore/homeScore; the
    statuses drop and the center flips to Final.
  * an OLD black or light card stays in its own style (already-published cards are never restyled).
"grade": "B+" sets the grade on either style (D5 cards start with an empty chip until Jake grades).
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
    "#003594": "Royal", "#FFD100": "Gold",  # Rams Sol: the club and our posts call it gold, never yellow
    "#0B2265": "Royal", "#C83803": "Orange", "#BFC0BF": "Silver", "#D50A0A": "Red",
    "#008E97": "Aqua", "#0C2340": "Navy", "#002244": "Navy", "#69BE28": "Green", "#AA0000": "Red", "#E31837": "Red",
    "#FF7900": "Orange", "#311D00": "Brown", "#0B162A": "Navy", "#4B92DB": "Light Blue", "#1D428A": "Royal", "#ACC0C6": "Silver Green",
    "#A5A9AD": "Gray", "#002C5F": "Blue", "#3B3F45": "Anthracite", "#869397": "Silver", "#0A1C33": "Midnight Navy",
    "#A71930": "Red", "#FFC20E": "Gold", "#EFE6D2": "Cream", "#D8C3A0": "Sand", "#97233F": "Cardinal",
    "#2F3B2C": "Hunter Green", "#C60C30": "Red", "#A2AAAD": "Wolf Grey",
}
SHORT = lambda name: name.split()[-1].upper() if name not in ("Washington Commanders",) else "COMMANDERS"

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from nfl_uniform_icons import dark_row as chips, card_hexes  # helmet/jersey/pants icons

def side(name, slug, hexes, date_words, opp, status=""):
    combo = " &middot; ".join(NAMES.get(h.upper(), "?") for h in hexes)
    alt = f"{name} {slug.split('-',1)[1].replace('-',' ')} jersey worn {date_words} against the {opp.split()[-1]}, from the ColorWay Sports NFL uniform tracker"
    return ('<div style="text-align:center;display:flex;flex-direction:column;align-items:center;">'
            f'<div style="width:100%;height:150px;background:#ececf0;border-radius:10px;display:flex;align-items:center;justify-content:center;padding:8px;box-sizing:border-box;"><img src="{LIB}/{slug}.jpg" alt="{alt}" style="max-height:134px;max-width:100%;object-fit:contain;" loading="lazy" decoding="async" /></div>'
            f'<p style="color:#ffffff;font-size:13px;font-weight:900;margin:11px 0 0;line-height:1.2;">{SHORT(name)}</p>'
            f'<p style="color:#ffffff;font-size:9px;letter-spacing:1.8px;text-transform:uppercase;opacity:.85;margin:4px 0 0;font-weight:600;">{combo}</p>'
            + (f'<p data-status style="color:#ffffff;font-size:8.5px;letter-spacing:1.6px;text-transform:uppercase;opacity:.55;margin:5px 0 0;font-weight:700;">{status}</p>' if status else "")
            + chips(hexes) + "</div>")

import subprocess
D5_RE = re.compile(r'<div style="margin: 1\.4em 0 0\.6em;">\n<div data-card="nfl-d5".*?\n</div>\n</div>\n?', re.S)
OLD_RE = re.compile(r'<div style="border:1px solid #e3e6ec;border-radius:12px;|<div style="margin:0\.6em 0 1\.2em;"><div style="background:linear-gradient\(135deg,#1a1a1a')

def strip_ent(x):
    return re.sub(r"<[^>]+>", "", x).replace("&middot;", "·").replace("&amp;", "&").strip()

def emit_d5(spec):
    out = subprocess.run(["node", os.path.join(os.path.dirname(os.path.abspath(__file__)), "nfl-card-d5.mjs"), "--emit"],
                         input=json.dumps(spec), capture_output=True, text=True)
    if out.returncode:
        sys.exit(out.stderr)
    return out.stdout

def parse_score(score, away, home):
    """"Bills 37, Rams 34 (OT)" (winner first) -> (away_pts, home_pts, sub)."""
    sub = "OT" if re.search(r"\bOT\b|overtime", score) else ""
    pts = {}
    for part in re.sub(r"\(.*?\)", "", score).split(","):
        m = re.match(r"\s*(.+?)\s+(\d+)\s*$", part)
        assert m, f"cannot read score part {part!r} in {score!r}"
        pts[m.group(1).strip().lower()] = int(m.group(2))
    def find(full):
        for name, v in pts.items():
            if full.lower().endswith(name):
                return v
        raise AssertionError(f"{full} not in score {score!r}")
    return find(away), find(home), sub

def d5_card(g, old, date_words):
    """Build (or rebuild) one D5 card. old = the existing D5 card html, or "" for a brand-new card."""
    prev = {}
    if old:
        prev["hexes"] = card_hexes(old)
        prev["words"] = [strip_ent(w).split(" · ") for w in re.findall(r'<p data-uni[^>]*>(.*?)</p>', old)]
        prev["status"] = re.findall(r'<p data-status[^>]*>([^<]+)</p>', old)
        prev["slugs"] = [re.sub(r"(-cut)?\.(jpg|png|webp)$", "", x) for x in re.findall(r'<img src="/images/posts/nfl-tracker-jerseys/([^"]+)"', old)]
        cap = re.search(r'>Week (\d+)</span><span[^>]*>([^<]+)</span>', old)
        prev["week"], prev["label"] = (int(cap.group(1)), cap.group(2)) if cap else (None, None)
        kick = re.search(r'data-kickoff="([^"]+)"', old)
        prev["kickoff"] = kick.group(1) if kick else ""
        gr = re.search(r'data-grade="([^"]*)"', old)
        prev["grade"] = gr.group(1) if gr else ""
        pill = re.search(r'<span data-pill[^>]*>Final &middot; ([^<]+)</span>', old)
        prev["score"] = pill.group(1) if pill else None
    hexes = list(prev.get("hexes") or [None] * 6)
    if g.get("awayBars"): hexes[:3] = [h.upper() for h in g["awayBars"]]
    if g.get("homeBars"): hexes[3:] = [h.upper() for h in g["homeBars"]]
    assert len(hexes) == 6 and all(hexes), f"{g['away']} at {g['home']}: need awayBars + homeBars for a new card"
    words = []
    for n, (bars_key, words_key) in enumerate((("awayBars", "awayWords"), ("homeBars", "homeWords"))):
        if g.get(words_key):
            words.append(g[words_key])
        elif len(prev.get("words") or []) == 2 and not g.get(bars_key):
            words.append(prev["words"][n])
        else:
            words.append([NAMES.get(h, "?") for h in hexes[n * 3:n * 3 + 3]])
    assert not any("?" in w for w in words), f"{g['away']} at {g['home']}: a colour has no name in NAMES, pass awayWords/homeWords: {words}"
    old_slugs = prev.get("slugs") or [None, None]
    slugs = [g.get("awayJersey") or old_slugs[0], g.get("homeJersey") or old_slugs[1]]
    assert all(slugs), f"{g['away']} at {g['home']}: awayJersey + homeJersey required"
    st = list((prev.get("status") or []) + ["", ""])[:2]
    if g.get("awayStatus"): st[0] = g["awayStatus"]
    if g.get("homeStatus"): st[1] = g["homeStatus"]
    week, label = g.get("week") or prev.get("week"), g.get("label") or prev.get("label")
    assert week and label, f"{g['away']} at {g['home']}: week + label required"
    kickoff = g.get("kickoff") or prev.get("kickoff") or ""
    grade = g.get("grade") or prev.get("grade") or ""
    if grade in ("-", "&ndash;", "–"): grade = ""
    spec = {"grade": grade, "week": int(week), "windowLabel": label, "kickoff": kickoff, "dateWords": date_words,
            "away": {"name": g["away"], "label": SHORT(g["away"]), "slug": slugs[0], "hexes": hexes[:3], "words": words[0], "status": st[0]},
            "home": {"name": g["home"], "label": SHORT(g["home"]), "slug": slugs[1], "hexes": hexes[3:], "words": words[1], "status": st[1]}}
    score = g.get("score") or prev.get("score")
    if "awayScore" in g and "homeScore" in g:
        a, h, sub = int(g["awayScore"]), int(g["homeScore"]), g.get("sub", "")
        if not g.get("score"):
            (wn, wp), (ln, lp) = sorted(((g["away"], a), (g["home"], h)), key=lambda t: -t[1])
            score = f"{wn.split()[-1]} {wp}, {ln.split()[-1]} {lp}" + (f" ({sub})" if sub else "")
    elif score:
        a, h, sub = parse_score(score, g["away"], g["home"])
    else:
        a = h = None
    if a is not None:
        spec.update({"awayScore": a, "homeScore": h, "score": score, "sub": sub})
        spec["away"]["status"] = spec["home"]["status"] = ""
        pill = f"Final &middot; {score}"
    else:
        pill = f"Preview &middot; {kickoff}"
    return emit_d5(spec) + "\n", pill, grade or "&ndash;"

md = open(F).read()
games = json.load(open(sys.argv[1]))
for g in games:
    h3 = f"### {g['away']} at {g['home']}\n"
    i = md.find(h3); assert i >= 0, h3
    j = md.find("\n### ", i + 1); k = md.find("\n## ", i + 1)
    end = min(x for x in (j, k, len(md)) if x > 0)
    card = md[i:end]
    d5 = D5_RE.search(card)
    if d5 or not OLD_RE.search(card):
        # Direction 5: a brand-new card, or a D5 card re-run in place
        if g.get("prose"):
            lines = card.split("\n"); lines[2] = g["prose"]; card = "\n".join(lines)
            d5 = D5_RE.search(card)
        for sl in (g.get("awayJersey"), g.get("homeJersey")):
            if sl: assert any(os.path.exists(f"public{LIB}/{sl}{e}") for e in (".jpg", ".png", ".webp")), sl
        day = re.findall(r"\n## ([A-Z][a-z]+day, [A-Z][a-z]+ \d+)\n", md[:i])
        date_words = (day[-1].replace(",", "") + ", 2026") if day else "in 2026"
        new, pill, grade = d5_card(g, d5.group(0) if d5 else "", date_words)
        if d5:
            card = card[:d5.start()] + new + card[d5.end():]
        else:  # brand-new card: insert after the paragraph under the h3
            lines = card.split("\n")
            assert lines[1] == "" and lines[2].strip(), f"{h3.strip()}: expected one paragraph under the heading"
            rest = "\n".join(lines[3:]).strip("\n")
            card = "\n".join(lines[:3]) + "\n\n" + new + ("\n" + rest + "\n" if rest else "")
        md = md[:i] + card + md[end:]
        print("d5", h3.strip(), "|", pill, "|", grade)
        continue
    for s in (g["awayJersey"], g["homeJersey"]):
        assert os.path.exists(f"public{LIB}/{s}.jpg"), s
    m = (re.search(r'<div style="border:1px solid #e3e6ec;border-radius:12px;.*?</div></div>\n', card, re.S)
         or re.search(r'<div style="margin:0\.6em 0 1\.2em;"><div style="background:linear-gradient\(135deg,#1a1a1a.*?</div></div>\n', card, re.S))
    assert m, "old card not found: " + h3
    if g.get("prose"):  # the paragraph under the h3
        lines = card.split("\n"); lines[2] = g["prose"]; card = "\n".join(lines)
        m = re.search(re.escape(m.group(0)), card)
    old = m.group(0)
    wk = re.search(r'Week (\d+) &middot; ([^<]+)<', old)
    week, label = wk.group(1), wk.group(2)
    hexes = card_hexes(old)
    assert len(hexes) == 6, h3
    if g.get("awayBars"): hexes[:3] = [h.upper() for h in g["awayBars"]]
    if g.get("homeBars"): hexes[3:] = [h.upper() for h in g["homeBars"]]
    # preview status per side: light card's data-projection tag, or a dark preview's data-status line
    st = re.findall(r'<span data-projection[^>]*> &middot; ([^<]+)</span>', old) or re.findall(r'<p data-status[^>]*>([^<]+)</p>', old)
    st = (st + ["", ""])[:2]
    if g.get("awayStatus"): st[0] = g["awayStatus"]
    if g.get("homeStatus"): st[1] = g["homeStatus"]
    grade = g.get("grade") or re.search(r'letter-spacing:-\.5px;">([^<]+)</span>', old).group(1)
    final = "Final" in old or bool(g.get("score"))
    if final: st = ["", ""]
    # the day heading above this card gives the date words for alt text
    day = re.findall(r"\n## ([A-Z][a-z]+day, [A-Z][a-z]+ \d+)\n", md[:i])
    date_words = (day[-1] if day else f"in Week {week}").replace(",", "") + ", 2026" if day else "in 2026"
    if g.get("score"):
        pill = f"Final &middot; {g['score']}"
    else:
        pill = "Final" if final else f"Week {week} &middot; {label}"
    grade_html = (f'<span style="background:#ffffff;color:#0a0a0a;font-size:1em;font-weight:900;padding:5px 0;border-radius:8px;min-width:52px;text-align:center;letter-spacing:-.5px;">{grade}</span>'
                  if grade.strip() not in ("&ndash;", "–", "-") else
                  '<span style="background:rgba(255,255,255,.12);color:rgba(255,255,255,.55);font-size:1em;font-weight:900;padding:5px 0;border-radius:8px;min-width:52px;text-align:center;letter-spacing:-.5px;">&ndash;</span>')
    new = ('<div style="margin:0.6em 0 1.2em;"><div style="background:linear-gradient(135deg,#1a1a1a 0%,#0a0a0a 100%);border-radius:14px;padding:18px 22px 20px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">'
           f'<div style="text-align:center;margin-bottom:12px;"><span style="padding:4px 14px;background:linear-gradient(90deg,#013369 0%,#0C1526 100%);border-radius:999px;font-size:10px;font-weight:800;color:#ffffff;text-transform:uppercase;letter-spacing:2px;display:inline-block;">{pill}</span></div>'
           '<div style="display:grid;grid-template-columns:1fr auto 1fr;align-items:start;">'
           + side(g["away"], g["awayJersey"], hexes[:3], date_words, g["home"], st[0]) +
           '<p style="font-size:11px;font-weight:800;color:#ffffff;letter-spacing:2.5px;opacity:.8;margin:64px 18px 0;">AT</p>'
           + side(g["home"], g["homeJersey"], hexes[3:], date_words, g["away"], st[1]) +
           '</div>'
           f'<div style="display:flex;align-items:center;gap:11px;margin:14px 0 0;padding-top:12px;border-top:1px solid rgba(255,255,255,.12);">{grade_html}<span style="font-size:0.7em;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:rgba(255,255,255,.6);">ColorWay Sports Matchup Grade &middot; Week {week} &middot; {label}</span></div>'
           '</div></div>\n')
    md = md[:i] + card.replace(old, new) + md[end:]
    print("converted", h3.strip(), "|", pill, "|", grade)
import datetime
md = re.sub(r'updatedDate: "\d{4}-\d{2}-\d{2}"', f'updatedDate: "{datetime.date.today().isoformat()}"', md, 1)
open(F, "w").write(md)
