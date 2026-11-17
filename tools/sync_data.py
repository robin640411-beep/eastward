from pathlib import Path
import shutil
root=Path(__file__).resolve().parents[1]
for p in (root/'spec').glob('*.json'):
 if p.name=='game-design.json':continue
 shutil.copy2(p,root/'dist/data'/p.name)
print('Content JSON synced to dist/data.')
