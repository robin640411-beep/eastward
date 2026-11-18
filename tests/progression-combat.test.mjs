import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync,existsSync} from 'node:fs';
import {Game,ITEMS} from '../dist/engine.js';import {setLevel,bossDefinition} from '../dist/progression-runtime.js';import {GROWTH} from '../dist/progression-catalog.js';import {enemyLayout} from '../dist/journey-view-model.js';
const read=p=>JSON.parse(readFileSync(new URL('../dist/'+p,import.meta.url)));
const d={assets:read('assets/manifest.json'),catalog:read('data/npc-catalog.json'),oracles:read('data/oracles.json'),events:read('data/events.json'),buildings:read('data/building-events.json'),traits:read('data/traits.json')};
function fresh(seed=123){const g=new Game(d);g.start({seed});return g;}
const event=()=>({resolved:false,event:{id:'road_011',title:'已搜索的箱子',text:'搜索結束。',options:[]}});
test('four chained events grant exactly one party level only after the last event',()=>{
 const g=fresh();g.s.party.push(g.person());const before=g.s.party.map(p=>p.level);g.s.mode='event';g.s.stop=1;g.s.frames=[{kind:'road',count:1}];g.s.current=event();g.roll=()=>1;g.nextEvent=()=>{g.s.frames.at(-1).count++;g.s.current=event();};
 for(let i=0;i<3;i++){g.finishEvent();assert.deepEqual(g.s.party.map(p=>p.level),before);}
 g.finishEvent();assert.equal(g.s.mode,'ready');assert.deepEqual(g.s.party.map(p=>p.level),before.map(n=>n+1));g.finishEvent();assert.deepEqual(g.s.party.map(p=>p.level),before.map(n=>n+1));assert.equal(g.s.rewardedStops.length,1);
});
test('nested building exploration and services do not award separate levels',()=>{
 const g=fresh();g.s.mode='event';g.s.stop=3;const parent=event();parent.service='garage';parent.inside=true;g.s.frames=[{kind:'road',count:4},{kind:'building',count:4,parent}];g.s.current=event();const level=g.actor().level;g.finishEvent();assert.equal(g.actor().level,level);assert.equal(g.s.current.service,'garage');g.finishEvent();assert.equal(g.actor().level,level+1);
});
test('all party members level, with cap eighteen and no revival or repeat reward',()=>{
 const g=fresh();for(let i=0;i<3;i++)g.s.party.push(g.person());g.s.party.forEach((p,i)=>setLevel(p,i===1?18:17));g.s.party[2].hp=0;g.s.party[3].asleep=true;
 g.completeStop('road:2');assert(g.s.party.every(p=>p.level===18));assert.equal(g.s.party[2].hp,0);assert(g.s.party[3].asleep);const before=structuredClone(g.s.party);g.completeStop('road:2');g.completeStop('road:3');assert.deepEqual(g.s.party,before);
});
test('victory does not award XP or a level before the outer event completes',()=>{
 const g=fresh();g.s.mode='event';g.s.stop=1;g.s.frames=[{kind:'road',count:4}];g.s.current=event();g.beginCombat();g.s.battle.enemies=g.s.battle.enemies.slice(0,1);Object.assign(g.s.battle.enemies[0],{hp:1,speed:0});g.roll=()=>1;g.combatRound({type:'attack'});assert.equal(g.actor().level,1);assert.equal(g.actor().xp,0);g.finishEvent();assert.equal(g.actor().level,2);
});
test('new recruits span protagonist plus-minus one, random equipment, and level bounds',()=>{
 const gear=new Set(),offsets=new Set();for(let level=1;level<=18;level++)for(let seed=1;seed<=30;seed++){const g=fresh(seed);setLevel(g.actor(),level);g.s.vehicle.model='van';const p=g.person();p.attitude='友善';g.s.mode='event';g.s.current={...event(),npc:p};assert(g.recruit());assert(p.level>=Math.max(1,level-1)&&p.level<=Math.min(18,level+1));assert.equal(p.maxHp,24-(p.flaw==='frail'?2:0)+(p.level-1)*3);Object.values(p.gear).filter(Boolean).forEach(id=>{assert(ITEMS[id]);gear.add(id);});if(level>1&&level<18)offsets.add(p.level-level);}
 assert.equal(gear.size,6);assert.deepEqual([...offsets].sort(),[-1,0,1]);
});
test('rejoining companion retains worn gear while level matches the current protagonist',()=>{
 const g=fresh();g.s.vehicle.model='van';const p=g.person();p.gear={武器:'pistol',防具:'vest',配件:'charm'};const gear=structuredClone(p.gear);setLevel(g.actor(),15);g.s.mode='event';p.attitude='友善';g.s.current={...event(),npc:p};assert(g.recruit());assert(p.level>=14&&p.level<=16);assert.deepEqual(p.gear,gear);
});
test('ten regions each expose five enemy types, one to three units, and increasing stats and sizes',()=>{
 let hp=0,scale=0;for(const region of GROWTH.regions){assert.equal(new Set(region.enemies).size,5);const seen=new Set(),counts=new Set();for(let seed=1;seed<=80;seed++){const g=fresh(seed);g.s.progress=region.start;g.beginCombat();counts.add(g.s.battle.enemies.length);for(const e of g.s.battle.enemies){assert(region.enemies.includes(e.key));seen.add(e.key);assert.equal(e.scale,region.body_scale);}}
 assert.equal(seen.size,5);assert.deepEqual([...counts].sort(),[1,2,3]);assert(region.health>hp);assert(region.body_scale>scale);hp=region.health;scale=region.body_scale;
 }const small=enemyLayout(3,[{scale:.68}])[0],large=enemyLayout(3,[{scale:1.175}])[0];assert(large.h>small.h);assert(large.cx-large.w/2>0);assert(large.cy+large.h/2<240);
});
test('NPC combat is separate from region monster pools and machine encounters remain machines',()=>{
 for(let i=0;i<10;i++){const g=fresh(i+1);g.s.progress=i*10+1;const npc=g.person('human','soldier');g.beginCombat('character',null,npc);assert.equal(g.s.battle.enemies.length,1);assert.equal(g.s.battle.enemies[0].npc.id,npc.id);assert.equal(g.s.battle.enemies[0].hp,npc.hp);g.beginCombat('character','machine');assert(g.s.battle.enemies.every(e=>e.machine));}
});
test('final boss is selected at start, covers all five possibilities, and persists through saves and previews',()=>{
 const ids=new Set();for(let seed=1;seed<=150;seed++){const g=fresh(seed),chosen=g.s.finalBoss.id;ids.add(chosen);assert.equal(g.s.finalBoss.encountered,false);assert.equal(g.s.bossRumors.length,0);assert.equal(new Game(d,structuredClone(g.s)).s.finalBoss.id,chosen);g.s.progress=99;g.depart();const before=structuredClone(g.s),preview=g.previewArrival();assert.deepEqual(g.s,before);assert.equal(preview.battle.enemies[0].bossId,chosen);g.arrive();assert.equal(g.s.mode,'combat');assert.equal(g.s.end,null);assert.equal(g.s.battle.enemies[0].bossId,chosen);assert.deepEqual(g.s.battle,preview.battle);}
 assert.equal(ids.size,5);
});
test('escaping final boss cannot finish the journey or farm levels, and damage persists',()=>{
 const g=fresh();g.s.progress=100;g.beginFinale();g.s.battle.enemies[0].hp-=11;const hp=g.s.battle.enemies[0].hp,level=g.actor().level;g.finishCombat(false);assert.equal(g.s.mode,'event');g.finishEvent();assert.equal(g.s.end,null);assert.equal(g.actor().level,level);assert(g.choose('challenge'));assert.equal(g.s.battle.enemies[0].hp,hp);
});
test('only defeating the selected final boss unlocks paradise and the final level',()=>{
 for(const boss of GROWTH.bosses){const g=fresh();g.s.finalBoss.id=boss.id;g.s.progress=100;setLevel(g.actor(),17);g.beginFinale();assert.equal(g.s.battle.enemies[0].image,boss.image);Object.assign(g.s.battle.enemies[0],{hp:1,speed:0});g.roll=()=>1;g.recordVisuals=true;g.combatRound({type:'attack'});assert.equal(g.s.mode,'ending');assert(g.s.end.win);assert(g.s.finalBoss.defeated);assert.equal(g.actor().level,18);assert.equal(g.visualSteps.at(-1).after.enemies[0].hp,0);}
});
test('NPC and companion rumors refer only to the fixed boss, and silence is allowed',()=>{
 for(const boss of GROWTH.bosses){const g=fresh();g.s.finalBoss.id=boss.id;const p=g.person();const oracle=g.oracle.bind(g);g.oracle=id=>id==='boss_rumor'?{value:true}:id==='companion_focus'?{value:'boss'}:id==='driving_channel'?{value:'talk'}:oracle(id);
 for(const attitude of ['友善','同情','戒備','冷淡','敵對','掠奪']){p.attitude=attitude;const text=g.bossRumor(p);assert(text.includes(GROWTH.rumors.attitude_prefix[attitude]));assert(g.s.bossRumors.every(r=>r.bossId===boss.id));}
 g.s.party.push(p);g.s.travel={};g.ambient();assert.equal(g.s.travel.voices.bossId,boss.id);assert.equal(g.s.travel.voices.kind,'companions');assert.equal(g.s.travel.voices.lines.length,2);
 const count=g.s.bossRumors.length;g.oracle=id=>id==='boss_rumor'?{value:false}:oracle(id);for(let i=0;i<20;i++)assert.equal(g.bossRumor(p),'');assert.equal(g.s.bossRumors.length,count);
 }
});
test('legacy saves receive a fixed boss without altering RNG and old levels cap at eighteen',()=>{
 const g=fresh();delete g.s.finalBoss;const rng=g.s.rng;g.s.party[0].level=23;g.s.party[0].maxHp=90;const loaded=new Game(d,structuredClone(g.s));assert(bossDefinition(loaded.s));assert.equal(loaded.s.rng,rng);assert.equal(loaded.s.party[0].level,18);assert.equal(loaded.s.party[0].maxHp,75);
});
test('five boss sprites exist and preserve transparent PNG color format',()=>{for(const boss of GROWTH.bosses){const path=new URL('../dist/assets/'+boss.image,import.meta.url);assert(existsSync(path));const bytes=readFileSync(path);assert.equal(bytes.toString('hex',0,8),'89504e470d0a1a0a');assert.equal(bytes[25],6);assert(bytes.readUInt32BE(16)>=512);}});
