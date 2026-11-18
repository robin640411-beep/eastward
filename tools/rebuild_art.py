"""Rebuild all original pixel assets and reattach generated atlas sources."""
from pathlib import Path
import subprocess,sys
R=Path(__file__).resolve().parents[1]
for name in ['make_art.py','make_event_art.py','redraw_characters.py','redraw_vehicles.py','redraw_scenery.py','link_painted_art.py','check_art.py']:
 subprocess.run([sys.executable,str(R/'tools'/name)],cwd=R,check=True)
