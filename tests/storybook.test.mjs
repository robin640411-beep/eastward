import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {Game,display} from '../dist/engine.js';
import {EXTRA_NPC_RACES,EXTRA_NPC_JOBS,personRaceName,personJobName,proceduralPortraitDataUri,proceduralCharacterDataUri} from '../dist/procedural-npc.js';
import {rolledNpcVignette,companionWhisper,authorAside,fillStory,storybookEpilogue} from '../dist/storybook.js';
import {originPages} from '../dist/origin-runtime.js';
import {npcFavorInfo} from '../dist/npc-runtime.js';
import {encounterCommands} from '../dist/encounter-commands.js';
import {commandPage} from '../dist/battle-presentation.js';
import {syncMessageContext} from '../dist/automatic-journey.js';

const read=p=>JSON.parse(readFileSync(new URL('../dist/'+p,import.meta.url)));
const d={
 assets:read('assets/manifest.json'),
 catalog:read('data/npc-catalog.json'),
 oracles:read('data/oracles.json'),
 events:read('data/events.json'),
 buildings:read('data/building-events.json'),
 traits:read('data/traits.json')
};

function fresh(seed=314){const g=new Game(d);g.start({seed});return g;}

test('procedural NPC generator offers broader races, jobs, textual appearances and pixel SVGs without touching main RNG',()=>{
 assert(EXTRA_NPC_RACES.length>=24);
 assert(EXTRA_NPC_JOBS.length>=30);
 const g=fresh(888);
 assert.equal(g.s.party[0].procedural,undefined);
 const seenRaces=new Set(),seenJobs=new Set();
 for(let i=0;i<60;i++){
  const npc=g.person();
  assert(npc.procedural);
  assert(npc.procedural.appearance.length>=16);
  seenRaces.add(personRaceName(npc,d.catalog));
  seenJobs.add(personJobName(npc,d.catalog));
  const rngBefore=g.s.rng;
  const pUri=proceduralPortraitDataUri(npc,g.s.seed);
  const cUri=proceduralCharacterDataUri(npc,g.s.seed);
  assert.equal(g.s.rng,rngBefore);
  assert(pUri.startsWith('data:image/svg+xml;utf8,'));
  assert(cUri.startsWith('data:image/svg+xml;utf8,'));
 }
 assert(seenRaces.size>12);
 assert(seenJobs.size>20);
});

test('storybook NPC encounter rolls exactly one special vignette and keeps Page 1 to at most four choices',()=>{
 const g=fresh(512);
 g.s.vehicle.model='van';
 g.s.party.push(g.person('alien','medic'));
 const seenVignettes=new Set();
 for(let inst=1;inst<=30;inst++){
  const npc=g.person();
  npc.attitude=inst%3===0?'戒備':'友善';
  g.s.mode='event';
  g.s.current={instance:inst,event:{id:'road_010',title:'友善車隊',text:'路邊車隊。',options:[]},npc,dialogue:true,service:'npc_trade'};
  const rngBefore=g.s.rng;
  const vig=rolledNpcVignette(g.s,npc,npcFavorInfo(npc));
  assert.equal(g.s.rng,rngBefore);
  assert(vig&&vig.action);
  seenVignettes.add(vig.action);
  const cmds=encounterCommands(g,display);
  const page1=commandPage(cmds,0);
  assert.equal(page1.items.length,4);
  assert.deepEqual(page1.items.map(c=>c.action),['talk',vig.action,'panel','finish']);
 }
 assert(seenVignettes.size>=3);
});

test('companion whisper and storybook epilogue render rich narrative without advancing RNG',()=>{
 const g=fresh(909);
 g.s.vehicle.model='van';
 const comp=g.person();
 comp.attitude='友善';
 g.s.party.push(comp);
 let whispered=0;
 for(let inst=1;inst<=40;inst++){
  const ev=structuredClone(d.events.events[inst%20]);
  g.s.mode='event';
  g.s.current={instance:inst,event:ev,resolved:false};
  g.s.notice=fillStory(ev.text,g.s,display);
  const rngBefore=g.s.rng;
  const w=companionWhisper(g,display);
  assert.equal(g.s.rng,rngBefore);
  if(w){
   whispered++;
   const beforeCount=g.s.messages.length;
   syncMessageContext(g,display);
   assert.equal(g.s.messages.length,beforeCount+1);
   assert(g.s.messages.at(-1).text.includes('「'));
  }
 }
 assert(whispered>=15&&whispered<=38);

 g.end(true,'你們終於抵達了綠洲。');
 const rngBefore=g.s.rng;
 const epilogue=storybookEpilogue(g.s,d.catalog,display,'星落綠洲','深核監視者');
 assert.equal(g.s.rng,rngBefore);
 assert(epilogue.length>=4);
 assert(epilogue.join('\n').includes(display(comp)));
});

test('all 202 road and building events feature unique atmospheric storybook paragraphs',()=>{
 const all=[...d.events.events,...d.buildings.events];
 assert.equal(all.length,202);
 const texts=new Set();
 for(const e of all){
  assert(e.text.length>=48,`Event ${e.id} too short: ${e.text.length}`);
  assert(!/D100|神諭|擲骰|你們|你的/.test(e.text),`Forbidden or 2nd-person pronoun in ${e.id}`);
  texts.add(e.text);
  for(const o of e.options||[]){
   assert(!/查看服務|不使用服務|確認一無所獲/.test(o.label),`Unconverted dry label in ${e.id}: ${o.label}`);
  }
 }
 assert.equal(texts.size,202);
});

test('third-person hero naming, first-person author voice, absurd radio commercials, animated title and slimmed assets',()=>{
 const g=new Game(d);
 g.startRandom(777);
 const hero=g.s.party[0];
 const pages=originPages(g);
 assert.equal(pages.length,3);
 for(const pg of pages){
  assert(pg.text.includes(hero.name));
  assert(pg.text.includes('我'));
  assert(!pg.text.includes('{hero}')&&!pg.text.includes('{paradise}'));
 }
 while(g.s.mode==='prologue')g.advancePrologue();

 let asides=0;
 for(let inst=1;inst<=30;inst++){
  const ev=structuredClone(d.events.events[inst]);
  g.s.mode='event';
  g.s.current={instance:inst,event:ev,npc:ev.bindings?.npc?g.person():null,resolved:false};
  const rendered=fillStory(ev.text,g.s,display);
  assert(!rendered.includes('{hero}')&&!rendered.includes('{party}')&&!rendered.includes('你'));
  const rngBefore=g.s.rng;
  const aside=authorAside(g,display);
  assert.equal(g.s.rng,rngBefore);
  if(aside){asides++;assert(aside.includes('（'));}
 }
 assert(asides>=15);

 const radio=d.oracles.tables.find(t=>t.id==='driving_radio');
 assert.equal(radio.rows.length,50);
 assert(radio.rows.filter(r=>r.value.station==='插播商業廣告').length>=20);

 const appSrc=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
 assert(appSrc.includes('很久很久以後，曾經有一個人，駕駛著一輛車。'));
 assert(appSrc.includes('titleDrive=true'));

 for(const removed of ['painted','hd2d','volume','vehicle-weapons']){
  assert.equal(existsSync(new URL('../dist/assets/'+removed,import.meta.url)),false);
 }
});
