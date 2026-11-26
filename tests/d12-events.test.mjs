import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Game} from '../dist/engine.js';
import {JOURNEY_DISTANCES,createRoute,remainingKm,totalProgressFor,regionCountFor,routeView} from '../dist/route-runtime.js';
import {regionEnemyPool} from '../dist/progression-runtime.js';

const load=p=>JSON.parse(fs.readFileSync(new URL('../dist/'+p,import.meta.url),'utf8'));
const data={
 assets:load('assets/manifest.json'),
 catalog:load('data/npc-catalog.json'),
 oracles:load('data/oracles.json'),
 events:load('data/events.json'),
 buildings:load('data/building-events.json'),
 traits:load('data/traits.json'),
 encounters:load('assets/encounters.json'),
 endings:load('data/endings.json'),
 d12Events:load('data/d12-events.json'),
};

const VALID_OPS=new Set(['resource','resource_loss','world_minutes','open_service','npc_interaction','recruit','offer_recruit','reveal_history','oracle','combat','attempt_escape','damage','heal','stamina_cost','travel_cost','schedule_followup','event_check','morality']);

test('d12-events catalog has 12 categories x 100 unique D100 situations with valid art and effects',()=>{
 const d12=data.d12Events;
 assert.equal(d12.categories.length,12);
 const titles=new Set(),ids=new Set();
 for(let i=0;i<12;i++){
  const cat=d12.categories[i];
  assert.equal(cat.d12,i+1);
  assert.equal(cat.events.length,100);
  for(let j=0;j<100;j++){
   const ev=cat.events[j];
   assert.equal(ev.d12,i+1);
   assert.equal(ev.d100,j+1);
   assert(!ids.has(ev.id),'Duplicate id '+ev.id);
   assert(!titles.has(ev.title),'Duplicate title '+ev.title);
   ids.add(ev.id);titles.add(ev.title);
   assert(!/D100|神諭|擲骰|試玩|草案/.test(ev.text),'Forbidden meta text in '+ev.id);
   assert(data.encounters[ev.artRef],'Missing artRef '+ev.artRef+' in '+ev.id);
   assert(Array.isArray(ev.options)&&ev.options.length>=1,'Event must have options: '+ev.id);
   for(const o of ev.options){
    assert(!/D100|神諭|擲骰|試玩|草案/.test(o.result_text||''),'Forbidden meta text in option '+ev.id);
    for(const f of o.effects){
     assert(VALID_OPS.has(f.op),'Invalid effect op '+f.op+' in '+ev.id);
    }
   }
  }
 }
 assert.equal(ids.size,1200);
 assert.equal(titles.size,1200);
});

test('nextEvent rolls D12 category then D100 situation across all 12 categories',()=>{
 const g=new Game(data);
 g.start({seed:4242,totalKm:3000});
 const hitCategories=new Set();
 const hitEvents=new Set();
 for(let i=0;i<180;i++){
  g.s.battle=null;
  g.s.mode='ready';
  g.s.stop=i+1;
  g.s.usedStory=[];
  g.s.frames=[{kind:'road',count:0,scene:null}];
  g.nextEvent();
  const ev=g.s.current?.event;
  assert(ev&&ev.id.startsWith('cat_'),'Expected D12+D100 event, got '+ev?.id);
  assert.equal(g.s.dice.kind,'D12+D100');
  assert(g.s.dice.d12>=1&&g.s.dice.d12<=12);
  assert(g.s.dice.d100>=1&&g.s.dice.d100<=100);
  hitCategories.add(g.s.dice.d12);
  hitEvents.add(ev.id);
 }
 assert.equal(hitCategories.size,12,'All 12 D12 categories should be reachable');
 assert(hitEvents.size>100,'Should sample well over 100 distinct events across 180 draws');
});

test('3000, 5000 and 10000 km journey options create scaled routes, enemy pacing, and finale gates',()=>{
 assert.deepEqual(JOURNEY_DISTANCES,[3000,5000,10000]);
 for(const km of JOURNEY_DISTANCES){
  const maxProg=totalProgressFor(km);
  const expectedRegions=km/100;
  assert.equal(maxProg,km/10);
  assert.equal(regionCountFor(km),expectedRegions);
  const route=createRoute(777,undefined,km);
  assert.equal(route.regions.length,expectedRegions);
  assert.equal(remainingKm(1,km),km);
  assert.equal(remainingKm(maxProg,km),0);

  const g=new Game(data);
  g.startRandom(888,km);
  assert.equal(g.s.totalKm,km);
  assert.equal(g.s.route.regions.length,expectedRegions);
  assert.equal(routeView(g.s,0).remainingKm,km);

  // Enemy pool scales by actual kilometres travelled (+1 tier every 1000 km)
  assert.equal(regionEnemyPool(g.s).region,1);
  g.s.progress=maxProg-1;
  assert.equal(regionEnemyPool(g.s).region,Math.min(10,Math.floor(((maxProg-2)*10)/1000)+1));

  // Arriving at maxProg triggers final boss gate
  g.s.mode='ready';
  g.s.resources.fuel=50;
  g.s.party[0].st=24;
  assert.equal(g.depart(),true);
  assert.equal(g.s.travel.n,1);
  g.arrive();
  assert.equal(g.s.progress,maxProg);
  assert.equal(g.s.current?.finalGate,true);
  assert.equal(g.s.battle?.finalBoss,true);
 }
});
