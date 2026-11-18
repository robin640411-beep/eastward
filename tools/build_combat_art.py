"""Bake the native character art into fixed pixel PNGs and author five pixel bosses.
No high-resolution source/AI atlas is used. All geometry is rasterised once at the
logical grid without antialiasing, and only the equipped NPC PNG is loaded in play.
Run using the bundled Python (Pillow); output is deterministic.
"""
from pathlib import Path
import re, json, math, xml.etree.ElementTree as ET
from PIL import Image, ImageDraw, ImageColor, ImageFont
from redraw_characters import Art, person, enemy, SKIN, CLOTH, CAT, ROOT, INK, DEEP, EDGE, GOLD, LIGHT, TEAL
OUT=ROOT/'dist/assets/combat'
ENEMIES=['raider','soldier','mutant','infected','crawler','hound','nest','swarm','drone','turret','worker','sentinel','lurker','brute','wing','parasite']
BOSSES=['overseer','broodmother','zero_core','graft_colossus','fallen_angel']
BOSS_NAMES=['星門監督官','孵界母體','歸零主機','接骨巨像','失落天使']

# This tiny SVG rasteriser deliberately has no antialiasing: all output is RGBA
# pixel clusters. Native authored geometry only uses rect, polygon and group.
def raster(a):
 im=Image.new('RGBA',(a.w,a.h));draw=ImageDraw.Draw(im)
 root=ET.fromstring('<svg>'+''.join(a.parts)+'</svg>')
 def paint(el,tx=0,ty=0,sc=1):
  tag=el.tag.split('}')[-1];at=el.attrib
  if tag=='g':
   tr=at.get('transform','');t=re.search(r'translate\(([-.\d]+)[ ,]+([-.\d]+)\)',tr);s=re.search(r'scale\(([-.\d]+)\)',tr)
   ntx=tx+(float(t[1])*sc if t else 0);nty=ty+(float(t[2])*sc if t else 0);nsc=sc*(float(s[1]) if s else 1)
   for child in el:paint(child,ntx,nty,nsc)
   return
  color=at.get('fill','#000');fill=ImageColor.getcolor(color,'RGBA')
  # Do not bake a translucent oval into the sprite. Scene shadows own grounding.
  if fill[3]<255:return
  if tag=='rect':
   x=round(tx+float(at['x'])*sc);y=round(ty+float(at['y'])*sc);w=round(float(at['width'])*sc);h=round(float(at['height'])*sc)
   if w and h:draw.rectangle((x,y,x+w-1,y+h-1),fill=fill)
  elif tag=='polygon':
   pts=[(round(tx+float(x)*sc),round(ty+float(y)*sc)) for x,y in re.findall(r'([-.\d]+),([-.\d]+)',at['points'])]
   draw.polygon(pts,fill=fill)
   if at.get('stroke'):draw.line(pts+[pts[0]],fill=ImageColor.getcolor(at['stroke'],'RGBA'),width=max(1,round(float(at.get('stroke-width',1))*sc)))
  elif tag=='svg':
   for child in el:paint(child,tx,ty,sc)
  else:raise ValueError(tag)
 paint(root)
 return im

