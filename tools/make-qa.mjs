// Local preview fixtures. Generated qa.html must not be packaged for release.
import {readFileSync,writeFileSync} from 'node:fs';
import {Game} from '../dist/engine.js';
import {setLevel} from '../dist/progression-runtime.js';
import {STARTER_VEHICLES,starterVehicle} from '../dist/vehicle-runtime.js';
import {GROWTH} from '../dist/progression-catalog.js';
import {createRoute,nameEncounter,BIOMES} from '../dist/route-runtime.js';
const read=p=>JSON.parse(readFileSync(new URL('../dist/'+p,import.meta.url)));
const d={assets:read('assets/manifest.json'),catalog:read('data/npc-catalog.json'),oracles:read('data/oracles.json'),events:read('data/events.json'),buildings:read('data/building-events.json'),traits:read('data/traits.json')};
const states={};function fresh(){const g=new Game(d);g.start({seed:445,race:'human',profession:'driver'});return g}
let g=fresh();g.s.vehicle={model:'bus',hp:55,maxHp:55,mods:['seat','seat','seat']};for(let i=1;i<4;i++)g.s.party.push(g.person(d.catalog.races[i].id,d.catalog.professions[i].id));states['4 人車窗']=g.s;
g=fresh();g.s.vehicle={model:'sedan',hp:30,maxHp:30,mods:['gun']};g.s.party.push(g.person('alien','medic'));g.beginCombat('vehicle');states['雙人車戰']=g.s;
g=fresh();g.s.progress=99;states['抵達綠洲']=g.s;
g=fresh();g.s.resources.fuel=0;g.s.mode='event';g.s.strandedSearch=true;g.s.current={event:{title:'尋找出路',text:'附近沒有剩餘汽油，也找不到能行駛的車。',options:[]},resolved:false};states['缺油結局']=g.s;
g=fresh();g.actor().hp=1;g.beginCombat();g.s.battle.enemies.forEach(e=>{e.attack=100;e.speed=100});states['全滅結局']=g.s;
for(const [label,id] of [['加油站停靠','road_001'],['斷橋','road_056'],['燃燒油槽','road_082'],['建築塌陷','building_046'],['怪物巢穴','building_066']]){g=fresh();const interior=id.startsWith('building');g.s.mode='event';g.s.frames=[{kind:interior?'building':'road',count:1,scene:interior?'warehouse':null}];g.s.current={instance:7,event:structuredClone((interior?d.buildings:d.events).events.find(e=>e.id===id)),resolved:false,building:id==='road_001',npc:null,inside:false};states[label]=g.s;}
for(const [label,id,minutes] of [['鹽原白天','salt',720],['峽谷黃昏','canyon',1080],['森林夜晚','forest',1320],['海岸清晨','coast',360],['佔領城市','city',720],['異星侵蝕','alien',960],['雪原','snow',720]]){g=fresh();g.s.route=createRoute(0,sides=>sides===12?BIOMES.findIndex(b=>b.id===id)+1:1);g.s.minutes=minutes;states[label]=g.s;}
g=fresh();g.s.vehicle={model:'sedan',hp:30,maxHp:30,mods:[]};g.actor().level=5;g.s.party.push(g.person('alien','medic'));g.s.party[1].level=5;g.s.party[0].hp=10;g.s.party[1].hp=12;g.beginCombat();g.s.battle.enemies.forEach(e=>{e.hp=e.maxHp=100;e.attack=2});states['雙人角色戰鬥']=g.s;
for(const [label,minutes] of [['行車接近事件',720],['夕陽入夜行車',1110]]){for(let seed=1;seed<2000;seed++){g=fresh();g.s.rng=seed;g.s.seed=0;g.s.minutes=minutes;g.depart();const preview=g.previewArrival();if(preview.current?.event.id==='road_001'){states[label]=g.s;break;}}}
g=fresh();g.s.vehicle={model:'van',hp:40,maxHp:40,mods:[]};g.s.party.push(g.person('alien','medic'));g.s.party[1].level=5;g.s.party[1].gear.配件='charm';g.s.inventory=['pistol','vest','tools','charm','pistol'];states['裝備與同伴比較']=g.s;
g=fresh();g.s.mode='event';g.s.frames=[{kind:'road',count:1}];g.s.current={event:{id:'road_003',title:'路邊商店',text:'查看商品並比較裝備。',options:[]},dialogue:true,service:'equipment_shop',npc:g.person(),resolved:false};g.s.current.npc.attitude='友善';g.s.resources.scrap=30;states['商店裝備比較']=g.s;
g=fresh();g.s.mode='event';g.s.frames=[{kind:'road',count:4}];g.s.current={event:{id:'road_011',title:'路旁的行李箱',text:'箱底的藥品已收進背包。該上路了。',options:[]},resolved:false,frame:'road'};states['停靠後直接上路']=g.s;
// Real engine fixtures for the occupation dialogue and recruitment cap.
let topicSeed=1;for(let seed=1;seed<10000;seed++){g=fresh();g.s.rng=seed;if(g.roll()===71){topicSeed=seed;break;}}
for(const attitude of ['友善','同情','戒備','冷淡']){g=fresh();g.s.vehicle.model='van';g.s.mode='event';g.s.frames=[{kind:'road',count:1}];const npc=g.person('human','historian');npc.attitude=attitude;g.s.current={event:{id:'road_014',title:'休息的旅人',text:'一位旅人坐在公路旁，身邊放著舊收音機。',options:[]},npc,dialogue:true,service:'npc_trade',frame:'road'};g.s.notice=g.s.current.event.text;g.s.rng=topicSeed;states['十年口述 · '+attitude]=g.s;}
g=fresh();g.s.vehicle={model:'bus',hp:55,maxHp:55,mods:['seat']};for(let i=1;i<4;i++)g.s.party.push(g.person(d.catalog.races[i].id,d.catalog.professions[i].id));g.s.mode='event';g.s.frames=[{kind:'road',count:1}];g.s.current={event:{id:'road_014',title:'想同行的旅人',text:'有人看見車上的空位，詢問能否一起往東。',options:[]},npc:g.person(),dialogue:true,service:'npc_trade',frame:'road'};g.s.current.npc.attitude='友善';g.s.notice=g.s.current.event.text;states['四人隊伍拒絕第五人']=g.s;
g=fresh();g.s.vehicle.model='bus';for(let i=0;i<4;i++)g.s.party.push(g.person());delete g.s.protagonistId;states['舊存檔五人隊伍']=g.s;
for(const kind of ['companions','solo','radio']){for(let seed=1;seed<2000;seed++){g=fresh();g.s.vehicle.model='van';if(kind==='companions')g.s.party.push(g.person('alien','medic'));g.s.rng=seed;g.depart();if(g.s.travel?.voices.kind===kind){states[{'companions':'行車同伴閒聊','solo':'行車自言自語','radio':'行車電台報導'}[kind]]=g.s;break;}}}
for(const [label,race,profession,focus] of [['外星人醫護 · 樂園願望','alien','medic','paradise'],['變種人技師 · 樂園願望','mutant','mechanic','paradise'],['外星人醫護 · 種族閒聊','alien','medic','race'],['外星人醫護 · 職業閒聊','alien','medic','profession']]){for(let seed=1;seed<2000;seed++){g=fresh();g.s.vehicle.model='van';g.s.party.push(g.person(race,profession));g.s.rng=seed;g.depart();if(g.s.travel?.voices.kind==='companions'&&g.s.travel.voices.focus===focus){states[label]=g.s;break;}}}

