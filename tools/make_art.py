"""Original deterministic pixel art. Integer-aligned SVG pixels, no external dependencies."""
import json, random, html
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; A=ROOT/'dist/assets'; A.mkdir(parents=True,exist_ok=True)
CAT=json.loads((ROOT/'spec/npc-catalog.json').read_text())
INK='#121b29'; PALE='#e4d3a4'; TEAL='#67c6b1'; RED='#d66c65'
class Art:
 def __init__(self,w,h):self.w=w;self.h=h;self.parts=[]
 def r(self,x,y,w,h,c):self.parts.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{c}"/>')
 def p(self,points,c):self.parts.append(f'<polygon points="{points}" fill="{c}"/>')
 def save(self,path):
  p=A/path;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {self.w} {self.h}" width="{self.w}" height="{self.h}" shape-rendering="crispEdges">'+''.join(self.parts)+'</svg>');return str(path)
 def paste(self,other,x,y):self.parts.append(f'<g transform="translate({x} {y})">'+''.join(other.parts)+'</g>')
skins=['#be9471','#91b8b8','#91a568','#a9b8c4','#ae8963','#b9885b','#bca3c7','#8fc7d5','#7eafa5','#ad96be','#a5ae80','#c3d796']
clothes=['#b88e53','#76949a','#ded6b0','#718068','#bca06b','#b77e73','#9a816c','#c5a04c','#bfc3c4','#686d95','#7a8d63','#6e8195','#be7957','#b7a5a4','#a0b0a4','#968977','#976854','#acb69d','#bc9c54','#a47c9a']
def head(i):
 a=Art(16,16);s=skins[i]
 a.r(3,3,10,11,INK);a.r(4,4,8,9,s);a.r(5,13,6,2,s)
 if i==0:
  a.r(3,2,9,4,'#5d4740');a.r(3,5,2,3,'#5d4740')
 elif i==1:
  a.r(4,1,8,4,s);a.r(3,4,10,6,s);a.p('4,6 7,7 6,10 4,9',INK);a.p('12,6 9,7 10,10 12,9',INK)
 elif i==2:
  a.r(1,7,4,5,s);a.r(10,2,4,4,'#d1b486');a.r(5,6,2,2,'#e2ba58');a.r(10,8,2,1,INK)
 elif i==3:
  a.r(3,1,10,4,'#6f8496');a.r(1,5,3,6,'#6f8496');a.r(12,5,3,6,'#6f8496');a.r(4,6,8,3,INK);a.r(5,7,6,1,TEAL)
 elif i==4:
  a.p('2,7 2,0 7,4',s);a.p('14,7 14,0 9,4',s);a.r(5,9,6,4,'#d9bc8a');a.r(7,9,2,2,INK)
 elif i==5:
  a.p('3,5 6,1 11,1 14,5 13,11 9,15 4,12',s);a.r(7,3,2,12,'#805a45');a.r(4,7,3,1,PALE);a.r(10,7,3,1,PALE)
 elif i==6:
  a.r(2,4,12,6,'#8c728f');a.r(1,5,14,3,'#aa8cab');a.r(4,2,8,4,'#aa8cab');a.r(4,4,2,2,PALE);a.r(10,5,2,2,PALE);a.r(6,10,4,5,'#d3c1bb')
 elif i==7:
  a.p('8,0 14,5 12,13 8,16 2,10 3,4',s);a.p('8,0 8,16 3,10 3,4','#5b8d9d');a.r(5,7,6,1,'#ddf5cc')
 elif i==8:
  a.r(1,4,4,5,s);a.r(11,4,4,5,s);a.r(2,4,3,2,PALE);a.r(11,4,3,2,PALE);a.r(3,5,1,2,INK);a.r(12,5,1,2,INK);a.r(6,11,4,1,INK)
 elif i==9:
  a.r(4,3,4,10,'#b8aaa9');a.r(9,4,3,9,'#8f809e');a.r(3,2,9,3,'#484c65')
 elif i==10:
  a.r(3,2,6,4,'#4e5f44');a.r(10,5,4,7,'#735c88');a.r(11,6,2,2,'#e6cd80');a.r(12,11,2,4,'#735c88')
 elif i==11:
  a.r(1,4,3,8,'#8da987');a.r(12,4,3,8,'#8da987');a.r(2,5,2,5,'#d5e8ae');a.r(12,5,2,5,'#d5e8ae');a.r(6,2,4,3,'#e6edbf')
 if i not in [1,3,5,6,7,8]:a.r(5,7,2,2,INK);a.r(10,7,2,2,INK)
 if i not in [5,7,8]:a.r(7,11,3,1,'#634e49')
 return a