def npc(i,j,weapon):
 a=person(i,j)
 # The soldier's original display rifle is a profession prop, not equipment.
 # Remove that prop from combat portraits so a club/pistol/empty hand is truthful.
 if j==3:
  start=next(k for k,p in enumerate(a.parts) if '44,44 49,44 49,59' in p)
  del a.parts[start:start+4]
 # The hunter keeps a quiver but the display bow must not contradict equipped gear.
 if j==10:
  start=next(k for k,p in enumerate(a.parts) if '8,35 13,40 16,52' in p)
  del a.parts[start:start+3]
 if weapon=='none':return a
 sd,c,hi=CLOTH[j]
 # Bent left forearm at chest level. It is large enough to read in a bust crop.
 a.p('11,42 16,43 20,49 20,56 15,59 10,54 6,48',INK)
 a.p('12,45 15,45 18,50 17,54 14,54 9,48',c)
 a.r(12,46,3,3,hi);a.r(8,42,6,8,INK);a.r(9,43,4,5,SKIN[i][1]);a.r(9,43,2,2,SKIN[i][2])
 if weapon=='club':
  a.p('3,13 8,11 12,14 12,28 10,38 10,46 6,47 6,37 2,27 1,17',INK)
  a.p('4,15 7,14 9,16 9,27 7,37 7,43 6,35 4,27', '#9b7258')
  a.r(4,16,2,10,'#d9ad79');a.r(7,18,2,9,'#74544c');a.r(5,34,4,2,'#d0c2a0');a.r(5,38,4,2,'#d0c2a0')
  a.r(8,44,5,4,SKIN[i][1]);a.r(9,44,3,1,SKIN[i][2])
 else:
  a.p('1,34 17,34 19,37 17,41 13,41 12,49 7,49 7,41 1,40',INK)
  a.r(2,35,14,4,'#7c8c98');a.r(3,35,10,1,'#c6cfbf');a.r(2,39,11,1,'#3d485b');a.r(8,41,3,6,'#9e775e');a.r(1,35,2,4,'#222d40');a.r(15,33,2,2,INK)
  a.r(11,43,3,4,SKIN[i][1]);a.r(11,43,2,1,SKIN[i][2])
 return a

def acid_crawler():
 a=Art(96,96)
 # A low arthropod, not a mammalian hound: six separated, sharply jointed legs.
 dark='#3f3a53';shell='#71627d';light='#aa919f';acid='#a1b883';pale='#d5d4a4'
 for pts,c in [
  ('25,51 15,47 5,53 3,68 9,69 12,57 26,60',dark),
  ('43,48 33,44 20,48 13,64 18,68 27,54 44,58',dark),
  ('61,48 53,41 42,45 37,59 44,63 49,52 66,59',dark),
  ('25,61 20,70 10,73 5,87 10,90 17,80 27,78 34,65',shell),
  ('42,61 38,73 26,80 25,91 32,91 34,84 47,79 51,65',shell),
  ('59,61 59,74 51,83 55,91 62,91 59,84 69,78 68,63',shell)
 ]:a.p(pts,c,INK)
 a.p('12,45 18,30 31,22 48,23 62,34 71,48 75,62 65,73 41,76 23,70 13,60',INK)
 a.p('16,45 22,33 33,27 47,28 58,37 66,50 70,61 63,68 42,71 27,66 18,58',shell)
 a.p('18,43 25,34 34,30 43,31 39,40 27,44 22,56 18,54',light)
 # The acid reservoir arches above the carapace, with clear volume and liquid.
 a.p('23,38 21,27 25,17 34,11 44,11 54,18 59,30 56,42 48,50 33,50',INK)
 a.p('26,36 25,27 28,19 35,15 43,15 51,21 55,30 52,40 46,46 35,46', '#6c8b78')
 a.p('28,29 31,21 36,18 42,18 40,24 33,28',pale)
 a.p('28,34 32,29 39,31 46,28 52,32 49,40 44,43 35,43',acid)
 a.r(32,32,4,4,'#d7dca7');a.r(43,35,5,3,'#c0cf94');a.r(37,40,3,2,'#6e9873')
 # Banded shell bridge joins the bulb to a broad, ground-hugging jaw.
 for pts,c in [('43,48 50,43 62,45 67,54 62,62 51,62',dark),('52,50 60,47 70,51 76,59 69,67 60,64',shell)]:a.p(pts,c,INK)
 a.p('47,49 51,47 59,48 61,51 50,53',light);a.p('57,53 62,51 68,54 70,58 61,57',light)
 a.p('62,55 75,49 87,54 92,63 90,73 79,79 65,75 59,66',INK)
 a.p('66,58 75,53 84,57 88,63 85,70 78,74 68,71 63,65',dark)
 a.p('68,58 75,55 81,57 79,62 69,63',light)
 for x,y in [(69,63),(76,60),(82,63)]:a.r(x,y,3,3,GOLD);a.r(x,y,1,1,LIGHT)
 # Horizontal split mandibles project forward. They never read as a dog's snout.
 a.p('80,68 91,70 94,79 91,85 87,84 88,78 81,76',INK)
 a.p('82,70 90,73 91,79 89,81 89,77 83,75',pale)
 a.p('70,70 75,78 86,82 84,89 78,89 76,84 67,79 65,73',INK)
 a.p('69,73 73,79 81,83 81,86 79,83 69,78',pale)
 for x,y in [(17,75),(30,82),(60,78),(22,60),(45,65)]:a.r(x,y,4,2,light)
 a.r(78,77,3,3,acid);a.r(86,88,2,4,acid)
 return a