for(const [label,from,to] of [['森林 → 都市 · 區段過渡','forest','city'],['峽谷 → 海岸 · 區段過渡','canyon','coast'],['森林 → 森林 · 新地名','forest','forest']]){
 let worldSeed=1;while(worldSeed<10000){const route=createRoute(worldSeed);if(route.regions[0].id===from&&route.regions[1].id===to)break;worldSeed++;}
 for(let rng=1;rng<1000;rng++){g=new Game(d);g.start({seed:worldSeed});g.s.progress=6;g.s.rng=rng;g.depart();if(g.s.travel?.n===10){states[label]=g.s;break;}}
}
g=fresh();g.s.mode='event';g.s.frames=[{kind:'road',count:1}];g.s.current={instance:19,event:structuredClone(d.events.events.find(e=>e.id==='road_001')),building:true,npc:null,resolved:false};g.s.notice=g.s.current.event.text;nameEncounter(g.s);states['D100 店名 · 加油站']=g.s;


for(const boss of GROWTH.bosses){g=fresh();g.s.vehicle.model='van';g.s.party.push(g.person('alien','medic'));g.s.party.forEach(p=>{setLevel(p,17);p.gear={武器:'pistol',防具:'vest',配件:'charm'};});g.s.progress=100;g.s.finalBoss.id=boss.id;g.beginFinale();states['最終魔王 · '+boss.name]=g.s;}
g=fresh();g.s.vehicle.model='van';g.s.party.push(g.person('alien','medic'));g.s.party.forEach(p=>setLevel(p,2));g.s.stop=1;g.s.mode='event';g.s.frames=[{kind:'road',count:4}];g.s.current={instance:19,event:{id:'road_011',title:'搜尋完成',text:'這次停靠的最後一個事件已經結束。',options:[]},resolved:false};states['完成事件 · 全隊升級']=g.s;
for(const progress of [1,91]){for(let seed=1;seed<100;seed++){g=fresh();g.s.progress=progress;g.s.rng=seed;g.beginCombat();if(g.s.battle.enemies.length===3){states['三隻敵人 · 路段 '+progress]=g.s;break;}}}
g=fresh();setLevel(g.actor(),3);g.s.vehicle.model='van';g.s.mode='event';g.s.current={instance:27,event:{id:'road_014',title:'等待同行的旅人',text:'旅人已經準備好自己的裝備。',options:[]},npc:g.person('mutant','mechanic'),dialogue:true,resolved:false};g.s.current.npc.attitude='友善';states['三級主角 · 邀請同伴']=g.s;
for(let seed=1;seed<1000;seed++){g=fresh();g.s.vehicle.model='van';g.s.party.push(g.person('alien','medic'));g.s.rng=seed;g.depart();if(g.s.travel?.voices.focus==='boss'){states['同伴 · 魔王傳聞']=g.s;break;}}
g=fresh();g.s.progress=100;setLevel(g.actor(),17);g.beginFinale();g.s.battle.enemies[0].hp=1;g.s.battle.enemies[0].speed=0;states['魔王最後一擊 · 抵達樂園']=g.s;
g=fresh();g.s.mode='event';g.s.current={instance:38,event:{id:'road_014',title:'東行旅人',text:'一位旅人提起東方入口的事情。',options:[]},npc:g.person('human','historian'),dialogue:true,resolved:false};g.s.current.npc.attitude='戒備';for(let seed=1;seed<1000;seed++){const candidate=new Game(d,structuredClone(g.s));candidate.s.rng=seed;candidate.talk();if(candidate.s.bossRumors.length){states['NPC · 魔王傳聞']=candidate.s;break;}}

