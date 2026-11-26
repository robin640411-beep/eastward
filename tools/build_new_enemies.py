#!/usr/bin/env python3
"""Generate 10 new crisp 16-bit pixel-art enemy sprites (96x96 RGBA PNG + SVG) and update manifest.json."""
import json
import struct
import zlib
from pathlib import Path

def write_rgba_png(path, width, height, pixels):
    """Write a pure-stdlib RGBA PNG (color type 6, 8-bit)."""
    raw = bytearray()
    for y in range(height):
        raw.append(0)  # filter type 0
        row = pixels[y]
        for r, g, b, a in row:
            raw.extend((r, g, b, a))
    def chunk(tag, data):
        crc = zlib.crc32(tag + data) & 0xffffffff
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", crc)
    ihdr = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", zlib.compress(bytes(raw), 9)) + chunk(b"IEND", b"")
    path.write_bytes(png)

def hex_to_rgba(col):
    col = col.lstrip("#")
    return (int(col[0:2], 16), int(col[2:4], 16), int(col[4:6], 16), 255)

ROOT = Path(__file__).resolve().parents[1]
PNG_DIR = ROOT / "dist" / "assets" / "combat" / "enemies"
SVG_DIR = ROOT / "dist" / "assets" / "enemies"
MANIFEST = ROOT / "dist" / "assets" / "manifest.json"

NEW_ENEMIES = [
    ("sniper",        "荒野狙擊手", False, "bullet",     "human"),
    ("pyro",          "焦土縱火狂", False, "cannon",     "mutant"),
    ("mech_hound",    "機械獵犬",   True,  "shock",      "synth"),
    ("spore_giant",   "孢子巨菇怪", False, "spores",     "mycelial"),
    ("crystal_golem", "晶礦石魔",   False, "slam",       "crystal"),
    ("harvester",     "收割機甲",   True,  "saw",        "synth"),
    ("mire_toad",     "沼澤酸蛙",   False, "acid",       "amphibian"),
    ("sand_worm",     "沙丘潛蟲",   False, "bite",       "chitin"),
    ("wraith",        "星輝幽靈",   False, "psychic",    "lumen"),
    ("biker",         "公路飆車匪", False, "burst_fire", "human"),
]