def ordinary_enemy(key):
 if key=='crawler':return acid_crawler()
 a=enemy(key)
 # Equipment silhouettes agree with the existing enemy attack identity.
 if key=='soldier':
  a.p('54,49 59,45 72,45 76,48 91,48 93,53 89,57 73,57 68,62 65,71 60,71 62,59 54,57',INK)
  a.p('58,49 71,48 75,51 89,51 89,54 71,54 66,59 59,56','#5e687c')
  a.r(61,47,11,2,'#a8afb0');a.r(77,49,14,2,'#9d8b9d');a.r(70,52,4,2,GOLD);a.r(64,60,3,8,'#9d7865')
 elif key=='sentinel':
  a.p('5,42 3,15 8,4 12,15 10,42 14,44 14,48 9,48 10,58 5,58 5,48 1,48 1,44',INK)
  a.p('6,39 5,17 8,9 9,17 8,39','#c5c9b6');a.r(6,20,1,17,'#f0dfb4');a.r(3,44,9,2,GOLD);a.r(6,49,2,7,'#887084')
 elif key=='worker':
  pts=[]
  for n in range(24):
   angle=2*math.pi*n/24;radius=14 if n%2==0 else 11
   pts.append((79+math.cos(angle)*radius,67+math.sin(angle)*radius))
  a.p(pts,'#a4adb0',INK)
  a.p('73,60 81,58 87,64 86,72 79,76 72,71', '#56647b');a.r(76,63,6,7,GOLD);a.r(77,64,2,3,LIGHT)
 return a

def jewel(a,x,y,s=8,color=GOLD):
 a.p([(x,y-s),(x+s,y-2),(x+s-1,y+s-3),(x,y+s),(x-s,y+s-3),(x-s,y-2)],INK)
 a.p([(x,y-s+3),(x+s-3,y-1),(x+s-4,y+s-5),(x,y+s-3),(x-s+3,y+s-5),(x-s+3,y-1)],color)
 a.r(x-2,y-s+4,2,s,LIGHT)

def blade(a,pts,lit=True):
 a.p(pts,'#d1c8a7' if lit else '#8e9a9e',INK)

