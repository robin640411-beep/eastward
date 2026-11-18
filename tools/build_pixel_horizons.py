"""Hand-authored 256 x 76 pixel horizons for Eastward.

All shapes are drawn once on the native grid. No source artwork, filters,
antialiasing, gradients, partial alpha, photo sampling or external art is used.
The shared palette borrows the character art's cool edges and warm highlights;
distant objects use lighter, closer values than foreground character outlines.

Output: one RGBA atlas, 4 columns x 3 rows in route-catalog BIOMES order.
Optional --preview PATH writes an enlarged review sheet on a flat sky colour.
"""
from pathlib import Path
import argparse
import json
import re
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'dist/assets/scenes/pixel-horizons.png'
W, H = 256, 76
P = {
    'ink': '#30364e', 'deep': '#3c4b5d', 'slate': '#586779',
    'far': '#7c9296', 'pale': '#b8c6b9', 'light': '#d9dbcc',
    'pine': '#43584d', 'green': '#6b8262', 'leaf': '#a4a978',
    'sage': '#82958a', 'stone': '#64778a', 'tin': '#a3b0b4',
    'abyss': '#315e68', 'teal': '#5d9590', 'foam': '#9bc6ab',
    'umber': '#604444', 'earth': '#96695c', 'clay': '#bf9281',
    'sand': '#b59e7b', 'cream': '#d8c199', 'warm': '#c3ad89',
    'plum': '#4c4b64', 'violet': '#796e87', 'lilac': '#a79cae',
    'gold': '#d8ae76', 'signal': '#f4bd70',
}


class Scene:
    def __init__(self):
        self.im = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        self.d = ImageDraw.Draw(self.im)

    def r(self, x, y, w, h, col):
        if w > 0 and h > 0:
            self.d.rectangle((x, y, x + w - 1, y + h - 1), fill=P[col])

    def p(self, points, col):
        self.d.polygon(points, fill=P[col])

    def line(self, points, col, width=1):
        self.d.line(points, fill=P[col], width=width)

    def land(self, ridge, col):
        self.p(ridge + [(W - 1, H - 1), (0, H - 1)], col)

    def glint(self, x, y, col='gold'):
        self.r(x, y, 2, 1, col)


