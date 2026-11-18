"""Rebuild all original pixel assets and reattach generated atlas sources."""
from pathlib import Path
import subprocess,sys,shutil
R=Path(__file__).resolve().parents[1]
for name in ['make_art.py','make_event_art.py','redraw_characters.py','redraw_vehicles.py','redraw_scenery.py','link_painted_art.py','link_npc_battle_art.py']:
 subprocess.run([sys.executable,str(R/'tools'/name)],cwd=R,check=True)

node=shutil.which("node") or str(Path.home()/".cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node")
subprocess.run([node,str(R/"tools/build-starters.mjs")],cwd=R,check=True)
subprocess.run([sys.executable,str(R/"tools/check_art.py")],cwd=R,check=True)
