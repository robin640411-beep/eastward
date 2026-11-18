"""Bind checked source rectangles; original generated PNG atlases remain unmodified."""
from pathlib import Path
import json
R=Path(__file__).resolve().parents[1];p=R/'dist/assets/manifest.json';m=json.loads(p.read_text());m['artVersion']='occupation-2';m['style']='精緻16位元像素；黑紫生體裝甲、琥珀能源、青綠人類設施與鏽蝕修補';m['worlds']={}
l=json.loads((R/'art-direction/world-atlas-layout.json').read_text())
for key in ['atlasA','atlasB']:
 a=l[key]
 for name,x,y,w,h in a['cells']:m['worlds'][name]={'image':a['path'],'rect':[x,y,w,h],'size':[a['width'],a['height']]}
l=json.loads((R/'art-direction/facilities-interiors-layout.json').read_text())
for key in ['facilities','interiors']:
 a=l[key];m[key]={name:{'image':a['file'],'rect':[x,y,w,h],'size':[a['width'],a['height']]} for name,x,y,w,h in a['cells']}
m['occupation']={k:f'occupation/{k}.svg' for k in ['carrier','drone','pylon']}
e=json.loads((R/'art-direction/enemies-atlas-layout.json').read_text());m['enemyAtlas']={}
for name,v in e['sprites'].items():
 x,y,w,h=v['visibleBounds'];cx,cy,cw,ch=v['cell'];left=max(cx,x-6);top=max(cy,y-6);right=min(cx+cw,x+w+6);bottom=min(cy+ch,y+h+6)
 m['enemyAtlas'][name]={'image':'painted/enemies-atlas.png','rect':[left,top,right-left,bottom-top],'size':[e['width'],e['height']]}
p.write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n')
print('Linked 12 landscapes, 8 facilities and 8 interiors.')
