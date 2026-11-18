"""Eastward art revision 3: hand-authored pixel metalwork and survival equipment.
The public window rectangles stay unchanged so all passenger heads remain visible.
"""
from pathlib import Path
import json, math, xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
A=ROOT/'dist/assets'
M=json.loads((A/'manifest.json').read_text())
INK='#111924'; EDGE='#26313c'; METAL='#7c949b'; SILVER='#b5c8c3'; LIGHT='#e8e4c6'; AMBER='#f1b660'; RED='#c76054'
class Art:
 def __init__(self,w,h):self.w=w;self.h=h;self.parts=[];self.defs=[]
 def r(self,x,y,w,h,c):
  if w>0 and h>0:self.parts.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{c}"/>')
 def p(self,pts,c):self.parts.append(f'<polygon points="{pts}" fill="{c}"/>')
 def line(self,x,y,w,c):self.r(x,y,w,1,c)
 def box(self,x,y,w,h,base,hi,shade):
  self.r(x,y,w,h,INK);self.r(x+1,y+1,w-2,h-2,base);self.r(x+2,y+1,w-4,1,hi);self.r(x+1,y+2,1,h-4,hi);self.r(x+2,y+h-3,w-3,2,shade)
 def rivet(self,x,y,c=SILVER):self.r(x,y,2,2,INK);self.r(x,y,1,1,c)
 def save(self,path):
  p=A/path;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="{self.w}" height="{self.h}" viewBox="0 0 {self.w} {self.h}" shape-rendering="crispEdges"><defs>'+''.join(self.defs)+'</defs>'+''.join(self.parts)+'</svg>')

def wheel(a,cx,cy,alien=False):
 # Stepped circular tyres, side-wall facets and inset rims, matched to animated hub centres.
 a.p(f'{cx-6},{cy-10} {cx+6},{cy-10} {cx+6},{cy-8} {cx+9},{cy-8} {cx+9},{cy-5} {cx+11},{cy-5} {cx+11},{cy+5} {cx+9},{cy+5} {cx+9},{cy+8} {cx+6},{cy+8} {cx+6},{cy+10} {cx-6},{cy+10} {cx-6},{cy+8} {cx-9},{cy+8} {cx-9},{cy+5} {cx-11},{cy+5} {cx-11},{cy-5} {cx-9},{cy-5} {cx-9},{cy-8} {cx-6},{cy-8}',INK)
 a.r(cx-6,cy-8,12,2,'#37434a');a.r(cx-9,cy-4,2,8,'#37434a');a.r(cx-6,cy+7,12,2,'#090f1b');a.r(cx+8,cy-4,2,8,'#090f1b')
 a.p(f'{cx-4},{cy-6} {cx+4},{cy-6} {cx+6},{cy-4} {cx+6},{cy+4} {cx+4},{cy+6} {cx-4},{cy+6} {cx-6},{cy+4} {cx-6},{cy-4}', '#7d768f' if alien else METAL)
 a.r(cx-4,cy-5,8,1,'#b1a9be' if alien else SILVER);a.r(cx-5,cy-3,2,6,'#b1a9be' if alien else SILVER);a.r(cx-3,cy-3,6,6,'#302b44' if alien else '#3d505b');a.r(cx-1,cy-1,3,3,AMBER if alien else '#d5ded2')
 for dx,dy in [(-4,0),(4,0),(0,-4),(0,4)]:a.r(cx+dx,cy+dy,1,1,INK)

palettes={
 'compact':('#c49a52','#efd38b','#8e693b','#514844'),
 'sedan':('#5f9395','#a6c7bd','#3d6874','#374b53'),
 'van':('#b1b49a','#e0ddba','#7c8b78','#465e5d'),
 'pickup':('#ad6550','#df9a70','#784b42','#494344'),
 'bus':('#bd9b52','#e3cf84','#8b713e','#4a514f'),
 'armored':('#45445d','#77788b','#2c2d43','#1c2131'),
 'rover':('#68637b','#ada1bb','#403e5d','#292b45'),
 'ambulance':('#bcc1b4','#eeead2','#879b99','#51686c')}

