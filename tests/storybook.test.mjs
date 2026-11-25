import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {Game,display} from '../dist/engine.js';
import {EXTRA_NPC_RACES,EXTRA_NPC_JOBS,personRaceName,personJobName,proceduralPortraitDataUri,proceduralCharacterDataUri} from '../dist/procedural-npc.js';
import {rolledNpcVignette,companionWhisper,authorAside,rollBattleAuthorQuip,fillStory,storybookEpilogue,selectEnding} from '../dist/storybook.js';
import {originPages} from '../dist/origin-runtime.js';
import {npcFavorInfo} from '../dist/npc-runtime.js';
import {encounterCommands} from '../dist/encounter-commands.js';
import {commandPage} from '../dist/battle-presentation.js';
import {syncMessageContext} from '../dist/automatic-journey.js';
import {hasMessageOverflow,advanceManualPage,mountMessageScroll,stopMessageScroll,isMessageReadingPaused} from '../dist/message-scroll.js';

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
   assert.equal(g.s.messages.length,beforeCount+2);
   assert.equal(g.s.messages.at(-1).speakerKind,'party');
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
 assert(asides>=8&&asides<=25);

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

test('enemies and bosses cast psychic powers with recorded PSI visuals',()=>{
 const g=fresh(404);
 g.s.progress=45;
 g.recordVisuals=true;
 g.beginCombat('character');
 const foe=g.s.battle.enemies[0];
 assert(foe.esp>=6&&foe.psiRace);
 const powers=g.enemyAvailablePowers(foe);
 assert(powers.length>=1);
 const espBefore=foe.esp;
 g.roll=(sides=100)=>sides;
 g.enemyAction(foe);
 assert(foe.esp<espBefore);
 assert.equal(g.visualSteps.at(-1).kind,'psi');
 assert(g.visualSteps.at(-1).visual.kind==='psi');

 const gBoss=fresh(505);
 gBoss.s.progress=100;
 gBoss.recordVisuals=true;
 gBoss.beginFinale();
 const boss=gBoss.s.battle.enemies[0];
 assert(boss.esp>=20&&boss.psiLevel>=5);
 gBoss.roll=(sides=100)=>sides;
 gBoss.enemyAction(boss);
 assert.equal(gBoss.visualSteps.at(-1).kind,'psi');
});

test('author snark rolls probabilistically in combat rounds, knockouts, and player death endings',()=>{
 let roundHits=0,downHits=0,wipeHits=0;
 for(let seed=1;seed<=40;seed++){
  const g=fresh(seed*17);
  g.beginCombat('character');
  if(rollBattleAuthorQuip(g.s,'round',{enemyPsi:seed%2===0}))roundHits++;
  if(rollBattleAuthorQuip(g.s,'down',{who:'「蒼穹」約翰'}))downHits++;
  if(rollBattleAuthorQuip(g.s,'wipe'))wipeHits++;
 }
 assert(roundHits>=5&&roundHits<=30);
 assert(downHits>=15&&downHits<=38);
 assert(wipeHits>=20);

 // Verify total party wipe death ending gets roasted in epilogue
 const deadGame=fresh(77);
 deadGame.hurt(deadGame.s.party[0],999,['attack']);
 deadGame.checkAlive();
 assert.equal(deadGame.s.mode,'ending');
 assert.equal(deadGame.s.end.win,false);
 const deathPages=storybookEpilogue(deadGame.s,d.catalog,display,'星落綠洲','星門監督官');
 assert(deathPages.length>=4);
 assert(deathPages.join('\n').includes(deadGame.s.party[0].name));
});

