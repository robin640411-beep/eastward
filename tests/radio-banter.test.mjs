import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Game,ITEMS,display} from '../dist/engine.js';
import {CONSUMABLES} from '../dist/consumables-catalog.js';
import {radioEventForecast,radioExaggeratedItemAd,companionColdJokeExchange,COLD_JOKES} from '../dist/radio-banter.js';

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

test('depart pre-rolls upcoming event category and arrive consumes the exact same category',()=>{
 const g=new Game(data);
 g.start({seed:555,totalKm:3000});
 assert(g.depart());
 const pre=g.s.travel.upcomingEvent;
 assert(pre&&pre.d12>=1&&pre.d12<=12,'depart() must pre-roll upcoming D12 category');
 const forecast=radioEventForecast(g.s,g.s.seed);
 assert(forecast&&forecast.text.length>10,'Radio must generate forecast matching upcoming event');
 g.arrive();
 assert.equal(g.s.dice.d12,pre.d12,'arrive() -> nextEvent() must consume the pre-rolled category');
});

test('depart previews upcoming Boss milestone for urgent radio warning',()=>{
 const g=new Game(data);
 g.start({seed:501,totalKm:5000});
 g.s.progress=298;
 g.s.resources.fuel=30;
 g.s.party[0].st=24;
 g.roll=sides=>sides===10?5:1;
 assert(g.depart());
 assert(g.s.travel.upcomingBoss,'Should detect approaching 3000 km Mini-Boss');
 const forecast=radioEventForecast(g.s,g.s.seed);
 assert(forecast.station.includes('警報'));
 assert(forecast.text.includes(g.s.travel.upcomingBoss.name));
});

test('exaggerated radio ads cover real equipment and consumables, and companions trade cold jokes / alien puns',()=>{
 const seenItems=new Set();
 for(let stop=0;stop<200;stop++){
  const ad=radioExaggeratedItemAd(ITEMS,CONSUMABLES,77,stop);
  assert(ad&&ad.text.includes('廢料'));
  for(const it of [...Object.values(ITEMS),...Object.values(CONSUMABLES)]){
   if(ad.text.includes(it.name))seenItems.add(it.name);
  }
 }
 assert(seenItems.size>=30,'Exaggerated radio ads should feature a wide variety of real gear and consumables');
 // Radio ads and forecasts probabilistically include green author snarks
 let adSnarks=0,adPlain=0;
 for(let stop=0;stop<80;stop++){
  const ad=radioExaggeratedItemAd(ITEMS,CONSUMABLES,77,stop);
  if(ad.text.includes('\n（'))adSnarks++;else adPlain++;
 }
 assert(adSnarks>10&&adPlain>10,'Radio ads should include probabilistic author snarks');

 assert(COLD_JOKES.length>=16);
 const g=new Game(data);
 g.start({seed:88,totalKm:3000});
 const p1=g.s.party[0],p2=g.person('alien','performer');
 const joke=companionColdJokeExchange(p1,p2,display,88,3);
 assert.equal(joke.focus,'cold_joke');
 assert.equal(joke.lines.length,4);
 assert.equal(joke.lines[0].personId,p2.id);
 assert.equal(joke.lines[1].personId,p1.id);
 let jokeSnarks=0,jokePlain=0;
 for(let stop=0;stop<60;stop++){
  const j=companionColdJokeExchange(p1,p2,display,88,stop);
  if(j.lines[3].text.includes('\n（'))jokeSnarks++;else jokePlain++;
 }
 assert(jokeSnarks>10&&jokePlain>10,'Companion cold jokes should probabilistically include author snarks');
});
