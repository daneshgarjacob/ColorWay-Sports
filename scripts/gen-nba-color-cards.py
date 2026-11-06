"""Palette cards for 'How Every NBA Team Got Its Colors' (same look as the NFL colors post's cards).
usage: python3 scripts/gen-nba-color-cards.py   (writes public/images/posts/how-every-nba-team-got-its-colors/<slug>-colors.png)"""
import os, subprocess
CH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"; HOME = os.path.expanduser("~")
OUT = "public/images/posts/how-every-nba-team-got-its-colors"
TEAMS = {
 "hawks": ("Atlanta Hawks", [("Torch Red", "#C8102E"), ("Legacy Yellow", "#FDB927"), ("Infinity Black", "#000000"), ("Granite Gray", "#9EA2A2")]),
 "celtics": ("Boston Celtics", [("Green", "#007A33"), ("Gold", "#BA9653"), ("Black", "#000000"), ("White", "#FFFFFF")]),
 "nets": ("Brooklyn Nets", [("Black", "#000000"), ("White", "#FFFFFF")]),
 "hornets": ("Charlotte Hornets", [("Teal", "#00788C"), ("Purple", "#1D1160"), ("Gray", "#A1A1A4")]),
 "bulls": ("Chicago Bulls", [("Red", "#CE1141"), ("Black", "#000000"), ("White", "#FFFFFF")]),
 "cavaliers": ("Cleveland Cavaliers", [("Wine", "#860038"), ("Gold", "#FDBB30"), ("Navy", "#041E42")]),
 "mavericks": ("Dallas Mavericks", [("Royal Blue", "#00538C"), ("Navy", "#002B5E"), ("Silver", "#B8C4CA")]),
 "nuggets": ("Denver Nuggets", [("Midnight Blue", "#0E2240"), ("Sunshine Yellow", "#FEC524"), ("Flatirons Red", "#8B2131"), ("Skyline Blue", "#1D428A")]),
 "pistons": ("Detroit Pistons", [("Royal Blue", "#1D42BA"), ("Red", "#C8102E"), ("Chrome", "#BEC0C2")]),
 "warriors": ("Golden State Warriors", [("Warriors Blue", "#1D428A"), ("California Golden Yellow", "#FFC72C")]),
 "rockets": ("Houston Rockets", [("Red", "#CE1141"), ("Black", "#000000"), ("Silver", "#C4CED4")]),
 "pacers": ("Indiana Pacers", [("Navy", "#002D62"), ("Gold", "#FDBB30"), ("Cool Gray", "#BEC0C2")]),
 "clippers": ("LA Clippers", [("Naval Blue", "#0C2340"), ("Ember Red", "#C8102E"), ("Pacific Blue", "#1D428A")]),
 "lakers": ("Los Angeles Lakers", [("Purple", "#552583"), ("Gold", "#FDB927"), ("Black", "#000000")]),
 "grizzlies": ("Memphis Grizzlies", [("Memphis Midnight", "#12173F"), ("Beale Street Blue", "#5D76A9"), ("Gold", "#F5B112")]),
 "heat": ("Miami Heat", [("Red", "#98002E"), ("Black", "#000000"), ("Yellow", "#F9A01B")]),
 "bucks": ("Milwaukee Bucks", [("Good Land Green", "#00471B"), ("Cream City Cream", "#EEE1C6"), ("Great Lakes Blue", "#0077C0")]),
 "timberwolves": ("Minnesota Timberwolves", [("Midnight Blue", "#0C2340"), ("Aurora Green", "#78BE20"), ("Lake Blue", "#236192"), ("Moonlight Grey", "#9EA2A2")]),
 "pelicans": ("New Orleans Pelicans", [("Navy", "#0C2340"), ("Gold", "#85714D"), ("Red", "#C8102E")]),
 "knicks": ("New York Knicks", [("Blue", "#006BB6"), ("Orange", "#F58426"), ("Silver", "#BEC0C2")]),
 "thunder": ("Oklahoma City Thunder", [("Thunder Blue", "#007AC1"), ("Sunset", "#EF3B24"), ("Navy", "#002D62"), ("Yellow", "#FDBB30")]),
 "magic": ("Orlando Magic", [("Blue", "#0077C0"), ("Black", "#000000"), ("Silver", "#C4CED4")]),
 "76ers": ("Philadelphia 76ers", [("Blue", "#006BB6"), ("Red", "#ED174C"), ("Navy", "#002B5C")]),
 "suns": ("Phoenix Suns", [("Purple", "#1D1160"), ("Orange", "#E56020"), ("Black", "#000000")]),
 "trail-blazers": ("Portland Trail Blazers", [("Red", "#E03A3E"), ("Black", "#000000"), ("White", "#FFFFFF")]),
 "kings": ("Sacramento Kings", [("Purple", "#5A2D81"), ("Silver", "#63727A"), ("Black", "#000000")]),
 "spurs": ("San Antonio Spurs", [("Silver", "#C4CED4"), ("Black", "#000000"), ("White", "#FFFFFF")]),
 "raptors": ("Toronto Raptors", [("Red", "#CE1141"), ("Black", "#000000"), ("Silver", "#A1A1A4"), ("Gold", "#B4975A")]),
 "jazz": ("Utah Jazz", [("Purple", "#4E008E"), ("Black", "#000000"), ("Sky Blue", "#79A3DC")]),
 "wizards": ("Washington Wizards", [("Navy", "#002B5C"), ("Red", "#E31837"), ("Silver", "#C4CED4")]),
}
os.makedirs(OUT, exist_ok=True)
CSS = f"""@font-face{{font-family:Hanken;src:url('file://{HOME}/Library/Fonts/HankenGrotesk-Variable.ttf');font-weight:100 900}}
*{{margin:0;padding:0;box-sizing:border-box}}html,body{{width:1200px;height:300px;overflow:hidden}}
body{{background:#f4f2ee;font-family:Hanken;color:#14284b;padding:36px 48px}}
h1{{font-size:24px;font-weight:800;letter-spacing:.5px;text-transform:uppercase;margin-bottom:22px}}
.row{{display:flex;gap:18px}}.c{{flex:1;min-width:0}}.s{{height:150px;border-radius:16px}}
.n{{font-size:23px;font-weight:800;margin:20px 0 0 4px;white-space:nowrap}}"""
for slug, (name, cols) in TEAMS.items():
    sw = "".join(f'<div class="c"><div class="s" style="background:{h};{"border:2px solid #d9d6cf;" if h.upper() in ("#FFFFFF", "#EEE1C6") else ""}"></div><div class="n">{n}</div></div>' for n, h in cols)
    html = f"<!doctype html><html><head><meta charset='utf-8'><style>{CSS}</style></head><body><h1>{name} &middot; Team Colors</h1><div class='row'>{sw}</div></body></html>"
    hp = f"/tmp/nba-colors-{slug}.html"; open(hp, "w").write(html)
    subprocess.run([CH, "--headless=new", "--disable-gpu", "--hide-scrollbars", f"--screenshot={OUT}/{slug}-colors.png",
                    "--window-size=1200,300", "--virtual-time-budget=2000", "file://" + hp], check=True, capture_output=True)
print("ok", len(TEAMS))
