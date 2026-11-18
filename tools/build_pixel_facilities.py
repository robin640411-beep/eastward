"""Build the eight Eastward roadside facilities on an authored pixel grid.

Run with Python + Pillow. Output: 768 x 256 RGBA, four 192 x 128 cells per row.
Cell order follows art-direction/facilities-interiors-layout.json. Every object
ends at local y=121, with six fully transparent rows beneath it. No photographs,
resampling, antialiasing, gradients, random noise, or detached ground shadows.
Optional --preview PATH produces a nearest-neighbour inspection sheet.
"""
from pathlib import Path
import argparse
import json
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'dist/assets/scenes/pixel-facilities.png'
W, H = 192, 128
INK = '#111b2c'; DEEP = '#22313f'; SHADE = '#344653'
WALL = '#5c7178'; STEEL = '#839b9b'; SILVER = '#b3c2b5'
GLASS = '#274952'; GLINT = '#517e82'; PALE = '#90b3a7'
CREAM = '#d5c79f'; GOLD = '#b4915e'; LIGHT = '#e4be79'
RUST = '#78534d'; RED = '#ae6b5c'; DARK_RED = '#573f45'
GREEN = '#54786a'; MINT = '#8faf88'; DARK_GREEN = '#364f4c'
WOOD = '#857359'; EARTH = '#5b514b'; VIOLET = '#4a435d'
PURPLE = '#6b5a73'; AMBER = '#e4ac62'


