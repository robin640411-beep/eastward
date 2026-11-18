import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {paintHorizon,horizonPostcard} from '../dist/horizon-art.js';
import {lightingAt} from '../dist/journey-view-model.js';
import {SKY_PROFILES,skyState,cloudLayout,skyBands} from '../dist/atmosphere.js';
import {BIOMES} from '../dist/route-catalog.js';

test('sun rises in the east, sets in the west and yields to the moon without popping',()=>{
 const at=h=>skyState({minutes:h*60,from:{id:'salt'}});
 assert(at(6).day);assert(at(12).day);assert(!at(23).day);
 assert(at(6).x>at(12).x&&at(12).x>at(18).x);
 assert(at(12).y<at(6).y&&at(12).y<at(18).y);
 for(const h of [5,19]){assert(at(h-.001).visibility<.001);assert(at(h+.001).visibility<.001);}
 assert.deepEqual(at(24),at(0));
 for(let m=-1440;m<4320;m+=11){const s=skyState({minutes:m,from:{id:'salt'}});for(const key of ['x','y','visibility','cloud','mist'])assert(Number.isFinite(s[key]));assert(s.visibility>=0&&s.visibility<=1);}
});
test('all biomes blend sky atmosphere smoothly, with heavy storm obscuring sunlight',()=>{
 assert.equal(Object.keys(SKY_PROFILES).length,12);
 for(const from of BIOMES)for(const to of BIOMES){const opts={minutes:720,from,to};const a=skyState({...opts,blend:.5}),b=skyState({...opts,blend:.501});assert(Math.abs(a.cloud-b.cloud)<.001);assert(Math.abs(a.mist-b.mist)<.001);const storm=skyState({...opts,storm:1});assert.equal(storm.cloud,1);assert(storm.visibility<=.051);}
});
test('cloud drift is continuous and deterministic, bounded at long travel distances and quieter in soft mode',()=>{
 assert.deepEqual(cloudLayout(445,10,20),cloudLayout(445,10,20));
 assert.notDeepEqual(cloudLayout(445,10,20),cloudLayout(446,10,20));
 const a=cloudLayout(445,10,20),b=cloudLayout(445,10.01,20),soft=cloudLayout(445,10.01,20,true),soft0=cloudLayout(445,10,20,true);
 assert.equal(a.length,7);for(let i=0;i<a.length;i++){assert(Math.abs(a[i].x-b[i].x)<.02);assert(Math.abs(soft[i].x-soft0[i].x)<Math.abs(a[i].x-b[i].x));}
 for(const c of cloudLayout(445,1e9,1e12)){assert(c.x>=-130&&c.x<520);assert(c.y>=0&&c.y+c.h<70);}
});

test('the road and postcards share native square pixels and isolate each atlas cell',()=>{
 const assets=JSON.parse(readFileSync(new URL('../dist/assets/manifest.json',import.meta.url)));
 for(const [i,{id,name}] of BIOMES.entries()){
  const region=assets.worlds[id],sheet={},calls=[];
  assert.deepEqual(region.rect,[(i%4)*256,Math.floor(i/4)*76,256,76]);
  paintHorizon({drawImage:(...args)=>calls.push(args)},sheet,region,17.45,3.8,2);
  assert.deepEqual(calls,[[sheet,...region.rect,17,4,512,152]]);
  const picture=horizonPostcard(region,name);
  assert(picture.includes('overflow="hidden" viewBox="'+region.rect.join(' ')+'"'));
  assert(picture.includes('assets/'+region.image));
 }
});

test('palette bands cover the full extended sky without seams at every hour',()=>{
 for(const above of [0,1,55,99,218])for(const minutes of [0,379,720,1090,1439])for(const storm of [0,.55,1]){
  let end=0-above;
  for(const {y,h,color} of skyBands(lightingAt(minutes),storm,above)){
   assert.equal(y,end);assert(h>0&&Number.isInteger(h));assert.match(color,/^#[0-9a-f]{6}$/);
   end+=h;
  }
  assert.equal(end,180);
 }
});
