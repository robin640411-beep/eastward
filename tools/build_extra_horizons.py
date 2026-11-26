#!/usr/bin/env python3
"""Generate 8 new 16-bit pixel-art biome horizons (256x76 each in a 1024x152 RGBA sheet)
and register them in dist/assets/manifest.json."""
import json
import math
import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT_PNG = ROOT / "dist" / "assets" / "scenes" / "pixel-horizons-ext.png"
MANIFEST = ROOT / "dist" / "assets" / "manifest.json"

CELL_W, CELL_H = 256, 76
COLS, ROWS = 4, 2
W, H = CELL_W * COLS, CELL_H * ROWS

def hex_rgba(h, a=255):
    h = h.lstrip("#")
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)

class Canvas:
    def __init__(self, w, h):
        self.w = w
        self.h = h
        self.buf = bytearray(w * h * 4)

    def px(self, x, y, c):
        x, y = int(x), int(y)
        if 0 <= x < self.w and 0 <= y < self.h:
            i = (y * self.w + x) * 4
            self.buf[i:i+4] = bytes(c)

    def rect(self, x, y, w, h, c):
        x0, y0 = max(0, int(x)), max(0, int(y))
        x1, y1 = min(self.w, int(x + w)), min(self.h, int(y + h))
        if x1 <= x0 or y1 <= y0:
            return
        row = bytes(c) * (x1 - x0)
        for yy in range(y0, y1):
            i = (yy * self.w + x0) * 4
            self.buf[i:i + len(row)] = row

    def fill_profile(self, y_fn, c, hi=None, hi_h=2):
        for x in range(self.w):
            top = max(0, min(self.h, int(round(y_fn(x)))))
            for y in range(top, self.h):
                self.px(x, y, hi if (hi and y < top + hi_h) else c)

    def line(self, x0, y0, x1, y1, c):
        dx, dy = abs(x1 - x0), abs(y1 - y0)
        sx = 1 if x0 < x1 else -1
        sy = 1 if y0 < y1 else -1
        err = dx - dy
        while True:
            self.px(x0, y0, c)
            if x0 == x1 and y0 == y1:
                break
            e2 = 2 * err
            if e2 > -dy:
                err -= dy
                x0 += sx
            if e2 < dx:
                err += dx
                y0 += sy

    def blit(self, dst, ox, oy):
        for y in range(self.h):
            si = y * self.w * 4
            di = ((oy + y) * dst.w + ox) * 4
            dst.buf[di:di + self.w * 4] = self.buf[si:si + self.w * 4]

def write_png(path, w, h, buf):
    def chunk(tag, data):
        crc = zlib.crc32(tag + data) & 0xFFFFFFFF
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", crc)
    raw = bytearray()
    stride = w * 4
    for y in range(h):
        raw.append(0)
        raw.extend(buf[y * stride:(y + 1) * stride])
    ihdr = struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0)
    png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", zlib.compress(bytes(raw), 9)) + chunk(b"IEND", b"")
    path.write_bytes(png)

def draw_wasteland():
    c = Canvas(CELL_W, CELL_H)
    # Far mesas
    c.fill_profile(lambda x: 42 - 8 * (1 if (x % 96) < 42 else 0) + math.sin(x * 0.05) * 3, hex_rgba("#8a7d6b"), hex_rgba("#a89a84"), 2)
    # Mid dry ridge
    c.fill_profile(lambda x: 52 + math.sin(x * 0.035 + 1.2) * 4 + math.cos(x * 0.11) * 2, hex_rgba("#6e6150"), hex_rgba("#857763"), 2)
    # Tilted power pylons & radar dish
    for px in (38, 134, 214):
        c.line(px, 24, px - 5, 58, hex_rgba("#46423a"))
        c.line(px, 24, px + 6, 58, hex_rgba("#46423a"))
        c.rect(px - 7, 30, 14, 2, hex_rgba("#46423a"))
        c.rect(px - 5, 38, 10, 2, hex_rgba("#46423a"))
    # Ground flat + scrub
    c.fill_profile(lambda x: 63 + math.sin(x * 0.07) * 1.5, hex_rgba("#52483b"), hex_rgba("#665a49"), 1)
    for sx in range(12, 250, 23):
        c.rect(sx, 60, 4, 3, hex_rgba("#4a4f38"))
        c.rect(sx + 1, 59, 2, 2, hex_rgba("#5d6346"))
    return c