class Pixels:
    def __init__(self):
        self.im = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        self.d = ImageDraw.Draw(self.im)

    def r(self, x, y, w, h, color):
        assert all(isinstance(v, int) for v in (x, y, w, h))
        if w > 0 and h > 0:
            self.d.rectangle((x, y, x+w-1, y+h-1), fill=color)

    def p(self, points, color):
        if isinstance(points, str):
            points = [tuple(map(int, p.split(','))) for p in points.split()]
        self.d.polygon(points, fill=color)

    def line(self, points, color, width=1):
        if isinstance(points, str):
            points = [tuple(map(int, p.split(','))) for p in points.split()]
        self.d.line(points, fill=color, width=width)

    def panel(self, x, y, w, h, color, light=STEEL):
        self.r(x, y, w, h, INK)
        self.r(x+2, y+2, w-4, h-4, color)
        self.r(x+2, y+2, w-4, 1, light)
        self.r(x+2, y+3, 1, h-5, light)

    def window(self, x, y, w, h, warm=False, bars=True):
        self.panel(x, y, w, h, EARTH if warm else GLASS, GOLD if warm else STEEL)
        self.r(x+3, y+3, w-6, 2, GOLD if warm else GLINT)
        self.p([(x+3, y+h-4), (x+3, y+h-7), (x+w-4, y+4),
                (x+w-4, y+7)], WOOD if warm else GLINT)
        if bars:
            self.r(x+w//2, y+2, 2, h-4, SHADE)
        self.r(x-1, y+h-1, w+2, 2, DEEP)
        self.r(x, y+h-1, w, 1, STEEL)

    def foundation(self, x, w, y=116):
        self.r(x, y, w, 6, INK)
        self.r(x+1, y, w-2, 2, STEEL)
        self.r(x+1, y+2, w-2, 3, SHADE)
        for xx in range(x+13, x+w-5, 28):
            self.r(xx, y+2, 1, 3, DEEP)

    def rivets(self, x, y, w, col=SILVER):
        for xx in (x, x+w-2):
            self.r(xx, y, 2, 2, INK)
            self.r(xx, y, 1, 1, col)

    def alien_plate(self, x, y, w=12, h=17):
        self.panel(x, y, w, h, VIOLET, PURPLE)
        cx = x+w//2
        self.p([(cx, y+4), (cx+3, y+7), (cx, y+11), (cx-3, y+7)], AMBER)
        self.r(cx, y+6, 1, 3, DEEP)
        self.r(x+3, y+h-4, w-6, 1, GOLD)


LETTERS = {
    'A': ('010','101','111','101','101'), 'C': ('111','100','100','100','111'),
    'D': ('110','101','101','101','110'),
    'E': ('111','100','110','100','111'), 'F': ('111','100','110','100','100'),
    'G': ('111','100','101','101','111'), 'I': ('111','010','010','010','111'),
    'L': ('100','100','100','100','111'), 'M': ('101','111','111','101','101'),
    'N': ('101','111','111','111','101'), 'O': ('111','101','101','101','111'),
    'P': ('110','101','110','100','100'), 'R': ('110','101','110','101','101'),
    'S': ('111','100','111','001','111'), 'T': ('111','010','010','010','010'),
    'U': ('101','101','101','101','111'),
}


def lettering(a, word, x, y, color=CREAM):
    for i, char in enumerate(word):
        for yy, row in enumerate(LETTERS[char]):
            for xx, dot in enumerate(row):
                if dot == '1':
                    a.r(x+i*4+xx, y+yy, 1, 1, color)


def cross(a, x, y, size=4, color=RED):
    a.r(x+size, y, size, size*3, color)
    a.r(x, y+size, size*3, size, color)


def shutter(a, x, y, w, h, color=WALL):
    a.panel(x, y, w, h, color)
    for yy in range(y+5, y+h-3, 5):
        a.r(x+3, yy, w-6, 1, SHADE)
        a.r(x+3, yy+1, w-6, 1, STEEL)
    a.r(x+4, y+h-5, w-8, 3, DEEP)
    a.r(x+w//2-4, y+h-8, 8, 2, SILVER)


def crate(a, x, y, w=21, h=18, color=WOOD):
    a.panel(x, y, w, h, color, GOLD)
    a.r(x+3, y+5, w-6, 1, EARTH)
    a.r(x+3, y+h-6, w-6, 1, EARTH)
    a.r(x+5, y+2, 2, h-4, EARTH)
    a.r(x+w-7, y+2, 2, h-4, EARTH)
    a.r(x+w//2-2, y+h//2-2, 4, 4, CREAM)


def gas():
    a = Pixels()
    # Rear shop, then a broad floating roof carried by its own two columns.
    a.p('101,63 173,63 181,71 181,117 101,117', INK)
    a.r(104,68,67,49,WALL); a.p('173,66 179,72 179,116 173,116',SHADE)
    a.r(105,69,65,2,STEEL); a.r(105,104,67,11,DARK_RED)
    a.r(105,103,67,2,RED)
    a.window(113,77,29,23,warm=True)
    a.panel(147,77,21,40,DEEP); a.r(150,80,15,20,GLASS)
    a.r(151,81,12,2,GLINT); a.r(160,104,3,2,GOLD)
    a.p('100,63 106,56 174,56 182,64 182,70 100,70',INK)
    a.p('104,62 108,58 173,58 179,63 179,66 104,66',SHADE)
    a.r(104,64,75,2,STEEL)
    a.foundation(11,171)
    for x in (24,93):
        a.r(x,54,5,62,INK); a.r(x+1,56,2,59,STEEL)
        a.r(x-2,112,10,5,DEEP); a.r(x-1,112,7,2,STEEL)
    a.p('8,44 18,34 111,34 124,44 124,58 8,58',INK)
    a.p('11,43 20,37 109,37 120,44 120,48 11,48',STEEL)
    a.r(11,47,110,4,CREAM); a.r(11,51,110,4,RED)
    a.r(13,55,106,2,DARK_RED); a.r(21,39,88,1,SILVER)
    a.r(63,32,35,14,INK); a.r(65,34,31,10,DARK_RED)
    lettering(a,'FUEL',73,37,LIGHT)
    for x in (41,74):
        a.p([(x,82),(x+3,78),(x+14,78),(x+17,82),(x+17,116),(x,116)],INK)
        a.r(x+2,83,13,31,RED); a.r(x+3,83,11,15,CREAM)
        a.r(x+4,85,9,7,DEEP); a.r(x+5,86,6,2,MINT)
        a.r(x+4,95,9,1,GOLD); a.r(x+3,101,10,10,DARK_RED)
        a.r(x+3,102,9,1,RED); a.r(x+2,114,13,2,STEEL)
        a.line([(x+17,86),(x+21,88),(x+21,105),(x+18,110),(x+16,107)],INK,2)
        a.r(x+16,87,3,8,SHADE); a.r(x+16,87,2,3,SILVER)
    a.r(13,82,8,34,INK); a.r(15,84,4,30,GOLD)
    a.r(14,95,6,3,DARK_RED); a.r(14,109,6,3,DARK_RED)
    a.alien_plate(174,83,8,16)
    return a


def garage():
    a = Pixels()
    a.p('12,59 19,52 170,52 180,59 180,118 12,118',INK)
    a.r(17,58,151,59,WALL); a.p('170,57 178,61 178,117 170,117',SHADE)
    a.r(18,61,149,2,STEEL)
    a.p('8,58 13,51 18,51 18,46 23,46 23,41 34,30 151,30 168,43 176,43 176,49 183,54 183,62 8,62',INK)
    a.p('14,55 36,33 150,33 175,55',SHADE)
    a.p('20,53 37,36 148,36 168,53',WALL)
    for x in range(38,149,17):
        a.line([(x,36),(x-14,53)],STEEL)
    a.r(13,56,167,4,RED); a.r(14,56,164,1,GOLD)
    a.r(18,60,156,3,DARK_RED)
    a.panel(24,67,72,50,DEEP)
    a.r(27,70,66,10,WALL)
    a.r(29,72,62,1,STEEL); a.r(29,76,62,1,STEEL)
    # A dark open bay with a lift and hanging chain makes it a workshop.
    a.r(29,81,61,35,INK)
    for x in (35,82):
        a.r(x,84,4,32,RUST); a.r(x,84,1,29,GOLD)
        a.r(x-3,109,12,3,RED)
    a.r(56,81,1,12,STEEL); a.line('56,92 56,96 59,99 63,96 63,94',GOLD,2)
    a.panel(106,69,37,47,RUST,GOLD); a.window(110,74,28,18,warm=True)
    a.r(132,102,3,2,LIGHT)
    a.panel(149,70,19,36,SHADE); a.r(153,76,2,17,STEEL)
    a.r(160,76,2,17,GOLD); a.r(151,75,6,3,STEEL)
    a.r(158,75,6,3,GOLD); a.r(151,96,13,2,WOOD)
    a.panel(64,38,63,14,DEEP); lettering(a,'REPAIR',84,42)
    # Wrench emblem is visible even when its lettering is too small to read.
    a.p('70,40 73,39 73,43 76,43 76,39 79,42 77,46 75,47 73,50 70,48 73,45',SILVER)
    a.foundation(10,173)
    for yy in (102,110):
        a.p([(151,yy+2),(155,yy),(170,yy),(174,yy+2),(174,yy+7),(170,yy+9),(155,yy+9),(151,yy+7)],INK)
        a.r(155,yy+2,15,2,WALL); a.r(153,yy+5,19,2,SHADE)
    a.r(19,83,2,24,RED); a.r(19,84,1,12,GOLD)
    return a


def motel():
    a = Pixels()
    a.r(12,35,159,83,INK); a.r(15,38,147,77,RUST)
    a.r(15,40,147,3,RED); a.p('163,38 173,45 173,117 163,117',DARK_RED)
    a.p('9,36 18,25 32,25 32,22 151,22 164,28 178,36 178,42 9,42',INK)
    a.p('14,35 22,28 35,28 35,25 150,25 170,35',GREEN)
    a.r(15,35,158,4,DARK_GREEN); a.r(16,35,155,1,MINT)
    a.r(21,28,121,1,STEEL)
    for y in (47,82):
        for x in (24,68,112):
            a.panel(x,y,18,29,DEEP); a.r(x+3,y+4,12,13,GLASS)
            a.r(x+4,y+4,10,2,GLINT); a.r(x+13,y+21,2,2,GOLD)
            a.window(x+22,y+3,15,18,warm=True,bars=False)
    a.r(15,76,147,6,INK); a.r(16,76,145,2,CREAM); a.r(17,79,144,2,EARTH)
    # Upper balcony and exterior staircase are part of the silhouette.
    a.r(19,67,138,2,STEEL); a.r(19,70,138,1,WALL)
    for x in range(20,159,10): a.r(x,67,2,10,STEEL)
    a.r(18,66,2,11,INK); a.r(157,66,2,11,INK)
    a.p('162,81 173,81 173,87 177,87 177,98 181,98 181,109 184,109 184,120 159,120 159,112 162,112',INK)
    for x,y in ((163,84),(166,94),(169,104),(172,114)):
        a.r(x,y,10,3,STEEL); a.r(x,y+3,2,min(7,119-y),SHADE)
    a.line('163,79 181,111',GOLD,2)
    a.foundation(11,174)
    a.r(31,111,117,5,EARTH); a.r(31,112,117,1,GOLD)
    # The old roadside sign is mounted directly to the left wall.
    a.r(9,46,14,53,INK); a.r(11,48,10,49,DARK_GREEN)
    for i,ch in enumerate('MOTEL'): lettering(a,ch,14,51+i*9,CREAM)
    a.r(18,16,7,10,INK); a.r(20,17,3,8,STEEL)
    return a


def clinic():
    a = Pixels()
    a.p('11,62 18,57 72,57 72,42 117,42 117,57 172,57 181,63 181,117 11,117',INK)
    a.r(15,64,157,52,SILVER); a.p('174,63 179,66 179,117 174,117',WALL)
    a.r(16,95,156,20,GREEN); a.r(16,94,156,2,MINT)
    a.r(17,66,155,2,CREAM)
    a.p('9,64 18,54 70,54 70,44 78,36 112,36 121,44 121,54 173,54 183,64 183,69 9,69',INK)
    a.p('15,62 22,57 73,57 73,46 80,39 110,39 118,46 118,57 170,57 177,62',WALL)
    a.r(13,63,167,3,STEEL); a.r(15,67,163,2,SHADE)
    a.panel(78,43,34,25,CREAM,SILVER); cross(a,89,47,4,RED)
    a.window(23,77,40,28,bars=True); a.window(128,77,39,28,bars=True)
    for x in (28,45,134,150):
        a.r(x,96,9,6,PALE); a.r(x+2,94,5,2,STEEL)
    a.panel(75,73,43,43,DEEP); a.r(78,76,37,37,GLASS)
    a.r(79,77,35,2,GLINT); a.r(95,76,2,37,STEEL)
    a.r(80,97,14,2,PALE); a.r(98,97,15,2,PALE)
    a.r(91,100,2,7,SILVER); a.r(99,100,2,7,SILVER)
    a.r(71,70,51,5,GREEN); a.r(72,70,49,1,MINT)
    a.foundation(10,173); a.r(70,116,53,2,CREAM)
    a.r(73,119,47,2,WALL)
    a.panel(145,42,19,12,SHADE); a.r(148,46,13,1,STEEL); a.r(148,49,13,1,STEEL)
    a.r(26,46,29,8,INK); a.r(28,47,25,5,GREEN)
    a.r(30,46,2,7,MINT); a.r(50,46,2,7,MINT)
    return a


def pharmacy():
    a = Pixels()
    a.p('13,50 172,50 180,60 180,117 13,117',INK)
    a.r(16,55,152,62,CREAM); a.p('170,54 178,61 178,117 170,117',WOOD)
    a.r(16,100,152,16,DARK_GREEN); a.r(17,99,150,2,MINT)
    a.p('9,51 17,43 169,43 182,53 182,60 9,60',INK)
    a.p('14,51 20,46 166,46 176,53 176,55 14,55',GREEN)
    a.r(13,55,166,3,DARK_GREEN); a.r(17,47,149,1,MINT)
    # Large green illuminated cross is the pharmacy's primary identifying shape.
    a.r(42,20,12,30,INK); a.r(33,29,30,12,INK)
    cross(a,36,23,8,GREEN); cross(a,38,25,6,MINT)
    a.r(44,26,2,17,CREAM); a.r(39,32,16,2,CREAM)
    a.panel(80,31,68,17,DARK_GREEN,MINT); lettering(a,'MEDICINE',98,37,CREAM)
    a.window(22,70,57,39,bars=True)
    a.r(26,90,49,2,STEEL)
    for x,y,col in ((29,81,CREAM),(41,78,MINT),(56,82,RED),(66,80,PALE),(29,99,MINT),(45,98,CREAM),(61,99,PALE)):
        a.r(x,y,5,8,col); a.r(x+1,y-2,3,2,STEEL); a.r(x+1,y+3,3,2,GLASS)
    a.panel(86,70,27,47,DARK_GREEN); a.r(90,74,19,24,GLASS)
    a.r(91,75,17,2,GLINT); a.r(104,103,3,2,GOLD)
    a.window(122,71,39,34,bars=False)
    # Bottle silhouette rather than generic stock symbols.
    a.r(136,76,10,5,MINT); a.r(133,81,16,18,MINT)
    a.r(135,87,12,7,CREAM); a.r(140,88,2,5,GREEN); a.r(138,90,6,2,GREEN)
    a.p('19,62 163,62 169,71 19,71',INK)
    for x in range(21,163,12):
        a.p([(x,63),(min(x+10,163),63),(min(x+14,167),69),(x,69)],MINT if (x//12)%2 else CREAM)
        a.r(x,70,min(10,163-x),4,GREEN if (x//12)%2 else GOLD)
    a.foundation(10,173); a.r(83,116,34,2,CREAM)
    a.alien_plate(169,83,9,17)
    return a


def warehouse():
    a = Pixels()
    a.p('13,55 171,55 181,65 181,117 13,117',INK)
    a.r(17,58,150,59,WALL); a.p('169,58 179,66 179,116 169,116',SHADE)
    for x in range(20,166,10):
        a.r(x,61,2,53,SHADE); a.r(x+2,61,1,53,STEEL)
    a.p('8,59 16,50 43,30 53,25 139,25 150,30 176,50 184,59 184,66 8,66',INK)
    a.p('13,58 46,33 55,29 137,29 146,33 177,58',SHADE)
    a.p('21,54 48,35 56,31 135,31 144,35 169,54',WALL)
    for x in range(53,137,14): a.line([(x,31),(x-11,54)],STEEL)
    a.r(12,59,169,4,STEEL); a.r(14,63,165,2,DEEP)
    a.r(30,68,6,47,DEEP); a.r(154,68,6,47,DEEP)
    shutter(a,51,68,92,49,SHADE)
    a.r(96,71,2,42,DEEP); a.r(65,102,10,2,SILVER); a.r(117,102,10,2,SILVER)
    a.panel(74,43,44,13,DEEP); a.r(80,48,31,2,GOLD)
    a.r(81,51,9,1,STEEL); a.r(94,51,17,1,STEEL)
    a.foundation(9,175)
    crate(a,15,98,29,19); crate(a,19,83,24,16,GREEN)
    crate(a,148,101,27,16); crate(a,151,89,21,13)
    # Three squat ridge vents break the long industrial roof silhouette.
    for x in (64,91,118):
        a.r(x,20,9,9,INK); a.r(x+2,21,5,7,STEEL)
        a.r(x-2,18,13,4,INK); a.r(x-1,18,11,1,SILVER)
    a.alien_plate(34,66,12,20)
    return a


def shop():
    a = Pixels()
    a.p('11,60 19,50 147,50 179,70 179,117 11,117',INK)
    a.r(15,58,128,59,RUST); a.p('146,57 177,73 177,117 146,117',DARK_RED)
    for yy in (68,82,96,110):
        a.r(16,yy,126,1,DARK_RED); a.r(17,yy+1,124,1,RED)
    a.p('8,60 17,49 35,39 142,39 151,45 177,62 183,66 183,73 8,67',INK)
    a.p('15,57 38,42 140,42 170,63 143,60',WALL)
    a.p('15,58 143,61 178,67 178,69 15,64',SHADE)
    a.r(17,62,125,2,STEEL)
    # Two salvaged solar panels, each made from large readable clusters.
    for x in (47,88):
        a.p([(x,38),(x+31,38),(x+37,48),(x-6,48)],INK)
        a.p([(x+1,40),(x+29,40),(x+33,46),(x-3,46)],GLASS)
        a.r(x+1,42,29,1,GLINT); a.r(x+12,40,2,7,STEEL)
    a.window(24,76,46,30,warm=True)
    a.panel(80,72,28,45,DEEP); a.r(84,76,20,18,GLASS)
    a.r(85,77,18,2,GLINT); a.r(99,101,3,2,GOLD)
    a.panel(113,75,24,30,DARK_RED,GOLD)
    for y in (79,89,98):
        a.r(117,y,16,3,WOOD); a.r(119,y-3,4,3,CREAM); a.r(126,y-3,5,3,GREEN)
    a.p('14,67 70,67 76,79 14,79',INK)
    for x in range(16,70,9):
        a.p([(x,69),(x+7,69),(x+10,77),(x,77)],CREAM if x%2 else RED)
        a.r(x,77,8,4,GOLD if x%2 else DARK_RED)
    a.r(18,80,2,35,GOLD); a.r(71,80,2,35,GOLD)
    a.foundation(10,174)
    crate(a,23,105,25,12); crate(a,49,107,19,10,GREEN)
    # A freestanding vending cabinet remains on the same concrete plinth.
    a.panel(146,78,30,39,GREEN,MINT); a.window(150,82,17,22,bars=False)
    for yy in (86,94):
        for xx,col in ((153,CREAM),(160,RED)):
            a.r(xx,yy,4,6,col); a.r(xx,yy,4,1,SILVER)
    a.r(169,85,3,8,GOLD); a.r(151,109,19,4,DEEP)
    a.panel(89,52,45,13,DARK_RED,GOLD); lettering(a,'STORE',102,56,CREAM)
    a.r(164,63,3,15,WOOD); a.r(160,61,11,4,INK); a.r(161,61,9,2,GOLD)
    return a


def checkpoint():
    a = Pixels()
    # Occupation architecture: two buttressed piers, a suspended scanner, and a
    # gate opening that remains transparent all the way down to its barrier.
    a.p('8,118 12,105 12,49 19,37 46,37 54,48 54,107 60,118 60,121 8,121',INK)
    a.p('12,117 17,104 17,51 22,42 43,42 49,51 49,107 54,117',VIOLET)
    a.p('19,53 24,46 31,46 31,107 26,116 18,116',PURPLE)
    a.r(17,112,34,4,SHADE); a.r(17,113,33,1,STEEL)
    a.panel(21,60,24,25,DEEP,PURPLE); a.r(24,63,18,12,GLASS)
    a.r(25,64,16,2,AMBER); a.r(34,65,2,10,VIOLET)
    a.r(25,79,14,2,GOLD)
    a.p('151,45 172,45 180,57 180,110 184,117 184,121 145,121 145,116 150,106',INK)
    a.p('155,50 169,50 175,59 175,111 179,116 151,116 155,106',VIOLET)
    a.p('155,51 161,51 161,109 156,115 152,115',PURPLE)
    a.r(149,117,32,3,SHADE); a.r(151,116,28,1,STEEL)
    # Wide angular bridge does not resemble a human shop roof.
    a.p('15,45 15,34 25,24 68,24 75,18 123,18 131,24 169,24 181,37 181,48 173,53 23,53',INK)
    a.p('20,40 29,29 70,29 78,23 120,23 128,29 166,29 176,40 171,46 25,46',VIOLET)
    a.p('24,38 31,31 71,31 79,25 118,25 126,31 165,31 170,37',PURPLE)
    a.p('25,41 171,41 168,47 27,47',DEEP)
    a.r(37,34,31,2,STEEL); a.r(130,34,29,2,STEEL)
    a.p('78,27 117,27 123,35 117,43 78,43 72,35',INK)
    a.p('80,30 115,30 119,35 115,39 80,39 76,35',GOLD)
    a.p('84,32 111,32 115,35 111,37 84,37 80,35',AMBER)
    a.r(96,31,4,9,DEEP); a.r(97,32,1,6,CREAM)
    a.r(92,49,11,8,INK); a.r(94,50,7,5,PURPLE)
    a.r(96,52,3,2,AMBER)
    # Barrier arm rests on both mechanisms, with a dark stepped hazard pattern.
    a.panel(47,92,12,27,DEEP,STEEL); a.r(50,95,6,8,GOLD)
    a.r(55,94,99,10,INK); a.r(58,96,94,6,CREAM)
    for x in range(60,149,14):
        a.p([(x,96),(x+5,96),(x+1,101),(x-4,101)],GOLD)
    a.r(57,103,97,2,SHADE)
    a.r(147,89,9,30,INK); a.r(149,91,4,25,PURPLE)
    a.r(150,92,2,4,AMBER)
    a.alien_plate(27,90,15,21)
    # Camera and sensor are bolted to the left parapet.
    a.r(32,14,3,13,INK); a.r(33,15,1,10,STEEL)
    a.p('27,12 38,12 41,15 41,20 27,20',INK)
    a.r(29,14,9,4,SHADE); a.r(38,14,2,4,AMBER)
    return a


BUILDERS = {name: globals()[name] for name in
            ('gas','garage','motel','clinic','pharmacy','warehouse','shop','checkpoint')}


def build():
    layout = json.loads((ROOT/'art-direction/facilities-interiors-layout.json').read_text())
    order = [cell[0] for cell in layout['facilities']['cells']]
    assert len(order) == 8 and set(order) == set(BUILDERS), order
    atlas = Image.new('RGBA', (W*4,H*2), (0,0,0,0))
    report = []
    for i, name in enumerate(order):
        im = BUILDERS[name]().im
        alpha = im.getchannel('A')
        assert {value for _,value in alpha.getcolors()} == {0,255}, f'{name}: non-binary alpha'
        bbox = alpha.getbbox()
        assert bbox[3] == 122, f'{name}: ground ends at {bbox[3]-1}, expected 121'
        assert alpha.crop((0,122,W,H)).getbbox() is None, f'{name}: lower margin is not clear'
        assert 169 <= bbox[2]-bbox[0] <= 181, f'{name}: width {bbox}'
        atlas.paste(im, ((i%4)*W,(i//4)*H))
        report.append({'name': name,'bounds': bbox,'ground':121,
                       'colors':len(im.getcolors(W*H))-1})
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(OUTPUT, optimize=True)
    return atlas, report


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--preview', type=Path)
    args = parser.parse_args()
    atlas, report = build()
    if args.preview:
        preview = Image.new('RGBA',atlas.size,'#30444d')
        preview.alpha_composite(atlas)
        preview = preview.convert('RGB').resize((W*8,H*4),Image.Resampling.NEAREST)
        args.preview.parent.mkdir(parents=True,exist_ok=True)
        preview.save(args.preview)
    print(json.dumps({'output':str(OUTPUT),'size':atlas.size,'cells':report},indent=2))