def person(i,j):
 a=Art(32,48);c=clothes[j];a.r(7,43,18,3,'#14222d');a.r(9,29,6,14,'#3b4b57');a.r(18,29,5,14,'#3b4b57');a.r(8,41,7,4,INK);a.r(18,41,8,4,INK)
 a.r(5,17,22,15,INK);a.r(8,18,16,14,c);a.r(5,20,4,12,c);a.r(24,20,4,12,c);a.r(5,30,4,4,skins[i]);a.r(24,30,4,4,skins[i]);a.r(14,19,2,12,'#3e4b53');a.r(8,29,16,2,'#5c4d43');a.r(17,29,3,2,PALE)
 a.paste(head(i),8,2)
 # Distinct job gear, not just palette swaps.
 if j==0:a.r(10,1,13,3,c);a.r(20,4,5,1,c);a.r(20,21,3,3,PALE)
 if j==1:a.r(11,20,10,14,'#455565');a.r(25,26,2,13,'#bdc4bd');a.r(23,24,6,3,'#bdc4bd')
 if j==2:a.r(9,1,14,4,PALE);a.r(15,1,2,4,RED);a.r(13,2,6,1,RED);a.r(22,29,8,8,PALE);a.r(25,30,2,6,RED);a.r(23,32,6,2,RED)
 if j==3:a.r(8,1,16,5,'#626d53');a.r(9,20,14,10,'#444d43');a.r(25,20,3,20,INK);a.r(23,28,6,3,'#666c68')
 if j==4:a.r(9,1,14,4,'#8d805f');a.r(10,21,4,6,INK);a.r(17,21,4,6,INK)
 if j==5:a.r(9,20,5,10,'#66493d');a.r(19,20,5,10,'#66493d');a.r(23,31,7,9,'#ad8f56')
 if j==6:a.r(2,17,5,20,'#736144');a.r(4,17,3,2,PALE);a.r(25,22,2,18,'#8f9ca0')
 if j==7:a.r(8,0,16,5,'#d4b65b');a.r(14,0,3,6,'#e8d17c');a.r(21,28,8,8,'#56757e')
 if j==8:a.r(9,20,5,13,'#d9dbc8');a.r(19,20,5,13,'#d9dbc8');a.r(12,8,4,3,TEAL);a.r(18,8,4,3,TEAL)
 if j==9:a.r(7,0,18,5,'#454e69');a.r(6,4,3,12,'#454e69');a.r(22,4,3,12,'#454e69');a.r(20,29,9,6,'#26333f');a.r(22,30,5,3,TEAL)
 if j==10:a.r(1,15,2,26,'#91744e');a.r(2,15,4,2,'#91744e');a.r(2,39,4,2,'#91744e');a.r(6,17,1,22,PALE)
 if j==11:a.r(23,23,8,15,'#7e96a4');a.r(25,25,4,10,'#344d62');a.r(9,1,14,4,'#53677a')
 if j==12:a.p('8,18 12,18 25,30 22,32','#d4b172');a.r(22,28,8,9,'#8e684f')
 if j==13:a.r(13,19,3,4,PALE);a.r(16,19,3,4,PALE);a.r(15,22,3,7,RED)
 if j==14:a.r(23,27,7,10,'#ede0b9');a.r(23,27,2,10,'#7e6652');a.r(26,29,3,1,'#9a8870')
 if j==15:a.r(24,28,1,9,PALE);a.r(22,28,5,2,PALE);a.r(25,34,2,1,PALE)
 if j==16:a.r(11,19,10,12,'#573f39');a.r(12,22,2,7,RED);a.r(17,22,2,7,RED);a.r(10,1,13,4,'#8e6954')
 if j==17:a.r(24,28,5,8,'#94cdbb');a.r(25,26,3,2,PALE);a.r(25,31,3,4,'#599787')
 if j==18:a.r(10,1,13,4,'#c6a74c');a.r(14,2,5,3,TEAL);a.r(24,29,5,6,'#cab367')
 if j==19:a.r(11,0,11,4,'#6e516d');a.r(7,4,20,2,'#6e516d');a.r(23,29,6,9,'#bd8f6c');a.r(25,21,2,13,'#c8b494')
 return a
