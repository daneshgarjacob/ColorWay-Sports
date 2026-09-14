"""Helmet / jersey / pants icons for the NFL uniform tracker cards (shared by nfl-tracker-log.py and nfl-tracker-card.py).
Python port of the approved icon set in ~/Desktop/ColorWay Sports/brand-social-2026-09/uniform-icons/icons.js.

Machine-readable colours: every icon figure carries data-part="helmet|jersey|pants", its <svg> carries data-color="#HEX",
and a zero-size absolutely positioned span keeps a `background:#HEX;` token so older bar parsers
(scripts/build-wear-log.mjs) still read the colours in helmet/jersey/pants order.
"""
import re

PARTS = ("helmet", "jersey", "pants")
SHAPES = {
    "helmet": {
        "body": "M9 41C7 25 17 11 33 11C46 11 54 20 55.5 30L52 33.5H43C40 33.5 38.8 36.6 40.6 39.2L44.5 45C46 47.6 44.6 51 41.4 51H15C11.6 51 9.4 47 9 41Z",
        "details": ["M17 20C22 15 27 13 33 13"],
        "ear": (27, 36, 3.2),
        "mask": ["M52 33.5H60.5V47.5H44", "M45.6 40.5H60.5", "M55.5 30L60.5 33.5"],
    },
    "jersey": {
        "body": "M22 8.5L27 7C28 11 29.8 13.5 32 13.5C34.2 13.5 36 11 37 7L42 8.5L55.5 15.5L58 30.5L47.5 32.5V56.5H16.5V32.5L6 30.5L8.5 15.5Z",
        "details": ["M27 7L32 15.5L37 7", "M16.5 32.5L17.4 19", "M47.5 32.5L46.6 19"],
    },
    "pants": {
        "body": "M15.5 8H48.5L50.5 33L49 55H36.5L32.8 26H31.2L27.5 55H15L13.5 33Z",
        "details": ["M15.1 13.5H48.9", "M32 13.5V26"],
    },
}


def _lum(hex_):
    n = int(hex_.lstrip("#"), 16)
    def ch(v):
        v /= 255
        return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4
    r, g, b = ch((n >> 16) & 255), ch((n >> 8) & 255), ch(n & 255)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def icon(kind, fill, ground="light", size=40):
    fill = fill.upper()
    s = SHAPES[kind]
    if ground == "dark":
        outline, mask = "rgba(255,255,255,.35)", "rgba(255,255,255,.78)"
    else:  # approved tweak: all-white pieces get a darker outline so they read on a white card
        outline, mask = ("#c9ced6" if fill == "#FFFFFF" else "#d9dde3"), "#9AA3AE"
    detail = "rgba(20,34,63,.22)" if _lum(fill) > 0.45 else "rgba(255,255,255,.28)"
    ns = 'vector-effect="non-scaling-stroke"'
    g = f'<path d="{s["body"]}" fill="{fill}" stroke="{outline}" stroke-width="1.5" stroke-linejoin="round" {ns}/>'
    g += "".join(f'<path d="{p}" fill="none" stroke="{detail}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" {ns}/>' for p in s["details"])
    if "ear" in s:
        cx, cy, r = s["ear"]
        g += f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{detail}"/>'
    g += "".join(f'<path d="{p}" fill="none" stroke="{mask}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" {ns}/>' for p in s.get("mask", []))
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="{size}" height="{size}" style="display:block;overflow:visible;" '
            f'aria-hidden="true" data-part="{kind}" data-color="{fill}">{g}</svg>')


def _token(hex_):
    return f'<span style="position:absolute;width:0;height:0;overflow:hidden;background:{hex_.upper()};"></span>'


def light_row(hexes, align="left"):
    """Icon row for the white 'Not yet worn' preview card. align = the team label's text-align."""
    figs = "".join(
        f'<div data-part="{k}" style="display:flex;flex-direction:column;align-items:center;gap:3px;width:44px;">{icon(k, h, "light", 38)}{_token(h)}'
        f'<span style="font-size:8.5px;font-weight:800;color:#9aa0ac;letter-spacing:.08em;text-transform:uppercase;">{k.capitalize()}</span></div>'
        for k, h in zip(PARTS, hexes))
    just = "flex-end" if align == "right" else "flex-start"
    return f'<div style="display:flex;gap:6px;justify-content:{just};margin:0 0 2px;">{figs}</div>'


def dark_row(hexes):
    """Icon row for the dark Final jersey card."""
    figs = "".join(
        f'<div data-part="{k}" style="flex:1 1 0;min-width:0;display:flex;flex-direction:column;align-items:center;gap:3px;">{icon(k, h, "dark", 40)}{_token(h)}'
        f'<span style="font-size:8px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.55);">{k.capitalize()}</span></div>'
        for k, h in zip(PARTS, hexes))
    return f'<div style="display:flex;gap:6px;margin:10px 0 0;width:100%;">{figs}</div>'


# a whole icon row, light or dark (figures never nest a <div>, so the lazy match is safe)
ROW_RE = re.compile(r'<div style="display:flex;gap:6px;(?:justify-content:flex-(?:start|end);margin:0 0 2px;|margin:10px 0 0;width:100%;)">'
                    r'(?:<div data-part="(?:helmet|jersey|pants)"[^>]*>.*?</div>){3}</div>')
# the old light-card swatch bar (pre-icons)
OLD_BAR_RE = re.compile(r'<span style="flex:1;height:11px;border-radius:3px;background:(#[0-9A-Fa-f]{6});(?:border:1px solid #d9dde3;)?display:block;"></span>')


def card_hexes(card):
    """Colours on a card in order (away H/J/P, home H/J/P). Reads icons, falls back to old bars."""
    found = re.findall(r'data-color="(#[0-9A-Fa-f]{6})"', card)
    return [h.upper() for h in (found or OLD_BAR_RE.findall(card))]
