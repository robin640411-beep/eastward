import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Game} from '../dist/engine.js';
import {COMBAT_BOSSES,COMBAT_BOSS_NAMES,enemyCombatArt} from '../dist/combat-art.js';
import {bossDefinition,regionEnemyPool} from '../dist/progression-runtime.js';
import {XP_LEVEL_CAP,xpToNext,totalXpToMax,MINI_BOSSES,MID_BOSSES,milestoneBossPlan} from '../dist/xp-boss-catalog.js';

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

test('15 distinct bosses (5 mini, 5 mid, 5 final) all have valid 128x128 pixel-art PNGs',()=>{
 assert.equal(MINI_BOSSES.length,5);
 assert.equal(MID_BOSSES.length,5);
 assert.equal(COMBAT_BOSSES.length,15);
 for(const id of COMBAT_BOSSES){
  assert(COMBAT_BOSS_NAMES[id],'Missing boss name for '+id);
  const art=enemyCombatArt({bossId:id});
  assert.equal(art.kind,'boss');
  assert.equal(art.width,128);
  assert.equal(art.height,128);
  const full=new URL('../dist/'+art.image,import.meta.url);
  assert(fs.existsSync(full),'Missing boss PNG '+art.image);
 }
});

test('XP curve reaches Lv.18 on 10000 km but never on 3000 km or 5000 km',()=>{
 assert.equal(XP_LEVEL_CAP,18);
 assert.equal(xpToNext(1),20);
 assert.equal(xpToNext(18),0);
 assert.equal(totalXpToMax(),2788);

 // Simulate typical XP per journey (~16.5 XP/stop): 3000km=54 stops (~891 XP), 5000km=91 stops (~1500 XP), 10000km=182 stops (~3003 XP)
 const simLevel=(totalXp)=>{
  const g=new Game(data);
  g.start({seed:77,totalKm:10000});
  g.grantPartyXp(totalXp,'模擬');
  return g.s.party[0].level;
 };
 const lv3k=simLevel(900);
 const lv5k=simLevel(1550);
 const lv10k=simLevel(3000);
 assert(lv3k>=9&&lv3k<=11,'3000 km expected Lv.9-11, got '+lv3k);
 assert(lv5k>=12&&lv5k<=15,'5000 km expected Lv.12-15, got '+lv5k);
 assert.equal(lv10k,18,'10000 km should reach max Lv.18');
});

test('3000 km & 5000 km end with a Mid-Boss; only 10000 km faces a Grand Final Boss; mid-way milestones fire',()=>{
 // 3000 km
 const g3=new Game(data);
 g3.start({seed:301,totalKm:3000});
 assert.equal(g3.s.bossPlan.finaleTier,'mid');
 assert(MID_BOSSES.some(b=>b.id===bossDefinition(g3.s).id),'3000 km finale must be a Mid-Boss');
 // Mid-way Mini-Boss triggers at 1500 km (progress 150)
 g3.s.progress=150;
 g3.s.frames=[{kind:'road',count:0,scene:null}];
 g3.nextEvent();
 assert.equal(g3.s.battle?.bossTier,'mini');
 assert(MINI_BOSSES.some(b=>b.id===g3.s.battle.enemies[0].bossId));

 // 5000 km
 const g5=new Game(data);
 g5.start({seed:501,totalKm:5000});
 assert.equal(g5.s.bossPlan.finaleTier,'mid');
 assert(MID_BOSSES.some(b=>b.id===bossDefinition(g5.s).id),'5000 km finale must be a Mid-Boss');
 assert.equal(g5.s.bossPlan.milestones.length,2);

 // 10000 km
 const g10=new Game(data);
 g10.start({seed:1001,totalKm:10000});
 assert.equal(g10.s.bossPlan.finaleTier,'final');
 assert(['overseer','broodmother','zero_core','graft_colossus','fallen_angel'].includes(bossDefinition(g10.s).id),'10000 km finale must be a Grand Final Boss');
 assert.equal(g10.s.bossPlan.milestones.length,4);

 // Enemy scaling: +1 tier every 1000 km on long journeys
 g10.s.progress=1;assert.equal(regionEnemyPool(g10.s).region,1);
 g10.s.progress=101;assert.equal(regionEnemyPool(g10.s).region,2);
 g10.s.progress=501;assert.equal(regionEnemyPool(g10.s).region,6);
 g10.s.progress=950;assert.equal(regionEnemyPool(g10.s).region,10);
});