manifest={'style':'原創低解析度像素；整數座標 SVG，縮放不模糊','portraits':{},'characters':{},'vehicles':{},'enemies':{},'scenes':{},'icons':{},'mods':{}}
for i,r in enumerate(CAT['races']):
 manifest['portraits'][r['id']]=head(i).save(Path('portraits')/(r['id']+'.svg'))
 for j,job in enumerate(CAT['professions']):manifest['characters'][r['id']+'_'+job['id']]=person(i,j).save(Path('characters')/(r['id']+'_'+job['id']+'.svg'))
# Vehicles, right-facing, transparent windows allow actual occupants to be rendered beneath.
vehicles=[('compact','單座小車',1,24,'#c9a26a'),('sedan','舊轎車',3,30,'#73958e'),('van','旅行廂型車',5,40,'#b5a78a'),('pickup','拾荒皮卡',2,35,'#ad705b'),('bus','避難巴士',8,55,'#c7ad62'),('armored','裝甲運輸車',4,65,'#727f77'),('rover','外星巡行車',3,45,'#8c8cad'),('ambulance','救護車',4,38,'#c7c7ae')]
for k,name,seats,hp,col in vehicles:
 slots=2 if seats<4 else 3
 for extra in range(slots+1):
  a=Art(160,72);a.r(12,61,140,4,'#15222c');a.r(14,37,137,20,INK);a.r(17,38,131,17,col);a.r(21,52,119,4,'#625e53')
  win=[]
  if k=='compact':sx,sy,sw=54,22,46;positions=[(69,25,15,11)]
  elif k=='sedan':sx,sy,sw=31,20,82;positions=[(40+22*n,23,16,12) for n in range(3)]
  elif k=='pickup':sx,sy,sw=78,18,48;positions=[(83+20*n,21,14,13) for n in range(2)];a.r(19,30,55,5,col)
  elif k=='bus':sx,sy,sw=17,9,123;positions=[(23+14*n,14,10,17) for n in range(8)]
  elif k=='van':sx,sy,sw=25,14,109;positions=[(31+19*n,18,14,15) for n in range(5)]
  elif k=='rover':sx,sy,sw=35,16,95;positions=[(42+26*n,21,19,11) for n in range(3)]
  else:sx,sy,sw=25,13,108;positions=[(32+24*n,18,16,14) for n in range(4)]
  if extra:
   sx,sy,sw=17,9,123
   capacity=seats+extra;step=116//capacity
   positions=[(21+step*n,14,step-3,17) for n in range(capacity)]
  # draw roof and pillars only; windows themselves transparent
  a.r(sx,sy,sw,4,INK);a.r(sx+2,sy+1,sw-4,2,col);a.r(sx,sy,4,38-sy,col);a.r(sx+sw-4,sy,4,38-sy,col)
  a.r(sx,35,sw,4,col)
  last=sx+4
  for x,y,w,h in positions:
   if x>last:a.r(last,sy+4,x-last,31-sy,col)
   a.r(x,y-1,w,1,PALE);a.r(x+w,y,2,h,col);last=x+w+2;win.append({'x':x,'y':y,'width':w,'height':h})
  if last<sx+sw:a.r(last,sy+4,sx+sw-last,31-sy,col)
  for wx in [36,124]:
   a.r(wx-10,52,20,13,INK);a.r(wx-7,50,14,18,INK);a.r(wx-5,54,10,10,'#677178');a.r(wx-2,57,4,4,'#abb6b1')
  a.r(143,40,7,4,'#e8db99');a.r(17,42,3,4,RED);a.r(83,41,8,2,'#555d58');a.r(15,54,10,3,'#9caaa6');a.r(144,54,10,3,'#9caaa6')
  if k=='armored':a.r(23,43,113,6,'#56645c');a.r(50,44,2,2,'#c0bfa8');a.r(96,44,2,2,'#c0bfa8')
  if k=='ambulance':a.r(53,40,4,13,RED);a.r(49,44,12,4,RED);a.r(61,10,10,3,RED)
  if k=='rover':a.r(29,46,105,2,TEAL);a.r(54,12,44,3,'#c0b9d4')
  image=a.save(Path('vehicles')/(k+('_seats'+str(seats+extra) if extra else '')+'.svg'))
  if not extra:manifest['vehicles'][k]={'name':name,'image':image,'windows':win,'seats':seats,'maxHealth':hp,'modSlots':slots,'variants':{}}
  else:manifest['vehicles'][k]['variants'][str(seats+extra)]={'image':image,'windows':win}
