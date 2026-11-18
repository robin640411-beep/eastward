import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {eventVolume,interiorSet} from '../dist/volume-events.js';
import {facadeProjection,roadSun} from '../dist/volume-light.js';
import {ROADSIDE_ATLAS} from '../dist/roadside-atlas.js';
import {ROADSIDE_PROFILES} from '../dist/roadside-model.js';

const path=file=>new URL('../dist/assets/'+file,import.meta.url);
const read=file=>JSON.parse(readFileSync(path(file)));
const buildings=read('volume/buildings.json'),extra=read('volume/event-art.json');
const assets={...buildings,props:extra.props,interiors:{...buildings.interiors,...extra.interiors}};
const encounters=Object.values(read('encounters.json'));
test('all encounter approaches, road decorations and interior sets use published volume art',()=>{
  assert.equal(encounters.length,202);assert.equal(Object.keys(assets.facilities).length,17);
  assert.equal(Object.keys(assets.interiors).length,14);
  for(const table of [assets.facilities,assets.props,assets.interiors])for(const a of Object.values(table)){
    assert(existsSync(path(a.image)),a.image);assert.deepEqual(a.rect,[0,0,...a.size]);
  }
  for(const p of Object.values(ROADSIDE_PROFILES))for(const kind of p.facades)assert(assets.facilities[kind]);
  for(const a of encounters){
    const v=eventVolume(a,a.interior,assets);
    assert.notEqual(v.type,'legacy',a.title);
    if(v.type==='set')assert(assets.interiors[interiorSet(a)],a.title);
    if(v.type==='prop')assert(assets.props[v.key],a.title);
    if(v.type==='roadside')assert(ROADSIDE_ATLAS[v.key],a.title);
  }
});
test('an empty safe, dry pool and empty room have different set dressing from a reward or flooded room',()=>{
  const visual=title=>{const a=encounters.find(e=>e.title===title);return eventVolume(a,a.interior,assets)};
  assert.equal(visual('已開啟的保險箱').key,'openSafe');
  assert.equal(visual('撞開的保險箱').key,'safe');
  assert.equal(visual('乾燥水池').type,'set');
  assert.equal(visual('淹水房間').key,'flood');
  assert.equal(visual('空房間').type,'set');
});
test('the camera exposes the end wall on approach and the cast shadow crosses the base at noon',()=>{
  for(const kind of Object.keys(assets.facilities)){
    const left=facadeProjection(kind,-84,120),right=facadeProjection(kind,320,120);
    assert(left.left<left.joint&&right.joint<right.right);
    assert(right.right-right.joint>left.right-left.joint);
  }
  assert(roadSun(480).offset<0);assert(roadSun(1000).offset>0);
  assert.equal(roadSun(1300).strength,0);
});
