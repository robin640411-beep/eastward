import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Game} from '../dist/engine.js';
import {automaticDecision,declineMidnightRest,alternateDriver} from '../dist/automatic-journey.js';
import {minutesForProgress,applyTimedRecovery,RECOVERY_RATES,shouldPromptMidnightRest,sleepPreviewPercentages} from '../dist/time-system.js';

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

test('3000 km travel time scales at 60 km/h (10 min per progress) to ~4 days 3 nights with sleep',()=>{
 assert.equal(minutesForProgress(1),10);
 assert.equal(minutesForProgress(6),60);
 assert.equal(minutesForProgress(10),100);
 // 300 progress = 3000 km -> 3000 minutes = 50 hours driving
 // + 3 nights x 6 hours sleep (1080 min) + ~8 hours stops (480 min) = 4560 min = 76 hours (Day 1 08:00 -> Day 4 12:00)
 const totalMin=480+minutesForProgress(300)+3*360+480;
 const arrivalDay=Math.floor(totalMin/1440)+1;
 assert.equal(arrivalDay,4,'3000 km should arrive on Day 4 (4 days 3 nights)');
});

test('non-driving passengers slowly recover HP and ST by elapsed time without rounding loss',()=>{
 const g=new Game(data);
 g.start({seed:901,totalKm:3000});
 g.s.vehicle.model='van';
 const passenger=g.person('human','medic');
 passenger.maxHp=40;passenger.hp=20;
 passenger.maxSt=30;passenger.st=10;
 g.s.party.push(passenger);
 g.s.resources.fuel=60;
 // Drive 4 times x 50 minutes (5 progress each = 200 minutes = 3.333 hours)
 // Expected passenger recovery: HP ~ 40 * 0.03 * 3.333 = 4, ST ~ 30 * 0.06 * 3.333 = 6
 for(let i=0;i<4;i++){
  g.s.mode='driving';
  g.s.travel={die:5,n:5,cost:{fuel:5,st:2},driver:g.s.driver};
  g.arrive();
  g.s.battle=null;
  g.s.mode='ready';
 }
 assert.equal(passenger.hp,24,'Passenger should recover +4 HP over 200 min');
 assert.equal(passenger.st,16,'Passenger should recover +6 ST over 200 min');
 // Driver should NOT passively recover HP while driving
 const driver=g.driver();
 assert.equal(driver.hp,driver.maxHp);
});

test('sleep recovers HP, ST, and ESP by hours x percentage (guarded vs unguarded) and drains guard ST',()=>{
 assert.deepEqual(sleepPreviewPercentages(6,true),{hpPct:60,stPct:90,espPct:100});
 assert.deepEqual(sleepPreviewPercentages(6,false),{hpPct:48,stPct:72,espPct:100});
 const g=new Game(data);
 g.start({seed:902,totalKm:3000});
 g.s.vehicle.model='van';
 const sleeper=g.party ? g.s.party[0] : g.s.party[0];
 sleeper.maxHp=50;sleeper.hp=10;sleeper.maxSt=40;sleeper.st=0;sleeper.esp=0;sleeper.flaw='none';
 const guard=g.person('human','guard');
 guard.maxHp=40;guard.hp=25;guard.maxSt=40;guard.st=30;
 g.s.party.push(guard);
 const startMin=g.s.minutes;
 g.roll=()=>100; // safe night
 assert(g.sleep(guard.id,false,6));
 assert.equal(g.s.minutes,startMin+360);
 assert.equal(sleeper.hp,40,'Guarded 6h sleep should restore 60% of 50 maxHp = +30 HP');
 assert.equal(sleeper.st,36,'Guarded 6h sleep should restore 90% of 40 maxSt = +36 ST');
 assert.equal(sleeper.esp,sleeper.maxEsp,'Guarded 6h sleep should fully restore ESP');
 assert.equal(guard.hp,25,'Guard does not recover HP while on watch');
 assert(guard.st<30,'Guard drains stamina while on watch');
});

test('midnight 00:00 prompts rest, allows night driver swap or declining once per night',()=>{
 const g=new Game(data);
 g.start({seed:903,totalKm:3000});
 g.s.vehicle.model='van';
 const buddy=g.person('human','driver');
 buddy.st=24;
 g.s.party.push(buddy);
 g.s.minutes=23*60+30; // Day 1 23:30
 assert.equal(shouldPromptMidnightRest(g.s),false);
 assert.equal(automaticDecision(g),'drive');

 g.s.minutes=24*60+10; // Day 2 00:10 (crossed midnight!)
 assert.equal(shouldPromptMidnightRest(g.s),true);
 assert.equal(automaticDecision(g),'midnightRest');
 assert.equal(alternateDriver(g).id,buddy.id);

 // Swap driver & decline midnight rest -> continues driving all night without re-prompting
 g.changeDriver(buddy.id);
 declineMidnightRest(g);
 assert.equal(automaticDecision(g),'drive');

 // Next midnight (Day 3 00:05) prompts again
 g.s.minutes=48*60+5;
 assert.equal(automaticDecision(g),'midnightRest');
});