test('pure manual page-flipping replaces auto-scroll and portrait layout uses 40:60 ratio with larger message text',()=>{
 const mockWin={classes:new Set(),classList:{toggle(k,v){v?mockWin.classes.add(k):mockWin.classes.delete(k);}}};
 const mockEl={
  scrollTop:0,clientHeight:80,scrollHeight:220,isConnected:true,dataset:{},
  querySelectorAll:()=>[],
  getBoundingClientRect:()=>({top:0}),
  closest:()=>mockWin,
  addEventListener:()=>{}
 };
 mountMessageScroll(mockEl,{});
 assert(hasMessageOverflow(mockEl));
 assert(mockWin.classes.has('has-more-text'));
 assert(isMessageReadingPaused());
 assert(advanceManualPage(mockEl));
 assert.equal(mockEl.scrollTop,56);
 assert(hasMessageOverflow(mockEl));
 assert(advanceManualPage(mockEl));
 assert.equal(mockEl.scrollTop,112);
 assert(advanceManualPage(mockEl));
 assert.equal(mockEl.scrollTop,140);
 assert(!hasMessageOverflow(mockEl));
 assert(!mockWin.classes.has('has-more-text'));
 assert.equal(advanceManualPage(mockEl),false);
 stopMessageScroll();

 const css=readFileSync(new URL('../dist/portrait-layout.css',import.meta.url),'utf8');
 assert(css.includes('auto 40% minmax(0, 1fr)'));
 assert(css.includes('.vehicle-battle .world-target .enemy-caption'));
 assert(!css.includes('50% minmax(0, 1fr) auto'));
 assert(css.includes('font-size: clamp(16px, 4.3vw, 18.5px)'));
 const appSrc=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
 assert(appSrc.includes('routeBar()+scene()+messageWindow()+partyStrip(!!s.battle)+vehicleHud()+navigation()'));

 const enc=read('assets/encounters.json');
 assert.equal(Object.keys(enc).length,202);
 for(const [id,a] of Object.entries(enc)){
  assert(a.effect&&a.effect!=='none',`Encounter ${id} missing ambient animation effect`);
 }
});

test('streamlined opening and NPC interaction do not repeat backstory, motive, or appearance text',()=>{
 const g=new Game(d);
 g.startRandom(2026);
 assert.equal(g.s.mode,'prologue');
 assert.equal(g.s.messages.length,0);
 syncMessageContext(g,display);
 assert.equal(g.s.messages.length,0);
 while(g.s.mode==='prologue')g.advancePrologue();
 assert.equal(g.s.mode,'ready');
 assert.equal(g.s.messages.length,0);
 g.depart();
 syncMessageContext(g,display);
 const origin=g.s.party[0].origin;
 assert(!g.s.messages.some(m=>m.text.includes(origin.past.text)));
 assert(!g.s.messages.some(m=>m.text.includes(origin.motive.text)));

 // Verify NPC interact does not duplicate appearance/demeanor lines in messages
 const gNpc=fresh(909);
 gNpc.s.mode='event';
 const npc=gNpc.person();
 gNpc.s.current={instance:1,event:{id:'R1',title:'路邊旅人',text:'路邊站著一位旅人。',options:[]},npc};
 syncMessageContext(gNpc,display);
 gNpc.interact('npc_trade');
 syncMessageContext(gNpc,display);
 const combined=gNpc.s.messages.map(m=>m.text).join('\n');
 const bioHits=combined.split(npc.procedural.appearance).length-1;
 assert.equal(bioHits,1,'NPC appearance should appear exactly once in messages');
});

test('100 unique endings with distinct crisp pixel-art SVGs and rolled author snark',()=>{
 const endingsData=read('data/endings.json');
 assert.equal(endingsData.count,100);
 assert.equal(endingsData.endings.length,100);
 const wins=endingsData.endings.filter(e=>e.outcome==='win');
 const stranded=endingsData.endings.filter(e=>e.outcome==='stranded');
 const deaths=endingsData.endings.filter(e=>e.outcome==='death');
 assert.equal(wins.length,60);
 assert.equal(stranded.length,20);
 assert.equal(deaths.length,20);

 const titles=new Set(),digests=new Set();
 let firstPersonCount=0;
 for(const e of endingsData.endings){
  assert(!titles.has(e.title),`Duplicate ending title: ${e.title}`);
  titles.add(e.title);
  assert(!/D100|神諭|擲骰/.test(e.text+e.author_quip),`Forbidden meta term in ${e.id}`);
  assert(e.author_quip.startsWith('（')&&e.author_quip.endsWith('）')&&e.author_quip.length>=20,`Invalid author quip in ${e.id}`);
  if(e.author_quip.includes('我'))firstPersonCount++;
  const svgUrl=new URL('../dist/assets/'+e.image,import.meta.url);
  assert(existsSync(svgUrl),`Missing ending SVG: ${e.image}`);
  const svg=readFileSync(svgUrl,'utf8');
  assert(svg.includes('shape-rendering="crispEdges"'),`Ending SVG not crisp pixel art: ${e.image}`);
  const digest=createHash('sha256').update(svg).digest('hex');
  assert(!digests.has(digest),`Duplicate ending SVG image: ${e.image}`);
  digests.add(digest);
 }
 assert(firstPersonCount>=40,`Expected at least 40 first-person author quips, got ${firstPersonCount}`);

 // Deterministic outcome matching without perturbing main RNG
 const gWin=fresh(123);
 gWin.s.mode='ending';
 gWin.s.end={win:true,text:'{hero}終於開進了終點。'};
 const rngBefore=gWin.s.rng;
 const pickedWin=selectEnding(gWin.s,endingsData.endings);
 assert.equal(gWin.s.rng,rngBefore);
 assert.equal(pickedWin.outcome,'win');
 const winPages=storybookEpilogue(gWin.s,d.catalog,display,'星落綠洲','星門監督官',pickedWin);
 const expectedWinText=fillStory(pickedWin.text,gWin.s,display).replace(/\{paradise\}/g,'星落綠洲').replace(/\{boss\}/g,'星門監督官');
 assert(winPages.some(p=>p.includes(expectedWinText)));

 const gStranded=fresh(456);
 gStranded.s.mode='ending';
 gStranded.s.end={win:false,text:'油箱徹底乾了。'};
 const pickedStranded=selectEnding(gStranded.s,endingsData.endings);
 assert.equal(pickedStranded.outcome,'stranded');

 const gDead=fresh(789);
 gDead.hurt(gDead.s.party[0],999,['attack']);
 gDead.checkAlive();
 const pickedDeath=selectEnding(gDead.s,endingsData.endings);
 assert.equal(pickedDeath.outcome,'death');
 const deathPages=storybookEpilogue(gDead.s,d.catalog,display,'星落綠洲','星門監督官',pickedDeath);
 assert(deathPages.length>=4);
});