# Draw on a 32x32 pixel grid and upscale 3x with NEAREST -> crisp 96x96 pixel-art RGBA PNG + SVG!
def draw_enemy_grid(key):
    rects = []  # (x, y, w, h, color)
    r = lambda x, y, w, h, c: rects.append((x, y, w, h, c))
    if key == "sniper":
        # Ghillie-cloaked wasteland sniper aiming long amber rifle left
        r(12, 24, 3, 6, "#2c343d"); r(17, 24, 3, 6, "#2c343d")  # boots
        r(10, 12, 12, 13, "#465947"); r(11, 13, 10, 10, "#5c7058")  # cloak
        r(12, 6, 8, 7, "#3a4a3c"); r(13, 8, 5, 3, "#1d262b")  # hood + goggles
        r(13, 9, 2, 1, "#f4c95d"); r(16, 9, 2, 1, "#f4c95d")  # glowing scope eyes
        r(2, 14, 15, 2, "#353d47"); r(5, 13, 4, 1, "#e9c46a"); r(1, 14, 2, 2, "#f4a261")  # long sniper rifle
        r(10, 15, 4, 3, "#7c8d74")  # shoulder moss
    elif key == "pyro":
        # Heavy gas-mask arsonist with fuel backpack & flamethrower
        r(11, 24, 4, 6, "#252930"); r(18, 24, 4, 6, "#252930")
        r(21, 11, 5, 11, "#b84a39"); r(22, 12, 3, 9, "#e76f51"); r(22, 9, 3, 2, "#adb5bd")  # fuel tank
        r(10, 11, 12, 13, "#54473f"); r(11, 13, 10, 9, "#755f52")
        r(12, 5, 8, 7, "#343a40"); r(13, 7, 2, 2, "#f4d35e"); r(17, 7, 2, 2, "#f4d35e")  # gas mask
        r(14, 10, 4, 2, "#6c757d")  # respirator
        r(3, 15, 11, 3, "#495057"); r(1, 14, 3, 5, "#f77f00"); r(0, 15, 2, 3, "#fff0cc")  # flame nozzle
    elif key == "mech_hound":
        # Armored quadruped cyber-hound with crackling blue arc jaws
        r(6, 22, 3, 7, "#495057"); r(11, 23, 3, 6, "#343a40"); r(20, 22, 3, 7, "#495057"); r(24, 23, 3, 6, "#343a40")
        r(7, 14, 19, 9, "#5c6773"); r(9, 15, 15, 6, "#7b8794"); r(12, 13, 9, 3, "#343a40")  # armored torso
        r(3, 12, 7, 6, "#495057"); r(4, 13, 2, 2, "#72efdd")  # head + cyan optic
        r(1, 15, 4, 2, "#90e0ef"); r(2, 17, 3, 1, "#fff0cc")  # arc jaws
        r(25, 12, 4, 2, "#adb5bd"); r(27, 10, 2, 3, "#72efdd")  # antenna tail
    elif key == "spore_giant":
        # Towering bioluminescent fungal colossus
        r(11, 23, 4, 7, "#4c5c4a"); r(17, 23, 4, 7, "#4c5c4a")
        r(9, 13, 14, 11, "#6b7d65"); r(11, 14, 10, 9, "#8aa082")
        r(5, 15, 4, 8, "#586b54"); r(23, 15, 4, 8, "#586b54")  # heavy fungal arms
        r(4, 6, 24, 8, "#3e5c5c"); r(7, 3, 18, 5, "#4d7a78")  # giant cap
        for sx, sy in [(8, 7), (14, 5), (20, 8), (11, 10), (18, 6)]:
            r(sx, sy, 2, 2, "#72efdd")  # glowing cap spots
        r(12, 16, 2, 2, "#d8f3dc"); r(18, 16, 2, 2, "#d8f3dc")  # eerie eyes
    elif key == "crystal_golem":
        # Jagged violet-cyan crystalline golem
        r(10, 23, 5, 7, "#4a3568"); r(17, 23, 5, 7, "#4a3568")
        r(8, 11, 16, 13, "#6a4c93"); r(10, 12, 12, 10, "#8a66b8")
        r(4, 13, 5, 10, "#5a3d80"); r(23, 13, 5, 10, "#5a3d80")  # crystal fists
        r(11, 5, 10, 7, "#7b59a8"); r(13, 2, 6, 4, "#a682d4")  # crystal crown
        r(13, 8, 2, 2, "#72efdd"); r(17, 8, 2, 2, "#72efdd")  # glowing eyes
        r(14, 15, 4, 4, "#90e0ef"); r(15, 16, 2, 2, "#ffffff")  # chest core
    elif key == "harvester":
        # Industrial alien-corrupted saw-arm mech
        r(10, 24, 5, 6, "#2b303a"); r(18, 24, 5, 6, "#2b303a")
        r(9, 10, 14, 14, "#4b5563"); r(11, 12, 10, 10, "#6b7280")
        r(12, 6, 8, 5, "#374151"); r(13, 7, 6, 2, "#e63946")  # red visor
        r(2, 13, 7, 7, "#d1d5db"); r(4, 15, 3, 3, "#e63946")  # spinning buzzsaw left arm
        r(23, 12, 5, 10, "#4b5563"); r(24, 10, 3, 3, "#f4a261")  # claw + hazard beacon
    elif key == "mire_toad":
        # Bloated toxic swamp leaper
        r(7, 23, 5, 6, "#3b5239"); r(20, 23, 5, 6, "#3b5239")
        r(6, 13, 20, 12, "#4f6d4a"); r(9, 15, 14, 8, "#6f9262")
        r(9, 20, 14, 4, "#a3b87c")  # bloated toxic belly
        r(8, 10, 5, 4, "#4f6d4a"); r(19, 10, 5, 4, "#4f6d4a")
        r(9, 11, 2, 2, "#f4d35e"); r(20, 11, 2, 2, "#f4d35e")  # yellow toad eyes
        r(11, 17, 10, 2, "#243322"); r(13, 18, 3, 2, "#b5e48c")  # dripping acid mouth
    elif key == "sand_worm":
        # Segmented desert burrowing sandworm rising from sand
        r(6, 25, 20, 5, "#b08968"); r(9, 23, 14, 3, "#cfa06e")  # sand mound
        r(11, 18, 11, 7, "#7f5539"); r(12, 19, 9, 5, "#9c6644")  # lower segment
        r(9, 12, 12, 7, "#7f5539"); r(10, 13, 10, 5, "#b07d56")  # mid segment
        r(6, 6, 12, 8, "#6c452d"); r(7, 7, 9, 6, "#3a1f16")  # gaping maw
        for tx, ty in [(7, 7), (10, 6), (13, 7), (7, 11), (10, 12), (13, 11)]:
            r(tx, ty, 2, 2, "#f4f1de")  # fang ring
    elif key == "wraith":
        # Floating radiant energy phantom
        r(10, 6, 12, 10, "#b8d4e8"); r(12, 4, 8, 4, "#e0f2fe")  # hood / halo
        r(12, 9, 2, 2, "#fff3c4"); r(18, 9, 2, 2, "#fff3c4")  # luminous eyes
        r(8, 15, 16, 8, "#7cc4fa"); r(10, 16, 12, 7, "#bae6fd")  # spectral cloak
        r(9, 23, 3, 5, "#7cc4fa"); r(14, 23, 4, 6, "#bae6fd"); r(20, 23, 3, 4, "#7cc4fa")  # wispy tails
        r(4, 13, 4, 3, "#fff3c4"); r(24, 13, 4, 3, "#fff3c4")  # floating light motes
    elif key == "biker":
        # Spiked-armor highway marauder with SMG
        r(11, 24, 4, 6, "#1f242d"); r(17, 24, 4, 6, "#1f242d")
        r(10, 12, 12, 12, "#2f3542"); r(12, 13, 8, 9, "#485161")  # leather jacket
        r(8, 11, 4, 3, "#d65a4f"); r(20, 11, 4, 3, "#d65a4f")  # spiked pauldrons
        r(12, 5, 8, 7, "#1f242d"); r(13, 7, 6, 2, "#f4a261")  # visor helmet
        r(14, 3, 4, 2, "#e63946")  # mohawk crest
        r(3, 15, 10, 3, "#6c757d"); r(2, 15, 2, 2, "#f4d35e")  # SMG
    return rects

