import json,xml.etree.ElementTree as ET,struct
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
 if p.suffix=='.svg':
  x=ET.parse(p).getroot();assert x.attrib.get('shape-rendering')=='crispEdges'
 elif p.suffix=='.png':
  b=p.read_bytes();assert b[:8]==b'\x89PNG\r\n\x1a\n';assert all(n>0 for n in struct.unpack('>II',b[16:24]))
 else:raise AssertionError(file)
for v in m['vehicles'].values():assert len(v['windows'])==v['seats']
print(f'Art validation passed: {len(paths)} files, SVG and PNG formats valid; all vehicle seats have window coordinates.')