def vehicle(key,info,windows,extra=False):
 a=Art(160,72);base,hi,shade,dark=palettes[key];alien=key in ['rover','armored']
 # Cut a genuine hole for every existing passenger window; no glass is painted over a head.
 holes=''.join(f'<rect x="{w["x"]}" y="{w["y"]}" width="{w["width"]}" height="{w["height"]}" fill="black"/>' for w in windows)
 a.defs.append('<mask id="occupants" maskUnits="userSpaceOnUse" x="0" y="0" width="160" height="72"><rect width="160" height="72" fill="white"/>'+holes+'</mask>')
 a.parts.append('<g mask="url(#occupants)">')
 # Underbody and two independently sprung axles.
 a.r(19,57,124,5,INK);a.r(48,58,63,2,'#4f5e61');a.r(47,55,65,2,METAL)
 for x in [36,124]:a.r(x-12,55,24,4,INK);a.r(x-9,53,18,2,SILVER)
 # Cabin silhouettes differ even with the shared seat rectangles.
 if extra:
  roof='17,35 17,14 20,14 20,10 25,10 25,8 127,8 127,10 135,10 135,14 139,14 144,35'
 elif key=='compact':roof='48,38 52,32 55,24 60,24 60,19 91,19 91,21 99,21 108,38'
 elif key=='sedan':roof='25,38 31,25 36,25 40,18 96,18 96,20 105,20 119,38'
 elif key=='pickup':roof='73,38 77,23 82,23 82,17 111,17 111,19 120,19 130,38'
 elif key in ['bus','van','ambulance']:
  top=7 if key=='bus' else 12
  left=16 if key=='bus' else 24
  roof=f'{left},38 {left},{top+7} {left+3},{top+7} {left+3},{top+3} {left+8},{top+3} {left+8},{top} 127,{top} 127,{top+2} 134,{top+2} 134,{top+7} 139,{top+7} 139,38'
 elif key=='rover':roof='24,39 34,24 41,24 44,16 98,16 115,20 133,39'
 else:roof='17,39 24,20 31,20 31,13 107,13 121,19 138,39'
 a.p(roof,INK)
 a.parts.append('<g transform="translate(0 1)">');a.p(roof,shade);a.parts.append('</g>')
 minx=min(w['x'] for w in windows)-4;maxx=max(w['x']+w['width'] for w in windows)+4;top=min(w['y'] for w in windows)-5
 a.r(minx,top+2,maxx-minx,33-top,base);a.r(minx+4,top,maxx-minx-8,2,hi);a.r(minx,top+3,2,30-top,hi)
 a.r(minx,33,maxx-minx,3,dark);a.r(minx+2,34,maxx-minx-4,1,hi)
 # Main sculpted body has fender slopes, rounded nose, slatted grille and a darker rocker panel.
 a.p('8,41 12,41 12,37 21,34 126,34 126,35 139,35 139,37 148,37 148,40 152,40 152,54 147,54 147,58 17,58 17,56 10,56 10,51 8,51',INK)
 a.p('12,42 15,42 15,39 23,37 125,37 137,38 147,40 149,43 149,52 142,55 21,55 13,52',base)
 a.r(21,38,115,2,hi);a.r(14,41,127,2,base);a.r(16,49,126,6,shade);a.r(21,54,121,3,dark)
 a.r(17,44,125,1,hi);a.r(17,45,125,2,shade)
 # Wheel arches cap the wheel silhouette, so tyres are set into rather than pasted on the body.
 for x in [36,124]:
  a.p(f'{x-14},57 {x-14},53 {x-11},53 {x-11},49 {x-6},49 {x-6},47 {x+6},47 {x+6},49 {x+11},49 {x+11},53 {x+14},53 {x+14},57',dark)
  a.r(x-6,47,12,1,hi);a.r(x-11,49,4,2,hi);a.r(x+8,49,3,2,shade)
 # Door seams and handles align with each actual cabin bay, including added seats.
 for j,w in enumerate(windows):
  x=w['x'];right=x+w['width'];a.r(right+1,36,1,13,dark);a.r(right+2,36,1,13,hi)
  a.r(max(x+1,right-7),38,6,2,INK);a.r(max(x+2,right-6),38,4,1,SILVER)
 # Pitted paint, metal screws and hand-repaired sill.
 if not alien:
  for x,y in [(20,47),(56,51),(64,40),(108,47),(144,48)]:a.r(x,y,3,1,dark);a.r(x+1,y+1,2,1,'#b68159')
  a.box(61,47,21,7,dark,METAL,'#293c47');a.r(64,49,14,1,hi)
  for x in [62,79]:a.rivet(x,48)
  a.r(90,52,17,2,METAL);a.r(91,52,6,1,SILVER)
 # Type-specific silhouette and construction details.
 if key=='compact':
  if not extra:
   a.r(27,30,25,5,INK);a.r(29,29,21,4,'#667c73');a.r(31,27,16,3,'#95a08c');a.r(34,27,2,8,'#343e43');a.r(44,27,2,8,'#343e43')
  a.r(103,39,30,2,'#e5bb68');a.r(103,42,20,1,shade);a.r(13,46,9,4,dark);a.r(15,46,5,1,METAL)
 elif key=='sedan':
  a.r(48,52,65,1,SILVER);a.r(13,42,14,2,SILVER);a.r(139,43,8,5,INK)
  for y in [44,46]:a.r(140,y,6,1,METAL)
  if not extra:a.r(42,15,42,2,INK);a.r(47,11,23,4,'#615b4b');a.r(50,10,16,1,'#b7a880');a.r(52,11,2,5,'#303c3c');a.r(65,11,2,5,'#303c3c')
 elif key=='pickup':
  if not extra:
   a.r(14,29,59,8,INK);a.r(17,30,54,5,base);a.r(18,30,52,1,hi);a.r(21,32,45,2,shade)
   a.box(22,21,22,9,'#5f7065','#a1b09a','#3b514c');a.box(46,24,17,7,'#9e8153','#d0b27d','#6f6147');a.r(30,20,2,11,INK)
  a.r(49,48,53,7,dark)
  for x in [51,61,71,81,91]:a.r(x,49,3,5,METAL)
  a.r(9,34,3,18,INK);a.r(8,34,2,13,METAL)
 elif key=='van':
  a.r(18,45,125,4,'#638986');a.r(18,45,125,1,'#97b7a3');a.r(78,37,2,18,dark);a.r(91,38,5,2,INK)
  a.r(26,7,92,3,INK);a.r(29,6,88,1,METAL)
  if not extra:
   a.box(35,2,29,6,'#84775e','#c3b38b','#4b5149');a.r(40,2,2,7,'#454f48');a.r(57,2,2,7,'#454f48')
  a.r(16,20,2,22,SILVER)
 elif key=='bus':
  a.r(18,41,126,3,dark);a.r(18,47,126,2,dark);a.r(18,51,126,2,dark)
  for x in range(52,113,4):a.r(x,54,2,2,hi)
  a.r(15,3,121,4,INK);a.r(19,3,113,1,METAL)
  a.box(32,0,25,5,'#6b7867','#a8b298','#3a514c');a.box(77,0,30,5,'#8c6e51','#ccb18a','#5e5247')
  a.r(138,18,2,22,INK);a.r(141,20,4,8,INK);a.r(142,21,2,5,SILVER)
 elif key=='ambulance':
  a.r(17,41,126,6,'#9c4c4a');a.r(19,41,123,1,'#d28571');a.r(70,38,5,15,LIGHT);a.r(65,43,15,5,LIGHT)
  a.box(55,6 if not extra else 2,24,5,'#a54f50','#e99a81','#773744');a.r(66,7 if not extra else 3,3,3,'#d9ded0')
  a.r(18,50,9,2,METAL);a.r(19,53,8,1,METAL)
 elif alien:
  # Ribbed biomechanical panels, amber conduits and no familiar human livery.
  a.p('12,38 20,35 53,37 47,44 20,44',hi);a.p('56,37 85,36 100,40 91,46 59,45',shade)
  a.p('17,47 52,47 56,53 50,57 19,55',dark);a.p('60,48 95,47 111,52 99,57 63,55',dark)
  a.r(57,43,53,2,AMBER);a.r(62,43,40,1,'#ffe2a0');a.r(76,45,4,8,'#b87945');a.r(77,45,2,6,AMBER)
  for x in [19,56,94,142]:a.r(x,39,3,4,AMBER);a.r(x,39,2,1,'#ffe1a6')
  a.p('11,43 4,47 9,52 14,52 18,47',shade);a.p('144,41 157,45 153,50 145,51',shade)
  if key=='armored':
   for x in [57,68,79,90,101]:a.p(f'{x},48 {x+5},49 {x+3},56 {x-2},55',hi)
   a.r(50,7 if not extra else 2,28,4,INK);a.r(60,4 if not extra else 0,28,4,dark);a.r(79,5 if not extra else 1,21,2,hi)
  else:
   a.p('27,37 16,30 19,25 35,35',shade);a.p('120,36 138,28 144,30 132,40',hi)
   a.r(60,12 if not extra else 3,25,2,AMBER);a.r(67,10 if not extra else 1,11,2,'#efd6a0')
 # Headlamp, rear reflector and layered chrome bumpers are common shape-language.
 a.r(146,40,5,8,INK);a.r(146,41,4,5,'#bda675' if alien else '#e1d5a6');a.r(146,41,4,2,'#ffe6ac');a.r(146,47,4,1,RED)
 a.r(11,42,3,6,'#743b41');a.r(11,42,2,3,'#e88264')
 a.r(7,54,18,4,INK);a.r(8,54,16,2,METAL);a.r(9,54,10,1,SILVER);a.r(139,54,17,4,INK);a.r(140,54,14,2,METAL);a.r(142,54,10,1,SILVER)
 a.parts.append('</g>')
 # Window bezels are outside each transparent rectangle and never cover passenger pixels.
 for w in windows:
  x,y,ww,hh=w['x'],w['y'],w['width'],w['height']
  a.r(x-1,y-1,ww+2,1,INK);a.r(x-1,y+hh,ww+2,1,INK);a.r(x-1,y,1,hh,INK);a.r(x+ww,y,1,hh,INK)
  a.r(x,y-2,ww,1,hi);a.r(x+ww+1,y,1,hh,shade)
 for cx in [36,124]:wheel(a,cx,59,alien)
 return a