def mountain(s, x, base, width, height, face='far', shade='stone', snow=False):
    peak = x + width * 2 // 5
    s.p([(x, base), (x+width//5, base-height//3), (peak-3, base-height+5),
         (peak, base-height), (peak+4, base-height+5), (x+width*3//4, base-height//3),
         (x+width, base)], face)
    s.p([(peak, base-height), (peak+4, base-height+5), (x+width, base),
         (peak+width//5, base), (peak+2, base-height//2)], shade)
    if snow:
        s.p([(peak-3, base-height+5), (peak, base-height), (peak+4, base-height+5),
             (peak+width//7, base-height+height//3), (peak+4, base-height+height//4),
             (peak, base-height+height//3), (peak-4, base-height+height//4),
             (peak-width//8, base-height+height//2)], 'light')
        # Split snow tongues expose angular rock instead of a flat white triangle.
        s.line([(peak+4,base-height+height//4),(peak+8,base-height+height//2),
                (peak+14,base-height//3)],'pale')
        s.p([(peak-10,base-height+height//2),(peak-7,base-height+height//3),
             (peak-5,base-height+height//2+2),(peak-12,base-height//3)],face)


def hut(s, x, base, w, h, wall='sand', roof='earth', ruined=False):
    top = base-h
    s.r(x+1, top+4, w-2, h-4, 'deep')
    s.r(x+2, top+5, w-5, h-6, wall)
    s.r(x+w-7, top+6, 4, h-7, 'umber' if wall == 'clay' else 'slate')
    s.p([(x-3, top+5), (x+w//2-1, top-1), (x+w+2, top+5)], 'ink')
    s.p([(x-1, top+3), (x+w//2-1, top), (x+w-1, top+3)], roof)
    s.r(x+2, top+4, w-3, 1, 'warm')
    s.r(x+3, top+2, max(2,w//4), 1, 'clay' if roof in ('earth','umber') else 'tin')
    s.r(x+2, top+7, 2, max(1,h-11), 'warm')
    s.r(x+w-10, base-3, 4, 1, 'stone')
    s.r(x+5, base-6, 4, 5, 'deep')
    if w > 18:
        s.r(x+w-13, base-8, 4, 3, 'deep')
        s.glint(x+w-12, base-7)
    if ruined:
        s.p([(x+w-7, top+1), (x+w-3, top+1), (x+w-5, top+5), (x+w-10, top+4)], 'deep')
        s.r(x+3, base-3, 5, 2, 'slate')


def pine(s, x, base, h, col='green', light='sage'):
    s.r(x, base-h+4, 2, h-3, 'deep')
    s.p([(x, base-h), (x-3, base-h+8), (x-1, base-h+8),
         (x-6, base-7), (x-3, base-7), (x-8, base-2), (x+7, base-2),
         (x+3, base-7), (x+5, base-7), (x+2, base-h+8), (x+3, base-h+8)], col)
    s.line([(x, base-h+2), (x-2, base-h+7), (x-1, base-h+7)], light)
    s.line([(x-3, base-10), (x-5, base-7), (x-1, base-7)], light)


def broadleaf(s, x, base, w=24, h=30, col='green', lit='sage'):
    top = base-h
    s.p([(x+w//2-2, base), (x+w//2-1, top+12), (x+w//2+2, top+10),
         (x+w//2+1, base)], 'deep')
    s.line([(x+w//2, top+18), (x+w//4, top+11)], 'deep')
    s.p([(x, top+12), (x+2, top+7), (x+6, top+7), (x+7, top+3),
         (x+13, top+3), (x+15, top), (x+w-6, top+2), (x+w-5, top+6),
         (x+w-1, top+7), (x+w, top+14), (x+w-5, top+18),
         (x+w//2, top+17), (x+4, top+18)], col)
    s.p([(x+2, top+9), (x+6, top+9), (x+8, top+5), (x+14, top+5),
         (x+15, top+3), (x+w-7, top+4), (x+w-9, top+8),
         (x+14, top+9), (x+11, top+12), (x+4, top+12)], lit)
    s.p([(x+w-8,top+11),(x+w-5,top+10),(x+w-3,top+12),
         (x+w-5,top+14),(x+w-9,top+14)],lit)
    s.r(x+6,top+15,3,1,lit)
    s.line([(x+w//2,base-3),(x+w//2-4,base)],'deep')


def reeds(s, x, base, col='green'):
    s.line([(x-3, base), (x-5, base-5), (x-7, base-7)], col)
    s.line([(x, base), (x-1, base-10)], col)
    s.line([(x+2, base), (x+4, base-7), (x+6, base-8)], col)
    s.r(x-2, base-10, 2, 3, 'sand')


def surveillance(s, x, base, h=30, scale=1):
    # Segmented, asymmetrical occupation mast. Every support reaches its base.
    s.p([(x-5*scale, base), (x-3*scale, base-h+6*scale), (x, base-h),
         (x+3*scale, base-h+5*scale), (x+5*scale, base)], 'plum')
    s.line([(x-2*scale, base-3), (x-1, base-h+7)], 'violet', scale)
    s.r(x-7*scale, base-h+8*scale, 15*scale, 6*scale, 'deep')
    s.r(x-6*scale, base-h+8*scale, 13*scale, scale, 'tin')
    s.r(x-2*scale, base-h+11*scale, 5*scale, scale, 'gold')
    s.r(x, base-9*scale, scale, 5*scale, 'teal')


def pipes(s, points, col='slate'):
    s.line(points, 'deep', 3)
    s.line([(x, y-1) for x, y in points], col)


def salt():
    s = Scene()
    mountain(s, -28, 49, 124, 18, 'pale', 'far')
    mountain(s, 60, 48, 115, 15, 'pale', 'far')
    mountain(s, 168, 50, 112, 23, 'far', 'stone')
    s.land([(0,49),(37,47),(79,49),(126,47),(171,49),(218,47),(255,49)], 'warm')
    # Long shallow evaporation basins: broad planes rather than noise.
    s.p([(0,53),(83,51),(104,54),(42,58),(0,58)], 'light')
    s.p([(48,59),(121,54),(184,54),(165,59),(111,63)], 'pale')
    s.p([(0,65),(49,59),(89,63),(126,65),(116,68),(0,70)], 'cream')
    s.p([(169,60),(216,54),(255,55),(255,64),(211,66)], 'light')
    s.line([(0,58),(42,58),(104,54)], 'far')
    s.line([(52,60),(112,64),(166,60)], 'tin')
    # Salt extraction rig with two prongs and a low conveyor.
    s.r(173,39,29,13,'deep');s.r(175,40,25,10,'stone')
    s.p([(177,40),(178,22),(182,17),(184,18),(182,29),(181,40)], 'plum')
    s.p([(191,39),(194,27),(197,20),(201,17),(200,24),(197,38)], 'plum')
    s.line([(179,38),(180,25),(182,21)],'lilac')
    s.line([(194,37),(196,29),(199,23)],'violet')
    s.r(181,36,15,4,'ink');s.r(183,37,11,1,'gold')
    for x in (176,184,195,201):s.r(x,49,2,8,'slate')
    pipes(s,[(31,48),(76,48),(76,45),(174,45)],'tin')
    for x in (41,65,101,125,150):s.r(x,49,1,6,'stone')
    s.r(32,45,5,4,'stone');s.r(33,45,3,1,'pale')
    s.p([(133,58),(142,51),(150,51),(158,58)],'light')
    s.p([(211,62),(226,53),(233,54),(241,61)],'pale')
    s.land([(0,69),(30,67),(66,69),(110,66),(154,69),(207,66),(255,68)],'slate')
    for x,y,w in [(8,66,12),(54,64,7),(94,66,10),(186,63,10),(228,65,13)]:s.r(x,y,w,1,'pale')
    s.line([(22,54),(30,55),(35,54)],'sand');s.line([(74,57),(82,56),(89,57)],'far')
    s.line([(108,59),(116,58),(120,59)],'tin');s.r(230,59,7,1,'warm')
    s.r(176,42,3,4,'tin');s.r(183,44,8,1,'slate');s.r(197,42,2,5,'plum')
    return s


def canyon():
    s=Scene()
    s.land([(0,32),(16,29),(19,24),(54,24),(59,30),(81,31),(94,36),(116,35),
            (128,30),(156,31),(165,24),(191,24),(197,30),(224,28),(231,24),(255,24)],'clay')
    s.p([(0,23),(18,22),(22,16),(48,16),(52,23),(51,42),(67,48),(77,63),(0,69)],'earth')
    s.p([(0,23),(18,23),(22,18),(46,18),(46,22),(23,25),(16,30),(0,31)],'sand')
    s.p([(20,30),(30,27),(35,29),(32,48),(49,57),(49,69),(9,68)],'umber')
    s.p([(215,25),(226,18),(255,18),(255,76),(196,69),(202,53),(215,48)],'earth')
    s.p([(216,26),(227,20),(255,20),(255,26),(232,26),(226,31)],'clay')
    s.p([(236,32),(247,30),(255,30),(255,69),(229,66)],'umber')
    s.p([(73,76),(80,58),(103,54),(122,49),(142,50),(164,58),(180,76)],'stone')
    # A narrow suspended causeway between cliff faces, with supported pylons.
    s.r(43,39,181,4,'deep');s.r(45,38,177,1,'warm')
    s.r(48,43,170,1,'earth');s.r(57,40,154,1,'slate')
    for x in (58,84,111,139,166,195,214):s.r(x,34,1,5,'slate')
    s.line([(58,34),(104,36),(155,36),(195,34),(214,34)],'slate')
    s.p([(173,55),(174,29),(181,21),(192,17),(187,22),(182,29),(183,55)],'plum')
    s.line([(176,51),(177,31),(182,25)],'violet')
    s.r(175,36,8,5,'deep');s.r(177,37,4,1,'gold')
    s.r(72,43,3,14,'umber');s.r(199,43,3,13,'umber')
    for x,y,w in [(3,37,11),(41,29,6),(6,51,12),(29,55,9),(221,37,10),(241,51,15),(205,57,11)]:s.r(x,y,w,1,'clay')
    s.p([(1,41),(9,40),(15,42),(11,44),(0,44)],'clay')
    s.p([(35,39),(44,37),(49,39),(46,42),(38,42)],'clay')
    s.line([(42,44),(39,48),(43,51)],'umber');s.line([(14,30),(12,36),(14,39)],'earth')
    s.p([(219,44),(230,42),(235,43),(230,46),(217,47)],'clay')
    s.line([(247,28),(243,34),(245,39),(242,44)],'earth')
    s.r(25,20,8,1,'cream');s.r(234,22,12,1,'sand')
    s.land([(0,65),(27,63),(57,67),(88,65),(113,68),(155,66),(187,65),(223,62),(255,65)],'umber')
    s.line([(0,65),(27,63),(57,67),(88,65),(113,68)],'earth')
    return s


def forest():
    s=Scene()
    s.land([(0,42),(24,38),(48,41),(85,36),(118,39),(154,34),(195,37),(228,34),(255,39)],'far')
    for x,h in [(3,30),(29,35),(63,27),(91,32),(125,27),(158,30),(193,31),(224,29),(249,34)]:
        pine(s,x,53,h,'sage','pale')
    s.land([(0,51),(38,48),(79,52),(124,49),(171,50),(215,47),(255,50)],'green')
    broadleaf(s,-11,62,38,42,'pine','green')
    broadleaf(s,27,61,31,37,'pine','green')
    broadleaf(s,215,61,40,40,'pine','green')
    broadleaf(s,244,62,30,36,'pine','green')
    # Broken limbs frame a small abandoned roadside dwelling.
    s.line([(72,60),(72,42),(69,33),(70,20)],'slate',2)
    s.line([(71,35),(63,30),(60,24)],'slate')
    s.line([(72,43),(81,36),(84,29)],'slate')
    s.line([(70,26),(77,22),(80,17)],'slate')
    hut(s,132,58,31,19,'sage','umber',True)
    s.r(155,34,3,9,'slate');s.r(154,34,5,2,'tin')
    s.p([(126,56),(132,51),(140,52),(143,58),(132,61)],'pine')
    surveillance(s,188,58,31)
    s.line([(187,46),(177,50),(165,49)],'slate')
    s.land([(0,62),(22,59),(47,63),(72,60),(101,63),(127,61),(154,63),(185,60),(214,64),(241,61),(255,62)],'pine')
    for x,y in [(18,59),(48,61),(94,59),(111,63),(170,59),(204,62),(238,60)]:
        s.p([(x-4,y+2),(x-2,y),(x+2,y),(x+5,y+3),(x+1,y+4)],'green')
        s.r(x-1,y,3,1,'sage')
    s.line([(88,67),(106,64),(124,66),(137,66)],'green')
    s.r(98,64,3,1,'teal');s.r(205,60,2,1,'teal')
    return s


def city():
    s=Scene()
    s.land([(0,52),(23,50),(62,51),(99,49),(135,50),(171,48),(218,51),(255,49)],'far')
    for x,w,h in [(5,13,16),(22,18,23),(44,11,18),(60,15,25),(80,9,19),(94,22,28),(119,13,17),(136,17,23),(157,10,20),(173,17,26),(196,14,17),(216,19,24),(239,14,20)]:
        s.r(x,50-h,w,h,'far');s.r(x,50-h,w,1,'tin');s.r(x+w-3,51-h,3,h-1,'stone')
    # Irregular rooflines and broad faces leave the tower silhouette readable.
    for x,w,h in [(9,23,29),(38,20,24),(66,29,33),(105,21,28),(135,26,22),(209,25,31),(242,17,24)]:
        top=59-h;s.r(x,top,w,h,'slate');s.r(x+2,top+1,w-6,h-2,'stone');s.r(x+w-5,top+1,4,h-1,'deep')
        s.r(x+2,top+1,w-6,1,'tin')
        for xx in range(x+4,x+w-6,6):
            for yy in range(top+5,55,7):s.r(xx,yy,2,3,'deep')
    s.r(74,22,4,6,'stone');s.line([(76,22),(76,17)],'stone')
    s.p([(42,35),(46,35),(46,40),(50,40),(50,37),(56,37),(56,42),(42,42)],'deep')
    s.r(20,45,2,2,'gold');s.r(114,40,2,2,'warm');s.r(220,47,2,2,'gold')
    s.r(13,29,6,2,'tin');s.r(69,33,11,1,'tin');s.r(111,35,8,1,'tin')
    s.line([(91,38),(87,42),(89,46),(85,50)],'deep')
    s.r(39,45,9,3,'deep');s.r(40,45,5,1,'stone')
    s.r(211,28,13,1,'tin');s.r(213,29,1,7,'tin')
    s.line([(250,40),(246,43),(248,46)],'deep')
    # An alien surveillance crown has supplanted the old civic clock tower.
    s.p([(173,62),(177,34),(181,21),(184,17),(188,22),(190,37),(196,62)],'plum')
    s.p([(179,53),(181,30),(184,23),(185,44),(188,58)],'violet')
    s.p([(165,32),(174,28),(194,28),(202,32),(198,37),(171,37)],'deep')
    s.r(173,29,20,1,'tin');s.r(178,33,13,2,'gold');s.r(181,33,5,1,'signal')
    s.r(183,44,2,10,'teal');s.line([(166,61),(170,46),(176,40)],'plum',2)
    s.line([(204,61),(199,45),(192,40)],'plum',2)
    s.r(0,60,256,4,'deep');s.r(0,59,256,1,'stone')
    for x in (5,31,58,87,120,149,213,242):s.r(x,61,11,1,'tin')
    s.land([(0,67),(22,65),(48,67),(77,64),(118,66),(148,65),(181,67),(222,65),(255,67)],'deep')
    s.r(51,64,11,2,'slate');s.r(112,64,7,2,'slate');s.r(239,63,5,3,'slate')
    return s


def coast():
    s=Scene()
    s.land([(0,43),(24,40),(42,41),(57,38),(72,39),(85,43),(136,45),(183,43),(228,40),(255,42)],'far')
    s.r(0,47,256,29,'teal')
    # A wrecked cargo ship is the low, broad anchor of this open-water composition.
    s.p([(38,49),(96,49),(107,46),(118,46),(112,55),(103,59),(57,58),(43,55)],'deep')
    s.p([(42,50),(98,50),(111,48),(108,53),(100,55),(54,54)],'earth')
    s.r(54,42,19,7,'stone');s.r(55,41,16,1,'tin');s.r(57,44,4,2,'deep');s.r(64,44,4,2,'deep')
    s.r(78,43,19,5,'umber');s.r(79,43,17,1,'warm')
    s.r(48,51,31,1,'clay');s.r(87,52,16,1,'umber')
    for xx in (55,69,83,98):s.r(xx,53,1,2,'umber')
    s.line([(79,44),(79,29),(94,36)],'slate')
    s.line([(80,31),(88,31),(88,42)],'slate')
    s.r(59,34,2,8,'slate');s.r(57,34,6,1,'tin')
    # Occupation platform on four unmistakably water-rooted legs.
    for x in (178,187,206,214):s.r(x,39,2,15,'slate')
    s.r(174,35,46,5,'deep');s.r(175,34,44,1,'tin')
    s.r(184,27,28,7,'slate');s.r(186,28,23,2,'stone')
    s.p([(185,27),(189,19),(191,18),(191,24),(207,24),(211,17),(214,15),(213,24),(211,28)],'plum')
    s.r(191,29,14,2,'gold');s.r(196,23,2,3,'teal')
    s.line([(163,35),(163,27),(180,27)],'slate');s.line([(179,27),(179,33)],'slate')
    for x,y,w in [(3,50,18),(127,51,28),(221,50,14),(22,55,17),(120,57,30),(168,55,13),(193,58,22),(6,61,21),(66,62,26),(133,63,14),(220,63,25)]:s.r(x,y,w,1,'foam')
    s.r(177,54,3,4,'abyss');s.r(207,55,4,3,'abyss');s.r(184,60,22,1,'sage')
    s.land([(0,64),(12,61),(28,63),(36,66),(66,67),(82,66),(118,69),(155,67),(188,68),(223,64),(238,62),(255,63)],'slate')
    s.p([(4,63),(12,57),(24,58),(29,63)],'stone');s.line([(5,62),(12,58),(20,58)],'tin')
    s.p([(229,64),(235,58),(245,57),(252,61),(255,65)],'stone');s.r(237,58,6,1,'pale')
    return s


def industrial():
    s=Scene()
    s.land([(0,45),(21,42),(49,45),(84,41),(112,44),(144,40),(176,43),(216,41),(255,45)],'far')
    for x,y,w,h in [(18,33,20,19),(46,35,26,16),(113,29,24,24),(231,32,18,23)]:
        s.r(x,y,w,h,'stone');s.r(x,y,w,1,'tin')
    # Stack clusters have staggered heights, without painted smoke in the sky.
    for x,top,w in [(53,22,7),(78,29,6),(102,18,8)]:
        s.r(x,top,w,33,'deep');s.r(x+1,top+1,w-3,32,'earth');s.r(x+1,top+4,w-3,2,'warm');s.r(x+1,top+14,w-3,2,'clay');s.r(x-1,top,w+2,2,'slate')
        s.r(x+1,top+3,1,25,'clay')
    s.p([(22,45),(34,37),(34,43),(51,35),(51,43),(69,37),(69,44),(86,36),(86,60),(22,60)],'deep')
    s.p([(24,46),(34,40),(34,45),(51,39),(51,45),(69,40),(69,46),(84,40),(84,59),(24,59)],'slate')
    s.r(27,50,54,3,'stone')
    for x in (30,43,58,73):s.r(x,52,6,6,'deep');s.r(x+1,52,4,1,'gold')
    s.r(111,47,34,13,'earth');s.r(113,45,30,2,'warm');s.r(115,51,26,7,'umber')
    # A segmented processing wheel drives the captured factory conveyor.
    s.p([(171,33),(176,25),(185,22),(194,26),(199,34),(198,44),(191,51),(180,50),(173,44)],'plum')
    s.p([(176,34),(180,28),(185,26),(192,29),(195,35),(194,41),(189,46),(182,45),(177,40)],'violet')
    s.p([(181,33),(186,30),(190,34),(190,40),(185,43),(181,39)],'deep')
    s.r(183,34,5,5,'gold');s.r(184,34,3,1,'signal')
    for xx,yy in [(181,26),(193,31),(195,41),(184,47),(174,38)]:s.r(xx,yy,2,1,'tin')
    s.r(177,49,4,12,'plum');s.r(191,48,4,13,'plum')
    pipes(s,[(84,54),(107,54),(107,44),(161,44),(161,39),(173,39)],'tin')
    pipes(s,[(197,43),(218,43),(218,54),(255,54)],'stone')
    for x in (91,124,152,221,244):s.r(x,55,2,8,'slate')
    for xx,yy in [(115,44),(144,44),(208,43),(233,54)]:s.r(xx,yy-2,2,4,'slate');s.r(xx,yy-2,2,1,'tin')
    s.r(212,37,28,4,'deep');s.r(214,36,24,1,'tin');s.r(235,38,2,15,'deep')
    s.land([(0,63),(37,62),(74,65),(105,62),(142,64),(178,62),(206,64),(240,62),(255,63)],'deep')
    for x,y,w in [(11,61,15),(93,63,8),(152,62,16),(222,62,13)]:s.r(x,y,w,1,'stone')
    return s


def marsh():
    s=Scene()
    s.land([(0,44),(19,41),(43,43),(62,40),(91,43),(124,41),(158,44),(195,41),(228,43),(255,41)],'sage')
    for x in (9,27,92,211,244):pine(s,x,51,18,'far','tin')
    s.r(0,50,256,26,'teal')
    s.p([(0,52),(30,48),(57,50),(68,54),(49,56),(17,55),(0,57)],'green')
    # A stilt house and a sagging jetty still stand above the flooded plain.
    hut(s,40,51,26,15,'sage','umber',True)
    for x in (43,51,61):s.r(x,51,2,7,'slate')
    s.line([(43,54),(62,52),(79,54)],'slate',2);s.r(75,54,1,6,'slate')
    # Three unequal biological vessels, each connected to its footings.
    for x,top,w in [(116,30,22),(147,24,28),(184,34,19)]:
        bottom=51
        s.p([(x+4,top),(x+w-5,top),(x+w-1,top+5),(x+w,top+13),(x+w-3,bottom-3),(x+3,bottom-3),(x,bottom-10),(x,top+6)],'slate')
        s.p([(x+5,top+2),(x+w-6,top+2),(x+w-3,top+6),(x+w-3,bottom-6),(x+4,bottom-6),(x+3,top+7)],'sage')
        s.p([(x+6,top+4),(x+10,top+3),(x+9,top+10),(x+5,top+12)],'foam')
        s.p([(x+w//2-3,bottom-7),(x+w//2-5,top+12),(x+w//2,top+9),(x+w//2+5,top+14),(x+w//2+3,bottom-7)],'pine')
        s.r(x-1,bottom-5,w+2,3,'plum');s.r(x+2,bottom-5,w-4,1,'violet')
        s.r(x+3,bottom-2,2,7,'deep');s.r(x+w-5,bottom-2,2,7,'deep');s.glint(x+w//2,bottom-3)
    pipes(s,[(105,52),(105,45),(114,45)],'stone');pipes(s,[(173,48),(181,48),(181,52)],'stone')
    s.r(158,37,2,1,'gold');s.r(155,42,3,1,'green');s.r(192,42,2,1,'teal')
    s.line([(122,48),(120,42),(123,39)],'abyss');s.line([(168,48),(169,41)],'stone')
    for x,y,w in [(3,59,19),(43,60,12),(82,55,20),(104,61,13),(145,59,22),(188,61,12),(212,54,29),(229,62,13)]:s.r(x,y,w,1,'foam')
    for x,y,w in [(116,56,18),(151,57,14),(183,57,20)]:s.r(x,y,w,2,'abyss')
    s.land([(0,65),(27,62),(55,66),(81,63),(118,67),(151,65),(183,67),(212,63),(255,65)],'pine')
    for x,y in [(8,64),(29,65),(71,65),(98,67),(213,65),(243,65)]:reeds(s,x,y)
    return s


def desert():
    s=Scene()
    s.land([(0,44),(24,38),(50,35),(78,38),(112,42),(145,36),(178,32),(205,36),(236,34),(255,38)],'sand')
    s.p([(0,44),(24,39),(50,36),(79,40),(65,43),(27,43)],'cream')
    s.p([(117,42),(151,36),(178,33),(203,37),(187,39),(151,40)],'cream')
    # Half-buried occupation monolith, split into three quiet planes.
    s.p([(156,59),(163,30),(175,16),(185,19),(193,40),(189,60)],'plum')
    s.p([(160,54),(167,31),(175,20),(177,39),(171,55)],'violet')
    s.p([(177,21),(182,23),(187,40),(184,55),(177,47)],'slate')
    s.line([(171,44),(174,32),(176,29)],'lilac')
    s.line([(182,32),(180,39),(183,45),(180,51)],'plum')
    s.r(165,46,2,4,'lilac');s.r(171,29,1,3,'lilac')
    s.r(174,43,7,3,'deep');s.r(175,44,5,1,'gold')
    s.p([(190,58),(198,39),(205,34),(208,38),(205,56)],'plum')
    s.line([(198,53),(202,42),(205,38)],'violet')
    # Broken aqueduct: its missing span gives the terrain a human scale.
    s.r(17,43,38,4,'earth');s.r(17,43,38,1,'warm')
    s.r(19,47,5,12,'earth');s.r(46,47,5,11,'earth')
    s.r(62,45,31,4,'earth');s.r(64,45,27,1,'warm');s.r(85,49,5,10,'earth')
    s.r(52,44,3,2,'clay');s.r(62,44,3,2,'clay')
    s.land([(0,58),(29,53),(57,52),(83,56),(108,57),(144,50),(170,49),(196,54),(222,51),(255,54)],'sand')
    s.p([(0,58),(29,54),(55,53),(79,56),(59,57),(31,57),(0,63)],'cream')
    s.p([(106,58),(145,51),(169,50),(195,55),(174,55),(147,55),(123,60)],'cream')
    s.line([(21,54),(35,52),(49,52)],'warm');s.line([(208,53),(220,52),(230,53)],'cream')
    s.land([(0,68),(36,64),(71,66),(111,62),(149,65),(186,61),(222,64),(255,62)],'earth')
    s.line([(0,68),(36,64),(71,66),(111,62),(149,65)],'clay')
    for x,y,w in [(13,61,8),(42,59,12),(94,61,8),(145,59,7),(213,58,12),(235,61,9)]:s.r(x,y,w,1,'clay')
    s.p([(226,60),(229,56),(235,57),(239,61)],'earth');s.r(230,56,4,1,'warm')
    return s


def farmland():
    s=Scene()
    s.land([(0,42),(28,37),(62,39),(89,34),(123,35),(147,39),(173,35),(206,36),(229,33),(255,38)],'sage')
    s.land([(0,48),(42,45),(85,47),(123,43),(166,46),(212,43),(255,46)],'green')
    # Barn, cylindrical silo and a slow old wind-pump.
    hut(s,65,56,35,23,'clay','umber')
    s.r(76,47,10,9,'umber');s.line([(77,48),(85,54)],'warm');s.line([(85,48),(77,54)],'warm')
    s.p([(108,55),(108,32),(111,28),(119,28),(122,32),(122,55)],'slate')
    s.r(109,33,11,21,'tin');s.r(117,33,3,21,'stone');s.r(110,29,9,2,'pale')
    for y in (37,44,51):s.r(109,y,11,1,'slate')
    s.r(36,30,2,23,'slate');s.line([(31,53),(37,35),(43,53)],'slate')
    s.line([(30,31),(44,31)],'stone');s.line([(37,24),(37,38)],'stone')
    s.line([(32,26),(42,36)],'tin');s.line([(32,36),(42,26)],'tin')
    # A harvesting gantry looms over the former fields.
    s.r(177,35,56,5,'plum');s.r(180,35,49,1,'lilac');s.r(184,39,3,13,'plum');s.r(226,39,3,15,'plum')
    s.p([(192,35),(196,29),(214,29),(219,35)],'violet');s.r(199,31,13,1,'gold')
    for x in (195,207,218):s.line([(x,41),(x,48),(x-3,51),(x+2,51)],'slate')
    # Bands and furrows turn in perspective instead of becoming wallpaper stripes.
    s.p([(0,53),(57,50),(142,52),(95,57),(0,59)],'sand')
    s.p([(94,57),(142,52),(255,51),(255,57),(175,58)],'leaf')
    s.p([(0,60),(96,58),(177,59),(141,64),(0,66)],'earth')
    s.p([(147,64),(181,59),(255,59),(255,66)],'sand')
    for pts in [[(12,55),(50,52)],[(32,57),(81,53)],[(119,57),(155,54)],[(183,56),(220,53)],[(26,63),(91,60)],[(178,64),(223,61)]]:s.line(pts,'warm')
    for xx,yy in [(11,57),(21,56),(36,55),(116,56),(127,55),(181,55),(193,54),(211,53)]:s.r(xx,yy-1,1,2,'earth');s.r(xx+1,yy-2,2,1,'warm')
    s.line([(0,64),(67,59),(142,56),(169,54)],'slate')
    for x,y in [(7,63),(36,61),(69,59),(103,58),(136,56)]:s.r(x,y-4,1,5,'slate')
    s.land([(0,68),(34,67),(71,69),(108,67),(144,69),(183,67),(223,69),(255,67)],'pine')
    return s


def snow():
    s=Scene()
    mountain(s,-20,52,115,35,'pale','far',True)
    mountain(s,57,51,115,29,'tin','stone',True)
    mountain(s,145,52,126,38,'pale','far',True)
    mountain(s,205,53,82,24,'tin','stone',True)
    s.land([(0,55),(26,49),(55,53),(82,48),(113,52),(143,49),(173,54),(203,49),(235,53),(255,50)],'pale')
    s.p([(0,56),(27,51),(55,55),(78,52),(65,57),(24,58)],'light')
    s.p([(171,56),(203,51),(232,55),(255,52),(255,58),(212,59)],'light')
    # A low observatory dome and a thin alien relay: two different silhouettes.
    s.r(126,46,31,12,'stone');s.r(128,47,27,9,'tin');s.r(146,48,7,8,'slate')
    s.p([(129,45),(129,41),(132,37),(136,35),(147,35),(152,38),(155,42),(155,45)],'slate')
    s.p([(130,43),(133,38),(137,36),(144,36),(141,39),(140,43)],'light')
    s.r(140,37,1,8,'stone');s.r(128,45,30,2,'pale');s.r(133,51,4,2,'gold')
    surveillance(s,183,56,35)
    s.line([(179,29),(173,25),(173,20)],'slate');s.line([(187,29),(193,25),(193,20)],'slate')
    s.r(173,20,3,1,'tin');s.r(191,20,3,1,'tin')
    for x,b,h in [(8,61,17),(26,59,21),(49,61,14),(219,59,18),(239,61,24)]:pine(s,x,b,h,'stone','light')
    s.land([(0,64),(29,61),(59,65),(96,61),(130,63),(165,61),(200,65),(232,61),(255,64)],'light')
    s.p([(0,69),(41,65),(79,67),(113,65),(150,69),(187,66),(223,69),(255,65),(255,75),(0,75)],'stone')
    s.line([(4,65),(29,62),(54,66)],'pale');s.line([(91,65),(113,63),(135,65)],'pale')
    s.r(65,62,13,1,'tin');s.r(157,60,10,1,'tin');s.r(200,65,12,1,'tin')
    return s


def mushroom(s, x, base, w, h, far=False):
    top=base-h;edge='stone' if far else 'plum';stem='far' if far else 'violet';cap='sage' if far else 'teal'
    s.p([(x+w//2-3,base),(x+w//2-2,top+9),(x+w//2+3,top+8),(x+w//2+4,base)],stem)
    s.line([(x+w//2-1,base-3),(x+w//2,top+11)],'tin' if far else 'lilac')
    s.p([(x,top+10),(x+2,top+5),(x+w//4,top+2),(x+w//2,top),(x+w*3//4,top+1),
         (x+w-3,top+5),(x+w,top+10),(x+w-2,top+13),(x+3,top+13)],edge)
    s.p([(x+2,top+8),(x+w//4,top+3),(x+w//2,top+2),(x+w*3//4,top+3),(x+w-3,top+8),(x+w-7,top+9),(x+6,top+9)],cap)
    s.line([(x+w//4,top+4),(x+w//2,top+3),(x+w//2+6,top+4)],'pale' if far else 'foam')
    if not far:
        for xx in range(x+5,x+w-4,5):s.r(xx,top+11,1,3,'teal')
        s.r(x+w//3,top+5,3,1,'foam');s.r(x+w*2//3,top+6,2,1,'foam')
        s.r(x+w//2+2,base-8,2,3,'plum')


def alien():
    s=Scene()
    s.land([(0,48),(31,43),(62,46),(94,42),(128,45),(166,40),(195,44),(229,42),(255,46)],'far')
    mushroom(s,3,54,38,29,True);mushroom(s,70,53,31,25,True);mushroom(s,137,54,33,33,True);mushroom(s,219,54,39,27,True)
    s.land([(0,58),(34,53),(69,56),(103,51),(139,57),(178,54),(215,56),(255,52)],'violet')
    # A broken human water tower is entangled in the colony's new growth.
    s.r(52,41,21,10,'slate');s.r(54,40,17,2,'tin')
    s.r(56,51,2,12,'slate');s.r(69,51,2,12,'slate');s.line([(56,53),(70,62)],'stone')
    mushroom(s,29,63,41,43);mushroom(s,103,62,44,30);mushroom(s,228,64,31,31)
    # Faceted crystal outcrop: asymmetric shards, no antialiased glass glow.
    s.p([(173,62),(168,41),(175,32),(182,39),(182,25),(189,19),(195,29),(194,40),(202,33),(208,36),(207,51),(200,63)],'plum')
    s.p([(176,58),(171,42),(175,35),(178,40),(180,58)],'violet')
    s.p([(183,57),(184,28),(189,22),(189,49)],'lilac')
    s.p([(190,50),(190,23),(193,30),(192,57)],'stone')
    s.p([(194,58),(198,40),(203,36),(204,48),(200,58)],'teal')
    s.line([(185,29),(188,25)],'pale');s.line([(199,41),(202,38)],'foam')
    s.line([(187,39),(185,45),(187,49)],'violet')
    s.p([(166,62),(164,54),(168,50),(172,56),(173,63)],'violet')
    s.line([(165,54),(168,52),(169,57)],'lilac')
    s.land([(0,65),(25,62),(55,65),(86,61),(119,65),(155,62),(186,65),(220,61),(255,65)],'plum')
    s.line([(1,66),(19,63),(33,65),(49,64),(61,67)],'violet',2)
    s.line([(76,64),(92,61),(101,64),(116,66),(129,64)],'violet',2)
    s.line([(152,65),(169,62),(183,65),(206,64),(218,62)],'violet',2)
    for x,y in [(15,64),(44,63),(84,62),(122,65),(159,63),(214,62),(245,64)]:
        s.r(x,y,3,2,'teal');s.r(x,y,1,1,'foam')
    return s


def oasis():
    s=Scene()
    s.land([(0,44),(24,37),(51,34),(75,37),(104,43),(133,38),(158,32),(188,35),(214,31),(239,35),(255,40)],'sage')
    s.p([(0,44),(27,38),(51,36),(71,39),(57,40),(27,42)],'leaf')
    s.p([(115,43),(143,36),(158,34),(186,37),(167,38),(141,40)],'leaf')
    s.land([(0,55),(31,47),(55,47),(80,51),(110,48),(135,52),(164,47),(196,50),(228,47),(255,50)],'green')
    # This is inhabited countryside, not the final paradise: a relay remains.
    surveillance(s,215,49,25)
    s.r(223,44,12,5,'stone');s.r(225,45,7,1,'tin')
    broadleaf(s,8,59,26,30,'green','leaf');broadleaf(s,54,58,20,24,'pine','green')
    hut(s,113,55,24,17,'sand','earth');hut(s,143,54,20,13,'pale','umber')
    s.r(130,35,2,6,'slate');s.r(146,49,3,2,'gold')
    # A stream widens toward the viewer, crossing under a small stone bridge.
    s.p([(176,47),(182,47),(170,53),(164,56),(164,60),(149,65),(119,75),(99,75),(140,62),(151,58),(157,53)],'teal')
    s.line([(179,48),(165,55),(159,59),(146,64),(119,73)],'foam')
    s.p([(147,57),(152,53),(172,53),(178,57),(178,59),(172,58),(169,56),(155,56),(152,59),(147,59)],'slate')
    s.line([(148,56),(153,53),(171,53),(177,56)],'tin')
    s.r(150,57,2,4,'slate');s.r(174,57,2,4,'slate')
    broadleaf(s,233,61,29,34,'pine','green')
    s.land([(0,66),(26,62),(48,64),(76,62),(105,66),(100,69),(92,75),(0,75)],'pine')
    s.p([(175,65),(197,61),(221,63),(255,61),(255,75),(152,75)],'pine')
    for x,y,w in [(16,61,9),(43,59,10),(80,60,9),(189,59,9),(222,60,8)]:s.r(x,y,w,1,'leaf')
    for x,y in [(29,63),(36,62),(88,63),(193,63),(218,64)]:s.r(x,y,2,1,'warm')
    return s


BUILDERS = {name: globals()[name] for name in ('salt','canyon','forest','city','coast','industrial','marsh','desert','farmland','snow','alien','oasis')}


def main():
    parser=argparse.ArgumentParser();parser.add_argument('--preview',type=Path);args=parser.parse_args()
    source=(ROOT/'dist/route-catalog.js').read_text()
    biomes=json.loads(re.search(r'export const BIOMES=(\[.*?\]);',source).group(1))
    names=[b['id'] for b in biomes]
    assert set(names)==set(BUILDERS) and len(names)==12
    atlas=Image.new('RGBA',(W*4,H*3),(0,0,0,0));scenes=[]
    for i,name in enumerate(names):
        scene=BUILDERS[name]().im
        assert set(scene.getchannel('A').tobytes()) == {0,255}, name+' has soft alpha'
        # Road occludes y >= 68. Everything below is a real solid terrain layer.
        assert scene.getchannel('A').crop((0,68,W,H)).getextrema()==(255,255), name+' has ground holes'
        assert scene.getchannel('A').crop((0,0,W,10)).getextrema()==(0,0), name+' invades the sky margin'
        atlas.paste(scene,((i%4)*W,(i//4)*H));scenes.append(scene)
    OUT.parent.mkdir(parents=True,exist_ok=True);atlas.save(OUT,optimize=True)
    if args.preview:
        preview=Image.new('RGB',(W*4*3,(H+12)*3*3),'#a7b8bb');d=ImageDraw.Draw(preview)
        for i,(name,scene) in enumerate(zip(names,scenes)):
            x=(i%4)*W*3;y=(i//4)*(H+12)*3
            preview.paste(scene.resize((W*3,H*3),Image.Resampling.NEAREST),(x,y),scene.getchannel('A').resize((W*3,H*3),Image.Resampling.NEAREST))
            d.text((x+8,y+H*3+6),name,fill='#30364e')
        args.preview.parent.mkdir(parents=True,exist_ok=True);preview.save(args.preview)
    colors={color[:3] for count,color in atlas.getcolors(maxcolors=256) if color[3]}
    print(json.dumps({'image':str(OUT),'size':atlas.size,'cell':[W,H],'columns':4,'rows':3,'order':names,'opaque_colors':len(colors),'alpha':[0,255],'bytes':OUT.stat().st_size}))


if __name__=='__main__':main()
