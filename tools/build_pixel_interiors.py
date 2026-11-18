"""Author the eight Eastward interiors directly on a 256 x 160 pixel grid.

No external art, photographs, antialiasing, resampling, noise or AI atlas is used.
The only output asset is a 1024 x 320 PNG (4 columns, 2 rows), in this order:
warehouse, clinic, garage, shop, hotel, laboratory, ruin, nest.

Run with Python + Pillow. Optional --preview /absolute/path.png writes an
integer-scaled inspection sheet outside the game asset pipeline.
"""
from pathlib import Path
import argparse
from PIL import Image, ImageDraw

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'dist/assets/scenes/pixel-interiors.png'
ORDER=('warehouse','clinic','garage','shop','hotel','laboratory','ruin','nest')
W,H=256,160
INK='#1b2733';DEEP='#24323d';EDGE='#485761';STEEL='#697c7e'
GOLD='#b59c6c';GOLD_DARK='#73694f';MINT='#789e8b';VIOLET='#645870'

class Pixels:
 def __init__(self,color):
  self.im=Image.new('RGB',(W,H),color);self.d=ImageDraw.Draw(self.im)
 def r(self,x,y,w,h,c):
  assert all(isinstance(n,int) for n in (x,y,w,h))
  if w>0 and h>0:self.d.rectangle((x,y,x+w-1,y+h-1),fill=c)
 def p(self,points,c):
  if isinstance(points,str):points=[tuple(map(int,p.split(','))) for p in points.split()]
  self.d.polygon(points,fill=c)
 def line(self,points,c,w=1):
  if isinstance(points,str):points=[tuple(map(int,p.split(','))) for p in points.split()]
  self.d.line(points,fill=c,width=w)
 def panel(self,x,y,w,h,c,lit=EDGE):
  self.r(x,y,w,h,INK);self.r(x+2,y+2,w-4,h-4,c)
  self.r(x+2,y+2,w-4,1,lit);self.r(x+w-3,y+4,1,h-6,DEEP)
 def box(self,x,y,w,h,c='#776c58',lit='#8c8168'):
  self.p([(x,y+4),(x+5,y),(x+w-4,y),(x+w,y+4),(x+w,y+h),(x,y+h)],INK)
  self.r(x+2,y+5,w-3,h-6,c);self.p([(x+2,y+4),(x+6,y+1),(x+w-5,y+1),(x+w-2,y+4)],lit)
  self.r(x+4,y+7,w-8,1,lit);self.r(x+4,y+h-4,w-8,1,'#514f48')
  for xx in (x+7,x+w-9):self.r(xx,y+5,2,h-6,'#4d5a5b')
  self.r(x+w//2-2,y+h//2,5,4,'#92917b')
 def glyph(self,x,y,col=GOLD):
  self.p([(x,y+4),(x+4,y),(x+8,y+4),(x+4,y+8)],col)
  self.r(x+3,y+2,2,4,DEEP)
 def alien_panel(self,x,y):
  self.panel(x,y,18,24,'#474153','#6f657a');self.glyph(x+5,y+5)
  self.r(x+4,y+17,4,2,MINT);self.r(x+11,y+17,3,2,GOLD_DARK)
  self.line([(x+14,y+24),(x+14,y+29),(x+25,y+29),(x+25,y+42)],INK,2)


def room(wall='#35434c',floor='#3d484c',side='#2b3742',ceiling='#24313d',seam='#414c4f'):
 a=Pixels(floor)
 a.r(0,0,W,96,wall);a.p('0,0 256,0 232,18 24,18',ceiling)
 a.p('0,0 24,18 24,94 0,110',side);a.p('256,0 232,18 232,94 256,110',side)
 a.r(24,18,208,2,EDGE);a.r(24,92,208,4,INK);a.r(24,96,208,2,side)
 a.line('0,110 24,96 232,96 255,110',seam)
 # Only a few low-contrast floor seams, leaving all central standing positions clear.
 a.r(0,120,256,1,seam);a.r(0,147,256,1,seam)
 for x in (-100,32,128,224,356):a.line([(max(24,min(232,128+(x-128)//3)),98),(x,160)],seam)
 return a

def strip_light(a,x,y,w=34,col='#929888'):
 a.r(x-2,y-2,w+4,6,INK);a.r(x,y,w,2,col);a.r(x+2,y+2,w-4,1,'#596969')

def door(a,x,y,w=32,h=65,col='#354651',open=False):
 a.panel(x,y,w,h,'#25323e','#637277')
 a.r(x+4,y+5,w-8,h-7,'#1c2a35' if open else col)
 if open:
  a.p([(x+w-8,y+5),(x+w-4,y+7),(x+w-4,y+h-3),(x+w-8,y+h-8)],'#42545d')
 else:
  a.r(x+w-9,y+h//2,2,8,GOLD_DARK);a.r(x+6,y+10,w-12,12,'#4c6267');a.r(x+7,y+11,w-14,1,'#6a7e7d')

def rack(a,x,y,w,h,fill='#3d4b53'):
 a.r(x,y,w,h,INK);a.r(x+3,y+3,w-6,h-6,fill)
 for xx in (x+1,x+w-3):a.r(xx,y,2,h,'#677172')
 for yy in (y+18,y+39,y+h-3):a.r(x,yy,w,3,'#57625f');a.r(x+2,yy,w-4,1,'#7c806e')

def warehouse():
 a=room('#39444b','#41494b','#303a43','#26343f','#454d4e')
 # Shutter and roof trusses make a broad industrial hall.
 a.panel(91,27,80,67,'#3d4b53','#69767a')
 for y in range(31,88,6):a.r(95,y,72,1,'#536067');a.r(95,y+1,72,1,'#35414b')
 a.r(95,88,72,4,DEEP);a.r(123,79,18,2,'#6c7676')
 for x in (20,84,174,232):
  a.r(x,17,4,81,INK);a.r(x+1,18,2,76,'#59666c');a.r(x-2,14,8,4,'#59666c')
 a.r(0,10,256,4,INK);a.r(0,11,256,1,'#4e5c66')
 for x in (24,92,164):a.line([(x,10),(x+18,1),(x+38,10)],'#475864',2)
 rack(a,28,31,49,65);a.box(32,36,17,13);a.box(52,34,19,15,'#616d68','#7d8778')
 a.box(32,56,27,14);a.r(62,59,10,10,'#6c5a57');a.r(63,61,8,2,'#847464')
 a.box(33,77,18,15,'#636d69','#8c8f7a');a.box(54,76,18,16)
 rack(a,184,28,43,68);a.box(188,34,32,14,'#6c6259','#8e806c');a.box(188,55,14,14);a.box(205,55,16,14,'#5d6b66','#829081')
 a.r(188,77,33,15,'#515e63');a.r(190,78,29,1,'#76817f');a.glyph(201,80,GOLD_DARK)
 a.r(126,14,2,9,'#52606a');strip_light(a,111,22,32,'#9c9a82')
 a.alien_panel(177,3);a.box(4,90,22,21,'#666b63','#838874')
 # Small edge-only pallets and paint wear, no central debris.
 a.r(0,112,28,3,'#303c43');a.r(3,114,5,4,'#303c43');a.r(20,114,5,4,'#303c43')
 a.r(202,101,29,2,'#4c554e');a.r(215,104,10,1,'#565c51')
 return a

def clinic():
 a=room('#455951','#3e4d4d','#334844','#2b3e42','#435152')
 a.r(24,64,208,27,'#3c514e');a.r(24,63,208,2,'#66786b')
 for y in (35,49,77):a.r(25,y,206,1,'#40534f')
 for x in range(32,232,18):a.r(x,20,1,71,'#40534f')
 door(a,112,28,32,66,'#536860',True);a.panel(117,21,22,5,'#526c64','#71897a')
 # Privacy curtain, bed frame, pillow and IV stand form the left silhouette.
 a.r(29,24,63,2,'#74867c');a.r(29,26,3,64,'#465f57')
 for x in range(34,89,7):
  a.r(x,27,6,48,'#4b655d' if x%2 else '#536e63');a.r(x,27,2,47,'#5e786b')
 a.p('32,79 42,73 88,73 96,80 96,92 32,92',INK)
 a.p('36,80 43,76 87,76 92,80 92,88 36,88','#7d8b7b')
 a.r(37,80,15,5,'#a1ab96');a.r(55,79,34,9,'#607e75');a.r(56,79,32,1,'#7d9985')
 a.r(35,89,60,3,'#556766');a.r(37,92,3,9,STEEL);a.r(89,92,3,9,STEEL)
 a.r(97,47,2,48,'#687d76');a.line('94,48 98,44 102,48','#687d76',2);a.panel(100,51,7,14,'#6e8d7c','#96ad92');a.line('103,65 103,75 96,80','#647b71')
 # Tall medical cabinet and counter keep their strongest detail on the right.
 a.panel(177,28,42,65,'#5d7066','#889582');a.r(180,31,36,25,'#374f4c');a.r(197,31,2,25,'#75887a')
 for x,y,c in [(183,43,'#8d9b84'),(190,40,'#697f78'),(202,42,'#82998c'),(210,39,'#8e9582')]:
  a.r(x,y,4,12 if y==39 else 10,c);a.r(x+1,y-2,2,2,'#465f58')
 a.r(180,60,36,1,'#839080');a.r(180,76,36,1,'#839080');a.r(194,65,9,2,'#a0a38a');a.r(194,81,9,2,'#a0a38a')
 a.panel(152,37,18,18,'#6d8172','#98a28a');a.r(159,40,4,12,'#9b7d74');a.r(155,44,12,4,'#9b7d74')
 strip_light(a,44,17,35,'#a0ad97');strip_light(a,176,17,35,'#a0ad97')
 a.alien_panel(150,65);a.r(21,105,22,2,'#50615b')
 return a

def garage():
 a=room('#3a454c','#414a4a','#2c3842','#26313b','#454e4d')
 a.panel(71,23,97,72,'#43515a','#6a777c')
 for y in range(29,88,7):a.r(76,y,87,2,'#33404a');a.r(76,y+2,87,1,'#647077')
 a.r(77,87,84,6,'#2b3943');a.r(112,82,18,2,'#7b8078')
 # Lift posts and suspended hook; the car bay itself remains open.
 for x in (57,172):
  a.r(x,18,7,81,INK);a.r(x+2,20,4,76,'#795e4d');a.r(x+2,20,1,68,'#9b7c58')
  a.r(x-3,94,14,6,DEEP);a.r(x-2,94,12,2,'#6c6554')
 a.r(55,18,126,5,'#534e49');a.r(58,19,118,1,'#8a795c')
 a.r(117,24,2,22,'#606c71');a.r(122,24,2,25,'#606c71');a.line('118,46 118,52 123,56 129,53 129,49','#7b8076',2)
 # Toolboard on the right, stepped hand tools drawn in two-pixel groups.
 a.panel(187,33,42,35,'#4d5a5e','#75807c')
 for x in (193,203,215):
  a.r(x,39,2,19,'#8c9383');a.r(x-2,38,6,3,'#8c9383');a.r(x-1,58,4,4,'#72634f')
 a.r(189,72,42,6,'#837255');a.r(188,77,44,20,'#4b5659');a.r(191,80,39,1,'#67736c')
 a.r(192,86,15,2,'#85917e');a.r(213,86,15,2,'#85917e');a.r(191,96,3,5,INK);a.r(226,96,3,5,INK)
 a.box(196,61,23,11,'#687371','#8d9382')
 # Tire stack is recognizable at the far left without hiding the battle floor.
 for x,y in [(27,72),(29,60),(30,48)]:
  a.p([(x,y+4),(x+5,y),(x+18,y),(x+23,y+4),(x+23,y+12),(x+18,y+16),(x+5,y+16),(x,y+12)],INK)
  a.r(x+3,y+5,17,7,'#39434a');a.r(x+5,y+2,13,2,'#59646a');a.r(x+9,y+5,5,5,INK)
 a.panel(26,31,25,12,'#655e4f','#908162');a.r(29,34,19,2,'#a0946f');a.r(29,38,10,2,'#94805e')
 a.alien_panel(4,38);a.r(0,81,20,17,'#343846');a.r(2,82,15,2,'#655a70')
 a.r(75,99,10,2,'#797153');a.r(94,99,10,2,'#797153');a.r(113,99,10,2,'#797153');a.r(132,99,10,2,'#797153');a.r(151,99,10,2,'#797153')
 strip_light(a,29,11,44,'#9f9d86');strip_light(a,186,11,40,'#9f9d86')
 return a

def shop():
 a=room('#4d4b46','#4c4c46','#393d3f','#30373e','#515049')
 # Former street window with patchwork boards. No readable UI text in the world.
 a.panel(89,27,68,41,'#293d47','#7a7b6a')
 a.r(93,31,60,31,'#51666b');a.p('94,32 117,32 94,52','#697b79');a.r(122,30,2,34,'#353f43')
 a.r(91,50,65,5,'#6b6251');a.r(91,51,65,1,'#8c7c61');a.p('142,31 147,31 110,64 105,64','#746652')
 a.panel(107,72,34,18,'#4c514c','#7c826f');a.glyph(120,77,GOLD_DARK)
 rack(a,29,29,47,67,'#424c4d')
 for x,y,c,w,h in [(34,38,'#7d7765',8,8),(48,35,'#67766b',6,11),(59,37,'#927c65',11,9),(34,57,'#746569',12,11),(49,59,'#73857a',7,9),(59,55,'#8e8267',10,13),(34,80,'#8c8065',10,11),(48,78,'#677d75',8,13),(60,81,'#858f79',9,10)]:
  a.r(x,y,w,h,c);a.r(x+1,y+1,w-2,1,'#9b967c');a.r(x+2,y+h-3,w-4,1,'#535f58')
 # The high counter and register are entirely on the back-right side.
 a.p('172,73 183,66 230,66 236,73 236,98 172,98',INK)
 a.r(175,76,58,19,'#6e604f');a.r(177,79,54,1,'#8c7b60');a.r(179,90,47,1,'#514e46')
 a.p('176,72 184,69 229,69 233,72 233,75 176,75','#98886b')
 a.panel(197,55,21,15,'#5f6e68','#8c9780');a.r(200,58,14,5,'#324b4d');a.r(201,59,9,1,MINT)
 a.r(197,70,25,3,'#8d927d');a.r(210,67,8,1,'#909a80')
 a.panel(178,28,21,21,'#706455','#8e8370');a.r(181,31,15,2,'#aaa080');a.r(181,36,10,1,'#8a917e');a.r(181,40,13,1,'#8a917e')
 a.panel(206,28,22,20,'#5b4d58','#7c6872');a.glyph(213,33,'#a08c68')
 a.box(3,89,20,21,'#696b5c','#8b8b71');a.r(231,104,25,2,'#62624f')
 strip_light(a,105,15,39,'#b1a185');a.r(124,0,2,13,'#5d6464')
 return a

def hotel():
 a=room('#51464b','#494347','#3b3540','#302e3a','#4e484b')
 # Deep corridor arch and muted wallpaper frame an empty central approach.
 a.p('105,94 105,40 110,29 119,22 138,22 148,29 153,40 153,94',INK)
 a.p('109,93 109,41 114,32 122,27 135,27 144,32 149,41 149,93','#28313b')
 a.r(118,43,22,49,'#3a3c43');a.r(121,45,16,45,'#30353d');a.r(133,67,2,5,GOLD_DARK)
 a.r(112,92,35,2,'#635d58')
 for x in range(33,226,19):
  if 96<x<158:continue
  for y in (31,49,67):a.p([(x,y),(x+2,y+3),(x,y+6),(x-2,y+3)],'#63565b')
 a.r(24,79,80,13,'#484047');a.r(154,79,78,13,'#484047');a.r(24,77,80,2,'#817363');a.r(154,77,78,2,'#817363')
 # Reception desk, key slots and an unlit terminal on the left.
 a.panel(31,28,42,28,'#4d4546','#8c7963')
 for x in (38,49,60):
  for y in (35,43):a.r(x,y,5,3,'#262e38');a.r(x+1,y+3,2,3,'#9b8866')
 a.p('26,78 35,72 90,72 95,78 95,98 26,98',INK);a.r(29,80,63,15,'#6c564a')
 a.p('29,77 36,74 89,74 92,77 92,80 29,80','#8a7056');a.r(34,84,54,1,'#836951');a.r(34,93,54,1,'#504746')
 a.panel(69,61,14,12,'#48484b','#7b7d6c');a.r(72,64,8,5,'#344648');a.r(73,65,5,1,'#647d6d')
 a.r(44,68,8,3,'#95836a');a.r(46,66,4,2,'#a49374')
 # Upholstered chair and small table at the right.
 a.panel(182,64,39,24,'#655866','#8b7982');a.r(181,82,42,12,'#514854');a.r(185,83,34,2,'#86717d')
 a.r(182,78,6,14,'#726171');a.r(216,78,6,14,'#726171');a.r(185,94,3,7,'#665644');a.r(217,94,3,7,'#665644')
 a.r(160,82,17,3,'#887056');a.r(168,85,2,13,'#665747');a.r(162,97,14,2,'#665747')
 a.panel(182,27,37,25,'#526264','#8b7b66');a.p('186,46 197,32 207,45 216,38 216,48','#737963');a.r(187,31,8,2,'#90927a')
 # A small broken chandelier, not a bright effect layer.
 a.r(127,1,2,12,'#6b6458');a.r(110,14,36,2,'#8b7a5e');a.r(110,10,2,5,'#8b7a5e');a.r(144,10,2,5,'#8b7a5e')
 for x in (108,125,142):a.r(x,9,7,3,'#a8936f');a.r(x+1,12,5,2,'#635b50')
 a.alien_panel(232,43);a.r(15,103,14,3,'#54504b')
 return a

def laboratory():
 a=room('#3b434e','#3a444c','#2c3443','#252d3d','#3f4951')
 # Tall far-wall seams and exposed service run establish a colder precise space.
 for x in (43,76,109,142,175,208):a.r(x,20,1,73,'#4b5460')
 a.r(24,26,208,2,'#596372');a.r(24,86,208,4,'#2a3543')
 a.panel(96,32,63,37,'#4b5364','#778491');a.r(101,37,53,25,'#243f48')
 # A restrained plotted waveform is a wall apparatus, kept above character heads.
 a.line('104,51 112,51 116,46 120,57 125,43 130,52 137,52 142,48 150,48','#789d91')
 a.r(104,40,16,1,'#4d716e');a.r(104,59,27,1,'#4d716e')
 a.r(98,73,59,5,'#6a7780');a.r(101,78,53,15,'#4a5664');a.r(103,79,49,1,'#7c878b')
 for x in (106,122,138):a.r(x,83,11,2,'#8e9585');a.r(x,87,11,1,'#2d3d4b')
 # Specimen cylinders use stepped corners and opaque flat pixel colours.
 for x,w,c in ((34,37,'#587f78'),(181,38,'#646b83')):
  a.p([(x+6,30),(x+w-6,30),(x+w,36),(x+w,82),(x+w-6,89),(x+5,89),(x,82),(x,36)],INK)
  a.r(x+4,37,w-8,43,c);a.r(x+5,39,3,36,'#8aa89b' if x==34 else '#9497aa')
  a.r(x+7,31,w-14,5,'#6e7b83');a.r(x+5,81,w-10,6,'#64727b');a.r(x+6,88,w-12,6,'#2b3745')
  a.r(x+8,38,w-16,1,'#9cae9f');a.r(x+w-8,40,2,35,'#3b5660')
 # Two different contained forms, no free-standing monsters in the empty stage.
 a.p('47,45 54,43 59,49 58,59 52,67 49,75 44,74 47,65 43,57 43,50','#3c625e');a.r(49,49,4,2,'#97ad8b');a.r(49,60,2,7,'#6b9783')
 a.p('199,44 207,51 211,60 206,73 195,75 191,65 193,53','#454b66');a.p('199,49 203,54 201,63 196,67 195,60','#8a87a0')
 a.panel(24,7,31,9,'#4c5968','#728495');a.r(28,10,20,2,'#98b1aa')
 a.panel(202,7,31,9,'#4c5968','#728495');a.r(207,10,20,2,'#98b1aa')
 a.alien_panel(164,41);a.line('173,84 173,96 220,96 234,104','#2b3443',2)
 a.r(0,113,21,3,'#4d5c61');a.r(232,107,24,2,'#526367')
 return a

def ruin():
 a=room('#45474a','#444a48','#323b40','#29343e','#494e4b')
 # Broken exterior wall: stepped concrete edges reveal a muted evening skyline.
 a.p('70,94 69,72 75,65 73,49 80,43 78,22 88,16 96,18 103,9 116,13 124,5 136,10 146,8 158,16 173,14 181,25 180,47 188,56 184,73 190,94','#687779')
 a.r(85,25,89,45,'#606f75');a.r(85,25,89,11,'#777d78')
 a.p('75,78 84,78 84,57 99,57 99,65 108,65 108,49 121,49 121,57 131,57 131,65 144,65 144,52 160,52 160,69 179,69 183,92 74,92','#3e515c')
 a.r(89,64,3,6,'#687a7c');a.r(112,55,3,5,'#687a7c');a.r(148,59,3,6,'#687a7c')
 # Occupation antenna beyond the breach, an understated alien silhouette.
 a.p('132,67 135,36 140,30 145,37 147,67','#394855');a.r(138,39,2,17,'#8c8668');a.r(133,34,13,2,'#4b5d69')
 a.p('67,94 68,72 73,65 71,47 78,41 76,20 86,14 95,16 99,9 104,10 99,21 85,24 83,48 79,52 80,70 76,79 77,94','#5b5d59')
 a.p('174,17 182,24 182,47 190,56 187,74 193,94 183,94 179,75 183,58 175,50 175,28 168,23','#555a56')
 a.line('66,23 53,31 55,42 46,47 44,62','#2f3b41',2);a.line('199,35 207,42 204,53 217,64','#2f3b41',2)
 # Leaning timber and cracked columns stay on the sides of the usable floor.
 a.p('17,18 31,15 45,96 35,105 27,94',INK);a.p('21,20 28,19 40,95 35,99 30,89','#6f6755');a.line('25,25 34,87','#8b7e64',2)
 a.p('217,21 230,19 230,92 236,99 226,104 213,95 217,78','#5b6060');a.r(222,25,3,54,'#7c8176');a.line('219,43 227,50 220,60','#39474c',2)
 for pts,c in [('1,100 11,91 26,95 30,109 0,112','#59625b'),('26,101 37,90 47,102 51,110 31,111','#696a5e'),('209,100 220,91 230,101 226,111 207,110','#62665c'),('227,109 241,96 255,102 255,118 232,117','#505c56')]:a.p(pts,INK);a.p([(x+1,y-1) for x,y in [tuple(map(int,p.split(','))) for p in pts.split()][1:]],c)
 # Ivy only traces the fracture, with simple leaf clusters rather than noise.
 a.line('48,15 47,34 54,49 50,68 57,82','#3e5149',2)
 for x,y in [(43,23),(48,38),(50,51),(47,64),(53,76)]:a.r(x,y,5,3,'#5d725c');a.r(x+3,y+3,4,2,'#4e6554')
 a.line('0,139 13,136 20,141 29,141','#535b51');a.line('228,149 239,143 255,145','#535b51')
 return a

def nest():
 a=Pixels('#383b43')
 # A cavernous fleshy arch surrounds an open floor. Larger forms are authored
 # with pixel stair steps and 3-tone bands, never a textured photograph.
 a.r(0,0,256,102,'#333542');a.p('30,99 35,62 53,27 83,11 173,11 203,27 221,62 226,99','#262e3b')
 a.p('54,94 57,62 77,36 100,24 155,24 179,37 200,63 203,94','#3c3d49')
 a.p('81,95 80,68 94,48 112,39 145,39 163,50 175,70 176,95','#303542')
 # Receding paired rib arches are lower contrast than the character outlines.
 for pts,c in [
  ('0,0 39,0 55,12 40,20 25,42 18,67 17,102 0,111','#4f4356'),
  ('256,0 216,0 201,12 216,21 231,44 239,68 239,103 256,111','#453d51'),
  ('25,97 29,60 45,30 63,17 74,18 54,34 41,62 36,98','#635367'),
  ('231,97 227,60 211,30 192,17 182,18 202,34 215,63 220,98','#594c62'),
  ('56,96 58,66 72,43 91,29 101,29 81,46 70,68 66,97','#554c60'),
  ('200,96 198,66 183,43 164,29 154,29 175,46 187,68 190,97','#4a4359')]:a.p(pts,c)
 a.line('29,83 33,60 48,33 61,23','#7c6576',2);a.line('224,79 220,59 206,34 194,24','#6d5b70',2)
 a.line('59,85 64,67 75,47 89,36','#6d5c71',2)
 # Tendrils hang above the middle; no prop masks the standing area below y=103.
 a.p('98,0 111,0 111,17 118,27 113,35 108,31 111,25 105,19 102,10','#514356')
 a.p('158,0 166,0 159,15 161,26 155,34 151,29 156,23 152,14','#4a3f54')
 a.p('121,6 129,12 136,8 134,20 130,27 126,25 125,17','#6c5768');a.r(127,14,3,5,'#9a856f')
 # Low egg clusters with contained muted glow emphasize infestation.
 for x,y,w,h in [(6,74,24,29),(26,84,19,24),(210,74,22,29),(230,84,23,27)]:
  a.p([(x,y+h),(x-2,y+12),(x+4,y+3),(x+w//2,y),(x+w-3,y+6),(x+w+2,y+h-8),(x+w-2,y+h)],INK)
  a.p([(x+3,y+h-3),(x+2,y+13),(x+6,y+6),(x+w//2,y+3),(x+w-6,y+8),(x+w-2,y+h-8),(x+w-4,y+h-3)],'#66586d')
  a.p([(x+7,y+12),(x+w//2,y+8),(x+w-6,y+14),(x+w-7,y+h-6),(x+8,y+h-5)],'#82947c')
  a.r(x+8,y+14,2,5,'#abb18b')
 # Floor has long low-contrast bands, rather than a busy lattice behind enemies.
 a.p('0,109 33,100 71,104 104,101 142,104 187,101 219,105 256,111 256,160 0,160','#3b3d44')
 a.p('0,115 36,108 70,112 103,108 153,111 185,108 219,112 256,118 256,123 213,116 183,113 149,115 104,113 72,116 37,113 0,120','#41424a')
 a.p('0,146 35,140 60,143 87,141 115,143 151,140 186,144 218,142 256,150 256,153 217,146 186,147 150,144 116,147 85,144 60,147 34,144 0,150','#3e4047')
 a.line('0,128 18,124 28,128 34,126','#514654',2);a.line('220,132 235,127 255,130','#4c4353',2)
 return a

BUILDERS={k:globals()[k] for k in ORDER}
FLOORS=dict(zip(ORDER,('#41494b','#3e4d4d','#414a4a','#4c4c46','#494347','#3a444c','#444a48','#3b3d44')))
def build():
 atlas=Image.new('RGB',(W*4,H*2))
 for n,key in enumerate(ORDER):
  im=BUILDERS[key]().im
  # Phone layouts may extend this last scanline downwards. Keep the final two
  # rows completely free of seams, fragments and foreground props.
  ImageDraw.Draw(im).rectangle((0,H-2,W-1,H-1),fill=FLOORS[key])
  assert im.size==(256,160)
  atlas.paste(im,((n%4)*W,(n//4)*H))
 OUT.parent.mkdir(parents=True,exist_ok=True);atlas.save(OUT,optimize=True)
 return atlas

if __name__=='__main__':
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--preview',type=Path);args=parser.parse_args()
 result=build()
 if args.preview:
  args.preview.parent.mkdir(parents=True,exist_ok=True)
  result.resize((2048,640),Image.Resampling.NEAREST).save(args.preview)
 print(f'{OUT}: {result.width}x{result.height}, 8 native pixel interiors, {OUT.stat().st_size:,} bytes')
