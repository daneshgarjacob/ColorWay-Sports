"""Pick the FRONT laydown from an NFL Shop product gallery and save it to the tracker jersey library.
usage: python3 scripts/nfl-jersey-pick.py products.json
products.json = {"team":"detroit-lions","items":[{"slug":"lions-honolulu-blue-home","base":"/detroit-lions/mens-nike-...-jersey_ss5_p-123","u":"u-abc","views":["2:vtoken:jpg","6:vtoken:png",...]}]}
Rule (verified on the Bills 9/13): views are tried in pv order; composites (wide alpha/non-white bbox), detail crops (full-frame)
and on-model studio shots (non-white corner on a JPG) are skipped; the first survivor is the front laydown (front precedes back).
Output: public/images/posts/nfl-tracker-jerseys/<slug>.jpg (white bg, h<=800, q85) + a contact sheet in the scratch dir.
"""
import json, sys, io, subprocess, os
from PIL import Image
CDN = "https://fanatics.frgimages.com"
OUT = "public/images/posts/nfl-tracker-jerseys"
SHEET_DIR = os.environ.get("SHEET_DIR", "/tmp")
d = json.load(open(sys.argv[1])); os.makedirs(OUT, exist_ok=True)
# compact form from the in-tab JS: {"k","b","u","v"} with the /<team>/mens-nike- prefix and the u- prefix stripped
for it in d["items"]:
    if "b" in it:
        it["base"] = f"/{d['team']}/mens-nike-{it['b']}"; it["u"] = "u-" + it["u"]; it["views"] = it["v"]
        it.setdefault("slug", it["k"])

def fetch(url, w):
    return subprocess.run(["curl", "-sL", "-A", "Mozilla/5.0", f"{url}?_hv=2&w={w}"], capture_output=True).stdout

def classify(raw):
    im = Image.open(io.BytesIO(raw))
    if im.mode in ("RGBA", "LA", "P"):
        im = im.convert("RGBA"); a = im.getchannel("A"); bbox = a.getbbox()
    else:
        im = im.convert("RGB"); px = im.load(); W, H = im.size
        corner = sum(px[2, 2][:3]) / 3
        if corner < 248: return "onmodel", None
        # bbox of non-white
        mask = Image.eval(im.convert("L"), lambda v: 255 if v < 245 else 0); bbox = mask.getbbox()
    if not bbox: return "empty", None
    W, H = im.size; bw, bh = bbox[2] - bbox[0], bbox[3] - bbox[1]
    if bw > 0.9 * W and bh > 0.9 * H: return "detail", None
    if bw / max(bh, 1) > 1.15: return "composite", None
    return "laydown", im

sheet = []
for it in d["items"]:
    chosen = None; log = []
    if "urls" in it:  # older _pi image scheme: [main(composite), alt1, alt2, alt3] as full URLs
        order = [2, 3, 1] + [i for i in range(4, len(it["urls"]))]  # main + alt1 are the composite; alt2 is the front, alt3 the back
        for i in order:
            if i >= len(it["urls"]): continue
            url = it["urls"][i]
            kind, _ = classify(fetch(url, 300)); log.append(f"alt{i}={kind}")
            if kind == "laydown": chosen = url; break
        it["views"] = []
    for v in it["views"]:
        pv, vt, ext = v.split(":")
        if pv == "1": log.append("pv1=composite"); continue  # pv-1 is always the front+back composite
        url = f"{CDN}{it['base']}+pv-{pv}+{it['u']}+v-{vt}.{ext}"
        kind, _ = classify(fetch(url, 300)); log.append(f"pv{pv}={kind}")
        if kind == "laydown":
            chosen = url; break
    print(it["slug"], "->", (chosen.split("+pv-")[1][:4] if "+pv-" in chosen else "pi") if chosen else "NONE", " ".join(log))
    if not chosen: continue
    im = Image.open(io.BytesIO(fetch(chosen, 800)))
    bg = Image.new("RGB", im.size, "#ffffff")
    if im.mode in ("RGBA", "LA", "P"): im = im.convert("RGBA"); bg.paste(im, (0, 0), im)
    else: bg = im.convert("RGB")
    bg.thumbnail((800, 800)); bg.save(f"{OUT}/{it['slug']}.jpg", quality=85, optimize=True); sheet.append((it["slug"], bg.copy()))
if sheet:
    W = 300; sh = Image.new("RGB", (W * len(sheet), W + 24), "#ececf0")
    from PIL import ImageDraw
    dr = ImageDraw.Draw(sh)
    for k, (slug, im) in enumerate(sheet):
        im.thumbnail((W - 16, W - 16)); sh.paste(im, (k * W + (W - im.width) // 2, (W - im.height) // 2)); dr.text((k * W + 6, W + 4), slug, fill="#14223f")
    p = f"{SHEET_DIR}/{d['team']}-sheet.jpg"; sh.save(p, quality=85); print("sheet", p)
