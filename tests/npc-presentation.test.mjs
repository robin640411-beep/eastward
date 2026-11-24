import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Game,display} from '../dist/engine.js';
import {syncMessageContext} from '../dist/automatic-journey.js';
import {journalEntry} from '../dist/journey-ui.js';
import {DEMEANOR_LINES,WELCOMING_GESTURES,npcDemeanor,concealAttitudeLabels} from '../dist/npc-presentation.js';
const read=p=>JSON.parse(readFileSync(new URL('../dist/'+p,import.meta.url)));
const data={assets:read('assets/manifest.json'),catalog:read('data/npc-catalog.json'),oracles:read('data/oracles.json'),events:read('data/events.json'),buildings:read('data/building-events.json'),traits:read('data/traits.json')};
const rawLabel=/態度[：:]|(?:·|｜)\s*(?:友善|同情|戒備|冷淡|敵對|掠奪)(?:。|$)/m;
function meeting(attitude='友善'){const g=new Game(data);g.start({seed:445});const npc=g.person('synth','merchant');npc.attitude=attitude;g.s.mode='event';g.s.current={instance:19,event:{id:'road_014',title:'旅人',text:'路旁有人。',options:[]},npc,dialogue:true};return g;}
test('all six attitudes have eight varied observations without exposed categorical labels',()=>{
  assert.equal(Object.keys(DEMEANOR_LINES).length,6);assert.equal(Object.keys(WELCOMING_GESTURES).length,12);
  for(const [attitude,lines] of Object.entries(DEMEANOR_LINES)){assert.equal(lines.length,8);assert.equal(new Set(lines).size,8);const observed=new Set();for(let seed=0;seed<100;seed++)for(const race of data.catalog.races){const p={id:'p1',name:'旅人',race:race.id,attitude};const line=npcDemeanor(p,{seed});assert(line.length>15);assert(!/友善|同情|戒備|冷淡|敵對|掠奪|D100|神諭/.test(line));assert.equal(line,npcDemeanor(structuredClone(p),{seed}));observed.add(line);}assert(observed.size>=8);}
});
test('NPC introduction and services show observations while retaining exact attitude and random state',()=>{
  for(const attitude of Object.keys(DEMEANOR_LINES)){const g=meeting(attitude),p=g.s.current.npc,before=structuredClone(p),rng=g.s.rng;syncMessageContext(g,display);assert(!rawLabel.test(g.s.messages.map(m=>m.text).join('\n')));assert(g.s.messages.some(m=>m.text.includes(npcDemeanor(p,{seed:g.s.seed}))));assert.deepEqual(p,before);assert.equal(g.s.rng,rng);if(!['敵對','掠奪'].includes(attitude)){g.interact('npc_trade');assert(g.s.notice.includes(npcDemeanor(p,{seed:g.s.seed})));assert(!rawLabel.test(g.s.notice));assert.equal(g.s.rng,rng);}}
});
test('hostile greetings and player-initiated attacks give readable reactions without changing combat rules',()=>{
  for(const attitude of ['友善','敵對','掠奪']){const g=meeting(attitude),p=g.s.current.npc;g.beginCombat('character',null,p);assert.equal(g.s.mode,'combat');assert(g.s.notice.includes(npcDemeanor(p,{seed:g.s.seed,confronted:true})));assert.equal(p.attitude,attitude);assert.equal(g.s.battle.enemies[0].npc.id,p.id);assert(!rawLabel.test(g.s.notice));}
});
test('legacy labels are adapted only for display; ordinary dialogue and original save records stay intact',()=>{
  for(const attitude of Object.keys(DEMEANOR_LINES)){const line='「灰雀」夏林 · 合成人 · 商人 · '+attitude,old={title:'旅人',text:line};assert(!rawLabel.test(concealAttitudeLabels(line)));assert(!rawLabel.test(concealAttitudeLabels('看著你。態度：'+attitude+'。')));assert(!rawLabel.test(journalEntry(old).text));assert.equal(old.text,line);}
  const dialogue='「那群掠奪者摧毀了橋。我不需要你的同情。」';assert.equal(concealAttitudeLabels(dialogue),dialogue);
});