def boss(k):
 a=Art(128,128)
 purple='#57445f';shade='#302a42';shine='#8a768d';bronze='#ae8d64';bone='#c8c5a0';ivory='#e8dfb7';flesh='#a77987'
 if k=='overseer':
  # Four independently readable arms, long angular blades, bronze occupation plate.
  a.p('44,74 61,70 82,75 85,101 94,120 75,123 68,99 62,88 58,100 51,123 31,122 39,103',INK)
  a.p('46,79 59,78 54,102 48,117 36,118 44,100',bronze);a.p('66,79 78,79 80,101 88,117 77,118 71,99',purple)
  a.r(43,102,9,4,bone);a.r(74,103,8,4,shine);a.r(36,118,13,2,ivory);a.r(78,118,10,2,bronze)
  for pts,c in [('42,37 28,29 21,35 18,49 7,52 9,61 28,58 33,44 45,49',bronze),('78,36 95,27 105,34 111,49 121,51 120,62 103,58 95,44 78,48',purple),('40,56 27,59 22,71 14,76 17,86 32,79 37,69 47,68',purple),('80,56 94,60 100,72 112,77 111,86 96,81 88,70 75,68',bronze)]:a.p(pts,c,INK)
  # Blades angle away from the body and leave dark gaps at the elbows.
  blade(a,'8,52 2,38 5,13 11,5 10,35 15,50');blade(a,'117,52 116,33 119,8 125,18 124,38 123,54',False)
  blade(a,'15,77 3,88 3,110 9,114 9,94 21,85');blade(a,'110,78 123,91 125,112 119,116 117,96 105,85',False)
  a.p('40,31 55,25 74,26 87,36 84,61 79,83 63,91 46,81 38,62',INK)
  a.p('43,35 55,29 71,30 82,38 80,57 75,77 63,85 49,77 43,59',purple)
  a.p('43,35 54,30 61,39 54,51 42,50',bronze);a.p('72,30 81,37 81,49 68,48 63,39',bronze)
  a.p('52,53 62,47 74,53 73,69 63,78 52,69',shade);jewel(a,63,60,10)
  a.r(49,77,29,3,bronze);a.r(54,83,18,2,bone)
  a.p('44,21 39,7 49,11 55,5 67,4 76,9 86,6 81,24 76,32 63,38 50,32',INK)
  a.p('47,17 45,12 51,15 58,8 67,7 74,13 81,11 78,23 72,29 63,34 52,29',bronze)
  a.p('52,16 58,10 62,9 60,21 51,24',bone);a.p('65,9 72,14 76,22 65,23',purple)
  a.r(51,23,25,5,INK);a.r(53,24,8,2,GOLD);a.r(66,24,8,2,GOLD);a.r(61,28,4,5,shade)
  for x,y in [(28,35),(99,35),(24,68),(97,69),(47,38),(72,38)]:a.r(x,y,4,3,ivory)
 elif k=='broodmother':
  # Huge arched abdomen above a low head; six splayed hook legs and visible brood.
  for pts,c in [('45,46 27,31 15,35 6,61 4,88 11,89 13,62 23,44 43,57',purple),('83,46 103,30 115,35 124,61 124,88 118,90 115,62 106,44 87,57',shade),('39,64 24,59 9,77 2,106 7,119 13,115 12,103 21,83 41,77',purple),('88,62 104,58 120,76 127,105 121,119 115,115 115,103 107,82 86,78',purple),('42,83 25,87 19,110 24,123 31,121 30,108 43,98',shade),('86,84 103,88 108,109 104,123 97,121 98,107 83,96',shade)]:a.p(pts,c,INK)
  a.p('26,47 32,23 47,11 63,6 82,13 98,28 104,51 96,79 80,94 49,93 31,76',INK)
  a.p('31,46 37,26 49,16 64,10 80,17 93,31 99,51 92,74 78,88 51,87 36,72',purple)
  a.p('36,44 41,28 51,20 61,16 59,32 51,46 45,67 36,65',shine)
  a.p('69,15 79,20 91,34 95,52 88,69 78,75 73,56 77,37',shade)
  a.p('50,37 62,27 76,34 85,52 82,72 69,87 52,77 44,58',INK)
  a.p('54,40 62,33 72,38 79,52 76,69 67,80 56,72 50,58',flesh)
  for x,y in [(59,46),(71,51),(59,61),(69,69)]:jewel(a,x,y,6,'#aebd88')
  a.p('44,82 49,74 76,74 86,84 82,103 68,115 52,108 42,96',INK)
  a.p('48,85 52,79 74,79 81,85 77,99 66,108 55,103 47,94',bronze)
  a.p('49,86 59,88 56,94 49,92',INK);a.p('69,88 78,85 77,93 71,94',INK)
  a.r(51,88,5,2,GOLD);a.r(72,88,4,2,GOLD)
  blade(a,'48,96 54,98 57,111 53,116 48,106');blade(a,'76,96 72,99 68,112 73,115 78,104',False)
  for x,y in [(12,67),(17,90),(108,88),(114,65),(43,27),(87,34),(35,54)]:a.r(x,y,4,3,shine)
  a.r(61,13,5,4,bronze);a.r(55,20,4,3,bronze)
 elif k=='zero_core':
  # Broad four-legged machine, three lenses, raised cannon, no humanoid silhouette.
  for pts,c in [('36,66 25,64 13,81 8,106 4,113 5,122 28,122 30,116 21,112 23,91 42,80',purple),('86,66 102,64 115,81 119,106 124,113 123,122 100,122 97,116 107,111 105,92 83,80',shade),('45,75 37,92 36,111 31,118 33,124 52,124 55,116 48,110 51,91 60,82',shade),('77,75 90,93 91,111 97,118 95,124 77,124 73,116 80,110 74,90 68,82',purple)]:a.p(pts,c,INK)
  for x in [12,105]:a.r(x,86,9,5,shine);a.r(x,98,8,3,bronze)
  a.r(39,99,8,5,shine);a.r(80,99,8,5,shine)
  a.p('22,39 36,28 90,28 105,40 110,64 101,85 83,94 44,94 24,82 17,60',INK)
  a.p('26,42 39,33 86,33 101,43 104,62 96,79 81,87 44,88 28,77 23,59',purple)
  a.p('27,43 40,35 84,35 95,41 81,48 43,48 26,55',shine)
  a.p('25,57 38,51 43,78 36,83 29,77 24,63',bronze)
  a.p('86,50 101,44 104,61 96,78 87,83',shade)
  a.p('40,52 51,43 75,43 88,52 89,72 80,84 48,84 38,72',INK)
  a.p('44,54 53,48 74,48 83,55 84,69 77,79 49,79 43,69','#64606c')
  for x,y in [(52,60),(74,60),(63,72)]:jewel(a,x,y,7)
  a.p('47,33 45,15 51,10 74,10 81,17 81,33',INK);a.r(49,17,27,15,shade);a.r(50,17,4,12,shine)
  a.p('52,9 55,3 71,3 77,9 77,22 72,29 56,29 51,21',INK);a.r(55,8,17,13,shine);a.r(57,8,13,9,DEEP);a.r(59,10,9,6,GOLD);a.r(60,10,4,3,LIGHT)
  a.r(26,58,7,3,GOLD);a.r(94,57,7,3,GOLD)
  for x in [48,54,60,66,72,78]:a.r(x,85,3,4,shade)
 elif k=='graft_colossus':
  # Unequal arms, rib cage, industrial plates and trailing graft conduits.
  a.p('30,81 49,76 71,79 87,95 85,117 93,120 92,125 70,125 64,109 58,96 49,110 45,124 23,124 25,116',INK)
  a.p('32,85 47,82 51,92 43,110 41,119 28,119 31,108',purple);a.p('62,86 71,86 81,98 79,116 85,120 73,120 68,106',shade)
  a.r(29,104,13,5,bronze);a.r(72,107,8,4,shine)
  a.p('30,33 43,21 65,20 84,32 96,51 102,79 94,94 82,93 72,82 68,90 40,91 29,72 22,76 14,91 4,92 2,82 7,58 15,39',INK)
  a.p('30,38 43,26 63,25 79,35 88,50 93,77 90,87 84,86 72,69 63,83 43,85 34,66 28,55 22,70 14,84 8,85 12,62 20,43','#7f8b7a')
  a.p('22,44 31,39 37,43 30,55 26,64 21,63 16,75 12,75 16,57',bone)
  a.p('44,29 58,27 68,36 67,54 56,66 42,58 36,43',shade)
  # Exposed joined ribs across a sunken chest.
  a.p('45,39 52,35 58,39 63,51 60,66 49,72 41,60',INK)
  for y,w in [(42,13),(49,17),(56,17),(63,13)]:a.p([(43,y),(48,y-2),(48+w-4,y+1),(48+w-5,y+4),(48,y+2),(44,y+3)],bone)
  a.r(52,40,3,27,ivory)
  a.p('75,30 88,33 101,46 109,70 119,85 117,102 105,111 90,107 83,95 85,79 74,56',INK)
  a.p('79,35 88,37 97,48 104,70 114,86 112,99 104,105 94,102 88,93 90,78 79,54',purple)
  a.p('79,36 88,39 95,48 96,61 87,60 80,50',shine);a.p('91,81 105,77 113,87 111,98 101,101 91,95',bronze)
  a.r(91,84,5,10,bone);a.r(101,83,5,13,shade);a.r(109,89,3,8,shade)
  a.p('38,25 37,11 47,3 63,6 70,16 66,31 57,38 43,33',INK)
  a.p('41,15 48,7 60,9 65,17 62,29 56,33 46,29',bone);a.p('56,9 61,11 65,18 61,24 55,22',purple)
  a.r(43,19,10,5,INK);a.r(46,20,4,2,GOLD);a.r(58,19,4,3,GOLD);a.r(48,28,10,3,shade)
  # Large separated conduit silhouette is visible to the right of the body.
  a.p('97,47 117,48 126,60 124,77 118,81 114,77 119,69 119,61 114,55 99,55',INK);a.p('99,49 116,51 123,61 121,73 118,76 119,65 116,58 99,53',shine)
  a.r(114,54,4,3,bronze);a.r(120,65,3,3,bronze)
 elif k=='fallen_angel':
  # Broken halo and six shard-like wings. A quiet floating, narrow central body.
  a.p('35,15 43,6 54,2 59,3 57,7 47,10 39,18',INK);a.p('38,15 44,9 54,5 55,7 47,12 41,18',GOLD)
  a.p('66,2 80,5 91,15 92,23 86,26 86,18 77,11 67,8',INK);a.p('69,5 79,8 88,16 89,22 88,22 84,16 76,12 68,8',GOLD)
  # Deliberate dark gaps separate all the wing blades.
  for pts,c,shinepts in [
   ('51,55 36,37 20,13 6,8 7,29 17,45 36,57', '#879baa','10,14 20,20 35,43 40,51 20,39'),
   ('45,64 24,53 8,36 2,42 5,61 20,73 40,77','#6e7d98','7,44 13,53 27,63 36,69 20,67'),
   ('43,77 23,79 10,73 9,89 21,102 38,94 49,83','#56627d','13,80 23,84 37,84 24,94 18,91'),
   ('77,55 92,37 108,13 122,8 121,29 111,45 92,57','#7689a1','118,15 107,22 92,43 87,51 108,38'),
   ('83,64 104,53 120,36 126,42 123,61 108,73 88,77','#65718f','121,44 114,54 101,63 92,69 108,66'),
   ('85,77 105,79 118,73 119,89 107,102 90,94 79,83','#4c5878','115,80 104,84 90,84 104,94 110,90')]:
   a.p(pts,c,INK);a.p(shinepts,'#c0d3cd')
  a.p('49,44 57,36 70,36 80,45 78,69 73,81 78,103 70,122 64,115 57,122 50,103 54,81 48,67',INK)
  a.p('53,47 58,40 68,40 75,48 73,68 67,80 73,103 68,115 64,107 59,115 55,102 61,80 54,66', '#938598')
  a.p('55,47 61,43 63,66 58,73 54,61', '#c7c3b3');a.p('66,43 72,47 71,65 66,73 64,65',purple)
  a.p('53,79 62,83 61,99 57,107 54,100',bone);a.p('66,84 71,80 74,100 69,110 65,100',shine)
  a.p('48,49 41,62 38,78 44,85 48,83 44,76 47,65 54,58',INK);a.p('80,49 88,63 91,79 85,86 80,83 85,76 82,65 76,58',INK)
  a.p('49,53 45,63 42,76 46,81 44,76 50,62',bone);a.p('78,53 84,64 87,77 83,82 85,76 78,62',shine)
  a.p('49,28 52,18 62,12 72,18 78,29 73,41 63,46 53,40',INK)
  a.p('53,28 55,21 62,17 69,21 73,29 70,37 63,42 56,37', '#c5c2b0')
  a.p('63,17 69,21 73,29 70,37 63,42 65,29', '#918497')
  a.r(55,29,6,2,INK);a.r(66,29,6,2,INK);a.r(56,29,4,1,TEAL);a.r(67,29,4,1,TEAL)
  jewel(a,64,56,6,TEAL);a.r(61,73,6,3,GOLD)
 return a