g=fresh();states['出發前 · 一千公里']=g.s;
for(let seed=1;seed<2000;seed++){g=fresh();g.s.vehicle.model='van';for(const [race,job] of [['alien','medic'],['mutant','mechanic'],['human','historian']])g.s.party.push(g.person(race,job));g.s.party.forEach(p=>setLevel(p,2));g.completeStop('qa:four');g.s.rng=seed;g.depart();if(g.s.travel?.voices.kind==='companions'){states['四人行車 · 對話與升級']=g.s;break;}}
g=fresh();g.s.progress=100;g.beginFinale();states['樂園入口 · 零公里']=g.s;

states['隨機人物 · 全新旅程']=null;
for(const st of [0,4,5]){g=fresh();g.driver().st=st;states['自動行車 · 體力 '+st]=g.s;}
g=fresh();g.s.vehicle.model='van';g.driver().st=3;g.s.party.push(g.person('alien','medic'));g.s.party[1].st=18;states['疲勞 · 換人駕駛']=g.s;
g=fresh();g.s.vehicle.model='van';g.s.party.push(g.person('alien','medic'));g.s.party.forEach(p=>p.st=0);states['全員耗盡 · 休息']=g.s;
g=fresh();g.driver().st=4;for(let seed=1;seed<100;seed++){const candidate=new Game(d,structuredClone(g.s));candidate.s.rng=seed;if(candidate.roll()>30){g.s.rng=seed;break;}}states['疲勞 · 平安睡眠']=g.s;

for(const biome of BIOMES){g=fresh();if(biome.id==='city')g.s.seed=90;g.s.route=createRoute(445,sides=>sides===12?BIOMES.findIndex(b=>b.id===biome.id)+1:1);g.s.minutes=720;g.s.vehicle.model='van';g.s.party.push(g.person('alien','medic'));g.depart();g.s.travel.preview={current:null,battle:null};states['沿途景物 · '+biome.name]=g.s;}

