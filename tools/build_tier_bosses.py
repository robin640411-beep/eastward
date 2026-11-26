#!/usr/bin/env python3
"""Generate 10 crisp 128x128 16-bit pixel-art PNG sprites for the 5 Mini-Bosses and 5 Mid-Bosses."""
import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "dist" / "assets" / "combat" / "bosses"
OUT_DIR.mkdir(parents=True, exist_ok=True)

def hx(c, a=255):
    c = c.lstrip("#")
    return (int(c[0:2], 16), int(c[2:4], 16), int(c[4:6], 16), a)

class Sprite:
    def __init__(self, grid=32, scale=4):
        self.g = grid
        self.s = scale
        self.w = grid * scale
        self.h = grid * scale
        self.buf = bytearray(self.w * self.h * 4)

    def px(self, x, y, col):
        x, y = int(x), int(y)
        if not (0 <= x < self.g and 0 <= y < self.g):
            return
        b = bytes(col)
        for dy in range(self.s):
            row_start = ((y * self.s + dy) * self.w + x * self.s) * 4
            for dx in range(self.s):
                i = row_start + dx * 4
                self.buf[i:i+4] = b

    def rect(self, x, y, w, h, col):
        for yy in range(int(y), int(y + h)):
            for xx in range(int(x), int(x + w)):
                self.px(xx, yy, col)

    def sym_rect(self, dx, y, w, h, col):
        # Symmetric around center x=16
        self.rect(16 - dx - w, y, w, h, col)
        self.rect(16 + dx, y, w, h, col)

    def save(self, name):
        def chunk(tag, data):
            crc = zlib.crc32(tag + data) & 0xFFFFFFFF
            return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", crc)
        raw = bytearray()
        stride = self.w * 4
        for y in range(self.h):
            raw.append(0)
            raw.extend(self.buf[y * stride:(y + 1) * stride])
        ihdr = struct.pack(">IIBBBBB", self.w, self.h, 8, 6, 0, 0, 0)
        png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", zlib.compress(bytes(raw), 9)) + chunk(b"IEND", b"")
        (OUT_DIR / f"{name}.png").write_bytes(png)

def build_mini_highway_baron():
    s = Sprite()
    # Heavy spiked raider warlord with double-barrel cannon
    s.rect(11, 5, 10, 7, hx("#54453d"))  # helmet
    s.rect(12, 7, 8, 3, hx("#241f1e"))   # visor
    s.rect(13, 8, 2, 1, hx("#ff6d3b"))   # glowing eye
    s.rect(17, 8, 2, 1, hx("#ff6d3b"))
    s.sym_rect(5, 3, 2, 3, hx("#c8c2b4"))  # helmet horns
    s.rect(8, 12, 16, 10, hx("#6b382e"))   # armor torso
    s.rect(10, 13, 12, 8, hx("#8f4b3b"))
    s.sym_rect(8, 11, 4, 5, hx("#4d4c4a")) # spiked pauldrons
    s.sym_rect(10, 9, 2, 2, hx("#d4ccc0"))
    s.rect(4, 15, 5, 8, hx("#5a544e"))     # heavy cannon arm
    s.rect(2, 17, 4, 3, hx("#2b2928"))
    s.rect(2, 18, 2, 1, hx("#f5b841"))
    s.rect(23, 15, 4, 8, hx("#5a544e"))
    s.sym_rect(2, 22, 4, 8, hx("#3d3834")) # heavy boots
    s.sym_rect(2, 28, 5, 2, hx("#242120"))
    s.save("mini_highway_baron")

def build_mini_spore_warden():
    s = Sprite()
    # Towering fungal warden with glowing cap & tentacles
    s.rect(6, 5, 20, 6, hx("#4e6e48"))
    s.rect(8, 3, 16, 3, hx("#6e995f"))
    s.rect(11, 2, 10, 2, hx("#8cc272"))
    for sx, sy in ((9, 6), (14, 4), (19, 6), (22, 8)):
        s.rect(sx, sy, 2, 2, hx("#d8f582"))
    s.rect(10, 11, 12, 11, hx("#3c4f3b"))
    s.rect(12, 13, 8, 7, hx("#56704e"))
    s.rect(13, 14, 2, 2, hx("#f2ff80"))
    s.rect(17, 14, 2, 2, hx("#f2ff80"))
    s.sym_rect(6, 12, 3, 11, hx("#4c6647"))
    s.sym_rect(8, 18, 2, 8, hx("#78a665"))
    s.sym_rect(2, 22, 4, 8, hx("#2e3d2d"))
    s.save("mini_spore_warden")

