"""Register atlas crop rectangles; generated PNG pixels remain unchanged."""
from pathlib import Path
import json
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
manifest_path = ROOT / 'dist/assets/manifest.json'
manifest = json.loads(manifest_path.read_text())
races = json.loads((ROOT / 'dist/data/npc-catalog.json').read_text())['races']
entries = {}
for weapon, filename in [('club', 'npc-melee-atlas.png'), ('pistol', 'npc-pistol-atlas.png')]:
    image = Image.open(ROOT / 'dist/assets/painted' / filename)
    assert image.mode == 'RGBA'
    width, height = image.size
    alpha = image.getchannel('A')
    assert alpha.getextrema() == (0, 255)
    for index, race in enumerate(races):
        column, row = index % 4, index // 4
        left, right = round(column * width / 4), round((column + 1) * width / 4)
        top, bottom = round(row * height / 3), round((row + 1) * height / 3)
        bounds = alpha.crop((left, top, right, bottom)).point(lambda a: 255 if a > 32 else 0).getbbox()
        assert bounds and bounds[2] - bounds[0] > 100 and bounds[3] - bounds[1] > 200
        x0, y0 = max(left, left + bounds[0] - 6), max(top, top + bounds[1] - 6)
        x1, y1 = min(right, left + bounds[2] + 6), min(bottom, top + bounds[3] + 6)
        entries[race['id'] + '_' + weapon] = {
            'image': 'painted/' + filename,
            'rect': [x0, y0, x1 - x0, y1 - y0],
            'size': [width, height],
            'cell': [left, top, right - left, bottom - top],
            'race': race['id'], 'weapon': weapon
        }
manifest['npcBattleAtlas'] = entries
manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
(ROOT / 'art-direction/npc-battle-atlas-layout.json').write_text(json.dumps({
    'version': 1, 'style_reference': 'painted/enemies-atlas.png',
    'source_unchanged': True, 'sprites': entries
}, ensure_ascii=False, indent=2) + '\n')
print('Linked 12 races × 2 weapons; all 24 complete transparent battle sprites.')