// Player-facing random opening and each starting vehicle. Local fixtures only.
for(const c of STARTER_VEHICLES){g=fresh();g.startRandom(42);g.s.vehicle=starterVehicle(c.roll);g.s.startingVehicleRoll=c.roll;g.s.resources.fuel=c.fuel;states['開場與座駕 · '+c.name]=g.s;}
g=fresh();g.startRandom(42);while(g.s.mode==='prologue')g.advancePrologue();g.s.vehicle=starterVehicle(7);g.s.resources.fuel=22;g.s.resources.scrap=60;g.s.mode='event';g.s.frames=[{kind:'road',count:1}];g.s.current={instance:14,event:{id:'road_004',title:'修車廠',text:'修車師傅把四種改裝的報價寫在工作臺上。',options:[]},dialogue:true,service:'garage',inside:true,explored:true,npc:g.person()};g.s.current.npc.attitude='友善';states['修車廠 · 四種改裝']=g.s;
g=fresh();g.startRandom(42);while(g.s.mode==='prologue')g.advancePrologue();g.s.vehicle=starterVehicle(4);g.s.mode='event';g.s.frames=[{kind:'road',count:1}];g.s.current={instance:22,event:{id:'road_014',title:'第一位同伴',text:'旅人望向車內的另一個空位，詢問能否一起向東。',options:[]},dialogue:true,service:'npc_trade',npc:g.person('alien','medic')};g.s.current.npc.attitude='友善';states['雙座起步 · 第一位同伴']=g.s;

// Weather uses real presentation and separate visual seeds, never combat rolls.
for(const [label,biome,id] of [['暴雨與雷擊 · 隨機閃電','city','road_100'],['天氣 · 森林飄葉','forest','road_014'],['天氣 · 綠丘花瓣','oasis','road_014'],['天氣 · 雪山降雪','snow','road_014'],['天氣 · 海岸細雨','coast','road_014']]){g=fresh();g.s.route=createRoute(445,sides=>sides===12?BIOMES.findIndex(b=>b.id===biome)+1:1);g.s.mode='event';g.s.frames=[{kind:'road',count:1}];g.s.current={instance:100,event:structuredClone(d.events.events.find(e=>e.id===id)),resolved:false};states[label]=g.s;}

// Deterministic real-combat fixtures for fixed formation and weapon effects.
for(const [label,race,weapon,enemy] of [['單人四格 · 球棒','human','club','hound'],['單人四格 · 手槍','human','pistol','soldier'],['超能力 · 晶族','crystal','club','worker'],['超能力 · 潮生族','amphibian','club','crawler'],['超能力 · 蕈人','mycelial','club','swarm']]){g=fresh();g.actor().race=race;setLevel(g.actor(),5);g.actor().gear.武器=weapon;g.actor().hp=g.actor().maxHp=100;g.actor().esp=g.actor().maxEsp=100;g.beginCombat();const e=g.s.battle.enemies[0];Object.assign(e,{key:enemy,name:d.assets.enemies[enemy].name,hp:100,maxHp:100,speed:0,attack:1});delete e.attackStyle;g.s.battle.enemies=[e];g.s.rng=14;states[label]=g.s;}
g=fresh();setLevel(g.actor(),5);g.actor().hp=g.actor().maxHp=100;g.beginCombat();const first=g.s.battle.enemies[0];g.s.battle.enemies=['hound','soldier','crawler'].map((key,i)=>({...structuredClone(first),id:'e'+i,key,name:d.assets.enemies[key].name,hp:i===1?1:100,maxHp:100,speed:0,attack:1,attackStyle:undefined}));g.s.rng=14;states['三敵固定站位 · 擊倒中央']=g.s;
g=fresh();g.s.vehicle.model='van';for(const [race,job] of [['alien','medic'],['crystal','mechanic'],['amphibian','historian']])g.s.party.push(g.person(race,job));g.s.party.forEach(p=>{setLevel(p,5);p.hp=p.maxHp=100;p.esp=p.maxEsp=100;});g.beginCombat();g.s.battle.enemies.forEach(e=>{e.hp=e.maxHp=500;e.speed=0;e.attack=1;});states['四人四格 · 輪流出手']=g.s;

writeFileSync(new URL('../dist/qa.html',import.meta.url),`<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>一路向東測試情境</title><style>body{background:#14232d;color:#eee;font:18px sans-serif;padding:24px}button{display:block;margin:18px 0;padding:18px;width:100%}</style><h1>本機測試情境</h1><p>載入固定測試存檔，再按「繼續旅程」。</p><div id="cases"></div><script>const states=${JSON.stringify(states).replaceAll('<','\\u003c')};for(const [name,state] of Object.entries(states)){const b=document.createElement('button');b.textContent=name;b.onclick=()=>{localStorage.setItem('eastward.save.v1',JSON.stringify(state));location.href='./'};document.querySelector('#cases').append(b)}</script></html>`);