for k,v in M['vehicles'].items():
 vehicle(k,v,v['windows']).save(v['image'])
 for cap,variant in v['variants'].items():vehicle(k,v,variant['windows'],True).save(variant['image'])

# Equipment at 24 px: each icon is independently designed for recognition at 18 px in the HUD.
def icon(k):
 a=Art(24,24)
 if k=='fuel':
  a.p('7,1 15,1 15,4 18,4 20,7 20,21 18,23 5,23 3,21 3,7 5,5 7,5',INK);a.r(5,6,13,15,'#678e7d');a.r(6,7,10,1,'#b5cfaa');a.r(5,8,2,11,'#92b594');a.r(16,8,2,13,'#3a695e');a.r(9,3,4,2,'#99b299');a.r(8,10,7,8,'#34594e');a.r(9,12,5,4,'#7fa486');a.r(8,17,7,2,'#c5bd85');a.r(10,10,3,2,'#a7bc91')
 elif k=='medicine':
  a.r(8,1,9,4,INK);a.r(9,1,7,2,'#b1c6c0');a.r(7,5,12,17,INK);a.r(5,8,16,11,INK);a.r(8,5,10,16,'#d6d2b6');a.r(6,8,14,10,'#e8e3cd');a.r(8,7,2,12,'#fff2d6');a.r(17,8,2,12,'#929e98');a.r(7,10,12,7,'#b34f53');a.r(12,10,2,7,'#f4dfbc');a.r(10,12,6,2,'#f4dfbc')
 elif k=='scrap':
  a.p('3,14 3,8 9,4 16,6 21,13 19,19 11,22 4,20',INK);a.p('5,10 10,7 15,8 18,14 16,18 10,20 5,18','#a58b66');a.p('5,10 10,7 15,8 12,12 5,14','#d0bd91');a.p('5,15 12,13 17,11 18,15 12,18 6,18','#6d7370');a.r(10,9,2,2,'#6d7370');a.r(7,15,7,2,'#c3ccb2');a.r(18,5,3,6,INK);a.r(19,5,1,5,SILVER)
 elif k=='esp':
  a.p('12,1 18,5 20,12 16,21 12,23 7,19 3,11 6,5',INK);a.p('12,3 17,7 18,12 14,20 11,20 6,11 8,6','#9e83c4');a.p('12,3 12,19 6,11 8,6','#674f93');a.p('12,4 16,8 15,13 12,17','#e4c4f0');a.r(20,3,1,5,'#c0a1de');a.r(18,5,5,1,'#c0a1de')
 elif k=='health':
  a.p('3,5 6,3 10,3 12,6 15,3 19,3 22,6 22,12 18,17 12,23 6,18 2,12 2,7',INK);a.p('4,7 6,5 9,5 12,8 15,5 18,5 20,7 20,11 16,17 12,20 7,16 4,11','#ba5960');a.p('4,7 6,5 9,5 10,7 6,8 5,12 4,10','#f19d89');a.p('12,19 17,14 20,9 20,12 16,17 12,21','#773b55')
 elif k=='stamina':
  a.p('12,1 20,1 15,9 22,9 8,23 10,14 3,14',INK);a.p('13,3 17,3 12,11 18,11 10,19 12,12 6,12','#d5b56c');a.p('13,3 15,3 10,11 7,11','#f4d99a')
 elif k=='weapon':
  a.p('2,7 18,7 18,6 22,6 22,11 18,11 18,13 12,13 10,22 5,22 6,12 2,12',INK);a.r(4,8,17,3,'#8fa5aa');a.r(5,8,13,1,'#c6d2cb');a.r(7,12,4,8,'#91664e');a.r(7,13,2,7,'#c4a078');a.r(12,12,4,2,'#4c6877');a.r(12,14,3,1,INK);a.r(19,7,2,2,'#d3c99f')
 elif k in ['armor','shield']:
  if k=='armor':
   a.p('5,3 9,2 12,5 15,2 19,3 22,8 19,11 18,22 6,22 5,11 2,8',INK);a.p('6,5 9,4 12,7 15,4 18,5 19,8 16,10 16,20 8,20 8,10 5,8','#7b97a1');a.r(10,9,4,9,'#c1d0c5');a.r(8,11,8,2,'#405b6d');a.r(8,17,8,2,'#405b6d')
  else:
   a.p('3,3 12,1 21,3 20,16 16,20 12,23 7,20 3,15',INK);a.p('5,5 12,3 19,5 18,14 15,18 12,20 8,17 5,13','#718c96');a.p('6,5 11,4 11,18 8,15 6,12','#bad0c7');a.r(12,5,2,12,'#d9be7d');a.r(8,9,9,2,'#d9be7d')
 elif k=='accessory':
  a.p('7,2 17,2 20,6 20,11 17,15 16,22 8,22 7,15 4,11 4,6',INK);a.r(8,4,8,2,'#c4a774');a.r(6,6,2,6,'#b99b63');a.r(16,6,2,6,'#e4c991');a.r(8,12,8,2,'#b99b63');a.p('12,12 17,17 13,21 8,17','#5b8892');a.r(11,15,3,4,'#a8d5ca')
 elif k=='seat':
  a.p('4,2 13,2 15,5 13,13 21,13 23,16 21,20 18,20 18,23 15,23 15,20 7,20 7,23 4,23 4,17 2,15 2,5',INK);a.r(5,4,7,11,'#a67b59');a.r(5,4,5,2,'#dfb884');a.r(5,6,2,8,'#cda37a');a.r(6,15,14,3,'#ba9166');a.r(7,17,12,2,'#68594e');a.r(14,14,6,1,'#e1c59b')
 elif k=='radio':
  a.r(3,7,19,15,INK);a.r(5,9,15,11,'#647e7a');a.r(5,9,15,1,'#adc3ac');a.r(6,11,8,7,INK)
  for x in [7,9,11]:a.r(x,12,1,5,'#92b2a8')
  a.r(16,11,3,3,'#d2bc84');a.r(17,16,2,2,'#c8d4bd');a.r(5,3,2,5,INK);a.r(6,1,1,6,METAL)
 elif k=='book':
  a.p('4,2 19,2 21,4 21,21 19,23 4,23 2,21 2,4',INK);a.r(4,3,14,18,'#9b6855');a.r(5,4,2,15,'#d09e72');a.r(8,4,9,1,'#c58c68');a.r(18,5,2,15,'#ded5b0');a.r(6,21,13,1,'#c9c9af');a.r(9,8,7,1,'#e1bd83');a.r(9,11,5,1,'#e1bd83');a.r(9,15,7,1,'#d4a274')
 elif k=='chest':
  a.p('3,8 6,4 18,4 21,8 21,21 3,21',INK);a.r(5,9,14,10,'#8d6548');a.r(7,5,10,2,'#b98e57');a.r(5,7,14,3,'#bb905d');a.r(5,11,14,2,'#3a3f3c');a.r(6,8,2,11,'#d0b578');a.r(16,8,2,11,'#d0b578');a.r(10,10,4,6,INK);a.r(11,11,2,4,'#e2cd8c');a.r(5,17,14,1,'#ba8b58')
 elif k=='sleep':
  a.r(2,10,3,13,INK);a.r(20,13,3,10,INK);a.r(5,14,15,7,'#586d78');a.r(5,13,6,4,'#ddd8be');a.r(11,14,9,4,'#87a79b');a.r(5,19,15,2,METAL);a.r(14,2,7,2,'#c6b38a');a.r(17,4,2,2,'#c6b38a');a.r(14,6,7,2,'#c6b38a');a.r(7,7,4,1,'#9cae9e');a.r(9,8,1,2,'#9cae9e');a.r(7,10,4,1,'#9cae9e')
 elif k=='dice':
  a.p('5,2 18,2 22,6 22,19 18,23 5,23 1,19 1,6',INK);a.r(4,5,16,15,'#c5bf9c');a.r(6,3,11,2,'#f0e6c4');a.r(3,6,2,12,'#e9dfbd');a.r(18,6,2,13,'#908f81');a.r(5,19,13,2,'#7d8781')
  for x,y in [(6,7),(14,7),(10,11),(6,15),(14,15)]:a.r(x,y,3,3,'#344d5b');a.r(x,y,2,1,'#233844')
 return a