test('front-seat window ordering, vehicle ramming/weapon/loss combat, and explicit escape logs',async()=>{
 const {vehicleArt}=await import('../dist/vehicle-runtime.js');
 // 1. Driver (slot 0) always sits in the frontmost (rightmost) window across multi-seat vehicles
 for(const model of ['sedan','van','pickup','bus','armored','rover','ambulance']){
  const art=vehicleArt(d.assets,{model,mods:[]});
  for(let i=1;i<art.windows.length;i++){
   assert(art.windows[i-1].x>art.windows[i].x,`${model} windows should be ordered front-to-back`);
  }
 }

 // 2. Vehicle combat: vehicle acts once per round (not per passenger), unarmed rams and trades hull, armed fires weapon, enemy hit can strip weapon/armor/fuel
 const g=fresh(707);
 g.s.vehicle={model:'van',hp:40,maxHp:40,mods:[]};
 g.s.party.push(g.person('alien','soldier'));
 g.recordVisuals=true;
 g.beginCombat('vehicle');
 assert.equal(g.s.battle.roster.length,1,'Vehicle combat should have 1 vehicle command per round');
 g.s.battle.enemies=[{id:'e0',name:'敵方貨車',vehicle:'pickup',hasWeapon:false,hp:50,maxHp:50,attack:6,defense:2,speed:3,stun:0}];
 g.roll=()=>90;
 const vehHpBefore=g.s.vehicle.hp;
 g.partyAction(g.driver(),{type:'attack',target:'e0'});
 assert(g.s.battle.enemies[0].hp<50,'Unarmed ram should damage enemy vehicle');
 assert(g.s.vehicle.hp<vehHpBefore,'Unarmed ram should also damage player vehicle');
 assert.equal(g.visualSteps.at(-1).visual.id,'ram');
 assert.equal(g.visualSteps.at(-1).ranged,false);

 // Enemy unarmed ram also hurts enemy itself
 const enemyHpBefore=g.s.battle.enemies[0].hp;
 g.enemyAction(g.s.battle.enemies[0]);
 assert(g.s.battle.enemies[0].hp<enemyHpBefore,'Enemy unarmed ram should self-damage enemy vehicle');

 // Equipped gun fires weapon (ranged) without self-ram damage, and enemy hit can strip weapon/armor/fuel
 g.s.vehicle.mods.push('gun','armor');
 g.s.resources.fuel=20;
 const hpBeforeGun=g.s.vehicle.hp;
 g.partyAction(g.driver(),{type:'attack',target:'e0'});
 assert.equal(g.s.vehicle.hp,hpBeforeGun,'Armed fire should not self-ram');
 assert.equal(g.visualSteps.at(-1).ranged,true);
 g.roll=()=>1; // Trigger subsystem loss
 const modsBefore=g.s.vehicle.mods.length,fuelBefore=g.availableFuel();
 g.enemyAction(g.s.battle.enemies[0]);
 assert(g.s.vehicle.mods.length<modsBefore||g.availableFuel()<fuelBefore,'Enemy hit should be able to destroy weapon, armor, or leak fuel');

 // 3. Character battle escape & attempt_escape never silently end without explicit who-fled log
 const gEsc=fresh(808);
 gEsc.s.party.push(gEsc.person('human','scout'));
 gEsc.s.mode='event';
 gEsc.s.current={instance:1,event:{id:'R1',title:'伏擊',text:'伏兵衝出。',options:[{id:'run',label:'撤離',effects:[{op:'attempt_escape',mode:'character'}]}]},npc:null};
 gEsc.roll=(s=100)=>s; // Fail pre-combat escape -> enters combat with CLEAN empty orders!
 gEsc.effect({op:'attempt_escape',mode:'character'});
 assert.equal(gEsc.s.mode,'combat');
 assert.deepEqual(gEsc.s.battle.orders,{},'Failed attempt_escape must not leave hidden escape order on party[0]');

 gEsc.roll=()=>1; // Succeed explicit player escape
 gEsc.partyAction(gEsc.s.party[0],{type:'escape'});
 assert.equal(gEsc.s.battle,null);
 assert(gEsc.s.notice.includes('我方撤離'),`Expected explicit player escape notice, got: ${gEsc.s.notice}`);
 assert(gEsc.s.logs.some(l=>l.title.includes('我方逃跑')),'Expected explicit escape log entry');
});