def build_mini_drone_matriarch():
    s = Sprite()
    # Floating alien mechanical hive-core with wings
    s.rect(9, 7, 14, 12, hx("#586875"))
    s.rect(11, 5, 10, 16, hx("#788b99"))
    s.rect(13, 10, 6, 6, hx("#1e2933"))
    s.rect(14, 11, 4, 4, hx("#52e3ff"))
    s.rect(15, 12, 2, 2, hx("#e0fbff"))
    s.sym_rect(7, 8, 5, 3, hx("#42505c"))
    s.sym_rect(10, 6, 4, 7, hx("#9eb0bd"))
    s.sym_rect(6, 19, 3, 5, hx("#36424d"))
    s.rect(14, 21, 4, 4, hx("#46c7e3"))
    s.save("mini_drone_matriarch")

def build_mini_sand_leviathan():
    s = Sprite()
    # Armored desert sandworm king rising from earth
    for i, (w, y) in enumerate([(10, 4), (14, 8), (16, 13), (18, 18), (22, 23)]):
        c1 = hx("#8f6c47") if i % 2 == 0 else hx("#735334")
        c2 = hx("#b89161") if i % 2 == 0 else hx("#99734a")
        s.rect(16 - w // 2, y, w, 5, c1)
        s.rect(16 - w // 2 + 2, y + 1, w - 4, 2, c2)
    s.rect(12, 5, 8, 4, hx("#2b1915"))  # maw
    for tx in (12, 14, 16, 18):
        s.px(tx, 5, hx("#f0e4cc"))
        s.px(tx, 8, hx("#f0e4cc"))
    s.rect(4, 27, 24, 3, hx("#a88659"))
    s.save("mini_sand_leviathan")

def build_mini_bounty_marshal():
    s = Sprite()
    # Cybernetic sniper marshal in wide-brim hat and duster coat
    s.rect(9, 5, 14, 2, hx("#2e3540"))  # hat brim
    s.rect(12, 2, 8, 3, hx("#3d4757"))
    s.rect(12, 7, 8, 5, hx("#9ba8b0"))  # cyber face
    s.rect(13, 8, 6, 2, hx("#182029"))
    s.rect(17, 8, 2, 2, hx("#ff4a4a"))  # targeting eye
    s.rect(10, 12, 12, 13, hx("#473d38")) # trench coat
    s.rect(13, 12, 6, 10, hx("#697987"))  # chest plate
    s.rect(3, 14, 22, 2, hx("#2c343d"))   # long rail-rifle
    s.rect(2, 13, 4, 1, hx("#63d7ff"))
    s.sym_rect(2, 24, 3, 6, hx("#262b30"))
    s.save("mini_bounty_marshal")

def build_mid_siege_walker():
    s = Sprite()
    # Six-legged alien siege mech with twin cannons
    s.rect(7, 7, 18, 11, hx("#4c5963"))
    s.rect(9, 5, 14, 13, hx("#6c7d8a"))
    s.rect(12, 9, 8, 5, hx("#1d262e"))
    s.rect(13, 10, 6, 3, hx("#ff683b"))
    s.sym_rect(9, 8, 4, 3, hx("#343e45"))  # twin shoulder cannons
    s.sym_rect(11, 6, 3, 2, hx("#f2aa4c"))
    s.sym_rect(4, 18, 3, 11, hx("#3b464f"))
    s.sym_rect(8, 16, 3, 13, hx("#53626e"))
    s.sym_rect(12, 18, 2, 10, hx("#2d363d"))
    s.save("mid_siege_walker")

def build_mid_blood_warlord():
    s = Sprite()
    # Towering highway warlord in welded crimson power-armor
    s.rect(11, 4, 10, 6, hx("#8c2b23"))
    s.rect(12, 6, 8, 2, hx("#1a1414"))
    s.rect(13, 6, 6, 2, hx("#ffcf4d"))
    s.rect(7, 10, 18, 12, hx("#78241d"))
    s.rect(10, 11, 12, 10, hx("#a8382c"))
    s.rect(13, 13, 6, 5, hx("#362f2d"))
    s.sym_rect(9, 9, 5, 6, hx("#4f4844"))
    s.sym_rect(11, 6, 2, 4, hx("#d6cfc2"))
    s.rect(2, 14, 6, 9, hx("#383432"))
    s.rect(24, 14, 6, 9, hx("#383432"))
    s.sym_rect(3, 22, 5, 8, hx("#40211d"))
    s.save("mid_blood_warlord")

def build_mid_crystal_archon():
    s = Sprite()
    # Levitating amethyst alien psi-archon
    s.rect(13, 3, 6, 8, hx("#b780ff"))
    s.rect(14, 5, 4, 4, hx("#5ef2ff"))
    s.rect(9, 11, 14, 12, hx("#563a82"))
    s.rect(11, 12, 10, 9, hx("#7c54b8"))
    s.rect(14, 14, 4, 5, hx("#8af7ff"))
    s.sym_rect(7, 8, 4, 9, hx("#9c68e0"))
    s.sym_rect(10, 5, 3, 6, hx("#6ae6ff"))
    s.rect(11, 23, 10, 4, hx("#432b69"))
    s.rect(13, 27, 6, 3, hx("#7c54b8"))
    s.save("mid_crystal_archon")

def build_mid_plague_behemoth():
    s = Sprite()
    # Hulking mutated bio-behemoth with acid sacs
    s.rect(6, 7, 20, 15, hx("#4c6142"))
    s.rect(8, 5, 16, 16, hx("#668255"))
    s.rect(11, 8, 10, 6, hx("#31402b"))
    s.rect(12, 9, 2, 2, hx("#d9ff4d"))
    s.rect(18, 9, 2, 2, hx("#d9ff4d"))
    s.rect(13, 12, 6, 2, hx("#1e261b"))
    for bx, by in ((8, 10), (21, 11), (10, 17), (19, 16)):
        s.rect(bx, by, 3, 3, hx("#a8e64c"))
    s.sym_rect(10, 11, 4, 11, hx("#4e6643"))
    s.sym_rect(3, 21, 5, 9, hx("#35452e"))
    s.save("mid_plague_behemoth")

def build_mid_orbital_inquisitor():
    s = Sprite()
    # Sleek silver-white alien orbital commander with energy halberd
    s.rect(12, 4, 8, 7, hx("#d4dee3"))
    s.rect(13, 6, 6, 2, hx("#273947"))
    s.rect(14, 6, 4, 2, hx("#5ce6ff"))
    s.rect(9, 11, 14, 12, hx("#9eb2bd"))
    s.rect(11, 12, 10, 10, hx("#dce6eb"))
    s.rect(14, 14, 4, 6, hx("#4ccce6"))
    s.sym_rect(7, 10, 4, 5, hx("#6f8491"))
    s.rect(25, 3, 2, 26, hx("#7a8d99"))  # energy halberd
    s.rect(23, 3, 6, 4, hx("#75f2ff"))
    s.sym_rect(2, 23, 4, 7, hx("#5a6c78"))
    s.save("mid_orbital_inquisitor")

def main():
    for fn in [
        build_mini_highway_baron,
        build_mini_spore_warden,
        build_mini_drone_matriarch,
        build_mini_sand_leviathan,
        build_mini_bounty_marshal,
        build_mid_siege_walker,
        build_mid_blood_warlord,
        build_mid_crystal_archon,
        build_mid_plague_behemoth,
        build_mid_orbital_inquisitor,
    ]:
        fn()
    print(f"Generated 10 crisp 128x128 pixel-art Boss sprites in {OUT_DIR}.")

if __name__ == "__main__":
    main()