def draw_volcano():
    c = Canvas(CELL_W, CELL_H)
    # Jagged volcanic peaks
    def peak(x):
        v = 48 - 22 * math.exp(-((x - 74) / 36) ** 2) - 18 * math.exp(-((x - 192) / 30) ** 2)
        return v + math.sin(x * 0.12) * 2
    c.fill_profile(peak, hex_rgba("#4b4447"), hex_rgba("#6b5c5d"), 2)
    # Smoke plumes from craters
    for cx in (74, 192):
        for i in range(6):
            c.rect(cx - 4 + i * 3, 22 - i * 2, 8 + i * 2, 3, hex_rgba("#5a575b", 160))
    # Mid basalt shelf
    c.fill_profile(lambda x: 52 + math.sin(x * 0.06) * 4, hex_rgba("#383236"), hex_rgba("#4f4649"), 2)
    # Glowing lava veins
    for lx in (42, 118, 168, 226):
        c.line(lx, 54, lx + 12, 65, hex_rgba("#d95b2b"))
        c.line(lx + 1, 54, lx + 13, 65, hex_rgba("#f59c42"))
    c.fill_profile(lambda x: 65 + math.cos(x * 0.09) * 1.5, hex_rgba("#2a2528"), hex_rgba("#40373a"), 1)
    return c

def draw_glacier():
    c = Canvas(CELL_W, CELL_H)
    # Far jagged icebergs
    def berg(x):
        return 40 - 15 * abs(math.sin(x * 0.028 + 0.5)) - (6 if 110 < x < 145 else 0)
    c.fill_profile(berg, hex_rgba("#8fb6c9"), hex_rgba("#d8edf5"), 3)
    # Mid glacier shelf
    c.fill_profile(lambda x: 51 + math.sin(x * 0.05) * 3, hex_rgba("#6a95ad"), hex_rgba("#b5d9e8"), 2)
    # Abandoned polar dome
    c.rect(170, 44, 24, 10, hex_rgba("#cbd9df"))
    c.rect(173, 41, 18, 4, hex_rgba("#e4f0f4"))
    c.rect(177, 47, 5, 4, hex_rgba("#355061"))
    c.rect(185, 47, 5, 4, hex_rgba("#355061"))
    # Frozen flat foreground
    c.fill_profile(lambda x: 63 + math.sin(x * 0.04) * 1.2, hex_rgba("#4d758c"), hex_rgba("#8bb8cc"), 2)
    return c

def draw_suburb():
    c = Canvas(CELL_W, CELL_H)
    # Distant treeline
    c.fill_profile(lambda x: 47 + math.sin(x * 0.14) * 3 + math.cos(x * 0.05) * 2, hex_rgba("#526658"), hex_rgba("#6e826e"), 2)
    # Water tower
    c.rect(198, 20, 22, 14, hex_rgba("#76878a"))
    c.rect(200, 17, 18, 3, hex_rgba("#99a9a6"))
    for lx in (200, 208, 217):
        c.rect(lx, 34, 2, 24, hex_rgba("#4c585c"))
    # Pitched-roof suburban houses
    for i, hx in enumerate((14, 52, 92, 134, 224)):
        hw, hh = 26, 15 + (i % 2) * 3
        hy = 62 - hh
        c.rect(hx, hy, hw, hh, hex_rgba("#6d7774"))
        for r in range(7):
            c.rect(hx - 2 + r * 2, hy - r, hw + 4 - r * 4, 1, hex_rgba("#524a46"))
        c.rect(hx + 5, hy + 4, 5, 5, hex_rgba("#27353d"))
        c.rect(hx + 15, hy + 4, 5, 5, hex_rgba("#27353d"))
    c.fill_profile(lambda x: 63 + math.sin(x * 0.08), hex_rgba("#48574b"), hex_rgba("#62735f"), 2)
    return c

