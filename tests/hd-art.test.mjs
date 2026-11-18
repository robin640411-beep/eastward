import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {useHdArt} from '../dist/hd-art.js';
import {STARTER_VEHICLES,starterVehicle,vehicleArt,vehicleStats} from '../dist/vehicle-runtime.js';
import {sizeStage} from '../dist/hd-stage.js';

const read=path=>JSON.parse(readFileSync(new URL('../dist/'+path,import.meta.url)));
const base=read('assets/manifest.json'),art=read('assets/hd2d/catalog.json');
const active=useHdArt(base,art);
test('every race and job uses new art from the live catalog, with all vehicle rules preserved',()=>{
  const {races,professions}=read('data/npc-catalog.json');
  for(const race of races){
    assert(active.portraits[race.id]?.startsWith('hd2d/'));
    for(const job of professions)assert(active.characters[race.id+'_'+job.id]?.startsWith('hd2d/'));
  }
  const images=[...Object.values(art.characters),...Object.values(art.portraits),
    ...Object.values(art.vehicles).map(v=>v.image),...Object.values(art.starters).map(v=>v.image)];
  assert.equal(new Set(images).size,270);
  for(const path of images)assert.equal(readFileSync(new URL('../dist/assets/'+path,import.meta.url)).subarray(1,4).toString(),'PNG');
  const fleet=[...Object.keys(base.vehicles).map(model=>({model,mods:[]})),...STARTER_VEHICLES.map(v=>starterVehicle(v.roll))];
  for(const vehicle of fleet){
    const stats=vehicleStats(base,vehicle);
    for(let n=0;n<=stats.limit;n++){
      const upgraded={...vehicle,mods:Array(n).fill('seat')};
      assert.deepEqual(vehicleStats(active,upgraded),vehicleStats(base,upgraded));
      const body=vehicleArt(active,upgraded);
      assert(body.glazing);assert.equal(body.windows.length,Math.min(4,stats.seats+n));
      for(const {x,y,width,height} of body.windows){
        assert(x>=0&&x+width<=160&&y>=0&&y+height<=72);
      }
    }
  }
});
test('portrait stage fills the allotted canvas and preserves overlay hit coordinates',()=>{
  for(const [width,height] of [[320,284],[390,422],[550,400]]){
    const style=new Map();
    const canvas={clientWidth:width,clientHeight:height,parentElement:{style:{setProperty:(k,v)=>style.set(k,v)}}};
    const stage=sizeStage(canvas);
    assert.equal(canvas.width,width);
    assert.equal(canvas.height,height);
    assert(Math.abs((stage.top+stage.bottom+240)*stage.scale-height)<.001);
    assert.equal(parseFloat(style.get('--viewport-top')),stage.top*stage.scale/height*100);
    assert.equal(parseFloat(style.get('--viewport-height')),240*stage.scale/height*100);
  }
});