# Enemy visuals, visibly separate silhouettes.
for idx,(k,name) in enumerate([('raider','公路掠奪者'),('soldier','佔領軍士兵'),('mutant','狂暴變種人'),('infected','感染者'),('crawler','寄生爬行者'),('hound','變異獵犬'),('nest','孵化母體'),('swarm','孢子蟲群'),('drone','巡邏無人機'),('turret','防衛砲台'),('worker','失控工程機'),('sentinel','外星守衛'),('lurker','暗處伏擊者'),('brute','甲殼巨獸'),('wing','變異飛獸'),('parasite','寄生觸手')]):
 a=Art(64,64)
 if idx<4 or idx in [11,12]:
  a.paste(person([0,1,2,2][idx] if idx<4 else 5 if idx==11 else 9,3 if idx!=3 else 6),16,12)
  if idx==0:a.r(24,20,16,5,'#713f42')
  if idx==3:a.r(20,37,6,3,RED);a.r(36,50,3,9,RED)
 elif idx in [8,9,10]:
  a.r(15,23,34,20,INK);a.r(18,26,28,14,'#75818a');a.r(26,28,12,5,RED)
  if idx==8:
   for x in [6,45]:a.r(x,18,13,3,'#9dabae');a.r(x+5,14,3,25,'#555e6c')
  else:
   a.r(20,42,6,15,'#6a7580');a.r(38,42,6,15,'#6a7580');a.r(9,53,18,5,INK);a.r(37,53,18,5,INK);a.r(37,31,22,4,INK)
 elif idx in [4,5,13]:
  c=['#976f87','#b69b76','#7c926e'][[4,5,13].index(idx)];a.p('8,32 16,20 38,21 51,29 58,27 59,40 43,44 16,43',c)
  for x in [12,23,39,48]:a.r(x,40,5,16,INK);a.r(x,42,3,10,c)
  a.r(49,30,3,3,RED);a.p('54,40 56,47 58,40',PALE)
  if idx==13:a.p('17,23 20,9 26,22 32,10 37,22',c)
 elif idx==14:a.p('30,22 4,12 8,35 28,40 34,57 39,37 59,31 60,9 36,22','#a28aab');a.r(29,23,9,18,'#5e526e');a.r(30,25,2,2,PALE)
 elif idx==7:
  for x,y in [(9,18),(27,9),(44,21),(17,39),(39,43)]:a.r(x,y,10,7,'#9da76c');a.r(x-3,y+3,16,2,'#777f5a');a.r(x+7,y+1,2,2,RED)
 else:
  c='#9a737c';a.p('17,53 13,32 22,18 32,11 44,22 49,48 40,56',c)
  for x in [9,23,41,52]:a.p(f'30,31 {x},48 {x-3},60 {x+4},59 {x+6},44','#705c78')
  a.r(25,29,13,7,INK);a.r(27,30,3,3,'#d6ae75');a.r(34,30,3,3,'#d6ae75')
 manifest['enemies'][k]={'name':name,'image':a.save(Path('enemies')/(k+'.svg')),'machine':idx in [8,9,10]}
