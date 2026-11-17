"""Authored pixel scenery for each oracle encounter; transparent layered props for animation."""
from pathlib import Path
import json,html
R=Path(__file__).resolve().parents[1]; OUT=R/'dist/assets/encounters';OUT.mkdir(exist_ok=True)
INK='#17222b'; DARK='#293a40'; PALE='#ddce9f'; RUST='#9c6952'; TEAL='#78b9ab'; RED='#c8664c'
class Art:
 def __init__(self):self.s=[]
 def r(self,x,y,w,h,c):self.s.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{c}"/>')
 def p(self,pts,c):self.s.append(f'<polygon points="{pts}" fill="{c}"/>')
 def t(self,x,y,text,col=PALE):self.s.append(f'<text x="{x}" y="{y}" fill="{col}" font-family="monospace" font-weight="bold" font-size="8">{html.escape(text)}</text>')
 def box(self,x,y,w=24,h=20,col=RUST):
  self.r(x,y,w,h,INK);self.r(x+2,y+2,w-4,h-4,col);self.r(x+4,y+4,w-8,2,PALE);self.r(x+4,y+h-6,w-8,2,DARK);self.r(x+w//2-2,y+5,4,6,'#bfb49b')
 def barrel(self,x,y,col=RUST):
  self.r(x+2,y,19,31,INK);self.r(x,y+3,23,25,col);self.r(x,y+6,23,3,DARK);self.r(x,y+22,23,3,DARK);self.r(x+4,y+3,3,24,'#b3a37b');self.r(x+3,y+2,15,2,PALE)
 def wheel(self,x,y):
  self.r(x,y,14,12,INK);self.r(x+3,y+2,8,8,'#667478');self.r(x+6,y+5,3,3,PALE)
 def save(self,id):
  (OUT/(id+'.svg')).write_text('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="112" viewBox="0 0 160 112" shape-rendering="crispEdges">'+''.join(self.s)+'</svg>')
road='gas motel stall garage pharmacy ambulance car rescue tanker convoy crate luggage locker solar clinic traveler traveler traveler camp radio scrapyard tires bridgegift clinic crate tunnel motorcycle bookvan books memorial fuel generator medicalbox market cars garage garage clinic camp checkpoint gift container safe pharmacy bus convoy tanker warehouse traveler radio convoy toll infected rocks pit bridge fog sand acid ice spikes truck leak engine electric fire flood beast chase ambulance market checkpoint car tunnel gascloud vines swarm motorcycle sniper bandit sign fire electric wreck dust spores explosion bridge toll glass mud tree bandit gunfight smoke infected scrapyard checkpoint barrel storm'.split()
inside='crate medicalbox toolbox barrel locker locker luggage shelf medicalbox locker cache barrel bag coat crate stall pharmacy locker barrel garage clinic bed stall stall cars camp camp bed toolbox terminal camp cache sign bed camp book book terminal radio paper terminal map paper sign radio pit rocks stairs glass shelf lamp electric electric gascloud spores barrel gascloud alarm bomb trap rocks flood door tunnel dark nest eggs infected beast nest spores soldier turret robot sniper empty shelf medicalbox safe barrel generator door poster terminal stall luggage flood bath shop bed furniture mural corridor glass office stove garage sign paper partition'.split()
assert len(road)==100 and len(inside)==100,(len(road),len(inside))
fxmap={'fire':'fire','explosion':'fire','engine':'smoke','smoke':'smoke','dust':'dust','sand':'dust','fog':'fog','acid':'rain','storm':'storm','gascloud':'gas','spores':'spores','swarm':'spores','flood':'water','electric':'sparks','radio':'signal','terminal':'signal','solar':'signal','nest':'spores','eggs':'spores','leak':'drip'}
def draw(kind,n,empty=False):
 a=Art();accent=[TEAL,'#c4aa69','#a88d88','#889b79'][n%4]
 # Each composition gets rubble, footings and identifying architectural variation.
 for i in range(6):a.r(15+(n*7+i*23)%130,101+(i%3),3+i%4,2,'#596464')
 if kind in ['gas','motel','garage','clinic','pharmacy','warehouse','shop','tunnel','checkpoint','toll','solar','container']:
  if kind=='tunnel':
   a.p('8,101 8,32 25,13 127,13 151,34 151,101',DARK);a.r(25,27,110,75,'#596465');a.p('42,101 42,55 55,38 108,38 121,55 121,101',INK);a.r(51,31,62,4,PALE);a.box(15,78,26,25);a.r(126,49,20,7,RED)
  elif kind in ['checkpoint','toll']:
   a.r(20,38,48,63,DARK);a.r(17,33,55,6,RUST);a.r(25,47,33,22,'#657f7c');a.r(35,47,3,23,PALE);a.r(80,70,6,31,PALE);a.r(75,67,76,7,PALE)
   for i in range(7):a.r(77+i*11,67,5,7,RED)
   a.r(85,30,48,22,INK);a.t(90,44,'STOP');a.r(108,52,4,17,DARK)
  elif kind=='container':
   a.r(9,40,142,62,INK);a.r(12,43,136,55,accent)
   for x in range(15,150,10):a.r(x,45,2,50,DARK)
   a.r(109,43,3,56,PALE);a.r(131,43,3,56,PALE);a.t(21,63,'CARGO')
  else:
   a.r(18,35,117,67,DARK);a.r(21,39,111,60,'#687675');a.r(14,29,126,10,accent);a.r(25,61,32,23,'#213e49');a.r(30,64,23,3,'#8eaeac');a.r(91,60,25,41,INK);a.r(94,63,18,36,'#36494b');a.r(107,80,3,3,PALE)
   label={'gas':'FUEL','motel':'MOTEL','garage':'REPAIR','clinic':'CLINIC','pharmacy':'MEDS','warehouse':'DEPOT','solar':'SOS','shop':'CLOSED'}[kind];a.r(42,15,73,17,INK);a.t(48,27,label)
   if kind=='gas':
    for x in [53,126]:a.r(x,64,16,35,RUST);a.r(x+2,67,12,11,PALE);a.r(x+5,70,6,4,INK);a.r(x+16,73,4,20,INK);a.r(x+18,91,6,3,INK)
   if kind=='garage':a.r(26,58,53,43,INK);a.r(27,59,51,4,'#8d9992');a.r(53,67,3,27,PALE);a.r(37,87,34,3,TEAL);a.wheel(36,88);a.wheel(64,88)
   if kind in ['clinic','pharmacy']:a.r(25,45,7,21,PALE);a.r(18,52,21,7,PALE)
   if kind=='motel':a.r(26,64,34,2,PALE);a.r(43,60,2,24,PALE);a.r(6,74,5,28,DARK);a.r(0,71,17,6,TEAL)
   if kind=='solar':a.p('4,54 37,54 43,71 0,71','#376b81');a.r(19,72,4,29,INK)
 elif kind in ['stall','market','books','bookvan']:
  a.r(27,45,4,56,DARK);a.r(128,45,4,56,DARK);a.p('15,49 36,23 118,23 144,49',accent)
  for x in range(33,130,19):a.p(f'{x},24 {x+7},24 {x+14},48 {x+3},48',PALE)
  a.r(24,81,112,20,RUST);a.r(21,78,118,5,PALE)
  for i in range(5):a.box(33+i*18,65-i%2*7,13,13,[TEAL,RUST,PALE][i%3])
  if kind in ['books','bookvan']:a.t(54,58,'BOOKS')
 elif kind in ['ambulance','car','rescue','tanker','convoy','cars','motorcycle','bus','chase','truck','wreck','scrapyard']:
  a.r(14,68,134,26,accent);a.r(30,43,89,27,accent);a.r(36,48,27,18,'#243c48');a.r(69,48,38,18,'#243c48');a.r(145,73,7,5,PALE);a.wheel(32,88);a.wheel(116,88)
  if kind=='ambulance':a.r(87,68,6,24,PALE);a.r(79,77,23,6,PALE);a.r(51,38,16,5,RED)
  if kind=='tanker':a.r(13,45,78,37,INK);a.r(15,49,74,29,'#a99576');a.r(29,45,4,37,DARK);a.r(70,45,4,37,DARK)
  if kind in ['scrapyard','wreck','truck']:a.box(80,24,40,22);a.r(9,97,120,4,RED);a.p('34,48 47,48 43,61 57,65 38,64',PALE)
  if kind=='motorcycle':a.r(5,38,147,57,'#0000');a.r(55,61,36,9,INK);a.p('45,88 71,66 97,88',RUST)
  if kind in ['convoy','cars']:a.r(4,34,60,21,DARK);a.r(12,21,42,18,DARK);a.wheel(13,49);a.wheel(46,49)
 elif kind in ['crate','luggage','toolbox','medicalbox','locker','shelf','safe','cache','bag','coat','gift']:
  if kind in ['locker','shelf','safe']:
   a.r(42,23,79,79,INK);a.r(45,26,73,73,'#7c8580')
   for y in [48,71,94]:a.r(46,y,71,3,DARK)
   if kind=='safe':a.r(50,32,60,62,DARK);a.r(57,39,50,48,'#909589');a.r(77,55,14,14,INK);a.r(81,59,6,6,PALE)
   elif not empty:
    for i in range(6):a.box(50+(i%3)*20,33+(i//3)*24,15,14,accent)
  else:
   a.box(29,64,57,37,accent);a.box(86,78,33,23);a.box(45,44,30,21,'#bea36f')
   if kind=='medicalbox':a.r(52,67,7,23,PALE);a.r(44,75,23,7,PALE)
   if kind=='toolbox':a.r(47,56,23,8,INK);a.r(51,59,15,5,PALE)
   if kind=='luggage':a.r(35,58,25,7,INK);a.r(43,66,4,31,PALE);a.r(70,66,4,31,PALE)
   if kind=='coat':a.p('37,47 56,39 79,45 95,75 82,79 77,66 77,100 40,100 43,65 32,82 23,75',accent)
  if empty:a.r(48,34,58,60,INK);a.r(49,68,56,2,DARK)
 elif kind in ['fuel','barrel','generator','leak','engine','stove','fire']:
  a.barrel(38,69);a.barrel(65,60,accent);a.barrel(93,73)
  if kind in ['generator','engine','stove']:a.r(29,57,83,44,DARK);a.r(34,63,74,32,'#687b75');a.r(37,65,18,25,INK);a.r(67,69,31,3,PALE);a.r(67,78,31,3,PALE);a.r(104,46,7,19,DARK)
  if kind=='leak':a.r(31,101,93,3,'#756c39');a.r(49,103,70,4,'#625d34')
 elif kind=='lamp':
  a.r(76,0,3,45,DARK);a.p('66,44 92,44 104,62 54,62',RUST);a.r(64,62,30,4,PALE);a.p('64,67 94,67 127,102 31,102','#d7c88b33')
 elif kind in ['radio','terminal','solar','alarm']:
  a.r(40,43,70,57,DARK);a.r(45,48,60,33,INK);a.r(49,51,52,25,'#568d80');a.r(53,56,36,3,TEAL);a.r(53,63,23,2,TEAL);a.r(53,70,42,2,TEAL);a.r(46,89,47,3,PALE);a.r(71,14,3,30,INK);a.p('72,17 46,7 48,11 72,23',PALE);a.r(115,65,12,37,RED)
 elif kind in ['sign','memorial','map','paper','book','poster','mural']:
  a.r(31,26,105,59,DARK);a.r(35,30,97,50,PALE);a.r(42,85,5,17,RUST);a.r(119,85,5,17,RUST)
  if kind=='sign':a.p('52,48 100,48 100,38 119,55 100,70 100,59 52,59',RED)
  else:
   for i in range(7):a.r(43+(i%2)*45,36+i//2*10,24+(n+i)%12,3,['#697c74',RUST,DARK][i%3])
   if kind=='map':a.p('59,72 59,54 84,54 84,42 112,42 112,47 90,47 90,60 66,60 66,72',RED)
 elif kind in ['bridge','bridgegift','pit','mud','ice','flood']:
  a.r(9,88,143,17,'#47717a' if kind=='flood' else INK);a.p('10,78 50,78 67,95 41,98 8,95',DARK);a.p('112,82 153,78 153,103 101,98',DARK)
  if kind in ['bridge','bridgegift']:
   a.r(8,63,51,10,'#94998d');a.r(111,67,43,10,'#94998d');a.r(12,37,4,28,PALE);a.r(39,37,4,28,PALE);a.r(10,37,44,4,PALE);a.r(115,42,4,27,PALE);a.r(142,42,4,27,PALE);a.r(115,42,39,4,PALE);a.r(25,74,9,29,DARK);a.r(130,77,8,26,DARK)
  if kind=='ice':a.p('25,87 110,85 147,98 54,103','#a5cbd0')
  if kind=='mud':a.p('25,87 110,85 147,98 54,103','#6c6450')
  if kind=='bridgegift':a.box(22,67,25,20)
 elif kind in ['spikes','glass','bomb','trap','electric','vines','tree','rocks','stairs','door','tires']:
  if kind in ['tree','vines']:a.p('14,94 129,53 139,69 22,103',RUST);a.p('54,80 33,35 45,37 64,74',DARK);a.p('89,69 109,32 119,33 99,78',DARK)
  elif kind=='door':a.r(39,20,84,83,DARK);a.r(45,24,70,79,'#6f827c');a.r(45,53,70,8,RUST);a.r(45,83,70,8,RUST);a.r(98,69,6,6,INK)
  elif kind=='electric':a.r(43,10,7,94,RUST);a.r(29,17,48,5,DARK);a.p('47,21 83,42 76,62 109,89 106,92 72,63 79,42 45,23',INK);a.box(112,77,19,24)
  elif kind in ['bomb','trap']:a.box(58,77,47,24,DARK);a.r(66,81,29,5,RED);a.r(16,93,133,1,PALE);a.r(98,73,3,11,RED)
  elif kind=='stairs':
   for i in range(5):a.r(25+i*21,37+i*13,20,66-i*13,'#788580')
  elif kind=='tires':
   for i in range(7):a.wheel(30+(i%4)*23,82-(i//4)*15)
  else:
   for i in range(7):
    x=13+i*19;y=64+(n+i*7)%25;a.p(f'{x},102 {x+5},{y} {x+16},{y+4} {x+20},102', '#b4b9a6' if kind in ['spikes','glass'] else '#6c7c79')
 elif kind in ['nest','eggs','spores','swarm','beast','infected','soldier','turret','robot','sniper','bandit','gunfight']:
  if kind in ['nest','eggs','spores','swarm']:
   a.p('13,103 25,84 39,75 51,86 75,61 96,76 117,73 147,103','#5e6860')
   for i in range(5):
    x=26+i*23;y=77-(i%2)*13;a.r(x,y+5,15,20,'#978c9d');a.r(x+3,y,9,29,'#b6aea4');a.r(x+5,y+6,5,15,TEAL)
  else:
   a.r(34,89,90,12,DARK);a.box(19,77,27,26);a.box(114,80,28,23);a.r(59,75,36,10,INK)
   if kind=='turret':a.r(65,55,23,29,'#728d84');a.r(79,57,47,7,INK);a.r(69,47,11,12,RED)
 elif kind in ['traveler','camp','bed','bath','furniture','office','partition','corridor','empty','dark']:
  if kind=='camp':a.p('24,99 66,36 118,99',accent);a.p('56,99 66,58 84,99',INK);a.box(119,81,25,21)
  elif kind in ['bed','bath']:a.r(32,75,98,20,PALE);a.r(32,65,8,37,RUST);a.r(124,65,6,37,RUST);a.r(43,69,24,7,'#a8b6a9');a.r(70,75,54,14,accent)
  elif kind=='traveler':a.r(15,92,52,7,RUST);a.r(21,99,4,6,INK);a.r(57,99,4,6,INK);a.r(113,25,4,77,DARK);a.r(89,21,50,23,accent);a.t(95,37,'EAST')
  else:a.r(36,24,88,79,DARK);a.r(42,30,76,73,INK);a.r(47,35,64,3,'#4c6062');a.r(15,91,36,6,RUST);a.r(22,97,4,7,DARK)
 elif kind in ['fog','sand','acid','gascloud','dust','smoke','storm','explosion']:
  a.r(107,19,5,84,DARK);a.r(89,18,42,5,DARK);a.r(109,27,5,2,PALE);a.box(36,81,37,21);a.barrel(79,72)
 else:raise ValueError(kind)
 return a
manifest={}
for fn,types in [('events',road),('building-events',inside)]:
 for e in json.loads((R/'spec'/f'{fn}.json').read_text())['events']:
  n=e.get('d100',1);kind=types[n-1] if 'd100' in e else 'traveler';empty=e.get('category')=='empty';a=draw(kind,n,empty);a.save(e['id']);manifest[e['id']]={'image':'encounters/'+e['id']+'.svg','kind':kind,'effect':fxmap.get(kind,'none'),'title':e['title'],'interior':fn=='building-events','empty':empty,'creatures':{'infected':['infected','infected','infected'],'beast':['brute'],'swarm':['swarm','swarm'],'nest':['crawler','parasite'],'eggs':['parasite'],'soldier':['soldier'],'robot':['worker'],'sniper':['raider'],'gunfight':['soldier','raider'],'bandit':['raider']}.get(kind,[])}
(R/'dist/assets/encounters.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
print('Painted',len(manifest),'event props in',len(set(x['kind'] for x in manifest.values())),'visual categories')