for k,path in M['icons'].items():icon(k).save(path)

for k,path in M['mods'].items():
 a=Art(48,24)
 if k=='gun':
  a.p('10,22 10,18 17,16 20,11 29,11 32,17 38,18 38,22',INK);a.r(13,18,22,3,'#597271');a.r(16,17,16,1,SILVER);a.r(22,8,7,10,'#7d9890');a.r(23,9,2,6,'#bfd1b7');a.r(25,6,19,6,INK);a.r(26,7,18,3,'#586e79');a.r(28,7,13,1,SILVER);a.r(42,5,5,8,INK);a.r(43,6,3,2,'#c1b994');a.r(19,5,9,5,'#344955');a.r(20,5,6,1,METAL)
 elif k=='armor':
  a.p('2,11 7,6 21,9 28,5 43,8 46,13 43,23 6,22',INK);a.p('5,12 9,9 21,12 29,8 41,11 43,14 41,20 8,19','#647877');a.p('9,9 21,12 20,15 8,13','#b3bda5');a.p('29,8 41,11 40,14 28,12','#a2b1a1');a.r(21,13,2,7,'#263c47')
  for x,y in [(8,15),(16,17),(28,15),(38,17)]:a.rivet(x,y)
 elif k=='seat':
  a.p('13,1 25,1 29,5 27,15 36,15 39,18 36,22 18,22 12,18 11,5',INK);a.r(15,3,10,12,'#9c7757');a.r(16,3,7,2,'#deb88b');a.r(15,6,2,8,'#bc9875');a.r(17,15,18,4,'#b8926e');a.r(18,16,16,1,'#ddbd91');a.r(18,20,17,2,'#536b70');a.r(19,22,3,2,INK);a.r(31,22,3,2,INK)
 else:
  a.r(20,14,7,9,INK);a.r(22,14,3,7,METAL);a.r(14,5,19,11,INK);a.r(16,6,15,8,'#658d8b');a.r(17,6,12,2,'#b8cfbf');a.r(29,7,6,7,'#baab75');a.r(31,8,4,5,'#fff0b5');a.r(17,9,11,3,'#365662');a.r(21,21,10,2,'#98aea3')
 a.save(path)

paths=[v['image'] for v in M['vehicles'].values()]+[x['image'] for v in M['vehicles'].values() for x in v['variants'].values()]+list(M['icons'].values())+list(M['mods'].values())
for path in paths:
 node=ET.parse(A/path).getroot();assert node.attrib['shape-rendering']=='crispEdges'
assert len(paths)==48
print(f'Redrawn {len(paths)} assets: 28 vehicles, 16 equipment icons, 4 modification icons; all SVG XML valid. Windows unchanged.')