# Road panoramas 384x160 with different architecture and time palettes.
for scene in ['salt','city','forest','alien','oasis']:
 for phase in ['dawn','morning','afternoon','night']:
  a=Art(384,160);sky={'dawn':'#726476','morning':'#789ba5','afternoon':'#aa937d','night':'#142437'}[phase];a.r(0,0,384,160,sky)
  sun='#d9c48c' if phase!='night' else '#a7c6be';a.r(307,17,18,18,sun)
  rng=random.Random(scene+phase)
  if phase=='night':
   for _ in range(30):a.r(rng.randrange(384),rng.randrange(65),1,1,'#78959f')
  a.p('0,82 34,64 69,77 111,47 159,79 199,58 253,80 302,61 352,81 384,67 384,130 0,130','#425766')
  if scene=='city':
   for x in range(0,384,27):
    h=rng.randrange(25,65);a.r(x,110-h,20,h,'#354953');a.r(x+3,114-h,3,4,'#78827a');a.r(x+11,126-h,3,5,'#8d8b70')
  elif scene=='forest':
   for x in range(0,384,22):
    h=rng.randrange(30,65);a.r(x+8,110-h,3,h,'#46564b');a.p(f'{x-4},92 {x+9},{100-h} {x+24},92','#3a5550')
  elif scene=='alien':
   for x in [28,116,240,335]:a.p(f'{x},112 {x+10},28 {x+18},17 {x+29},112','#334654');a.r(x+11,35,3,45,TEAL)
   a.r(168,21,62,5,'#526277');a.r(178,17,42,4,'#8a929c')
  elif scene=='oasis':
   a.r(0,100,384,22,'#587668');a.r(123,108,135,6,'#8fb4a8');a.r(268,76,49,35,'#a9a58b');a.r(279,86,9,15,PALE)
   for x in [20,58,340]:a.r(x,73,4,38,'#7c7156');a.r(x-12,67,28,9,'#587c61');a.r(x-5,58,15,10,'#587c61')
  else:
   for x in range(0,384,37):a.r(x,106+rng.randrange(6),14,2,'#b5b49a')
  a.r(0,120,384,7,'#747a70');a.r(0,127,384,33,'#263540');a.r(0,131,384,1,'#a1a38c')
  for x in range(0,384,64):a.r(x,147,28,2,'#d4c491')
  manifest['scenes'][scene+'_'+phase]=a.save(Path('scenes')/(scene+'_'+phase+'.svg'))
# Building interior variations, suitable as event stages.
for n in ['warehouse','clinic','garage','shop','hotel','laboratory','ruin','nest']:
 a=Art(320,160);a.r(0,0,320,160,'#192731');a.r(14,13,292,99,'#39484b');a.r(0,112,320,48,'#50534c')
 for y in [36,61,86]:a.r(14,y,292,1,'#26383e')
 for x in range(16,320,38):a.r(x,113,1,47,'#393f3e')
 a.r(134,30,54,82,'#14252e');a.r(130,27,62,4,'#849182');a.r(45,19,28,3,PALE);a.r(247,19,28,3,PALE)
 if n in ['warehouse','shop']:
  for x in [26,210]:
   for y in [58,85]:a.r(x,y,78,5,'#9e9473');a.r(x+4,y-17,22,17,'#998263');a.r(x+36,y-13,29,13,'#778b7b')
 elif n=='clinic':a.r(26,79,76,25,'#b9c1ae');a.r(30,81,20,9,PALE);a.r(238,37,40,47,'#9daea5');a.r(254,45,8,27,RED);a.r(245,54,26,8,RED)
 elif n=='garage':a.r(24,48,68,47,'#53666a');a.r(30,53,57,28,'#273e48');a.r(218,88,70,15,'#987b58');a.r(236,43,5,36,'#a0ad9f')
 elif n=='hotel':
  for x in [26,215]:a.r(x,81,76,25,'#6f8284');a.r(x+4,83,21,9,PALE);a.r(x+26,83,46,18,'#ab8b68')
 elif n=='laboratory':
  for x in [30,228]:a.r(x,37,52,65,'#668486');a.r(x+5,42,42,52,'#345258');a.r(x+18,52,16,29,'#84b9a2')
 elif n=='nest':
  for x,y in [(37,91),(65,73),(222,88),(256,99)]:a.p(f'{x},{y} {x+5},{y-18} {x+17},{y-20} {x+25},{y} {x+20},{y+8} {x+3},{y+9}','#8f797d')
 else:a.p('30,112 72,59 95,111','#6b6960');a.p('210,112 238,78 288,112','#646863');a.r(10,138,64,8,'#172731')
 manifest['scenes'][n]=a.save(Path('scenes')/(n+'.svg'))