test('combat message pane scopes to current battle messages and hides tap-to-flip cues',()=>{
 const g=fresh(616);
 g.log('停靠片刻','戰前的舊旅途訊息。');
 const preBattleSerial=g.s.messageSerial;
 g.beginCombat('character');
 assert.equal(g.s.battle.startMsgId,preBattleSerial);
 g.log('戰鬥','主角揮棒打中敵人。');
 const battleOnly=g.s.messages.filter(m=>m.id>g.s.battle.startMsgId);
 assert(!battleOnly.some(m=>m.text.includes('戰前的舊旅途訊息')));
 assert(battleOnly.some(m=>m.text.includes('主角揮棒打中敵人')));

 const mockWin={classes:new Set(['has-more-text','can-continue']),classList:{toggle(k,v){v?mockWin.classes.add(k):mockWin.classes.delete(k);}}};
 const mockEl={
  scrollTop:0,clientHeight:80,scrollHeight:220,isConnected:true,dataset:{},
  querySelectorAll:()=>[{dataset:{messageId:'10'}}],
  closest:()=>mockWin,
  addEventListener:()=>{}
 };
 mountMessageScroll(mockEl,{battle:true});
 assert.equal(mockEl.scrollTop,140);
 assert(!mockWin.classes.has('has-more-text'));
 assert(!mockWin.classes.has('can-continue'));
 stopMessageScroll();
});

test('single-event storybook display shows one yellow title at a time and merges author snark in green',async()=>{
 const {selectVisibleMessage,resetMessageScroll}=await import('../dist/message-scroll.js');
 resetMessageScroll();
 const msgs=[
  {id:1,title:'完整備用車',text:'發現可以行駛的小車。'},
  {id:2,title:'作者吐槽',text:'（作者自言自語。）'},
  {id:3,title:'冒牌救援車',text:'路邊停著一輛可疑救護車。'}
 ];
 // Starts at first unread when prologue/stepping, or advances one event per tap
 const p1=selectVisibleMessage(msgs,{prologue:true});
 assert.equal(p1.current.id,1);
 assert.deepEqual(p1.current.authorNotes,['（作者自言自語。）']);
 assert.equal(p1.hasNext,true);
 assert.equal(advanceManualPage(null),'next');
 const p2=selectVisibleMessage(msgs,{prologue:true});
 assert.equal(p2.current.id,3);
 assert.equal(p2.hasNext,false);
 assert.equal(advanceManualPage(null),false);
 resetMessageScroll();

 const css=readFileSync(new URL('../dist/portrait-layout.css',import.meta.url),'utf8');
 assert(css.includes('strong.msg-title'));
 assert(css.includes('p.msg-body'));
 assert(css.includes('p.msg-author'));
});

