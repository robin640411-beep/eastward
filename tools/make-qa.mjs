// Local preview fixtures. Generated qa.html must not be packaged for release.
import {readFileSync,writeFileSync} from 'node:fs';
import {Game} from '../dist/engine.js';
const read=p=>JSON.parse(readFileSync(new URL('../dist/'+p,import.meta.url)));
const d={assets:read('assets/manifest.json'),catalog:read('data/npc-catalog.json'),oracles:read('data/oracles.json'),events:read('data/events.json'),buildings:read('data/building-events.json'),traits:read('data/traits.json')};
const states={};function fresh(){const g=new Game(d);g.start({seed:445,race:'human',profession:'driver'});return g}
let g=fresh();g.s.vehicle={model:'bus',hp:55,maxHp:55,mods:['seat','seat','seat']};for(let i=1;i<11;i++)g.s.party.push(g.person(d.catalog.races[i].id,d.catalog.professions[i].id));states['11 人車窗']=g.s;
g=fresh();g.s.vehicle={model:'sedan',hp:30,maxHp:30,mods:['gun']};g.s.party.push(g.person('alien','medic'));g.beginCombat('vehicle');states['雙人車戰']=g.s;
g=fresh();g.s.progress=99;states['抵達綠洲']=g.s;
g=fresh();g.s.resources.fuel=0;g.s.mode='event';g.s.strandedSearch=true;g.s.current={event:{title:'尋找出路',text:'附近沒有剩餘汽油，也找不到能行駛的車。',options:[]},resolved:false};states['缺油結局']=g.s;
g=fresh();g.actor().hp=1;g.beginCombat();g.s.battle.enemies.forEach(e=>{e.attack=100;e.speed=100});states['全滅結局']=g.s;
writeFileSync(new URL('../dist/qa.html',import.meta.url),`<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>一路向東測試情境</title><style>body{background:#14232d;color:#eee;font:18px sans-serif;padding:24px}button{display:block;margin:18px 0;padding:18px;width:100%}</style><h1>本機測試情境</h1><p>載入固定測試存檔，再按「繼續旅程」。</p><div id="cases"></div><script>const states=${JSON.stringify(states).replaceAll('<','\\u003c')};for(const [name,state] of Object.entries(states)){const b=document.createElement('button');b.textContent=name;b.onclick=()=>{localStorage.setItem('eastward.save.v1',JSON.stringify(state));location.href='./'};document.querySelector('#cases').append(b)}</script></html>`);