# Tiny functional item illustrations.
for idx,k in enumerate(['fuel','medicine','scrap','esp','health','stamina','weapon','armor','accessory','seat','shield','radio','book','chest','sleep','dice']):
 a=Art(24,24);c=[TEAL,RED,PALE,'#a89ec7'][idx%4]
 if k=='fuel':a.r(6,3,11,18,c);a.r(8,1,6,3,c);a.r(8,8,7,8,INK);a.r(17,7,3,13,c)
 elif k in ['medicine','health']:a.r(3,5,18,16,c);a.r(10,7,4,12,PALE);a.r(6,11,12,4,PALE)
 elif k=='weapon':a.r(3,9,17,4,c);a.r(7,12,4,9,c);a.r(17,8,5,3,PALE)
 elif k in ['armor','shield']:a.p('4,4 12,1 20,4 19,15 12,22 5,15',c);a.r(11,5,2,13,INK)
 elif k=='seat':a.r(5,3,5,15,c);a.r(8,14,12,5,c);a.r(7,19,2,3,c);a.r(17,19,2,3,c)
 elif k=='book':a.r(4,3,16,19,c);a.r(5,5,2,15,INK);a.r(10,7,7,1,INK);a.r(10,11,7,1,INK)
 elif k=='chest':a.r(3,7,18,14,c);a.r(3,12,18,2,INK);a.r(11,11,3,5,PALE)
 elif k=='dice':a.r(3,3,18,18,c);a.r(6,6,3,3,INK);a.r(15,6,3,3,INK);a.r(6,15,3,3,INK);a.r(15,15,3,3,INK)
 elif k=='sleep':a.r(3,10,3,11,c);a.r(6,14,16,5,c);a.r(19,19,3,2,c);a.r(7,10,5,4,PALE)
 elif k=='radio':a.r(3,8,18,13,c);a.r(5,10,8,8,INK);a.r(17,10,2,2,INK);a.r(16,2,2,6,c)
 else:a.p('12,2 21,10 17,20 7,22 2,13',c);a.r(10,7,3,10,PALE)
 manifest['icons'][k]=a.save(Path('icons')/(k+'.svg'))
for k in ['gun','armor','seat','lamp']:
 a=Art(48,24)
 if k=='gun':a.r(12,17,23,5,'#626e70');a.r(20,10,7,9,'#9ba49a');a.r(21,9,25,4,'#364955');a.r(44,8,3,6,PALE)
 elif k=='armor':a.r(2,12,44,10,'#7b8174');a.r(5,14,38,2,'#a1a58e')
 elif k=='seat':a.r(15,3,6,16,'#8d7863');a.r(19,15,14,6,'#8d7863')
 else:a.r(19,12,5,9,'#69837f');a.r(15,5,16,8,PALE);a.r(29,7,4,4,'#dce8b4')
 manifest['mods'][k]=a.save(Path('mods')/(k+'.svg'))
(A/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print('Assets:',sum(len(v) for v in manifest.values() if isinstance(v,dict)))