def build():
    PNG_DIR.mkdir(parents=True, exist_ok=True)
    SVG_DIR.mkdir(parents=True, exist_ok=True)
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))

    for key, name, machine, atk_style, psi_race in NEW_ENEMIES:
        rects = draw_enemy_grid(key)
        # 1. Crisp 96x96 RGBA PNG (32x32 upscaled 3x)
        grid = [[(0, 0, 0, 0)] * 32 for _ in range(32)]
        for x, y, w, h, col in rects:
            rgba = hex_to_rgba(col)
            for yy in range(max(0, y), min(32, y + h)):
                for xx in range(max(0, x), min(32, x + w)):
                    grid[yy][xx] = rgba
        big = [[grid[y // 3][x // 3] for x in range(96)] for y in range(96)]
        write_rgba_png(PNG_DIR / f"{key}.png", 96, 96, big)

        # 2. Matching crisp SVG for road encounter previews
        svg_lines = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges">']
        for x, y, w, h, col in rects:
            svg_lines.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{col}"/>')
        svg_lines.append("</svg>")
        (SVG_DIR / f"{key}.svg").write_text("\n".join(svg_lines), encoding="utf-8")

        # 3. Register in manifest.json
        manifest["enemies"][key] = {
            "name": name,
            "image": f"enemies/{key}.svg",
            "machine": machine,
        }

    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Generated {len(NEW_ENEMIES)} new enemy PNGs (96x96 RGBA) + SVGs and updated manifest.json (total enemies: {len(manifest['enemies'])}).")

if __name__ == "__main__":
    build()
