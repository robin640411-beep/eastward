import json,xml.etree.ElementTree as ET
from pathlib import Path
root=Path(__file__).resolve().parents[1]/'dist/assets';m=json.loads((root/'manifest.json').read_text())
assert len(m['characters'])==240 and len(m['portraits'])==12
assert len(m['vehicles'])==8 and len(m['enemies'])==16
paths=[]
for category,items in m.items():
 if not isinstance(items,dict):continue
 for k,v in items.items():paths.append(v['image'] if isinstance(v,dict) else v)
for v in m['vehicles'].values():
 for capacity,variant in v.get('variants',{}).items():
  paths.append(variant['image']);assert len(variant['windows'])==int(capacity)
for file in paths:
 p=root/file;assert p.exists(),file
 x=ET.parse(p).getroot();assert x.attrib.get('shape-rendering')=='crispEdges'
for v in m['vehicles'].values():assert len(v['windows'])==v['seats']
print(f'Art validation passed: {len(paths)} files, all SVGs parse; all vehicle seats have window coordinates.')
