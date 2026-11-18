import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Game,display} from '../dist/engine.js';
import {automaticDecision,syncMessageContext} from '../dist/automatic-journey.js';
import {encounterCommands} from '../dist/encounter-commands.js';

const read=path=>JSON.parse(readFileSync(new URL('../dist/'+path,import.meta.url)));
const data={assets:read('assets/manifest.json'),catalog:read('data/npc-catalog.json'),oracles:read('data/oracles.json'),events:read('data/events.json'),buildings:read('data/building-events.json'),traits:read('data/traits.json')};
function game(){
 const g=new Game(data);g.start({seed:445,race:'human',profession:'driver'});return g;
}
function encounter(g,id){
 const inside=id.startsWith('building_'),original=g.oracle.bind(g);
 const table=inside?'building_event':'road_event';
 g.oracle=key=>key===table?{roll:1,event:id}:key==='npc_attitude'?{value:'友善'}:original(key);
 g.s.frames=[{kind:inside?'building':'road',count:0}];g.nextEvent();
}
test('all automatic rewards settle at discovery once, including gifts and building containers',()=>{
 const events=[...data.events.events,...data.buildings.events].filter(e=>e.automatic_reward);
 assert.equal(events.length,37);
 for(const e of events){
  const g=game();encounter(g,e.id);
  if(g.s.current.building){assert(!g.s.current.rewardReceipt);g.enterBuilding();}
  const c=g.s.current;assert(c.rewardReceipt,e.title);assert.equal(c.event.options.length,0);
  syncMessageContext(g,display);assert(g.s.messages.at(-1).text.endsWith(c.rewardReceipt));
  assert.equal(g.s.messages.filter(m=>m.title===c.event.title&&m.text.endsWith(c.rewardReceipt)).length,1);
  assert(!encounterCommands(g,display).some(x=>x.action==='choose'),e.title);
  const before=structuredClone(g.s);assert(!g.collectReward());assert(!g.choose(e.automatic_reward));
  const loaded=new Game(data,structuredClone(g.s));assert.deepEqual(loaded.s.resources,before.resources);assert.deepEqual(loaded.s.inventory,before.inventory);assert.equal(loaded.s.rng,before.rng);
 }
});
test('a preview never grants resources or consumes RNG, while a military crate is collected roadside',()=>{
 const g=game();g.depart();const before=JSON.stringify(g.s);g.previewArrival();g.previewArrival();assert.equal(JSON.stringify(g.s),before);
 const held=g.s.inventory.length;encounter(g,'road_025');assert(!g.s.current.building);assert.equal(g.s.inventory.length,held+1);assert.equal(automaticDecision(g),'finish');
});
test('a pending legacy pickup pays exactly once; an empty legacy option list never pays',()=>{
 const g=game(),e=structuredClone(data.events.events.find(e=>e.id==='road_006'));delete e.automatic_reward;
 e.options.push({id:'leave',requires:[],effects:[]});
 g.s.mode='event';g.s.current={instance:3,event:e,resolved:false};
 const before=g.s.resources.medicine,old=structuredClone(g.s),loaded=new Game(data,structuredClone(old));
 assert.equal(loaded.s.resources.medicine,before+1);assert.match(loaded.s.notice,/藥品 ×1/);
 const reloaded=new Game(data,structuredClone(loaded.s));assert.equal(reloaded.s.resources.medicine,before+1);
 old.current.event.options=[];assert.equal(new Game(data,old).s.resources.medicine,before);
});
test('caps, spare fuel and scavenging bonuses appear in the actual receipt',()=>{
 const g=game();g.s.vehicle.hp=g.s.vehicle.maxHp-2;encounter(g,'road_008');assert.match(g.s.notice,/修復車況 \+2/);
 g.actor().profession='scavenger';g.actor().flaw='restless';const scrap=g.s.resources.scrap;encounter(g,'road_013');assert.equal(g.s.resources.scrap,scrap+3);assert.match(g.s.notice,/廢料 ×3/);
 g.add('fuel',100);const fuel=g.availableFuel();encounter(g,'road_032');assert.equal(g.availableFuel(),fuel+5);assert.match(g.s.notice,/汽油 ×5/);
});
test('free care only asks which injured person to treat and does not charge or heal twice',()=>{
 const g=game(),p=g.actor(),q=g.person('alien','medic');g.s.party.push(q);p.hp-=2;q.hp-=3;encounter(g,'road_015');g.enterBuilding();
 const opts=encounterCommands(g,display);assert.deepEqual(opts.map(o=>o.args),['care_'+p.id,'care_'+q.id]);assert.equal(automaticDecision(g),'wait');
 const before=p.hp;assert(g.choose('care_'+q.id));assert.equal(p.hp,before);assert.equal(q.hp,q.maxHp);assert.match(g.s.notice,/恢復 3 點/);assert(!g.choose('care_'+q.id));
 const single=game();single.actor().hp-=1;encounter(single,'road_015');single.enterBuilding();assert.equal(single.actor().hp,single.actor().maxHp);assert(!single.s.current.carePending);
});
test('shops, hostile benefactors and meaningful specialist alternatives keep their normal rules',()=>{
 const g=game();encounter(g,'road_001');assert(!g.s.current.rewardReceipt);assert(g.enterBuilding());assert(g.options().some(o=>o.id==='service'));
 const tech=game(),h=tech.person('human','hacker');tech.s.party.push(h);encounter(tech,'building_010');
 assert(!tech.s.current.rewardReceipt);assert.deepEqual(encounterCommands(tech,display).map(o=>o.args),['take','reward_specialist']);
 const minutes=tech.s.minutes;assert(tech.choose('reward_specialist'));assert.equal(tech.s.minutes,minutes+5);assert(!tech.choose('take'));
 const enemy=game(),original=enemy.oracle.bind(enemy);enemy.oracle=key=>key==='road_event'?{roll:31,event:'road_031'}:key==='npc_attitude'?{value:'敵對'}:original(key);
 enemy.s.frames=[{kind:'road',count:0}];const fuel=enemy.availableFuel();enemy.nextEvent();assert(enemy.s.battle);assert(!enemy.collectReward());assert.equal(enemy.availableFuel(),fuel);
});