def save_png(im,path):
 path.parent.mkdir(parents=True,exist_ok=True);im.save(path,optimize=True)
 assert set(im.getchannel('A').get_flattened_data())<={0,255},path
 bbox=im.getbbox();assert bbox and bbox[0]>=0 and bbox[1]>=0 and bbox[2]<=im.width and bbox[3]<=im.height,path
 return {'width':im.width,'height':im.height,'bounds':list(bbox),'bytes':path.stat().st_size}

def contact_sheet(images,path,columns=8,scale=2):
 cellw=max(i.width for _,i in images)*scale+16;cellh=max(i.height for _,i in images)*scale+28
 sheet=Image.new('RGB',(columns*cellw,((len(images)+columns-1)//columns)*cellh),'#24323e');d=ImageDraw.Draw(sheet)
 for n,(label,im) in enumerate(images):
  x=(n%columns)*cellw+(cellw-im.width*scale)//2;y=(n//columns)*cellh+8
  sheet.paste(im.resize((im.width*scale,im.height*scale),Image.Resampling.NEAREST),(x,y),im.resize((im.width*scale,im.height*scale),Image.Resampling.NEAREST))
  d.text(((n%columns)*cellw+6,(n//columns)*cellh+cellh-18),label,fill='#dbd1b6')
 path.parent.mkdir(parents=True,exist_ok=True);sheet.save(path)

def main():
 info={};preview=[]
 for i,r in enumerate(CAT['races']):
  for j,p in enumerate(CAT['professions']):
   for weapon in ['none','club','pistol']:
    key=f"{r['id']}_{p['id']}_{weapon}";im=raster(npc(i,j,weapon));info['npcs/'+key]=save_png(im,OUT/'npcs'/f'{key}.png')
    if j==i%20 or (i==0 and j in [1,2,3,7,10,11,19]):preview.append((key,im))
 ordinary=[]
 for key in ENEMIES:
  im=raster(ordinary_enemy(key));info['enemies/'+key]=save_png(im,OUT/'enemies'/f'{key}.png');ordinary.append((key,im))
 bosses=[]
 for key in BOSSES:
  im=raster(boss(key));info['bosses/'+key]=save_png(im,OUT/'bosses'/f'{key}.png');bosses.append((key,im))
 (ROOT/'art-direction/combat-pixel-manifest.json').write_text(json.dumps({'version':1,'source':'Native authored integer pixel clusters; no HD atlas','assets':info},indent=2)+'\n')
 contact_sheet(preview,ROOT/'art-direction/combat-pixel-npc-review.png',6,2)
 contact_sheet(ordinary,ROOT/'art-direction/combat-pixel-enemy-review.png',4,2)
 contact_sheet(bosses,ROOT/'art-direction/combat-pixel-boss-review.png',5,2)
 print(json.dumps({'npcs':720,'enemies':16,'bosses':5,'totalBytes':sum(x['bytes'] for x in info.values()),'allAlphaBinary':True}))
if __name__=='__main__':main()
