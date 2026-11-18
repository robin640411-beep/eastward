"""Inspect generated PNG alpha and publish tight atlas source rectangles.
Original image pixels are never edited. Rebuilds tight crop metadata, then exports production WebP sprites through Sharp.
"""
from pathlib import Path
import struct,zlib,json,subprocess,shutil,os,sys
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'art-direction/volume/buildings'

def read_png(path):
 raw=path.read_bytes();o=8;chunks=[]
 assert raw[:8]==b'\x89PNG\r\n\x1a\n'
 while o<len(raw):
  n=struct.unpack('>I',raw[o:o+4])[0];tag=raw[o+4:o+8];v=raw[o+8:o+8+n];o+=n+12
  if tag==b'IHDR':w,h,bits,col,_,_,interlace=struct.unpack('>IIBBBBB',v)
  if tag==b'IDAT':chunks.append(v)
 assert bits==8 and col in (2,6) and interlace==0
 channels={2:3,6:4}[col];stride=w*channels;data=zlib.decompress(b''.join(chunks));last=bytearray(stride);rows=[];offset=0
 for _ in range(h):
  filt=data[offset];row=bytearray(data[offset+1:offset+1+stride]);offset+=stride+1
  for i in range(stride):
   a=row[i-channels] if i>=channels else 0;b=last[i];c=last[i-channels] if i>=channels else 0
   if filt==1:row[i]=(row[i]+a)&255
   elif filt==2:row[i]=(row[i]+b)&255
   elif filt==3:row[i]=(row[i]+((a+b)//2))&255
   elif filt==4:
    q=a+b-c;pa=abs(q-a);pb=abs(q-b);pc=abs(q-c)
    row[i]=(row[i]+(a if pa<=pb and pa<=pc else b if pb<=pc else c))&255
  rows.append(row);last=row
 return w,h,channels,rows

def tight_cells(name,kinds,cols,rows):
 w,h,c,pixels=read_png(OUT/name);assert c==4,'Transparent alpha required'
 zero=sum(a==0 for row in pixels for a in row[3::4]);assert zero>w*h*.15,'Atlas has insufficient empty alpha'
 print(name,w,h,'transparent',zero,'of',w*h)
 # Assign entire alpha-connected components by their center rather than
 # clipping the nominal grid; generated art can spill a few pixels into a
 # transparent gutter and must not contaminate its neighbour's crop.
 from collections import deque
 seen=bytearray(w*h);groups=[[] for _ in kinds]
 for yy in range(h):
  for xx in range(w):
   start=yy*w+xx
   if seen[start] or pixels[yy][xx*4+3]<=16:continue
   seen[start]=1;q=deque([start]);x0=x1=xx;y0=y1=yy;count=sx=sy=0
   while q:
    n=q.popleft();y,x=divmod(n,w);count+=1;sx+=x;sy+=y
    x0=min(x0,x);x1=max(x1,x);y0=min(y0,y);y1=max(y1,y)
    for nx,ny in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
     if 0<=nx<w and 0<=ny<h:
      nn=ny*w+nx
      if not seen[nn] and pixels[ny][nx*4+3]>16:seen[nn]=1;q.append(nn)
   if count<8:continue
   col=min(cols-1,int(sx/count/(w/cols)));row=min(rows-1,int(sy/count/(h/rows)))
   groups[row*cols+col].append((x0,y0,x1,y1,count))
 result={}
 for n,kind in enumerate(kinds):
  assert groups[n],kind
  x0=min(b[0] for b in groups[n]);y0=min(b[1] for b in groups[n]);x1=max(b[2] for b in groups[n]);y1=max(b[3] for b in groups[n])
  x0=max(0,x0-1);y0=max(0,y0-1);x1=min(w-1,x1+1);y1=min(h-1,y1+1)
  rect=[x0,y0,x1-x0+1,y1-y0+1]
  result[kind]={'image':'volume/'+name,'rect':rect}
  print(kind,rect)
 return result

fac=tight_cells('facilities.png',['gas','garage','motel','clinic','pharmacy','warehouse','shop','checkpoint'],4,2)
fac.update(tight_cells('roadside.png',['stall','market','toll','bridge','tunnel','camp','scrapyard','memorial','solar'],3,3))
w,h,c,pixels=read_png(OUT/'interiors.png');assert (w,h)==(1254,1254)
# Avoid the dark panel separators and their blended edge pixels.
interior_rows=[(2,309),(315,309),(629,309),(943,309)]
interiors={}
for n,kind in enumerate(['warehouse','clinic','garage','shop','hotel','laboratory','ruin','nest']):
 y,hh=interior_rows[n//2]
 interiors[kind]={'image':'volume/interiors.png','rect':[2 if n%2==0 else 629,y,623,hh]}
(OUT/'atlas-layout.json').write_text(json.dumps({'facilities':fac,'interiors':interiors},ensure_ascii=False,indent=2)+'\n')
print('Measured',len(fac),'facilities and',len(interiors),'interiors.')
node=os.environ.get('EASTWARD_NODE') or shutil.which('node') or str(Path.home()/'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node')
subprocess.run([node,str(ROOT/'tools/build_volume_buildings.mjs'),*sys.argv[1:]],check=True)
