import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {Game} from '../dist/engine.js';
import {createRoute,biomeAt,routeView,nameEncounter,BIOMES} from '../dist/route-runtime.js';
import {PLACE_NAMES} from '../dist/route-catalog.js';
const read=p=>JSON.parse(readFileSync(new URL('../dist/'+p,import.meta.url)));
const d={assets:read('assets/manifest.json'),catalog:read('data/npc-catalog.json'),oracles:read('data/oracles.json'),events:read('data/events.json'),buildings:read('data/building-events.json'),traits:read('data/traits.json')};
function fresh(seed=123){const g=new Game(d);g.start({seed});return g;}
test('100 route positions belong to ten persistent ten-position regions',()=>{
 const route=createRoute(22);assert.equal(route.regions.length,10);
 for(let i=1;i<=100;i++){const b=biomeAt(i,22,route);assert.equal(b.index,Math.floor((i-1)/10));assert(i>=b.start&&i<=b.end);assert.equal(b.name,PLACE_NAMES[b.nameRoll-1]+BIOMES[b.terrainRoll-1].name);}
 assert.deepEqual(createRoute(22),route);assert.notDeepEqual(createRoute(23),route);
});
test('D12 allows all terrains including consecutive repeats and a random final region',()=>{
 const ids=new Set(),last=new Set();let repeated=false;
 for(let seed=1;seed<=100;seed++){const {regions}=createRoute(seed);regions.forEach((r,i)=>{ids.add(r.id);if(i&&r.id===regions[i-1].id)repeated=true;});last.add(regions[9].id);}
 assert.equal(ids.size,12);assert.equal(last.size,12);assert(repeated);
 const repeats=createRoute(1,sides=>sides===12?3:7);assert(repeats.regions.every(r=>r.id==='forest'&&r.name==='星落森林'));
});
test('D100 names and D12 terrain tables have one valid outcome per die face',()=>{
 assert.equal(new Set(PLACE_NAMES).size,100);assert.equal(BIOMES.length,12);
 for(const [id,n] of [['location_name',100],['route_terrain',12]]){const table=d.oracles.tables.find(t=>t.id===id);assert.equal(table.rows.length,n);for(let face=1;face<=n;face++){assert.equal(table.rows.filter(r=>face>=r.min&&face<=r.max).length,1);const g=fresh();g.roll=sides=>{assert.equal(sides,n);return face;};assert.equal(g.oracle(id).value,table.rows[face-1].value);}}
});
test('region advances at actual distance boundaries, never per stop or per render',()=>{
 const g=fresh();g.s.progress=9;g.s.mode='driving';g.s.travel={n:8};const before=structuredClone(g.s);
 assert.equal(routeView(g.s,0).current.index,0);assert.equal(routeView(g.s,.5).current.index,1);assert.equal(routeView(g.s,1).current.index,1);
 g.s.stop+=20;assert.equal(routeView(g.s,0).current.index,0);g.s.stop=before.stop;assert.deepEqual(g.s,before);
});
test('terrain transition and roadside sign remain continuous across arrival and reload',()=>{
 const g=fresh();g.s.progress=9;g.s.mode='driving';g.s.travel={n:2};const end=routeView(g.s,1);assert.equal(end.current.index,1);assert(Math.abs(end.blend-.5)<.00001);assert.equal(end.sign.name,g.s.route.regions[1].name);
 const near=routeView(g.s,.9999);assert(Math.abs(near.blend-end.blend)<.0001);assert(Math.abs(near.signX-end.signX)<.001);
 g.s.progress=11;g.s.mode='event';g.s.travel=null;assert.deepEqual(routeView(g.s),end);
 assert.deepEqual(routeView(new Game(d,structuredClone(g.s)).s),end);
});
test('legacy save receives a stable route without spending RNG, time or resources',()=>{
 const g=fresh();g.s.progress=64;delete g.s.route;const before=structuredClone(g.s),loaded=new Game(d,structuredClone(before));const route=loaded.s.route;assert.equal(route.regions.length,10);assert.equal(routeView(loaded.s).current.index,6);
 delete loaded.s.route;assert.deepEqual(loaded.s,before);loaded.s.route=route;assert.deepEqual(new Game(d,structuredClone(loaded.s)).s.route,route);
});
test('named buildings retain names indoors, across services, and on return to car',()=>{
 const g=fresh();g.s.mode='event';g.s.frames=[{kind:'road',count:1}];g.s.current={instance:19,event:structuredClone(d.events.events.find(e=>e.id==='road_001')),building:true};nameEncounter(g.s);
 const place=structuredClone(g.s.current.place);assert(place.name.endsWith('加油站'));const rng=g.s.rng;
 g.enterBuilding();assert.deepEqual(g.s.current.place,place);g.s.current.event.options=[];g.s.frames.push({kind:'building',count:1,parent:structuredClone(g.s.current)});
 g.s.current={instance:20,event:structuredClone(d.buildings.events.find(e=>e.id==='building_046'))};nameEncounter(g.s);assert.equal(g.s.current.place.name,place.name);assert(g.s.current.place.inherited);
 g.s.current={instance:21,event:structuredClone(d.buildings.events.find(e=>e.id==='building_016'))};nameEncounter(g.s);assert(g.s.current.place.name.endsWith('雜貨店'));assert(!g.s.current.place.inherited);assert.equal(g.s.rng,rng);
 const named=structuredClone(g.s.current);nameEncounter(g.s);assert.deepEqual(g.s.current,named);
});