def draw_quarry():
    c = Canvas(CELL_W, CELL_H)
    # Stepped open-pit quarry terraces
    def terrace(x):
        step = int((math.sin(x * 0.025) + 1) * 3)
        return 34 + step * 5
    c.fill_profile(terrace, hex_rgba("#8c6b56"), hex_rgba("#b59074"), 2)
    c.fill_profile(lambda x: 50 + (int(x // 28) % 3) * 3, hex_rgba("#6b5040"), hex_rgba("#8e6c56"), 2)
    # Giant quarry crane & ore conveyor
    c.rect(80, 28, 8, 28, hex_rgba("#4c4640"))
    c.line(84, 28, 128, 16, hex_rgba("#a87b47"))
    c.line(128, 16, 128, 38, hex_rgba("#383430"))
    c.line(150, 54, 224, 34, hex_rgba("#524d47"))
    c.rect(214, 32, 20, 26, hex_rgba("#5d5650"))
    c.fill_profile(lambda x: 64 + math.sin(x * 0.09) * 1.5, hex_rgba("#4a382e"), hex_rgba("#695042"), 2)
    return c

def draw_prairie():
    c = Canvas(CELL_W, CELL_H)
    # Gentle rolling golden hills
    c.fill_profile(lambda x: 46 + math.sin(x * 0.026) * 6, hex_rgba("#9c9562"), hex_rgba("#c4bc80"), 2)
    c.fill_profile(lambda x: 54 + math.cos(x * 0.032 + 1.1) * 5, hex_rgba("#7a7a48"), hex_rgba("#9e9c5f"), 2)
    # Wind turbines (broken blades)
    for tx, ty in ((56, 20), (146, 24), (218, 18)):
        c.rect(tx, ty, 2, 36, hex_rgba("#cfd4c6"))
        c.line(tx, ty, tx - 10, ty - 7, hex_rgba("#e2e6d8"))
        c.line(tx, ty, tx + 11, ty + 4, hex_rgba("#e2e6d8"))
        if tx != 146:
            c.line(tx, ty, tx - 2, ty + 11, hex_rgba("#c7ccbe"))
    # Old wooden barn
    c.rect(100, 48, 20, 13, hex_rgba("#78483c"))
    c.rect(103, 44, 14, 4, hex_rgba("#5c372f"))
    c.fill_profile(lambda x: 64 + math.sin(x * 0.06) * 1.5, hex_rgba("#585e36"), hex_rgba("#798047"), 2)
    return c

def draw_harbor():
    c = Canvas(CELL_W, CELL_H)
    # Distant sea line & breakwater
    c.fill_profile(lambda x: 56, hex_rgba("#466978"), hex_rgba("#6b93a3"), 2)
    # Listing cargo ship hull
    c.rect(128, 43, 56, 13, hex_rgba("#3b4a52"))
    c.rect(132, 38, 16, 5, hex_rgba("#7d4840"))
    c.rect(152, 36, 18, 7, hex_rgba("#4e6d78"))
    c.rect(172, 32, 10, 11, hex_rgba("#a8b2ad"))
    # Giant red container cranes
    for cx in (28, 74):
        c.rect(cx, 18, 3, 44, hex_rgba("#9e4a3d"))
        c.rect(cx + 14, 18, 3, 44, hex_rgba("#9e4a3d"))
        c.rect(cx - 10, 22, 42, 3, hex_rgba("#bd5b4a"))
        c.line(cx, 18, cx + 30, 22, hex_rgba("#7d382e"))
    # Striped lighthouse
    c.rect(222, 26, 8, 36, hex_rgba("#d8d9ce"))
    c.rect(222, 34, 8, 5, hex_rgba("#a6443a"))
    c.rect(222, 46, 8, 5, hex_rgba("#a6443a"))
    c.rect(221, 22, 10, 4, hex_rgba("#f0d484"))
    c.fill_profile(lambda x: 64, hex_rgba("#485457"), hex_rgba("#6b7878"), 2)
    return c

def draw_crystal():
    c = Canvas(CELL_W, CELL_H)
    # Dark jagged alien mesa
    c.fill_profile(lambda x: 49 + math.sin(x * 0.045) * 5, hex_rgba("#3f3c54"), hex_rgba("#5c5678"), 2)
    # Faceted crystal spires
    spires = [(34, 18, 12, "#8c5ec4", "#c59cf2"), (78, 26, 10, "#4ea8bd", "#9be8f5"),
              (124, 14, 14, "#7f52b8", "#c299f5"), (174, 22, 11, "#4aa4b8", "#94e3f2"),
              (220, 16, 13, "#8a5bc2", "#cfa8fa")]
    for sx, top, w, dark, hi in spires:
        for y in range(top, 64):
            t = min(1.0, (y - top) / 14.0)
            half = max(1, int(w * 0.5 * t))
            c.rect(sx - half, y, half, 1, hex_rgba(hi))
            c.rect(sx, y, half, 1, hex_rgba(dark))
    c.fill_profile(lambda x: 64 + math.cos(x * 0.08) * 1.5, hex_rgba("#2d2a3d"), hex_rgba("#524c6e"), 2)
    return c

NEW_BIOMES = [
    ("wasteland", draw_wasteland),
    ("volcano", draw_volcano),
    ("glacier", draw_glacier),
    ("suburb", draw_suburb),
    ("quarry", draw_quarry),
    ("prairie", draw_prairie),
    ("harbor", draw_harbor),
    ("crystal", draw_crystal),
]

def main():
    sheet = Canvas(W, H)
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    for idx, (bid, fn) in enumerate(NEW_BIOMES):
        col, row = idx % COLS, idx // COLS
        ox, oy = col * CELL_W, row * CELL_H
        cell = fn()
        cell.blit(sheet, ox, oy)
        manifest["worlds"][bid] = {
            "image": "scenes/pixel-horizons-ext.png",
            "rect": [ox, oy, CELL_W, CELL_H],
            "size": [W, H],
        }
    write_png(OUT_PNG, W, H, sheet.buf)
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Generated {OUT_PNG} ({W}x{H}) and updated manifest.json with {len(manifest['worlds'])} total biomes.")

if __name__ == "__main__":
    main()