test('morality system: rob, steal, charity, merchant full loot, GTA wanted radio/police, and saint pacification',async()=>{
 const {isWanted,isSaint,moralityLabel}=await import('../dist/morality-runtime.js');
 const g=fresh(919);
 assert.equal(g.s.morality,0);
 assert.equal(isWanted(g.s),false);
 assert.equal(isSaint(g.s),false);

 // 1. Charity raises morality
 g.s.mode='event';
 const beggar=g.person('human','scavenger');
 beggar.attitude='戒備';
 g.s.current={instance:1,event:{id:'R1',title:'路邊旅人',text:'遇到旅人。',options:[]},npc:beggar,dialogue:true,service:'npc_trade',begRequest:{kind:'scrap',amount:2,label:'2 份廢料',line:'「能施捨 2 份廢料嗎？」'}};
 assert(g.giveCharity());
 assert.equal(g.s.morality,14);
 assert.equal(beggar.attitude,'友善');

 // 2. High morality (>= 30) pacifies hostile NPCs instead of forcing combat
 g.changeMorality(20);
 assert(isSaint(g.s));
 assert.equal(moralityLabel(g.s.morality),'荒野聖人');
 const raider=g.person('mutant','soldier');
 raider.attitude='掠奪';
 g.s.current={instance:2,event:{id:'R2',title:'廢棄站',text:'有人在裡面。',options:[]},npc:raider,building:true,entered:false,dialogue:false};
 g.enterBuilding();
 assert.equal(g.s.mode,'event','Saint morality should pacify hostile NPC instead of auto-combat');
 assert.equal(g.s.current.dialogue,true);
 assert.equal(raider.sparedByReputation,true);

 // 3. Attacking a merchant lowers morality and winning loots ALL merchant stock
 const merch=g.person('alien','merchant');
 merch.attitude='友善';
 g.s.current={instance:3,event:{id:'R3',title:'荒野商攤',text:'商人擺著攤。',options:[]},npc:merch,dialogue:true,service:'general_shop'};
 const scrapBefore=g.s.resources.scrap,fuelBefore=g.availableFuel(),medBefore=g.s.resources.medicine,invBefore=g.s.inventory.length;
 g.attackCurrentNpc();
 assert.equal(g.s.mode,'combat');
 assert(g.s.battle.merchantLoot);
 assert(g.s.morality<30);
 g.s.battle.enemies.forEach(e=>e.hp=0);
 g.finishCombat(true);
 assert(g.s.resources.scrap>scrapBefore&&g.availableFuel()>fuelBefore&&g.s.resources.medicine>medBefore&&g.s.inventory.length>invBefore,'Defeating merchant should loot all merchant goods');

 // 4. Low morality (<= -30): GTA wanted radio news, friendly NPC shuns player, and police interception triggers
 g.changeMorality(-50);
 assert(isWanted(g.s));
 g.roll=()=>1;
 const radioText=g.ambient();
 assert(radioText.includes('通緝'),'Wanted player should hear GTA-style wanted radio breaking news');

 g.s.mode='event';
 const friendly=g.person('human','driver');
 friendly.attitude='友善';
 g.s.current={instance:4,event:{id:'R4',title:'休息點',text:'遇到旅人。',options:[]},npc:friendly,dialogue:true,service:'npc_trade'};
 g.talk();
 assert(g.s.notice.includes('通緝'),'Friendly NPC should refuse to chat with wanted player');

 g.s.frames=[{kind:'road',count:0,scene:null}];
 g.roll=()=>1;
 g.nextEvent();
 assert(['police_human','police_alien'].includes(g.s.current.event.id),'Wanted player should encounter human or alien police');

 const css=readFileSync(new URL('../dist/portrait-layout.css',import.meta.url),'utf8');
 assert(css.includes('msg-char-name')&&css.includes('msg-npc-name')&&css.includes('wanted-pill'));
});

test('every equipment, supplies, and vehicle reward across all D100 faces resolves without undefined',()=>{
 const g=fresh(101);
 for(let roll=1;roll<=100;roll++){
  g.roll=()=>roll;
  const eqText=g.rewardResult({op:'oracle',table:'equipment'});
  assert(!/undefined|null|NaN/i.test(eqText),`Bad equipment reward at roll ${roll}: ${eqText}`);
  const supText=g.rewardResult({op:'oracle',table:'supplies'});
  assert(!/undefined|null|NaN/i.test(supText),`Bad supplies reward at roll ${roll}: ${supText}`);
  const vehText=g.rewardResult({op:'oracle',table:'vehicle'});
  assert(!/undefined|null|NaN/i.test(vehText),`Bad vehicle reward at roll ${roll}: ${vehText}`);
 }
 assert(g.s.inventory.every(id=>typeof id==='string'&&id.length>0),'Inventory must never contain undefined');
});
