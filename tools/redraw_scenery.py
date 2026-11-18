"""Second-edition authored pixel scenery: occupied Earth, human salvage, alien grafts."""
from pathlib import Path
import json,random,html,math
ROOT=Path(__file__).resolve().parents[1];A=ROOT/'dist/assets'
INK='#111923';DEEP='#202936';MID='#445361';STEEL='#73858b';LIGHT='#bdc7b6';RUST='#ad634c';GOLD='#e4b46b';MINT='#76c6b7';VIOLET='#605474'
class Art:
 def __init__(self,w=320,h=224):self.w=w;self.h=h;self.s=[]
 def r(self,x,y,w,h,c):
  if w>0 and h>0:self.s.append(f'<rect x="{int(x)}" y="{int(y)}" width="{int(w)}" height="{int(h)}" fill="{c}"/>')
 def p(self,pts,c):self.s.append(f'<polygon points="{pts}" fill="{c}"/>')
 def line(self,pts,c,w=2):self.s.append(f'<polyline points="{pts}" fill="none" stroke="{c}" stroke-width="{w}" stroke-linejoin="miter"/>')
 def t(self,x,y,label,c=LIGHT,size=12):self.s.append(f'<text x="{x}" y="{y}" font-family="monospace" font-size="{size}" font-weight="bold" fill="{c}">{html.escape(label)}</text>')
 def panel(self,x,y,w,h,c=MID):
  self.r(x,y,w,h,INK);self.r(x+2,y+2,w-4,h-4,c);self.r(x+3,y+2,w-6,2,LIGHT);self.r(x+3,y+h-5,w-6,3,DEEP)
 def glyph(self,x,y,scale=1):
  self.p(f'{x},{y+7*scale} {x+7*scale},{y} {x+14*scale},{y+7*scale} {x+7*scale},{y+14*scale}',GOLD);self.r(x+5*scale,y+4*scale,4*scale,6*scale,DEEP)
 def crate(self,x,y,w=45,h=32,c='#80644f',med=False):
  self.p(f'{x},{y+6} {x+8},{y} {x+w-6},{y} {x+w},{y+5} {x+w},{y+h} {x},{y+h}',INK);self.r(x+3,y+6,w-6,h-9,c);self.r(x+7,y+2,w-14,4,LIGHT);self.r(x+6,y+10,w-12,2,'#ad8d67');self.r(x+6,y+h-9,w-12,2,DEEP)
  for xx in [x+9,x+w-12]:self.r(xx,y+6,3,h-8,STEEL);self.r(xx+1,y+10,1,3,LIGHT)
  self.panel(x+w//2-4,y+h//2-3,8,9,GOLD)
  if med:self.r(x+w//2-3,y+10,6,18,'#e5ddd1');self.r(x+w//2-9,y+16,18,6,'#e5ddd1')
 def barrel(self,x,y,c=RUST):
  self.p(f'{x+5},{y} {x+30},{y} {x+35},{y+5} {x+35},{y+44} {x+30},{y+49} {x+5},{y+49} {x},{y+44} {x},{y+5}',INK);self.r(x+3,y+5,29,39,c);self.r(x+5,y+2,25,5,STEEL);self.r(x+6,y+8,4,33,'#c99b70');self.r(x+3,y+13,29,4,DEEP);self.r(x+3,y+35,29,4,DEEP);self.r(x+3,y+44,29,3,STEEL);self.r(x+20,y+4,6,3,INK)
 def conduit(self,x,y,h=73):
  self.p(f'{x},{y+h} {x+4},{y+11} {x+12},{y} {x+22},{y+9} {x+26},{y+h}',INK);self.p(f'{x+5},{y+h-3} {x+8},{y+13} {x+13},{y+6} {x+18},{y+13} {x+21},{y+h-3}',VIOLET);self.r(x+11,y+15,3,h-25,GOLD);self.r(x+10,y+h-21,8,3,MINT)
 def texture(self,x,y,w,h,seed,col='#51616a',count=30):
  rng=random.Random(seed)
  for i in range(count):self.r(x+rng.randrange(max(1,int(w))),y+rng.randrange(max(1,int(h))),rng.choice([1,2,3,5]),1,col)
 def save(self,path):
  p=A/path;p.parent.mkdir(exist_ok=True,parents=True);p.write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="{self.w}" height="{self.h}" viewBox="0 0 {self.w} {self.h}" shape-rendering="crispEdges" data-art-edition="occupation-2">'+''.join(self.s)+'</svg>')
def sign(a,x,y,w,label,c=GOLD):
 a.panel(x,y,w,26,DEEP);a.r(x+4,y+4,3,18,c);a.t(x+14,y+18,label,c,11)
def glass(a,x,y,w,h):
 a.panel(x,y,w,h,INK);a.r(x+3,y+4,w-6,h-7,'#355563');a.p(f'{x+4},{y+5} {x+w-7},{y+5} {x+5},{y+h-5}', '#507a83');a.r(x+6,y+7,w-13,2,'#89b0ad');a.r(x+w//2,y+4,2,h-7,DEEP)
def building(a,k,n):
 tint=['#7e8173','#7c7473','#6d7c7e','#7c6b64'][n%4]
 a.p('29,204 13,196 13,66 43,44 281,44 298,61 298,203',INK)
 a.p('18,69 44,51 44,196 18,196','#364453');a.r(44,57,247,140,tint);a.r(45,59,242,5,'#b1ad91');a.r(47,183,243,14,'#4e5c5c')
 for y in range(76,181,15):
  a.r(46,y,243,1,'#626e69')
  for x in range(47+(y%2)*15,285,33):a.r(x,y,1,14,'#69726a')
 a.texture(47,68,238,115,n,'#8b8c7b',65)
 a.p('9,59 40,35 286,35 306,54 305,66 11,66',INK);a.p('16,56 44,41 282,41 299,55',RUST);a.r(14,58,289,5,'#d28a62');a.r(49,44,229,2,'#ce9777')
 glass(a,58,98,83,55);a.r(54,153,92,6,DEEP);a.r(59,156,78,3,LIGHT)
 a.panel(197,92,65,105,INK);glass(a,203,99,51,49);a.r(204,153,49,37,'#3f555b');a.r(245,151,3,13,GOLD);a.r(197,197,66,4,LIGHT)
 for x in [54,144,270]:a.r(x,70,4,114,DEEP);a.r(x+1,70,2,75,STEEL)
 labels={'gas':'FUEL','motel':'MOTEL','garage':'GARAGE','clinic':'CLINIC','pharmacy':'MEDICAL','warehouse':'DEPOT','shop':'SUPPLY','solar':'POWER'}
 sign(a,83,25,131,labels.get(k,'DEPOT'),GOLD if k not in ['clinic','pharmacy'] else MINT)
 # An occupation transponder grafted onto human architecture, not a generic alien city.
 a.r(264,8,3,30,STEEL);a.panel(252,6,29,20,VIOLET);a.glyph(259,9);a.r(267,29,2,8,MINT)
 a.crate(20,174,34,28);a.r(47,84,6,25,RUST);a.r(281,122,8,61,RUST)
 if k=='gas':
  for x in [123,263]:
   a.panel(x,137,29,65,'#984e45');glass(a,x+4,143,21,17);a.r(x+8,166,14,3,GOLD);a.r(x+5,181,19,13,'#663f3d');a.line(f'{x+30},152 {x+39},156 {x+39},188 {x+33},192',INK,5);a.r(x+30,151,5,13,STEEL)
  a.r(43,204,248,3,'#867c66')
 elif k=='garage':
  a.panel(57,87,126,111,INK)
  for y in range(91,118,6):a.r(61,y,119,4,STEEL)
  a.r(66,122,3,73,RUST);a.r(170,122,3,73,RUST);a.panel(83,166,77,27,'#557078');a.r(90,155,59,11,DEEP);a.r(88,190,17,8,INK);a.r(140,190,17,8,INK);a.r(95,170,53,2,LIGHT)
 elif k in ['clinic','pharmacy']:
  a.panel(153,101,31,35,'#344c4c');a.r(165,106,7,24,MINT);a.r(157,114,23,7,MINT)
 elif k=='motel':
  a.r(62,103,72,3,GOLD);a.r(76,108,4,36,'#a86657');a.r(124,108,4,36,'#a86657');sign(a,161,159,29,'Z',MINT)
 elif k=='solar':
  for x in [23,70]:a.p(f'{x},73 {x+37},73 {x+47},101 {x-9},101',INK);a.p(f'{x+2},76 {x+35},76 {x+42},96 {x-4},96','#385477');a.r(x+5,78,2,17,MINT);a.r(x+24,78,2,17,MINT)
 elif k=='warehouse':a.panel(54,91,127,104,'#435663');[a.r(59+i*14,94,3,99,STEEL) for i in range(9)]
def cargo(a,k,n):
 if k in ['locker','shelf','safe']:
  a.panel(79,35,163,167,'#596575');a.r(85,42,7,151,LIGHT);a.r(229,42,6,151,DEEP)
  if k=='safe':
   a.panel(99,51,124,137,DEEP);a.panel(105,57,112,125,'#677785');a.p('157,92 171,100 176,116 168,132 154,137 140,129 136,113 143,99',INK);a.r(151,103,13,25,LIGHT);a.r(144,111,29,7,LIGHT);a.r(120,72,6,5,GOLD);a.r(209,91,9,34,INK)
  elif k=='locker':
   for x in [97,163]:
    a.panel(x,45,61,145,'#78838a');[a.r(x+9,56+j*7,43,2,DEEP) for j in range(4)];a.r(x+46,113,4,15,GOLD);a.r(x+9,150,23,16,'#b2b294')
  else:
   for y in [87,139,190]:a.r(91,y,135,6,STEEL)
   for i in range(6):a.crate(97+i%3*42,54+i//3*52,34,31,['#647c78',RUST,'#8a795d'][i%3])
 elif k in ['bag','luggage','coat']:
  a.p('82,194 76,167 82,100 98,82 160,80 184,109 191,187 173,203 100,203',INK);a.p('86,166 91,104 103,91 152,89 174,113 180,184 170,195 98,195','#697967');a.r(112,74,29,7,DEEP);a.r(105,97,5,90,'#b99b6d');a.r(156,100,5,87,'#b99b6d');a.panel(111,142,43,39,'#4a645c');a.r(125,145,12,5,GOLD);a.crate(191,164,55,38,'#8d6654')
  if k=='coat':a.p('96,80 119,68 145,70 175,84 199,139 178,150 166,126 171,199 95,199 102,123 85,146 65,137','#7d685e');a.r(131,84,4,104,LIGHT)
 else:
  col={'medicalbox':'#995e56','toolbox':'#536b7d','gift':'#557e71','cache':'#4e6d66'}.get(k,'#866a50')
  a.crate(61,130,140,72,col,k=='medicalbox');a.crate(203,160,59,42,'#586d6d');a.crate(80,94,73,36,'#ab8b59')
  if k=='toolbox':a.r(104,113,43,6,INK);a.r(104,118,7,13,STEEL);a.r(140,118,7,13,STEEL)
  if k=='gift':a.r(119,135,12,61,GOLD);a.r(65,158,133,8,GOLD)
def event(k,n,interior,empty):
 a=Art();rng=random.Random(n*71+len(k));a.p('15,206 47,198 267,198 306,211 280,219 43,219', '#131e2780')
 for i in range(16):a.r(rng.randrange(18,300),rng.randrange(202,214),rng.choice([2,3,6,9]),2,['#566369','#8b866b','#344754'][i%3])
 if k in ['gas','motel','garage','clinic','pharmacy','warehouse','shop','solar']:building(a,k,n)
 elif k in ['checkpoint','toll']:
  a.conduit(36,51,151);a.conduit(268,41,163);a.p('31,47 57,28 279,28 296,45 294,57 31,57',INK);a.r(59,33,207,5,VIOLET);a.r(65,43,194,3,GOLD);a.glyph(155,11,2);a.panel(61,104,65,98,'#4c5d67');glass(a,68,114,50,35);a.r(128,162,150,8,RUST)
  for i in range(11):a.p(f'{130+i*13},162 {136+i*13},162 {131+i*13},170 {125+i*13},170',GOLD)
  sign(a,174,111,80,'CONTROL',GOLD)
 elif k=='container':
  a.panel(24,78,273,125,'#617f80');[a.r(31+i*17,85,4,109,'#3b5966') for i in range(16)];a.r(210,82,5,117,LIGHT);a.r(271,82,5,117,LIGHT);a.r(223,133,7,19,DEEP);sign(a,48,110,98,'CARGO');a.glyph(163,116,2)
 elif k in ['stall','market','books','bookvan']:
  for x in [45,264]:a.r(x,65,5,136,'#465564');a.r(x+1,67,2,131,LIGHT)
  a.p('29,81 61,42 245,42 288,81',INK);a.p('35,77 64,47 242,47 280,77','#9f6c55')
  for x in range(60,260,31):a.p(f'{x},48 {x+13},48 {x+23},76 {x+4},76','#ccaf7d')
  a.r(34,79,247,13,DEEP);[a.r(39+i*25,80,20,6,'#c49b72') for i in range(10)];a.panel(42,163,235,40,'#66564d');a.r(35,157,248,8,LIGHT)
  for i in range(7):a.crate(52+i*30,130-i%2*11,25,24,['#667b70',RUST,'#a18a5c'][i%3])
  if k in ['books','bookvan']:
   for i in range(18):a.r(48+i*12,136-i%3*7,9,22,[RUST,STEEL,'#aa9467'][i%3]);a.r(49+i*12,142-i%3*7,7,2,LIGHT)
  a.r(72,103,173,1,GOLD);a.r(83,99,6,8,GOLD);a.r(239,99,6,8,GOLD)
 elif k in ['crate','luggage','toolbox','medicalbox','locker','shelf','safe','cache','bag','coat','gift']:cargo(a,k,n)
 elif k in ['ambulance','car','rescue','tanker','convoy','cars','motorcycle','bus','chase','truck','wreck','scrapyard']:
  model={'ambulance':'ambulance','tanker':'pickup','bus':'bus','truck':'van','convoy':'armored','chase':'armored','cars':'sedan','motorcycle':'compact','wreck':'pickup','scrapyard':'van'}.get(k,'sedan')
  # Incorporate the newly authored vehicle shapes once those assets exist, at generation time.
  import re
  path=A/'vehicles'/f'{model}.svg'
  if path.exists():
   inner=re.sub(r'^.*?<svg[^>]*>','',path.read_text(),count=1,flags=re.S).rsplit('</svg>',1)[0];a.s.append('<g transform="translate(10 73) scale(1.85)">'+inner+'</g>')
  if k in ['scrapyard','wreck']:a.p('80,139 103,148 93,159 114,172',LIGHT);a.crate(185,109,61,31);a.r(81,180,50,3,RUST);a.barrel(17,156)
  if k=='tanker':a.panel(24,102,164,66,'#788887');a.r(47,106,6,58,LIGHT);a.r(157,106,6,58,LIGHT);a.glyph(93,121,2)
 elif k in ['fuel','barrel','generator','leak','engine','stove','fire']:
  a.barrel(66,153);a.barrel(104,143,'#5f7c74');a.barrel(232,155)
  if k in ['generator','engine','stove']:
   a.panel(86,102,156,98,'#5b7077');a.panel(96,113,50,70,DEEP)
   for y in range(120,178,8):a.r(101,y,40,3,STEEL)
   a.panel(156,115,73,27,INK);a.r(165,122,49,4,MINT);a.r(165,131,32,3,MINT);a.r(161,154,20,18,RUST);a.r(194,153,24,21,DEEP);a.r(210,73,10,30,INK);a.r(213,76,4,27,STEEL)
  if k=='leak':a.p('51,204 138,194 252,205 221,216 69,216','#6a644c');a.r(81,205,119,2,'#aaa078')
 elif k in ['radio','terminal','alarm','lamp']:
  a.panel(73,89,173,109,'#596875');a.panel(85,102,144,70,INK);a.r(91,108,132,57,'#254452');a.line('99,141 113,141 120,123 127,152 137,133 145,141 211,141',MINT,2);a.r(96,114,37,3,GOLD);a.r(192,118,23,3,MINT);a.r(91,180,99,3,LIGHT)
  for x in [201,216,231]:a.r(x,179,7,8,GOLD)
  a.r(118,45,4,44,STEEL);a.p('92,34 151,34 141,62 121,69 100,58',DEEP);a.line('96,38 146,38 139,56 121,63 104,55',STEEL,2);a.conduit(259,62,137)
  if k=='lamp':a.s=[];a.r(158,0,4,77,DEEP);a.p('132,75 188,75 208,113 113,113',INK);a.p('139,81 181,81 199,108 122,108',RUST);a.r(129,111,65,5,GOLD);a.p('129,117 195,117 276,214 42,214','#edc07816')
 elif k in ['sign','memorial','map','paper','book','poster','mural']:
  a.r(63,88,8,116,DEEP);a.r(250,88,8,116,DEEP);a.panel(43,42,235,132,'#716e60');a.r(54,52,213,111,'#c1b58d');a.r(58,58,206,4,RUST)
  if k=='sign':a.p('91,97 190,97 190,78 226,109 190,138 190,119 91,119',DEEP);a.t(65,81,'EAST',DEEP,12)
  elif k=='memorial':a.r(112,74,99,4,DEEP);[a.r(90,96+i*11,140-(i%3)*16,2,'#747769') for i in range(5)];a.r(151,175,4,23,GOLD);a.r(146,194,15,6,RUST)
  else:
   for i in range(11):a.r(65+i%2*96,76+i//2*14,53+i%4*7,2,'#6b7568')
   a.line('78,146 102,121 129,134 155,93 183,101 226,78',RUST,3);a.glyph(232,137)
 elif k in ['bridge','bridgegift','pit','mud','ice','flood']:
  a.p('12,161 80,158 118,181 165,173 214,161 306,171 298,212 29,216',INK);a.p('25,177 92,171 130,198 193,179 296,185 292,211 31,211','#244451')
  if k in ['bridge','bridgegift']:
   for x,w in [(16,103),(222,82)]:
    a.panel(x,128,w,29,'#727d7d');a.r(x+11,158,16,49,DEEP);a.r(x+w-28,158,12,47,DEEP)
    for xx in range(x+6,x+w,26):a.r(xx,82,5,46,STEEL)
    a.r(x+5,83,w-9,4,LIGHT);a.r(x+5,103,w-9,3,STEEL)
   a.p('112,128 119,128 144,146 118,157 104,154',DEEP);a.line('122,154 158,178 193,180 223,157',STEEL,2)
   if k=='bridgegift':a.crate(37,97,54,32)
  elif k=='pit':a.p('27,163 83,153 121,168 164,158 201,174 251,162 298,176 259,192 213,186 161,202 100,182 52,193',DEEP)
  elif k=='ice':a.p('26,173 100,166 162,185 242,173 291,189 250,208 171,199 93,211 32,194','#95b5bb');a.line('101,171 130,184 114,202 154,196 176,202',LIGHT,2)
  elif k=='mud':a.p('30,176 104,165 181,185 246,173 293,194 242,213 98,212','#6c604e')
  else:
   for i in range(14):a.r(28+i%5*50,178+i//5*11,34,2,['#77a0a2','#b1c2af'][i%2])
 elif k in ['spikes','glass','bomb','trap','electric','vines','tree','rocks','stairs','door','tires']:
  if k in ['tree','vines']:
   a.p('31,191 73,167 88,112 78,77 89,73 108,118 108,150 175,119 219,69 230,74 203,120 276,143 270,155 193,145 110,182 46,212',INK);a.p('40,193 99,168 99,111 89,82 104,115 105,162 183,135 222,79 198,135 266,148 197,144 104,178 46,206','#746254');a.line('58,195 113,175 198,137', '#b29066',3)
   if k=='vines':a.line('37,205 68,162 120,167 142,113 202,124 238,72',MINT,7);a.glyph(138,107)
  elif k=='door':a.panel(81,22,164,182,'#596c74');a.panel(94,33,138,170,'#304553');a.r(98,45,129,5,STEEL);a.r(97,90,131,11,RUST);a.r(97,159,131,11,RUST);a.r(201,112,7,26,GOLD);a.glyph(145,52,2)
  elif k=='stairs':
   for i in range(7):a.panel(43+i*31,68+i*19,33,136-i*19,'#596e76');a.r(43+i*31,68+i*19,33,4,LIGHT)
  elif k=='electric':a.conduit(84,19,186);a.line('97,21 146,58 120,105 227,179',INK,5);a.line('143,58 132,78 148,89 136,106',GOLD,3);a.panel(231,154,43,49,DEEP);a.glyph(246,167)
  elif k in ['bomb','trap']:a.crate(114,156,95,47,DEEP);a.panel(129,162,52,19,RUST);a.t(138,176,'00:17',GOLD,10);a.r(28,197,269,1,LIGHT);a.line('190,163 212,136 228,145 220,188',GOLD,2)
  elif k=='tires':
   for i in range(9):
    x=55+i%5*37;y=170-i//5*38;a.p(f'{x+8},{y} {x+23},{y} {x+31},{y+8} {x+31},{y+25} {x+23},{y+32} {x+8},{y+32} {x},{y+24} {x},{y+9}',INK);a.panel(x+9,y+9,14,14,STEEL)
  else:
   for i in range(8):
    x=13+i*35;y=134+rng.randrange(40);a.p(f'{x},204 {x+6},{y+8} {x+21},{y} {x+34},{y+15} {x+39},204',INK);a.p(f'{x+5},198 {x+9},{y+10} {x+21},{y+6} {x+30},{y+16} {x+34},198',LIGHT if k in ['glass','spikes'] else '#65736f');a.p(f'{x+21},{y+6} {x+30},{y+16} {x+34},198 {x+24},189',STEEL)
 elif k in ['nest','eggs','spores','swarm','beast','infected','soldier','turret','robot','sniper','bandit','gunfight']:
  if k in ['nest','eggs','spores','swarm']:
   for j in range(7):
    x=23+j*39;y=129-j%3*14;a.line(f'{x},210 {x+8},185 {x+22},180 {x+31},159',VIOLET,9);a.p(f'{x+3},{y+51} {x},{y+18} {x+7},{y+3} {x+20},{y-3} {x+33},{y+9} {x+38},{y+30} {x+30},{y+51}',INK);a.p(f'{x+6},{y+43} {x+5},{y+19} {x+12},{y+8} {x+21},{y+4} {x+29},{y+13} {x+32},{y+31} {x+26},{y+44}', '#786781');a.r(x+13,y+15,4,18,MINT);a.r(x+18,y+11,3,9,LIGHT);a.line(f'{x+30},{y+28} {x+20},{y+27} {x+19},{y+47}', '#433a58',3)
  else:
   a.crate(29,161,69,43,DEEP);a.crate(230,168,62,35);a.conduit(260,51,116);a.r(81,186,173,13,DEEP);a.r(94,179,146,6,STEEL)
   if k=='turret':a.conduit(141,96,90);a.panel(123,86,78,41,VIOLET);a.r(180,95,80,9,INK);a.r(188,96,70,3,STEEL);a.glyph(143,94)
 elif k in ['traveler','camp','bed','bath','furniture','office','partition','corridor','empty','dark']:
  if k=='camp':
   a.p('24,205 106,57 148,53 265,205',INK);a.p('35,199 111,64 146,61 253,198','#647d70');a.p('94,198 130,89 184,198',DEEP);a.line('37,193 111,66 150,65 248,193',LIGHT,2);a.crate(246,173,52,32);a.r(72,195,4,16,STEEL);a.barrel(12,161)
  elif k in ['bed','bath']:
   a.panel(47,142,224,54,'#6d7779');a.r(52,194,7,14,STEEL);a.r(255,194,7,14,STEEL);a.r(49,124,7,72,RUST);a.r(264,124,6,72,RUST);a.panel(62,134,49,19,'#c8c5a5');a.r(115,145,145,37,'#677b8b');a.r(122,149,124,4,'#9aa9a6');a.r(122,173,124,3,DEEP)
  elif k=='traveler':a.panel(38,171,118,15,'#8f6c50');a.r(47,185,7,20,DEEP);a.r(143,185,7,20,DEEP);a.r(242,69,5,134,STEEL);sign(a,189,53,113,'EAST  →');a.crate(169,177,49,29)
  else:
   a.panel(75,23,174,183,'#4b606a');a.panel(90,37,144,166,INK);a.r(98,45,127,4,STEEL);a.r(99,181,127,3,'#344b57');a.r(216,103,5,18,GOLD);a.crate(23,177,65,28);a.r(257,77,20,74,'#b5ac87');a.glyph(260,87)
 else:
  a.conduit(237,32,174);a.crate(46,166,97,39);a.barrel(173,156);a.line('250,42 287,66 272,141',DEEP,3)
 if empty:
  # Explicitly empty containers retain their silhouette, with an unlit open cavity.
  a.panel(97,77,120,101,INK);a.r(103,169,107,3,STEEL)
 a.texture(25,203,270,9,n,'#9a917a',18)
 return a
manifest=json.loads((A/'encounters.json').read_text())
for idx,(key,m) in enumerate(manifest.items()):event(m['kind'],idx+1,m['interior'],m['empty']).save(Path(m['image']))
# Original full-resolution interiors, used as actual stage backgrounds as well as the gallery.
for idx,name in enumerate(['warehouse','clinic','garage','shop','hotel','laboratory','ruin','nest']):
 a=Art(384,240);a.r(0,0,384,240,INK);a.r(0,0,384,151,'#2b3b49');a.r(0,151,384,89,'#35464e')
 for y in range(17,151,21):a.r(0,y,384,1,'#44565f');[a.r(x,y,1,20,'#3c4c56') for x in range((y%2)*20,384,48)]
 for x in [6,112,277,370]:a.panel(x,0,9,156,'#435762')
 for y in [159,173,194,225]:a.r(0,y,384,1,'#506264')
 for x in range(-300,700,66):a.line(f'192,152 {x},240','#4b5e60',1)
 a.panel(286,34,69,119,INK);a.r(292,40,57,109,'#354a55');a.r(337,92,3,15,GOLD);a.panel(23,29,78,64,INK);a.r(28,34,68,54,'#536f79');a.p('29,36 93,36 29,86','#6d8d91');a.r(61,33,3,55,DEEP);a.r(26,60,70,3,DEEP)
 a.r(165,0,3,34,STEEL);a.panel(148,33,37,7,GOLD);a.p('150,43 185,43 245,152 88,152','#e8bd7410');a.panel(241,16,22,18,VIOLET);a.glyph(245,18)
 a.texture(0,0,384,151,idx,'#4b5c60',65);a.texture(0,158,384,81,idx+28,'#62716e',70)
 if name in ['clinic','laboratory']:a.panel(118,54,57,58,'#68837f');a.r(141,65,9,34,MINT);a.r(129,77,34,9,MINT)
 if name=='nest':
  for x in [0,92,182,264,356]:a.line(f'{x},0 {x+20},51 {x-3},98 {x+24},152','#5f526c',9);a.r(x+19,47,3,18,MINT)
 elif name=='ruin':a.p('97,0 163,0 149,51 126,69 116,38',INK);a.line('130,66 161,92 141,131',INK,3)
 elif name=='garage':a.panel(121,59,137,49,INK);[a.r(132+i*19,69,4,22,STEEL) for i in range(6)]
 elif name=='hotel':a.r(25,37,10,48,RUST);a.r(88,37,10,48,RUST);a.r(123,76,60,32,'#8a7862')
 elif name=='shop':a.panel(121,66,137,17,'#8b785d');a.r(126,59,124,7,RUST)
 a.save(Path('scenes')/(name+'.svg'))
# Legacy stand-alone scene references are also replaced, including title and ending art.
for scene in ['salt','city','forest','alien','oasis']:
 for period,sky in [('dawn','#594d69'),('morning','#6f9098'),('afternoon','#a17c71'),('night','#151f38')]:
  a=Art(384,160);a.r(0,0,384,160,sky);a.r(0,88,384,44,'#384f59');a.r(0,132,384,28,'#263440')
  for j in range(3):
   pts=[(0,124)]+[(x,80+int(18*math.sin(x*.025+j)+j*9)) for x in range(0,385,12)]+[(384,132),(0,132)];a.p(' '.join(f'{x},{y}' for x,y in pts),['#617784','#4c6370','#344e5c'][j])
  for x in range(4,384,53):
   if scene=='forest':a.line(f'{x},129 {x+9},75 {x-7},56 {x+10},74 {x+21},50','#354755',4);a.r(x+15,70,10,3,MINT)
   elif scene in ['city','alien']:a.conduit(x,45+x%27,86-x%27)
   elif scene=='oasis':a.p(f'{x-10},126 {x+12},72 {x+33},126','#456e62');a.p(f'{x-7},109 {x+12},64 {x+29},110','#668b70')
   else:a.texture(x,118,45,10,x,LIGHT,6)
  # Angular carrier in every scene anchors the occupation, even far from the cities.
  a.p('125,29 153,19 212,19 252,34 219,46 159,46 125,36',INK);a.p('133,30 155,24 210,24 241,34 215,40 160,40','#47536d');a.r(167,42,47,3,GOLD);a.r(180,29,35,2,STEEL)
  a.r(0,136,384,1,STEEL);[a.r(x,150,32,2,'#a4a58a') for x in range(0,384,65)];a.texture(0,137,384,22,7,'#53626a',60)
  if period=='night':a.r(0,0,384,160,'#09112766');[a.r(i*31%384,i*17%59,1,1,LIGHT) for i in range(19)]
  a.save(Path('scenes')/(scene+'_'+period+'.svg'))
# Moving foreground elements share the same visual language.
a=Art(96,64);a.p('3,27 24,15 40,18 50,11 64,18 88,18 94,32 80,43 58,38 48,47 32,39 12,40',INK);a.p('10,28 25,22 40,25 51,18 64,25 83,24 87,31 76,36 58,32 48,39 33,32 15,34',VIOLET);a.r(35,25,27,6,STEEL);a.r(42,31,14,7,GOLD);a.r(17,33,12,2,MINT);a.r(66,32,14,2,MINT);a.save(Path('occupation/drone.svg'))
a=Art(48,128);a.conduit(9,9,111);a.panel(3,28,40,27,DEEP);a.glyph(16,34);a.r(17,65,3,39,GOLD);a.save(Path('occupation/pylon.svg'))
a=Art(240,80);a.p('8,34 49,17 97,17 113,8 148,8 167,18 198,19 231,33 218,49 179,56 62,56 31,48',INK);a.p('22,34 53,23 99,23 115,15 145,15 165,25 195,25 217,35 197,42 64,44 36,41','#3d4059');a.r(60,46,128,4,'#756282');a.r(91,51,67,5,GOLD);a.r(104,22,48,3,STEEL)
for x in range(56,198,15):a.r(x,33,8,2,'#827591')
a.save(Path('occupation/carrier.svg'))
print('Redrew 202 encounter props, 28 stage images, 3 occupation sprites.')
